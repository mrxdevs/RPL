import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Player, PlayerRole, ApiResponse } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const players = await readJson<Player[]>("players", []);
  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Player not found" },
      { status: 404 }
    );
  }

  return NextResponse.json<ApiResponse<Player>>({
    success: true,
    data: player,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const players = await readJson<Player[]>("players", []);
    const playerIndex = players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    const currentPlayer = players[playerIndex];

    // Check authorization: Captain can only update their own team's player (role, battingOrder)
    if (session.role === "captain") {
      if (currentPlayer.teamId !== session.teamId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Captains can only modify players in their own squad" },
          { status: 403 }
        );
      }
    } else if (session.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role, battingOrder, basePrice } = body;

    const validRoles: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
    if (role && !validRoles.includes(role as PlayerRole)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid player role" },
        { status: 400 }
      );
    }

    const updatedPlayer: Player = {
      ...currentPlayer,
      role: role ? (role as PlayerRole) : currentPlayer.role,
      battingOrder: battingOrder !== undefined ? Number(battingOrder) : currentPlayer.battingOrder,
      basePrice: session.role === "admin" && basePrice !== undefined ? Number(basePrice) : currentPlayer.basePrice,
    };

    players[playerIndex] = updatedPlayer;
    await writeJson("players", players);

    return NextResponse.json<ApiResponse<Player>>({
      success: true,
      data: updatedPlayer,
      message: "Player updated successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update player" },
      { status: 500 }
    );
  }
}
