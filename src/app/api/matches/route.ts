import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Match, Team, ApiResponse, TournamentFormat } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let matches = await readJson<Match[]>("matches", []);
  if (status) {
    matches = matches.filter((m) => m.status === status);
  }

  return NextResponse.json<ApiResponse<Match[]>>({
    success: true,
    data: matches,
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
    const { title, teamAId, teamBId, scheduledAt, venue, format, umpireId } = body;

    if (!title || !teamAId || !teamBId || !scheduledAt || !venue) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Title, teams, date, venue, and umpire are required" },
        { status: 400 }
      );
    }

    if (teamAId === teamBId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "A team cannot play against itself" },
        { status: 400 }
      );
    }

    const teams = await readJson<Team[]>("teams", []);
    const teamA = teams.find((t) => t.id === teamAId);
    const teamB = teams.find((t) => t.id === teamBId);

    if (!teamA || !teamB) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "One or both teams not found" },
        { status: 404 }
      );
    }

    const matches = await readJson<Match[]>("matches", []);
    const newMatch: Match = {
      id: `mat_${Date.now()}`,
      matchNumber: matches.length + 1,
      title: title.trim(),
      format: (format as TournamentFormat) || "T20",
      scheduledAt,
      venue: venue.trim(),
      status: "scheduled",
      teamAId,
      teamBId,
      umpireId: umpireId || "usr_umpire",
      currentInningsNumber: 1,
      innings: [],
    };

    const updatedMatches = [...matches, newMatch];
    await writeJson("matches", updatedMatches);

    await logActivity({
      category: "match_status",
      title: "Fixture Scheduled",
      description: `${newMatch.title}: ${teamA.name} vs ${teamB.name} scheduled at ${newMatch.venue}.`,
      matchId: newMatch.id,
    });

    return NextResponse.json<ApiResponse<Match>>({
      success: true,
      data: newMatch,
      message: "Match scheduled successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to schedule match" },
      { status: 500 }
    );
  }
}
