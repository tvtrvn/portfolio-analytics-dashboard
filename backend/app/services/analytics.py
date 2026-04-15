"""
Financial analytics calculations for portfolio analysis.
All return values are decimals (e.g., 0.05 = 5%).
"""

import numpy as np
from datetime import date, timedelta


def cumulative_return(daily_returns: list[float]) -> float:
    """Compound daily returns into a total cumulative return."""
    if not daily_returns:
        return 0.0
    return float(np.prod([1 + r for r in daily_returns]) - 1)


def annualized_return(cumulative_ret: float, num_days: int) -> float:
    """Annualize a cumulative return assuming 252 trading days per year."""
    if num_days <= 0:
        return 0.0
    years = num_days / 252
    if years <= 0:
        return 0.0
    return float((1 + cumulative_ret) ** (1 / years) - 1)


def annualized_volatility(daily_returns: list[float]) -> float:
    """Annualize standard deviation of daily returns (sqrt(252) scaling)."""
    if len(daily_returns) < 2:
        return 0.0
    return float(np.std(daily_returns, ddof=1) * np.sqrt(252))


def sharpe_ratio(daily_returns: list[float], risk_free_rate: float = 0.045) -> float:
    """
    Sharpe = (annualized portfolio return - risk-free rate) / annualized volatility.
    risk_free_rate is an annual rate.
    """
    if len(daily_returns) < 2:
        return 0.0
    cum_ret = cumulative_return(daily_returns)
    ann_ret = annualized_return(cum_ret, len(daily_returns))
    vol = annualized_volatility(daily_returns)
    if vol == 0:
        return 0.0
    return float((ann_ret - risk_free_rate) / vol)


def max_drawdown(daily_returns: list[float]) -> tuple[float, int, int]:
    """
    Compute the maximum peak-to-trough decline.
    Returns (max_dd, peak_index, trough_index).
    """
    if not daily_returns:
        return 0.0, 0, 0
    cumulative = np.cumprod([1 + r for r in daily_returns])
    running_max = np.maximum.accumulate(cumulative)
    drawdowns = cumulative / running_max - 1
    trough_idx = int(np.argmin(drawdowns))
    peak_idx = int(np.argmax(cumulative[:trough_idx + 1])) if trough_idx > 0 else 0
    return float(drawdowns[trough_idx]), peak_idx, trough_idx


def rolling_volatility(daily_returns: list[float], window: int) -> list[float | None]:
    """Compute rolling annualized volatility with the given window size."""
    result: list[float | None] = []
    for i in range(len(daily_returns)):
        if i < window - 1:
            result.append(None)
        else:
            window_returns = daily_returns[i - window + 1: i + 1]
            result.append(float(np.std(window_returns, ddof=1) * np.sqrt(252)))
    return result


def drawdown_series(daily_returns: list[float]) -> list[float]:
    """Compute the drawdown at each point in time."""
    if not daily_returns:
        return []
    cumulative = np.cumprod([1 + r for r in daily_returns])
    running_max = np.maximum.accumulate(cumulative)
    return (cumulative / running_max - 1).tolist()


def tracking_error(
    portfolio_returns: list[float], benchmark_returns: list[float]
) -> float:
    """Annualized standard deviation of excess returns (portfolio - benchmark)."""
    if len(portfolio_returns) != len(benchmark_returns) or len(portfolio_returns) < 2:
        return 0.0
    excess = np.array(portfolio_returns) - np.array(benchmark_returns)
    return float(np.std(excess, ddof=1) * np.sqrt(252))


def information_ratio(
    portfolio_returns: list[float], benchmark_returns: list[float]
) -> float:
    """
    Information Ratio = annualized excess return / tracking error.
    Measures risk-adjusted outperformance versus the benchmark.
    """
    te = tracking_error(portfolio_returns, benchmark_returns)
    if te == 0:
        return 0.0
    p_cum = cumulative_return(portfolio_returns)
    b_cum = cumulative_return(benchmark_returns)
    n = len(portfolio_returns)
    ann_excess = annualized_return(p_cum, n) - annualized_return(b_cum, n)
    return float(ann_excess / te)


def beta(portfolio_returns: list[float], benchmark_returns: list[float]) -> float:
    """Portfolio beta relative to benchmark: Cov(Rp, Rb) / Var(Rb)."""
    if len(portfolio_returns) != len(benchmark_returns) or len(portfolio_returns) < 2:
        return 1.0
    p = np.array(portfolio_returns)
    b = np.array(benchmark_returns)
    cov_matrix = np.cov(p, b)
    var_b = cov_matrix[1, 1]
    if var_b == 0:
        return 1.0
    return float(cov_matrix[0, 1] / var_b)


def value_at_risk(daily_returns: list[float], confidence: float = 0.95) -> float:
    """Historical VaR at the given confidence level (e.g., 95%)."""
    if not daily_returns:
        return 0.0
    return float(np.percentile(daily_returns, (1 - confidence) * 100))


def conditional_var(daily_returns: list[float], confidence: float = 0.95) -> float:
    """CVaR (Expected Shortfall): mean of returns below the VaR threshold."""
    if not daily_returns:
        return 0.0
    var = value_at_risk(daily_returns, confidence)
    tail = [r for r in daily_returns if r <= var]
    if not tail:
        return var
    return float(np.mean(tail))
