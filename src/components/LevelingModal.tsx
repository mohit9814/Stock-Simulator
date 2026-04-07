"use client";

import React from "react";
import { X, Trophy, Target, ChevronRight, Lightbulb, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { LEVELS, getNextLevelXP } from "@/game/engine";

interface LevelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentXP: number;
  currentLevel: string;
  metrics?: {
    alpha: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    indexReturn: number;
  };
}

export function LevelingModal({ isOpen, onClose, currentXP, currentLevel, metrics }: LevelingModalProps) {
  if (!isOpen) return null;

  const currentLevelObj = LEVELS.find(l => l.name === currentLevel) || LEVELS[0];
  const nextXP = getNextLevelXP(currentXP);
  const nextLevelObj = nextXP !== null ? LEVELS.find(l => l.minXP === nextXP) : null;
  
  const progress = (nextXP !== null && nextXP > currentLevelObj.minXP)
    ? ((currentXP - currentLevelObj.minXP) / (nextXP - currentLevelObj.minXP)) * 100 
    : 100;

  const xpRemaining = nextXP !== null ? nextXP - currentXP : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Trophy className="text-amber-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Investor Ranking</h2>
              <p className="text-slate-400 text-sm">Your journey to the top of the Street</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Current Status */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Current Rank</p>
                <h3 className="text-2xl font-black text-white">{currentLevel}</h3>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total XP</p>
                <p className="text-2xl font-mono text-amber-400">{currentXP}</p>
              </div>
            </div>

            {nextLevelObj ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Progress to {nextLevelObj?.name || "Next Rank"}</span>
                  <span>{xpRemaining} XP more needed</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                <Target className="text-emerald-400" size={20} />
                <p className="text-emerald-400 text-sm font-medium">Ultimate Rank Achieved: Market Legend</p>
              </div>
            )}
          </div>

          {/* Analyst Post-Mortem / Performance Insights */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-emerald-400" size={16} />
              Analyst Post-Mortem
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Portfolio Alpha</p>
                <p className={`text-lg font-mono ${(metrics?.alpha || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {metrics ? `${(metrics.alpha * 100).toFixed(1)}%` : "--"}
                </p>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sharpe Ratio</p>
                <p className={`text-lg font-mono ${(metrics?.sharpeRatio || 0) > 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {metrics ? metrics.sharpeRatio.toFixed(2) : "--"}
                </p>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Max Drawdown</p>
                <p className={`text-lg font-mono ${(metrics?.maxDrawdown || 0) > -0.15 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metrics ? `${(metrics.maxDrawdown * 100).toFixed(1)}%` : "--"}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg h-fit">
                  <Zap className="text-amber-400" size={16} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-200 mb-1">Strategic Advice</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {metrics ? (() => {
                      const isBeatingAbsolute = metrics.totalReturn > metrics.indexReturn;
                      const isBeatingRiskAdjusted = metrics.alpha > 0;

                      if (isBeatingAbsolute && isBeatingRiskAdjusted) {
                        return "You are dominating! Beating the index in both absolute and risk-adjusted terms. Excellent stock selection.";
                      } else if (isBeatingRiskAdjusted) {
                        return "Strong defensive play. You have positive Alpha (risk-adjusted), meaning you are beating expectations for your lower risk level, even if the absolute Index leads right now.";
                      } else if (isBeatingAbsolute) {
                        return "Absolute win, but watch your risk. You beat the index, but your Alpha is low—you might be taking excessive beta risk to get these returns.";
                      } else {
                        return "The market is outperforming you. Look for companies with higher ROE (>20%) and check if your sector allocation is too concentrated.";
                      }
                    })() : "Continue simulating to gather more performance data."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips / Criteria */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="text-amber-400" size={16} />
              Next Milestone: {nextLevelObj?.name || "Market Legend"}
            </h4>
            
            <div className="space-y-3">
              {nextLevelObj && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    {nextLevelObj.tips}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-amber-500 font-bold bg-amber-500/10 px-3 py-2 rounded-lg">
                    <Target size={14} />
                    <span>Target: {nextLevelObj.minXP} Total XP</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors py-2 px-8"
          >
            Got it, Captain
          </button>
        </div>
      </div>
    </div>
  );
}
