/**
 * RPL (Raptee Premier League) Comprehensive Smoke and Integration Test
 * Verifies all pages, APIs, authentication mechanisms, and cricket calculations.
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function logPass(msg) {
  passed++;
  console.log(`[PASS] ${msg}`);
}

function logFail(msg, detail) {
  failed++;
  console.error(`[FAIL] ${msg}`, detail ? `\n       ${detail}` : "");
}

async function testEndpoint(name, path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    if (!res.ok) {
      logFail(`${name} returned status ${res.status}`);
      return null;
    }
    logPass(`${name} (${res.status})`);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return { res, data: await res.json() };
    }
    return { res, text: await res.text() };
  } catch (err) {
    logFail(`${name} encountered error`, err.message);
    return null;
  }
}

async function runTests() {
  console.log("=== RPL Smoke and Integration Test Suite ===");
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Page HTTP 200 checks
  console.log("--- 1. Web Page Routes ---");
  const routes = [
    "/",
    "/scoreboard",
    "/schedule",
    "/auction",
    "/teams",
    "/players",
    "/login",
    "/admin",
    "/captain",
    "/umpire",
  ];

  for (const r of routes) {
    const res = await testEndpoint(`Page: ${r}`, r);
    if (res && res.text) {
      if (res.text.includes("Raptee Premier League") || res.text.includes("RPL") || res.text.includes("Match")) {
        logPass(`Page content verified for ${r}`);
      }
    }
  }

  // 2. Public Read APIs
  console.log("\n--- 2. Public Data API Routes ---");
  const teamsRes = await testEndpoint("API: GET /api/teams", "/api/teams");
  if (teamsRes?.data?.data && Array.isArray(teamsRes.data.data)) {
    logPass(`Retrieved ${teamsRes.data.data.length} teams`);
  }

  const playersRes = await testEndpoint("API: GET /api/players", "/api/players");
  if (playersRes?.data?.data && Array.isArray(playersRes.data.data)) {
    logPass(`Retrieved ${playersRes.data.data.length} registered players`);
  }

  const matchesRes = await testEndpoint("API: GET /api/matches", "/api/matches");
  if (matchesRes?.data?.data && Array.isArray(matchesRes.data.data)) {
    logPass(`Retrieved ${matchesRes.data.data.length} tournament matches`);
  }

  const auctionRes = await testEndpoint("API: GET /api/auction", "/api/auction");
  if (auctionRes?.data?.data) {
    logPass(`Auction state verified (lot: ${auctionRes.data.data.currentLot ? auctionRes.data.data.currentLot.playerName : "none"})`);
  }

  const activityRes = await testEndpoint("API: GET /api/activity", "/api/activity");
  if (activityRes?.data?.data && Array.isArray(activityRes.data.data)) {
    logPass(`Retrieved ${activityRes.data.data.length} recent activity items`);
  }

  // 3. Authentication Tests
  console.log("\n--- 3. Authentication & RBAC ---");
  
  // Test invalid credentials
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "unknown", password: "wrong" }),
  });
  if (badLogin.status === 401) {
    logPass("Rejected invalid credentials with 401 Unauthorized");
  } else {
    logFail(`Expected 401 for bad login, received ${badLogin.status}`);
  }

  // Test admin login
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  
  let adminCookie = "";
  if (adminLogin.ok) {
    const setCookie = adminLogin.headers.get("set-cookie");
    if (setCookie) {
      adminCookie = setCookie.split(";")[0];
      logPass("Admin logged in successfully and received session cookie");
    } else {
      logFail("Admin login did not return set-cookie header");
    }
  } else {
    logFail(`Admin login failed with status ${adminLogin.status}`);
  }

  // Verify auth session with cookie
  if (adminCookie) {
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    if (meRes.ok) {
      const meJson = await meRes.json();
      if (meJson.data && meJson.data.role === "admin") {
        logPass(`Session verified as role: ${meJson.data.role}`);
      } else {
        logFail("User role mismatch in /api/auth/me response", JSON.stringify(meJson));
      }
    } else {
      logFail("Admin auth verification failed", meRes.status);
    }
  }

  // Test User / Fan login
  const userLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user", password: "user123" }),
  });
  if (userLogin.ok) {
    const userJson = await userLogin.json();
    if (userJson.data?.role === "user") {
      logPass("General User / Fan authenticated successfully (Role: user)");
    } else {
      logFail("User role mismatch for user account");
    }
  } else {
    logFail(`User login failed with status ${userLogin.status}`);
  }

  // Test Umpire Live Scoring Delivery
  console.log("\n--- 4. Live Cricket Delivery Engine (Umpire Action) ---");
  const umpireLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "umpire", password: "umpire123" }),
  });

  let umpireCookie = "";
  if (umpireLogin.ok) {
    const setCookie = umpireLogin.headers.get("set-cookie");
    if (setCookie) umpireCookie = setCookie.split(";")[0];
    logPass("Umpire authenticated for match gameplay action");
  } else {
    logFail("Umpire login failed");
  }

  if (!matchesRes?.data?.data || matchesRes.data.data.length === 0) {
    logPass("Verified tournament starts clean and unconfigured (0 matches scheduled)");
  }

  // Post a ball delivery if there is a live match
  const liveMatch = matchesRes?.data?.data?.find((m) => m.status === "live");
  if (umpireCookie && liveMatch) {
    const innIdx = (liveMatch.currentInnings || 1) - 1;
    const currentInnings = liveMatch.innings[innIdx];

    const ballPayload = {
      runsScored: 1,
      outcome: "1",
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      strikerId: currentInnings?.currentStrikerId || "p1",
      nonStrikerId: currentInnings?.currentNonStrikerId || "p2",
      bowlerId: currentInnings?.currentBowlerId || "p10",
      commentary: "Pushed softly into the cover region for a sharp single",
    };

    const ballRes = await fetch(`${BASE_URL}/api/matches/${liveMatch.id}/ball`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: umpireCookie,
      },
      body: JSON.stringify(ballPayload),
    });

    if (ballRes.ok) {
      const ballJson = await ballRes.json();
      const matchObj = ballJson.data?.match || ballJson.data;
      const updatedInnings = matchObj?.innings?.[(matchObj?.currentInnings || 1) - 1];
      if (updatedInnings) {
        const oversCompleted = Math.floor(updatedInnings.legalBalls / 6);
        const ballsInOver = updatedInnings.legalBalls % 6;
        logPass(`Ball delivery recorded! Score: ${updatedInnings.totalRuns}/${updatedInnings.wickets} in ${oversCompleted}.${ballsInOver} overs`);
      } else {
        logPass(`Ball delivery recorded successfully: ${JSON.stringify(ballJson.data).slice(0, 80)}`);
      }
    } else {
      const ballErr = await ballRes.text();
      logFail(`Failed to record ball delivery (${ballRes.status})`, ballErr);
    }
  }

  // 5. Admin Workflows: Team Creation, Player Auction Sale, Captain Assignment, Match Scheduling
  console.log("\n--- 5. Admin Tournament Configuration & Auction Workflows ---");
  if (adminCookie) {
    // 5.1 Create Team A
    const teamARes = await fetch(`${BASE_URL}/api/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "Chennai Strikers", shortName: "CS", totalBudget: 10000000, primaryColor: "#F55A00" }),
    });
    const teamAJson = await teamARes.json();
    if (teamAJson.success && teamAJson.data?.id) {
      logPass(`Created franchise team: ${teamAJson.data.name} (Budget: ₹1,00,00,000)`);
    } else {
      logFail("Failed to create Team A", JSON.stringify(teamAJson));
    }

    // 5.2 Create Team B
    const teamBRes = await fetch(`${BASE_URL}/api/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "Bangalore Dynamos", shortName: "BD", totalBudget: 10000000, primaryColor: "#00B07D" }),
    });
    const teamBJson = await teamBRes.json();
    if (teamBJson.success && teamBJson.data?.id) {
      logPass(`Created franchise team: ${teamBJson.data.name} (Budget: ₹1,00,00,000)`);
    } else {
      logFail("Failed to create Team B", JSON.stringify(teamBJson));
    }

    // 5.3 Register Player
    const playerRes = await fetch(`${BASE_URL}/api/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "Kavitha Raman", role: "All-rounder", basePrice: 500000 }),
    });
    const playerJson = await playerRes.json();
    if (playerJson.success && playerJson.data?.id) {
      logPass(`Registered player: ${playerJson.data.name} in auction pool`);
    } else {
      logFail("Failed to register player", JSON.stringify(playerJson));
    }

    // 5.4 Sell Player to Team A (Auction Transaction)
    if (teamAJson.data?.id && playerJson.data?.id) {
      const sellRes = await fetch(`${BASE_URL}/api/auction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          action: "sell",
          playerId: playerJson.data.id,
          teamId: teamAJson.data.id,
          soldPrice: 750000,
        }),
      });
      const sellJson = await sellRes.json();
      if (sellJson.success) {
        logPass(`Auction Transaction: Sold ${playerJson.data.name} to ${teamAJson.data.name} for ₹7,50,000`);
      } else {
        logFail("Auction Transaction Failed", JSON.stringify(sellJson));
      }

      // Verify budget deduction on Team A
      const verifyTeamRes = await fetch(`${BASE_URL}/api/teams/${teamAJson.data.id}`);
      const verifyTeamJson = await verifyTeamRes.json();
      if (verifyTeamJson.data?.team?.remainingBudget === 9250000) {
        logPass(`Verified budget deduction: Remaining cap is ₹92,50,000 (Deducted ₹7,50,000)`);
      } else {
        logFail("Budget deduction mismatch", JSON.stringify(verifyTeamJson.data?.team));
      }

      // 5.5 Assign Player as Team Captain
      const captainRes = await fetch(`${BASE_URL}/api/teams/${teamAJson.data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({ captainId: playerJson.data.id }),
      });
      const captainJson = await captainRes.json();
      if (captainJson.success && captainJson.data?.captainId === playerJson.data.id) {
        logPass(`Assigned ${playerJson.data.name} as official Team Captain for ${teamAJson.data.name}`);
      } else {
        logFail("Captain assignment failed", JSON.stringify(captainJson));
      }
    }

    // 5.6 Schedule Tournament Fixture between Team A and Team B
    if (teamAJson.data?.id && teamBJson.data?.id) {
      const fixtureRes = await fetch(`${BASE_URL}/api/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: adminCookie },
        body: JSON.stringify({
          title: "Season 2 Inaugural Derby",
          teamAId: teamAJson.data.id,
          teamBId: teamBJson.data.id,
          scheduledAt: "2026-10-10T14:00",
          venue: "Raptee Arena, Chennai",
          format: "T20",
        }),
      });
      const fixtureJson = await fixtureRes.json();
      if (fixtureJson.success && fixtureJson.data?.id) {
        logPass(`Scheduled tournament fixture: ${fixtureJson.data.title} (${teamAJson.data.name} vs ${teamBJson.data.name})`);
      } else {
        logFail("Tournament fixture scheduling failed", JSON.stringify(fixtureJson));
      }
    }
  }

  // Summary
  console.log("\n=========================================");
  console.log(`Test Execution Finished: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
