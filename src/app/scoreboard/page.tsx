"use client";

import React, { useState, useEffect } from "react";
import { Match, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { LiveScoreCard } from "@/components/scoreboard/LiveScoreCard";
import { Button } from "@/components/ui/Button";

export default function ScoreboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filter, setFilter] = useState<"all" | "live" | "completed" | "scheduled">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMatches() {
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
        // Silently catch errors on unmount
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/teams"),
      ]);
      const [mJson, tJson] = await Promise.all([mRes.json(), tRes.json()]);
      if (mJson.success) setMatches(mJson.data || []);
      if (tJson.success) setTeams(tJson.data || []);
    } catch {
      // Error handle
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  return (
    <PageShell
      title="Match Scoreboard"
      subtitle="Live scores, innings breakdowns, and completed match results"
      action={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleManualRefresh}>
            Refresh
          </Button>
        </div>
      }
    >
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4">
        {(["all", "live", "completed", "scheduled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide uppercase font-display transition-colors cursor-pointer ${
              filter === tab
                ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] glow-yellow"
                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
            }`}
          >
            {tab === "all" ? "All Fixtures" : tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-secondary)]">
          Loading scoreboard...
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-secondary)]">
          No matches found under this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map((match) => (
            <LiveScoreCard key={match.id} match={match} teams={teams} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
