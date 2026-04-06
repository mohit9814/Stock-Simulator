"use client";

import { useState, useEffect } from "react";
import companiesData from "@/data/companies.json";
import { Company } from "@/types";
import { generateTotalScore } from "@/game/engine";
import { useGameState } from "@/game/GameStateProvider";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import CompanyLink from "@/components/CompanyLink";
import { formatINR } from "@/lib/formatINR";

export default function ChallengePage() {
  const { addXP } = useGameState();
  const [optionA, setOptionA] = useState<Company | null>(null);
  const [optionB, setOptionB] = useState<Company | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; xpChange: number; reasonA: number; reasonB: number } | null>(null);

  const loadNewChallenge = () => {
    setResult(null);
    const shuffled = [...companiesData].sort(() => 0.5 - Math.random());
    setOptionA(shuffled[0] as Company);
    setOptionB(shuffled[1] as Company);
  };

  useEffect(() => {
    loadNewChallenge();
  }, []);

  const handleChoice = (selected: Company, other: Company) => {
    if (result) return; // Prevent multiple clicks

    const scoreSelected = generateTotalScore(selected);
    const scoreOther = generateTotalScore(other);

    const isCorrect = scoreSelected >= scoreOther;
    const xpChange = isCorrect ? 10 : -5;

    addXP(xpChange);
    setResult({ isCorrect, xpChange, reasonA: scoreSelected, reasonB: scoreOther });
  };

  if (!optionA || !optionB) return <div className="text-center py-20">Loading challenge...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">Which is the better investment?</h2>
        <p className="text-slate-400">Analyze the fundamentals and make your choice.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {[optionA, optionB].map((company, index) => {
          const otherCompany = index === 0 ? optionB : optionA;
          const score = generateTotalScore(company);
          let borderColor = "border-slate-800";
          
          if (result) {
              if (company === optionA && result.reasonA >= result.reasonB) borderColor = "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              else if (company === optionB && result.reasonB >= result.reasonA) borderColor = "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
              else borderColor = "border-red-500/50";
          }

          return (
            <div 
              key={company.name} 
              onClick={() => !result && handleChoice(company, otherCompany)}
              className={`bg-slate-900 border-2 ${borderColor} rounded-2xl p-6 transition-all ${!result ? 'hover:border-slate-600 hover:scale-[1.02] cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    <CompanyLink companyName={company.name} />
                  </h3>
                  <span className="text-sm font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full mt-2 inline-block">
                    {company.sector}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-slate-500 uppercase">Intrinsic Val</span>
                  <span className="font-bold text-emerald-400">{formatINR(company.intrinsic_value)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">P/E Ratio</span>
                  <span className={`font-bold ${company.pe > company.industry_pe ? 'text-red-400' : 'text-emerald-400'}`}>{company.pe}</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">PEG Ratio</span>
                  <span className="font-bold text-white">{company.peg_ratio}</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">ROE</span>
                  <span className={`font-bold ${company.roe < 15 ? 'text-red-400' : 'text-emerald-400'}`}>{company.roe}%</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">ROCE</span>
                  <span className={`font-bold ${company.roce < 15 ? 'text-red-400' : 'text-emerald-400'}`}>{company.roce}%</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">Debt/Eq</span>
                  <span className={`font-bold ${company.debt_to_equity > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{company.debt_to_equity}</span>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <span className="text-slate-400 text-xs block">Div Yield</span>
                  <span className="font-bold text-blue-400">{company.dividend_yield}%</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className={`text-[10px] px-2 py-1 rounded bg-slate-800 ${company.revenue_trend === 'Improving' ? 'text-emerald-400' : 'text-slate-300'}`}>Rev: {company.revenue_trend}</span>
                <span className={`text-[10px] px-2 py-1 rounded bg-slate-800 ${company.profit_trend === 'Improving' ? 'text-emerald-400' : 'text-slate-300'}`}>Profit: {company.profit_trend}</span>
                <span className={`text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300`}>Margins: {company.margin_trend}</span>
              </div>

              {result && (
                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                  <span className="text-slate-400 text-sm block mb-1">Fundamental Score</span>
                  <span className="text-2xl font-bold text-white">{score}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result && (
        <div className={`p-6 rounded-2xl border ${result.isCorrect ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-red-950/30 border-red-900/50'} animate-in fade-in slide-in-from-bottom-4`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-left">
              {result.isCorrect ? (
                <CheckCircle2 className="text-emerald-500 w-12 h-12 shrink-0" />
              ) : (
                <XCircle className="text-red-500 w-12 h-12 shrink-0" />
              )}
              <div>
                <h4 className={`text-xl font-bold mb-1 ${result.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.isCorrect ? 'Correct Analysis!' : 'Not Quite Right'}
                </h4>
                <p className="text-slate-300">
                  {result.isCorrect 
                    ? `Great job identifying the stronger fundamentals. You earned ${result.xpChange} XP.` 
                    : `The other company had a stronger fundamental score. You lost ${Math.abs(result.xpChange)} XP.`}
                </p>
              </div>
            </div>
            
            <button
              onClick={loadNewChallenge}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors shrink-0"
            >
              Next Challenge <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
