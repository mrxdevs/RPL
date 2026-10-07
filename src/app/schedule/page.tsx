"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Match, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SchedulePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
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
    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingMatches = matches.filter((m) => m.status === "scheduled");
  const liveMatches = matches.filter((m) => m.status === "live");
  const completedMatches = matches.filter((m) => m.status === "completed");

  const getTeamName = (id: string) => teams.find((t) => t.id === id)?.name || "Team";
  const getTeamShort = (id: string) => teams.find((t) => t.id === id)?.shortName || "";

  return (
    <PageShell
      title="Match Schedule & Fixtures"
      subtitle="Complete timetable for RPL Season 2 fixtures and match results"
    >
      {isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading schedule...
        </div>
      ) : (
        <div className="space-y-10">
          {/* Live Section (if any) */}
          {liveMatches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-white">
                  Live Action
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map((m) => (
                  <Card key={m.id} variant="accent">
                    <CardBody className="p-5 flex items-center justify-between">
                      <div>
                        <Badge variant="live" withPulse size="sm">
                          Live
                        </Badge>
                        <h3 className="mt-2 text-lg font-bold font-display text-white">
                          {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}
                        </h3>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {m.venue} • {m.format}
                        </p>
                      </div>
                      <Link href={`/scoreboard/${m.id}`}>
                        <Button size="sm" variant="primary">
                          Watch Live
                        </Button>
                      </Link>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Fixtures */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-white pb-2 border-b border-[var(--color-border)]">
              Upcoming Fixtures
            </h2>
            {upcomingMatches.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                No upcoming matches scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((m) => {
                  const dateStr = new Date(m.scheduledAt).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <Card key={m.id} variant="surface">
                      <CardBody className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                            {m.title}
                          </span>
                          <Badge variant="upcoming" size="sm">
                            {m.format}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between py-2 border-y border-white/5">
                          <div className="font-bold text-sm text-white font-display uppercase">
                            {getTeamName(m.teamAId)}
                          </div>
                          <span className="text-xs text-[var(--color-accent)] font-bold px-2">
                            VS
                          </span>
                          <div className="font-bold text-sm text-white font-display uppercase">
                            {getTeamName(m.teamBId)}
                          </div>
                        </div>

                        <div className="text-xs text-[var(--color-text-secondary)] space-y-0.5">
                          <div>Date: {dateStr}</div>
                          <div>Venue: {m.venue}</div>
                        </div>

                        <Link href={`/scoreboard/${m.id}`} className="block pt-1">
                          <Button size="sm" variant="secondary" className="w-full">
                            Fixture Details
                          </Button>
                        </Link>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Results */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-white pb-2 border-b border-[var(--color-border)]">
              Completed Match Results
            </h2>
            {completedMatches.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                No matches completed yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedMatches.map((m) => (
                  <Card key={m.id} variant="surface">
                    <CardBody className="p-5 flex flex-col justify-between gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-secondary)] font-semibold font-display uppercase">
                          {m.title}
                        </span>
                        <Badge variant="win" size="sm">
                          Completed
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="font-bold text-base text-white font-display">
                          {getTeamShort(m.teamAId)} vs {getTeamShort(m.teamBId)}
                        </span>
                        <span className="text-sm font-semibold text-[var(--color-accent)] font-display">
                          {m.resultSummary}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                        <span>{m.venue}</span>
                        <Link href={`/scoreboard/${m.id}`}>
                          <Button size="sm" variant="ghost">
                            View Scorecard →
                          </Button>
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
