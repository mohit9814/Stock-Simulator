import { PortfolioHistory } from "@/types";

/**
 * Standard Risk-Free Rate (Annual 6% -> Quarterly 1.5%)
 */
const RF_QUARTERLY = 0.015;

export interface RiskMetrics {
  sharpeRatio: number;
  treynorRatio: number;
  sortinoRatio: number;
  stdDev: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  rSquared: number;
  var95: number;
}

export function calculateRiskMetrics(history: PortfolioHistory[]): RiskMetrics {
  const metrics: RiskMetrics = {
    sharpeRatio: 0,
    treynorRatio: 0,
    sortinoRatio: 0,
    stdDev: 0,
    beta: 1,
    alpha: 0,
    maxDrawdown: 0,
    rSquared: 0,
    var95: 0,
  };

  if (history.length < 2) return metrics;

  // 1. Calculate returns
  const pReturns: number[] = [];
  const mReturns: number[] = [];

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    pReturns.push((curr.totalEquity - prev.totalEquity) / prev.totalEquity);
    mReturns.push((curr.indexValue - prev.indexValue) / prev.indexValue);
  }

  const n = pReturns.length;
  const avgP = pReturns.reduce((a, b) => a + b, 0) / n;
  const avgM = mReturns.reduce((a, b) => a + b, 0) / n;

  // 2. Standard Deviation
  const varianceP = pReturns.reduce((s, r) => s + Math.pow(r - avgP, 2), 0) / (n - 1 || 1);
  metrics.stdDev = Math.sqrt(varianceP);

  // 3. Sharpe Ratio
  metrics.sharpeRatio = metrics.stdDev > 0 ? (avgP - RF_QUARTERLY) / metrics.stdDev : 0;

  // 4. Downside Deviation (Sortino)
  const downsideReturns = pReturns.filter(r => r < RF_QUARTERLY);
  const downsideVar = downsideReturns.reduce((s, r) => s + Math.pow(r - RF_QUARTERLY, 2), 0) / (n || 1);
  const downsideDev = Math.sqrt(downsideVar);
  metrics.sortinoRatio = downsideDev > 0 ? (avgP - RF_QUARTERLY) / downsideDev : 0;

  // 5. Beta & Alpha
  const varianceM = mReturns.reduce((s, r) => s + Math.pow(r - avgM, 2), 0) / (n - 1 || 1);
  const covariance = pReturns.reduce((s, r, i) => s + (r - avgP) * (mReturns[i] - avgM), 0) / (n - 1 || 1);
  
  metrics.beta = varianceM > 0 ? covariance / varianceM : 1;
  metrics.alpha = (avgP - RF_QUARTERLY) - metrics.beta * (avgM - RF_QUARTERLY);

  // 6. Treynor Ratio
  metrics.treynorRatio = metrics.beta !== 0 ? (avgP - RF_QUARTERLY) / metrics.beta : 0;

  // 7. R-Squared
  const correlation = metrics.stdDev > 0 && Math.sqrt(varianceM) > 0 
    ? covariance / (metrics.stdDev * Math.sqrt(varianceM)) 
    : 0;
  metrics.rSquared = Math.pow(correlation, 2);

  // 8. Max Drawdown
  let peak = -Infinity;
  let maxDD = 0;
  history.forEach(h => {
    if (h.totalEquity > peak) peak = h.totalEquity;
    const dd = (h.totalEquity - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  });
  metrics.maxDrawdown = maxDD;

  // 9. Value at Risk (95% - Historical)
  const sortedReturns = [...pReturns].sort((a, b) => a - b);
  const varIndex = Math.floor(n * 0.05);
  metrics.var95 = sortedReturns[varIndex] || 0;

  return metrics;
}
