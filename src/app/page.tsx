import Link from "next/link";
import { ArrowRight, TrendingUp, Trophy, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-12 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Indian Market</span>
        </h1>
        <p className="text-xl text-slate-400">
          Learn fundamental analysis, build a mock portfolio, and level up your investing skills in this gamified simulator.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/challenge"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25"
          >
            Start Learning <ArrowRight size={20} />
          </Link>
          <Link
            href="/portfolio"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600"
          >
            My Portfolio
          </Link>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Daily Challenges</h3>
          <p className="text-slate-400">Compare real-world inspired companies and learn what makes a stock fundamentally strong.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Build Portfolio</h3>
          <p className="text-slate-400">Use your simulated ₹10,00,000 capital to build a diversified portfolio and track performance.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4">
            <Trophy size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Level Up</h3>
          <p className="text-slate-400">Earn XP for correct analyses and level up from Beginner to Hedge Fund Manager.</p>
        </div>
      </div>
    </div>
  );
}
