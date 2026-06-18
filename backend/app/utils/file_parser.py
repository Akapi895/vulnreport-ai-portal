from io import BytesIO

from fastapi import HTTPException, UploadFile, status


ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf"}
MAX_FILE_SIZE = 2 * 1024 * 1024


async def parse_upload_file(file: UploadFile) -> str:
    filename = file.filename or ""
    ext = _get_extension(filename)

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .txt, .md, and .pdf files are allowed",
        )

    raw = await file.read()

    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large",
        )

    if ext in {".txt", ".md"}:
        return _ensure_readable_text(raw.decode("utf-8", errors="ignore").strip())

    if ext == ".pdf":
        return _ensure_readable_text(_parse_pdf(raw))

    raise HTTPException(status_code=400, detail="Unsupported file type")


def _get_extension(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def _parse_pdf(raw: bytes) -> str:
    try:
        import pypdf

        reader = pypdf.PdfReader(BytesIO(raw))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text.strip()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to parse PDF file",
        ) from exc


def _ensure_readable_text(text: str) -> str:
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File has no readable text",
        )
    return text
