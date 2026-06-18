import hashlib

import requests

from app.config import settings


def stable_embedding_id(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class EmbeddingService:
    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.embedding_model

    def embed_text(self, text: str) -> list[float]:
        try:
            response = requests.post(
                f"{settings.llm_url}/api/embeddings",
                json={"model": self.model_name, "prompt": text},
                timeout=30,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(
                f"Embedding model '{self.model_name}' is unavailable at {settings.llm_url}"
            ) from exc

        embedding = response.json().get("embedding")
        if not isinstance(embedding, list) or not embedding:
            raise RuntimeError(f"Embedding model '{self.model_name}' returned no embedding")
        return [float(value) for value in embedding]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_text(text) for text in texts]

    def embedding_id(self, text: str) -> str:
        return stable_embedding_id(text)


_embedding_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
