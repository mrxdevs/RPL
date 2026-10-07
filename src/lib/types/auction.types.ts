export interface AuctionBid {
  id: string;
  playerId: string;
  teamId: string;
  bidAmount: number;
  timestamp: string;
}

export interface AuctionRecord {
  playerId: string;
  teamId: string;
  soldPrice: number;
  soldAt: string;
}

export interface AuctionState {
  currentLotPlayerId?: string;
  currentBidAmount?: number;
  currentLeadingTeamId?: string;
  history: AuctionRecord[];
}
