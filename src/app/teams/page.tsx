"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TeamSummary } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch("/api/teams");
        const json = await res.json();
        if (isMounted && json.success) {
          setTeams(json.data || []);
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
  }, []);

  return (
    <PageShell
      title="Franchise Teams"
      subtitle="Competing squads, roster limits, and captains for Season 2"
    >
      {isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading franchises...
        </div>
      ) : teams.length === 0 ? (
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          No teams registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id} variant="surface">
              <CardBody className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-2xl text-black shadow-lg"
                      style={{ backgroundColor: team.primaryColor || "#00B07D" }}
                    >
                      {team.shortName}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black font-display uppercase tracking-wide text-white">
                        {team.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        Captain:{" "}
                        <strong className="text-[var(--color-accent)] font-semibold">
                          {team.captainName || "Not Assigned"}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border)] text-center font-score">
                  <div className="p-3 rounded-lg bg-black/25">
                    <span className="text-[11px] text-[var(--color-text-secondary)] block">Registered</span>
                    <span className="text-lg font-bold text-white">{team.playerCount} Players</span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/25">
                    <span className="text-[11px] text-[var(--color-text-secondary)] block">Spent</span>
                    <span className="text-sm font-bold text-[var(--color-brand-teal-light)] truncate block">
                      {formatCurrency(team.amountSpent)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-black/25">
                    <span className="text-[11px] text-[var(--color-text-secondary)] block">Remaining</span>
                    <span className="text-sm font-bold text-[var(--color-accent)] truncate block">
                      {formatCurrency(team.remainingBudget)}
                    </span>
                  </div>
                </div>

                <Link href={`/teams/${team.id}`} className="block">
                  <Button size="md" variant="secondary" className="w-full">
                    View Full Squad Roster →
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
