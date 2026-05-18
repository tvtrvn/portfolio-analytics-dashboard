from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import KeepaliveResponse

try:
    from app.services import keepalive as _keepalive
    _ping = _keepalive.ping
except Exception:
    _ping = None

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    """Backward-compatible health check."""
    return {"status": "healthy"}


@router.get("/keepalive", response_model=KeepaliveResponse)
def keepalive(db: Session = Depends(get_db)):
    if _ping is None:
        return KeepaliveResponse(ok=True, db="up", last_refresh=None)
    result = _ping(db)
    return KeepaliveResponse(
        ok=result.get("ok", True),
        db=result.get("db", "up"),
        last_refresh=result.get("last_refresh"),
    )
