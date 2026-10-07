"use client";

import React, { useState, useEffect } from "react";
import { Player, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch("/api/players"),
          fetch("/api/teams"),
        ]);
        const [pJson, tJson] = await Promise.all([pRes.json(), tRes.json()]);
        if (pJson.success) setPlayers(pJson.data || []);
        if (tJson.success) setTeams(tJson.data || []);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredPlayers = players.filter((p) => {
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getTeamName = (teamId?: string) => {
    if (!teamId) return "Free Agent";
    return teams.find((t) => t.id === teamId)?.name || "Franchise";
  };

  return (
    <PageShell
      title="Player Profiles & Registry"
      subtitle="Career statistics, roles, and franchise allocations"
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex flex-wrap items-center gap-2">
          {["all", "Batter", "Bowler", "All-rounder", "Wicketkeeper"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase font-display transition-colors cursor-pointer ${
                roleFilter === role
                  ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] glow-yellow"
                  : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              {role === "all" ? "All Positions" : role}
            </button>
          ))}
        </div>

        <div>
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-sm text-white placeholder-[var(--color-text-disabled)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Loading player registry...
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          No players found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <Card key={player.id} variant="surface">
              <CardBody className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="teal" size="sm">
                    {player.role}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {player.stats.matches} Matches
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    {player.name}
                  </h3>
                  <p className="text-xs text-[var(--color-accent)] font-semibold mt-0.5">
                    {getTeamName(player.teamId)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 font-score text-center text-xs">
                  <div className="p-1.5 rounded bg-black/20">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Runs</span>
                    <span className="font-bold text-white">{player.stats.runs}</span>
                  </div>
                  <div className="p-1.5 rounded bg-black/20">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Wkts</span>
                    <span className="font-bold text-white">{player.stats.wickets}</span>
                  </div>
                  <div className="p-1.5 rounded bg-black/20">
                    <span className="text-[10px] text-[var(--color-text-secondary)] block">Best</span>
                    <span className="font-bold text-white truncate block">
                      {player.role === "Bowler" ? player.stats.bestBowling : player.stats.highestScore}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-score">
                  <span className="text-[var(--color-text-secondary)]">Price:</span>
                  <span className="font-bold text-[var(--color-brand-teal-light)]">
                    {formatCurrency(player.soldPrice || player.basePrice)}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
