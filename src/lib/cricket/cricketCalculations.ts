/**
 * Pure cricket calculations for scoring, run rates, overs, and bowler economy.
 */

export function ballsToOvers(legalBalls: number): string {
  if (legalBalls <= 0) return "0.0";
  const completedOvers = Math.floor(legalBalls / 6);
  const remainingBalls = legalBalls % 6;
  return `${completedOvers}.${remainingBalls}`;
}

export function oversToBalls(oversString: string): number {
  const parts = oversString.split(".");
  const overs = parseInt(parts[0] || "0", 10);
  const balls = parseInt(parts[1] || "0", 10);
  return overs * 6 + balls;
}

export function calculateRunRate(runs: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  const overs = legalBalls / 6;
  return Math.round((runs / overs) * 100) / 100;
}

export function calculateRequiredRunRate(
  targetScore: number,
  currentRuns: number,
  remainingBalls: number
): number {
  if (remainingBalls <= 0) return 0;
  const runsNeeded = Math.max(0, targetScore - currentRuns);
  const remainingOvers = remainingBalls / 6;
  return Math.round((runsNeeded / remainingOvers) * 100) / 100;
}

export function calculateEconomy(runsConceded: number, ballsBowled: number): number {
  if (ballsBowled <= 0) return 0;
  const overs = ballsBowled / 6;
  return Math.round((runsConceded / overs) * 100) / 100;
}

export function calculateStrikeRate(runs: number, ballsFaced: number): number {
  if (ballsFaced <= 0) return 0;
  return Math.round((runs / ballsFaced) * 10000) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
