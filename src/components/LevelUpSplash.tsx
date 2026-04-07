"use client";

import React, { useEffect, useState } from "react";
import { useGameState } from "@/game/GameStateProvider";
import { LEVELS } from "@/game/engine";

export default function LevelUpSplash() {
  const { showLevelUp, acknowledgeLevelUp, level, xp, history } = useGameState();
  const [visible, setVisible] = useState(false);

  const metrics = React.useMemo(() => {
    if (history.length < 2) return null;
    const { calculateRiskMetrics } = require("@/lib/riskMetrics");
    return calculateRiskMetrics(history);
  }, [history]);

  useEffect(() => {
    if (showLevelUp) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [showLevelUp]);

  if (!showLevelUp) return null;

  const currentLevelObj = LEVELS.find(l => l.name === level);
  const nextLevelIndex = LEVELS.findIndex(l => l.name === level) + 1;
  const nextLevelObj = nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex] : null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-700 ${visible ? 'bg-black/90 backdrop-blur-xl opacity-100' : 'bg-black/0 backdrop-blur-0 opacity-0'}`}>
      <div className={`relative bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-10 max-w-xl w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] text-center transition-all duration-700 delay-100 transform ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-75 translate-y-10 opacity-0'}`}>
        
        {/* Animated Particles (CSS only) */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 4 + 2}s`,
                opacity: 0.2
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">
            PROMOTED!
          </h1>
          <p className="text-emerald-400 font-bold text-xl mb-8 tracking-widest uppercase">
            New Appointment Confirmed
          </p>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-8 border border-slate-700/50 mb-8 shadow-inner">
            <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-2 font-bold">New Rank</p>
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">{level}</h2>
            <div className="h-1 w-24 bg-emerald-500 mx-auto rounded-full mb-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <p className="text-slate-400 text-sm italic px-6 leading-relaxed">
              "{currentLevelObj?.description || "Your dominance on the Street continues to grow."}"
            </p>
          </div>

          <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30 mb-8 text-left backdrop-blur-sm">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="p-1 px-2 bg-emerald-500/10 rounded text-[10px]">REPORT</span>
              Analyst Performance Post-Mortem
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Portfolio Alpha</p>
                    <p className={`text-xl font-mono font-bold ${(metrics?.alpha || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {metrics ? `${(metrics.alpha * 100).toPrecision(3)}%` : "Calculating..."}
                    </p>
                  </div>
                  <div className="space-y-1 text-center border-x border-slate-700/30">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Sharpe Ratio</p>
                    <p className={`text-xl font-mono font-bold ${(metrics?.sharpeRatio || 0) > 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {metrics ? metrics.sharpeRatio.toFixed(2) : "Calculating..."}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Max Drawdown</p>
                    <p className={`text-xl font-mono font-bold ${(metrics?.maxDrawdown || 0) > -0.15 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {metrics ? `${(metrics.maxDrawdown * 100).toFixed(1)}%` : "Calculating..."}
                    </p>
                  </div>
                </div>
               
               <p className="text-slate-300 text-sm leading-relaxed border-l-4 border-emerald-500/20 pl-4 py-1 italic bg-emerald-500/5 rounded-r-lg">
                {metrics ? (() => {
                  const isBeatingAbsolute = metrics.totalReturn > metrics.indexReturn;
                  const isBeatingRiskAdjusted = metrics.alpha > 0;

                  if (isBeatingAbsolute && isBeatingRiskAdjusted) {
                    return "Outstanding! You are dominating in both absolute and risk-adjusted terms. Excellent selection.";
                  } else if (isBeatingRiskAdjusted) {
                    return "Promotion granted for risk-adjusted excellence. You have positive Alpha, meaning you are beating expectations for your lower risk level, even if the absolute Index leads right now.";
                  } else if (isBeatingAbsolute) {
                    return "Absolute win, but watch your risk. You beat the index, but your Alpha is low—you might be taking excessive risk to get these returns.";
                  } else {
                    return "Promotion granted on persistence. Focus on companies with higher ROE (>20%) and check if your sector allocation is too concentrated.";
                  }
                })() : "Calculating performance metrics..."}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-slate-800/40 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">XP Power</p>
              <p className="text-2xl font-bold text-white">{xp}</p>
            </div>
            {nextLevelObj && (
              <div className="flex-1 bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                <p className="text-amber-500 text-[10px] uppercase font-bold mb-1">Next Goal</p>
                <p className="text-sm font-bold text-slate-200">{nextLevelObj.name}</p>
                <p className="text-[10px] text-amber-600 font-medium">@{nextLevelObj.minXP} XP</p>
              </div>
            )}
          </div>

          <button
            onClick={acknowledgeLevelUp}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-5 px-8 rounded-2xl transform transition active:scale-95 shadow-xl shadow-emerald-500/20 text-lg uppercase tracking-widest"
          >
            Stay Hungry
          </button>
        </div>
      </div>

    </div>
  );
}
