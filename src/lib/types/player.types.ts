export type PlayerRole = "Batter" | "Bowler" | "All-rounder" | "Wicketkeeper";

export type AuctionStatus = "available" | "sold" | "unsold";

export interface PlayerStats {
  matches: number;
  runs: number;
  ballsFaced: number;
  highestScore: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  bestBowling: string;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  basePrice: number;
  auctionStatus: AuctionStatus;
  teamId?: string;
  soldPrice?: number;
  battingOrder?: number;
  stats: PlayerStats;
}
