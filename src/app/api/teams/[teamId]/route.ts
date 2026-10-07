import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Team, Player, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const teams = await readJson<Team[]>("teams", []);
  const team = teams.find((t) => t.id === teamId);

  if (!team) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Team not found" },
      { status: 404 }
    );
  }

  const players = await readJson<Player[]>("players", []);
  const squad = players.filter((p) => p.teamId === team.id);

  return NextResponse.json<ApiResponse<{ team: Team; squad: Player[] }>>({
    success: true,
    data: { team, squad },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const session = await getCurrentSession();

  if (!session || (session.role !== "admin" && (session.role !== "captain" || session.teamId !== teamId))) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized to update this team" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const teams = await readJson<Team[]>("teams", []);
    const teamIndex = teams.findIndex((t) => t.id === teamId);

    if (teamIndex === -1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    const currentTeam = teams[teamIndex];
    const { captainId, name, shortName, primaryColor } = body;

    const updatedTeam: Team = {
      ...currentTeam,
      name: name ?? currentTeam.name,
      shortName: shortName ?? currentTeam.shortName,
      captainId: captainId ?? currentTeam.captainId,
      primaryColor: primaryColor ?? currentTeam.primaryColor,
    };

    teams[teamIndex] = updatedTeam;
    await writeJson("teams", teams);

    if (captainId && captainId !== currentTeam.captainId) {
      const players = await readJson<Player[]>("players", []);
      const capPlayer = players.find((p) => p.id === captainId);
      await logActivity({
        category: "team_update",
        title: "Captain Appointed",
        description: `${capPlayer?.name || "Player"} appointed as captain of ${updatedTeam.name}.`,
        teamId,
        playerId: captainId,
      });
    }

    return NextResponse.json<ApiResponse<Team>>({
      success: true,
      data: updatedTeam,
      message: "Team updated successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update team" },
      { status: 500 }
    );
  }
}
