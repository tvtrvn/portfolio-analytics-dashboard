from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Text,
    Numeric, BigInteger, Index, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    strategy = Column(String(100), nullable=False)
    benchmark_id = Column(Integer, ForeignKey("benchmarks.id"), nullable=True)
    inception_date = Column(Date, nullable=False)
    currency = Column(String(10), default="CAD")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    benchmark = relationship("Benchmark", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio", lazy="dynamic")
    returns = relationship("PortfolioReturn", back_populates="portfolio", lazy="dynamic")
    transactions = relationship("Transaction", back_populates="portfolio", lazy="dynamic")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    ticker = Column(String(50), nullable=False, unique=True)

    portfolios = relationship("Portfolio", back_populates="benchmark")
    returns = relationship("BenchmarkReturn", back_populates="benchmark", lazy="dynamic")


class Security(Base):
    __tablename__ = "securities"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False)
    sector = Column(String(100), nullable=False)
    asset_class = Column(String(50), nullable=False)
    currency = Column(String(10), default="CAD")
    exchange = Column(String(50), nullable=True)

    holdings = relationship("Holding", back_populates="security")
    prices = relationship("Price", back_populates="security", lazy="dynamic")
    transactions = relationship("Transaction", back_populates="security")


class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (
        Index("ix_holdings_portfolio_date", "portfolio_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    security_id = Column(Integer, ForeignKey("securities.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    quantity = Column(Numeric(18, 4), nullable=False)
    market_value = Column(Numeric(18, 2), nullable=False)
    weight = Column(Numeric(8, 6), nullable=False)
    target_weight = Column(Numeric(8, 6), nullable=True)
    cost_basis = Column(Numeric(18, 2), nullable=True)

    portfolio = relationship("Portfolio", back_populates="holdings")
    security = relationship("Security", back_populates="holdings")


class Price(Base):
    __tablename__ = "prices"
    __table_args__ = (
        Index("ix_prices_security_date", "security_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    security_id = Column(Integer, ForeignKey("securities.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    close_price = Column(Numeric(12, 4), nullable=False)
    open_price = Column(Numeric(12, 4), nullable=True)
    volume = Column(BigInteger, nullable=True)

    security = relationship("Security", back_populates="prices")


class PortfolioReturn(Base):
    __tablename__ = "portfolio_returns"
    __table_args__ = (
        Index("ix_portfolio_returns_portfolio_date", "portfolio_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    daily_return = Column(Numeric(12, 8), nullable=False)
    cumulative_return = Column(Numeric(12, 8), nullable=False)
    market_value = Column(Numeric(18, 2), nullable=False)

    portfolio = relationship("Portfolio", back_populates="returns")


class BenchmarkReturn(Base):
    __tablename__ = "benchmark_returns"
    __table_args__ = (
        Index("ix_benchmark_returns_benchmark_date", "benchmark_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    benchmark_id = Column(Integer, ForeignKey("benchmarks.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    daily_return = Column(Numeric(12, 8), nullable=False)
    cumulative_return = Column(Numeric(12, 8), nullable=False)

    benchmark = relationship("Benchmark", back_populates="returns")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_portfolio_date", "portfolio_id", "date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    security_id = Column(Integer, ForeignKey("securities.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False)
    quantity = Column(Numeric(18, 4), nullable=False)
    price = Column(Numeric(12, 4), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)

    portfolio = relationship("Portfolio", back_populates="transactions")
    security = relationship("Security", back_populates="transactions")
