export interface Team {
  id: string;
  name: string;
  shortName: string;
  totalBudget: number;
  remainingBudget: number;
  captainId?: string;
  playerIds: string[];
  primaryColor?: string;
}

export interface TeamSummary extends Team {
  playerCount: number;
  amountSpent: number;
  captainName?: string;
}
