"use client";

import { useGameState } from "@/game/GameStateProvider";
import { simulatedBots, getBotCurrentStats } from "@/lib/leaderboardData";
import { Trophy, Medal, User, Crown } from "lucide-react";
import { formatINR } from "@/lib/formatINR";

export default function LeaderboardPage() {
  const { cash, portfolio, quarterCount, level, xp, username } = useGameState();

  const totalInvested = portfolio.reduce((acc, curr) => acc + curr.currentValue, 0);
  const userWealth = cash + totalInvested;

  const currentBots = simulatedBots.map(bot => getBotCurrentStats(bot, quarterCount));

  const allPlayers = [
    ...currentBots.map(b => ({
      id: b.id,
      name: b.name,
      avatar: b.avatar,
      type: "bot",
      wealth: b.currentWealth,
      xp: b.currentXp
    })),
    {
      id: "user",
      name: username || "Unknown Fund",
      avatar: "👤",
      type: "user",
      wealth: userWealth,
      xp: xp
    }
  ];

  // Sort by wealth
  const rankedPlayers = allPlayers.sort((a, b) => b.wealth - a.wealth);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-white mb-4 flex items-center justify-center gap-3">
          <Trophy className="text-amber-400" size={36} /> Global Leaderboard
        </h2>
        <p className="text-slate-400 text-lg">Compare your portfolio performance against top tier simulated investors.</p>
        <p className="text-slate-500 mt-2 text-sm">Quarter {quarterCount}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Investor</th>
                <th className="px-6 py-4 font-semibold text-right">Net Worth</th>
                <th className="px-6 py-4 font-semibold text-right">Exp Points (XP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rankedPlayers.map((player, index) => {
                const isUser = player.type === "user";
                const rank = index + 1;
                
                let RankIcon = null;
                if (rank === 1) RankIcon = <Crown className="text-amber-400" size={20} />;
                else if (rank === 2) RankIcon = <Medal className="text-slate-300" size={20} />;
                else if (rank === 3) RankIcon = <Medal className="text-amber-700" size={20} />;

                return (
                  <tr 
                    key={player.id} 
                    className={`transition-colors ${isUser ? "bg-emerald-900/20 hover:bg-emerald-900/30" : "hover:bg-slate-800/50"}`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold w-6 text-center ${rank <= 3 ? 'text-transparent' : 'text-slate-500'}`}>
                          {rank > 3 ? `#${rank}` : ''}
                        </span>
                        {RankIcon && <span>{RankIcon}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xl border border-slate-700">
                          {player.avatar}
                        </div>
                        <div>
                          <p className={`font-bold text-base ${isUser ? "text-emerald-400" : "text-white"}`}>
                            {player.name} {isUser && "(You)"}
                          </p>
                          <p className="text-xs text-slate-500">{isUser ? "Human Player" : "Simulated Fund"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`font-bold text-lg ${isUser ? "text-emerald-300" : "text-blue-400"}`}>
                        {formatINR(player.wealth)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-medium text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
                        {player.xp.toLocaleString()} XP
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
