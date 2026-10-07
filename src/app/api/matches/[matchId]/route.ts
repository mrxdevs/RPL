import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import { Match, Team, Player, ApiResponse, MatchStatus } from "@/lib/types";
import { logActivity } from "@/lib/utils/activityLogger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const matches = await readJson<Match[]>("matches", []);
  const match = matches.find((m) => m.id === matchId);

  if (!match) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Match not found" },
      { status: 404 }
    );
  }

  const teams = await readJson<Team[]>("teams", []);
  const players = await readJson<Player[]>("players", []);

  const teamA = teams.find((t) => t.id === match.teamAId);
  const teamB = teams.find((t) => t.id === match.teamBId);
  const teamAPlayers = players.filter((p) => p.teamId === match.teamAId);
  const teamBPlayers = players.filter((p) => p.teamId === match.teamBId);

  return NextResponse.json<
    ApiResponse<{
      match: Match;
      teamA?: Team;
      teamB?: Team;
      teamAPlayers: Player[];
      teamBPlayers: Player[];
    }>
  >({
    success: true,
    data: {
      match,
      teamA,
      teamB,
      teamAPlayers,
      teamBPlayers,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const session = await getCurrentSession();

  if (!session || (session.role !== "admin" && session.role !== "umpire")) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized: Admin or Umpire role required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const matches = await readJson<Match[]>("matches", []);
    const matchIndex = matches.findIndex((m) => m.id === matchId);

    if (matchIndex === -1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    const currentMatch = matches[matchIndex];
    const {
      status,
      tossWinnerTeamId,
      tossDecision,
      resultSummary,
      winnerTeamId,
      manOfTheMatchId,
      strikerId,
      nonStrikerId,
      bowlerId,
    } = body;

    const players = await readJson<Player[]>("players", []);

    let updatedInnings = [...currentMatch.innings];

    // If starting the match (transitioning to live)
    if (status === "live" && currentMatch.status === "scheduled") {
      const batTeamId =
        tossDecision === "bat"
          ? tossWinnerTeamId
          : tossWinnerTeamId === currentMatch.teamAId
          ? currentMatch.teamBId
          : currentMatch.teamAId;

      const bowlTeamId =
        batTeamId === currentMatch.teamAId ? currentMatch.teamBId : currentMatch.teamAId;

      const battingSquad = players.filter((p) => p.teamId === batTeamId);
      const bowlingSquad = players.filter((p) => p.teamId === bowlTeamId);

      const firstStriker = battingSquad[0];
      const secondStriker = battingSquad[1];
      const openingBowler = bowlingSquad.find((p) => p.role === "Bowler") || bowlingSquad[0];

      updatedInnings = [
        {
          inningsNumber: 1,
          battingTeamId: batTeamId,
          bowlingTeamId: bowlTeamId,
          totalRuns: 0,
          wickets: 0,
          legalBalls: 0,
          totalOversAllowed: currentMatch.format === "T20" ? 20 : 50,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
          currentStrikerId: strikerId || firstStriker?.id,
          currentNonStrikerId: nonStrikerId || secondStriker?.id,
          currentBowlerId: bowlerId || openingBowler?.id,
          batsmen: [
            ...(firstStriker
              ? [
                  {
                    playerId: firstStriker.id,
                    playerName: firstStriker.name,
                    runs: 0,
                    ballsFaced: 0,
                    fours: 0,
                    sixes: 0,
                    strikeRate: 0,
                    isOut: false,
                  },
                ]
              : []),
            ...(secondStriker
              ? [
                  {
                    playerId: secondStriker.id,
                    playerName: secondStriker.name,
                    runs: 0,
                    ballsFaced: 0,
                    fours: 0,
                    sixes: 0,
                    strikeRate: 0,
                    isOut: false,
                  },
                ]
              : []),
          ],
          bowlers: openingBowler
            ? [
                {
                  playerId: openingBowler.id,
                  playerName: openingBowler.name,
                  overs: 0,
                  ballsBowled: 0,
                  maidens: 0,
                  runsConceded: 0,
                  wickets: 0,
                  economy: 0,
                },
              ]
            : [],
          fallOfWickets: [],
          balls: [],
          isCompleted: false,
        },
      ];
    }

    // If updating current active batsmen / bowler
    if (updatedInnings.length > 0) {
      const activeInnings = updatedInnings[currentMatch.currentInningsNumber - 1];
      if (activeInnings) {
        if (strikerId) activeInnings.currentStrikerId = strikerId;
        if (nonStrikerId) activeInnings.currentNonStrikerId = nonStrikerId;
        if (bowlerId) activeInnings.currentBowlerId = bowlerId;

        // Ensure current batsmen exist in batsman records
        if (strikerId && !activeInnings.batsmen.some((b) => b.playerId === strikerId)) {
          const p = players.find((x) => x.id === strikerId);
          if (p) {
            activeInnings.batsmen.push({
              playerId: p.id,
              playerName: p.name,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              isOut: false,
            });
          }
        }
        if (nonStrikerId && !activeInnings.batsmen.some((b) => b.playerId === nonStrikerId)) {
          const p = players.find((x) => x.id === nonStrikerId);
          if (p) {
            activeInnings.batsmen.push({
              playerId: p.id,
              playerName: p.name,
              runs: 0,
              ballsFaced: 0,
              fours: 0,
              sixes: 0,
              strikeRate: 0,
              isOut: false,
            });
          }
        }
        if (bowlerId && !activeInnings.bowlers.some((b) => b.playerId === bowlerId)) {
          const p = players.find((x) => x.id === bowlerId);
          if (p) {
            activeInnings.bowlers.push({
              playerId: p.id,
              playerName: p.name,
              overs: 0,
              ballsBowled: 0,
              maidens: 0,
              runsConceded: 0,
              wickets: 0,
              economy: 0,
            });
          }
        }
      }
    }

    const updatedMatch: Match = {
      ...currentMatch,
      status: (status as MatchStatus) || currentMatch.status,
      tossWinnerTeamId: tossWinnerTeamId ?? currentMatch.tossWinnerTeamId,
      tossDecision: tossDecision ?? currentMatch.tossDecision,
      resultSummary: resultSummary ?? currentMatch.resultSummary,
      winnerTeamId: winnerTeamId ?? currentMatch.winnerTeamId,
      manOfTheMatchId: manOfTheMatchId ?? currentMatch.manOfTheMatchId,
      innings: updatedInnings,
    };

    matches[matchIndex] = updatedMatch;
    await writeJson("matches", matches);

    if (status && status !== currentMatch.status) {
      await logActivity({
        category: "match_status",
        title: `Match ${status === "live" ? "Started" : status.toUpperCase()}`,
        description: `${updatedMatch.title} status changed to ${status}.`,
        matchId,
      });
    }

    return NextResponse.json<ApiResponse<Match>>({
      success: true,
      data: updatedMatch,
      message: "Match updated successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update match" },
      { status: 500 }
    );
  }
}
