"use client";

import Link from "next/link";
import { useGameState } from "@/game/GameStateProvider";
import { usePathname } from "next/navigation";
import { formatINR } from "@/lib/formatINR";

export default function NavBar() {
  const { xp, level, cash, username, resetGame } = useGameState();
  const pathname = usePathname();

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
          <div className="bg-slate-800 px-3 py-1.5 rounded-full text-emerald-300 border border-emerald-900/30">
            {formatINR(cash)}
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-full text-blue-300 border border-blue-900/30 flex items-center gap-2">
            <span className="opacity-60">{username} •</span> {level} <span className="opacity-60 text-xs">({xp} XP)</span>
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
    </nav>
  );
}
