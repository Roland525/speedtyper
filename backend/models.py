from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    results = relationship("Result", back_populates="user")

class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        UniqueConstraint("id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)

    mode_seconds: Mapped[int] = mapped_column(Integer)     # 30/60/120
    language: Mapped[str] = mapped_column(String(2))       # EN/RU/LV

    wpm: Mapped[float] = mapped_column(Float)
    accuracy: Mapped[float] = mapped_column(Float)
    errors: Mapped[int] = mapped_column(Integer)
    total_chars: Mapped[int] = mapped_column(Integer)
    correct_chars: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="results")
