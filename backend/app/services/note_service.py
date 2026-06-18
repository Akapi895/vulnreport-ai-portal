from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PrivateNote, User
from app.schemas import NoteCreate


def create_note(db: Session, owner: User, payload: NoteCreate) -> PrivateNote:
    note = PrivateNote(owner_id=owner.id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_my_notes(db: Session, owner: User) -> list[PrivateNote]:
    return db.query(PrivateNote).filter(PrivateNote.owner_id == owner.id).order_by(PrivateNote.id.desc()).all()


def get_note(db: Session, owner: User, note_id: int) -> PrivateNote:
    query = db.query(PrivateNote).filter(PrivateNote.id == note_id)
    if not (settings.lab_mode and settings.enable_vuln_note_idor):
        query = query.filter(PrivateNote.owner_id == owner.id)
    note = query.first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note
