"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Match, Team, Player, BallOutcomeType, WicketType } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { OverBallsDisplay } from "@/components/scoreboard/OverBallsDisplay";
import {
  ballsToOvers,
  calculateRunRate,
  calculateRequiredRunRate,
} from "@/lib/cricket/cricketCalculations";

function UmpireScoringConsoleContent({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Wicket Modal State
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [wicketForm, setWicketForm] = useState<{
    wicketType: WicketType;
    dismissedPlayerId: string;
    assistedById: string;
    newBatsmanId: string;
  }>({
    wicketType: "Bowled",
    dismissedPlayerId: "",
    assistedById: "",
    newBatsmanId: "",
  });

  // Bowler Rotation Modal State
  const [isBowlerModalOpen, setIsBowlerModalOpen] = useState(false);
  const [selectedNewBowlerId, setSelectedNewBowlerId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMatchData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (!isMounted) return;

        if (!meJson.success || !meJson.data || (meJson.data.role !== "umpire" && meJson.data.role !== "admin")) {
          router.push("/login");
          return;
        }

        const res = await fetch(`/api/matches/${matchId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setMatch(json.data.match);
          setTeamA(json.data.teamA || null);
          setTeamB(json.data.teamB || null);
          setTeamAPlayers(json.data.teamAPlayers || []);
          setTeamBPlayers(json.data.teamBPlayers || []);
        }
      } catch {
        if (isMounted) setStatusMsg({ type: "error", text: "Failed to load match console" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadMatchData();

    return () => {
      isMounted = false;
    };
  }, [matchId, router]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Initializing live scoring console...
        </div>
      </PageShell>
    );
  }

  if (!match) {
    return (
      <PageShell title="Match Not Found">
        <p className="text-sm text-[var(--color-text-secondary)]">
          The requested live match could not be found.
        </p>
      </PageShell>
    );
  }

  const activeInnings = match.innings[match.currentInningsNumber - 1];
  const battingTeam = activeInnings?.battingTeamId === teamA?.id ? teamA : teamB;
  const battingSquad = activeInnings?.battingTeamId === teamA?.id ? teamAPlayers : teamBPlayers;
  const bowlingSquad = activeInnings?.bowlingTeamId === teamA?.id ? teamAPlayers : teamBPlayers;

  const striker = battingSquad.find((p) => p.id === activeInnings?.currentStrikerId);
  const nonStriker = battingSquad.find((p) => p.id === activeInnings?.currentNonStrikerId);
  const bowler = bowlingSquad.find((p) => p.id === activeInnings?.currentBowlerId);

  const strikerStats = activeInnings?.batsmen.find((b) => b.playerId === striker?.id);
  const nonStrikerStats = activeInnings?.batsmen.find((b) => b.playerId === nonStriker?.id);
  const bowlerStats = activeInnings?.bowlers.find((b) => b.playerId === bowler?.id);

  const availableNextBatsmen = battingSquad.filter(
    (p) =>
      p.id !== activeInnings?.currentStrikerId &&
      p.id !== activeInnings?.currentNonStrikerId &&
      !activeInnings?.batsmen.some((b) => b.playerId === p.id && b.isOut)
  );

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

  // Send Ball Outcome
  const recordBall = async (outcome: BallOutcomeType, runsScored = 0) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, runsScored }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to record delivery" });
        return;
      }
      setMatch(json.data.match);
      setStatusMsg({ type: "success", text: `Ball recorded: ${outcome}` });
    } catch {
      setStatusMsg({ type: "error", text: "Network error recording delivery" });
    }
  };

  // Submit Wicket Event
  const handleWicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/matches/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: "Wicket",
          isWicket: true,
          wicketType: wicketForm.wicketType,
          dismissedPlayerId: wicketForm.dismissedPlayerId || activeInnings?.currentStrikerId,
          assistedById: wicketForm.assistedById || undefined,
          newBatsmanId: wicketForm.newBatsmanId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to submit wicket" });
        return;
      }
      setMatch(json.data.match);
      setIsWicketModalOpen(false);
      setStatusMsg({ type: "success", text: `Wicket registered: ${wicketForm.wicketType}!` });
    } catch {
      setStatusMsg({ type: "error", text: "Network error registering wicket" });
    }
  };

  // Manual swap strike
  const swapStrike = async () => {
    if (!activeInnings) return;
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strikerId: activeInnings.currentNonStrikerId,
          nonStrikerId: activeInnings.currentStrikerId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMatch(json.data);
        setStatusMsg({ type: "success", text: "Strike swapped between batsmen." });
      }
    } catch {
      // Handle error
    }
  };

  // Rotate Bowler
  const handleRotateBowler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewBowlerId) return;

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bowlerId: selectedNewBowlerId }),
      });
      const json = await res.json();
      if (json.success) {
        setMatch(json.data);
        setIsBowlerModalOpen(false);
        setStatusMsg({ type: "success", text: "Bowler rotation applied." });
      }
    } catch {
      // Handle error
    }
  };

  return (
    <PageShell
      title={`Live Scoring Console: ${match.title}`}
      subtitle={`${match.venue} • Innings ${match.currentInningsNumber}`}
      action={
        <div className="flex items-center gap-2">
          <Badge variant="live" withPulse size="md">
            Official Scoring Console
          </Badge>
          <Link href={`/scoreboard/${match.id}`}>
            <Button size="sm" variant="ghost">
              Public View
            </Button>
          </Link>
        </div>
      }
    >
      {/* Alert banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-[var(--color-status-win-bg)] border border-[var(--color-status-win)]/30 text-[var(--color-brand-teal-light)]"
              : "bg-[var(--color-status-live-bg)] border border-[var(--color-status-live)]/30 text-[var(--color-status-live)]"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-[10px] uppercase font-bold px-2 py-0.5 hover:bg-white/10 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Score Callout (2nd Innings) */}
      {match.currentInningsNumber === 2 && match.targetScore && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-brand-orange-dim)] to-[var(--color-brand-night-surface)] border border-[var(--color-brand-orange)]/40 flex flex-wrap items-center justify-between gap-4 font-score">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-accent)] font-display">
              Target Pursuit
            </span>
            <div className="text-xl font-bold text-white">
              Target: <span className="text-[var(--color-accent)]">{match.targetScore} runs</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-[var(--color-text-secondary)] block">Need</span>
              <span className="text-xl font-bold text-[var(--color-status-live)]">
                {Math.max(0, match.targetScore - (activeInnings?.totalRuns || 0))} runs
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-secondary)] block">Balls</span>
              <span className="text-xl font-bold text-white">{remainingBalls} balls</span>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-secondary)] block">Required RR</span>
              <span className="text-xl font-bold text-[var(--color-accent)]">{reqRR.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Scoring Header */}
      {activeInnings && (
        <Card variant="accent" className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-2xl uppercase tracking-wide text-white">
                  {battingTeam?.name}
                </span>
                <Badge variant="teal" size="sm">
                  Batting
                </Badge>
              </div>
              <div className="mt-2 flex items-baseline gap-4 font-score">
                <span className="text-6xl font-black text-[var(--color-accent)] tracking-tight">
                  {activeInnings.totalRuns}/{activeInnings.wickets}
                </span>
                <span className="text-xl text-[var(--color-text-secondary)]">
                  ({ballsToOvers(activeInnings.legalBalls)} / {activeInnings.totalOversAllowed} ov)
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)] font-score">
                Current Run Rate: <strong className="text-white">{currentRR.toFixed(2)}</strong>
              </div>
            </div>

            {/* Over balls visual strip */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display block">
                Deliveries in Over
              </span>
              <OverBallsDisplay balls={activeInnings.balls} limit={6} />
            </div>
          </div>
        </Card>
      )}

      {/* Active Crease & Bowler Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-score">
        {/* Striker */}
        <Card variant="surface" className="border-l-4 border-l-[var(--color-accent)]">
          <CardBody className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--color-accent)] uppercase font-display">
                Striker (*)
              </span>
              <button
                type="button"
                onClick={swapStrike}
                className="text-[11px] text-[var(--color-text-secondary)] hover:text-white underline cursor-pointer"
              >
                Swap Strike ⇄
              </button>
            </div>
            <div className="font-bold text-lg font-sans text-white truncate">
              {striker?.name || "Select Batsman"}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {strikerStats ? (
                <>
                  <strong className="text-white">{strikerStats.runs}</strong> runs ({strikerStats.ballsFaced} balls) • {strikerStats.fours}x4, {strikerStats.sixes}x6
                </>
              ) : (
                "0 (0)"
              )}
            </div>
          </CardBody>
        </Card>

        {/* Non-Striker */}
        <Card variant="surface">
          <CardBody className="p-4 space-y-1">
            <div className="text-xs font-bold text-[var(--color-text-secondary)] uppercase font-display">
              Non-Striker
            </div>
            <div className="font-bold text-lg font-sans text-white truncate">
              {nonStriker?.name || "Select Batsman"}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {nonStrikerStats ? (
                <>
                  <strong className="text-white">{nonStrikerStats.runs}</strong> runs ({nonStrikerStats.ballsFaced} balls)
                </>
              ) : (
                "0 (0)"
              )}
            </div>
          </CardBody>
        </Card>

        {/* Bowler */}
        <Card variant="surface" className="border-l-4 border-l-[var(--color-brand-teal)]">
          <CardBody className="p-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--color-brand-teal-light)] uppercase font-display">
                Current Bowler
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedNewBowlerId(bowler?.id || "");
                  setIsBowlerModalOpen(true);
                }}
                className="text-[11px] text-[var(--color-text-secondary)] hover:text-white underline cursor-pointer"
              >
                Change Bowler
              </button>
            </div>
            <div className="font-bold text-lg font-sans text-white truncate">
              {bowler?.name || "Select Bowler"}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {bowlerStats ? (
                <>
                  {bowlerStats.overs.toFixed(1)} ov • {bowlerStats.runsConceded} runs • <strong className="text-[var(--color-accent)]">{bowlerStats.wickets} wkts</strong>
                </>
              ) : (
                "0.0 ov • 0 runs • 0 wkts"
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Ball Outcome Scoring Pad (Big Touch-friendly Buttons) */}
      <Card variant="surface" className="p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
          Record Ball Delivery Outcome
        </h3>

        {/* Standard Runs */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          <button
            type="button"
            onClick={() => recordBall("0", 0)}
            className="h-16 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-white font-score text-2xl font-bold flex flex-col items-center justify-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <span>0</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-sans">Dot</span>
          </button>

          <button
            type="button"
            onClick={() => recordBall("1", 1)}
            className="h-16 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-white font-score text-2xl font-bold flex flex-col items-center justify-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <span>1</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-sans">Single</span>
          </button>

          <button
            type="button"
            onClick={() => recordBall("2", 2)}
            className="h-16 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-white font-score text-2xl font-bold flex flex-col items-center justify-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <span>2</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-sans">Two</span>
          </button>

          <button
            type="button"
            onClick={() => recordBall("3", 3)}
            className="h-16 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-white font-score text-2xl font-bold flex flex-col items-center justify-center hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <span>3</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-sans">Three</span>
          </button>

          <button
            type="button"
            onClick={() => recordBall("4", 4)}
            className="h-16 rounded-xl bg-[var(--color-brand-orange)]/20 border border-[var(--color-brand-orange)]/50 text-[var(--color-brand-orange-light)] font-score text-2xl font-black flex flex-col items-center justify-center hover:bg-[var(--color-brand-orange)]/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>4</span>
            <span className="text-[10px] text-[var(--color-accent)] uppercase font-sans font-bold">FOUR</span>
          </button>

          <button
            type="button"
            onClick={() => recordBall("6", 6)}
            className="h-16 rounded-xl bg-[var(--color-brand-yellow)]/20 border border-[var(--color-brand-yellow)]/50 text-[var(--color-brand-yellow)] font-score text-2xl font-black flex flex-col items-center justify-center hover:bg-[var(--color-brand-yellow)]/30 active:scale-95 transition-all cursor-pointer"
          >
            <span>6</span>
            <span className="text-[10px] text-[var(--color-accent)] uppercase font-sans font-bold">SIX</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWicketForm({
                wicketType: "Bowled",
                dismissedPlayerId: activeInnings?.currentStrikerId || "",
                assistedById: "",
                newBatsmanId: availableNextBatsmen[0]?.id || "",
              });
              setIsWicketModalOpen(true);
            }}
            className="h-16 rounded-xl bg-[var(--color-status-live)] text-white font-display text-xl font-black flex flex-col items-center justify-center hover:bg-red-600 active:scale-95 transition-all cursor-pointer shadow-lg col-span-2 sm:col-span-1"
          >
            <span>W</span>
            <span className="text-[10px] uppercase tracking-wider font-sans">WICKET</span>
          </button>
        </div>

        {/* Extras Row */}
        <div className="pt-2 border-t border-[var(--color-border)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display block mb-2">
            Extras Deliveries
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => recordBall("Wide", 0)}
              className="py-3 px-4 rounded-lg bg-[var(--color-brand-teal)]/15 border border-[var(--color-brand-teal)]/30 hover:bg-[var(--color-brand-teal)]/25 text-[var(--color-brand-teal-light)] font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>Wide (Wd)</span>
              <span className="font-score text-xs">+1 Extra</span>
            </button>

            <button
              type="button"
              onClick={() => recordBall("No-ball", 0)}
              className="py-3 px-4 rounded-lg bg-[var(--color-brand-teal)]/15 border border-[var(--color-brand-teal)]/30 hover:bg-[var(--color-brand-teal)]/25 text-[var(--color-brand-teal-light)] font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>No-ball (Nb)</span>
              <span className="font-score text-xs">+1 Extra</span>
            </button>

            <button
              type="button"
              onClick={() => recordBall("Bye", 1)}
              className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>Bye (B)</span>
              <span className="font-score text-xs">+1 Run</span>
            </button>

            <button
              type="button"
              onClick={() => recordBall("Leg-bye", 1)}
              className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-between cursor-pointer"
            >
              <span>Leg-bye (Lb)</span>
              <span className="font-score text-xs">+1 Run</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Wicket Modal */}
      <Modal
        isOpen={isWicketModalOpen}
        onClose={() => setIsWicketModalOpen(false)}
        title="Record Dismissal / Wicket"
      >
        <form onSubmit={handleWicketSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Dismissed Batsman
            </label>
            <select
              value={wicketForm.dismissedPlayerId}
              onChange={(e) => setWicketForm({ ...wicketForm, dismissedPlayerId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              {striker && <option value={striker.id}>{striker.name} (Striker)</option>}
              {nonStriker && <option value={nonStriker.id}>{nonStriker.name} (Non-Striker)</option>}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Dismissal Method
            </label>
            <select
              value={wicketForm.wicketType}
              onChange={(e) => setWicketForm({ ...wicketForm, wicketType: e.target.value as WicketType })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              <option value="Bowled">Bowled</option>
              <option value="Caught">Caught</option>
              <option value="LBW">LBW</option>
              <option value="Run Out">Run Out</option>
              <option value="Stumped">Stumped</option>
              <option value="Hit Wicket">Hit Wicket</option>
            </select>
          </div>

          {(wicketForm.wicketType === "Caught" || wicketForm.wicketType === "Run Out" || wicketForm.wicketType === "Stumped") && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Fielder / Assistant
              </label>
              <select
                value={wicketForm.assistedById}
                onChange={(e) => setWicketForm({ ...wicketForm, assistedById: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="">Select Fielder / Keeper</option>
                {bowlingSquad.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Next Incoming Batsman
            </label>
            <select
              value={wicketForm.newBatsmanId}
              onChange={(e) => setWicketForm({ ...wicketForm, newBatsmanId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              <option value="">Select Next Batsman</option>
              {availableNextBatsmen.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.role})
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="danger" size="md" className="w-full">
            Confirm Wicket & Bring In Next Batsman
          </Button>
        </form>
      </Modal>

      {/* Bowler Rotation Modal */}
      <Modal
        isOpen={isBowlerModalOpen}
        onClose={() => setIsBowlerModalOpen(false)}
        title="Rotate Bowler"
      >
        <form onSubmit={handleRotateBowler} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Select Incoming Bowler
            </label>
            <select
              value={selectedNewBowlerId}
              onChange={(e) => setSelectedNewBowlerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              <option value="">Select Bowler</option>
              {bowlingSquad.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" variant="teal" size="md" className="w-full">
            Apply Bowler Rotation
          </Button>
        </form>
      </Modal>
    </PageShell>
  );
}

export default function UmpireScoringConsolePage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
            Initializing live scoring console...
          </div>
        </PageShell>
      }
    >
      <UmpireScoringConsoleContent params={params} />
    </Suspense>
  );
}
