import { Company, MarketScenario } from "@/types";

export const SECTOR_PROFILES: Record<string, { beta: number; defensive: boolean }> = {
  "IT Services": { beta: 1.2, defensive: false },
  "Financial Services": { beta: 1.4, defensive: false },
  "FMCG": { beta: 0.6, defensive: true },
  "Pharma": { beta: 0.7, defensive: true },
  "Automobile": { beta: 1.3, defensive: false },
  "Cement": { beta: 1.1, defensive: false },
  "Energy": { beta: 0.9, defensive: true },
  "Consumer Durables": { beta: 1.2, defensive: false },
  "Metals & Mining": { beta: 1.6, defensive: false },
};

export const LEVELS = [
  { 
    name: "Beginner", 
    minXP: 0, 
    description: "New to the street. Learning the ropes.", 
    tips: "Focus on buying high-ROE companies with low PE ratios." 
  },
  { 
    name: "Analyst", 
    minXP: 100, // Was 50
    description: "Junior Analyst. Started digging into sector trends.", 
    tips: "Diversify into at least 3 sectors to protect against industry swings." 
  },
  { 
    name: "Fund Manager", 
    minXP: 500, // Was 150
    description: "Managing capital professionally. Eyes on the benchmark.", 
    tips: "Beat the market index consistently to earn high performance XP." 
  },
  { 
    name: "Portfolio Pro", 
    minXP: 2000, // Was 300
    description: "Seasoned veteran. Master of risk-adjusted returns.", 
    tips: "Maintain a Sharpe ratio above 1.5 to reach the elite tier." 
  },
  { 
    name: "Hedge Fund Manager", 
    minXP: 5000, // Was 500
    description: "Market Legend. Dictating trends, not just following them.", 
    tips: "Keep your Max Drawdown below 15% even during global crashes." 
  },
];

export function getLevelFromXP(xp: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i].name;
  }
  return LEVELS[0].name;
}

export function getLevelIndex(name: string): number {
  return LEVELS.findIndex(l => l.name === name);
}

export function getNextLevelXP(currentXP: number): number | null {
  const currentLevel = getLevelFromXP(currentXP);
  const currentIndex = getLevelIndex(currentLevel);
  if (currentIndex < LEVELS.length - 1) {
    return LEVELS[currentIndex + 1].minXP;
  }
  return null;
}

export interface MarketEventResult {
  news: string[];
  multipliers: Record<string, number>;
}

/** 
 * Quarter 1 = FY2025 Q1, Quarter 5 = FY2026 Q1, etc. */
export function getQuarterLabel(quarter: number): string {
  const baseYear = 2025;
  const yearOffset = Math.floor((quarter - 1) / 4);
  const qInYear = ((quarter - 1) % 4) + 1;
  return `FY${baseYear + yearOffset} Q${qInYear}`;
}

export function generateMarketEvents(
  companies: Company[], 
  quarter: number,
  activeRegime: string = "Normal",
  bubbleSector?: string,
  leaderSector?: string,
  activeScenario?: MarketScenario
): MarketEventResult & { newScenario?: MarketScenario } {
  const news: string[] = [];
  const multipliers: Record<string, number> = {};
  const tag = `[${getQuarterLabel(quarter)}]`;
  let marketDrift = 1.0;
  let regimeMsg = "";

  // 1. Check for/Trigger Cyclical Scenarios
  let currentScenario = activeScenario;
  
  if (!currentScenario) {
    const jitter = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    if ((quarter + jitter) % 40 === 0 && quarter > 0) {
      currentScenario = { type: "MEGA_CRASH", name: "Secular Bear Market (Mega Crash)", step: 0, totalSteps: 10, recoveryShape: Math.random() > 0.5 ? "U" : "W" };
    } else if ((quarter + jitter) % 20 === 0 && quarter > 0) {
      currentScenario = { type: "MAJOR_CRASH", name: "Cyclical Recession (Major Crash)", step: 0, totalSteps: 6, recoveryShape: Math.random() > 0.5 ? "V" : "U" };
    } else if ((quarter + jitter) % 8 === 0 && quarter > 0) {
      currentScenario = { type: "CORRECTION", name: "Market Correction", step: 0, totalSteps: 3, recoveryShape: "V" };
    }
  }

  if (currentScenario) {
    const { type, step, totalSteps, recoveryShape } = currentScenario;
    const isCrashPhase = step < Math.floor(totalSteps / 3);
    const isStagnationPhase = step >= Math.floor(totalSteps / 3) && step < Math.floor(totalSteps * 2 / 3);
    const isRecoveryPhase = step >= Math.floor(totalSteps * 2 / 3);

    if (isCrashPhase) {
      marketDrift = type === "MEGA_CRASH" ? 0.85 : type === "MAJOR_CRASH" ? 0.90 : 0.94;
      regimeMsg = `[CYCLE EVENT] ${currentScenario.name} - Initial Shock!`;
    } else if (isStagnationPhase) {
      if (recoveryShape === "U" || recoveryShape === "W") {
        marketDrift = 0.98 + Math.random() * 0.04; // Grinding sideways
        regimeMsg = `[CYCLE EVENT] ${currentScenario.name} - Bottoming out...`;
        if (recoveryShape === "W" && step === Math.floor(totalSteps / 2)) {
          marketDrift = 0.92; // The "W" dip
          regimeMsg = `[CYCLE EVENT] ${currentScenario.name} - False recovery! Secondary dip.`;
        }
      } else {
        marketDrift = 1.02; // V-shape recovery starts early
        regimeMsg = `[CYCLE EVENT] ${currentScenario.name} - V-Shaped Bounce underway!`;
      }
    } else if (isRecoveryPhase) {
      marketDrift = 1.03 + Math.random() * 0.03; // Strong bounce
      regimeMsg = `[CYCLE EVENT] ${currentScenario.name} - Final Recovery Phase.`;
    }
  } else {
    // Standard Regime Logic (only if no active scenario)
    switch (activeRegime) {
      case "Bull":
        marketDrift = 1.01 + Math.random() * 0.02; // 1% to 3% per quarter (4% to 12.5% annual)
        regimeMsg = "Markets are in a strong Bull phase. Risk-on sentiment is high.";
        break;
      case "Bear":
        marketDrift = 0.97 - Math.random() * 0.02; // -3% to -5% per quarter
        regimeMsg = "Persistent Bearish trends. Economic data remains weak.";
        break;
      case "Bubble":
        marketDrift = 1.03 + Math.random() * 0.03; // 3% to 6% per quarter
        regimeMsg = `The ${bubbleSector} sector is experiencing explosive euphoria!`;
        break;
      case "Crash":
        marketDrift = 0.88 + Math.random() * 0.05; // -7% to -12% per quarter
        regimeMsg = "Market Contagion! Panic selling across all sectors.";
        break;
      case "Recovery":
        marketDrift = 1.015 + Math.random() * 0.025; // 1.5% to 4% per quarter
        regimeMsg = "Economic recovery underway. Value emerging in leaders.";
        break;
      case "World Crisis":
        marketDrift = 0.96 + Math.random() * 0.02; // -2% to -4% per quarter
        regimeMsg = "Geopolitical Tensions! Equities under pressure.";
        break;
      case "Sector Mania":
        marketDrift = 1.005 + Math.random() * 0.015; // General market mildly up
        regimeMsg = `The ${bubbleSector} craze is driving thematic euphoria!`;
        break;
      default:
        marketDrift = 1.0 + (Math.random() * 0.015 - 0.0075); // -0.75% to +0.75% per quarter
    }
  }

  if (regimeMsg) news.push(`${tag} 📊 REGIME STATUS: ${regimeMsg}`);

  // 2. Calculate Base Multipliers for all companies
  companies.forEach(c => {
    let multiplier = marketDrift;
    const profile = SECTOR_PROFILES[c.sector] || { beta: 1.0, defensive: false };

    // Apply Beta sensitivity
    if (marketDrift > 1) {
      multiplier = 1 + (marketDrift - 1) * profile.beta;
    } else if (marketDrift < 1) {
      const isExtremeDown = activeRegime === "Crash" || activeRegime === "World Crisis";
      const resilienceFactor = profile.defensive ? (isExtremeDown ? 0.3 : 0.45) : profile.beta;
      multiplier = 1 - (1 - marketDrift) * resilienceFactor;
    }

    // Special Overrides
    if ((activeRegime === "Bubble" || activeRegime === "Sector Mania") && c.sector === bubbleSector) {
      multiplier *= (activeRegime === "Bubble" ? 1.15 : 1.10) + Math.random() * 0.15; // Euphoria
    }
    if (activeRegime === "Crash" && c.sector === bubbleSector) {
      multiplier *= (0.65 + Math.random() * 0.1); // Contagion
    }
    if (c.sector === leaderSector && (activeRegime === "Recovery" || activeRegime === "Normal" || activeRegime === "Bull")) {
      multiplier *= (1.04 + Math.random() * 0.04); // Emerging leaders
    }

    multipliers[c.name] = multiplier;
  });

  // 3. Random Noise / Events
  const numEvents = Math.floor(Math.random() * 3) + 1;
  const eventPool = [
    { text: "⭐ Broker Upgrade: BUY rating reiterated on {name}.", impact: [0.03, 0.08] },
    { text: "🔻 Earnings Miss: {name} profits fall below estimates.", impact: [-0.10, -0.04] },
    { text: "💎 Management Change: New leadership at {name} brings optimism.", impact: [0.04, 0.07] },
    { text: "🤝 Strategic Win: {name} secures a major international contract.", impact: [0.05, 0.10] },
  ];

  const processedCos = new Set<string>();
  for (let i = 0; i < numEvents; i++) {
    const randomCo = companies[Math.floor(Math.random() * companies.length)];
    if (processedCos.has(randomCo.name)) continue;
    processedCos.add(randomCo.name);
    const event = eventPool[Math.floor(Math.random() * eventPool.length)];
    news.push(`${tag} ${event.text.replace("{name}", randomCo.name)}`);
    multipliers[randomCo.name] *= (1 + (Math.random() * (event.impact[1] - event.impact[0]) + event.impact[0]));
  }

  return { 
    news, 
    multipliers, 
    newScenario: currentScenario ? { ...currentScenario, step: currentScenario.step + 1 } : undefined 
  };
}

/**
 * Challenge Scoring Helpers (Used by Challenge Page)
 */
export function calculateQualityScore(c: Company): number {
  let score = 0;
  if (c.roe > 20) score += 40;
  else if (c.roe > 15) score += 30;
  else if (c.roe > 10) score += 20;

  if (c.roce > 20) score += 40;
  if (c.profit_margin > 15) score += 20;
  return score;
}

export function calculateValuationScore(c: Company): number {
  let score = 0;
  // Low PE is usually better for "value" in challenges
  if (c.pe < 15) score += 40;
  else if (c.pe < 25) score += 30;
  else if (c.pe < 35) score += 15;

  if (c.peg_ratio < 1 && c.peg_ratio > 0) score += 40;
  if (c.pb_ratio < 3) score += 20;
  return score;
}

export function calculateGrowthScore(c: Company): number {
  let score = 0;
  if (c.profit_growth > 25) score += 40;
  else if (c.profit_growth > 15) score += 25;

  if (c.revenue_growth > 20) score += 40;
  else if (c.revenue_growth > 10) score += 20;
  
  if (c.profit_trend === "Rising") score += 20;
  return score;
}

export function calculateDebtScore(c: Company): number {
  let score = 100;
  if (c.debt_to_equity > 1.5) score -= 60;
  else if (c.debt_to_equity > 0.8) score -= 30;
  else if (c.debt_to_equity < 0.2) score += 0; // Already perfect

  if (c.interest_coverage < 3) score -= 40;
  return Math.max(0, score);
}

export function generateTotalScore(c: Company): number {
  return (
    calculateQualityScore(c) * 0.3 +
    calculateValuationScore(c) * 0.2 +
    calculateGrowthScore(c) * 0.3 +
    calculateDebtScore(c) * 0.2
  );
}
