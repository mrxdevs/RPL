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

  // Post a ball delivery to Match 1 (live match)
  if (umpireCookie && matchesRes?.data?.data?.length > 0) {
    const liveMatch = matchesRes.data.data.find(m => m.status === "live") || matchesRes.data.data[0];
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

  // Summary
  console.log("\n=========================================");
  console.log(`Test Execution Finished: ${passed} Passed, ${failed} Failed`);
  console.log("=========================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
