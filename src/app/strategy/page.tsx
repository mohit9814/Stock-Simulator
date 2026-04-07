"use client";

import { useGameState } from "@/game/GameStateProvider";
import { Strategy } from "@/types";
import { formatINR } from "@/lib/formatINR";
import { Plus, Trash2, ToggleLeft, ToggleRight, Bot, Info, Percent } from "lucide-react";
import { useState } from "react";

const EMPTY_FORM: Omit<Strategy, "id"> = {
  name: "",
  minRoe: 15,
  maxPe: 35,
  maxDebt: 1.0,
  minProfitGrowth: 10,
  minRevenueGrowth: 10,
  maxSectorPct: 30,
  pctCashPerCompany: 5,
  rebalanceFrequency: 1,
  stopLossPct: 15,
  takeProfitPct: 40,
  sellIfCriteriaFailed: true,
  enabled: true,
};

export default function StrategyPage() {
  const { strategies, addStrategy, removeStrategy, toggleStrategy, quarterCount, tradeLog } = useGameState();
  const [form, setForm] = useState<Omit<Strategy, "id">>({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);

  const handleSave = () => {
    if (!form.name.trim()) return alert("Give your strategy a name");
    addStrategy(form);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Bot size={28} className="text-purple-400" /> Strategy Engine
          </h2>
          <p className="text-slate-400">
            Define rules to automatically buy companies matching your criteria each quarter,
            respecting sector diversification limits.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex-shrink-0"
        >
          <Plus size={16} /> New Strategy
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-3">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200 space-y-1">
          <p className="font-semibold text-blue-300">How strategies work</p>
          <p>Every time you advance a quarter, <span className="text-blue-400 text-xs">enabled strategies run automatically</span>. They first apply <strong>exit rules</strong> (stop-loss, take-profit, criteria violation, sector trim), then scan all companies using entry filters (ROE, PE, debt, growth) and invest the specified <strong>percentage of your available cash</strong> per qualifying company — as long as you have funds.</p>
          <p className="text-blue-400 text-xs">Note: Diversification limits (Max Sector %) are now calculated against your <strong>Total Networth (NAV)</strong>, not just invested cash. This ensures large cash reserves don't block your strategy from buying into sectors early.</p>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">New Strategy</h3>
            <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 text-xs font-medium flex items-center gap-1.5">
              <Percent size={12} /> Cash-Based Deployment
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Strategy Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Quality Growth"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { key: "minRoe", label: "Min ROE (%)", step: "1" },
              { key: "maxPe", label: "Max P/E", step: "0.1" },
              { key: "maxDebt", label: "Max Debt/Equity", step: "0.1" },
              { key: "minProfitGrowth", label: "Min Profit Gr.(%)", step: "1" },
              { key: "minRevenueGrowth", label: "Min Revenue Gr.(%)", step: "1" },
              { key: "maxSectorPct", label: "Max Sector % of portfolio", step: "5" },
              { key: "pctCashPerCompany", label: "% of Cash per Co", step: "0.5" },
              { key: "rebalanceFrequency", label: "Every N Quarters", step: "1" },
            ] as { key: keyof typeof form; label: string; step: string }[]).map(field => (
              <div key={field.key}>
                <label className="text-xs text-slate-400 mb-1 block">{field.label}</label>
                <input
                  type="number"
                  step={field.step}
                  value={String(form[field.key])}
                  onChange={e => setForm(p => ({ ...p, [field.key]: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}
            <div className="flex flex-col justify-end">
              <label className="text-xs text-slate-400 mb-1 block">Active on Start</label>
              <button
                onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors
                  ${form.enabled ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
              >
                {form.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {form.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          {/* Exit Rules */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Exit Rules</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Stop-Loss (% drop, 0=off)</label>
                <input type="number" step="5" min="0" max="100"
                  value={form.stopLossPct}
                  onChange={e => setForm(p => ({ ...p, stopLossPct: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Take-Profit (% gain, 0=off)</label>
                <input type="number" step="5" min="0" max="500"
                  value={form.takeProfitPct}
                  onChange={e => setForm(p => ({ ...p, takeProfitPct: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="text-xs text-slate-400 mb-1 block">Sell if Criteria Fails</label>
                <button
                  onClick={() => setForm(p => ({ ...p, sellIfCriteriaFailed: !p.sellIfCriteriaFailed }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors
                    ${form.sellIfCriteriaFailed ? "bg-red-600/20 border-red-500/40 text-red-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                >
                  {form.sellIfCriteriaFailed ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {form.sellIfCriteriaFailed ? "Yes — Exit on violation" : "No — Hold anyway"}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-950 rounded-xl p-4 text-xs text-slate-400 border border-slate-800 space-y-1">
            <div><span className="text-slate-300 font-medium">Entry: </span>
              Every {form.rebalanceFrequency === 1 ? "quarter" : `${form.rebalanceFrequency} quarters`},
              invest <span className="text-purple-400 font-bold">{form.pctCashPerCompany}% of free cash</span> into companies with ROE ≥ {form.minRoe}%, PE ≤ {form.maxPe},
              Debt/Eq ≤ {form.maxDebt}, Profit Growth ≥ {form.minProfitGrowth}%, Revenue Growth ≥ {form.minRevenueGrowth}%, capped at {form.maxSectorPct}% of NAV per sector.
            </div>
            <div><span className="text-slate-300 font-medium">Exit: </span>
              {form.stopLossPct > 0 ? `Sell on −${form.stopLossPct}% loss. ` : "No stop-loss. "}
              {form.takeProfitPct > 0 ? `Sell on +${form.takeProfitPct}% gain. ` : "No take-profit. "}
              {form.sellIfCriteriaFailed ? "Exit when fundamentals deteriorate (including Revenue/Profit growth drops below threshold)." : "Hold even if criteria fail."}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
              Save Strategy
            </button>
            <button onClick={() => setShowForm(false)} className="bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Strategy List */}
      {strategies.length === 0 && !showForm ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500">
          No strategies yet. Create your first auto-invest rule above.
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map(s => {
            const strategyTrades = tradeLog.filter(t => t.source === s.name);
            const lastQTrades = strategyTrades.filter(t => t.quarter === quarterCount);
            const lastQBuy = lastQTrades.filter(t => t.type === "buy").reduce((sum, t) => sum + t.amount, 0);
            const lastQSell = lastQTrades.filter(t => t.type === "sell").reduce((sum, t) => sum + t.amount, 0);

            return (
              <div key={s.id} className={`bg-slate-900 border rounded-2xl p-5 transition-all
                ${s.enabled ? "border-purple-500/30" : "border-slate-800 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{s.name}</h3>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <Chip label={`ROE ≥ ${s.minRoe}%`} color="green" />
                        <Chip label={`PE ≤ ${s.maxPe}`} color="blue" />
                        <Chip label={`Debt ≤ ${s.maxDebt}`} color="amber" />
                        <Chip label={`Profit Gr ≥ ${s.minProfitGrowth}%`} color="green" />
                        <Chip label={`Rev Gr ≥ ${s.minRevenueGrowth}%`} color="green" />
                        <Chip label={`Sector ≤ ${s.maxSectorPct}%`} color="purple" />
                        <Chip label={`${s.pctCashPerCompany}% Cash/co`} color="blue" />
                        <Chip label={`Freq: ${s.rebalanceFrequency}Q`} color="gray" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.stopLossPct > 0 && <Chip label={`SL −${s.stopLossPct}%`} color="red" />}
                      {s.takeProfitPct > 0 && <Chip label={`TP +${s.takeProfitPct}%`} color="teal" />}
                      {s.sellIfCriteriaFailed && <Chip label="Exit on fail" color="amber" />}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Last Quarter Activity</p>
                      <p className="text-xs font-bold">
                        <span className="text-emerald-400">+{formatINR(lastQBuy)}</span>
                        <span className="text-slate-600 mx-1">|</span>
                        <span className="text-red-400">-{formatINR(lastQSell)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const { id, ...rest } = s;
                          setForm({ ...rest, name: `${s.name} (Copy)` });
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => toggleStrategy(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                          ${s.enabled
                            ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"}`}
                      >
                        {s.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {s.enabled ? "Active" : "Paused"}
                      </button>
                      <button
                        onClick={() => removeStrategy(s.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Delete strategy"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ label, color }: { label: string; color: "green" | "blue" | "amber" | "purple" | "gray" | "red" | "teal" }) {
  const colorMap = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    gray: "bg-slate-700/40 text-slate-300 border-slate-700",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };
  return (
    <span className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-tight ${colorMap[color]}`}>
      {label}
    </span>
  );
}
