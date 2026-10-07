"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Team, Player, Match, PlayerRole, AuctionState, UserRole } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

import { mergeListsById } from "@/lib/utils/dataMerge";

interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  teamId?: string | null;
  createdAt?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [auction, setAuction] = useState<AuctionState>({ history: [] });
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>([]);
  const [currentAdminUserId, setCurrentAdminUserId] = useState<string>("");
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
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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
  const [userForm, setUserForm] = useState<{
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
    teamId: string;
  }>({
    username: "",
    password: "",
    displayName: "",
    role: "captain",
    teamId: "",
  });

  const loadData = React.useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (!meJson.success || !meJson.data || meJson.data.role !== "admin") {
          router.push("/login");
          return;
        }
        if (meJson.data.userId) {
          setCurrentAdminUserId(meJson.data.userId);
        }
      }

      const [tRes, pRes, mRes, aRes, uRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/players"),
        fetch("/api/matches"),
        fetch("/api/auction"),
        fetch("/api/users"),
      ]);
      const [tJson, pJson, mJson, aJson, uJson] = await Promise.all([
        tRes.json(),
        pRes.json(),
        mRes.json(),
        aRes.json(),
        uRes.json(),
      ]);

      if (tJson.success && tJson.data) setTeams((prev) => mergeListsById(prev, tJson.data));
      if (pJson.success && pJson.data) setPlayers((prev) => mergeListsById(prev, pJson.data));
      if (mJson.success && mJson.data) setMatches((prev) => mergeListsById(prev, mJson.data));
      if (aJson.success && aJson.data?.auction) setAuction(aJson.data.auction);
      if (uJson.success && uJson.data) setUsers((prev) => mergeListsById(prev, uJson.data, deletedUserIds));
    } catch {
      if (isInitial) {
        setStatusMsg({ type: "error", text: "Failed to load admin data" });
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, [router, deletedUserIds]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (isMounted) {
        await loadData(true);
      }
    };

    initialize();

    const interval = setInterval(() => {
      if (isMounted) {
        loadData(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadData]);

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

  const handleStartAuctionLot = async (playerId: string) => {
    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_lot", playerId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to start auction lot" });
        return;
      }
      setStatusMsg({ type: "success", text: "Player is now under the hammer on the live auction exchange!" });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error starting auction lot" });
    }
  };

  const handleCloseAndSellLot = async () => {
    const currentLot = players.find((p) => p.id === auction.currentLotPlayerId);
    const leadingTeam = teams.find((t) => t.id === auction.currentLeadingTeamId);
    if (!currentLot) return;

    if (!confirm(`Hammer Down: Confirm sale of ${currentLot.name} to ${leadingTeam?.name || "winning franchise"} for ${formatCurrency(auction.currentBidAmount || currentLot.basePrice)}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close_and_sell" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to finalize sale" });
        return;
      }
      setStatusMsg({ type: "success", text: json.message || "Player sold successfully!" });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error closing auction lot" });
    }
  };

  const handleMarkLotUnsold = async () => {
    const currentLot = players.find((p) => p.id === auction.currentLotPlayerId);
    if (!currentLot) return;
    if (!confirm(`Mark ${currentLot.name} as unsold?`)) return;

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_unsold", playerId: currentLot.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to pass player" });
        return;
      }
      setStatusMsg({ type: "success", text: "Player passed and marked unsold." });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error marking player unsold" });
    }
  };

  const handleCancelLot = async () => {
    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_lot" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to cancel lot" });
        return;
      }
      setStatusMsg({ type: "success", text: "Active auction lot cancelled." });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error cancelling auction lot" });
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userForm.username.trim(),
          password: userForm.password,
          displayName: userForm.displayName.trim(),
          role: userForm.role,
          teamId: userForm.role === "captain" ? (userForm.teamId || null) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to create user account" });
        return;
      }
      setStatusMsg({ type: "success", text: `User account @${userForm.username} created with ${userForm.role} privileges!` });
      setIsUserModalOpen(false);
      setUserForm({ username: "", password: "", displayName: "", role: "captain", teamId: "" });
      loadData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error creating user account" });
    }
  };

  const handleDeleteUser = async (user: SafeUser) => {
    if (user.id === currentAdminUserId) {
      setStatusMsg({ type: "error", text: "You cannot delete your own active administrator account." });
      return;
    }
    if (!confirm(`Are you sure you want to delete user @${user.username} (${user.role})? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to delete user account" });
        return;
      }
      setStatusMsg({ type: "success", text: json.message || "User account removed." });
      setDeletedUserIds((prev) => [...prev, user.id]);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      loadData(false);
    } catch {
      setStatusMsg({ type: "error", text: "Network error deleting user account" });
    }
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
  const currentLotPlayer = players.find((p) => p.id === auction.currentLotPlayerId);
  const leadingTeam = teams.find((t) => t.id === auction.currentLeadingTeamId);
  const currentBids = Array.isArray(auction.currentBids) ? auction.currentBids : [];

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
          <Button size="sm" variant="secondary" onClick={() => setIsUserModalOpen(true)}>
            + Create User
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

      {/* Active Lot Live Hammer Controller (if a lot is under the hammer) */}
      {currentLotPlayer && (
        <Card variant="surface" className="border-[var(--color-brand-orange)]/60 bg-gradient-to-r from-[var(--color-brand-orange-dim)] via-[var(--color-brand-night-surface)] to-[var(--color-bg-surface)]">
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
                  Active Auction Round • Under The Hammer
                </span>
                <Badge variant="live" withPulse size="sm">
                  Live Bidding
                </Badge>
              </div>
              <Link href="/auction">
                <Button size="sm" variant="ghost">
                  View Live Bidding Board →
                </Button>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-black font-display uppercase tracking-wide text-white">
                  {currentLotPlayer.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-secondary)]">
                  <Badge variant="teal" size="sm">
                    {currentLotPlayer.role}
                  </Badge>
                  <span>Base Price: <strong className="text-white font-score">{formatCurrency(currentLotPlayer.basePrice)}</strong></span>
                  <span>•</span>
                  <span>Total Bids Placed: <strong className="text-[var(--color-accent)] font-score">{currentBids.length}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-6 font-score p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <span className="text-xs text-[var(--color-text-secondary)] block">Current Leading Bid</span>
                  <span className="text-2xl font-black text-[var(--color-accent)]">
                    {formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)}
                  </span>
                </div>
                <div className="pl-6 border-l border-white/10">
                  <span className="text-xs text-[var(--color-text-secondary)] block">Leading Franchise</span>
                  {leadingTeam ? (
                    <span className="text-base font-bold text-white font-display uppercase">
                      {leadingTeam.name}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-secondary)] italic">
                      Awaiting Bids
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hammer Down Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="md"
                variant="teal"
                className="font-bold flex-1"
                disabled={!leadingTeam}
                onClick={handleCloseAndSellLot}
              >
                {leadingTeam
                  ? `Hammer Down: Close Bid & Sell to ${leadingTeam.shortName} (${formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)})`
                  : "Awaiting First Bid (Cannot Sell)"}
              </Button>
              <Button size="md" variant="danger" onClick={handleMarkLotUnsold}>
                Pass / Mark Unsold
              </Button>
              <Button size="md" variant="ghost" onClick={handleCancelLot}>
                Cancel Lot
              </Button>
            </div>
          </CardBody>
        </Card>
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
              availablePlayers.map((p) => {
                const isUnderHammer = p.id === auction.currentLotPlayerId;

                return (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-display text-sm">
                          {p.name}
                        </span>
                        {isUnderHammer && (
                          <Badge variant="live" size="sm">
                            Under Hammer
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <Badge variant="teal" size="sm">
                          {p.role}
                        </Badge>
                        <span className="text-[var(--color-text-secondary)] font-score">
                          Base: {formatCurrency(p.basePrice)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isUnderHammer && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStartAuctionLot(p.id)}
                        >
                          Start Lot
                        </Button>
                      )}
                      <Button size="sm" variant="primary" onClick={() => openAuctionModal(p)}>
                        Direct Sell
                      </Button>
                    </div>
                  </div>
                );
              })
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

      {/* User Accounts and Access Privileges */}
      <Card variant="surface">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-white">
                User Role & Access Settings ({users.length})
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Create and govern authenticated accounts with role-based privileges: Captain, Umpire, Admin, and User
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setIsUserModalOpen(true)}>
              + Create User Account
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {users.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No additional user accounts registered. Click &quot;+ Create User Account&quot; to provision roles.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Display Name</th>
                  <th className="py-3 px-4">Role Privilege</th>
                  <th className="py-3 px-4">Assigned Franchise</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {users.map((u) => {
                  const assignedTeam = teams.find((t) => t.id === u.teamId);
                  const isCurrentAdmin = u.id === currentAdminUserId;

                  let roleBadgeVariant: "yellow" | "teal" | "live" | "neutral" = "neutral";
                  let roleLabel = u.role.toUpperCase();

                  if (u.role === "admin") {
                    roleBadgeVariant = "yellow";
                    roleLabel = "ADMIN / DIRECTOR";
                  } else if (u.role === "captain") {
                    roleBadgeVariant = "teal";
                    roleLabel = "CAPTAIN";
                  } else if (u.role === "umpire") {
                    roleBadgeVariant = "live";
                    roleLabel = "MATCH UMPIRE";
                  } else {
                    roleLabel = "SPECTATOR";
                  }

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        @{u.username}
                        {isCurrentAdmin && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-sans uppercase font-bold">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white">
                        {u.displayName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={roleBadgeVariant} size="sm">
                          {roleLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-text-secondary)]">
                        {assignedTeam ? (
                          <span className="font-semibold text-[var(--color-accent)]">
                            {assignedTeam.name}
                          </span>
                        ) : u.role === "captain" ? (
                          <span className="text-[var(--color-status-live)]">Unassigned</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isCurrentAdmin ? (
                          <span className="text-xs text-[var(--color-text-secondary)] italic">
                            Protected
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(u)}
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* Modal: Create User & Role Privileges */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Create User & Assign Access Privileges">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="p-3 rounded-lg bg-black/20 text-xs text-[var(--color-text-secondary)] space-y-1">
            <p className="font-semibold text-white">Role Privileges:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li><strong className="text-[var(--color-brand-teal-light)]">Captain:</strong> Can place live auction bids and manage squad match lineup</li>
              <li><strong className="text-[var(--color-status-live)]">Umpire:</strong> Access to live ball-by-ball scoring console</li>
              <li><strong className="text-[var(--color-accent)]">Admin:</strong> Full tournament administration, teams, and auction director</li>
              <li><strong className="text-white">User:</strong> Standard spectator access to public RPL tournament boards</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                placeholder="e.g. captain_chargers"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white lowercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                placeholder="Secure password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
              Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vikram Malhotra (Captain)"
              value={userForm.displayName}
              onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                Privilege Role
              </label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
              >
                <option value="captain">Captain (Franchise Bidding)</option>
                <option value="umpire">Umpire (Live Scoring)</option>
                <option value="admin">Admin (Tournament Director)</option>
                <option value="user">User (Spectator)</option>
              </select>
            </div>

            {userForm.role === "captain" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  Franchise Assignment
                </label>
                <select
                  value={userForm.teamId}
                  onChange={(e) => setUserForm({ ...userForm, teamId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white"
                >
                  <option value="">Select Team (Optional)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full">
            Create User Account & Grant Access
          </Button>
        </form>
      </Modal>
    </PageShell>
  );
}
