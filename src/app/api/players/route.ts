import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Player, PlayerRole, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  let players = await readJson<Player[]>("players", []);

  if (teamId) {
    players = players.filter((p) => p.teamId === teamId);
  }
  if (role) {
    players = players.filter((p) => p.role === role);
  }
  if (status) {
    players = players.filter((p) => p.auctionStatus === status);
  }

  return NextResponse.json<ApiResponse<Player[]>>({
    success: true,
    data: players,
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
    const { name, role, basePrice } = body;

    const validRoles: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
    if (!name || !role || basePrice === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Player name, role, and base price are required" },
        { status: 400 }
      );
    }

    if (!validRoles.includes(role as PlayerRole)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid player role. Valid options: Batter, Bowler, All-rounder, Wicketkeeper" },
        { status: 400 }
      );
    }

    const players = await readJson<Player[]>("players", []);
    const id = `ply_${Date.now()}`;

    const newPlayer: Player = {
      id,
      name: name.trim(),
      role: role as PlayerRole,
      basePrice: Number(basePrice),
      auctionStatus: "available",
      stats: {
        matches: 0,
        runs: 0,
        ballsFaced: 0,
        highestScore: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0,
        bestBowling: "0/0",
      },
    };

    const updatedPlayers = [...players, newPlayer];
    await writeJson("players", updatedPlayers);

    await logActivity({
      category: "team_update",
      title: "Player Registered",
      description: `${newPlayer.name} registered as ${newPlayer.role} with base price ₹${Number(basePrice).toLocaleString("en-IN")}.`,
      playerId: id,
    });

    return NextResponse.json<ApiResponse<Player>>({
      success: true,
      data: newPlayer,
      message: "Player registered successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to register player" },
      { status: 500 }
    );
  }
}
