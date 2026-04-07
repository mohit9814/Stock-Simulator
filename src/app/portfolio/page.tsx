"use client";

import { formatINR } from "@/lib/formatINR";
import { useState } from "react";
import companiesData from "@/data/companies.json";
import { Company } from "@/types";
import { useGameState } from "@/game/GameStateProvider";
import {
  TrendingUp, ArrowRightLeft, Activity, PieChart,
  LineChart as LineChartIcon, Newspaper, TrendingDown, Percent,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
} from "recharts";
import CompanyLink from "@/components/CompanyLink";
import { useToast } from "@/components/Toast";

// ── CAGR Calculation ─────────────────────────────────────────────────────────
// Annualised return using total quarters elapsed (4 quarters = 1 year).
function calculateCAGR(initial: number, current: number, quarters: number): number | null {
  if (initial <= 0 || current <= 0 || quarters <= 0) return null;
  const years = quarters / 4;
  return (Math.pow(current / initial, 1 / years) - 1) * 100;
}

// ── Trend Badge ───────────────────────────────────────────────────────────────
function TrendBadge({ trend }: { trend: string }) {
  const color =
    trend === "Improving" ? "text-emerald-400 bg-emerald-400/10"
    : trend === "Declining" ? "text-red-400 bg-red-400/10"
    : trend === "Volatile"  ? "text-amber-400 bg-amber-400/10"
    : "text-slate-400 bg-slate-700/40";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {trend}
    </span>
  );
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function PortfolioPage() {
  const {
    cash, portfolio, quarterCount, history, newsFeed,
    buyStock, sellStock, simulateQuarter, companies
  } = useGameState();
  const { showToast, ToastRenderer } = useToast();
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>(companies[0].name);
  const [tradeAmount, setTradeAmount] = useState<string>("10000");
  const [sellAmounts, setSellAmounts] = useState<Record<string, string>>({});

  const selectedCompany = companies.find(c => c.name === selectedCompanyName);

  // ── Summary Metrics ───────────────────────────────────────────────────────
  const totalCurrentValue = portfolio.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalCost         = portfolio.reduce((acc, curr) => acc + curr.costBasis, 0);
  const totalUnrealizedProfit = totalCurrentValue - totalCost;
  const portfolioReturnPercent = totalCost > 0 ? (totalUnrealizedProfit / totalCost) * 100 : 0;

  const initialEquity = 1_000_000; // Starting capital — matches defaultState.cash
  const currentTotalEquity = cash + totalCurrentValue;
  const cagr = calculateCAGR(initialEquity, currentTotalEquity, quarterCount);

  // ── Sector Allocation ────────────────────────────────────────────────────
  const sectorMap: Record<string, number> = {};
  portfolio.forEach(item => {
    const co = companies.find(c => c.name === item.companyName);
    if (co) sectorMap[co.sector] = (sectorMap[co.sector] || 0) + item.currentValue;
  });
  const pieData = Object.entries(sectorMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  // ── Equity Chart ─────────────────────────────────────────────────────────
  const chartHistory = history.map(h => ({ 
    name: `Q${h.quarter}`, 
    Portfolio: h.totalEquity,
    Index: h.indexValue 
  }));
  if (chartHistory.length === 0) {
    chartHistory.push({ 
      name: `Q${quarterCount}`, 
      Portfolio: currentTotalEquity,
      Index: 1000000 
    });
  }

  // ── Buy Handler ───────────────────────────────────────────────────────────
  const handleBuy = () => {
    const amount = parseInt(tradeAmount, 10);
    if (isNaN(amount) || amount <= 0) return showToast({ message: "Enter a valid amount", type: "error" });
    if (amount > cash) return showToast({ message: "Insufficient funds", type: "error" });
    buyStock(selectedCompanyName, amount);
    showToast({ message: `✅ Bought ${formatINR(amount)} of ${selectedCompanyName}` });
  };


  return (
    <div className="max-w-7xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 space-y-8">
      {ToastRenderer}
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Portfolio X-Ray</h2>
          <p className="text-slate-400">Quarter {quarterCount}. Manage virtual holdings and analyze simulated performance.</p>
        </div>
        <button
          onClick={simulateQuarter}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
        >
          <TrendingUp size={20} /> Advance 1 Quarter
        </button>
      </div>

      {/* ── Top Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Equity"      value={formatINR(currentTotalEquity)}            color="text-white" />
        <StatCard label="Available Cash"    value={formatINR(cash)}                           color="text-emerald-400" />
        <StatCard label="Invested (Cost)"   value={formatINR(totalCost)}                      color="text-blue-400" />
        <StatCard
          label="Unrealized P&L"
          value={`${totalUnrealizedProfit >= 0 ? "+" : ""}${formatINR(totalUnrealizedProfit)}`}
          sub={`${portfolioReturnPercent.toFixed(2)}%`}
          color={totalUnrealizedProfit >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <StatCard
          label="CAGR (Annualised)"
          value={cagr !== null ? `${cagr >= 0 ? "+" : ""}${cagr.toFixed(2)}%` : "—"}
          sub={quarterCount > 0 ? `${quarterCount} quarters elapsed` : "Start simulating"}
          color={cagr !== null && cagr >= 0 ? "text-amber-400" : "text-red-400"}
          icon={<Percent size={14} className="inline mr-1 opacity-60" />}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LineChartIcon size={18} /> Equity Curve
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={val => `₹${(val / 100000).toFixed(1)}L`} width={64} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(val: any, name: any) => [formatINR(Number(val ?? 0)), String(name ?? "")]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Portfolio" stroke="#10b981" strokeWidth={3}
                  dot={{ fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Index" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5"
                  dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart size={18} /> Diversification
          </h3>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <Tooltip formatter={(value: any) => formatINR(Number(value ?? 0))}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-500">No active investments</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Holdings + Sidebar ── */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Holdings Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold text-white">Holdings</h3>
          {portfolio.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-400">
              No active holdings. Review fundamentals and buy stocks from the market panel!
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Invested</th>
                    <th className="px-4 py-3">Current</th>
                    <th className="px-4 py-3">P&L</th>
                    <th className="px-4 py-3">CAGR</th>
                    <th className="px-4 py-3 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {portfolio.map(item => {
                    const company = companies.find(c => c.name === item.companyName);
                    const isProfit = item.currentValue >= item.costBasis;
                    const pl = item.currentValue - item.costBasis;
                    const plPercent = (pl / item.costBasis) * 100;
                    const sellVal = sellAmounts[item.companyName] ?? item.currentValue.toString();

                    return (
                      <tr key={item.companyName} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4 min-w-[140px]">
                          <div className="font-bold text-white"><CompanyLink companyName={item.companyName} /></div>
                          <div className="text-xs text-slate-500">{company?.sector}</div>
                        </td>
                        <td className="px-4 py-4">{formatINR(item.costBasis)}</td>
                        <td className="px-4 py-4 font-medium text-blue-400">{formatINR(item.currentValue)}</td>
                        <td className={`px-4 py-4 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}{plPercent.toFixed(2)}%
                          <div className="text-xs font-normal opacity-75">{isProfit ? '+' : ''}{formatINR(pl)}</div>
                        </td>
                        <td className={`px-4 py-4 font-mono text-xs ${plPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {calculateCAGR(item.costBasis, item.currentValue, quarterCount)?.toFixed(1) ?? "—"}%
                        </td>
                        <td className="px-4 py-4 text-right pr-6 min-w-[160px]">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={sellVal === "" ? "" : Number(sellVal).toLocaleString("en-IN")}
                                onChange={e => {
                                  const raw = e.target.value.replace(/[^\d]/g, '');
                                  setSellAmounts({ ...sellAmounts, [item.companyName]: raw });
                                }}
                                className="w-24 bg-slate-900 border border-slate-700 text-white text-[11px] rounded px-2 py-1 focus:outline-none focus:border-red-500 text-right"
                                placeholder="Amt"
                              />
                              <button
                                onClick={() => {
                                  const amt = parseInt(sellVal, 10);
                                  if (isNaN(amt) || amt <= 0) return alert("Invalid amount.");
                                  if (amt > item.currentValue) return alert("Cannot sell more than current value.");
                                  sellStock(item.companyName, amt);
                                }}
                                className="text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2.5 py-1 rounded transition-colors text-xs font-semibold"
                              >
                                Sell
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                              {sellVal ? `Val: ${formatINR(Number(sellVal))}` : "₹0"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Market Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-emerald-500" /> Market
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Select Company</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-colors"
                  value={selectedCompanyName}
                  onChange={e => setSelectedCompanyName(e.target.value)}
                >
                  {companies.map(c => (
                    <option key={c.name} value={c.name}>{c.name} ({c.sector})</option>
                  ))}
                </select>
              </div>

              {/* Enhanced Company Snapshot */}
              {selectedCompany && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Activity size={15} className="text-emerald-400" />
                    <CompanyLink companyName={selectedCompany.name}>{selectedCompany.name}</CompanyLink>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <MetricRow label="Price" value={formatINR(selectedCompany.current_price)} />
                    <MetricRow label="Intrinsic" value={formatINR(selectedCompany.intrinsic_value)} />
                    <MetricRow label="P/E" value={`${selectedCompany.pe} (Ind: ${selectedCompany.industry_pe})`} />
                    <MetricRow label="ROE" value={`${selectedCompany.roe}%`} color="text-emerald-400" />
                    <MetricRow label="Revenue Growth" value={`${selectedCompany.revenue_growth}%`}
                      color={selectedCompany.revenue_growth >= 10 ? "text-emerald-400" : "text-amber-400"} />
                    <MetricRow label="Profit Growth" value={`${selectedCompany.profit_growth}%`}
                      color={selectedCompany.profit_growth >= 12 ? "text-emerald-400" : "text-amber-400"} />
                    <MetricRow label="Profit Margin" value={`${selectedCompany.profit_margin}%`}
                      color={selectedCompany.profit_margin >= 15 ? "text-emerald-400" : "text-amber-400"} />
                    <MetricRow label="Debt/Equity" value={`${selectedCompany.debt_to_equity}`}
                      color={selectedCompany.debt_to_equity > 1.5 ? "text-red-400" : "text-slate-300"} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <TrendBadge trend={selectedCompany.margin_trend} />
                    <TrendBadge trend={selectedCompany.profit_trend} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">Investment Amount (₹)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={e => setTradeAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
                  placeholder="Enter amount to invest"
                />
              </div>

              <button
                onClick={handleBuy}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Buy {selectedCompany?.name ?? "Stock"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── News Feed ── */}
      <NewsFeed items={newsFeed} />
    </div>
  );
}

// ── Sub-Components ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, sub, color = "text-white", icon }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-slate-400 font-medium text-sm mb-1">{label}</h3>
      <p className={`text-xl font-bold leading-tight ${color}`}>{icon}{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  color?: string;
}

function MetricRow({ label, value, color = "text-slate-200" }: MetricRowProps) {
  return (
    <div>
      <span className="text-slate-500 block">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function NewsFeed({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
          <Newspaper size={18} className="text-amber-400" /> Market News Feed
        </h3>
        <p className="text-slate-500 text-sm">No market events yet. Advance a quarter to generate news.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Newspaper size={18} className="text-amber-400" /> Market News Feed
        <span className="ml-auto text-xs text-slate-500 font-normal">{items.length} events</span>
      </h3>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {items.map((item, i) => {
          const isNeg = item.includes("📉") || item.includes("⚠️") || item.includes("🔻");
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm
                ${isNeg
                  ? "bg-red-500/5 border-red-500/20 text-red-300"
                  : "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                }`}
            >
              {isNeg
                ? <TrendingDown size={15} className="flex-shrink-0 mt-0.5 text-red-400" />
                : <TrendingUp size={15} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              }
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
