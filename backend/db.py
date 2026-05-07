import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

LOCAL_DATABASE_URL = "postgresql+psycopg://typingking:typingking@localhost:5433/typingking"

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if os.getenv("FLY_APP_NAME"):
        raise RuntimeError("DATABASE_URL is not set. Attach a Fly Postgres database first.")
    DATABASE_URL = LOCAL_DATABASE_URL

DB_ISOLATION_LEVEL = os.getenv("DB_ISOLATION_LEVEL", "READ COMMITTED")


engine = create_engine(DATABASE_URL, pool_pre_ping=True, isolation_level=DB_ISOLATION_LEVEL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        # Если запрос упал после изменений БД, rollback сохраняет ACID-поведение.
        db.rollback()
        raise
    finally:
        db.close()
