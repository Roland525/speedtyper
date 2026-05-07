from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from db import engine, Base, get_db
from models import User, Result
from schemas import (
    RegisterIn, LoginIn, TokenOut, UserOut,
    ResultIn, ResultOut, LeaderboardOut
)
from auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token

MODES = (15, 30, 60, 120)
LANGUAGES = ("EN", "RU", "LV")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Для учебного проекта create_all достаточно; в production обычно используют migrations.
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Typing King API", lifespan=lifespan)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://webproject.id.lv",
]

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS)).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

def validate_game_params(mode_seconds: int, language: str):
    if mode_seconds not in MODES:
        raise HTTPException(status_code=400, detail="Invalid mode_seconds")
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Invalid language")

def save_and_refresh(db: Session, item):
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def find_user_by_username(db: Session, username: str):
    return db.execute(select(User).where(User.username == username)).scalar_one_or_none()

def username_or_email_exists(db: Session, username: str, email: str) -> bool:
    user = db.execute(
        select(User).where((User.username == username) | (User.email == email))
    ).scalar_one_or_none()
    return user is not None

def make_result(data: ResultIn, user_id: int) -> Result:
    return Result(
        user_id=user_id,
        mode_seconds=data.mode_seconds,
        language=data.language,
        wpm=float(data.wpm),
        accuracy=float(data.accuracy),
        errors=int(data.errors),
        total_chars=int(data.total_chars),
        correct_chars=int(data.correct_chars),
    )

def require_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    # Защищенные REST endpoints получают JWT через Authorization: Bearer.
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_token(token, "access")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/api/game/config")
def game_config():
    return {
        "modes": MODES,
        "languages": LANGUAGES,
        "default_mode": 30,
        "default_language": "EN",
    }

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if username_or_email_exists(db, data.username, data.email):
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    return save_and_refresh(db, user)

@app.post("/api/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = find_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return TokenOut(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

@app.get("/api/users/me", response_model=UserOut)
def me(user: User = Depends(require_user)):
    return user

@app.post("/api/results", response_model=ResultOut, status_code=201)
def save_result(data: ResultIn, db: Session = Depends(get_db), user: User = Depends(require_user)):
    validate_game_params(data.mode_seconds, data.language)
    result = make_result(data, user.id)
    return save_and_refresh(db, result)

@app.get("/api/leaderboard", response_model=LeaderboardOut)
def leaderboard(mode_seconds: int = 30, language: str = "EN", limit: int = 20, db: Session = Depends(get_db)):
    validate_game_params(mode_seconds, language)
    limit = max(1, min(limit, 100))

    # SQLAlchemy строит parameterized SQL, поэтому риск SQL injection ниже.
    rows = db.execute(
        select(User.username, Result.wpm, Result.accuracy, Result.created_at)
        .join(Result, Result.user_id == User.id)
        .where(Result.mode_seconds == mode_seconds, Result.language == language)
        .order_by(desc(Result.wpm), desc(Result.accuracy), desc(Result.created_at))
        .limit(limit)
    ).all()

    return {
        "mode_seconds": mode_seconds,
        "language": language,
        "top": [
            {"username": u, "wpm": w, "accuracy": a, "created_at": c}
            for (u, w, a, c) in rows
        ],
    }
