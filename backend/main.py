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

app = FastAPI(title="Typing King API")

DEFAULT_CORS_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost|127\.0\.0\.1|0\.0\.0\.0|"
    r"192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+"
    r")(:\d+)?$"
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173",
    ).split(",")
    if origin.strip()
]
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", DEFAULT_CORS_ORIGIN_REGEX)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

def require_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
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
        "modes": [30, 60, 120],
        "languages": ["EN", "RU", "LV"],
        "default_mode": 60,
        "default_language": "EN",
    }

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    # уникальность username/email
    exists = db.execute(select(User).where((User.username == data.username) | (User.email == data.email))).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.username == data.username)).scalar_one_or_none()
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
    if data.mode_seconds not in (30, 60, 120):
        raise HTTPException(status_code=400, detail="Invalid mode_seconds")
    if data.language not in ("EN", "RU", "LV"):
        raise HTTPException(status_code=400, detail="Invalid language")

    r = Result(
        user_id=user.id,
        mode_seconds=data.mode_seconds,
        language=data.language,
        wpm=float(data.wpm),
        accuracy=float(data.accuracy),
        errors=int(data.errors),
        total_chars=int(data.total_chars),
        correct_chars=int(data.correct_chars),
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@app.get("/api/leaderboard", response_model=LeaderboardOut)
def leaderboard(mode_seconds: int = 60, language: str = "EN", limit: int = 20, db: Session = Depends(get_db)):
    if mode_seconds not in (30, 60, 120):
        raise HTTPException(status_code=400, detail="Invalid mode_seconds")
    if language not in ("EN", "RU", "LV"):
        raise HTTPException(status_code=400, detail="Invalid language")
    limit = max(1, min(limit, 100))

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
