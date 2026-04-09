from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ВАЖНО: если Postgres из docker-compose:
# user=typingking pass=typingking db=typingking port=5433
DATABASE_URL = "postgresql+psycopg://typingking:typingking@localhost:5433/typingking"


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
