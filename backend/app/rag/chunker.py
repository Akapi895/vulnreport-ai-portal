import re


def semantic_chunk(text: str, max_chunk_size: int = 900, overlap: int = 120) -> list[str]:
    if not text or not text.strip():
        return []

    chunks: list[str] = []
    paragraphs = re.split(r"\n\s*\n", text.strip())
    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        if len(paragraph) <= max_chunk_size:
            chunks.append(paragraph)
            continue

        sentences = re.split(r"(?<=[.!?])\s+", paragraph)
        current: list[str] = []
        current_len = 0
        for sentence in sentences:
            sentence_len = len(sentence) + (1 if current else 0)
            if current and current_len + sentence_len > max_chunk_size:
                chunks.append(" ".join(current))
                current = []
                current_len = 0

            if len(sentence) > max_chunk_size:
                if current:
                    chunks.append(" ".join(current))
                    current = []
                    current_len = 0
                chunks.extend(_split_long_sentence(sentence, max_chunk_size))
                continue

            current.append(sentence)
            current_len += sentence_len

        if current:
            chunks.append(" ".join(current))
    return _with_overlap(chunks, overlap)


def _split_long_sentence(sentence: str, max_chunk_size: int) -> list[str]:
    words = sentence.split()
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for word in words:
        word_len = len(word) + (1 if current else 0)
        if current and current_len + word_len > max_chunk_size:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.append(word)
        current_len += word_len
    if current:
        chunks.append(" ".join(current))
    return chunks


def chunk_text(text: str, size: int = 900, overlap: int = 120) -> list[str]:
    return semantic_chunk(text, max_chunk_size=size, overlap=overlap)


def _with_overlap(chunks: list[str], overlap: int) -> list[str]:
    if overlap <= 0 or len(chunks) <= 1:
        return chunks

    out = [chunks[0]]
    for previous, current in zip(chunks, chunks[1:]):
        prefix = _tail_words(previous, overlap)
        out.append(f"{prefix} {current}" if prefix else current)
    return out


def _tail_words(text: str, max_chars: int) -> str:
    tail = text[-max_chars:].strip()
    if not tail:
        return ""
    first_space = tail.find(" ")
    if first_space > 0:
        tail = tail[first_space + 1 :]
    return tail.strip()
