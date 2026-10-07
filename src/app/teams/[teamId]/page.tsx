"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { Team, Player } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

function TeamDetailContent({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const [data, setData] = useState<{ team: Team; squad: Player[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`/api/teams/${teamId}`);
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

    load();

    return () => {
      isMounted = false;
    };
  }, [teamId]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading franchise squad...
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell title="Team Not Found">
        <p className="text-sm text-[var(--color-text-secondary)]">
          The requested franchise team does not exist.
        </p>
        <Link href="/teams" className="inline-block mt-4">
          <Button variant="secondary">Back to Teams</Button>
        </Link>
      </PageShell>
    );
  }

  const { team, squad } = data;
  const captain = squad.find((p) => p.id === team.captainId);
  const totalSpent = squad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

  return (
    <PageShell
      title={team.name}
      subtitle={`${team.shortName} • Franchise Squad Roster`}
      action={
        <Link href="/teams">
          <Button size="sm" variant="ghost">
            ← All Teams
          </Button>
        </Link>
      }
    >
      {/* Overview Banner */}
      <Card variant="surface" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center font-display font-black text-3xl text-black shadow-lg"
              style={{ backgroundColor: team.primaryColor || "#00B07D" }}
            >
              {team.shortName}
            </div>
            <div>
              <h2 className="text-3xl font-black font-display uppercase tracking-wide text-white">
                {team.name}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Captain:{" "}
                <span className="font-semibold text-[var(--color-accent)]">
                  {captain?.name || "Unassigned"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-score text-center">
            <div className="p-3 rounded-lg bg-black/25">
              <span className="text-xs text-[var(--color-text-secondary)] uppercase block">Squad</span>
              <span className="text-xl font-bold text-white">{squad.length} Players</span>
            </div>
            <div className="p-3 rounded-lg bg-black/25">
              <span className="text-xs text-[var(--color-text-secondary)] uppercase block">Purse Spent</span>
              <span className="text-base font-bold text-[var(--color-brand-teal-light)]">
                {formatCurrency(totalSpent)}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-black/25">
              <span className="text-xs text-[var(--color-text-secondary)] uppercase block">Remaining</span>
              <span className="text-base font-bold text-[var(--color-accent)]">
                {formatCurrency(team.remainingBudget)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Squad Roster Table */}
      <Card variant="surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
              Official Squad ({squad.length})
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Min 11 players required for match eligibility
            </span>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {squad.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No players currently signed to this team.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Runs</th>
                  <th className="py-3 px-4 text-right">Wickets</th>
                  <th className="py-3 px-4 text-right">Acquisition Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-score">
                {squad.map((player, idx) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {player.name}
                      {player.id === team.captainId && (
                        <span className="ml-2 text-xs text-[var(--color-accent)] font-semibold font-display">
                          (C)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <Badge variant="teal" size="sm">
                        {player.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {player.stats.runs}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {player.stats.wickets}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[var(--color-accent)]">
                      {formatCurrency(player.soldPrice || player.basePrice)}
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

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
            Loading franchise squad...
          </div>
        </PageShell>
      }
    >
      <TeamDetailContent params={params} />
    </Suspense>
  );
}
