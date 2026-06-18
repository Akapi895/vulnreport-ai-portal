import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import LogAction, Session as UserSession
from app.models import User, UserRole
from app.security import hash_password, verify_password
from app.services.audit_service import log_ai_event


def register_user(db: Session, username: str, email: str, password: str, display_name: str | None):
    existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.user,
        display_name=display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, request: Request, response: Response, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.session_days)
    session = UserSession(
        user_id=user.id,
        session_id=token,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=expires_at,
    )
    user.last_login_at = datetime.utcnow()
    db.add(session)
    db.commit()
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        samesite="lax",
        max_age=settings.session_days * 24 * 60 * 60,
    )
    log_ai_event(db, action=LogAction.login, user_id=user.id, response="login ok")
    return user


def logout_user(db: Session, response: Response, session_id: str | None) -> None:
    if session_id:
        db.query(UserSession).filter(UserSession.session_id == session_id).delete()
        db.commit()
    response.delete_cookie(settings.session_cookie_name)
