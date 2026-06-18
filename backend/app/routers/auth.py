from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginRequest, UserCreate, UserOut
from app.security import get_current_user
from app.services.auth_service import login_user, logout_user, register_user


router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return register_user(
        db,
        username=payload.username,
        email=str(payload.email),
        password=payload.password,
        display_name=payload.display_name,
    )


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    return login_user(db, request, response, payload.username, payload.password)


@router.post("/logout")
def logout(
    response: Response,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    logout_user(db, response, session_id)
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me(user=Depends(get_current_user)):
    return user
