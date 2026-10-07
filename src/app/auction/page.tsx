"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuctionState, Player, Team } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/cricket/cricketCalculations";

interface AuctionPageData {
  auction: AuctionState;
  availablePlayers: Player[];
  soldPlayers: Player[];
  teams: Team[];
  currentUser?: {
    userId: string;
    username: string;
    role: string;
    teamId?: string;
    displayName: string;
  } | null;
}

export default function AuctionPage() {
  const [data, setData] = useState<AuctionPageData | null>(null);
  const [activeTab, setActiveTab] = useState<"teams" | "sold" | "available">("teams");
  const [isLoading, setIsLoading] = useState(true);

  // Captain / Admin bidding state
  const [bidAmountInput, setBidAmountInput] = useState<number>(0);
  const [adminSelectedTeamId, setAdminSelectedTeamId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/auction");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch {
      // Silently catch network blips
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      try {
        const res = await fetch("/api/auction");
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setData(json.data);
        }
      } catch {
        // Silently catch initial load errors
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitial();
    const interval = setInterval(() => {
      if (isMounted) {
        fetch("/api/auction")
          .then((res) => res.json())
          .then((json) => {
            if (isMounted && json.success && json.data) {
              setData(json.data);
            }
          })
          .catch(() => {});
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading || !data) {
    return (
      <PageShell title="Player Auction" subtitle="Loading live auction feed...">
        <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
          Connecting to live auction exchange...
        </div>
      </PageShell>
    );
  }

  const { auction, availablePlayers, soldPlayers, teams, currentUser } = data;
  const currentLotPlayer = availablePlayers.find((p) => p.id === auction.currentLotPlayerId);
  const leadingTeam = teams.find((t) => t.id === auction.currentLeadingTeamId);
  const currentBids = Array.isArray(auction.currentBids) ? auction.currentBids : [];

  // Captain's team resolution
  const captainTeam = currentUser?.role === "captain" && currentUser.teamId
    ? teams.find((t) => t.id === currentUser.teamId)
    : null;

  const handlePlaceBid = async (amount: number, teamIdOverride?: string) => {
    if (!currentLotPlayer) return;
    setIsSubmitting(true);
    setStatusMsg(null);

    const targetTeamId = teamIdOverride || (currentUser?.role === "captain" ? currentUser.teamId : adminSelectedTeamId);

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bid",
          playerId: currentLotPlayer.id,
          teamId: targetTeamId,
          bidAmount: amount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to place bid" });
        return;
      }

      setStatusMsg({ type: "success", text: json.message || "Bid placed successfully!" });
      refreshData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error submitting bid" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndSell = async () => {
    if (!currentLotPlayer) return;
    if (!confirm(`Confirm hammer down? Sell ${currentLotPlayer.name} to ${leadingTeam?.name || "winning team"} for ${formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)}?`)) {
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

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
      refreshData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error closing bid" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentLotPlayer) return;
    if (!confirm(`Mark ${currentLotPlayer.name} as unsold for this round?`)) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_unsold", playerId: currentLotPlayer.id }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to pass player" });
        return;
      }

      setStatusMsg({ type: "success", text: "Player passed and marked unsold" });
      refreshData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error marking unsold" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartLot = async (playerId: string) => {
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_lot", playerId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMsg({ type: "error", text: json.error || "Failed to start lot" });
        return;
      }

      setStatusMsg({ type: "success", text: "Player is now under the hammer!" });
      refreshData();
    } catch {
      setStatusMsg({ type: "error", text: "Network error setting active lot" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Player Auction & Salary Caps"
      subtitle="Live bidding exchange, team purse balances, and real-time player allocations"
      action={
        <div className="flex items-center gap-2">
          {currentUser ? (
            <Badge variant="teal" size="sm">
              Role: {currentUser.role.toUpperCase()} {captainTeam ? `(${captainTeam.shortName})` : ""}
            </Badge>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="ghost">
                Captain Login →
              </Button>
            </Link>
          )}
          <Badge variant="yellow" size="sm">
            Live Exchange
          </Badge>
        </div>
      }
    >
      {/* Alert Status Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-[var(--color-brand-teal)]/15 border border-[var(--color-brand-teal)] text-[var(--color-brand-teal-light)]"
              : "bg-red-500/15 border border-red-500 text-red-300"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Live Active Lot Section */}
      {currentLotPlayer ? (
        <section className="p-6 rounded-2xl bg-gradient-to-r from-[var(--color-brand-orange-dim)] via-[var(--color-brand-night-surface)] to-[var(--color-bg-surface)] border border-[var(--color-brand-orange)]/50 shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
                Under The Hammer • Active Auction Lot
              </span>
              <Badge variant="live" withPulse size="sm">
                Bidding Open
              </Badge>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] font-score">
              Live updates every 2.5s
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-3xl font-black font-display uppercase tracking-wide text-white">
                {currentLotPlayer.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <Badge variant="teal" size="sm">
                  {currentLotPlayer.role}
                </Badge>
                <span>
                  Base Price: <strong className="text-white font-score">{formatCurrency(currentLotPlayer.basePrice)}</strong>
                </span>
                <span>•</span>
                <span>Matches: <strong className="text-white font-score">{currentLotPlayer.stats.matches}</strong></span>
                {currentLotPlayer.stats.runs > 0 && (
                  <span>Runs: <strong className="text-white font-score">{currentLotPlayer.stats.runs}</strong></span>
                )}
                {currentLotPlayer.stats.wickets > 0 && (
                  <span>Wickets: <strong className="text-white font-score">{currentLotPlayer.stats.wickets}</strong></span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 font-score p-4 rounded-xl bg-black/40 border border-white/5">
              <div>
                <span className="text-xs text-[var(--color-text-secondary)] block">Current Leading Bid</span>
                <span className="text-3xl font-black text-[var(--color-accent)]">
                  {formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)}
                </span>
              </div>
              <div className="pl-6 border-l border-white/10">
                <span className="text-xs text-[var(--color-text-secondary)] block">Leading Franchise</span>
                {leadingTeam ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: leadingTeam.primaryColor || "#00B07D" }}
                    />
                    <span className="text-lg font-bold text-white font-display uppercase">
                      {leadingTeam.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)] italic">
                    Opening lot (No bids yet)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Bidding Row & Real-time Live History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Bid Stream / Table */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white font-display">
                  Live Bidding Stream ({currentBids.length} Bids Placed)
                </h4>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Chronological bid history
                </span>
              </div>

              <div className="rounded-xl bg-black/30 border border-white/5 divide-y divide-white/5 max-h-72 overflow-y-auto">
                {currentBids.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[var(--color-text-secondary)]">
                    No bids recorded for this lot yet. Opening bid starts at base price of {formatCurrency(currentLotPlayer.basePrice)}.
                  </div>
                ) : (
                  currentBids.map((bid, index) => {
                    const isTopBid = index === 0;
                    const bidTime = new Date(bid.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <div
                        key={bid.id}
                        className={`p-3.5 flex items-center justify-between gap-3 text-sm transition-colors ${
                          isTopBid ? "bg-[var(--color-accent)]/10 font-medium" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--color-text-secondary)] font-score w-16">
                            {bidTime}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-display">
                              {bid.teamName}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-[var(--color-text-secondary)] font-mono">
                              {bid.teamShortName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-score font-bold text-[var(--color-accent)] text-base">
                            {formatCurrency(bid.bidAmount)}
                          </span>
                          {isTopBid ? (
                            <Badge variant="live" size="sm">
                              Leader
                            </Badge>
                          ) : (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              Outbid
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Captain Bidding Interface & Admin Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Captain Bidding Interface */}
              {currentUser?.role === "captain" && (
                <div className="p-4 rounded-xl bg-black/40 border border-[var(--color-brand-teal)]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-teal-light)] font-display">
                      Captain Bidding Console
                    </span>
                    {captainTeam && (
                      <span className="text-xs text-[var(--color-text-secondary)] font-score">
                        Purse: {formatCurrency(captainTeam.remainingBudget)}
                      </span>
                    )}
                  </div>

                  {captainTeam ? (
                    <>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        Bidding for: <strong className="text-white">{captainTeam.name}</strong>
                      </div>

                      {/* Quick Bid Increment Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {[25000, 50000, 100000, 200000].map((inc) => {
                          const currentBase = auction.currentBidAmount || currentLotPlayer.basePrice;
                          const calculatedBid = auction.currentLeadingTeamId ? currentBase + inc : currentBase;
                          const canAfford = calculatedBid <= captainTeam.remainingBudget;

                          return (
                            <button
                              key={inc}
                              type="button"
                              disabled={!canAfford || isSubmitting}
                              onClick={() => setBidAmountInput(calculatedBid)}
                              className={`py-2 px-1 text-center rounded-lg text-xs font-bold font-score border transition-colors cursor-pointer ${
                                bidAmountInput === calculatedBid
                                  ? "bg-[var(--color-accent)] text-black border-[var(--color-accent)]"
                                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                              } ${!canAfford ? "opacity-30 cursor-not-allowed" : ""}`}
                            >
                              +{inc >= 100000 ? `${inc / 100000}L` : `${inc / 1000}k`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Exact Bid Amount Input & Action */}
                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-semibold text-[var(--color-text-secondary)] block">
                          Enter Specific Bid Amount (₹)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step={25000}
                            min={auction.currentBidAmount ? auction.currentBidAmount + 25000 : currentLotPlayer.basePrice}
                            max={captainTeam.remainingBudget}
                            value={bidAmountInput}
                            onChange={(e) => setBidAmountInput(Number(e.target.value))}
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-white text-sm font-score"
                          />
                          <Button
                            size="md"
                            variant="primary"
                            disabled={
                              isSubmitting ||
                              bidAmountInput <= (auction.currentBidAmount || 0) ||
                              bidAmountInput > captainTeam.remainingBudget
                            }
                            onClick={() => handlePlaceBid(bidAmountInput)}
                          >
                            {isSubmitting ? "Bidding..." : `Bid ${formatCurrency(bidAmountInput)}`}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-red-400">
                      No team assigned to your captain account. Contact tournament admin.
                    </div>
                  )}
                </div>
              )}

              {/* Administrator Hammer Down Controls */}
              {currentUser?.role === "admin" && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] font-display">
                      Tournament Director Controls
                    </span>
                    <Badge variant="yellow" size="sm">
                      Admin Privileges
                    </Badge>
                  </div>

                  {/* Hammer Down: Close Bid and Sell */}
                  <Button
                    size="md"
                    variant="teal"
                    className="w-full font-bold"
                    disabled={isSubmitting || !leadingTeam}
                    onClick={handleCloseAndSell}
                  >
                    {isSubmitting
                      ? "Processing Sale..."
                      : leadingTeam
                      ? `Hammer Down: Sell to ${leadingTeam.shortName} (${formatCurrency(auction.currentBidAmount || currentLotPlayer.basePrice)})`
                      : "Awaiting Bids (Cannot Sell)"}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isSubmitting}
                      onClick={handleMarkUnsold}
                    >
                      Pass / Mark Unsold
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSubmitting}
                      onClick={handleMarkUnsold}
                    >
                      Reset Lot
                    </Button>
                  </div>

                  {/* Admin Direct Bid on behalf of franchise for testing */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-xs text-[var(--color-text-secondary)] block">
                      Admin Proxy Bid on behalf of team:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={adminSelectedTeamId}
                        onChange={(e) => setAdminSelectedTeamId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs text-white"
                      >
                        <option value="">Select Team</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Purse: {formatCurrency(t.remainingBudget)})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!adminSelectedTeamId || isSubmitting}
                        onClick={() => handlePlaceBid(bidAmountInput, adminSelectedTeamId)}
                      >
                        Place Bid
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest / Fan Spectator View */}
              {!currentUser && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-center">
                  <span className="text-xs text-[var(--color-text-secondary)] block">
                    Spectator Mode • Bidding is restricted to authenticated franchise captains and tournament administrators.
                  </span>
                  <Link href="/login" className="inline-block mt-1">
                    <Button size="sm" variant="secondary">
                      Log In as Captain to Place Bids →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        /* No active lot notice */
        <section className="p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-center space-y-4">
          <Badge variant="upcoming" size="md">
            Auction Block Idle
          </Badge>
          <h3 className="text-xl font-bold font-display uppercase tracking-wide text-white">
            No Player Currently Under the Hammer
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
            The auctioneer has not opened a bidding round. When a player is put on the auction block, this area will activate with real-time bidding for franchise captains.
          </p>

          {currentUser?.role === "admin" && availablePlayers.length > 0 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                Put next player up for bidding:
              </span>
              <div className="flex items-center gap-2">
                <select
                  id="admin-lot-select"
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-xs text-white"
                  defaultValue={availablePlayers[0]?.id}
                >
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role} • Base {formatCurrency(p.basePrice)})
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const sel = document.getElementById("admin-lot-select") as HTMLSelectElement | null;
                    if (sel?.value) handleStartLot(sel.value);
                  }}
                >
                  Start Bidding Round
                </Button>
              </div>
            </div>
          )}
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
        teams.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-secondary)] rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            No franchises configured for this auction yet. Teams will be listed once registered in the admin console.
          </div>
        ) : (
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
        )
      )}

      {/* Tab 2: Sold Players */}
      {activeTab === "sold" && (
        soldPlayers.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-text-secondary)] rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
            No players sold yet. Acquisitions will be recorded here as bidding rounds conclude.
          </div>
        ) : (
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
        )
      )}

      {/* Tab 3: Available Pool */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availablePlayers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-sm text-[var(--color-text-secondary)]">
              No players currently available in the auction pool.
            </div>
          ) : (
            availablePlayers.map((p) => {
              const isCurrentLot = p.id === auction.currentLotPlayerId;

              return (
                <Card key={p.id} variant="surface" className={isCurrentLot ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]" : ""}>
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="teal" size="sm">
                        {p.role}
                      </Badge>
                      {isCurrentLot ? (
                        <Badge variant="live" size="sm">
                          Under Hammer
                        </Badge>
                      ) : (
                        <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                          {p.stats.matches} Matches
                        </span>
                      )}
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

                    {currentUser?.role === "admin" && !isCurrentLot && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => handleStartLot(p.id)}
                      >
                        Start Bidding Lot →
                      </Button>
                    )}
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}
    </PageShell>
  );
}
