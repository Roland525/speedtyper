from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base

def _now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    # Primary key и unique indexes помогают быстро находить пользователя при login.
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    results = relationship("Result", back_populates="user")

class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        CheckConstraint("mode_seconds IN (15, 30, 60, 120)", name="ck_results_mode"),
        CheckConstraint("language IN ('EN', 'RU', 'LV')", name="ck_results_language"),
        CheckConstraint("wpm >= 0 AND accuracy >= 0 AND accuracy <= 100", name="ck_results_stats"),
        Index("ix_results_leaderboard", "mode_seconds", "language", "wpm", "accuracy", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Foreign key нормализует БД: данные пользователя хранятся один раз в users.
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)

    mode_seconds: Mapped[int] = mapped_column(Integer)
    language: Mapped[str] = mapped_column(String(2))

    wpm: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float] = mapped_column(Float)
    errors: Mapped[int] = mapped_column(Integer)
    total_chars: Mapped[int] = mapped_column(Integer)
    correct_chars: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="results")
