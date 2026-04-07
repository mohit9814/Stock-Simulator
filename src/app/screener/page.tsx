"use client";

import { useState } from "react";
import companiesData from "@/data/companies.json";
import { Company } from "@/types";
import { Search, SlidersHorizontal, ArrowUpDown, ShoppingCart, TrendingDown, Download } from "lucide-react";
import CompanyLink from "@/components/CompanyLink";
import { formatINR } from "@/lib/formatINR";
import { useGameState } from "@/game/GameStateProvider";
import { useToast } from "@/components/Toast";

// ── Filter criteria config ──────────────────────────────────────────────────
interface NumericFilter {
  key: keyof Company;
  label: string;
  min: string;
  max: string;
}

const DEFAULT_FILTERS: NumericFilter[] = [
  { key: "pe",             label: "P/E",           min: "", max: "" },
  { key: "roe",            label: "ROE (%)",        min: "", max: "" },
  { key: "debt_to_equity", label: "Debt/Eq",        min: "", max: "" },
  { key: "profit_growth",  label: "Profit Gr.(%)",  min: "", max: "" },
  { key: "revenue_growth", label: "Rev Gr.(%)",     min: "", max: "" },
  { key: "profit_margin",  label: "Margin (%)",     min: "", max: "" },
  { key: "dividend_yield", label: "Div Yld (%)",    min: "", max: "" },
];

type SortKey = keyof Company | "none";

export default function ScreenerPage() {
  const { cash, buyStock, sellStock, portfolio, companies } = useGameState();
  const { showToast, ToastRenderer } = useToast();

  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [sortConfig, setSortConfig]       = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "none", direction: "asc" });
  const [filters, setFilters]             = useState<NumericFilter[]>(DEFAULT_FILTERS.map(f => ({ ...f })));
  const [showFilters, setShowFilters]     = useState(false);
  const [buyAmounts, setBuyAmounts]       = useState<Record<string, string>>({});

  const sectors = ["All", ...Array.from(new Set(companies.map(c => c.sector)))];

  const handleSort = (key: keyof Company) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const updateFilter = (idx: number, field: "min" | "max", value: string) => {
    setFilters(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS.map(f => ({ ...f })));

  const downloadCSV = () => {
    const headers = ["Name", "Sector", "Price", "PE", "ROE", "ROCE", "Debt/Eq", "Rev Growth", "Profit Growth", "Margin", "PEG", "Div Yield"];
    const rows = filteredData.map(c => [
      c.name,
      c.sector,
      c.current_price,
      c.pe,
      c.roe,
      c.roce,
      c.debt_to_equity,
      c.revenue_growth,
      c.profit_growth,
      c.profit_margin,
      c.peg_ratio,
      c.dividend_yield
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `screener_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ message: "📁 Screener results downloaded as CSV" });
  };

  const filteredData = companies
    .filter(c => {
      if (!c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedSector !== "All" && c.sector !== selectedSector) return false;
      for (const f of filters) {
        const val = Number(c[f.key]);
        if (f.min !== "" && val < Number(f.min)) return false;
        if (f.max !== "" && val > Number(f.max)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortConfig.key === "none") return 0;
      const k = sortConfig.key as keyof Company;
      if (k === "name" || k === "sector") {
        const va = String(a[k]).toLowerCase();
        const vb = String(b[k]).toLowerCase();
        return sortConfig.direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const va = Number(a[k]);
      const vb = Number(b[k]);
      return sortConfig.direction === "asc" ? va - vb : vb - va;
    });

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: keyof Company }) => (
    <th
      className="px-4 py-3 cursor-pointer hover:bg-slate-700/50 transition-colors whitespace-nowrap"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
        {label}
        <ArrowUpDown size={12} className={sortConfig.key === sortKey ? "text-emerald-400" : "text-slate-600"} />
      </div>
    </th>
  );

  return (
    <div className="max-w-full xl:max-w-[96rem] mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 px-4">
      {ToastRenderer}
      <div className="mb-2">
        <h2 className="text-3xl font-bold text-white mb-2">Market Screener</h2>
        <p className="text-slate-400">Discover and analyze potential investments. Filter, sort, and trade inline.</p>
      </div>

      {/* Search + sector + filter toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-500" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SlidersHorizontal size={16} className="text-slate-500" />
          </div>
          <select
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
          >
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2
            ${showFilters ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"}`}
        >
          <SlidersHorizontal size={14} /> Criteria
        </button>
        <button
          onClick={downloadCSV}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <Download size={14} /> Download
        </button>
      </div>

      {/* Numeric filter panel */}
      {showFilters && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Filter Criteria</h3>
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filters.map((f, i) => (
              <div key={f.key} className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">{f.label}</label>
                <input
                  type="number"
                  placeholder="Min"
                  value={f.min}
                  onChange={e => updateFilter(i, "min", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={f.max}
                  onChange={e => updateFilter(i, "max", e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500">{filteredData.length} companies match your criteria</p>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400">
            <tr>
              <SortHeader label="Company"       sortKey="name" />
              <SortHeader label="Sector"        sortKey="sector" />
              <th className="px-4 py-3 text-xs uppercase tracking-wider whitespace-nowrap">Price</th>
              <SortHeader label="P/E"           sortKey="pe" />
              <SortHeader label="ROE %"         sortKey="roe" />
              <SortHeader label="ROCE %"        sortKey="roce" />
              <SortHeader label="Debt/Eq"       sortKey="debt_to_equity" />
              <SortHeader label="Rev Gr%"       sortKey="revenue_growth" />
              <SortHeader label="Profit Gr%"    sortKey="profit_growth" />
              <SortHeader label="Margin%"       sortKey="profit_margin" />
              <SortHeader label="PEG"           sortKey="peg_ratio" />
              <SortHeader label="Div Yld%"      sortKey="dividend_yield" />
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-right">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredData.map(company => {
              const holding = portfolio.find(p => p.companyName === company.name);
              const buyAmt = buyAmounts[company.name] ?? "";

              return (
                <tr key={company.name} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                    <CompanyLink companyName={company.name} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-[10px]">{company.sector}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{formatINR(company.current_price)}</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-semibold ${company.pe > company.industry_pe ? "text-red-400" : "text-emerald-400"}`}>
                    {company.pe}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-blue-400 font-semibold">{company.roe}%</td>
                  <td className="px-4 py-3 whitespace-nowrap">{company.roce}%</td>
                  <td className={`px-4 py-3 whitespace-nowrap font-semibold ${company.debt_to_equity > 1 ? "text-red-400" : "text-emerald-400"}`}>
                    {company.debt_to_equity}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${company.revenue_growth >= 10 ? "text-emerald-400" : "text-amber-400"}`}>
                    {company.revenue_growth}%
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${company.profit_growth >= 12 ? "text-emerald-400" : "text-amber-400"}`}>
                    {company.profit_growth}%
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${company.profit_margin >= 15 ? "text-emerald-400" : "text-amber-400"}`}>
                    {company.profit_margin}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{company.peg_ratio}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{company.dividend_yield}%</td>

                  {/* Inline Trade */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        placeholder="₹"
                        value={buyAmt}
                        onChange={e => setBuyAmounts(prev => ({ ...prev, [company.name]: e.target.value }))}
                        className="w-20 bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs text-right focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => {
                          const amt = parseInt(buyAmt, 10);
                          if (isNaN(amt) || amt <= 0) return showToast({ message: "Enter a valid amount", type: "error" });
                          if (amt > cash) return showToast({ message: "Insufficient funds", type: "error" });
                          buyStock(company.name, amt);
                          showToast({ message: `✅ Bought ${formatINR(amt)} of ${company.name}` });
                          setBuyAmounts(prev => ({ ...prev, [company.name]: "" }));
                        }}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors"
                        title="Buy"
                      >
                        <ShoppingCart size={13} />
                      </button>
                      {holding && (
                        <button
                          onClick={() => {
                            const amt = parseInt(buyAmt, 10);
                            if (isNaN(amt) || amt <= 0) return showToast({ message: "Enter a valid sell amount", type: "error" });
                            if (amt > holding.currentValue) return showToast({ message: "Cannot sell more than current value", type: "error" });
                            sellStock(company.name, amt);
                            showToast({ message: `💰 Sold ${formatINR(amt)} of ${company.name}`, type: "success" });
                            setBuyAmounts(prev => ({ ...prev, [company.name]: "" }));
                          }}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                          title="Sell"
                        >
                          <TrendingDown size={13} />
                        </button>
                      )}
                    </div>
                    {holding && (
                      <p className="text-[10px] text-slate-500 mt-0.5 text-right">
                        Held: {formatINR(holding.currentValue)}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center text-slate-500">
                  No companies found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
