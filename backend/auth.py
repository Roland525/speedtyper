from datetime import datetime, timedelta, timezone
import os
from typing import Optional

import bcrypt
from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_MIN = 30

def hash_password(password: str) -> str:
    # Пароль нельзя хранить в базе как обычный текст.
    # bcrypt превращает пароль в hash, который безопаснее хранить.
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    # При login сравниваем введенный пароль с hash из базы.
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False

def create_token(user_id: int, token_type: str, expires_in: timedelta) -> str:
    # JWT token хранит id пользователя, тип token и срок действия.
    # Потом backend может проверить token без отдельной таблицы сессий.
    expires_at = datetime.now(timezone.utc) + expires_in
    data = {"sub": str(user_id), "type": token_type, "exp": expires_at}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(user_id: int) -> str:
    # Access token используется для обычных защищенных запросов.
    return create_token(user_id, "access", timedelta(minutes=ACCESS_TOKEN_MIN))

def decode_token(token: str, token_type: str) -> Optional[int]:
    # Проверяем подпись JWT, срок действия и тип token.
    # Если token правильный, возвращаем user_id.
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return int(payload.get("sub"))
    except (JWTError, ValueError):
        return None
