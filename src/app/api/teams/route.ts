import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Team, Player, TeamSummary, ApiResponse } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET() {
  const teams = await readJson<Team[]>("teams", []);
  const players = await readJson<Player[]>("players", []);

  const summaries: TeamSummary[] = teams.map((team) => {
    const squad = players.filter((p) => p.teamId === team.id);
    const captain = players.find((p) => p.id === team.captainId);
    const amountSpent = squad.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    return {
      ...team,
      playerCount: squad.length,
      amountSpent,
      captainName: captain?.name,
    };
  });

  return NextResponse.json<ApiResponse<TeamSummary[]>>({
    success: true,
    data: summaries,
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
    const { name, shortName, totalBudget, primaryColor } = body;

    if (!name || !shortName || !totalBudget) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Team name, short name, and total budget are required" },
        { status: 400 }
      );
    }

    const teams = await readJson<Team[]>("teams", []);
    const id = `team_${Date.now()}`;
    const budget = Number(totalBudget);

    const newTeam: Team = {
      id,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      totalBudget: budget,
      remainingBudget: budget,
      playerIds: [],
      primaryColor: primaryColor || "#00B07D",
    };

    const updatedTeams = [...teams, newTeam];
    await writeJson("teams", updatedTeams);

    await logActivity({
      category: "team_update",
      title: "New Team Registered",
      description: `${newTeam.name} (${newTeam.shortName}) created with a budget of ₹${budget.toLocaleString("en-IN")}.`,
      teamId: id,
    });

    return NextResponse.json<ApiResponse<Team>>({
      success: true,
      data: newTeam,
      message: "Team created successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}
