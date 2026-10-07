import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "src", "data");
const SEEDS_DIR = path.join(DATA_DIR, "seeds");

const teams = [
  {
    id: "team_1",
    name: "Chennai Chargers",
    shortName: "CC",
    totalBudget: 10000000,
    remainingBudget: 3400000,
    captainId: "ply_1",
    playerIds: [
      "ply_1", "ply_2", "ply_3", "ply_4", "ply_5", "ply_6",
      "ply_7", "ply_8", "ply_9", "ply_10", "ply_11"
    ],
    primaryColor: "#F55A00"
  },
  {
    id: "team_2",
    name: "Bengaluru Blasters",
    shortName: "BB",
    totalBudget: 10000000,
    remainingBudget: 4200000,
    captainId: "ply_12",
    playerIds: [
      "ply_12", "ply_13", "ply_14", "ply_15", "ply_16", "ply_17",
      "ply_18", "ply_19", "ply_20", "ply_21", "ply_22"
    ],
    primaryColor: "#00B07D"
  },
  {
    id: "team_3",
    name: "Mumbai Mavericks",
    shortName: "MM",
    totalBudget: 10000000,
    remainingBudget: 5800000,
    captainId: "ply_23",
    playerIds: ["ply_23", "ply_24"],
    primaryColor: "#007A57"
  },
  {
    id: "team_4",
    name: "Delhi Dynamos",
    shortName: "DD",
    totalBudget: 10000000,
    remainingBudget: 6500000,
    captainId: "ply_25",
    playerIds: ["ply_25", "ply_26"],
    primaryColor: "#FFD600"
  }
];

const players = [
  // Team 1: Chennai Chargers
  {
    id: "ply_1",
    name: "Vikram Rathore",
    role: "Batter",
    basePrice: 500000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 1200000,
    battingOrder: 1,
    stats: { matches: 12, runs: 420, ballsFaced: 280, highestScore: 78, fours: 38, sixes: 16, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_2",
    name: "Arjun Nair",
    role: "Batter",
    basePrice: 400000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 850000,
    battingOrder: 2,
    stats: { matches: 10, runs: 310, ballsFaced: 220, highestScore: 62, fours: 28, sixes: 9, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_3",
    name: "Dinesh Karthik",
    role: "Wicketkeeper",
    basePrice: 600000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 1400000,
    battingOrder: 3,
    stats: { matches: 14, runs: 490, ballsFaced: 310, highestScore: 84, fours: 44, sixes: 22, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_4",
    name: "Suresh Raman",
    role: "All-rounder",
    basePrice: 500000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 950000,
    battingOrder: 4,
    stats: { matches: 11, runs: 280, ballsFaced: 190, highestScore: 54, fours: 22, sixes: 11, wickets: 9, oversBowled: 34, runsConceded: 240, bestBowling: "3/22" }
  },
  {
    id: "ply_5",
    name: "Karan Sundar",
    role: "All-rounder",
    basePrice: 400000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 700000,
    battingOrder: 5,
    stats: { matches: 9, runs: 195, ballsFaced: 130, highestScore: 41, fours: 15, sixes: 7, wickets: 7, oversBowled: 28, runsConceded: 210, bestBowling: "2/18" }
  },
  {
    id: "ply_6",
    name: "Pranav Iyer",
    role: "Batter",
    basePrice: 300000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 450000,
    battingOrder: 6,
    stats: { matches: 8, runs: 140, ballsFaced: 95, highestScore: 35, fours: 12, sixes: 4, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_7",
    name: "Rishi Chawla",
    role: "All-rounder",
    basePrice: 350000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 500000,
    battingOrder: 7,
    stats: { matches: 7, runs: 90, ballsFaced: 60, highestScore: 28, fours: 7, sixes: 3, wickets: 6, oversBowled: 22, runsConceded: 165, bestBowling: "2/24" }
  },
  {
    id: "ply_8",
    name: "Aswin Kumar",
    role: "Bowler",
    basePrice: 500000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 1100000,
    battingOrder: 8,
    stats: { matches: 12, runs: 45, ballsFaced: 35, highestScore: 14, fours: 3, sixes: 1, wickets: 16, oversBowled: 44, runsConceded: 295, bestBowling: "4/18" }
  },
  {
    id: "ply_9",
    name: "Harish Murugan",
    role: "Bowler",
    basePrice: 350000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 550000,
    battingOrder: 9,
    stats: { matches: 10, runs: 20, ballsFaced: 18, highestScore: 8, fours: 1, sixes: 0, wickets: 12, oversBowled: 36, runsConceded: 250, bestBowling: "3/15" }
  },
  {
    id: "ply_10",
    name: "Varun Natarajan",
    role: "Bowler",
    basePrice: 400000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 650000,
    battingOrder: 10,
    stats: { matches: 11, runs: 12, ballsFaced: 15, highestScore: 6, fours: 1, sixes: 0, wickets: 14, oversBowled: 40, runsConceded: 280, bestBowling: "3/21" }
  },
  {
    id: "ply_11",
    name: "Manoj Balaji",
    role: "Bowler",
    basePrice: 250000,
    auctionStatus: "sold",
    teamId: "team_1",
    soldPrice: 350000,
    battingOrder: 11,
    stats: { matches: 6, runs: 5, ballsFaced: 8, highestScore: 4, fours: 0, sixes: 0, wickets: 7, oversBowled: 20, runsConceded: 145, bestBowling: "2/16" }
  },

  // Team 2: Bengaluru Blasters
  {
    id: "ply_12",
    name: "Rohit Varma",
    role: "Batter",
    basePrice: 600000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 1500000,
    battingOrder: 1,
    stats: { matches: 15, runs: 560, ballsFaced: 360, highestScore: 92, fours: 52, sixes: 24, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_13",
    name: "Kavish Patel",
    role: "Batter",
    basePrice: 450000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 800000,
    battingOrder: 2,
    stats: { matches: 11, runs: 340, ballsFaced: 235, highestScore: 68, fours: 30, sixes: 12, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_14",
    name: "Sanath Gowda",
    role: "All-rounder",
    basePrice: 500000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 1100000,
    battingOrder: 3,
    stats: { matches: 13, runs: 390, ballsFaced: 250, highestScore: 74, fours: 34, sixes: 15, wickets: 10, oversBowled: 38, runsConceded: 275, bestBowling: "3/20" }
  },
  {
    id: "ply_15",
    name: "Naveen Hegde",
    role: "Wicketkeeper",
    basePrice: 400000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 750000,
    battingOrder: 4,
    stats: { matches: 10, runs: 240, ballsFaced: 165, highestScore: 51, fours: 20, sixes: 8, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_16",
    name: "Chethan Prasad",
    role: "Batter",
    basePrice: 350000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 500000,
    battingOrder: 5,
    stats: { matches: 8, runs: 165, ballsFaced: 110, highestScore: 44, fours: 14, sixes: 5, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_17",
    name: "Aditya Shetty",
    role: "All-rounder",
    basePrice: 350000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 600000,
    battingOrder: 6,
    stats: { matches: 9, runs: 150, ballsFaced: 105, highestScore: 36, fours: 12, sixes: 4, wickets: 8, oversBowled: 30, runsConceded: 215, bestBowling: "2/19" }
  },
  {
    id: "ply_18",
    name: "Kishore Rao",
    role: "Bowler",
    basePrice: 450000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 900000,
    battingOrder: 7,
    stats: { matches: 12, runs: 55, ballsFaced: 40, highestScore: 18, fours: 4, sixes: 2, wickets: 15, oversBowled: 42, runsConceded: 290, bestBowling: "3/17" }
  },
  {
    id: "ply_19",
    name: "Farhan Khan",
    role: "Bowler",
    basePrice: 400000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 700000,
    battingOrder: 8,
    stats: { matches: 10, runs: 30, ballsFaced: 25, highestScore: 12, fours: 2, sixes: 1, wickets: 11, oversBowled: 35, runsConceded: 245, bestBowling: "3/25" }
  },
  {
    id: "ply_20",
    name: "Darshan Naik",
    role: "Bowler",
    basePrice: 300000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 450000,
    battingOrder: 9,
    stats: { matches: 7, runs: 14, ballsFaced: 16, highestScore: 7, fours: 1, sixes: 0, wickets: 8, oversBowled: 24, runsConceded: 170, bestBowling: "2/21" }
  },
  {
    id: "ply_21",
    name: "Tejas Gowda",
    role: "Bowler",
    basePrice: 250000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 300000,
    battingOrder: 10,
    stats: { matches: 5, runs: 8, ballsFaced: 10, highestScore: 5, fours: 0, sixes: 0, wickets: 5, oversBowled: 16, runsConceded: 120, bestBowling: "2/14" }
  },
  {
    id: "ply_22",
    name: "Sharath Mohan",
    role: "Bowler",
    basePrice: 200000,
    auctionStatus: "sold",
    teamId: "team_2",
    soldPrice: 250000,
    battingOrder: 11,
    stats: { matches: 4, runs: 2, ballsFaced: 5, highestScore: 2, fours: 0, sixes: 0, wickets: 4, oversBowled: 12, runsConceded: 95, bestBowling: "1/18" }
  },

  // Team 3 & 4 base captains + upcoming auction lots
  {
    id: "ply_23",
    name: "Mayank Desai",
    role: "Batter",
    basePrice: 600000,
    auctionStatus: "sold",
    teamId: "team_3",
    soldPrice: 1600000,
    battingOrder: 1,
    stats: { matches: 14, runs: 470, ballsFaced: 320, highestScore: 81, fours: 40, sixes: 18, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_24",
    name: "Zaheer Siddiqui",
    role: "Bowler",
    basePrice: 550000,
    auctionStatus: "sold",
    teamId: "team_3",
    soldPrice: 1250000,
    battingOrder: 2,
    stats: { matches: 13, runs: 22, ballsFaced: 20, highestScore: 9, fours: 1, sixes: 0, wickets: 17, oversBowled: 46, runsConceded: 310, bestBowling: "4/21" }
  },
  {
    id: "ply_25",
    name: "Gautam Malhotra",
    role: "Batter",
    basePrice: 650000,
    auctionStatus: "sold",
    teamId: "team_4",
    soldPrice: 1750000,
    battingOrder: 1,
    stats: { matches: 16, runs: 530, ballsFaced: 345, highestScore: 89, fours: 48, sixes: 21, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_26",
    name: "Kuldeep Rana",
    role: "Bowler",
    basePrice: 500000,
    auctionStatus: "sold",
    teamId: "team_4",
    soldPrice: 1100000,
    battingOrder: 2,
    stats: { matches: 12, runs: 18, ballsFaced: 16, highestScore: 8, fours: 1, sixes: 0, wickets: 15, oversBowled: 42, runsConceded: 285, bestBowling: "3/19" }
  },

  // Available for auction
  {
    id: "ply_27",
    name: "Devendra Joshi",
    role: "All-rounder",
    basePrice: 450000,
    auctionStatus: "available",
    stats: { matches: 8, runs: 185, ballsFaced: 125, highestScore: 46, fours: 15, sixes: 6, wickets: 7, oversBowled: 26, runsConceded: 185, bestBowling: "2/17" }
  },
  {
    id: "ply_28",
    name: "Saurabh Tiwari",
    role: "Batter",
    basePrice: 350000,
    auctionStatus: "available",
    stats: { matches: 6, runs: 145, ballsFaced: 100, highestScore: 42, fours: 12, sixes: 4, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  },
  {
    id: "ply_29",
    name: "Akash Deep",
    role: "Bowler",
    basePrice: 400000,
    auctionStatus: "available",
    stats: { matches: 9, runs: 12, ballsFaced: 15, highestScore: 6, fours: 1, sixes: 0, wickets: 12, oversBowled: 32, runsConceded: 220, bestBowling: "3/23" }
  },
  {
    id: "ply_30",
    name: "Naman Ojha",
    role: "Wicketkeeper",
    basePrice: 400000,
    auctionStatus: "available",
    stats: { matches: 7, runs: 175, ballsFaced: 120, highestScore: 48, fours: 14, sixes: 5, wickets: 0, oversBowled: 0, runsConceded: 0, bestBowling: "0/0" }
  }
];

const matches = [
  {
    id: "mat_1",
    matchNumber: 1,
    title: "Match 1 - Southern Derby",
    format: "T20",
    scheduledAt: "2026-10-07T14:00:00.000Z",
    venue: "Raptee Arena, Chennai",
    status: "live",
    teamAId: "team_1",
    teamBId: "team_2",
    umpireId: "usr_umpire",
    tossWinnerTeamId: "team_1",
    tossDecision: "bat",
    currentInningsNumber: 2,
    targetScore: 168,
    innings: [
      {
        inningsNumber: 1,
        battingTeamId: "team_1",
        bowlingTeamId: "team_2",
        totalRuns: 167,
        wickets: 5,
        legalBalls: 120,
        totalOversAllowed: 20,
        extras: { wides: 6, noBalls: 2, byes: 1, legByes: 2, total: 11 },
        currentStrikerId: "ply_5",
        currentNonStrikerId: "ply_6",
        currentBowlerId: "ply_18",
        batsmen: [
          { playerId: "ply_1", playerName: "Vikram Rathore", runs: 54, ballsFaced: 36, fours: 6, sixes: 2, strikeRate: 150.0, isOut: true, dismissalDescription: "c Kavish Patel b Kishore Rao" },
          { playerId: "ply_2", playerName: "Arjun Nair", runs: 32, ballsFaced: 24, fours: 3, sixes: 1, strikeRate: 133.33, isOut: true, dismissalDescription: "b Farhan Khan" },
          { playerId: "ply_3", playerName: "Dinesh Karthik", runs: 45, ballsFaced: 28, fours: 4, sixes: 2, strikeRate: 160.71, isOut: true, dismissalDescription: "c Naveen Hegde b Sanath Gowda" },
          { playerId: "ply_4", playerName: "Suresh Raman", runs: 18, ballsFaced: 16, fours: 1, sixes: 1, strikeRate: 112.5, isOut: true, dismissalDescription: "run out (Aditya Shetty)" },
          { playerId: "ply_5", playerName: "Karan Sundar", runs: 12, ballsFaced: 9, fours: 1, sixes: 0, strikeRate: 133.33, isOut: false },
          { playerId: "ply_6", playerName: "Pranav Iyer", runs: 6, ballsFaced: 7, fours: 0, sixes: 0, strikeRate: 85.71, isOut: false }
        ],
        bowlers: [
          { playerId: "ply_18", playerName: "Kishore Rao", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 34, wickets: 1, economy: 8.5 },
          { playerId: "ply_19", playerName: "Farhan Khan", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 31, wickets: 1, economy: 7.75 },
          { playerId: "ply_14", playerName: "Sanath Gowda", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5 },
          { playerId: "ply_17", playerName: "Aditya Shetty", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 35, wickets: 0, economy: 8.75 },
          { playerId: "ply_20", playerName: "Darshan Naik", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 29, wickets: 1, economy: 7.25 }
        ],
        fallOfWickets: [
          { wicketNumber: 1, runs: 68, overString: "7.4", batsmanName: "Arjun Nair" },
          { wicketNumber: 2, runs: 112, overString: "13.1", batsmanName: "Vikram Rathore" },
          { wicketNumber: 3, runs: 138, overString: "16.2", batsmanName: "Suresh Raman" },
          { wicketNumber: 4, runs: 152, overString: "18.1", batsmanName: "Dinesh Karthik" }
        ],
        balls: [],
        isCompleted: true
      },
      {
        inningsNumber: 2,
        battingTeamId: "team_2",
        bowlingTeamId: "team_1",
        totalRuns: 118,
        wickets: 3,
        legalBalls: 86,
        totalOversAllowed: 20,
        extras: { wides: 4, noBalls: 1, byes: 0, legByes: 2, total: 7 },
        currentStrikerId: "ply_12",
        currentNonStrikerId: "ply_15",
        currentBowlerId: "ply_8",
        batsmen: [
          { playerId: "ply_12", playerName: "Rohit Varma", runs: 62, ballsFaced: 42, fours: 7, sixes: 3, strikeRate: 147.62, isOut: false },
          { playerId: "ply_13", playerName: "Kavish Patel", runs: 21, ballsFaced: 18, fours: 2, sixes: 0, strikeRate: 116.67, isOut: true, dismissalDescription: "c Dinesh Karthik b Aswin Kumar" },
          { playerId: "ply_14", playerName: "Sanath Gowda", runs: 14, ballsFaced: 12, fours: 1, sixes: 0, strikeRate: 116.67, isOut: true, dismissalDescription: "lbw b Harish Murugan" },
          { playerId: "ply_15", playerName: "Naveen Hegde", runs: 14, ballsFaced: 14, fours: 1, sixes: 0, strikeRate: 100.0, isOut: false }
        ],
        bowlers: [
          { playerId: "ply_8", playerName: "Aswin Kumar", overs: 3.2, ballsBowled: 20, maidens: 0, runsConceded: 26, wickets: 1, economy: 7.8 },
          { playerId: "ply_9", playerName: "Harish Murugan", overs: 3.0, ballsBowled: 18, maidens: 0, runsConceded: 24, wickets: 1, economy: 8.0 },
          { playerId: "ply_10", playerName: "Varun Natarajan", overs: 3.0, ballsBowled: 18, maidens: 0, runsConceded: 28, wickets: 0, economy: 9.33 },
          { playerId: "ply_4", playerName: "Suresh Raman", overs: 3.0, ballsBowled: 18, maidens: 0, runsConceded: 22, wickets: 1, economy: 7.33 },
          { playerId: "ply_5", playerName: "Karan Sundar", overs: 2.0, ballsBowled: 12, maidens: 0, runsConceded: 18, wickets: 0, economy: 9.0 }
        ],
        fallOfWickets: [
          { wicketNumber: 1, runs: 42, overString: "5.1", batsmanName: "Kavish Patel" },
          { wicketNumber: 2, runs: 78, overString: "9.4", batsmanName: "Sanath Gowda" }
        ],
        currentPartnership: {
          batsman1Id: "ply_12",
          batsman1Runs: 28,
          batsman2Id: "ply_15",
          batsman2Runs: 14,
          totalRuns: 40,
          ballsFaced: 28
        },
        balls: [
          {
            id: "b_86",
            inningsNumber: 2,
            overNumber: 14,
            ballNumberInOver: 2,
            isLegalDelivery: true,
            outcome: "1",
            runsScored: 1,
            extras: 0,
            strikerId: "ply_12",
            nonStrikerId: "ply_15",
            bowlerId: "ply_8",
            isWicket: false,
            timestamp: new Date().toISOString(),
            commentaryText: "Aswin Kumar to Rohit Varma, 1 run, pushed into the gap at mid-wicket for a single."
          },
          {
            id: "b_85",
            inningsNumber: 2,
            overNumber: 14,
            ballNumberInOver: 1,
            isLegalDelivery: true,
            outcome: "4",
            runsScored: 4,
            extras: 0,
            strikerId: "ply_12",
            nonStrikerId: "ply_15",
            bowlerId: "ply_8",
            isWicket: false,
            timestamp: new Date().toISOString(),
            commentaryText: "Aswin Kumar to Rohit Varma, FOUR, sublime cover drive through extra cover!"
          }
        ],
        isCompleted: false
      }
    ]
  },
  {
    id: "mat_2",
    matchNumber: 2,
    title: "Match 2 - Capital Clash",
    format: "T20",
    scheduledAt: "2026-10-08T14:30:00.000Z",
    venue: "Raptee Arena, Bengaluru",
    status: "scheduled",
    teamAId: "team_3",
    teamBId: "team_4",
    umpireId: "usr_umpire",
    currentInningsNumber: 1,
    innings: []
  },
  {
    id: "mat_3",
    matchNumber: 3,
    title: "Match 3 - Pre-season Showdown",
    format: "T20",
    scheduledAt: "2026-10-05T14:00:00.000Z",
    venue: "Raptee Ground, Chennai",
    status: "completed",
    teamAId: "team_1",
    teamBId: "team_4",
    umpireId: "usr_umpire",
    tossWinnerTeamId: "team_1",
    tossDecision: "bat",
    currentInningsNumber: 2,
    targetScore: 156,
    resultSummary: "Chennai Chargers won by 18 runs",
    winnerTeamId: "team_1",
    manOfTheMatchId: "ply_1",
    innings: [
      {
        inningsNumber: 1,
        battingTeamId: "team_1",
        bowlingTeamId: "team_4",
        totalRuns: 155,
        wickets: 6,
        legalBalls: 120,
        totalOversAllowed: 20,
        extras: { wides: 5, noBalls: 1, byes: 2, legByes: 1, total: 9 },
        batsmen: [
          { playerId: "ply_1", playerName: "Vikram Rathore", runs: 68, ballsFaced: 45, fours: 7, sixes: 3, strikeRate: 151.11, isOut: true, dismissalDescription: "b Kuldeep Rana" }
        ],
        bowlers: [
          { playerId: "ply_26", playerName: "Kuldeep Rana", overs: 4.0, ballsBowled: 24, maidens: 1, runsConceded: 26, wickets: 3, economy: 6.5 }
        ],
        fallOfWickets: [],
        balls: [],
        isCompleted: true
      },
      {
        inningsNumber: 2,
        battingTeamId: "team_4",
        bowlingTeamId: "team_1",
        totalRuns: 137,
        wickets: 8,
        legalBalls: 120,
        totalOversAllowed: 20,
        extras: { wides: 4, noBalls: 2, byes: 0, legByes: 2, total: 8 },
        batsmen: [
          { playerId: "ply_25", playerName: "Gautam Malhotra", runs: 52, ballsFaced: 39, fours: 5, sixes: 1, strikeRate: 133.33, isOut: true, dismissalDescription: "c Suresh Raman b Aswin Kumar" }
        ],
        bowlers: [
          { playerId: "ply_8", playerName: "Aswin Kumar", overs: 4.0, ballsBowled: 24, maidens: 0, runsConceded: 22, wickets: 4, economy: 5.5 }
        ],
        fallOfWickets: [],
        balls: [],
        isCompleted: true
      }
    ]
  }
];

const auction = {
  currentLotPlayerId: "ply_27",
  currentBidAmount: 450000,
  currentLeadingTeamId: "team_3",
  history: [
    { playerId: "ply_1", teamId: "team_1", soldPrice: 1200000, soldAt: "2026-10-04T10:15:00.000Z" },
    { playerId: "ply_12", teamId: "team_2", soldPrice: 1500000, soldAt: "2026-10-04T10:30:00.000Z" },
    { playerId: "ply_25", teamId: "team_4", soldPrice: 1750000, soldAt: "2026-10-04T10:45:00.000Z" },
    { playerId: "ply_3", teamId: "team_1", soldPrice: 1400000, soldAt: "2026-10-04T11:00:00.000Z" },
    { playerId: "ply_14", teamId: "team_2", soldPrice: 1100000, soldAt: "2026-10-04T11:15:00.000Z" }
  ]
};

const activity = [
  {
    id: "act_101",
    category: "ball",
    title: "Boundary - Four",
    description: "Rohit Varma strokes a sublime cover drive through extra cover off Aswin Kumar.",
    timestamp: "2026-10-07T14:48:00.000Z",
    matchId: "mat_1",
    teamId: "team_2",
    playerId: "ply_12"
  },
  {
    id: "act_102",
    category: "milestone",
    title: "Half-Century",
    description: "Rohit Varma reaches his fifty in 35 deliveries with 6 fours and 2 sixes.",
    timestamp: "2026-10-07T14:38:00.000Z",
    matchId: "mat_1",
    teamId: "team_2",
    playerId: "ply_12"
  },
  {
    id: "act_103",
    category: "wicket",
    title: "Wicket - LBW",
    description: "Sanath Gowda is trapped LBW by Harish Murugan for 14 runs.",
    timestamp: "2026-10-07T14:26:00.000Z",
    matchId: "mat_1",
    teamId: "team_2",
    playerId: "ply_14"
  },
  {
    id: "act_104",
    category: "match_status",
    title: "Innings 1 Concluded",
    description: "Chennai Chargers post 167/5 in 20.0 overs. Target for Bengaluru Blasters is 168.",
    timestamp: "2026-10-07T13:45:00.000Z",
    matchId: "mat_1"
  },
  {
    id: "act_105",
    category: "auction",
    title: "Player Sold",
    description: "Dinesh Karthik acquired by Chennai Chargers for ₹14,00,000.",
    timestamp: "2026-10-04T11:00:00.000Z",
    teamId: "team_1",
    playerId: "ply_3"
  }
];

async function seed() {
  const datasets = [
    { name: "teams.json", data: teams },
    { name: "players.json", data: players },
    { name: "matches.json", data: matches },
    { name: "auction.json", data: auction },
    { name: "activity.json", data: activity }
  ];

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(SEEDS_DIR, { recursive: true });

  for (const { name, data } of datasets) {
    const liveFile = path.join(DATA_DIR, name);
    const seedFile = path.join(SEEDS_DIR, name);
    const content = JSON.stringify(data, null, 2);

    await fs.writeFile(liveFile, content, "utf-8");
    await fs.writeFile(seedFile, content, "utf-8");
  }

  process.stdout.write("Seed data successfully written to src/data/ and src/data/seeds/\\n");
}

seed().catch((err) => {
  process.stderr.write(`Seeding failed: ${err.message}\\n`);
  process.exit(1);
});
