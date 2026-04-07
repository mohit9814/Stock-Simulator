export interface Company {
  id?: number;
  name: string;
  inspired_by: string;
  sector: string;
  description?: string;
  market_cap: string;
  current_price: number;
  intrinsic_value: number;
  pe: number;
  industry_pe: number;
  peg_ratio: number;
  roe: number;
  roce: number;
  debt_to_equity: number;
  interest_coverage: number;
  book_value: number;
  pb_ratio: number;
  dividend_yield: number;
  revenue_growth: number;
  profit_growth: number;
  profit_margin: number;
  working_capital_days: number;
  inventory_days: number;
  receivable_days: number;
  revenue_trend: string;
  profit_trend: string;
  roe_trend: string;
  debt_trend: string;
  margin_trend: string;
  quality_score?: string;
}

export interface PortfolioItem {
  companyName: string;
  costBasis: number;
  currentValue: number;
}

/**
 * Tracks every individual buy/sell for the transaction report.
 * `source` is either "Manual" or the strategy name that triggered the trade.
 * `reason` is a human-readable explanation (e.g. "Stop-Loss", "Take-Profit",
 * "Criteria Violation", "Sector Trim", "Auto Buy").
 */
export interface TradeRecord {
  id: string;
  type: "buy" | "sell";
  companyName: string;
  sector: string;
  amount: number;
  quarter: number;
  year: number;
  timestamp: number;
  /** Who triggered this trade: "Manual" or the strategy name */
  source: string;
  /** Why it was triggered (empty string for manual) */
  reason: string;
}

/** Auto-strategy rule that runs every rebalanceFrequency quarters. */
export interface Strategy {
  id: string;
  name: string;

  // ── Entry filters ──────────────────────────────────────────────────────
  /** Minimum ROE (%) required to buy */
  minRoe: number;
  /** Maximum P/E allowed to buy */
  maxPe: number;
  /** Maximum debt-to-equity allowed to buy */
  maxDebt: number;
  /** Minimum profit growth (%) required to buy */
  minProfitGrowth: number;
  /** Minimum revenue growth (%) required to buy */
  minRevenueGrowth: number;
  /** Percentage of available free cash to invest per qualifying company (0-100) */
  pctCashPerCompany: number;

  // ── Diversification ────────────────────────────────────────────────────
  /** Maximum % of total portfolio value per sector. Excess is trimmed. */
  maxSectorPct: number;

  // ── Exit rules ─────────────────────────────────────────────────────────
  /**
   * Sell entire holding if it has fallen this many % below cost basis.
   * 0 = disabled.  e.g. 15 means sell if loss > 15%
   */
  stopLossPct: number;
  /**
   * Sell entire holding if it has risen this many % above cost basis.
   * 0 = disabled.  e.g. 40 means sell if gain > 40%
   */
  takeProfitPct: number;
  /**
   * Sell holding if the company no longer passes the entry criteria
   * (minRoe / maxPe / maxDebt / minProfitGrowth).
   */
  sellIfCriteriaFailed: boolean;

  // ── Scheduling ────────────────────────────────────────────────────────
  /** How many quarters between rebalances (1 = every quarter) */
  rebalanceFrequency: number;
  enabled: boolean;
}

export interface PortfolioHistory {
  quarter: number;
  totalEquity: number;
  indexValue: number;
}

export interface GameState {
  username: string;
  xp: number;
  level: string;
  cash: number;
  portfolio: PortfolioItem[];
  history: PortfolioHistory[];
  quarterCount: number;
  newsFeed: string[];
  tradeLog: TradeRecord[];
  strategies: Strategy[];
  indexValue: number;
}
