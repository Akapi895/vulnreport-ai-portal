from sqlalchemy.orm import Session

from app.config import settings
from app.models import PrivateNote, User
from app.services.note_service import get_note


def get_private_note(db: Session, current_user: User, note_id: int) -> str:
    note = get_note(db, current_user, note_id)
    return f"note_id={note.id}; owner_id={note.owner_id}; title={note.title}; content={note.note_content}"


def list_my_private_notes(db: Session, current_user: User) -> str:
    notes = (
        db.query(PrivateNote)
        .filter(PrivateNote.owner_id == current_user.id)
        .order_by(PrivateNote.id.desc())
        .all()
    )
    if not notes:
        return "No private notes found for current user"
    return "\n".join(
        f"note_id={note.id}; title={note.title}; content={note.note_content}"
        for note in notes
    )


def get_user_private_note(db: Session, user_id: int) -> str:
    if not (settings.lab_mode and settings.enable_vuln_note_idor):
        return "Tool disabled: current user context is required"
    # Intentional lab flaw for Path 1: fetches another user's note by user_id.
    note = db.query(PrivateNote).filter(PrivateNote.owner_id == user_id).order_by(PrivateNote.id.asc()).first()
    if not note:
        return "No private note found"
    return f"note_id={note.id}; owner_id={note.owner_id}; title={note.title}; content={note.note_content}"


def get_user_private_notes_by_username(db: Session, username: str) -> str:
    if not (settings.lab_mode and settings.enable_vuln_note_idor):
        return "Tool disabled: current user context is required"
    # Intentional lab flaw for Path 1: fetches another user's notes by username.
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        return "No user found"
    notes = (
        db.query(PrivateNote)
        .filter(PrivateNote.owner_id == target_user.id)
        .order_by(PrivateNote.id.asc())
        .all()
    )
    if not notes:
        return "No private notes found"
    return "\n".join(
        f"note_id={note.id}; owner_id={note.owner_id}; title={note.title}; content={note.note_content}"
        for note in notes
    )
