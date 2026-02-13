import time
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window = window_seconds
        self.bucket: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "anon"
        now = time.time()
        count, start = self.bucket.get(ip, (0, now))
        if now - start > self.window:
            count, start = 0, now
        count += 1
        self.bucket[ip] = (count, start)
        if count > self.max_requests:
            return JSONResponse({"detail": "Rate limit exceeded"}, status_code=429)
        return await call_next(request)