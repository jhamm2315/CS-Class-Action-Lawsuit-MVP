import base64, httpx
from app.config import settings

async def vault_encrypt(plaintext: bytes) -> bytes:
    if not settings.VAULT_TOKEN:
        return plaintext  # fallback: no-op in dev
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{settings.VAULT_ADDR}/v1/transit/encrypt/{settings.VAULT_TRANSIT_KEY}",
                         headers={"X-Vault-Token": settings.VAULT_TOKEN},
                         json={"plaintext": base64.b64encode(plaintext).decode()})
        r.raise_for_status()
        return r.json()["data"]["ciphertext"].encode()

async def vault_decrypt(ciphertext: bytes) -> bytes:
    if not settings.VAULT_TOKEN:
        return ciphertext
    async with httpx.AsyncClient() as c:
        r = await c.post(f"{settings.VAULT_ADDR}/v1/transit/decrypt/{settings.VAULT_TRANSIT_KEY}",
                         headers={"X-Vault-Token": settings.VAULT_TOKEN},
                         json={"ciphertext": ciphertext.decode()})
        r.raise_for_status()
        return base64.b64decode(r.json()["data"]["plaintext"])