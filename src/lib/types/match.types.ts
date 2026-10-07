export type TournamentFormat = "T20" | "One Day" | "Test";

export type MatchStatus = "scheduled" | "live" | "innings_break" | "completed" | "abandoned";

export type BallOutcomeType =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "6"
  | "Wide"
  | "No-ball"
  | "Bye"
  | "Leg-bye"
  | "Wicket";

export type WicketType =
  | "Bowled"
  | "Caught"
  | "LBW"
  | "Run Out"
  | "Stumped"
  | "Hit Wicket";

export interface BallRecord {
  id: string;
  inningsNumber: number;
  overNumber: number; // 0-indexed or 1-indexed (e.g. over 0, ball 1)
  ballNumberInOver: number; // 1 to 6 for legal deliveries
  isLegalDelivery: boolean;
  outcome: BallOutcomeType;
  runsScored: number;
  extras: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  assistedById?: string; // Catcher or run-out fielder
  timestamp: string;
  commentaryText: string;
}

export interface BatsmanInningsStats {
  playerId: string;
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalDescription?: string;
}

export interface BowlerInningsStats {
  playerId: string;
  playerName: string;
  overs: number; // e.g. 3.2
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  overString: string;
  batsmanName: string;
}

export interface CurrentPartnership {
  batsman1Id: string;
  batsman1Runs: number;
  batsman2Id: string;
  batsman2Runs: number;
  totalRuns: number;
  ballsFaced: number;
}

export interface Innings {
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  totalOversAllowed: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  batsmen: BatsmanInningsStats[];
  bowlers: BowlerInningsStats[];
  fallOfWickets: FallOfWicket[];
  currentPartnership?: CurrentPartnership;
  balls: BallRecord[];
  isCompleted: boolean;
}

export interface Match {
  id: string;
  matchNumber: number;
  title: string;
  format: TournamentFormat;
  scheduledAt: string;
  venue: string;
  status: MatchStatus;
  teamAId: string;
  teamBId: string;
  umpireId: string;
  tossWinnerTeamId?: string;
  tossDecision?: "bat" | "bowl";
  currentInningsNumber: number;
  innings: Innings[];
  targetScore?: number;
  resultSummary?: string;
  winnerTeamId?: string;
  manOfTheMatchId?: string;
}
