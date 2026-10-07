"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuctionState, Player, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function AuctionPage() {
  const [data, setData] = useState<{
    auction: AuctionState;
    availablePlayers: Player[];
    soldPlayers: Player[];
    teams: Team[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"teams" | "sold" | "available">("teams");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAuctionData() {
      try {
        const res = await fetch("/api/auction");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setData(json.data);
        }
      } catch {
        // Silently catch error on unmount
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAuctionData();
    const interval = setInterval(fetchAuctionData, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading || !data) {
    return (
      <PageShell title="Player Auction" subtitle="Loading auction data...">
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading auction board...
        </div>
      </PageShell>
    );
  }

  const { auction, availablePlayers, soldPlayers, teams } = data;
  const currentLotPlayer = data.availablePlayers.find(
    (p) => p.id === auction.currentLotPlayerId
  );
  const leadingTeam = teams.find((t) => t.id === auction.currentLeadingTeamId);

  return (
    <PageShell
      title="Player Auction & Salary Caps"
      subtitle="Real-time auction transactions, team budgets, and player allocations"
      action={
        <Badge variant="yellow" size="md">
          Live Auction Engine
        </Badge>
      }
    >
      {/* Current Active Lot (if in progress) */}
      {currentLotPlayer && (
        <section className="p-6 rounded-2xl bg-gradient-to-r from-[var(--color-brand-orange-dim)] via-[var(--color-brand-night-surface)] to-[var(--color-bg-surface)] border border-[var(--color-brand-orange)]/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
              Under The Hammer • Active Lot
            </span>
            <Badge variant="live" withPulse size="sm">
              Bidding Open
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black font-display uppercase tracking-wide text-white">
                {currentLotPlayer.name}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <Badge variant="teal" size="sm">
                  {currentLotPlayer.role}
                </Badge>
                <span>
                  Base Price: <strong className="text-white font-score">{formatCurrency(currentLotPlayer.basePrice)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 font-score p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <span className="text-xs text-[var(--color-text-secondary)] block">Current Bid</span>
                <span className="text-3xl font-black text-[var(--color-accent)]">
                  {formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)}
                </span>
              </div>
              {leadingTeam && (
                <div className="pl-6 border-l border-white/10">
                  <span className="text-xs text-[var(--color-text-secondary)] block">Leading Franchise</span>
                  <span className="text-lg font-bold text-white font-display uppercase">
                    {leadingTeam.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        {(
          [
            { key: "teams", label: `Team Budgets (${teams.length})` },
            { key: "sold", label: `Sold Players (${soldPlayers.length})` },
            { key: "available", label: `Available Pool (${availablePlayers.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide uppercase font-display transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] glow-yellow"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Teams Salary Caps */}
      {activeTab === "teams" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const spent = t.totalBudget - t.remainingBudget;
            const pctSpent = Math.round((spent / t.totalBudget) * 100);

            return (
              <Card key={t.id} variant="surface">
                <CardBody className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-display uppercase tracking-wide text-white">
                        {t.name}
                      </h3>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {t.playerIds.length} Squad Members
                      </span>
                    </div>
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-black"
                      style={{ backgroundColor: t.primaryColor || "#00B07D" }}
                    >
                      {t.shortName}
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-score">
                      <span className="text-[var(--color-text-secondary)]">Spent: {formatCurrency(spent)}</span>
                      <span className="text-[var(--color-brand-teal-light)] font-bold">
                        {pctSpent}% Utilized
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--color-brand-teal)] to-[var(--color-accent)] transition-all duration-500"
                        style={{ width: `${pctSpent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)] font-score">
                    <div className="p-2.5 rounded-lg bg-black/20">
                      <span className="text-[11px] text-[var(--color-text-secondary)] block">Total Purse</span>
                      <span className="text-sm font-bold text-white">{formatCurrency(t.totalBudget)}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/20">
                      <span className="text-[11px] text-[var(--color-text-secondary)] block">Remaining Cap</span>
                      <span className="text-sm font-bold text-[var(--color-accent)]">
                        {formatCurrency(t.remainingBudget)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/teams/${t.id}`} className="block pt-1">
                    <Button size="sm" variant="secondary" className="w-full">
                      View Team Roster →
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Sold Players */}
      {activeTab === "sold" && (
        <Card variant="surface">
          <CardBody className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Acquiring Franchise</th>
                  <th className="py-3 px-4 text-right">Base Price</th>
                  <th className="py-3 px-4 text-right">Sold Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-score">
                {soldPlayers.map((p) => {
                  const team = teams.find((t) => t.id === p.teamId);
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <Badge variant="teal" size="sm">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-[var(--color-accent)]">
                        {team?.name || "Assigned"}
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--color-text-secondary)]">
                        {formatCurrency(p.basePrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[var(--color-brand-teal-light)] text-base">
                        {formatCurrency(p.soldPrice || p.basePrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {/* Tab 3: Available Pool */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availablePlayers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-[var(--color-text-secondary)]">
              No players currently available in the auction pool.
            </div>
          ) : (
            availablePlayers.map((p) => (
              <Card key={p.id} variant="surface">
                <CardBody className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="teal" size="sm">
                      {p.role}
                    </Badge>
                    <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                      {p.stats.matches} Matches
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-white font-display">
                      {p.name}
                    </h4>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/20 font-score flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-secondary)]">Base Price:</span>
                    <span className="font-bold text-[var(--color-accent)]">
                      {formatCurrency(p.basePrice)}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}
    </PageShell>
  );
}
