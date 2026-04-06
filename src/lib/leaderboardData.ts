export interface LeaderboardPlayer {
  id: string;
  name: string;
  avatar: string;
  type: "bot" | "user";
  baseXp: number;
  baseWealth: number;
  riskProfile: "safe" | "moderate" | "aggressive";
}

export const simulatedBots: LeaderboardPlayer[] = [
  { id: "b1", name: "Rakesh J.", avatar: "👨🏽‍💼", type: "bot", baseXp: 5000, baseWealth: 5000000, riskProfile: "aggressive" },
  { id: "b2", name: "Radhakishan D.", avatar: "👨🏽‍🦳", type: "bot", baseXp: 8000, baseWealth: 8000000, riskProfile: "safe" },
  { id: "b3", name: "Vijay K.", avatar: "🧑🏽‍💻", type: "bot", baseXp: 3000, baseWealth: 2500000, riskProfile: "moderate" },
  { id: "b4", name: "Nikhil K.", avatar: "👨🏽‍💻", type: "bot", baseXp: 4500, baseWealth: 3500000, riskProfile: "aggressive" },
  { id: "b5", name: "Ramesh D.", avatar: "👔", type: "bot", baseXp: 1500, baseWealth: 1500000, riskProfile: "safe" },
  { id: "b6", name: "Anil K.", avatar: "👨🏽", type: "bot", baseXp: 800, baseWealth: 800000, riskProfile: "aggressive" },
  { id: "b7", name: "Mukesh A.", avatar: "💼", type: "bot", baseXp: 9500, baseWealth: 15000000, riskProfile: "safe" },
  { id: "b8", name: "Harshil M.", avatar: "🚀", type: "bot", baseXp: 2100, baseWealth: 1800000, riskProfile: "moderate" },
];

export function getBotCurrentStats(bot: LeaderboardPlayer, quarterCount: number) {
  // Simulate bot growth over time based on quarterCount and their risk profile
  let growthFactor = 1.0;
  
  if (bot.riskProfile === "safe") {
    // Steady but slow growth
    growthFactor = 1 + (quarterCount * 0.03); 
  } else if (bot.riskProfile === "moderate") {
    // Medium growth with some variance
    growthFactor = 1 + (quarterCount * 0.05);
  } else if (bot.riskProfile === "aggressive") {
    // High growth but highly volatile based on quarter
    const volatility = Math.sin(quarterCount) * 0.1; // swings up and down
    growthFactor = 1 + (quarterCount * 0.08) + volatility;
  }
  
  return {
    ...bot,
    currentWealth: Math.round(bot.baseWealth * Math.max(0.3, growthFactor)),
    currentXp: Math.round(bot.baseXp + (quarterCount * 50 * growthFactor))
  };
}
