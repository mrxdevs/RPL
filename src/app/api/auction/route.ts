import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Team, Player, AuctionState, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET() {
  const auction = await readJson<AuctionState>("auction", { history: [] });
  const teams = await readJson<Team[]>("teams", []);
  const players = await readJson<Player[]>("players", []);

  return NextResponse.json<
    ApiResponse<{
      auction: AuctionState;
      availablePlayers: Player[];
      soldPlayers: Player[];
      teams: Team[];
    }>
  >({
    success: true,
    data: {
      auction,
      availablePlayers: players.filter((p) => p.auctionStatus === "available"),
      soldPlayers: players.filter((p) => p.auctionStatus === "sold"),
      teams,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin privileges required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, playerId, teamId, soldPrice } = body;

    const teams = await readJson<Team[]>("teams", []);
    const players = await readJson<Player[]>("players", []);
    const auction = await readJson<AuctionState>("auction", { history: [] });

    // Action 1: Sell player
    if (action === "sell") {
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

      // Update team budget and squad
      team.remainingBudget -= price;
      if (!team.playerIds.includes(player.id)) {
        team.playerIds.push(player.id);
      }
      teams[teamIndex] = team;

      // Update player
      player.teamId = team.id;
      player.soldPrice = price;
      player.auctionStatus = "sold";
      players[playerIndex] = player;

      // Update auction history
      const record = {
        playerId: player.id,
        teamId: team.id,
        soldPrice: price,
        soldAt: new Date().toISOString(),
      };
      const existingHistory = Array.isArray(auction.history) ? auction.history : [];
      auction.history = [record, ...existingHistory];
      auction.currentLotPlayerId = undefined;
      auction.currentBidAmount = undefined;
      auction.currentLeadingTeamId = undefined;

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

    // Action 2: Release player before tournament
    if (action === "release") {
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
        // Refund budget
        team.remainingBudget += player.soldPrice || 0;
        team.playerIds = team.playerIds.filter((id) => id !== player.id);
        if (team.captainId === player.id) {
          team.captainId = undefined;
        }
        teams[teamIndex] = team;
        await writeJson("teams", teams);
      }

      // Reset player
      const refundedTeamId = player.teamId;
      const originalPrice = player.soldPrice;
      player.teamId = undefined;
      player.soldPrice = undefined;
      player.auctionStatus = "available";
      players[playerIndex] = player;

      // Clean auction history for this player
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

    // Action 3: Set current lot player
    if (action === "set_lot") {
      auction.currentLotPlayerId = playerId;
      auction.currentBidAmount = body.startingBid || 0;
      auction.currentLeadingTeamId = body.leadingTeamId;
      await writeJson("auction", auction);

      return NextResponse.json<ApiResponse>({
        success: true,
        data: auction,
        message: "Current auction lot updated",
      });
    }

    // Action 4: Mark unsold
    if (action === "mark_unsold") {
      const playerIndex = players.findIndex((p) => p.id === playerId);
      if (playerIndex !== -1) {
        players[playerIndex].auctionStatus = "unsold";
        await writeJson("players", players);
      }
      auction.currentLotPlayerId = undefined;
      await writeJson("auction", auction);

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
