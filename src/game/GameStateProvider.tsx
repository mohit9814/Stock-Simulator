"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { GameState, PortfolioItem, TradeRecord, Strategy, Company, PortfolioHistory } from "@/types";
import { getLevelFromXP, generateMarketEvents } from "./engine";
import companiesData from "@/data/companies.json";

// ── Helpers ────────────────────────────────────────────────────────────────────

function quarterToYearQ(quarter: number): { quarter: number; year: number } {
  const baseYear = 2025;
  const yearOffset = Math.floor(Math.max(0, quarter - 1) / 4);
  const q = ((Math.max(0, quarter - 1)) % 4) + 1;
  return { quarter: q, year: baseYear + yearOffset };
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns true if a company passes a strategy's entry criteria. */
function passesEntryFilter(co: Company, s: Strategy): boolean {
  return (
    co.roe >= s.minRoe &&
    co.pe <= s.maxPe &&
    co.debt_to_equity <= s.maxDebt &&
    co.profit_growth >= (s.minProfitGrowth ?? 0) &&
    co.revenue_growth >= (s.minRevenueGrowth ?? 0)
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StrategyRunResult {
  updatedPortfolio: PortfolioItem[];
  remainingCash: number;
  trades: TradeRecord[];
  exitMessages: string[];
}

interface GameStateContextType extends GameState {
  setUsername: (name: string) => void;
  resetGame: () => void;
  addXP: (amount: number) => void;
  /** `source` defaults to "Manual"; pass a strategy name for auto-trades. */
  buyStock: (companyName: string, amount: number, source?: string, reason?: string) => boolean;
  /** `source` defaults to "Manual"; pass a strategy name for auto-trades. */
  sellStock: (companyName: string, amount: number, source?: string, reason?: string) => boolean;
  updatePortfolioReturns: (
    newHoldings: PortfolioItem[],
    newCash: number,
    newQuarter: number,
    totalEquity: number,
    newsItems: string[],
    extraTrades?: TradeRecord[]
  ) => void;
  runStrategies: (
    newQuarter: number,
    currentCash: number,
    currentPortfolio: PortfolioItem[]
  ) => StrategyRunResult;
  simulateQuarter: () => void;
  addStrategy: (s: Omit<Strategy, "id">) => void;
  removeStrategy: (id: string) => void;
  toggleStrategy: (id: string) => void;
}

// ── Default State ──────────────────────────────────────────────────────────────

const defaultState: GameState = {
  username: "",
  xp: 0,
  level: "Beginner",
  cash: 1000000,
  portfolio: [],
  history: [],
  quarterCount: 0,
  newsFeed: [],
  tradeLog: [],
  strategies: [],
  indexValue: 1000000,
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tempName, setTempName] = useState("");

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("stock-sim-state");
    if (saved) {
      try {
        const p = JSON.parse(saved) as Partial<GameState>;
        if (!p.history)    p.history = [];
        if (!p.newsFeed)   p.newsFeed = [];
        if (!p.tradeLog)   p.tradeLog = [];
        if (!p.strategies) p.strategies = [];
        if (p.quarterCount === undefined) p.quarterCount = 0;
        if (p.username === undefined)     p.username = "";
        if (p.indexValue === undefined)   p.indexValue = 1000000;

        // Backfill source/reason on old trade records
        if (p.tradeLog) {
          p.tradeLog = p.tradeLog.map(t => ({
            ...t,
            source: (t as any).source ?? "Manual",
            reason: (t as any).reason ?? "",
          }));
        }

        // Backfill new strategy fields on old strategies
        if (p.strategies) {
          p.strategies = p.strategies.map(s => {
            const ss = s as any;
            return {
              ...ss,
              rebalanceFrequency: ss.rebalanceFrequency ?? 1,
              stopLossPct: ss.stopLossPct ?? 0,
              takeProfitPct: ss.takeProfitPct ?? 0,
              sellIfCriteriaFailed: ss.sellIfCriteriaFailed ?? false,
              minRevenueGrowth: ss.minRevenueGrowth ?? 10,
              // Migration: amountPerCompany -> pctCashPerCompany
              pctCashPerCompany: ss.pctCashPerCompany ?? (ss.amountPerCompany ? 5 : 10),
            };
          });
        }

        // Backfill indexHistory if missing
        if (p.history && Array.isArray(p.history)) {
          p.history = p.history.map((h: any) => ({
            quarter: h.quarter,
            totalEquity: h.totalEquity,
            indexValue: h.indexValue ?? 1000000,
          })) as PortfolioHistory[];
        }

        setState(p as GameState);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("stock-sim-state", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const setUsername = (username: string) => setState(prev => ({ ...prev, username }));
  const resetGame = () => setState({ ...defaultState, username: state.username });
  const addXP = (amount: number) => {
    setState(prev => {
      const newXP = prev.xp + amount;
      return { ...prev, xp: newXP, level: getLevelFromXP(newXP) };
    });
  };

  const buyStock = useCallback((
    companyName: string,
    amount: number,
    source = "Manual",
    reason = ""
  ): boolean => {
    if (state.cash < amount) return false;
    const co = (companiesData as Company[]).find(c => c.name === companyName);
    const { quarter, year } = quarterToYearQ(state.quarterCount);

    setState(prev => {
      if (prev.cash < amount) return prev;
      const existing = prev.portfolio.find(p => p.companyName === companyName);
      const newPortfolio: PortfolioItem[] = existing
        ? prev.portfolio.map(p =>
            p.companyName === companyName
              ? { ...p, costBasis: p.costBasis + amount, currentValue: p.currentValue + amount }
              : p
          )
        : [...prev.portfolio, { companyName, costBasis: amount, currentValue: amount }];

      const newTrade: TradeRecord = {
        id: makeId(), type: "buy", companyName,
        sector: co?.sector ?? "Unknown",
        amount, quarter, year, timestamp: Date.now(),
        source, reason,
      };
      return { ...prev, cash: prev.cash - amount, portfolio: newPortfolio, tradeLog: [newTrade, ...prev.tradeLog] };
    });
    return true;
  }, [state.cash, state.quarterCount]);

  const sellStock = useCallback((
    companyName: string,
    amountToSell: number,
    source = "Manual",
    reason = ""
  ): boolean => {
    const existing = state.portfolio.find(p => p.companyName === companyName);
    if (!existing || existing.currentValue < amountToSell) return false;
    const co = (companiesData as Company[]).find(c => c.name === companyName);
    const { quarter, year } = quarterToYearQ(state.quarterCount);

    setState(prev => {
      const item = prev.portfolio.find(p => p.companyName === companyName);
      if (!item || item.currentValue < amountToSell) return prev;
      const fractionSold = amountToSell / item.currentValue;
      const newPortfolio = prev.portfolio
        .map(p => p.companyName === companyName
          ? { ...p, costBasis: p.costBasis * (1 - fractionSold), currentValue: p.currentValue - amountToSell }
          : p
        )
        .filter(p => p.currentValue > 1);

      const newTrade: TradeRecord = {
        id: makeId(), type: "sell", companyName,
        sector: co?.sector ?? "Unknown",
        amount: amountToSell, quarter, year, timestamp: Date.now(),
        source, reason,
      };
      return { ...prev, cash: prev.cash + amountToSell, portfolio: newPortfolio, tradeLog: [newTrade, ...prev.tradeLog] };
    });
    return true;
  }, [state.portfolio, state.quarterCount]);

  const runStrategies = useCallback((
    newQuarter: number,
    currentCash: number,
    currentPortfolio: PortfolioItem[]
  ): StrategyRunResult => {
    const companies = companiesData as Company[];
    const trades: TradeRecord[] = [];
    const exitMessages: string[] = [];
    const { quarter, year } = quarterToYearQ(newQuarter);

    let portfolio = currentPortfolio.map(p => ({ ...p }));
    let cash = currentCash;

    for (const strategy of state.strategies) {
      if (!strategy.enabled) continue;
      if (newQuarter % strategy.rebalanceFrequency !== 0) continue;

      // 1. Calculate NAV baseline before this strategy runs its passes
      const portfolioValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);
      let nav = cash + portfolioValue;


      const snapshot = [...portfolio];
      for (const holding of snapshot) {
        const co = companies.find(c => c.name === holding.companyName);
        if (!co) continue;
        const pnlPct = holding.costBasis > 0
          ? ((holding.currentValue - holding.costBasis) / holding.costBasis) * 100
          : 0;

        let sellReason: string | null = null;
        if (strategy.stopLossPct > 0 && pnlPct <= -strategy.stopLossPct) {
          sellReason = `Stop-Loss (−${strategy.stopLossPct}%)`;
        } else if (strategy.takeProfitPct > 0 && pnlPct >= strategy.takeProfitPct) {
          sellReason = `Take-Profit (+${strategy.takeProfitPct}%)`;
        } else if (strategy.sellIfCriteriaFailed && !passesEntryFilter(co, strategy)) {
          sellReason = "Criteria Violation";
        }

        if (sellReason) {
          const sellAmt = holding.currentValue;
          trades.push({
            id: makeId(), type: "sell", companyName: holding.companyName,
            sector: co.sector, amount: sellAmt,
            quarter, year, timestamp: Date.now(),
            source: strategy.name, reason: sellReason,
          });
          exitMessages.push(`🎯 [${strategy.name}] Sold ${holding.companyName} — ${sellReason}`);
          cash += sellAmt;
          portfolio = portfolio.filter(p => p.companyName !== holding.companyName);
        }
      }

      // Sector trimming (calculated against NAV)
      const sectors = Array.from(new Set(companies.map(c => c.sector)));
      for (const sector of sectors) {
        if (nav > 0) {
          const sectorHoldings = portfolio.filter(p => {
            const co = companies.find(c => c.name === p.companyName);
            return co?.sector === sector;
          });
          const sectorValue = sectorHoldings.reduce((s, p) => s + p.currentValue, 0);
          const sectorPct = (sectorValue / nav) * 100;

          if (sectorPct > strategy.maxSectorPct) {
            const excessValue = sectorValue - (nav * strategy.maxSectorPct / 100);

            sectorHoldings.sort((a, b) => {
              const gainA = a.costBasis > 0 ? (a.currentValue - a.costBasis) / a.costBasis : 0;
              const gainB = b.costBasis > 0 ? (b.currentValue - b.costBasis) / b.currentValue : 0;
              return gainB - gainA;
            });
            let remaining = excessValue;
            for (const h of sectorHoldings) {
              if (remaining <= 0) break;
              const item = portfolio.find(p => p.companyName === h.companyName);
              if (!item || item.currentValue <= 0) continue;
              const trimAmt = Math.min(remaining, item.currentValue);
              const frac = trimAmt / item.currentValue;
              trades.push({
                id: makeId(), type: "sell", companyName: h.companyName,
                sector, amount: trimAmt,
                quarter, year, timestamp: Date.now(),
                source: strategy.name, reason: `Sector Trim (${sector} > ${strategy.maxSectorPct}%)`,
              });
              exitMessages.push(`✂️ [${strategy.name}] Trimmed ${h.companyName} by ${formatPct(trimAmt, item.currentValue)} — ${sector} overweight`);
              cash += trimAmt;
              portfolio = portfolio.map(p => p.companyName === h.companyName
                ? { ...p, costBasis: p.costBasis * (1 - frac), currentValue: p.currentValue - trimAmt }
                : p
              ).filter(p => p.currentValue > 1);
              remaining -= trimAmt;
            }
          }
        }
      }

      // ── BUY PASS ──────────────────────────────────────────────────────────
      // Recalculate NAV and Cash Baseline after exits are complete
      const finalPortfolioValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);
      const postExitNav = cash + finalPortfolioValue;

      const qualifying = companies.filter(co => passesEntryFilter(co, strategy));
      // Base the investment amount on "Free Cash" as requested by user, 
      // but use the cash balance AFTER exits have happened.
      const investAmt = (cash * strategy.pctCashPerCompany) / 100;

      if (investAmt > 0) {
        for (const co of qualifying) {
          if (cash < investAmt) break;

          if (postExitNav > 0) {
            const sectorValue = portfolio
              .filter(p => companies.find(c => c.name === p.companyName)?.sector === co.sector)
              .reduce((s, p) => s + p.currentValue, 0);
            if ((sectorValue / postExitNav) * 100 >= strategy.maxSectorPct) continue;
          }


          const existing = portfolio.find(p => p.companyName === co.name);
          portfolio = existing
            ? portfolio.map(p => p.companyName === co.name
                ? { ...p, costBasis: p.costBasis + investAmt, currentValue: p.currentValue + investAmt }
                : p
              )
            : [...portfolio, { companyName: co.name, costBasis: investAmt, currentValue: investAmt }];
          cash -= investAmt;
          trades.push({
            id: makeId(), type: "buy", companyName: co.name,
            sector: co.sector, amount: investAmt,
            quarter, year, timestamp: Date.now(),
            source: strategy.name, reason: "Auto Buy",
          });
        }
      }
    }

    return { updatedPortfolio: portfolio, remainingCash: cash, trades, exitMessages };
  }, [state.strategies]);

  const simulateQuarter = useCallback(() => {
    const nextQuarter = state.quarterCount + 1;
    const companies = companiesData as Company[];
    const { news, multipliers } = generateMarketEvents(companies, nextQuarter);

    // 1. Calculate Index performance (average return of all stocks)
    let totalMarketMultiplier = 0;
    companies.forEach(company => {
      const avgGrowth = (company.revenue_growth + company.profit_growth) / 2;
      const drift = avgGrowth / 100 / 4;
      const noise = (Math.random() * 0.16) - 0.08;
      const eventMultiplier = multipliers[company.name] ?? 1.0;
      totalMarketMultiplier += (1 + drift + noise) * eventMultiplier;
    });
    const marketReturn = totalMarketMultiplier / companies.length;
    const newIndexValue = Math.round(state.indexValue * marketReturn);

    // 2. Apply market price movements to existing holdings
    let newPortfolio = state.portfolio.map(item => {
      const company = companies.find(c => c.name === item.companyName);
      if (!company) return item;
      const avgGrowth = (company.revenue_growth + company.profit_growth) / 2;
      const drift = avgGrowth / 100 / 4;
      const noise = (Math.random() * 0.16) - 0.08;
      const eventMultiplier = multipliers[item.companyName] ?? 1.0;
      const multiplier = (1 + drift + noise) * eventMultiplier;
      return { ...item, currentValue: Math.max(0, Math.round(item.currentValue * multiplier)) };
    });

    // 3. Run strategy engine
    const { updatedPortfolio, remainingCash, trades, exitMessages } =
      runStrategies(nextQuarter, state.cash, newPortfolio);
    
    newPortfolio = updatedPortfolio;
    const newCash = remainingCash;

    // Log strategy events
    const buys = trades.filter(t => t.type === "buy").length;
    const sells = trades.filter(t => t.type === "sell").length;
    if (buys > 0) news.push(`🤖 Strategy Engine: ${buys} auto-buy(s) executed.`);
    if (sells > 0) news.push(`📤 Strategy Engine: ${sells} auto-exit(s) triggered.`);
    exitMessages.forEach(m => news.push(m));

    // Calculate final stats
    const newInvestedValue = newPortfolio.reduce((a, b) => a + b.currentValue, 0);
    const totalEquityAfterQuarter = newCash + newInvestedValue;

    // Commit changes
    setState(prev => {
      const updatedHistory: PortfolioHistory[] = [
        ...prev.history,
        { 
          quarter: nextQuarter, 
          totalEquity: totalEquityAfterQuarter,
          indexValue: newIndexValue
        }
      ];

      return {
        ...prev,
        cash: newCash,
        portfolio: newPortfolio,
        quarterCount: nextQuarter,
        indexValue: newIndexValue,
        history: updatedHistory,
        newsFeed: [...news, ...prev.newsFeed].slice(0, 50),
        tradeLog: trades.length > 0 ? [...trades, ...prev.tradeLog] : prev.tradeLog,
      };
    });
  }, [state, runStrategies]);

  const updatePortfolioReturns = (
    newHoldings: PortfolioItem[],
    newCash: number,
    newQuarter: number,
    totalEquityAtQuarter: number,
    newsItems: string[],
    extraTrades: TradeRecord[] = []
  ) => {
    setState(prev => ({
      ...prev,
      cash: newCash,
      portfolio: newHoldings,
      quarterCount: newQuarter,
      history: [...prev.history, { quarter: newQuarter, totalEquity: totalEquityAtQuarter, indexValue: prev.indexValue } as PortfolioHistory],
      newsFeed: [...newsItems, ...prev.newsFeed].slice(0, 50),
      tradeLog: extraTrades.length > 0
        ? [...extraTrades, ...prev.tradeLog]
        : prev.tradeLog,
    }));
  };

  const addStrategy = (s: Omit<Strategy, "id">) =>
    setState(prev => ({ ...prev, strategies: [...prev.strategies, { ...s, id: makeId() }] }));

  const removeStrategy = (id: string) =>
    setState(prev => ({ ...prev, strategies: prev.strategies.filter(s => s.id !== id) }));

  const toggleStrategy = (id: string) =>
    setState(prev => ({
      ...prev,
      strategies: prev.strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }));

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  if (!state.username) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-in slide-in-from-bottom-4">
          <div className="text-4xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to StockSim</h2>
          <p className="text-slate-400 mb-6">Enter your alias to begin your investing journey.</p>
          <input
            type="text"
            placeholder="Fund Manager Name"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              if (tempName.trim().length > 2) setUsername(tempName.trim());
              else alert("Please enter at least 3 characters");
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Start Managing Fund
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameStateContext.Provider value={{
      ...state,
      setUsername, resetGame, addXP,
      buyStock, sellStock,
      updatePortfolioReturns,
      runStrategies,
      simulateQuarter,
      addStrategy, removeStrategy, toggleStrategy,
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within a GameStateProvider");
  return ctx;
}

function formatPct(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(0)}%` : "0%";
}
