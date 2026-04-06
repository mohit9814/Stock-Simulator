"use client";

import { useGameState } from "@/game/GameStateProvider";
import { formatINR } from "@/lib/formatINR";
import { getQuarterLabel } from "@/game/engine";
import { BarChart3, TrendingUp, TrendingDown, Filter, Bot, User } from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

export default function ReportsPage() {
  const { tradeLog, quarterCount } = useGameState();
  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "sell">("all");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const sectors = ["All", ...Array.from(new Set(tradeLog.map(t => t.sector)))];
  const sources  = ["All", "Manual", ...Array.from(
    new Set(tradeLog.map(t => t.source).filter(s => s !== "Manual"))
  )];

  const filtered = tradeLog.filter(t => {
    const matchType   = typeFilter === "all" || t.type === typeFilter;
    const matchSector = sectorFilter === "All" || t.sector === sectorFilter;
    const matchSource = sourceFilter === "All" || t.source === sourceFilter;
    return matchType && matchSector && matchSource;
  });

  // Aggregate by quarter label for the bar chart
  const quarterMap: Record<string, { buy: number; sell: number }> = {};
  for (let q = 1; q <= Math.max(quarterCount, 1); q++) {
    quarterMap[getQuarterLabel(q)] = { buy: 0, sell: 0 };
  }
  tradeLog.forEach(t => {
    const label = `FY${t.year} Q${t.quarter}`;
    if (!quarterMap[label]) quarterMap[label] = { buy: 0, sell: 0 };
    quarterMap[label][t.type] += t.amount;
  });
  const chartData = Object.entries(quarterMap).map(([name, val]) => ({
    name,
    Bought: val.buy,
    Sold: val.sell,
  }));
  // Additional stat: strategy vs manual breakdown
  const manualCount   = tradeLog.filter(t => t.source === "Manual").length;
  const strategyCount = tradeLog.filter(t => t.source !== "Manual").length;

  // Summary stats
  const totalBought = tradeLog.filter(t => t.type === "buy").reduce((s, t)  => s + t.amount, 0);
  const totalSold   = tradeLog.filter(t => t.type === "sell").reduce((s, t) => s + t.amount, 0);
  const numTrades   = tradeLog.length;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Transaction Report</h2>
        <p className="text-slate-400">Full audit trail of every buy and sell across all quarters.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Trades",          value: `${numTrades}`,        color: "text-white" },
          { label: "Total Deployed (Buy)",   value: formatINR(totalBought), color: "text-emerald-400" },
          { label: "Total Realised (Sell)",  value: formatINR(totalSold),  color: "text-blue-400" },
          { label: "Quarters Played",        value: `${quarterCount}`,    color: "text-amber-400" },
          { label: "Manual Trades",          value: `${manualCount}`,     color: "text-slate-300" },
          { label: "Strategy Trades",        value: `${strategyCount}`,   color: "text-purple-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Activity Chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-400" /> Activity by Quarter
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} width={56} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                  formatter={(v: unknown) => [formatINR(Number(v ?? 0)), ""]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Bought" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill="#10b981" />)}
                </Bar>
                <Bar dataKey="Sold" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill="#3b82f6" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap gap-4 items-center">
        <Filter size={16} className="text-slate-500" />
        {/* Trade type */}
        <div className="flex gap-2">
          {(["all", "buy", "sell"] as const).map(v => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                ${typeFilter === v ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              {v === "all" ? "All" : v === "buy" ? "Buys" : "Sells"}
            </button>
          ))}
        </div>
        {/* Sector */}
        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Source */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          {sources.map(s => <option key={s} value={s}>{s === "Manual" ? "🧑 Manual" : s === "All" ? "All Sources" : `🤖 ${s}`}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} records</span>
      </div>

      {/* Trade Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No trades yet — buy some stocks from the Portfolio or Screener page!
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Quarter</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Sector</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                    FY{t.year} Q{t.quarter}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${t.type === "buy" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {t.type === "buy" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-white whitespace-nowrap">{t.companyName}</td>
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{t.sector}</td>
                  {/* Source: Manual or strategy name */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    {t.source === "Manual" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-700/50 px-2 py-0.5 rounded-full">
                        <User size={11} /> Manual
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full">
                        <Bot size={11} /> {t.source}
                      </span>
                    )}
                  </td>
                  {/* Reason */}
                  <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {t.reason || <span className="text-slate-700">—</span>}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold whitespace-nowrap
                    ${t.type === "buy" ? "text-emerald-400" : "text-blue-400"}`}>
                    {t.type === "buy" ? "−" : "+"}{formatINR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
