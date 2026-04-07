"use client";

import Link from "next/link";
import { useGameState } from "@/game/GameStateProvider";
import { getNextLevelXP, LEVELS } from "@/game/engine";
import { usePathname } from "next/navigation";
import { formatINR } from "@/lib/formatINR";
import { useState, useMemo } from "react";
import { LevelingModal } from "./LevelingModal";
import { calculateRiskMetrics } from "@/lib/riskMetrics";

export default function NavBar() {
  const { xp, level, cash, username, resetGame, history } = useGameState();
  const pathname = usePathname();
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  const metrics = useMemo(() => calculateRiskMetrics(history), [history]);

  const navLinks = [
    { name: "Home",        href: "/" },
    { name: "Screener",    href: "/screener" },
    { name: "Portfolio",   href: "/portfolio" },
    { name: "Reports",     href: "/reports" },
    { name: "Strategy",    href: "/strategy" },
    { name: "Challenges",  href: "/challenge" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];


  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-emerald-400 tracking-tight">
            StockSim 📈
          </Link>
          <div className="flex gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors border-b-2 py-1 ${
                  pathname === link.href ? "text-emerald-400 border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <button 
            onClick={() => setIsLevelModalOpen(true)}
            className="flex flex-col gap-1 items-end min-w-[200px] hover:opacity-80 transition-opacity text-right group"
          >
             <div className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-slate-200">
               <span className="font-bold text-slate-300">{username || "Investor"}</span>
               <span className="text-slate-600">•</span>
               <span>{level}</span>
               <span className="text-slate-600">•</span>
               <span>{xp} XP</span>
             </div>
             {(() => {
               const nextXP = getNextLevelXP(xp);
               const currentLevelMin = LEVELS.find(l => l.name === level)?.minXP || 0;
               const range = nextXP ? nextXP - currentLevelMin : 1;
               const progress = nextXP ? ((xp - currentLevelMin) / range) * 100 : 100;
               return (
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                   <div 
                     className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                     style={{ width: `${Math.min(100, progress)}%` }} 
                   />
                 </div>
               );
             })()}
          </button>
          
          <div className="h-8 w-px bg-slate-800 mx-1 md:block hidden" />
          <div className="bg-slate-800/80 px-4 py-1.5 rounded-xl text-emerald-400 border border-emerald-500/20 font-bold shadow-sm">
            {formatINR(cash)}
          </div>
          <button 
            onClick={resetGame}
            title="Restart Journey"
            className="text-slate-500 hover:text-red-400 transition-colors ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      <LevelingModal 
        isOpen={isLevelModalOpen} 
        onClose={() => setIsLevelModalOpen(false)} 
        currentXP={xp}
        currentLevel={level}
        metrics={metrics}
      />
    </nav>
  );
}
