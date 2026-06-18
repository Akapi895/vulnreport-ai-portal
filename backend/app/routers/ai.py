from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AiResponse, ChatRequest, CveRequest
from app.security import get_current_user
from app.services.agent_service import chat, summarize_cve


router = APIRouter()


@router.post("/chat", response_model=AiResponse)
def ai_chat(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return chat(db, user, payload.prompt, request.headers)


@router.post("/summarize-cve", response_model=AiResponse)
def summarize(
    payload: CveRequest,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return summarize_cve(db, user, payload.cve_id, payload.prompt, request.headers)
