from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.auth import decode_access_token

# Bearer token scheme for FastAPI Swagger & security
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to extract and validate the JWT Bearer token from the request header.
    Returns the authenticated User model instance.
    Raises 401 Unauthorized if token is missing, expired, or invalid.
    """
    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise unauthorized_exception

    user_id = payload.get("sub") or payload.get("user_id")
    if user_id is None:
        raise unauthorized_exception

    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise unauthorized_exception

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise unauthorized_exception

    return user
