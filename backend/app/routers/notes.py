from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import NoteCreate, NoteOut
from app.security import get_current_user
from app.services.note_service import create_note, get_note, list_my_notes


router = APIRouter()


@router.post("", response_model=NoteOut)
def create(payload: NoteCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return create_note(db, user, payload)


@router.get("", response_model=list[NoteOut])
def list_notes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return list_my_notes(db, user)


@router.get("/{note_id}", response_model=NoteOut)
def view_note(note_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return get_note(db, user, note_id)
