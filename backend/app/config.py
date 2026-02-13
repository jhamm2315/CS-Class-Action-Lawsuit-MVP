from pydantic import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_ISSUER: str  = ""   # e.g., https://<project>.supabase.co/auth/v1
    SUPABASE_JWT_AUD: str     = "authenticated"

    # Storage buckets
    STORAGE_UPLOADS_BUCKET: str = "uploads"
    STORAGE_PDF_BUCKET: str     = "pdf"

    # CORS
    CORS_ORIGIN: str = "*"  # set to your prod domain

    # CourtListener
    COURTLISTENER_BASE: str = "https://www.courtlistener.com/api/rest/v3"

    # Vault (Transit) – optional for now
    VAULT_ADDR: str = "http://localhost:8200"
    VAULT_TOKEN: str | None = None
    VAULT_TRANSIT_KEY: str = "pii"

    # AI providers
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    EMBEDDING_DIM: int = 1536

    # Security
    REQUIRE_MFA: bool = True
    BACKEND_SECRET: str = "dev-secret-change-me"  # used to sign short-lived MFA tokens
    DEV_AUTH_ENABLED: bool = True  # set False in prod!
    
    class Config:
        env_file = ".env"

settings = Settings()