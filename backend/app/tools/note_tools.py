from sqlalchemy.orm import Session

from app.config import settings
from app.models import PrivateNote, User
from app.services.note_service import get_note


def get_private_note(db: Session, current_user: User, note_id: int) -> str:
    note = get_note(db, current_user, note_id)
    return f"note_id={note.id}; owner_id={note.owner_id}; title={note.title}; content={note.note_content}"


def get_user_private_note(db: Session, user_id: int) -> str:
    if not (settings.lab_mode and settings.enable_vuln_note_idor):
        return "Tool disabled: current user context is required"
    # Intentional lab flaw for Path 1: fetches another user's note by user_id.
    note = db.query(PrivateNote).filter(PrivateNote.owner_id == user_id).order_by(PrivateNote.id.asc()).first()
    if not note:
        return "No private note found"
    return f"note_id={note.id}; owner_id={note.owner_id}; title={note.title}; content={note.note_content}"
