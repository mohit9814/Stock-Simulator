"use client";

import { Company } from "@/types";
import { formatINR } from "@/lib/formatINR";
import { X, TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import companiesData from "@/data/companies.json";
import { useGameState } from "@/game/GameStateProvider";
import { useState } from "react";
import { useToast } from "./Toast";

interface CompanyModalProps {
  companyName: string;
  onClose: () => void;
}

export default function CompanyModal({ companyName, onClose }: CompanyModalProps) {
  const company = companiesData.find(c => c.name === companyName) as Company | undefined;
  const { cash, buyStock, newsFeed, quarterCount } = useGameState();
  const [tradeAmount, setTradeAmount] = useState<string>("10000");
  const { showToast, ToastRenderer } = useToast();

  // Filter news that mentions this company by name
  const relatedNews = newsFeed.filter(item => item.includes(companyName));

  const handleBuy = () => {
    const amount = parseInt(tradeAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showToast({ message: "Enter a valid amount", type: "error" });
      return;
    }
    if (amount > cash) {
      showToast({ message: "Insufficient funds", type: "error" });
      return;
    }
    if (buyStock(companyName, amount)) {
      showToast({ message: `✅ Bought ${formatINR(amount)} of ${companyName}`, type: "success" });
      // Auto-close modal after short delay
      setTimeout(onClose, 1800);
    }
  };

  if (!company) return null;

  return (
    <>
      {ToastRenderer}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      >
        <div
          className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in slide-in-from-bottom-4"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">{company.name}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">{company.sector}</span>
                <span className="text-slate-400 text-sm">{company.market_cap} Cap</span>
                <span className="text-slate-500 text-xs">Q{quarterCount > 0 ? quarterCount : "—"}</span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <MetricCard label="Intrinsic Value" value={formatINR(company.intrinsic_value)} />
              <MetricCard
                label="P/E Ratio"
                value={`${company.pe}`}
                sub={`Industry: ${company.industry_pe}`}
                highlight={company.pe > company.industry_pe ? "red" : "green"}
              />
              <MetricCard label="PEG Ratio" value={`${company.peg_ratio}`} />
              <MetricCard label="ROE | ROCE" value={`${company.roe}% | ${company.roce}%`} highlight="green" />
              <MetricCard
                label="Debt / Equity"
                value={`${company.debt_to_equity}`}
                highlight={company.debt_to_equity > 1 ? "red" : "green"}
              />
              <MetricCard label="Dividend Yield" value={`${company.dividend_yield}%`} highlight="blue" />
              <MetricCard
                label="Revenue Growth"
                value={`${company.revenue_growth}%`}
                highlight={company.revenue_growth >= 10 ? "green" : "amber"}
              />
              <MetricCard
                label="Profit Growth"
                value={`${company.profit_growth}%`}
                highlight={company.profit_growth >= 12 ? "green" : "amber"}
              />
              <MetricCard
                label="Profit Margin"
                value={`${company.profit_margin}%`}
                highlight={company.profit_margin >= 15 ? "green" : "amber"}
              />
              <MetricCard label="Interest Coverage" value={`${company.interest_coverage}x`} highlight={company.interest_coverage > 3 ? "green" : "red"} />
              <MetricCard label="Inventory Days" value={`${company.inventory_days}`} highlight="blue" />
              <MetricCard label="Receivable Days" value={`${company.receivable_days}`} highlight="blue" />
              <MetricCard label="WC Days" value={`${company.working_capital_days}`} highlight="amber" />
            </div>

            {/* Trends */}
            <h3 className="text-lg font-bold text-white mb-4">Performance Trends</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {(["revenue_trend", "profit_trend", "margin_trend"] as const).map(key => {
                const val = company[key];
                const isGood = val === "Improving";
                return (
                  <div key={key} className={`p-3 rounded-lg border ${isGood ? "bg-emerald-900/20 border-emerald-500/30" : val === "Declining" ? "bg-red-900/20 border-red-500/30" : "bg-slate-800 border-slate-700"}`}>
                    <span className="block text-xs text-slate-400 mb-1 capitalize">{key.replace("_", " ")}</span>
                    <span className={`font-bold ${isGood ? "text-emerald-400" : val === "Declining" ? "text-red-400" : "text-slate-300"}`}>{val}</span>
                  </div>
                );
              })}
            </div>

            {/* Related News */}
            {relatedNews.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Newspaper size={16} className="text-amber-400" /> Recent News
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {relatedNews.map((item, i) => {
                    const isNeg = item.includes("📉") || item.includes("⚠️") || item.includes("🔻");
                    return (
                      <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border
                        ${isNeg ? "bg-red-500/5 border-red-500/20 text-red-300" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"}`}>
                        {isNeg ? <TrendingDown size={13} className="flex-shrink-0 mt-0.5" /> : <TrendingUp size={13} className="flex-shrink-0 mt-0.5" />}
                        {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Purchase */}
            <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl">
              <h3 className="text-lg font-bold text-white mb-4">Quick Purchase</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm text-slate-400 mb-2">Amount to Invest (₹)</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={e => setTradeAmount(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBuy()}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Enter amount"
                  />
                </div>
                <button
                  onClick={handleBuy}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
                >
                  Buy {company.name}
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-3">Available Cash: {formatINR(cash)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-component ──────────────────────────────────────────────────────────────
type HighlightColor = "green" | "red" | "blue" | "amber";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: HighlightColor;
}

function MetricCard({ label, value, sub, highlight }: MetricCardProps) {
  const colorMap: Record<HighlightColor, string> = {
    green: "text-emerald-400",
    red: "text-red-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
  };
  const color = highlight ? colorMap[highlight] : "text-white";
  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
      <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-slate-500 text-xs block mt-0.5">{sub}</span>}
    </div>
  );
}
