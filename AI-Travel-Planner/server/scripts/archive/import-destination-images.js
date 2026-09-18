require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
require("node:dns").setDefaultResultOrder("ipv4first");

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Destination = require("../src/models/destination.model");
const destinationsMaster = require("../src/data/indianDestinationsMaster.json");
const {
  searchWikimedia,
  evaluateCandidate,
  downloadAndOptimizeImage,
} = require("../src/services/wikimediaImageImporter.service");

// Directories
const outputDir = path.resolve(__dirname, "../../client/public/destination-images");
const reviewFilePath = path.resolve(__dirname, "../../destination-image-review.json");
const clientMapPath = path.resolve(__dirname, "../../client/src/data/destinationImages.ts");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Parse command-line args
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
const force = args.includes("--force");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runImporter() {
  console.log("\n=======================================================");
  console.log("   TripSync Bulk Real-Image Importer (Wikimedia)");
  console.log("=======================================================");
  console.log(`Master destinations available: ${destinationsMaster.length}`);
  console.log(`Processing limit: ${limit ? limit : "ALL (up to 300)"}`);
  console.log(`Force re-download: ${force}`);
  console.log(`Image storage directory: ${outputDir}\n`);

  // Connect to MongoDB
  let mongoConnected = false;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tripsync";
  try {
    await mongoose.connect(mongoUri);
    mongoConnected = true;
    const isAtlas = mongoUri.includes(".mongodb.net") || mongoUri.startsWith("mongodb+srv://");
    const dbName = mongoose.connection.name || "tripsync";
    console.log(`✅ Connected to MongoDB "${dbName}" (${isAtlas ? "MongoDB Atlas" : "Local MongoDB"})`);
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed. Running in file-only mode:", err.message);
  }

  const destinationsToProcess = limit
    ? destinationsMaster.slice(0, limit)
    : destinationsMaster;

  const usedFileIds = new Set();
  const successfulImages = [];
  const manualReviewList = [];
  const noImageFoundList = [];
  const reviewEntries = [];

  const rejectionStats = {
    mapsRejected: 0,
    peopleRejected: 0,
    logosRejected: 0,
    artworkRejected: 0,
    lowResRejected: 0,
    irrelevantRejected: 0,
    duplicatesRejected: 0,
  };

  let processedCount = 0;
  let skippedCount = 0;
  let newlyImportedCount = 0;

  for (const dest of destinationsToProcess) {
    processedCount++;
    const slug = dest.slug;
    const mainFilePath = path.join(outputDir, `${slug}.webp`);
    const metaFilePath = path.join(outputDir, `${slug}.json`);

    console.log(`\n[${processedCount}/${destinationsToProcess.length}] 📍 ${dest.name} (${dest.state})`);

    // Check if image already exists (Idempotency)
    if (!force && fs.existsSync(mainFilePath) && fs.existsSync(metaFilePath)) {
      try {
        const existingMeta = JSON.parse(fs.readFileSync(metaFilePath, "utf8"));
        console.log(`  ⚡ Already imported: ${existingMeta.url} (${existingMeta.imageWidth}x${existingMeta.imageHeight}) - Skipping.`);
        successfulImages.push(existingMeta);
        skippedCount++;

        if (existingMeta.fileTitle) usedFileIds.add(existingMeta.fileTitle);
        if (existingMeta.directUrl) usedFileIds.add(existingMeta.directUrl);

        reviewEntries.push({
          destination: dest.name,
          slug: dest.slug,
          state: dest.state,
          selectedFileTitle: existingMeta.fileTitle || "",
          imagePath: existingMeta.url,
          thumbnailPath: existingMeta.thumbnailUrl,
          sourceUrl: existingMeta.sourceUrl,
          author: existingMeta.author,
          license: existingMeta.license,
          confidenceScore: existingMeta.confidenceScore || 85,
          status: "skipped_existing",
          rejectionReason: null,
        });

        // Ensure in MongoDB
        if (mongoConnected) {
          await Destination.findOneAndUpdate(
            { slug: dest.slug },
            {
              name: dest.name,
              slug: dest.slug,
              state: dest.state,
              country: "India",
              category: dest.category,
              primaryLandmarks: dest.primaryLandmarks,
              searchQueries: dest.searchQueries,
              image: existingMeta,
              status: "verified",
            },
            { upsert: true }
          );
        }

        continue;
      } catch (readErr) {
        console.warn(`  ⚠️ Metadata corrupted for ${dest.name}. Re-downloading...`);
      }
    }

    // Search across multiple specific queries
    const candidateMap = new Map();
    const evaluatedCandidates = [];

    for (const query of dest.searchQueries) {
      // Small pause between queries to respect Wikimedia API rate limits
      await sleep(200);

      const found = await searchWikimedia(query, 8);
      for (const item of found) {
        if (!candidateMap.has(item.pageId)) {
          candidateMap.set(item.pageId, item);
        }
      }
    }

    console.log(`  🔍 Found ${candidateMap.size} unique candidate images across ${dest.searchQueries.length} queries.`);

    // Evaluate each candidate
    for (const candidate of candidateMap.values()) {
      const evaluation = evaluateCandidate(candidate, dest, usedFileIds, rejectionStats);
      evaluatedCandidates.push({
        candidate,
        evaluation,
      });
    }

    // Filter valid candidates and sort by highest score
    const validCandidates = evaluatedCandidates
      .filter((c) => c.evaluation.valid)
      .sort((a, b) => b.evaluation.score - a.evaluation.score);

    let candidateSaved = false;

    if (validCandidates.length > 0) {
      for (let i = 0; i < Math.min(validCandidates.length, 4); i++) {
        const candidateChoice = validCandidates[i];
        console.log(`  🏆 Evaluating candidate #${i + 1}: "${candidateChoice.candidate.title}" (Score: ${candidateChoice.evaluation.score})`);

        try {
          // Download and optimize with Sharp
          const imageMeta = await downloadAndOptimizeImage(candidateChoice.candidate, dest, outputDir, candidateChoice.evaluation.score);
          usedFileIds.add(candidateChoice.candidate.pageId);
          usedFileIds.add(candidateChoice.candidate.title);
          usedFileIds.add(candidateChoice.candidate.url);

          console.log(`  ✅ Saved: ${imageMeta.url} [${imageMeta.imageWidth}x${imageMeta.imageHeight} | ${imageMeta.fileSizeKB} KB]`);
          console.log(`     License: ${imageMeta.license} | Author: ${imageMeta.author}`);
          successfulImages.push(imageMeta);
          candidateSaved = true;
          newlyImportedCount++;

          reviewEntries.push({
            destination: dest.name,
            slug: dest.slug,
            state: dest.state,
            selectedFileTitle: imageMeta.fileTitle,
            imagePath: imageMeta.url,
            thumbnailPath: imageMeta.thumbnailUrl,
            sourceUrl: imageMeta.sourceUrl,
            author: imageMeta.author,
            license: imageMeta.license,
            confidenceScore: candidateChoice.evaluation.score,
            status: "imported",
            rejectionReason: null,
          });

          // Save to MongoDB
          if (mongoConnected) {
            await Destination.findOneAndUpdate(
              { slug: dest.slug },
              {
                name: dest.name,
                slug: dest.slug,
                state: dest.state,
                country: "India",
                category: dest.category,
                primaryLandmarks: dest.primaryLandmarks,
                searchQueries: dest.searchQueries,
                image: imageMeta,
                status: "verified",
              },
              { upsert: true }
            );
          }
          break; // Successfully saved
        } catch (dlErr) {
          console.warn(`  ⚠️ Candidate #${i + 1} (${candidateChoice.candidate.title}) failed: ${dlErr.message}. Trying next candidate...`);
        }
      }
    }

    if (!candidateSaved) {
      console.warn(`  ⚠️ No candidate exceeded confidence threshold (50) or succeeded download for "${dest.name}". Flagged for manual review.`);
      const bestCandidate = evaluatedCandidates.sort((a, b) => b.evaluation.score - a.evaluation.score)[0];
      const isNoImage = candidateMap.size === 0;
      const reviewStatus = isNoImage ? "no_suitable_image" : "needs_manual_review";
      const rejectionReason = isNoImage
        ? "No candidates returned by Wikimedia for search queries"
        : validCandidates.length === 0
        ? "No candidate exceeded confidence threshold (50)"
        : "All candidates failed download/processing";

      if (isNoImage) {
        noImageFoundList.push(dest.name);
      } else {
        manualReviewList.push(dest.name);
      }

      reviewEntries.push({
        destination: dest.name,
        slug: dest.slug,
        state: dest.state,
        selectedFileTitle: bestCandidate?.candidate?.title || null,
        imagePath: null,
        thumbnailPath: null,
        sourceUrl: bestCandidate?.candidate?.descriptionUrl || null,
        author: bestCandidate?.candidate?.artist || null,
        license: bestCandidate?.candidate?.license || null,
        confidenceScore: bestCandidate?.evaluation?.score || 0,
        status: reviewStatus,
        rejectionReason: rejectionReason,
        searchQueries: dest.searchQueries,
        bestCandidateTitle: bestCandidate?.candidate?.title || "None",
        candidatesEvaluated: evaluatedCandidates.length,
      });

      if (mongoConnected) {
        await Destination.findOneAndUpdate(
          { slug: dest.slug },
          {
            name: dest.name,
            slug: dest.slug,
            state: dest.state,
            country: "India",
            category: dest.category,
            primaryLandmarks: dest.primaryLandmarks,
            searchQueries: dest.searchQueries,
            status: "needs_manual_review",
          },
          { upsert: true }
        );
      }
    }
  }

  // Save complete review report file with all statuses
  fs.writeFileSync(
    reviewFilePath,
    JSON.stringify(reviewEntries, null, 2),
    "utf8"
  );
  console.log(`\n📝 Saved destination image review file (${reviewEntries.length} entries): ${reviewFilePath}`);

  // Generate static TypeScript map for frontend instant access
  const imageMap = {};
  for (const img of successfulImages) {
    imageMap[img.destination] = img.url;
    // Also map by slug for easy lookups
    imageMap[img.slug] = img.url;
  }

  const tsContent = `/**
 * Auto-generated by TripSync Wikimedia Bulk Image Importer
 * Total curated photographs: ${successfulImages.length}
 * Generated: ${new Date().toISOString()}
 */

export const DESTINATION_IMAGE_MAP: Record<string, string> = ${JSON.stringify(imageMap, null, 2)};

export const getDestinationImage = (nameOrSlug: string, fallback = '/placeholder-travel.jpg'): string => {
  if (!nameOrSlug) return fallback;
  const direct = DESTINATION_IMAGE_MAP[nameOrSlug];
  if (direct) return direct;
  
  const normalized = nameOrSlug.toLowerCase().trim().replace(/\\s+/g, '-');
  return DESTINATION_IMAGE_MAP[normalized] || fallback;
};
`;

  fs.writeFileSync(clientMapPath, tsContent, "utf8");
  console.log(`🎨 Generated client image map: ${clientMapPath}`);

  // Print Final Summary Report
  console.log("\n========================================");
  console.log("   TripSync Destination Image Import");
  console.log("========================================");
  console.log(`Total destinations in master:    ${destinationsToProcess.length}`);
  console.log(`Already existed (skipped):      ${skippedCount}`);
  console.log(`Newly imported this run:        ${newlyImportedCount}`);
  console.log(`Total successfully ready:       ${successfulImages.length}`);
  console.log(`Needs manual review:            ${manualReviewList.length}`);
  console.log(`No suitable image found:        ${noImageFoundList.length}\n`);

  console.log("Rejection Statistics:");
  console.log(`  Maps rejected:                 ${rejectionStats.mapsRejected}`);
  console.log(`  People/portrait rejected:      ${rejectionStats.peopleRejected}`);
  console.log(`  Logos/flags/emblems rejected:  ${rejectionStats.logosRejected}`);
  console.log(`  Artwork/drawings rejected:     ${rejectionStats.artworkRejected}`);
  console.log(`  Low-resolution rejected:       ${rejectionStats.lowResRejected}`);
  console.log(`  Irrelevant/low-score rejected: ${rejectionStats.irrelevantRejected}`);
  console.log(`  Duplicates rejected:           ${rejectionStats.duplicatesRejected}`);
  console.log("========================================\n");

  if (mongoConnected) {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected cleanly.");
  }

  return {
    total: destinationsToProcess.length,
    success: successfulImages.length,
    manualReview: manualReviewList.length,
    rejectionStats,
  };
}

runImporter()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error during import:", err);
    process.exit(1);
  });
