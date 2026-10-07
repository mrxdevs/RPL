"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { Match, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { BattingTable } from "@/components/scoreboard/BattingTable";
import { BowlingTable } from "@/components/scoreboard/BowlingTable";
import { FallOfWicketsTable } from "@/components/scoreboard/FallOfWicketsTable";
import { OverBallsDisplay } from "@/components/scoreboard/OverBallsDisplay";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ballsToOvers,
  calculateRunRate,
  calculateRequiredRunRate,
} from "@/lib/cricket/cricketCalculations";

function MatchDetailContent({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMatchData() {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setMatch(json.data.match);
          setTeamA(json.data.teamA || null);
          setTeamB(json.data.teamB || null);

          if (json.data.match.innings.length > 0) {
            setSelectedInningsIndex(json.data.match.currentInningsNumber - 1);
          }
        }
      } catch {
        // Silently catch error on unmount
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMatchData();
    const interval = setInterval(fetchMatchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [matchId]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading match center...
        </div>
      </PageShell>
    );
  }

  if (!match) {
    return (
      <PageShell title="Match Not Found">
        <p className="text-sm text-[var(--color-text-secondary)]">
          The requested match could not be found.
        </p>
        <Link href="/scoreboard" className="inline-block mt-4">
          <Button variant="secondary">Back to Scoreboard</Button>
        </Link>
      </PageShell>
    );
  }

  const activeInnings = match.innings[selectedInningsIndex];
  const battingTeam = activeInnings?.battingTeamId === teamA?.id ? teamA : teamB;
  const bowlingTeam = activeInnings?.bowlingTeamId === teamA?.id ? teamA : teamB;

  const currentRR = activeInnings
    ? calculateRunRate(activeInnings.totalRuns, activeInnings.legalBalls)
    : 0;

  const remainingBalls =
    activeInnings && match.currentInningsNumber === 2 && match.targetScore
      ? Math.max(0, activeInnings.totalOversAllowed * 6 - activeInnings.legalBalls)
      : 0;

  const reqRR =
    activeInnings && match.currentInningsNumber === 2 && match.targetScore
      ? calculateRequiredRunRate(match.targetScore, activeInnings.totalRuns, remainingBalls)
      : 0;

  return (
    <PageShell
      title={match.title}
      subtitle={`${match.venue} • ${match.format}`}
      action={
        <div className="flex items-center gap-3">
          <Badge
            variant={
              match.status === "live"
                ? "live"
                : match.status === "completed"
                ? "win"
                : "upcoming"
            }
            withPulse={match.status === "live"}
            size="md"
          >
            {match.status.toUpperCase()}
          </Badge>
          <Link href="/scoreboard">
            <Button size="sm" variant="ghost">
              All Fixtures
            </Button>
          </Link>
        </div>
      }
    >
      {/* Target Score Prominent Alert (Second innings) */}
      {match.currentInningsNumber === 2 && match.targetScore && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-brand-orange-dim)] to-[var(--color-brand-night-mid)] border border-[var(--color-brand-orange)]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
              Target Requirement
            </span>
            <div className="text-lg font-bold text-white font-score">
              Target: <span className="text-[var(--color-accent)]">{match.targetScore} runs</span> in {activeInnings?.totalOversAllowed || 20} overs
            </div>
          </div>
          <div className="flex items-center gap-4 font-score text-sm">
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">Need</span>
              <div className="font-bold text-[var(--color-status-live)] text-xl">
                {Math.max(0, match.targetScore - (activeInnings?.totalRuns || 0))} runs
              </div>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">From</span>
              <div className="font-bold text-white text-xl">{remainingBalls} balls</div>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">Req RR</span>
              <div className="font-bold text-[var(--color-accent)] text-xl">{reqRR.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Innings Tabs */}
      {match.innings.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
          {match.innings.map((inn, idx) => {
            const team = inn.battingTeamId === teamA?.id ? teamA : teamB;
            return (
              <button
                key={inn.inningsNumber}
                onClick={() => setSelectedInningsIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide uppercase font-display transition-colors cursor-pointer ${
                  selectedInningsIndex === idx
                    ? "bg-[var(--color-brand-teal)] text-white glow-teal"
                    : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
                }`}
              >
                Innings {inn.inningsNumber}: {team?.shortName || "Team"} ({inn.totalRuns}/{inn.wickets})
              </button>
            );
          })}
        </div>
      )}

      {activeInnings ? (
        <div className="space-y-6">
          {/* Innings High-Level Summary Card */}
          <Card variant="surface">
            <CardBody className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-3xl uppercase tracking-wide text-white">
                      {battingTeam?.name}
                    </span>
                    <Badge variant="teal" size="sm">
                      Batting
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-4 font-score">
                    <span className="text-5xl font-extrabold text-[var(--color-accent)]">
                      {activeInnings.totalRuns}/{activeInnings.wickets}
                    </span>
                    <span className="text-lg text-[var(--color-text-secondary)]">
                      ({ballsToOvers(activeInnings.legalBalls)} / {activeInnings.totalOversAllowed} ov)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-score">
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase">Run Rate</span>
                    <div className="text-lg font-bold text-white">{currentRR.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase">Extras</span>
                    <div className="text-lg font-bold text-white">
                      {activeInnings.extras.total}
                      <span className="text-[10px] text-[var(--color-text-secondary)] block">
                        (w {activeInnings.extras.wides}, nb {activeInnings.extras.noBalls}, b {activeInnings.extras.byes}, lb {activeInnings.extras.legByes})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase">Bowler</span>
                    <div className="text-sm font-bold text-white truncate">
                      {bowlingTeam?.name || "Opponent"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-xs text-[var(--color-text-secondary)] uppercase">Status</span>
                    <div className="text-sm font-bold text-[var(--color-accent)]">
                      {activeInnings.isCompleted ? "Completed" : "In Progress"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Over Ball-by-ball Strip */}
              {activeInnings.balls.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                      Recent Deliveries
                    </span>
                  </div>
                  <OverBallsDisplay balls={activeInnings.balls} limit={12} />
                </div>
              )}
            </CardBody>
          </Card>

          {/* Current Partnership (if active) */}
          {activeInnings.currentPartnership && (
            <Card variant="surface" className="p-4 bg-white/[0.02]">
              <div className="flex items-center justify-between text-xs font-score">
                <span className="font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider font-display">
                  Current Partnership
                </span>
                <span className="font-bold text-[var(--color-accent)]">
                  {activeInnings.currentPartnership.totalRuns} runs ({activeInnings.currentPartnership.ballsFaced} balls)
                </span>
              </div>
            </Card>
          )}

          {/* Batting Card */}
          <Card variant="surface">
            <CardHeader>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Batting Scorecard
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              <BattingTable
                batsmen={activeInnings.batsmen}
                currentStrikerId={activeInnings.currentStrikerId}
                currentNonStrikerId={activeInnings.currentNonStrikerId}
              />
            </CardBody>
          </Card>

          {/* Bowling Card */}
          <Card variant="surface">
            <CardHeader>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Bowling Scorecard
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              <BowlingTable
                bowlers={activeInnings.bowlers}
                currentBowlerId={activeInnings.currentBowlerId}
              />
            </CardBody>
          </Card>

          {/* Fall of Wickets */}
          <Card variant="surface">
            <CardHeader>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Fall of Wickets
              </h3>
            </CardHeader>
            <CardBody>
              <FallOfWicketsTable fallOfWickets={activeInnings.fallOfWickets} />
            </CardBody>
          </Card>

          {/* Ball-by-Ball Commentary Feed */}
          <Card variant="surface">
            <CardHeader>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Ball by Ball Commentary
              </h3>
            </CardHeader>
            <CardBody className="divide-y divide-white/5 p-0">
              {activeInnings.balls.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
                  No commentary records yet for this innings.
                </div>
              ) : (
                activeInnings.balls.map((b) => (
                  <div key={b.id} className="p-4 flex items-start gap-3 hover:bg-white/5 transition-colors">
                    <span className="font-score text-xs font-bold text-[var(--color-accent)] shrink-0 w-12 pt-0.5">
                      {b.overNumber}.{b.ballNumberInOver}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {b.commentaryText}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <Badge
                        variant={
                          b.outcome === "4"
                            ? "yellow"
                            : b.outcome === "6"
                            ? "yellow"
                            : b.isWicket
                            ? "live"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {b.outcome}
                      </Badge>
                    </span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-[var(--color-text-secondary)]">
          Innings details will appear once the match commences.
        </div>
      )}
    </PageShell>
  );
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
            Loading match center...
          </div>
        </PageShell>
      }
    >
      <MatchDetailContent params={params} />
    </Suspense>
  );
}
