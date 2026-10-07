import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Team, Player, AuctionState, AuctionBid, AuctionRecord, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET() {
  const session = await getCurrentSession();
  const auction = await readJson<AuctionState>("auction", { history: [] });
  const teams = await readJson<Team[]>("teams", []);
  const players = await readJson<Player[]>("players", []);

  return NextResponse.json<
    ApiResponse<{
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
    }>
  >({
    success: true,
    data: {
      auction,
      availablePlayers: players.filter((p) => p.auctionStatus === "available"),
      soldPlayers: players.filter((p) => p.auctionStatus === "sold"),
      teams,
      currentUser: session
        ? {
            userId: session.userId,
            username: session.username,
            role: session.role,
            teamId: session.teamId,
            displayName: session.displayName,
          }
        : null,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Authentication required to participate in auction" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Captains and Admins can bid; all other administrative actions require Admin role
    if (action === "bid") {
      if (session.role !== "captain" && session.role !== "admin") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Only team captains or tournament administrators may place bids" },
          { status: 403 }
        );
      }
    } else {
      if (session.role !== "admin") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Unauthorized: Admin privileges required" },
          { status: 403 }
        );
      }
    }

    const teams = await readJson<Team[]>("teams", []);
    const players = await readJson<Player[]>("players", []);
    const auction = await readJson<AuctionState>("auction", { history: [] });

    // Action 1: Set Active Auction Lot (Admin puts player under the hammer)
    if (action === "set_lot") {
      const { playerId, startingBid } = body;
      if (!playerId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player ID is required" },
          { status: 400 }
        );
      }

      const player = players.find((p) => p.id === playerId);
      if (!player) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      if (player.auctionStatus === "sold") {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player has already been sold" },
          { status: 400 }
        );
      }

      const initialBid = Number(startingBid) > 0 ? Number(startingBid) : player.basePrice;
      auction.currentLotPlayerId = player.id;
      auction.currentBidAmount = initialBid;
      auction.currentLeadingTeamId = undefined;
      auction.currentBids = [];

      await writeJson("auction", auction);

      await logActivity({
        category: "auction",
        title: "Player on Auction Block",
        description: `${player.name} (${player.role}) is now under the hammer with base price ₹${initialBid.toLocaleString("en-IN")}.`,
        playerId: player.id,
      });

      return NextResponse.json<ApiResponse<AuctionState>>({
        success: true,
        data: auction,
        message: `${player.name} is now the active auction lot`,
      });
    }

    // Action 2: Captain / Admin places a live bid
    if (action === "bid") {
      const { playerId, bidAmount } = body;
      const effectiveTeamId = session.role === "captain" ? session.teamId : (body.teamId || session.teamId);

      if (!effectiveTeamId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "No franchise team associated with this account to place bids" },
          { status: 400 }
        );
      }

      if (!auction.currentLotPlayerId || auction.currentLotPlayerId !== playerId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "This player is not currently the active auction lot" },
          { status: 400 }
        );
      }

      const team = teams.find((t) => t.id === effectiveTeamId);
      if (!team) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Franchise team not found" },
          { status: 404 }
        );
      }

      const player = players.find((p) => p.id === playerId);
      if (!player) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      const amount = Number(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "A valid positive bid amount is required" },
          { status: 400 }
        );
      }

      if (amount < player.basePrice) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Bid amount must be at least the base price of ₹${player.basePrice.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }

      const currentHighest = auction.currentBidAmount || 0;
      if (auction.currentLeadingTeamId && amount <= currentHighest) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Bid must exceed the current leading bid of ₹${currentHighest.toLocaleString("en-IN")}` },
          { status: 400 }
        );
      }

      if (amount > team.remainingBudget) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Insufficient purse. ${team.name} has ₹${team.remainingBudget.toLocaleString("en-IN")} remaining, but bid is ₹${amount.toLocaleString("en-IN")}`,
          },
          { status: 400 }
        );
      }

      const bidRecord: AuctionBid = {
        id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        teamId: team.id,
        teamName: team.name,
        teamShortName: team.shortName,
        bidAmount: amount,
        timestamp: new Date().toISOString(),
      };

      const existingBids = Array.isArray(auction.currentBids) ? auction.currentBids : [];
      auction.currentBids = [bidRecord, ...existingBids];
      auction.currentBidAmount = amount;
      auction.currentLeadingTeamId = team.id;

      await writeJson("auction", auction);

      await logActivity({
        category: "auction",
        title: "New Bid Placed",
        description: `${team.name} bid ₹${amount.toLocaleString("en-IN")} for ${player.name}.`,
        teamId: team.id,
        playerId: player.id,
      });

      return NextResponse.json<ApiResponse<AuctionState>>({
        success: true,
        data: auction,
        message: `Bid of ₹${amount.toLocaleString("en-IN")} by ${team.name} recorded successfully`,
      });
    }

    // Action 3: Close Bid and Sell (Admin hammers down to leading team)
    if (action === "close_and_sell") {
      if (!auction.currentLotPlayerId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "No active player lot currently under the hammer" },
          { status: 400 }
        );
      }

      const playerId = auction.currentLotPlayerId;
      const playerIndex = players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      const targetTeamId = auction.currentLeadingTeamId || body.teamId;
      if (!targetTeamId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "No winning bid placed for this player. Use 'Pass / Unsold' if no team placed a bid." },
          { status: 400 }
        );
      }

      const teamIndex = teams.findIndex((t) => t.id === targetTeamId);
      if (teamIndex === -1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Winning franchise team not found" },
          { status: 404 }
        );
      }

      const team = teams[teamIndex];
      const player = players[playerIndex];
      const finalPrice = auction.currentBidAmount || player.basePrice;

      if (finalPrice > team.remainingBudget) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Insufficient purse. ${team.name} has ₹${team.remainingBudget.toLocaleString("en-IN")}, but final price is ₹${finalPrice.toLocaleString("en-IN")}`,
          },
          { status: 400 }
        );
      }

      team.remainingBudget -= finalPrice;
      if (!team.playerIds.includes(player.id)) {
        team.playerIds.push(player.id);
      }
      teams[teamIndex] = team;

      player.teamId = team.id;
      player.soldPrice = finalPrice;
      player.auctionStatus = "sold";
      players[playerIndex] = player;

      const historyRecord: AuctionRecord = {
        playerId: player.id,
        teamId: team.id,
        soldPrice: finalPrice,
        soldAt: new Date().toISOString(),
      };
      const existingHistory = Array.isArray(auction.history) ? auction.history : [];
      auction.history = [historyRecord, ...existingHistory];

      auction.currentLotPlayerId = undefined;
      auction.currentBidAmount = undefined;
      auction.currentLeadingTeamId = undefined;
      auction.currentBids = [];

      await writeJson("teams", teams);
      await writeJson("players", players);
      await writeJson("auction", auction);

      await logActivity({
        category: "auction",
        title: "Hammer Down: Player Sold",
        description: `${player.name} sold to ${team.name} for ₹${finalPrice.toLocaleString("en-IN")}.`,
        teamId: team.id,
        playerId: player.id,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${player.name} successfully sold to ${team.name} for ₹${finalPrice.toLocaleString("en-IN")}`,
      });
    }

    // Action 4: Cancel Lot (Admin returns player to available pool without selling)
    if (action === "cancel_lot") {
      auction.currentLotPlayerId = undefined;
      auction.currentBidAmount = undefined;
      auction.currentLeadingTeamId = undefined;
      auction.currentBids = [];
      await writeJson("auction", auction);

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Active auction lot cancelled",
      });
    }

    // Action 5: Direct Sell player (Manual Admin assignment)
    if (action === "sell") {
      const { playerId, teamId, soldPrice } = body;
      if (!playerId || !teamId || soldPrice === undefined) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player ID, Team ID, and sold price are required" },
          { status: 400 }
        );
      }

      const teamIndex = teams.findIndex((t) => t.id === teamId);
      if (teamIndex === -1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Team not found" },
          { status: 404 }
        );
      }

      const playerIndex = players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      const team = teams[teamIndex];
      const player = players[playerIndex];
      const price = Number(soldPrice);

      if (price > team.remainingBudget) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `Insufficient budget. Team has ₹${team.remainingBudget.toLocaleString("en-IN")}, but bid is ₹${price.toLocaleString("en-IN")}`,
          },
          { status: 400 }
        );
      }

      team.remainingBudget -= price;
      if (!team.playerIds.includes(player.id)) {
        team.playerIds.push(player.id);
      }
      teams[teamIndex] = team;

      player.teamId = team.id;
      player.soldPrice = price;
      player.auctionStatus = "sold";
      players[playerIndex] = player;

      const record: AuctionRecord = {
        playerId: player.id,
        teamId: team.id,
        soldPrice: price,
        soldAt: new Date().toISOString(),
      };
      const existingHistory = Array.isArray(auction.history) ? auction.history : [];
      auction.history = [record, ...existingHistory];

      if (auction.currentLotPlayerId === player.id) {
        auction.currentLotPlayerId = undefined;
        auction.currentBidAmount = undefined;
        auction.currentLeadingTeamId = undefined;
        auction.currentBids = [];
      }

      await writeJson("teams", teams);
      await writeJson("players", players);
      await writeJson("auction", auction);

      await logActivity({
        category: "auction",
        title: "Player Sold",
        description: `${player.name} acquired by ${team.name} for ₹${price.toLocaleString("en-IN")}.`,
        teamId: team.id,
        playerId: player.id,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${player.name} successfully sold to ${team.name} for ₹${price.toLocaleString("en-IN")}`,
      });
    }

    // Action 6: Release player before tournament
    if (action === "release") {
      const { playerId } = body;
      if (!playerId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player ID is required" },
          { status: 400 }
        );
      }

      const playerIndex = players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player not found" },
          { status: 404 }
        );
      }

      const player = players[playerIndex];
      if (player.auctionStatus !== "sold" || !player.teamId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player is not currently assigned to a team" },
          { status: 400 }
        );
      }

      const teamIndex = teams.findIndex((t) => t.id === player.teamId);
      if (teamIndex !== -1) {
        const team = teams[teamIndex];
        team.remainingBudget += player.soldPrice || 0;
        team.playerIds = team.playerIds.filter((id) => id !== player.id);
        if (team.captainId === player.id) {
          team.captainId = undefined;
        }
        teams[teamIndex] = team;
        await writeJson("teams", teams);
      }

      const refundedTeamId = player.teamId;
      const originalPrice = player.soldPrice;
      player.teamId = undefined;
      player.soldPrice = undefined;
      player.auctionStatus = "available";
      players[playerIndex] = player;

      const currentHistory = Array.isArray(auction.history) ? auction.history : [];
      auction.history = currentHistory.filter((h) => h.playerId !== player.id);

      await writeJson("players", players);
      await writeJson("auction", auction);

      await logActivity({
        category: "auction",
        title: "Player Released",
        description: `${player.name} released back to auction. ₹${(originalPrice || 0).toLocaleString("en-IN")} restored to team budget.`,
        teamId: refundedTeamId,
        playerId: player.id,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: `${player.name} released back to auction pool`,
      });
    }

    // Action 7: Mark unsold
    if (action === "mark_unsold") {
      const targetPlayerId = body.playerId || auction.currentLotPlayerId;
      if (!targetPlayerId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Player ID is required" },
          { status: 400 }
        );
      }

      const playerIndex = players.findIndex((p) => p.id === targetPlayerId);
      if (playerIndex !== -1) {
        players[playerIndex].auctionStatus = "unsold";
        await writeJson("players", players);
      }

      if (auction.currentLotPlayerId === targetPlayerId) {
        auction.currentLotPlayerId = undefined;
        auction.currentBidAmount = undefined;
        auction.currentLeadingTeamId = undefined;
        auction.currentBids = [];
        await writeJson("auction", auction);
      }

      await logActivity({
        category: "auction",
        title: "Player Unsold",
        description: `${players[playerIndex]?.name || "Player"} marked unsold.`,
        playerId: targetPlayerId,
      });

      return NextResponse.json<ApiResponse>({
        success: true,
        message: "Player marked as unsold",
      });
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Invalid auction action" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auction transaction failed";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
