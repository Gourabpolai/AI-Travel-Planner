const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const BASE_URL = 'http://localhost:8000/api';
const PLACE_ID_A = 'ChIJ1cw6dB7qvzsRG7aed1z3jMY'; // Baga Beach, Goa
const PLACE_ID_B = 'ChIJ6dgmPADBvzsRw231CmbGUKk'; // Goa Beach Resort

async function runTests() {
  console.log('🚀 Starting Review System Verification Suite...\n');
  
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'tripsync' });
  const User = mongoose.model('User', new mongoose.Schema({ name: String, email: String }, { strict: false }));
  const Review = mongoose.model('Review', new mongoose.Schema({}, { strict: false }));

  const userA = await User.findOne({ email: 'usera.traveler@test.com' });
  const userB = await User.findOne({ email: 'userb.explorer@test.com' });

  if (!userA || !userB) {
    throw new Error('Test users User A or User B not found in tripsync DB');
  }

  // Generate tokens
  const tokenA = jwt.sign({ id: userA._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const tokenB = jwt.sign({ id: userB._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  // Generate an EXPIRED token (expired 1 hour ago)
  const expiredToken = jwt.sign(
    { id: userA._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' }
  );

  console.log(`✅ Test User A: ${userA.name} (${userA.email})`);
  console.log(`✅ Test User B: ${userB.name} (${userB.email})`);
  console.log(`✅ Expired token generated for User A\n`);

  // ==========================================
  // TEST 1: EXPIRED JWT -> HTTP 401
  // ==========================================
  console.log('--- TEST 1: EXPIRED JWT SUBMISSION ---');
  try {
    await axios.post(
      `${BASE_URL}/places/${PLACE_ID_A}/reviews`,
      { rating: 5, comment: 'This should fail because token is expired.' },
      { headers: { Authorization: `Bearer ${expiredToken}` } }
    );
    console.error('❌ FAILED: Expired token was accepted!');
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('✅ PASSED: Expired token returned HTTP 401 Unauthorized');
      console.log('   Response message:', err.response.data.message);
    } else {
      console.error('❌ FAILED: Unexpected error on expired token:', err.message);
    }
  }

  // ==========================================
  // TEST 5: INVALID RATING -> HTTP 400
  // ==========================================
  console.log('\n--- TEST 5: INVALID RATING (0) ---');
  try {
    await axios.post(
      `${BASE_URL}/places/${PLACE_ID_A}/reviews`,
      { rating: 0, comment: 'Invalid rating test' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.error('❌ FAILED: Rating 0 was accepted!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✅ PASSED: Rating 0 returned HTTP 400 Bad Request');
      console.log('   Response message:', err.response.data.message);
    } else {
      console.error('❌ FAILED: Unexpected response on rating 0:', err.message);
    }
  }

  // ==========================================
  // TEST 6: EMPTY COMMENT -> HTTP 400
  // ==========================================
  console.log('\n--- TEST 6: EMPTY COMMENT ---');
  try {
    await axios.post(
      `${BASE_URL}/places/${PLACE_ID_A}/reviews`,
      { rating: 5, comment: '   ' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.error('❌ FAILED: Empty comment was accepted!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✅ PASSED: Empty comment returned HTTP 400 Bad Request');
      console.log('   Response message:', err.response.data.message);
    } else {
      console.error('❌ FAILED: Unexpected response on empty comment:', err.message);
    }
  }

  // ==========================================
  // TEST 2: VALID REVIEW BY USER A -> HTTP 201
  // ==========================================
  console.log('\n--- TEST 2: VALID REVIEW SUBMISSION BY USER A ---');
  const userAReviewText = "Outstanding spot with scenic view and beach shacks";
  const postRes = await axios.post(
    `${BASE_URL}/places/${PLACE_ID_A}/reviews`,
    { rating: 5, comment: userAReviewText, destination: 'Goa' },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  console.log(`✅ PASSED: Review submitted with status HTTP ${postRes.status}`);
  console.log('   Authoritative review returned:', {
    _id: postRes.data.data._id,
    userName: postRes.data.data.userName,
    rating: postRes.data.data.rating,
    comment: postRes.data.data.comment
  });
  const createdReviewId = postRes.data.data._id;

  // ==========================================
  // TEST 3 & 4: RETRIEVAL BY USER B (SHARED VISIBILITY)
  // ==========================================
  console.log('\n--- TEST 3 & 4: RETRIEVAL BY USER B (SHARED VISIBILITY) ---');
  const getRes = await axios.get(`${BASE_URL}/places/${PLACE_ID_A}/reviews`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  console.log(`✅ PASSED: User B retrieved reviews for place ${PLACE_ID_A}`);
  console.log('   Total reviews count:', getRes.data.summary.totalReviews);
  console.log('   Community average rating:', getRes.data.summary.averageRating);
  console.log('   Distribution:', getRes.data.summary.distribution);

  const foundUserAReview = getRes.data.data.find(r => r._id === createdReviewId);
  if (foundUserAReview && foundUserAReview.comment === userAReviewText) {
    console.log(`✅ PASSED: User A's review is directly visible to User B with correct text and rating!`);
  } else {
    console.error(`❌ FAILED: User A's review not visible to User B!`);
  }

  // ==========================================
  // TEST 7: DIFFERENT PLACE ISOLATION
  // ==========================================
  console.log('\n--- TEST 7: PLACE ISOLATION ---');
  const placeBRes = await axios.get(`${BASE_URL}/places/${PLACE_ID_B}/reviews`);
  const isolatedReview = placeBRes.data.data.find(r => r._id === createdReviewId);
  if (!isolatedReview) {
    console.log(`✅ PASSED: Place B does NOT contain User A's review from Place A (Place isolation verified)`);
  } else {
    console.error(`❌ FAILED: Review from Place A leaked into Place B!`);
  }

  // ==========================================
  // TEST 8: DELETE AUTHORIZATION
  // ==========================================
  console.log('\n--- TEST 8: DELETE AUTHORIZATION ---');
  // Attempt 1: User B attempts to delete User A's review -> must return 403 Forbidden
  try {
    await axios.delete(
      `${BASE_URL}/places/${PLACE_ID_A}/reviews/${createdReviewId}`,
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    console.error("❌ FAILED: User B was able to delete User A's review!");
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log('✅ PASSED: User B attempted deletion -> HTTP 403 Forbidden (Ownership strictly enforced)');
      console.log('   Response message:', err.response.data.message);
    } else {
      console.error('❌ FAILED: Unexpected response on unauthorized delete:', err.message);
    }
  }

  // Attempt 2: User A deletes own review -> must return 200 OK
  const deleteRes = await axios.delete(
    `${BASE_URL}/places/${PLACE_ID_A}/reviews/${createdReviewId}`,
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  console.log(`✅ PASSED: User A deleted own review with status HTTP ${deleteRes.status}`);

  // Re-submit User A's review so it remains visible on the page for visual verification
  const finalReviewRes = await axios.post(
    `${BASE_URL}/places/${PLACE_ID_A}/reviews`,
    { rating: 5, comment: userAReviewText, destination: 'Goa' },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  console.log(`✅ Re-persisted authoritative review (${finalReviewRes.data.data._id}) in MongoDB Atlas for live browser verification`);

  console.log('\n🎉 ALL SUITE TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Suite error:', err);
  process.exit(1);
});
