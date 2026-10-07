"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Match, Team, SessionData } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

export default function UmpireConsoleOverviewPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Start Match Modal
  const [startModalMatch, setStartModalMatch] = useState<Match | null>(null);
  const [tossForm, setTossForm] = useState<{ tossWinnerId: string; decision: "bat" | "bowl" }>({
    tossWinnerId: "",
    decision: "bat",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();

        if (!isMounted) return;

        if (!meJson.success || !meJson.data || (meJson.data.role !== "umpire" && meJson.data.role !== "admin")) {
          router.push("/login");
          return;
        }

        setSession(meJson.data);

        const [mRes, tRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/teams"),
        ]);
        const [mJson, tJson] = await Promise.all([mRes.json(), tRes.json()]);

        if (isMounted) {
          if (mJson.success) setMatches(mJson.data || []);
          if (tJson.success) setTeams(tJson.data || []);
        }
      } catch {
        // Silently catch error on unmount
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const openStartModal = (m: Match) => {
    setStartModalMatch(m);
    setTossForm({ tossWinnerId: m.teamAId, decision: "bat" });
  };

  const handleStartMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startModalMatch) return;

    try {
      const res = await fetch(`/api/matches/${startModalMatch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "live",
          tossWinnerTeamId: tossForm.tossWinnerId,
          tossDecision: tossForm.decision,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStartModalMatch(null);
        router.push(`/umpire/${startModalMatch.id}`);
      }
    } catch {
      // Handle error
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Verifying match official credentials...
        </div>
      </PageShell>
    );
  }

  const liveMatches = matches.filter((m) => m.status === "live");
  const scheduledMatches = matches.filter((m) => m.status === "scheduled");

  const getTeamName = (id: string) => teams.find((t) => t.id === id)?.name || "Team";

  return (
    <PageShell
      title="Umpire & Match Referee Console"
      subtitle={`Officiating portal for ${session?.displayName} • Select an active match to record ball-by-ball scoring`}
    >
      <div className="space-y-8">
        {/* Active Live Matches */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
            <span className="live-dot" />
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Currently Live Matches ({liveMatches.length})
            </h2>
          </div>

          {liveMatches.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)] rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
              No matches currently in progress. Start an upcoming match below to begin scoring.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((m) => (
                <Card key={m.id} variant="accent">
                  <CardBody className="p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="live" withPulse size="sm">
                          Live In Progress
                        </Badge>
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Innings {m.currentInningsNumber}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-display uppercase text-white mt-2">
                        {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {m.venue} • {m.format}
                      </p>
                    </div>

                    <Link href={`/umpire/${m.id}`}>
                      <Button size="md" variant="primary" className="w-full">
                        Open Ball-by-Ball Scoring Console →
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Fixtures - Ready to Start */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <h2 className="text-xl font-bold font-display uppercase tracking-wide text-white">
              Upcoming Scheduled Fixtures ({scheduledMatches.length})
            </h2>
          </div>

          {scheduledMatches.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)] rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
              No upcoming fixtures to officiate.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMatches.map((m) => (
                <Card key={m.id} variant="surface">
                  <CardBody className="p-5 space-y-4">
                    <div>
                      <span className="text-xs font-semibold uppercase text-[var(--color-text-secondary)] font-display">
                        {m.title}
                      </span>
                      <h4 className="text-lg font-bold font-display text-white mt-1">
                        {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {m.venue} • {m.format}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="teal"
                      className="w-full"
                      onClick={() => openStartModal(m)}
                    >
                      Conduct Toss & Start Match
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toss & Start Modal */}
      <Modal
        isOpen={Boolean(startModalMatch)}
        onClose={() => setStartModalMatch(null)}
        title="Official Toss & Match Commencement"
      >
        {startModalMatch && (
          <form onSubmit={handleStartMatch} className="space-y-4">
            <div className="p-3 rounded-lg bg-black/20 text-xs text-[var(--color-text-secondary)]">
              {startModalMatch.title} • {startModalMatch.venue}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Toss Won By
              </label>
              <select
                value={tossForm.tossWinnerId}
                onChange={(e) => setTossForm({ ...tossForm, tossWinnerId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value={startModalMatch.teamAId}>{getTeamName(startModalMatch.teamAId)}</option>
                <option value={startModalMatch.teamBId}>{getTeamName(startModalMatch.teamBId)}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Toss Decision
              </label>
              <select
                value={tossForm.decision}
                onChange={(e) => setTossForm({ ...tossForm, decision: e.target.value as "bat" | "bowl" })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="bat">Elected to Bat First</option>
                <option value="bowl">Elected to Bowl First</option>
              </select>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full">
              Commence Match & Open Scoring Console
            </Button>
          </form>
        )}
      </Modal>
    </PageShell>
  );
}
