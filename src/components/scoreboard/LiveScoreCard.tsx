import React from "react";
import Link from "next/link";
import { Match, Team } from "@/lib/types";
import { ballsToOvers, calculateRunRate, calculateRequiredRunRate } from "@/lib/cricket/cricketCalculations";
import { Card, CardBody } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface LiveScoreCardProps {
  match: Match;
  teams: Team[];
  isFeatured?: boolean;
}

export function LiveScoreCard({ match, teams, isFeatured = false }: LiveScoreCardProps) {
  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);

  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const inn1BatTeam = inn1 ? teams.find((t) => t.id === inn1.battingTeamId) : teamA;
  const inn2BatTeam = inn2 ? teams.find((t) => t.id === inn2.battingTeamId) : teamB;

  const currentInnings = match.innings[match.currentInningsNumber - 1];
  const currentRR = currentInnings
    ? calculateRunRate(currentInnings.totalRuns, currentInnings.legalBalls)
    : 0;

  const remainingBalls =
    currentInnings && match.currentInningsNumber === 2 && match.targetScore
      ? Math.max(0, currentInnings.totalOversAllowed * 6 - currentInnings.legalBalls)
      : 0;

  const reqRR =
    currentInnings && match.currentInningsNumber === 2 && match.targetScore
      ? calculateRequiredRunRate(match.targetScore, currentInnings.totalRuns, remainingBalls)
      : 0;

  return (
    <Card
      variant={match.status === "live" ? "accent" : "surface"}
      className={`${isFeatured ? "border-[var(--color-brand-orange)]/40 shadow-xl" : ""}`}
    >
      <CardBody className="space-y-4">
        {/* Match Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--color-text-secondary)] font-display">
              {match.title}
            </span>
            <span className="text-xs text-[var(--color-text-disabled)]">•</span>
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {match.format}
            </span>
          </div>

          <Badge
            variant={
              match.status === "live"
                ? "live"
                : match.status === "completed"
                ? "win"
                : "upcoming"
            }
            withPulse={match.status === "live"}
          >
            {match.status === "live"
              ? "Live"
              : match.status === "completed"
              ? "Result"
              : "Upcoming"}
          </Badge>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Team / Innings 1 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="flex flex-col">
              <span className="font-bold text-base text-[var(--color-text-primary)] font-display uppercase tracking-wide">
                {inn1BatTeam?.name || teamA?.name || "Team A"}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {inn1 ? `${ballsToOvers(inn1.legalBalls)} ov` : "Yet to bat"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-score text-2xl font-bold text-[var(--color-text-primary)]">
                {inn1 ? `${inn1.totalRuns}/${inn1.wickets}` : "-/-"}
              </span>
            </div>
          </div>

          {/* Second Team / Innings 2 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
            <div className="flex flex-col">
              <span className="font-bold text-base text-[var(--color-text-primary)] font-display uppercase tracking-wide">
                {inn2BatTeam?.name || teamB?.name || "Team B"}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {inn2 ? `${ballsToOvers(inn2.legalBalls)} ov` : "Yet to bat"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-score text-2xl font-bold text-[var(--color-text-primary)]">
                {inn2 ? `${inn2.totalRuns}/${inn2.wickets}` : "-/-"}
              </span>
            </div>
          </div>
        </div>

        {/* Match State & Rates */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[var(--color-border)]">
          <div className="space-y-1">
            {match.status === "live" && (
              <div className="flex items-center gap-3 font-score text-[var(--color-text-secondary)]">
                <span>
                  CRR: <strong className="text-[var(--color-text-primary)]">{currentRR.toFixed(2)}</strong>
                </span>
                {match.targetScore && (
                  <>
                    <span>
                      Target: <strong className="text-[var(--color-accent)]">{match.targetScore}</strong>
                    </span>
                    <span>
                      RRR: <strong className="text-[var(--color-status-live)]">{reqRR.toFixed(2)}</strong>
                    </span>
                  </>
                )}
              </div>
            )}

            {match.status === "completed" && match.resultSummary && (
              <div className="font-semibold text-[var(--color-brand-teal-light)] font-display tracking-wide uppercase">
                {match.resultSummary}
              </div>
            )}

            {match.status === "scheduled" && (
              <div className="text-[var(--color-text-secondary)]">
                Venue: {match.venue}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/scoreboard/${match.id}`}>
              <Button size="sm" variant={match.status === "live" ? "primary" : "secondary"}>
                {match.status === "live" ? "Live Commentary" : "Match Center"}
              </Button>
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
