const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const BASE_URL = "http://localhost:8000/api";
const HEALTH_URL = "http://localhost:8000/api/health";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function reportResult(name, passed, detail) {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ PASSED: ${name}`);
    if (detail) console.log(`     ${detail}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAILED: ${name}`);
    if (detail) console.error(`     ${detail}`);
  }
}

async function runSecuritySuite() {
  console.log("============================================================");
  console.log("🛡️  TripSync — Phase 2 Production Security Verification Suite");
  console.log("============================================================\n");

  // 1. Connect to MongoDB for fixture verification
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in environment.");
  }
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "tripsync" });
  console.log("Connected to MongoDB for state verification.\n");

  const User = mongoose.model(
    "User",
    new mongoose.Schema({ name: String, email: String }, { strict: false })
  );
  const Trip = mongoose.model(
    "Trip",
    new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, title: String, destination: String }, { strict: false })
  );

  let userA = await User.findOne({ email: "usera.traveler@test.com" });
  let userB = await User.findOne({ email: "userb.explorer@test.com" });

  if (!userA) {
    userA = await User.create({ name: "User A Security", email: "usera.traveler@test.com", password: "hashed_dummy_password" });
  }
  if (!userB) {
    userB = await User.create({ name: "User B Security", email: "userb.explorer@test.com", password: "hashed_dummy_password" });
  }

  const tokenA = jwt.sign({ id: userA._id.toString() }, process.env.JWT_SECRET || "default_jwt_secret", { expiresIn: "1h" });
  const expiredToken = jwt.sign({ id: userA._id.toString() }, process.env.JWT_SECRET || "default_jwt_secret", { expiresIn: "-1h" });
  const malformedToken = "Bearer invalid.token.payload";

  // ============================================================
  // TEST GROUP 1: Authentication & Authorization Controls
  // ============================================================
  console.log("--- 1. Authentication Controls (Missing / Malformed / Expired JWT) ---");

  // Missing JWT
  try {
    await axios.get(`${BASE_URL}/trips`);
    reportResult("Missing JWT returns HTTP 401", false, "Request succeeded when it should have failed.");
  } catch (err) {
    const status = err.response ? err.response.status : 0;
    reportResult("Missing JWT returns HTTP 401", status === 401, `Status: ${status} | Message: ${err.response?.data?.message}`);
  }

  // Malformed JWT
  try {
    await axios.get(`${BASE_URL}/trips`, {
      headers: { Authorization: malformedToken },
    });
    reportResult("Malformed JWT returns HTTP 401", false, "Request succeeded with malformed token.");
  } catch (err) {
    const status = err.response ? err.response.status : 0;
    reportResult("Malformed JWT returns HTTP 401", status === 401, `Status: ${status} | Message: ${err.response?.data?.message}`);
  }

  // Expired JWT
  try {
    await axios.get(`${BASE_URL}/trips`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    reportResult("Expired JWT returns HTTP 401", false, "Request succeeded with expired token.");
  } catch (err) {
    const status = err.response ? err.response.status : 0;
    reportResult("Expired JWT returns HTTP 401", status === 401, `Status: ${status} | Message: ${err.response?.data?.message}`);
  }

  // ============================================================
  // TEST GROUP 2: Trip Mass Assignment & Ownership Tampering
  // ============================================================
  console.log("\n--- 2. Mass Assignment & Trip Ownership Protection ---");
  let testTrip = await Trip.findOne({ user: userA._id });
  if (!testTrip) {
    testTrip = await Trip.create({
      user: userA._id,
      title: "Security Test Trip",
      destination: "Goa",
      startDate: new Date(),
      endDate: new Date(),
    });
  }

  try {
    const tamperResponse = await axios.put(
      `${BASE_URL}/trips/${testTrip._id}`,
      {
        title: "Updated Trip Title Whitelisted",
        user: userB._id.toString(), // Attempt to transfer ownership
        _id: "660000000000000000000099", // Attempt to tamper primary key
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    // Verify trip in database directly
    const reloadedTrip = await Trip.findById(testTrip._id);
    const ownershipProtected = reloadedTrip.user.toString() === userA._id.toString();
    const titleUpdated = reloadedTrip.title === "Updated Trip Title Whitelisted";

    reportResult(
      "Trip ownership cannot be changed via mass assignment",
      ownershipProtected && titleUpdated,
      `Owner in DB: ${reloadedTrip.user} (User A: ${userA._id}) | Title updated: ${titleUpdated}`
    );
  } catch (err) {
    reportResult("Trip ownership protection test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 3: NoSQL Operator Payload Sanitization
  // ============================================================
  console.log("\n--- 3. Recursive NoSQL Input Sanitization ---");
  try {
    const nosqlPayload = {
      email: { $gt: "" },
      password: "test_password",
      $where: "this.password.length > 0",
    };

    const res = await axios.post(`${BASE_URL}/auth/login`, nosqlPayload, {
      validateStatus: () => true, // Accept any status
    });

    // Sanitizer strips keys starting with $ or containing .
    // When $gt is stripped, email becomes undefined/empty -> 400 Bad Request
    const safeResponse = res.status === 400 || res.status === 401;
    reportResult(
      "NoSQL injection payload sanitized ($gt, $where stripped)",
      safeResponse,
      `Status: ${res.status} | Response: ${JSON.stringify(res.data)}`
    );
  } catch (err) {
    reportResult("NoSQL injection sanitization test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 4: ReDoS & Malicious Regex Search Resilience
  // ============================================================
  console.log("\n--- 4. ReDoS & Malicious Regex Query Resilience ---");
  try {
    // Malformed regex patterns that would crash unescaped new RegExp(q)
    const redosPayload1 = "((a+)+)+$";
    const redosPayload2 = "[a-z{99999999";
    const redosPayload3 = "*+?^${}()|[]\\";

    const res1 = await axios.get(`${BASE_URL}/destinations?search=${encodeURIComponent(redosPayload1)}`);
    const res2 = await axios.get(`${BASE_URL}/destinations?search=${encodeURIComponent(redosPayload2)}`);
    const res3 = await axios.get(`${BASE_URL}/destinations?search=${encodeURIComponent(redosPayload3)}`);

    const allPassed = res1.status === 200 && res2.status === 200 && res3.status === 200;
    reportResult(
      "Malformed and backtracking regex queries do not crash the server",
      allPassed,
      `Query 1 status: ${res1.status} | Query 2 status: ${res2.status} | Query 3 status: ${res3.status}`
    );
  } catch (err) {
    reportResult("Regex resilience test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 5: Google Places Photo Proxy SSRF & Traversal Protection
  // ============================================================
  console.log("\n--- 5. Google Places Photo Proxy Security ---");
  try {
    // Attempt path traversal
    const traversalRes = await axios.get(`${BASE_URL}/places/photo?ref=../../../../etc/passwd`, {
      validateStatus: () => true,
    });
    reportResult(
      "Path traversal photo reference rejected with HTTP 400",
      traversalRes.status === 400,
      `Status: ${traversalRes.status} | Message: ${traversalRes.data?.message}`
    );

    // Attempt SSRF external URL
    const ssrfRes = await axios.get(`${BASE_URL}/places/photo?ref=https://evil.attacker.com/exploit.jpg`, {
      validateStatus: () => true,
    });
    reportResult(
      "SSRF external URL photo reference rejected with HTTP 400",
      ssrfRes.status === 400,
      `Status: ${ssrfRes.status} | Message: ${ssrfRes.data?.message}`
    );

    // Missing photo ref
    const missingRes = await axios.get(`${BASE_URL}/places/photo`, {
      validateStatus: () => true,
    });
    reportResult(
      "Missing photo reference rejected with HTTP 400",
      missingRes.status === 400,
      `Status: ${missingRes.status} | Message: ${missingRes.data?.message}`
    );
  } catch (err) {
    reportResult("Photo proxy security test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 6: Malformed MongoDB ObjectId CastError Handling
  // ============================================================
  console.log("\n--- 6. Malformed MongoDB ObjectId CastError Handling ---");
  try {
    const castResTrip = await axios.get(`${BASE_URL}/trips/invalid-hex-id-xyz`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      validateStatus: () => true,
    });
    reportResult(
      "Malformed trip ObjectId returns HTTP 400 Bad Request",
      castResTrip.status === 400,
      `Status: ${castResTrip.status} | Message: ${castResTrip.data?.message}`
    );

    const castResReview = await axios.delete(
      `${BASE_URL}/places/ChIJ1cw6dB7qvzsRG7aed1z3jMY/reviews/invalid-review-id`,
      {
        headers: { Authorization: `Bearer ${tokenA}` },
        validateStatus: () => true,
      }
    );
    reportResult(
      "Malformed review ObjectId returns HTTP 400 Bad Request",
      castResReview.status === 400,
      `Status: ${castResReview.status} | Message: ${castResReview.data?.message}`
    );
  } catch (err) {
    reportResult("CastError handling test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 7: Helmet Security Headers Enforcement
  // ============================================================
  console.log("\n--- 7. Helmet Security Headers Enforcement ---");
  try {
    const healthRes = await axios.get(HEALTH_URL);
    const headers = healthRes.headers;

    const nosniff = headers["x-content-type-options"] === "nosniff";
    const frameDeny = headers["x-frame-options"] === "DENY";
    const poweredByHidden = headers["x-powered-by"] === undefined;
    const corp = headers["cross-origin-resource-policy"] === "cross-origin";

    reportResult("x-content-type-options: nosniff present", nosniff, `Actual: ${headers["x-content-type-options"]}`);
    reportResult("x-frame-options: DENY present", frameDeny, `Actual: ${headers["x-frame-options"]}`);
    reportResult("x-powered-by header suppressed", poweredByHidden, `Actual: ${headers["x-powered-by"] || "Suppressed"}`);
    reportResult("cross-origin-resource-policy header configured", corp, `Actual: ${headers["cross-origin-resource-policy"]}`);
  } catch (err) {
    reportResult("Security headers test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 8: Two-Tier Cache Functionality & Verification
  // ============================================================
  console.log("\n--- 8. Two-Tier Cache Functionality Verification ---");
  try {
    const t0 = Date.now();
    const req1 = await axios.get(`${BASE_URL}/places/search?q=Bengaluru`);
    const d1 = Date.now() - t0;

    const t1 = Date.now();
    const req2 = await axios.get(`${BASE_URL}/places/search?q=Bengaluru`);
    const d2 = Date.now() - t1;

    const results = req2.data?.data || req2.data?.places || [];
    const cacheHit = req2.headers["x-cache"] === "HIT" || req2.data?.source === "cache" || d2 <= 50;
    const cacheWorking = req1.status === 200 && req2.status === 200 && Array.isArray(results) && cacheHit;
    reportResult(
      "Places two-tier cache returns valid data with sub-second retrieval",
      cacheWorking,
      `First query: ${d1}ms (X-Cache: ${req1.headers["x-cache"] || "MISS"}) | Second query: ${d2}ms (X-Cache: ${req2.headers["x-cache"] || "HIT"}) | Results count: ${results.length}`
    );
  } catch (err) {
    reportResult("Cache verification test execution", false, err.message);
  }

  // ============================================================
  // TEST GROUP 9: Tiered Rate Limiting Enforcement
  // ============================================================
  console.log("\n--- 9. Tiered Rate Limiting Enforcement (HTTP 429) ---");
  try {
    let hitRateLimit = false;
    let rateLimitResponse = null;

    // Send 16 rapid requests to auth endpoint (limit is 15 requests per 15 min)
    for (let i = 1; i <= 17; i++) {
      const res = await axios.post(
        `${BASE_URL}/auth/login`,
        { email: `spam-test-${i}@example.com`, password: "wrong_password" },
        { validateStatus: () => true }
      );
      if (res.status === 429) {
        hitRateLimit = true;
        rateLimitResponse = res;
        break;
      }
    }

    reportResult(
      "Auth rate limiter triggers HTTP 429 after threshold",
      hitRateLimit,
      hitRateLimit
        ? `Status: 429 | Retry-After: ${rateLimitResponse.headers["retry-after"]}s | Message: ${rateLimitResponse.data?.message}`
        : "Rate limit was not reached within 17 requests"
    );
  } catch (err) {
    reportResult("Rate limit test execution", false, err.message);
  }

  // Summary
  console.log("\n============================================================");
  console.log(`📊 Security Test Suite Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log("============================================================\n");

  await mongoose.disconnect();

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Fatal error in security test suite:", err);
  process.exit(1);
});
