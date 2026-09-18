require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Destination = require("../src/models/destination.model");

// Mask connection URI to avoid exposing secrets in console/logs
function maskUri(uri) {
  if (!uri) return "undefined";
  return uri.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
}

async function runSync() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  console.log("\n=======================================================");
  console.log("   TripSync Destination Sync: Local MongoDB -> Atlas");
  console.log("=======================================================");
  console.log(`Execution Mode: ${isDryRun ? "DRY RUN (No writes performed)" : "LIVE SYNC (Idempotent upsert)"}`);

  const targetUri = process.env.MONGODB_URI || (
    process.env.MONGO_URI && (process.env.MONGO_URI.startsWith("mongodb+srv://") || process.env.MONGO_URI.includes(".mongodb.net"))
      ? process.env.MONGO_URI
      : null
  );

  const sourceUri = process.env.SOURCE_MONGO_URI || (
    process.env.MONGO_URI && !process.env.MONGO_URI.startsWith("mongodb+srv://") && !process.env.MONGO_URI.includes(".mongodb.net")
      ? process.env.MONGO_URI
      : "mongodb://127.0.0.1:27017/tripsync"
  );

  if (!targetUri) {
    console.log("\n⚠️  MONGODB_URI environment variable is not defined in server/.env");
    console.log("To sync to MongoDB Atlas, add your Atlas connection string to server/.env:");
    console.log("MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tripsync?retryWrites=true&w=majority\n");
    console.log("Current status: Destination database remains operational on Local MongoDB.");
    console.log("No changes made.\n");
    return;
  }

  const isAtlasTarget = targetUri.includes(".mongodb.net") || targetUri.startsWith("mongodb+srv://");
  console.log(`Source Database: ${maskUri(sourceUri)} (Local MongoDB)`);
  console.log(`Target Database: ${maskUri(targetUri)} (${isAtlasTarget ? "MongoDB Atlas" : "Custom Mongo"})`);

  // Step 1: Load Source Destination Documents
  let sourceDocs = [];
  let sourceConn = null;

  try {
    console.log("\nConnecting to Source Database...");
    sourceConn = await mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    const SourceDestModel = sourceConn.model("Destination", Destination.schema);
    sourceDocs = await SourceDestModel.find({}).lean();
    console.log(`✅ Retrieved ${sourceDocs.length} destination documents from source database.`);
  } catch (err) {
    console.warn(`⚠️ Could not connect to source MongoDB (${maskUri(sourceUri)}): ${err.message}`);
    console.log("Attempting fallback load from local master dataset + JSON image metadata...");
  } finally {
    if (sourceConn) {
      await sourceConn.close();
    }
  }

  // Fallback / verification check against local files
  if (sourceDocs.length < 300) {
    console.log("Checking local dataset files (indianDestinationsMaster.json + destination-images/*.json)...");
    const masterPath = path.resolve(__dirname, "../src/data/indianDestinationsMaster.json");
    const imgDir = path.resolve(__dirname, "../../client/public/destination-images");

    if (fs.existsSync(masterPath)) {
      const masterList = JSON.parse(fs.readFileSync(masterPath, "utf-8"));
      const docMap = new Map();
      for (const d of sourceDocs) {
        docMap.set(d.slug, d);
      }

      for (const item of masterList) {
        if (!docMap.has(item.slug)) {
          const jsonFile = path.join(imgDir, `${item.slug}.json`);
          let imgMeta = null;
          if (fs.existsSync(jsonFile)) {
            try {
              imgMeta = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
            } catch (e) {}
          }

          docMap.set(item.slug, {
            name: item.name,
            slug: item.slug,
            state: item.state,
            country: item.country || "India",
            category: item.category || "Travel Destination",
            primaryLandmarks: item.primaryLandmarks || [],
            searchQueries: item.searchQueries || [],
            image: imgMeta
              ? {
                  url: imgMeta.url,
                  thumbnailUrl: imgMeta.thumbnailUrl,
                  source: imgMeta.source || "Wikimedia Commons",
                  sourceUrl: imgMeta.sourceUrl,
                  fileTitle: imgMeta.fileTitle,
                  author: imgMeta.author || "Unknown",
                  license: imgMeta.license || "Public Domain / CC",
                  licenseUrl: imgMeta.licenseUrl,
                  attribution: imgMeta.attribution || "",
                  imageWidth: imgMeta.imageWidth,
                  imageHeight: imgMeta.imageHeight,
                  confidenceScore: imgMeta.confidenceScore,
                }
              : null,
            status: "verified",
          });
        }
      }
      sourceDocs = Array.from(docMap.values());
      console.log(`✅ Loaded complete dataset of ${sourceDocs.length} destinations.`);
    }
  }

  if (sourceDocs.length === 0) {
    console.error("❌ No destination records found to sync! Aborting.");
    process.exit(1);
  }

  // Step 2: Connect to Target Database (Atlas)
  console.log("\nConnecting to Target Database (Atlas)...");
  let targetConn = null;
  try {
    targetConn = await mongoose.createConnection(targetUri, {
      dbName: process.env.DB_NAME || "tripsync",
      serverSelectionTimeoutMS: 10000,
    }).asPromise();
    console.log(`✅ Successfully connected to Target: "${targetConn.name}" (${isAtlasTarget ? "MongoDB Atlas" : "MongoDB"})`);
  } catch (err) {
    const safeErr = err.message.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@");
    console.error(`❌ Failed to connect to Target Database: ${safeErr}`);
    if (safeErr.includes("SSL alert number 80") || safeErr.includes("whitelist") || safeErr.includes("ReplicaSetNoPrimary")) {
      console.log("\n💡 Atlas Troubleshooting:");
      console.log("   1. Check your Atlas Network Access (IP Access List): make sure your current IP address (or 0.0.0.0/0) is active.");
      console.log("   2. Verify in MongoDB Atlas that the cluster is ACTIVE (not paused).");
      console.log("   3. Confirm your database user credentials and permissions (readWrite on tripsync).");
    }
    process.exit(1);
  }

  const TargetDestModel = targetConn.model("Destination", Destination.schema);

  // Check existing documents in Target
  const existingCount = await TargetDestModel.countDocuments();
  console.log(`Current destination documents in Target before sync: ${existingCount}`);

  // Prepare bulk operations
  const bulkOps = sourceDocs.map((dest) => {
    const updatePayload = {
      name: dest.name,
      slug: dest.slug,
      state: dest.state,
      country: dest.country || "India",
      category: dest.category || "Travel Destination",
      primaryLandmarks: dest.primaryLandmarks || [],
      searchQueries: dest.searchQueries || [],
      status: dest.status || "verified",
      updatedAt: new Date(),
    };

    if (dest.image) {
      updatePayload.image = {
        url: dest.image.url,
        thumbnailUrl: dest.image.thumbnailUrl,
        source: dest.image.source || "Wikimedia Commons",
        sourceUrl: dest.image.sourceUrl,
        fileTitle: dest.image.fileTitle,
        author: dest.image.author || "Unknown",
        license: dest.image.license || "Public Domain / CC",
        licenseUrl: dest.image.licenseUrl,
        attribution: dest.image.attribution || "",
        imageWidth: dest.image.imageWidth,
        imageHeight: dest.image.imageHeight,
        confidenceScore: dest.image.confidenceScore,
      };
    }

    const setOnInsert = {
      createdAt: dest.createdAt || new Date(),
    };
    if (dest._id) {
      setOnInsert._id = dest._id;
    }

    return {
      updateOne: {
        filter: { slug: dest.slug },
        update: {
          $set: updatePayload,
          $setOnInsert: setOnInsert,
        },
        upsert: true,
      },
    };
  });

  if (isDryRun) {
    console.log(`\n[DRY RUN] Would execute ${bulkOps.length} idempotent upsert operations on Target.`);
    console.log(`[DRY RUN] Existing target documents: ${existingCount}`);
    console.log(`[DRY RUN] Documents to upsert:       ${bulkOps.length}`);
    console.log("[DRY RUN] No data was written to Target Database.");
    await targetConn.close();
    return;
  }

  // Execute Bulk Write
  console.log(`\nExecuting ${bulkOps.length} idempotent upsert operations...`);
  const bulkResult = await TargetDestModel.bulkWrite(bulkOps, { ordered: false });
  console.log("✅ Bulk write complete!");
  console.log(`   - Matched:   ${bulkResult.matchedCount}`);
  console.log(`   - Modified:  ${bulkResult.modifiedCount}`);
  console.log(`   - Upserted:  ${bulkResult.upsertedCount}`);

  // Step 3: Verification on Target Collection
  console.log("\n--- Target Collection Verification ---");
  const finalCount = await TargetDestModel.countDocuments();
  const withImageCount = await TargetDestModel.countDocuments({ "image.url": { $ne: null } });
  const withThumbCount = await TargetDestModel.countDocuments({ "image.thumbnailUrl": { $ne: null } });
  const distinctSlugs = await TargetDestModel.distinct("slug");

  console.log(`Total Destinations on Target:   ${finalCount}`);
  console.log(`Destinations with Main Image:   ${withImageCount}`);
  console.log(`Destinations with Thumbnail:    ${withThumbCount}`);
  console.log(`Distinct Slugs on Target:       ${distinctSlugs.length}`);
  console.log(`Duplicate Slugs:                ${finalCount - distinctSlugs.length}`);

  // Check sample document
  const sample = await TargetDestModel.findOne({ slug: "ooty" }).lean();
  if (sample) {
    console.log(`Sample Document (${sample.name}):`, {
      slug: sample.slug,
      url: sample.image?.url,
      thumbnailUrl: sample.image?.thumbnailUrl,
      author: sample.image?.author,
      license: sample.image?.license,
      confidenceScore: sample.image?.confidenceScore,
    });
  }

  await targetConn.close();
  console.log("\nSync process finished cleanly.");
}

runSync().catch((err) => {
  const safeErr = err.message ? err.message.replace(/\/\/[^:]+:[^@]+@/g, "//***:***@") : err;
  console.error("Sync failed with error:", safeErr);
  process.exit(1);
});
