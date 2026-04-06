import { Company } from "@/types";

export function calculateQualityScore(roe: number): number {
  if (roe > 20) return 2;
  if (roe >= 15 && roe <= 20) return 1;
  if (roe < 10) return -1;
  return 0;
}

export function calculateValuationScore(pe: number): number {
  if (pe < 20) return 2;
  if (pe >= 20 && pe <= 30) return 1;
  if (pe > 50) return -2;
  return 0;
}

export function calculateDebtScore(debt: number): number {
  if (debt < 0.5) return 2;
  if (debt >= 0.5 && debt <= 1) return 1;
  if (debt > 2) return -2;
  return 0;
}

export function calculateGrowthScore(growth: number): number {
  if (growth > 15) return 2;
  if (growth >= 10 && growth <= 15) return 1;
  if (growth < 5) return -1;
  return 0;
}

export function generateTotalScore(company: Company): number {
  // Taking average of revenue and profit growth for the growth score
  const avgGrowth = (company.revenue_growth + company.profit_growth) / 2;

  const quality = calculateQualityScore(company.roe);
  const valuation = calculateValuationScore(company.pe);
  const debt = calculateDebtScore(company.debt_to_equity);
  const growth = calculateGrowthScore(avgGrowth);

  return quality + valuation + debt + growth;
}

export const LEVELS = [
  { name: "Beginner", minXP: 0 },
  { name: "Analyst", minXP: 50 },
  { name: "Fund Manager", minXP: 150 },
  { name: "Portfolio Pro", minXP: 300 },
  { name: "Hedge Fund Manager", minXP: 500 },
];

export function getLevelFromXP(xp: number): string {
  let currentLevel = LEVELS[0].name;
  for (const level of LEVELS) {
    if (xp >= level.minXP) {
      currentLevel = level.name;
    } else {
      break;
    }
  }
  return currentLevel;
}

export function getNextLevelXP(xp: number): number | null {
  for (const level of LEVELS) {
    if (level.minXP > xp) {
      return level.minXP;
    }
  }
  return null; // Max level reached
}

export interface MarketEventResult {
  news: string[];
  multipliers: Record<string, number>;
}

/** Converts a simulation quarter count into a fiscal year label.
 *  Quarter 1 = FY2025 Q1, Quarter 5 = FY2026 Q1, etc. */
export function getQuarterLabel(quarter: number): string {
  const baseYear = 2025;
  const yearOffset = Math.floor((quarter - 1) / 4);
  const qInYear = ((quarter - 1) % 4) + 1;
  return `FY${baseYear + yearOffset} Q${qInYear}`;
}

export function generateMarketEvents(companies: Company[], quarter: number): MarketEventResult {
  const news: string[] = [];
  const multipliers: Record<string, number> = {};
  const tag = `[${getQuarterLabel(quarter)}]`;

  companies.forEach(c => multipliers[c.name] = 1.0);

  const roll = Math.random();

  // ── 1. GLOBAL / MACRO EVENTS (15% chance) ───────────────────────────────────
  if (roll < 0.15) {
    const macroRoll = Math.random();
    if (macroRoll < 0.25) {
      news.push(`${tag} 📈 Economic Boom: GDP growth exceeds 8%! Foreign institutional investors (FII) are pouring capital into the markets.`);
      companies.forEach(c => multipliers[c.name] *= (1 + (Math.random() * 0.12 + 0.05)));
    } else if (macroRoll < 0.50) {
      news.push(`${tag} 📉 Global Recession: Persistent inflation leads to aggressive rate hikes by the Fed. Equities face broad selling pressure.`);
      companies.forEach(c => multipliers[c.name] *= (1 - (Math.random() * 0.15 + 0.08)));
    } else if (macroRoll < 0.75) {
      news.push(`${tag} 🌏 Geopolitical Tension: Breaking news of border conflicts. Markets turn extremely volatile as oil prices spike.`);
      // Mixed impact: high impact on most, but maybe different for some
      companies.forEach(c => {
        const impact = c.sector === "Energy" ? (1 + Math.random() * 0.05) : (1 - (Math.random() * 0.12 + 0.03));
        multipliers[c.name] *= impact;
      });
    } else {
      news.push(`${tag} 🏦 RBI Policy News: Repo rate remains unchanged. Markets breathe a sigh of relief with a stable outlook.`);
      companies.forEach(c => multipliers[c.name] *= (1 + (Math.random() * 0.04 + 0.01)));
    }
  }

  // ── 2. SECTOR-SPECIFIC EVENTS (30% chance) ──────────────────────────────────
  if (Math.random() < 0.30) {
    const sectors = Array.from(new Set(companies.map(c => c.sector)));
    const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
    const sectorRoll = Math.random();

    if (sectorRoll < 0.3) {
      news.push(`${tag} 🚀 ${randomSector} Boost: New government subsidy program announced for the ${randomSector} industry.`);
      companies.filter(c => c.sector === randomSector).forEach(c => multipliers[c.name] *= (1 + (Math.random() * 0.15 + 0.05)));
    } else if (sectorRoll < 0.6) {
      news.push(`${tag} ⚠️ ${randomSector} Headwinds: Increasing raw material costs and supply chain disruptions hitting ${randomSector} margins.`);
      companies.filter(c => c.sector === randomSector).forEach(c => multipliers[c.name] *= (1 - (Math.random() * 0.12 + 0.04)));
    } else if (sectorRoll < 0.8) {
      news.push(`${tag} ⚖️ Regulatory Crackdown: Tighter norms for ${randomSector} companies causing short-term price correction.`);
      companies.filter(c => c.sector === randomSector).forEach(c => multipliers[c.name] *= (1 - (Math.random() * 0.08 + 0.02)));
    } else {
      news.push(`${tag} 💡 Tech Breakthrough: Innovation leader in ${randomSector} secures a major international patent.`);
      companies.filter(c => c.sector === randomSector).forEach(c => multipliers[c.name] *= (1 + (Math.random() * 0.08 + 0.02)));
    }
  }

  // ── 3. STOCK-SPECIFIC "BROKER" & "NEWS" EVENTS (1-3 events) ────────────────
  const numEvents = Math.floor(Math.random() * 3) + 1;
  const eventPool = [
    { text: "⭐ Broker Upgrade: BUY rating reiterated on {name} with an upside target of 25%.", impact: [0.03, 0.10] },
    { text: "🔻 Earnings Miss: {name} quarterly profits fall below analyst estimates.", impact: [-0.12, -0.04] },
    { text: "💎 Management Change: New CEO at {name} brings optimism for long-term turnaround.", impact: [0.04, 0.08] },
    { text: "⚠️ Audit Concerns: Rumors of accounting irregularities at {name} trigger panic selling.", impact: [-0.25, -0.10] },
    { text: "🤝 Strategic Acquisition: {name} announces intent to acquire a European rival.", impact: [0.05, 0.12] },
    { text: "📢 Contract Win: {name} bags a multi-million-dollar government infrastructure project.", impact: [0.06, 0.10] },
  ];

  const processedCos = new Set<string>();
  for (let i = 0; i < numEvents; i++) {
    const randomCo = companies[Math.floor(Math.random() * companies.length)];
    if (processedCos.has(randomCo.name)) continue;
    processedCos.add(randomCo.name);

    const event = eventPool[Math.floor(Math.random() * eventPool.length)];
    const newsText = event.text.replace("{name}", randomCo.name);
    
    news.push(`${tag} ${newsText}`);
    const mult = 1 + (Math.random() * (event.impact[1] - event.impact[0]) + event.impact[0]);
    multipliers[randomCo.name] *= mult;
  }

  return { news, multipliers };
}
