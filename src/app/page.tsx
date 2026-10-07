"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Match, Team, ActivityEvent } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { LiveScoreCard } from "@/components/scoreboard/LiveScoreCard";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [mRes, tRes, aRes] = await Promise.all([
          fetch("/api/matches"),
          fetch("/api/teams"),
          fetch("/api/activity?limit=6"),
        ]);

        const [mJson, tJson, aJson] = await Promise.all([
          mRes.json(),
          tRes.json(),
          aRes.json(),
        ]);

        if (isMounted) {
          if (mJson.success) setMatches(mJson.data || []);
          if (tJson.success) setTeams(tJson.data || []);
          if (aJson.success) setActivities(aJson.data || []);
        }
      } catch {
        // Silently catch fetch errors on unmount
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const liveMatch = matches.find((m) => m.status === "live");

  const totalPurseSpent = teams.reduce(
    (sum, t) => sum + (t.totalBudget - t.remainingBudget),
    0
  );

  return (
    <PageShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand-orange-dim)] via-[var(--color-brand-night-mid)] to-[var(--color-brand-night)] border border-[var(--color-brand-orange)]/30 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-orange)]/20 border border-[var(--color-brand-orange)]/40 text-[var(--color-accent)] font-display uppercase tracking-widest text-xs font-bold">
            Season 2 Tournament
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-white uppercase leading-none">
            Time To Be More
          </h1>

          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
            Welcome to the Raptee Premier League. Follow live ball-by-ball commentary, real-time team auctions, batting stats, and championship fixtures.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/scoreboard">
              <Button size="lg" variant="primary">
                Live Scoreboard
              </Button>
            </Link>
            <Link href="/auction">
              <Button size="lg" variant="secondary">
                Auction Hub
              </Button>
            </Link>
            <Link href="/schedule">
              <Button size="lg" variant="ghost">
                Match Fixtures
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background energy lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-20 hidden lg:block bg-gradient-to-l from-[var(--color-accent)] to-transparent" />
      </section>

      {/* Live Match Alert / Spotlight */}
      {liveMatch && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-[var(--color-text-primary)]">
                Live Match In Progress
              </h2>
            </div>
            <Link href={`/scoreboard/${liveMatch.id}`} className="text-xs text-[var(--color-accent)] font-semibold hover:underline">
              Full Commentary →
            </Link>
          </div>
          <LiveScoreCard match={liveMatch} teams={teams} isFeatured />
        </section>
      )}

      {/* Tournament Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Franchise Teams
            </span>
            <div className="mt-1 font-score text-3xl font-bold text-[var(--color-accent)]">
              {teams.length}
            </div>
          </CardBody>
        </Card>

        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Total Matches
            </span>
            <div className="mt-1 font-score text-3xl font-bold text-[var(--color-text-primary)]">
              {matches.length}
            </div>
          </CardBody>
        </Card>

        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Live Fixtures
            </span>
            <div className="mt-1 font-score text-3xl font-bold text-[var(--color-status-live)]">
              {liveMatch ? 1 : 0}
            </div>
          </CardBody>
        </Card>

        <Card variant="surface">
          <CardBody className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Auction Purse Spent
            </span>
            <div className="mt-1 font-score text-xl font-bold text-[var(--color-brand-teal-light)] truncate">
              {formatCurrency(totalPurseSpent)}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Main Grid: Upcoming Fixtures & Live Activity Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Fixtures */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-[var(--color-text-primary)]">
              Tournament Fixtures
            </h2>
            <Link href="/schedule" className="text-xs text-[var(--color-accent)] font-semibold hover:underline">
              View All Fixtures →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              Loading fixtures...
            </div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No fixtures scheduled yet.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 3).map((match) => (
                <LiveScoreCard key={match.id} match={match} teams={teams} />
              ))}
            </div>
          )}

          {/* Teams Showcase */}
          <div className="pt-6 space-y-4">
            <h3 className="text-xl font-bold font-display uppercase tracking-wide text-[var(--color-text-primary)]">
              Competing Franchises
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="block p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm text-black"
                        style={{ backgroundColor: team.primaryColor || "#00B07D" }}
                      >
                        {team.shortName}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[var(--color-text-primary)]">
                          {team.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {team.playerIds.length} Registered Players
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-score text-xs">
                      <span className="text-[var(--color-text-secondary)]">Remaining</span>
                      <div className="font-bold text-[var(--color-brand-teal-light)]">
                        {formatCurrency(team.remainingBudget)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Activity Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <h2 className="text-2xl font-bold font-display uppercase tracking-wide text-[var(--color-text-primary)]">
              Activity Feed
            </h2>
            <Badge variant="teal" size="sm">
              Real-time
            </Badge>
          </div>

          <Card variant="surface">
            <CardBody className="p-4">
              <ActivityFeed activities={activities} maxItems={6} />
            </CardBody>
          </Card>

          {/* Quick Auction Callout */}
          <Card variant="accent" className="p-5 space-y-3 bg-gradient-to-br from-[var(--color-brand-night-surface)] to-[var(--color-bg-surface)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
                Player Auction
              </span>
              <Badge variant="yellow" size="sm">
                Active Pool
              </Badge>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Teams are bidding to acquire players within their salary caps. Check who was bought and current budget utilization.
            </p>
            <Link href="/auction" className="block">
              <Button size="sm" variant="primary" className="w-full">
                Enter Auction Hub
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
