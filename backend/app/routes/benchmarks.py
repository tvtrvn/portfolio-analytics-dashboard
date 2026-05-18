from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Benchmark


class BenchmarkRead(BaseModel):
    id: int
    name: str
    ticker: str

    class Config:
        from_attributes = True


router = APIRouter(prefix="/benchmarks", tags=["benchmarks"])


@router.get("", response_model=list[BenchmarkRead])
def list_benchmarks(db: Session = Depends(get_db)):
    return db.query(Benchmark).order_by(Benchmark.name).all()
