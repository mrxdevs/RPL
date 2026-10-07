import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/utils/jsonStore";
import { getCurrentSession } from "@/lib/utils/auth";
import {
  Match,
  BallOutcomeType,
  WicketType,
  BallRecord,
  ApiResponse,
  Player,
  Team,
} from "@/lib/types";
import {
  ballsToOvers,
  calculateEconomy,
  calculateStrikeRate,
} from "@/lib/cricket/cricketCalculations";
import { logActivity } from "@/lib/utils/activityLogger";

export async function POST(
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
    const {
      outcome,
      runsScored = 0,
      isWicket = false,
      wicketType,
      dismissedPlayerId,
      assistedById,
      newBatsmanId,
      commentary,
    } = body as {
      outcome: BallOutcomeType;
      runsScored?: number;
      isWicket?: boolean;
      wicketType?: WicketType;
      dismissedPlayerId?: string;
      assistedById?: string;
      newBatsmanId?: string;
      commentary?: string;
    };

    const matches = await readJson<Match[]>("matches", []);
    const matchIndex = matches.findIndex((m) => m.id === matchId);

    if (matchIndex === -1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    const match = matches[matchIndex];
    if (match.status !== "live") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Match is not live" },
        { status: 400 }
      );
    }

    const currentInnings = match.innings[match.currentInningsNumber - 1];
    if (!currentInnings || currentInnings.isCompleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No active innings found" },
        { status: 400 }
      );
    }

    const players = await readJson<Player[]>("players", []);
    const teams = await readJson<Team[]>("teams", []);

    const strikerId = currentInnings.currentStrikerId;
    const nonStrikerId = currentInnings.currentNonStrikerId;
    const bowlerId = currentInnings.currentBowlerId;

    if (!strikerId || !nonStrikerId || !bowlerId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Active striker, non-striker, and bowler must be set before recording balls" },
        { status: 400 }
      );
    }

    const striker = players.find((p) => p.id === strikerId);
    const bowler = players.find((p) => p.id === bowlerId);

    const isWide = outcome === "Wide";
    const isNoBall = outcome === "No-ball";
    const isBye = outcome === "Bye";
    const isLegBye = outcome === "Leg-bye";
    const isLegalDelivery = !isWide && !isNoBall;

    let runsOffBat = 0;
    let extraRuns = 0;

    if (isWide) {
      extraRuns = 1 + Number(runsScored);
      currentInnings.extras.wides += extraRuns;
    } else if (isNoBall) {
      extraRuns = 1;
      runsOffBat = Number(runsScored);
      currentInnings.extras.noBalls += 1;
    } else if (isBye) {
      extraRuns = Number(runsScored);
      currentInnings.extras.byes += extraRuns;
    } else if (isLegBye) {
      extraRuns = Number(runsScored);
      currentInnings.extras.legByes += extraRuns;
    } else if (outcome === "Wicket") {
      runsOffBat = Number(runsScored);
    } else {
      runsOffBat = parseInt(outcome, 10) || 0;
    }

    const totalBallRuns = runsOffBat + extraRuns;
    currentInnings.extras.total =
      currentInnings.extras.wides +
      currentInnings.extras.noBalls +
      currentInnings.extras.byes +
      currentInnings.extras.legByes;

    currentInnings.totalRuns += totalBallRuns;

    if (isLegalDelivery) {
      currentInnings.legalBalls += 1;
    }

    // Update striker stats
    let strikerStats = currentInnings.batsmen.find((b) => b.playerId === strikerId);
    if (!strikerStats && striker) {
      strikerStats = {
        playerId: striker.id,
        playerName: striker.name,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
      };
      currentInnings.batsmen.push(strikerStats);
    }

    if (strikerStats) {
      if (!isWide) {
        strikerStats.ballsFaced += 1;
      }
      strikerStats.runs += runsOffBat;
      if (runsOffBat === 4 && outcome === "4") strikerStats.fours += 1;
      if (runsOffBat === 6 && outcome === "6") strikerStats.sixes += 1;
      strikerStats.strikeRate = calculateStrikeRate(strikerStats.runs, strikerStats.ballsFaced);
    }

    // Update bowler stats
    let bowlerStats = currentInnings.bowlers.find((b) => b.playerId === bowlerId);
    if (!bowlerStats && bowler) {
      bowlerStats = {
        playerId: bowler.id,
        playerName: bowler.name,
        overs: 0,
        ballsBowled: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
      };
      currentInnings.bowlers.push(bowlerStats);
    }

    if (bowlerStats) {
      if (isLegalDelivery) {
        bowlerStats.ballsBowled += 1;
        bowlerStats.overs = parseFloat(ballsToOvers(bowlerStats.ballsBowled));
      }
      // Byes and leg byes do not go against bowler runs conceded
      if (!isBye && !isLegBye) {
        bowlerStats.runsConceded += totalBallRuns;
      }
      bowlerStats.economy = calculateEconomy(bowlerStats.runsConceded, bowlerStats.ballsBowled);
    }

    // Handle wicket
    const effectiveIsWicket = isWicket || outcome === "Wicket";
    let dismissedBatsmanName = "";

    if (effectiveIsWicket) {
      currentInnings.wickets += 1;
      const targetDismissedId = dismissedPlayerId || strikerId;
      const dismissedStats = currentInnings.batsmen.find((b) => b.playerId === targetDismissedId);
      const dismissedPlayer = players.find((p) => p.id === targetDismissedId);
      dismissedBatsmanName = dismissedPlayer?.name || "Batsman";

      const helperPlayer = assistedById ? players.find((p) => p.id === assistedById) : undefined;
      const wType: WicketType = wicketType || "Bowled";

      let desc = "";
      if (wType === "Bowled") desc = `b ${bowler?.name || "Bowler"}`;
      else if (wType === "Caught") desc = `c ${helperPlayer?.name || "Fielder"} b ${bowler?.name || "Bowler"}`;
      else if (wType === "LBW") desc = `lbw b ${bowler?.name || "Bowler"}`;
      else if (wType === "Run Out") desc = `run out (${helperPlayer?.name || "Fielder"})`;
      else if (wType === "Stumped") desc = `st ${helperPlayer?.name || "Keeper"} b ${bowler?.name || "Bowler"}`;
      else if (wType === "Hit Wicket") desc = `hit wicket b ${bowler?.name || "Bowler"}`;

      if (dismissedStats) {
        dismissedStats.isOut = true;
        dismissedStats.dismissalDescription = desc;
      }

      // Bowler credit (all wickets except Run Out)
      if (bowlerStats && wType !== "Run Out") {
        bowlerStats.wickets += 1;
      }

      // Record Fall of Wicket
      currentInnings.fallOfWickets.push({
        wicketNumber: currentInnings.wickets,
        runs: currentInnings.totalRuns,
        overString: ballsToOvers(currentInnings.legalBalls),
        batsmanName: dismissedBatsmanName,
      });

      // Replace dismissed batsman with new batsman
      if (newBatsmanId) {
        const newPlayer = players.find((p) => p.id === newBatsmanId);
        if (targetDismissedId === strikerId) {
          currentInnings.currentStrikerId = newBatsmanId;
        } else {
          currentInnings.currentNonStrikerId = newBatsmanId;
        }

        if (newPlayer && !currentInnings.batsmen.some((b) => b.playerId === newBatsmanId)) {
          currentInnings.batsmen.push({
            playerId: newPlayer.id,
            playerName: newPlayer.name,
            runs: 0,
            ballsFaced: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
            isOut: false,
          });
        }
      } else {
        // Clear dismissed position
        if (targetDismissedId === strikerId) currentInnings.currentStrikerId = undefined;
        else currentInnings.currentNonStrikerId = undefined;
      }

      await logActivity({
        category: "wicket",
        title: `Wicket - ${wType}`,
        description: `${dismissedBatsmanName} dismissed: ${desc} at ${currentInnings.totalRuns}/${currentInnings.wickets}.`,
        matchId,
        playerId: targetDismissedId,
      });
    }

    // Strike rotation on running runs (odd runs rotate strike)
    const runningRuns = isWide ? Number(runsScored) : isBye || isLegBye ? extraRuns : runsOffBat;
    if (runningRuns % 2 === 1 && !effectiveIsWicket) {
      currentInnings.currentStrikerId = nonStrikerId;
      currentInnings.currentNonStrikerId = strikerId;
    }

    // Over completion check
    const currentOverNumber = Math.floor((currentInnings.legalBalls - (isLegalDelivery ? 1 : 0)) / 6);
    const ballNumberInOver = isLegalDelivery
      ? ((currentInnings.legalBalls - 1) % 6) + 1
      : (currentInnings.legalBalls % 6) || 6;

    const overJustCompleted = isLegalDelivery && currentInnings.legalBalls % 6 === 0;
    if (overJustCompleted) {
      // Swap ends at end of over
      const tempStriker = currentInnings.currentStrikerId;
      currentInnings.currentStrikerId = currentInnings.currentNonStrikerId;
      currentInnings.currentNonStrikerId = tempStriker;
    }

    // Create ball record
    const ballRecord: BallRecord = {
      id: `ball_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      inningsNumber: currentInnings.inningsNumber,
      overNumber: currentOverNumber,
      ballNumberInOver,
      isLegalDelivery,
      outcome,
      runsScored: runsOffBat,
      extras: extraRuns,
      strikerId: strikerId,
      nonStrikerId: nonStrikerId,
      bowlerId: bowlerId,
      isWicket: effectiveIsWicket,
      wicketType: effectiveIsWicket ? (wicketType || "Bowled") : undefined,
      dismissedPlayerId: effectiveIsWicket ? (dismissedPlayerId || strikerId) : undefined,
      assistedById,
      timestamp: new Date().toISOString(),
      commentaryText:
        commentary ||
        `${bowler?.name || "Bowler"} to ${striker?.name || "Striker"}, ${outcome}${
          effectiveIsWicket ? ` (OUT!)` : runsOffBat > 0 ? `, ${runsOffBat} run(s)` : ""
        }`,
    };

    currentInnings.balls = [ballRecord, ...currentInnings.balls].slice(0, 300);

    // Boundary & Milestone Activity Logging
    if (runsOffBat === 4 || runsOffBat === 6) {
      await logActivity({
        category: "ball",
        title: runsOffBat === 4 ? "Boundary - Four" : "Maximum - Six",
        description: `${striker?.name || "Batsman"} hits a ${runsOffBat === 4 ? "four" : "six"} off ${bowler?.name || "Bowler"}.`,
        matchId,
        playerId: strikerId,
      });
    }

    if (strikerStats && (strikerStats.runs === 50 || strikerStats.runs === 100)) {
      await logActivity({
        category: "milestone",
        title: strikerStats.runs === 50 ? "Half-Century" : "Century",
        description: `${strikerStats.playerName} achieves ${strikerStats.runs} runs in ${strikerStats.ballsFaced} balls!`,
        matchId,
        playerId: strikerId,
      });
    }

    // Innings conclusion checks
    const maxLegalBalls = currentInnings.totalOversAllowed * 6;
    const allOut = currentInnings.wickets >= 10;
    const oversFinished = currentInnings.legalBalls >= maxLegalBalls;

    const battingTeam = teams.find((t) => t.id === currentInnings.battingTeamId);
    const bowlingTeam = teams.find((t) => t.id === currentInnings.bowlingTeamId);

    // Check if second innings chase has been won
    if (match.currentInningsNumber === 2 && match.targetScore) {
      if (currentInnings.totalRuns >= match.targetScore) {
        // Team 2 won
        currentInnings.isCompleted = true;
        match.status = "completed";
        match.winnerTeamId = currentInnings.battingTeamId;
        match.resultSummary = `${battingTeam?.name || "Batting team"} won by ${10 - currentInnings.wickets} wickets`;

        await logActivity({
          category: "match_status",
          title: "Match Concluded",
          description: `${match.title}: ${match.resultSummary}.`,
          matchId,
        });
      } else if (allOut || oversFinished) {
        // Team 1 won or tied
        currentInnings.isCompleted = true;
        match.status = "completed";

        if (currentInnings.totalRuns === match.targetScore - 1) {
          match.resultSummary = "Match tied";
        } else {
          const runMargin = match.targetScore - 1 - currentInnings.totalRuns;
          match.winnerTeamId = currentInnings.bowlingTeamId;
          match.resultSummary = `${bowlingTeam?.name || "Bowling team"} won by ${runMargin} runs`;
        }

        await logActivity({
          category: "match_status",
          title: "Match Concluded",
          description: `${match.title}: ${match.resultSummary}.`,
          matchId,
        });
      }
    } else if (match.currentInningsNumber === 1 && (allOut || oversFinished)) {
      // First innings closed, transition to second innings
      currentInnings.isCompleted = true;
      match.targetScore = currentInnings.totalRuns + 1;
      match.currentInningsNumber = 2;

      // Initialize second innings
      const secondBatTeamId = currentInnings.bowlingTeamId;
      const secondBowlTeamId = currentInnings.battingTeamId;
      const secondBatSquad = players.filter((p) => p.teamId === secondBatTeamId);
      const secondBowlSquad = players.filter((p) => p.teamId === secondBowlTeamId);

      const op1 = secondBatSquad[0];
      const op2 = secondBatSquad[1];
      const opBowl = secondBowlSquad.find((p) => p.role === "Bowler") || secondBowlSquad[0];

      match.innings.push({
        inningsNumber: 2,
        battingTeamId: secondBatTeamId,
        bowlingTeamId: secondBowlTeamId,
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        totalOversAllowed: currentInnings.totalOversAllowed,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
        currentStrikerId: op1?.id,
        currentNonStrikerId: op2?.id,
        currentBowlerId: opBowl?.id,
        batsmen: [
          ...(op1 ? [{ playerId: op1.id, playerName: op1.name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false }] : []),
          ...(op2 ? [{ playerId: op2.id, playerName: op2.name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, isOut: false }] : []),
        ],
        bowlers: opBowl ? [{ playerId: opBowl.id, playerName: opBowl.name, overs: 0, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, economy: 0 }] : [],
        fallOfWickets: [],
        balls: [],
        isCompleted: false,
      });

      await logActivity({
        category: "match_status",
        title: "Innings Break",
        description: `${battingTeam?.name} posted ${currentInnings.totalRuns}/${currentInnings.wickets}. Target for ${bowlingTeam?.name} is ${match.targetScore}.`,
        matchId,
      });
    }

    matches[matchIndex] = match;
    await writeJson("matches", matches);

    return NextResponse.json<ApiResponse<{ match: Match; ball: BallRecord }>>({
      success: true,
      data: { match, ball: ballRecord },
      message: "Ball recorded successfully",
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to record ball delivery" },
      { status: 500 }
    );
  }
}
