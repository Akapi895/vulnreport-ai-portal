import re

from app.config import settings


def tokenize_query(query: str) -> list[str]:
    return [token for token in re.findall(r"[a-z0-9][a-z0-9._:-]*", query.lower()) if len(token) >= 3]


class VectorRetriever:
    def __init__(self, collection_name: str | None = None) -> None:
        self.collection_name = collection_name or settings.chroma_collection
        self._client = None
        self._collection = None

    def _get_collection(self):
        if self._collection is None:
            import chromadb

            self._client = chromadb.HttpClient(
                host=settings.chroma_host,
                port=settings.chroma_port,
            )
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    def upsert_chunks(self, docs: list[dict]) -> None:
        if not docs:
            return
        collection = self._get_collection()
        collection.upsert(
            ids=[doc["id"] for doc in docs],
            embeddings=[doc["embedding"] for doc in docs],
            documents=[doc["content"] for doc in docs],
            metadatas=[doc["metadata"] for doc in docs],
        )

    def delete_report(self, report_id: int) -> int:
        collection = self._get_collection()
        result = collection.get(where={"report_id": report_id}, include=[])
        ids = result.get("ids", []) or []
        if ids:
            collection.delete(ids=ids)
        return len(ids)

    def query(
        self,
        query_embedding: list[float],
        limit: int = 5,
        where: dict | None = None,
        fetch_k: int | None = None,
    ) -> list[dict]:
        collection = self._get_collection()
        count = collection.count()
        if count <= 0:
            return []

        n_results = min(fetch_k or limit, count)
        result = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        docs = result.get("documents", [[]])[0] or []
        metadatas = result.get("metadatas", [[]])[0] or []
        distances = result.get("distances", [[]])[0] or []
        ids = result.get("ids", [[]])[0] or []

        chunks: list[dict] = []
        for index, content in enumerate(docs):
            chunks.append(
                {
                    "id": ids[index] if index < len(ids) else "",
                    "content": content,
                    "metadata": metadatas[index] if index < len(metadatas) else {},
                    "distance": distances[index] if index < len(distances) else None,
                }
            )
        return chunks[:limit]
