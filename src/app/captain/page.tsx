"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Team, Player, PlayerRole, SessionData } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function CaptainDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [hasActiveAuction, setHasActiveAuction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let activeTeamId: string | null = session?.teamId || null;

    async function loadData(isInitial = false) {
      try {
        if (isInitial) {
          const meRes = await fetch("/api/auth/me");
          const meJson = await meRes.json();

          if (!isMounted) return;

          if (!meJson.success || !meJson.data || meJson.data.role !== "captain") {
            router.push("/login");
            return;
          }

          setSession(meJson.data);
          activeTeamId = meJson.data.teamId || null;

          if (!activeTeamId) {
            setStatusMsg({ type: "error", text: "No franchise team assigned to your captain account." });
            return;
          }
        }

        if (!activeTeamId) return;

        const [teamRes, auctionRes] = await Promise.all([
          fetch(`/api/teams/${activeTeamId}`),
          fetch("/api/auction"),
        ]);
        const [teamJson, auctionJson] = await Promise.all([
          teamRes.json(),
          auctionRes.json(),
        ]);

        if (isMounted && teamJson.success && teamJson.data) {
          setTeam(teamJson.data.team);
          const sortedSquad = [...teamJson.data.squad].sort(
            (a, b) => (a.battingOrder || 99) - (b.battingOrder || 99)
          );
          setSquad(sortedSquad);
        }

        if (isMounted && auctionJson.success && auctionJson.data?.auction?.currentLotPlayerId) {
          setHasActiveAuction(true);
        } else if (isMounted) {
          setHasActiveAuction(false);
        }
      } catch {
        if (isMounted && isInitial) {
          setStatusMsg({ type: "error", text: "Failed to load captain squad data." });
        }
      } finally {
        if (isMounted && isInitial) setIsLoading(false);
      }
    }

    loadData(true);
    const interval = setInterval(() => loadData(false), 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router, session?.teamId]);

  const handleUpdateRole = async (playerId: string, newRole: PlayerRole) => {
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to update role" });
        return;
      }
      setStatusMsg({ type: "success", text: "Player role updated!" });
      setSquad((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, role: newRole } : p))
      );
    } catch {
      setStatusMsg({ type: "error", text: "Network error updating player role" });
    }
  };

  const movePlayerOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= squad.length) return;

    const newSquad = [...squad];
    const [moved] = newSquad.splice(index, 1);
    newSquad.splice(targetIndex, 0, moved);

    const updatedSquad = newSquad.map((p, idx) => ({
      ...p,
      battingOrder: idx + 1,
    }));
    setSquad(updatedSquad);

    try {
      await Promise.all(
        updatedSquad.map((p) =>
          fetch(`/api/players/${p.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ battingOrder: p.battingOrder }),
          })
        )
      );
      setStatusMsg({ type: "success", text: "Batting order saved!" });
    } catch {
      setStatusMsg({ type: "error", text: "Failed to save batting order" });
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Verifying captain credentials...
        </div>
      </PageShell>
    );
  }

  if (!team) {
    return (
      <PageShell title="Captain Hub">
        <p className="text-sm text-[var(--color-text-secondary)]">
          No team assignment found for this captain account.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Captain Hub: ${team.name}`}
      subtitle={`Welcome ${session?.displayName} • Manage batting lineup and squad positions`}
    >
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-[var(--color-status-win-bg)] border border-[var(--color-status-win)]/30 text-[var(--color-brand-teal-light)]"
              : "bg-[var(--color-status-live-bg)] border border-[var(--color-status-live)]/30 text-[var(--color-status-live)]"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-xs uppercase font-bold px-2 py-1 hover:bg-white/10 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Auction Alert Banner */}
      {hasActiveAuction && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-brand-orange-dim)] via-[var(--color-brand-night-surface)] to-[var(--color-bg-surface)] border border-[var(--color-brand-orange)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="live" withPulse size="sm">
              Live Bidding Open
            </Badge>
            <div>
              <span className="font-bold text-white text-sm block">
                Player Under The Hammer!
              </span>
              <p className="text-xs text-[var(--color-text-secondary)]">
                An active auction round is underway on the exchange. Submit franchise bids for {team.name}.
              </p>
            </div>
          </div>
          <Link href="/auction">
            <Button size="sm" variant="primary">
              Enter Live Auction to Bid →
            </Button>
          </Link>
        </div>
      )}

      {/* Team Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Registered Squad
            </span>
            <div className="mt-1 font-score text-2xl font-bold text-white">
              {squad.length} Players
            </div>
          </CardBody>
        </Card>

        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Match Readiness
            </span>
            <div className="mt-1">
              <Badge variant={squad.length >= 11 ? "win" : "loss"} size="md">
                {squad.length >= 11 ? "Eligible (11+ Players)" : "Ineligible (< 11 Players)"}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Remaining Budget
            </span>
            <div className="mt-1 font-score text-2xl font-bold text-[var(--color-accent)]">
              {formatCurrency(team.remainingBudget)}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Batting Order & Positions Manager */}
      <Card variant="surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
              Batting Order & Tactical Roles
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Use arrow buttons to adjust lineup sequence
            </span>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {squad.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No players currently registered in this team squad. Players will appear after auction allocation or registration by the tournament admin.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-center">Reassign Role</th>
                  <th className="py-3 px-4 text-right">Order Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-score">
                {squad.map((player, idx) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--color-accent)]">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {player.name}
                      {player.id === team.captainId && (
                        <span className="ml-2 text-xs text-[var(--color-brand-orange)] font-bold">
                          (Captain)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <Badge variant="teal" size="sm">
                        {player.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <select
                        value={player.role}
                        onChange={(e) =>
                          handleUpdateRole(player.id, e.target.value as PlayerRole)
                        }
                        className="px-2 py-1 rounded bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs text-white"
                      >
                        <option value="Batter">Batter</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-rounder">All-rounder</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => movePlayerOrder(idx, "up")}
                          aria-label="Move player up in batting order"
                          className="p-1 rounded bg-black/40 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white font-bold"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === squad.length - 1}
                          onClick={() => movePlayerOrder(idx, "down")}
                          aria-label="Move player down in batting order"
                          className="p-1 rounded bg-black/40 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-white font-bold"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
