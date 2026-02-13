from typing import List
from app.config import settings

async def embed_texts(texts: List[str]) -> List[List[float]]:
    # Try OpenAI first
    if settings.OPENAI_API_KEY:
        import httpx
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post("https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={"model":"text-embedding-3-small","input":texts})
            r.raise_for_status()
            return [d["embedding"] for d in r.json()["data"]]
    # TODO: add local embedding model (e.g., sentence-transformers) if you host it.
    # Minimal deterministic fallback:
    return [[hash(t) % 1000 / 1000.0] * settings.EMBEDDING_DIM for t in texts]