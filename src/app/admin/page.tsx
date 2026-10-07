"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Team, Player, Match, PlayerRole } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState(false);
  const [selectedTeamForCaptain, setSelectedTeamForCaptain] = useState<Team | null>(null);
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>("");
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
  const [selectedAuctionPlayer, setSelectedAuctionPlayer] = useState<Player | null>(null);

  // Form states
  const [teamForm, setTeamForm] = useState({ name: "", shortName: "", totalBudget: 10000000, primaryColor: "#F55A00" });
  const [playerForm, setPlayerForm] = useState<{ name: string; role: PlayerRole; basePrice: number }>({
    name: "",
    role: "Batter",
    basePrice: 500000,
  });
  const [matchForm, setMatchForm] = useState({
    title: "",
    teamAId: "",
    teamBId: "",
    scheduledAt: "2026-10-08T14:00",
    venue: "Raptee Arena, Chennai",
    format: "T20",
  });
  const [auctionForm, setAuctionForm] = useState({ teamId: "", soldPrice: 0 });

  const loadData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meJson = await meRes.json();
      if (!meJson.success || !meJson.data || meJson.data.role !== "admin") {
        router.push("/login");
        return;
      }

      const [tRes, pRes, mRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/players"),
        fetch("/api/matches"),
      ]);
      const [tJson, pJson, mJson] = await Promise.all([tRes.json(), pRes.json(), mRes.json()]);

      if (tJson.success) setTeams(tJson.data || []);
      if (pJson.success) setPlayers(pJson.data || []);
      if (mJson.success) setMatches(mJson.data || []);
    } catch {
      setStatusMsg({ type: "error", text: "Failed to load admin data" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (!isMounted) return;
        if (!meJson.success || !meJson.data || meJson.data.role !== "admin") {
          router.push("/login");
          return;
        }

        const [tRes, pRes, mRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/players"),
          fetch("/api/matches"),
        ]);
        const [tJson, pJson, mJson] = await Promise.all([tRes.json(), pRes.json(), mRes.json()]);

        if (isMounted) {
          if (tJson.success) setTeams(tJson.data || []);
          if (pJson.success) setPlayers(pJson.data || []);
          if (mJson.success) setMatches(mJson.data || []);
        }
      } catch {
        if (isMounted) setStatusMsg({ type: "error", text: "Failed to load admin data" });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to create team" });
        return;
      }
      setStatusMsg({ type: "success", text: "Team registered successfully!" });
      setIsTeamModalOpen(false);
      setTeamForm({ name: "", shortName: "", totalBudget: 10000000, primaryColor: "#F55A00" });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error creating team" });
    }
  };

  const handleRegisterPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to register player" });
        return;
      }
      setStatusMsg({ type: "success", text: "Player added to auction pool!" });
      setIsPlayerModalOpen(false);
      setPlayerForm({ name: "", role: "Batter", basePrice: 500000 });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error registering player" });
    }
  };

  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchForm.teamAId || !matchForm.teamBId) {
      setStatusMsg({ type: "error", text: "Both Team A and Team B must be selected." });
      return;
    }
    if (matchForm.teamAId === matchForm.teamBId) {
      setStatusMsg({ type: "error", text: "Team A and Team B cannot be the same franchise." });
      return;
    }
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to schedule match" });
        return;
      }
      setStatusMsg({ type: "success", text: "Match fixture scheduled successfully!" });
      setIsMatchModalOpen(false);
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error scheduling match" });
    }
  };

  const handleSellPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuctionPlayer) return;

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          playerId: selectedAuctionPlayer.id,
          teamId: auctionForm.teamId,
          soldPrice: auctionForm.soldPrice,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to sell player" });
        return;
      }
      setStatusMsg({ type: "success", text: json.message || "Player sold successfully" });
      setIsAuctionModalOpen(false);
      setSelectedAuctionPlayer(null);
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error processing auction" });
    }
  };

  const handleReleasePlayer = async (player: Player) => {
    if (!confirm(`Are you sure you want to release ${player.name}? This will restore their cost to the team budget.`)) {
      return;
    }
    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "release",
          playerId: player.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to release player" });
        return;
      }
      setStatusMsg({ type: "success", text: json.message || "Player released back to auction" });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error releasing player" });
    }
  };

  const openCaptainModal = (team: Team) => {
    setSelectedTeamForCaptain(team);
    setSelectedCaptainId(team.captainId || "");
    setIsCaptainModalOpen(true);
  };

  const handleAssignCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForCaptain) return;

    try {
      const res = await fetch(`/api/teams/${selectedTeamForCaptain.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captainId: selectedCaptainId || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to assign captain" });
        return;
      }
      setStatusMsg({ type: "success", text: `Captain assigned for ${selectedTeamForCaptain.name}!` });
      setIsCaptainModalOpen(false);
      setSelectedTeamForCaptain(null);
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error updating captain assignment" });
    }
  };

  const openAuctionModal = (p: Player) => {
    if (teams.length === 0) {
      setStatusMsg({ type: "error", text: "Please create at least one franchise team before selling players." });
      return;
    }
    setSelectedAuctionPlayer(p);
    setAuctionForm({ teamId: teams[0]?.id || "", soldPrice: p.basePrice });
    setIsAuctionModalOpen(true);
  };

  const openMatchModal = () => {
    if (teams.length < 2) {
      setStatusMsg({ type: "error", text: "At least two franchise teams must be created before scheduling tournament fixtures." });
      return;
    }
    setMatchForm({
      title: `Match ${matches.length + 1}`,
      teamAId: teams[0]?.id || "",
      teamBId: teams[1]?.id || "",
      scheduledAt: "2026-10-08T14:00",
      venue: "Raptee Arena, Chennai",
      format: "T20",
    });
    setIsMatchModalOpen(true);
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Verifying administrator credentials...
        </div>
      </PageShell>
    );
  }

  const availablePlayers = players.filter((p) => p.auctionStatus === "available");
  const soldPlayers = players.filter((p) => p.auctionStatus === "sold");

  return (
    <PageShell
      title="Administrator Console"
      subtitle="Tournament director control center for teams, salary caps, auctions, and fixtures"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setIsTeamModalOpen(true)}>
            + Create Team
          </Button>
          <Button size="sm" variant="teal" onClick={() => setIsPlayerModalOpen(true)}>
            + Register Player
          </Button>
          <Button size="sm" variant="secondary" onClick={openMatchModal}>
            + Schedule Fixture
          </Button>
        </div>
      }
    >
      {/* Alert Banner */}
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

      {/* Grid: Teams & Auction Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teams Overview & Budget Status */}
        <Card variant="surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Franchise Salary Caps ({teams.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsTeamModalOpen(true)}>
                New Team
              </Button>
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-white/5 p-0">
            {teams.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
                No franchise teams created yet. Click &quot;New Team&quot; above to begin.
              </div>
            ) : (
              teams.map((t) => {
                const captain = players.find((p) => p.id === t.captainId);
                return (
                  <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-display uppercase">
                          {t.name} ({t.shortName})
                        </span>
                        <Badge variant={t.playerIds.length >= 11 ? "win" : "upcoming"} size="sm">
                          {t.playerIds.length}/11 Players
                        </Badge>
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1 font-score space-x-2">
                        <span>
                          Captain:{" "}
                          <strong className={captain ? "text-[var(--color-brand-orange)] font-semibold" : "text-[var(--color-text-disabled)]"}>
                            {captain?.name || "Not Assigned"}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Remaining Cap: <strong className="text-[var(--color-accent)]">{formatCurrency(t.remainingBudget)}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openCaptainModal(t)}>
                        Assign Captain
                      </Button>
                      <Link href={`/teams/${t.id}`}>
                        <Button size="sm" variant="ghost">
                          Roster →
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

        {/* Available Auction Pool */}
        <Card variant="surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                Auction Bidding Pool ({availablePlayers.length})
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsPlayerModalOpen(true)}>
                Add Player
              </Button>
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-white/5 p-0 max-h-96 overflow-y-auto">
            {availablePlayers.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
                All players have been auctioned or no players registered.
              </div>
            ) : (
              availablePlayers.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-white font-display text-sm">
                      {p.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <Badge variant="teal" size="sm">
                        {p.role}
                      </Badge>
                      <span className="text-[var(--color-text-secondary)] font-score">
                        Base: {formatCurrency(p.basePrice)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => openAuctionModal(p)}>
                    Sell to Team
                  </Button>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sold Players & Player Release Management */}
      <Card variant="surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
              Assigned Squad Members & Player Releases ({soldPlayers.length})
            </h3>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Release players before tournament to restore team budgets
            </span>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Franchise</th>
                <th className="py-3 px-4 text-right">Sold Price</th>
                <th className="py-3 px-4 text-right">Action</th>
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
                      {team?.name || "Team"}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {formatCurrency(p.soldPrice || p.basePrice)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReleasePlayer(p)}
                      >
                        Release
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Fixtures Management */}
      <Card variant="surface">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
              Tournament Fixture Schedule ({matches.length})
            </h3>
            <Button size="sm" variant="secondary" onClick={openMatchModal}>
              Schedule New Match
            </Button>
          </div>
        </CardHeader>
        <CardBody className="divide-y divide-white/5 p-0">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No tournament matches scheduled yet. Click &quot;Schedule New Match&quot; above to add fixtures.
            </div>
          ) : (
            matches.map((m) => {
            const teamA = teams.find((t) => t.id === m.teamAId);
            const teamB = teams.find((t) => t.id === m.teamBId);

            return (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-display text-base">
                      {m.title}
                    </span>
                    <Badge variant={m.status === "live" ? "live" : m.status === "completed" ? "win" : "upcoming"} size="sm">
                      {m.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {teamA?.name} vs {teamB?.name} • {m.venue} • {m.format}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/scoreboard/${m.id}`}>
                    <Button size="sm" variant="ghost">
                      Scoreboard
                    </Button>
                  </Link>
                  {m.status === "live" && (
                    <Link href={`/umpire/${m.id}`}>
                      <Button size="sm" variant="primary">
                        Scoring Console
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
        </CardBody>
      </Card>

      {/* Modal: Create Team */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Create New Franchise">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Team Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Hyderabad Hurricanes"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Short Code (2-3 chars)
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. HH"
                value={teamForm.shortName}
                onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Salary Cap (₹)
              </label>
              <input
                type="number"
                required
                min={100000}
                step={100000}
                value={teamForm.totalBudget}
                onChange={(e) => setTeamForm({ ...teamForm, totalBudget: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white font-score"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Register Franchise
          </Button>
        </form>
      </Modal>

      {/* Modal: Assign Captain */}
      <Modal
        isOpen={isCaptainModalOpen}
        onClose={() => setIsCaptainModalOpen(false)}
        title={`Assign Captain: ${selectedTeamForCaptain?.name || "Team"}`}
      >
        <form onSubmit={handleAssignCaptain} className="space-y-4">
          <div className="p-3 rounded-lg bg-black/20 text-xs text-[var(--color-text-secondary)]">
            Designate the team captain for <span className="text-white font-semibold">{selectedTeamForCaptain?.name}</span>. The captain will be authorized to configure match batting lineups and tactical roles.
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Select Captain
            </label>
            <select
              value={selectedCaptainId}
              onChange={(e) => setSelectedCaptainId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              <option value="">No Captain Assigned (Unassign)</option>
              {players.length === 0 ? (
                <option value="" disabled>No registered players available</option>
              ) : (
                players.map((p) => {
                  const isAlreadyInTeam = p.teamId === selectedTeamForCaptain?.id;
                  const isOtherTeam = p.teamId && p.teamId !== selectedTeamForCaptain?.id;
                  const otherTeamName = isOtherTeam ? teams.find((t) => t.id === p.teamId)?.name : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role}) {isAlreadyInTeam ? "• Current Squad" : isOtherTeam ? `• In ${otherTeamName}` : "• Available Pool"}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Confirm Captain Assignment
          </Button>
        </form>
      </Modal>

      {/* Modal: Register Player */}
      <Modal isOpen={isPlayerModalOpen} onClose={() => setIsPlayerModalOpen(false)} title="Register New Player">
        <form onSubmit={handleRegisterPlayer} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Player Name
            </label>
            <input
              type="text"
              required
              placeholder="Full name"
              value={playerForm.name}
              onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Position Role
              </label>
              <select
                value={playerForm.role}
                onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value as PlayerRole })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="Batter">Batter</option>
                <option value="Bowler">Bowler</option>
                <option value="All-rounder">All-rounder</option>
                <option value="Wicketkeeper">Wicketkeeper</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Base Price (₹)
              </label>
              <input
                type="number"
                required
                min={50000}
                step={50000}
                value={playerForm.basePrice}
                onChange={(e) => setPlayerForm({ ...playerForm, basePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white font-score"
              />
            </div>
          </div>

          <Button type="submit" variant="teal" size="md" className="w-full">
            Add to Auction Pool
          </Button>
        </form>
      </Modal>

      {/* Modal: Sell Player in Auction */}
      <Modal
        isOpen={isAuctionModalOpen}
        onClose={() => setIsAuctionModalOpen(false)}
        title={`Auction: ${selectedAuctionPlayer?.name}`}
      >
        <form onSubmit={handleSellPlayer} className="space-y-4">
          <div className="p-3 rounded-lg bg-black/20 text-xs text-[var(--color-text-secondary)] font-score">
            Position: <span className="text-white font-sans">{selectedAuctionPlayer?.role}</span> • Base Price:{" "}
            <span className="text-[var(--color-accent)]">{formatCurrency(selectedAuctionPlayer?.basePrice || 0)}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Winning Franchise
            </label>
            <select
              required
              value={auctionForm.teamId}
              onChange={(e) => setAuctionForm({ ...auctionForm, teamId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            >
              <option value="">Select Team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Remaining: {formatCurrency(t.remainingBudget)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Sold Final Price (₹)
            </label>
            <input
              type="number"
              required
              min={selectedAuctionPlayer?.basePrice || 100000}
              step={50000}
              value={auctionForm.soldPrice}
              onChange={(e) => setAuctionForm({ ...auctionForm, soldPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white font-score"
            />
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Confirm Auction Sale & Deduct Budget
          </Button>
        </form>
      </Modal>

      {/* Modal: Schedule Fixture */}
      <Modal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} title="Schedule Tournament Fixture">
        <form onSubmit={handleScheduleMatch} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Fixture Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. League Match 4 - Coast Derby"
              value={matchForm.title}
              onChange={(e) => setMatchForm({ ...matchForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Team A
              </label>
              <select
                required
                value={matchForm.teamAId}
                onChange={(e) => setMatchForm({ ...matchForm, teamAId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="">Select Team A</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.playerIds.length} players)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Team B
              </label>
              <select
                required
                value={matchForm.teamBId}
                onChange={(e) => setMatchForm({ ...matchForm, teamBId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="">Select Team B</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.playerIds.length} players)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Venue
              </label>
              <input
                type="text"
                required
                value={matchForm.venue}
                onChange={(e) => setMatchForm({ ...matchForm, venue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Format
              </label>
              <select
                value={matchForm.format}
                onChange={(e) => setMatchForm({ ...matchForm, format: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="T20">T20 (20 Overs)</option>
                <option value="One Day">One Day (50 Overs)</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="secondary" size="md" className="w-full">
            Confirm Fixture Schedule
          </Button>
        </form>
      </Modal>
    </PageShell>
  );
}
