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
from auth import hash_password, verify_password, create_access_token, decode_token

MODES = (15, 30, 60, 120)
LANGUAGES = ("EN", "RU", "LV")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Эта функция запускается при старте FastAPI.
    # Она создает таблицы, если их еще нет в PostgreSQL.
    # Для учебного проекта create_all достаточно; в production обычно используют migrations.
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Typing King API", lifespan=lifespan)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

cors_from_env = os.getenv("CORS_ORIGINS")
if cors_from_env:
    # Если origins указаны в .env, берем их оттуда.
    cors_origins = [origin.strip() for origin in cors_from_env.split(",") if origin.strip()]
else:
    # Иначе разрешаем локальный frontend.
    cors_origins = DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    # Самый простой endpoint для проверки, что backend запущен.
    return {"status": "ok"}

def validate_game_params(mode_seconds: int, language: str):
    # Backend не доверяет frontend и сам проверяет режим игры и язык.
    if mode_seconds not in MODES:
        raise HTTPException(status_code=400, detail="Invalid mode_seconds")
    if language not in LANGUAGES:
        raise HTTPException(status_code=400, detail="Invalid language")

def require_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    # Эта функция используется в защищенных endpoints.
    # Она достает JWT token из Authorization header и находит пользователя в базе.
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
    # Frontend может получить доступные режимы и языки с backend.
    return {
        "modes": MODES,
        "languages": LANGUAGES,
        "default_mode": 30,
        "default_language": "EN",
    }

@app.post("/api/auth/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    # Сначала проверяем, нет ли уже такого username или email.
    existing_user = db.execute(
        select(User).where((User.username == data.username) | (User.email == data.email))
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = User(
        # Пароль не сохраняется как обычный текст, сохраняется только hash.
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
    # Ищем пользователя по username и проверяем пароль через bcrypt.
    user = db.execute(select(User).where(User.username == data.username)).scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return TokenOut(
        access_token=create_access_token(user.id),
    )

@app.get("/api/users/me", response_model=UserOut)
def me(user: User = Depends(require_user)):
    # Если token правильный, require_user вернет текущего пользователя.
    return user

@app.post("/api/results", response_model=ResultOut, status_code=201)
def save_result(data: ResultIn, db: Session = Depends(get_db), user: User = Depends(require_user)):
    # Сохраняем результат только для авторизованного пользователя.
    validate_game_params(data.mode_seconds, data.language)

    result = Result(
        user_id=user.id,
        mode_seconds=data.mode_seconds,
        language=data.language,
        wpm=data.wpm,
        accuracy=data.accuracy,
        errors=data.errors,
        total_chars=data.total_chars,
        correct_chars=data.correct_chars,
    )

    db.add(result)
    db.commit()
    db.refresh(result)
    return result

@app.get("/api/leaderboard", response_model=LeaderboardOut)
def leaderboard(mode_seconds: int = 30, language: str = "EN", limit: int = 20, db: Session = Depends(get_db)):
    # Leaderboard фильтруется по режиму игры и языку.
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

    top = []
    for username, wpm, accuracy, created_at in rows:
        # Превращаем строки из базы в обычный список словарей для JSON ответа.
        top.append({
            "username": username,
            "wpm": wpm,
            "accuracy": accuracy,
            "created_at": created_at,
        })

    return {
        "mode_seconds": mode_seconds,
        "language": language,
        "top": top,
    }
