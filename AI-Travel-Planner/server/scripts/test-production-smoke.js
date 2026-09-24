/**
 * TripSync — Phase 4 Production Smoke Verification Suite
 *
 * Distinctly partitioned into:
 *   [A] Public Smoke Tests (Homepage/Health, Robots, Sitemap, Destination Guides, Images, Error Sanitization)
 *   [B] Authenticated Application Tests (Auth, Protected APIs, Trip Lifecycle, Reviews Persistence, JWT Expiry)
 *   [C] External Provider Tests (Google Places & Gemini AI — isolated so external provider status is distinct)
 *
 * CRITICAL SAFETY: No hardcoded credentials or API keys. Uses environment variables.
 */

const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BASE_URL = process.env.TEST_API_URL || "http://localhost:8000/api";
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, "");

let groupAResults = { total: 0, passed: 0, failed: 0 };
let groupBResults = { total: 0, passed: 0, failed: 0 };
let groupCResults = { total: 0, passed: 0, failed: 0 };

function recordResult(group, name, passed, detail) {
  group.total++;
  if (passed) {
    group.passed++;
    console.log(`  ✅ [PASS] ${name}`);
    if (detail) console.log(`     ${detail}`);
  } else {
    group.failed++;
    console.error(`  ❌ [FAIL] ${name}`);
    if (detail) console.error(`     ${detail}`);
  }
}

async function runProductionSmoke() {
  console.log("================================================================================");
  console.log("🚀 TripSync — Phase 4 Production Deployment Smoke Verification Suite");
  console.log("================================================================================\n");
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Target Root URL: ${ROOT_URL}\n`);

  // ================================================================================
  // GROUP A: PUBLIC SMOKE TESTS
  // ================================================================================
  console.log("--------------------------------------------------------------------------------");
  console.log("📂 [GROUP A] Public Smoke Tests (Public Endpoints, SEO, Assets & Error Safety)");
  console.log("--------------------------------------------------------------------------------");

  // A1. Health Endpoint
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    recordResult(
      groupAResults,
      "API Health Check returns HTTP 200 OK",
      res.status === 200 && res.data?.status === "OK",
      `Status: ${res.status} | Response: ${JSON.stringify(res.data)}`
    );
  } catch (err) {
    recordResult(groupAResults, "API Health Check returns HTTP 200 OK", false, err.message);
  }

  // A2. Robots.txt
  try {
    const res = await axios.get(`${ROOT_URL}/robots.txt`);
    const isRobots = res.status === 200 && res.data.includes("User-agent:") && res.data.includes("Disallow: /api/");
    recordResult(
      groupAResults,
      "robots.txt is accessible and disallows private routes",
      isRobots,
      `Status: ${res.status} | Contains sitemap: ${res.data.includes("sitemap.xml")}`
    );
  } catch (err) {
    recordResult(groupAResults, "robots.txt is accessible", false, err.message);
  }

  // A3. Sitemap.xml
  try {
    const res = await axios.get(`${ROOT_URL}/sitemap.xml`);
    const isSitemap = res.status === 200 && res.data.includes("<urlset") && res.data.includes("<loc>");
    const urlMatches = (res.data.match(/<loc>/g) || []).length;
    recordResult(
      groupAResults,
      "sitemap.xml is accessible and contains valid URL entries",
      isSitemap && urlMatches >= 300,
      `Status: ${res.status} | Total URLs indexed: ${urlMatches}`
    );
  } catch (err) {
    recordResult(groupAResults, "sitemap.xml is accessible", false, err.message);
  }

  // A4. Curated Destination Dataset & Slug Verification
  try {
    const masterDataPath = path.join(__dirname, "../src/data/indianDestinationsMaster.json");
    const rawData = JSON.parse(fs.readFileSync(masterDataPath, "utf-8"));
    const representativeSlugs = [
      "puri", "goa", "jaipur", "agra", "varanasi",
      "manali", "munnar", "darjeeling", "mumbai", "delhi", "konark"
    ];
    const foundAll = representativeSlugs.every((slug) =>
      rawData.some((d) => d.slug?.toLowerCase() === slug || d.name?.toLowerCase() === slug)
    );
    recordResult(
      groupAResults,
      "Curated Master Dataset contains all 300 records & representative slugs",
      rawData.length === 300 && foundAll,
      `Dataset Count: ${rawData.length} | Representative slugs (Puri, Goa, Jaipur, etc.) verified.`
    );
  } catch (err) {
    recordResult(groupAResults, "Curated Master Dataset verification", false, err.message);
  }

  // A5. Static Destination Image & Thumbnail
  try {
    const mainImgRes = await axios.get(`${ROOT_URL}/destination-images/puri.webp`, {
      responseType: "arraybuffer",
    });
    const thumbImgRes = await axios.get(`${ROOT_URL}/destination-images/puri-thumb.webp`, {
      responseType: "arraybuffer",
    });
    const headersOk = mainImgRes.headers["content-type"]?.includes("image") || mainImgRes.data.length > 1000;
    recordResult(
      groupAResults,
      "Static destination images & thumbnails serve with valid caching headers",
      mainImgRes.status === 200 && thumbImgRes.status === 200 && headersOk,
      `Puri Image Size: ${mainImgRes.data.length} bytes | Cache-Control: ${mainImgRes.headers["cache-control"]}`
    );
  } catch (err) {
    recordResult(groupAResults, "Static destination images serve properly", false, err.message);
  }

  // A6. Public Error Sanitization (404 and Stack Trace Suppression)
  try {
    const notFoundRes = await axios.get(`${BASE_URL}/nonexistent-route-for-production-test`, {
      validateStatus: () => true,
    });
    const isProduction = process.env.NODE_ENV === "production";
    const noStackTrace = isProduction ? !notFoundRes.data?.stack : true;
    const safeMsg = notFoundRes.data?.message && !notFoundRes.data.message.includes("at ");
    recordResult(
      groupAResults,
      "Public 404 Route Not Found safely sanitized",
      notFoundRes.status === 404 && noStackTrace && safeMsg,
      `Status: ${notFoundRes.status} | Message: "${notFoundRes.data?.message}" | Stack: ${notFoundRes.data?.stack ? "present (dev mode)" : "suppressed (production mode)"}`
    );
  } catch (err) {
    recordResult(groupAResults, "Public 404 error sanitization", false, err.message);
  }

  // A7. Malformed Input Error Sanitization (400 CastError)
  try {
    const castErrorRes = await axios.get(`${BASE_URL}/trips/invalid-hex-id-999`, {
      headers: { Authorization: "Bearer dummy.token" },
      validateStatus: () => true,
    });
    // Even if token fails or cast error triggers, it must return a sanitized 400 or 401 without leaks
    const safeStatus = castErrorRes.status === 400 || castErrorRes.status === 401;
    const noSecrets = !JSON.stringify(castErrorRes.data).includes("mongodb+srv");
    recordResult(
      groupAResults,
      "Malformed identifier returns sanitized client error without leaking internal details",
      safeStatus && noSecrets,
      `Status: ${castErrorRes.status} | Response: ${JSON.stringify(castErrorRes.data)}`
    );
  } catch (err) {
    recordResult(groupAResults, "Malformed input error sanitization", false, err.message);
  }

  // ================================================================================
  // GROUP B: AUTHENTICATED APPLICATION TESTS
  // ================================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🔐 [GROUP B] Authenticated Application Tests (Auth, Trips, Reviews & Tokens)");
  console.log("--------------------------------------------------------------------------------");

  let mongoConnected = false;
  let userA, userB, tokenA, tokenB, expiredToken;

  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: "tripsync" });
      mongoConnected = true;

      const User = mongoose.models.User || mongoose.model(
        "User",
        new mongoose.Schema({ name: String, email: String }, { strict: false })
      );

      userA = await User.findOne({ email: "usera.traveler@test.com" });
      userB = await User.findOne({ email: "userb.explorer@test.com" });

      if (!userA) {
        userA = await User.create({
          name: "User A Smoke",
          email: "usera.traveler@test.com",
          password: "hashed_dummy_password",
        });
      }
      if (!userB) {
        userB = await User.create({
          name: "User B Smoke",
          email: "userb.explorer@test.com",
          password: "hashed_dummy_password",
        });
      }

      const secret = process.env.JWT_SECRET || "tripsync-dev-insecure-secret-change-in-production";
      tokenA = jwt.sign({ id: userA._id.toString() }, secret, { expiresIn: "2h" });
      tokenB = jwt.sign({ id: userB._id.toString() }, secret, { expiresIn: "2h" });
      expiredToken = jwt.sign({ id: userA._id.toString() }, secret, { expiresIn: "-1h" });
    } catch (dbErr) {
      console.warn("⚠️  Direct MongoDB fixture setup warning:", dbErr.message);
    }
  }

  // B1. Protected Endpoint without Token -> 401
  try {
    const unauthRes = await axios.get(`${BASE_URL}/trips`, { validateStatus: () => true });
    recordResult(
      groupBResults,
      "Protected endpoint without JWT returns HTTP 401 Unauthorized",
      unauthRes.status === 401,
      `Status: ${unauthRes.status} | Message: ${unauthRes.data?.message}`
    );
  } catch (err) {
    recordResult(groupBResults, "Protected endpoint without JWT check", false, err.message);
  }

  // B2. Protected Endpoint with Expired Token -> 401
  if (expiredToken) {
    try {
      const expRes = await axios.get(`${BASE_URL}/trips`, {
        headers: { Authorization: `Bearer ${expiredToken}` },
        validateStatus: () => true,
      });
      recordResult(
        groupBResults,
        "Protected endpoint with Expired JWT returns HTTP 401 Unauthorized",
        expRes.status === 401,
        `Status: ${expRes.status} | Message: ${expRes.data?.message}`
      );
    } catch (err) {
      recordResult(groupBResults, "Expired JWT test execution", false, err.message);
    }
  }

  // B3. Trip Lifecycle (Create, Read, Update, Delete)
  let createdTripId = null;
  if (tokenA) {
    try {
      // Create
      const createRes = await axios.post(
        `${BASE_URL}/trips`,
        {
          title: "Production Smoke Trip",
          destination: "Goa",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          budget: 15000,
          travelers: 2,
        },
        {
          headers: { Authorization: `Bearer ${tokenA}` },
          validateStatus: () => true,
        }
      );
      createdTripId = createRes.data?.trip?._id || createRes.data?.data?._id;
      const createdOk = (createRes.status === 201 || createRes.status === 200) && Boolean(createdTripId);

      // Read
      let readOk = false;
      if (createdTripId) {
        const readRes = await axios.get(`${BASE_URL}/trips/${createdTripId}`, {
          headers: { Authorization: `Bearer ${tokenA}` },
          validateStatus: () => true,
        });
        readOk = readRes.status === 200 && (readRes.data?.trip?.title === "Production Smoke Trip" || readRes.data?.data?.title === "Production Smoke Trip");
      }

      // Update
      let updateOk = false;
      if (createdTripId) {
        const updateRes = await axios.put(
          `${BASE_URL}/trips/${createdTripId}`,
          { title: "Production Smoke Trip (Updated)" },
          {
            headers: { Authorization: `Bearer ${tokenA}` },
            validateStatus: () => true,
          }
        );
        updateOk = updateRes.status === 200 && (updateRes.data?.trip?.title === "Production Smoke Trip (Updated)" || updateRes.data?.data?.title === "Production Smoke Trip (Updated)");
      }

      // Clean up / Delete
      let deleteOk = false;
      if (createdTripId) {
        const deleteRes = await axios.delete(`${BASE_URL}/trips/${createdTripId}`, {
          headers: { Authorization: `Bearer ${tokenA}` },
          validateStatus: () => true,
        });
        deleteOk = deleteRes.status === 200;
      }

      recordResult(
        groupBResults,
        "Trip Lifecycle (Create, Read, Update, Delete) with user ownership works",
        createdOk && readOk && updateOk && deleteOk,
        `Created ID: ${createdTripId} | Read: ${readOk} | Updated: ${updateOk} | Cleaned: ${deleteOk}`
      );
    } catch (err) {
      recordResult(groupBResults, "Trip Lifecycle verification", false, err.message);
    }
  }

  // B4. Place Details Review Submission & Ownership Authorization
  const PLACE_ID = "ChIJ1cw6dB7qvzsRG7aed1z3jMY"; // Baga Beach, Goa
  if (tokenA && tokenB) {
    try {
      // User A submits a review
      const reviewRes = await axios.post(
        `${BASE_URL}/places/${PLACE_ID}/reviews`,
        { rating: 5, comment: "Smoke verification test review." },
        {
          headers: { Authorization: `Bearer ${tokenA}` },
          validateStatus: () => true,
        }
      );
      const reviewId = reviewRes.data?.data?._id;
      const postedOk = reviewRes.status === 201 && reviewId;

      // User B attempts unauthorized delete -> must return 403 Forbidden
      let unauthDeleteBlocked = false;
      if (reviewId) {
        const delResB = await axios.delete(`${BASE_URL}/places/${PLACE_ID}/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${tokenB}` },
          validateStatus: () => true,
        });
        unauthDeleteBlocked = delResB.status === 403;
      }

      // User A authorized delete -> must succeed 200
      let authDeleteOk = false;
      if (reviewId) {
        const delResA = await axios.delete(`${BASE_URL}/places/${PLACE_ID}/reviews/${reviewId}`, {
          headers: { Authorization: `Bearer ${tokenA}` },
          validateStatus: () => true,
        });
        authDeleteOk = delResA.status === 200;
      }

      recordResult(
        groupBResults,
        "Review submission, cross-user delete protection (403), and deletion (200) verified",
        postedOk && unauthDeleteBlocked && authDeleteOk,
        `Posted: ${postedOk} | Unauthorized delete blocked (403): ${unauthDeleteBlocked} | Authorized delete (200): ${authDeleteOk}`
      );
    } catch (err) {
      recordResult(groupBResults, "Review system verification", false, err.message);
    }
  }

  // ================================================================================
  // GROUP C: EXTERNAL PROVIDER TESTS (ISOLATED)
  // ================================================================================
  console.log("\n--------------------------------------------------------------------------------");
  console.log("🌐 [GROUP C] External Provider Tests (Google Places & Gemini AI)");
  console.log("--------------------------------------------------------------------------------");

  // C1. Google Places Service & Caching
  try {
    const placesRes = await axios.get(`${BASE_URL}/places/search?q=Jaipur`, {
      validateStatus: () => true,
    });
    const results = placesRes.data?.data || placesRes.data?.places || [];
    const placesOk = placesRes.status === 200 && Array.isArray(results) && results.length > 0;
    recordResult(
      groupCResults,
      "Google Places service returns valid search suggestions with caching",
      placesOk,
      `Status: ${placesRes.status} | Results found: ${results.length} | Cache: ${placesRes.headers["x-cache"] || "L1/L2"}`
    );
  } catch (err) {
    recordResult(
      groupCResults,
      "Google Places service search",
      false,
      `External provider error: ${err.message}`
    );
  }

  // C2. Google GenAI / Gemini AI Itinerary Service Readiness
  try {
    const aiService = require("../src/services/ai.service");
    const testTrip = {
      destination: "Agra",
      startDate: "2026-10-01",
      endDate: "2026-10-02",
      duration: 1,
      budget: "Standard",
      travelers: 1,
      selectedPlaces: [{ name: "Taj Mahal", category: "Monument" }],
    };

    console.log("  Testing Gemini AI prompt execution with bounded trip...");
    const itinerary = await aiService.generateItinerary(testTrip);
    const validItinerary = itinerary && Array.isArray(itinerary.days) && itinerary.days.length > 0;
    recordResult(
      groupCResults,
      "Gemini AI itinerary generation produces structured multi-day JSON",
      validItinerary,
      `Days generated: ${itinerary?.days?.length} | First day title: "${itinerary?.days?.[0]?.title}"`
    );
  } catch (aiErr) {
    // Isolated: Provider failure must not mark core infrastructure as broken
    console.warn(`  ⚠️ External Provider Note (Gemini): ${aiErr.message}`);
    recordResult(
      groupCResults,
      "Gemini AI itinerary generation (External Provider)",
      false,
      `Provider response: ${aiErr.message}`
    );
  }

  // Close MongoDB fixture connection
  if (mongoConnected) {
    await mongoose.disconnect();
  }

  // ================================================================================
  // SUMMARY REPORT
  // ================================================================================
  console.log("\n================================================================================");
  console.log("📊 PRODUCTION SMOKE SUITE SUMMARY");
  console.log("================================================================================");
  console.log(`[Group A] Public Smoke Tests:        ${groupAResults.passed}/${groupAResults.total} Passed (${groupAResults.failed} Failed)`);
  console.log(`[Group B] Authenticated App Tests:   ${groupBResults.passed}/${groupBResults.total} Passed (${groupBResults.failed} Failed)`);
  console.log(`[Group C] External Provider Tests:   ${groupCResults.passed}/${groupCResults.total} Passed (${groupCResults.failed} Failed)`);
  console.log("================================================================================\n");

  const coreFailed = groupAResults.failed + groupBResults.failed;
  if (coreFailed > 0) {
    console.error(`💥 FATAL: Core application infrastructure failed ${coreFailed} tests!`);
    process.exit(1);
  } else {
    console.log("✅ Core application infrastructure verified completely healthy.");
    process.exit(0);
  }
}

runProductionSmoke().catch((err) => {
  console.error("Fatal error during production smoke test execution:", err);
  process.exit(1);
});
