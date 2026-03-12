from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt, JWTError

SECRET_KEY = "CHANGE_ME_SUPER_SECRET"  # потом поменяешь
ALGORITHM = "HS256"
ACCESS_TOKEN_MIN = 30
REFRESH_TOKEN_DAYS = 14

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False

def create_access_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_MIN)
    payload = {"sub": str(user_id), "type": "access", "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: int) -> str:
    exp = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    payload = {"sub": str(user_id), "type": "refresh", "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str, token_type: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return int(payload.get("sub"))
    except (JWTError, ValueError):
        return None
