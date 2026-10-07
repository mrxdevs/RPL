export type ActivityCategory =
  | "ball"
  | "wicket"
  | "milestone"
  | "match_status"
  | "auction"
  | "team_update";

export interface ActivityEvent {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
}
