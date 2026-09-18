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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const REFINED_QUERIES = {
  "shantiniketan": ["Santiniketan", "Visva-Bharati Santiniketan", "Upasana Griha Santiniketan", "Kala Bhavana Santiniketan"],
  "shekhawati": ["Shekhawati haveli", "Mandawa haveli", "Nawalgarh haveli", "Shekhawati Rajasthan"],
  "bir-billing": ["Billing paragliding", "Bir Billing", "Chokling Monastery Bir", "Bir Tibetan Colony"],
  "ranikhet": ["Ranikhet", "Ranikhet Uttarakhand", "Chaubatia Ranikhet", "Ranikhet golf course"],
  "mukteshwar": ["Mukteshwar", "Chauli Ki Jali", "Mukteshwar Dham", "Mukteshwar temple"],
  "ooty": ["Ooty Botanical Gardens", "Ooty Lake", "Doddabetta Peak", "Ooty hill station", "Nilgiri Mountain Railway Ooty"],
  "dhanushkodi": ["Dhanushkodi beach", "Dhanushkodi ruins", "Dhanushkodi church", "Arichal Munai", "Dhanushkodi Tamil Nadu"],
  "horsley-hills": ["Horsley Hills", "Horsley Hills Andhra", "Horsleykonda"],
  "lonavala": ["Lonavala", "Tiger Point Lonavala", "Rajmachi Fort", "Karla Caves Lonavala", "Bhushi Dam Lonavala"],
  "alibaug": ["Kolaba Fort Alibaug", "Alibaug beach", "Varsoli Beach Alibaug", "Alibag Maharashtra"],
  "matheran": ["Matheran", "Matheran hill station", "Charlotte Lake Matheran", "Panorama Point Matheran", "Louisa Point Matheran"],
  "murud-janjira": ["Murud Janjira Fort", "Janjira Fort", "Murud Janjira sea fort", "Murud Fort"],
  "ganpatipule": ["Ganpatipule", "Ganpatipule beach", "Ganpatipule temple", "Ganpatipule Maharashtra"],
  "dawki": ["Umngot River", "Dawki river", "Dawki bridge Meghalaya", "Dawki boat", "Shnongpdeng Dawki"],
  "pelling": ["Sky Walk at Pelling", "Rabdentse Ruins, Pelling", "Kanchenjunga view from Pelling", "Pelling Sikkim"],
  "dzukou-valley": ["Dzukou Valley", "Dzukou Valley Nagaland", "Dzukou lily", "Dzukou trek"],
  "aizawl": ["Aizawl", "Aizawl city", "Durtlang Hills", "Solomon's Temple Aizawl"],
  "neil-island": ["Neil Island", "Bharatpur Beach Neil", "Laxmanpur Beach", "Natural Bridge Neil Island", "Shaheed Dweep Neil"],
  "agatti-island": ["Agatti Island", "Agatti Island lagoon", "Agatti Lakshadweep"],
  "bangaram-island": ["Bangaram Island", "Bangaram Atoll", "Bangaram Lakshadweep", "Bangaram lagoon"],
  "kavaratti": ["Kavaratti", "Kavaratti Island", "Kavaratti lagoon", "Kavaratti Lakshadweep"],
  "kanatal": ["Surkanda Devi Temple", "Kanatal Uttarakhand", "Kaudia forest Kanatal"],
  "harsil": ["Harsil", "Harsil valley", "Harsil Uttarakhand", "Bhagirathi river Harsil"],
  "shoja": ["Jalori Pass", "Serolsar Lake", "Shoja Himachal", "Raghupur Fort Shoja"],
  "nako": ["Nako Lake", "Nako Monastery", "Nako village Spiti", "Nako Himachal"],
  "tabo": ["Tabo Monastery", "Tabo village Spiti", "Tabo Spiti Valley"],
  "sissu": ["Sissu waterfall", "Sissu Lahaul", "Sissu Himachal", "Chandra river Sissu"],
  "baralacha-la": ["Baralacha La", "Suraj Tal", "Baralacha pass", "Suraj Tal lake"],
  "turtuk": ["Turtuk", "Turtuk village", "Shyok River Turtuk", "Turtuk Ladakh"],
  "doodhpathri": ["Doodhpathri", "Doodhpathri Kashmir", "Shaliganga river Doodhpathri"],
  "sanapur-lake": ["Sanapur Lake", "Sanapur Lake Hampi", "Sanapur reservoir"],
  "maravanthe": ["Maravanthe Beach", "Maravanthe", "Maravanthe coast Karnataka"],
  "kudremukh": ["Kudremukh National Park", "Kudremukh Peak", "Kudremukh hills", "Kudremukh Karnataka"],
  "yana-rocks": ["Yana Rocks", "Yana caves Karnataka", "Bhairaveshwara Shikhara Yana", "Yana monolith"],
  "pitchavaram": ["Pichavaram mangrove", "Pichavaram forest", "Pichavaram boat", "Pitchavaram Tamil Nadu"],
  "ponmudi": ["Ponmudi Hill Station 1", "Ponmudi hill top", "Ponmudi hill station Kerala", "Ponmudi mist"],
  "poovar-island": ["Poovar estuary", "Poovar beach", "Poovar Island Kerala", "Poovar backwaters"],
  "silent-valley": ["Silent valley landscape", "Silent Valley National Park landscape", "Shola Forest Silent valley NP", "Kunthi River Silent Valley"],
  "talakona": ["Talakona waterfalls", "Talakona water falls", "Talakona waterfall", "Talakona Andhra"],
  "lambasingi": ["Lambasingi", "Lambasingi hill station", "Kothapalli waterfalls Lambasingi", "Lambasingi Andhra"],
  "papi-hills": ["Papikondalu", "Papi Hills Godavari", "Papikondalu hills boat", "Papikondalu Andhra"],
  "ambaji": ["Ambaji Temple", "Gabbar Hill Ambaji", "Ambaji Gujarat temple", "Arasuri Ambaji"],
  "somnath-beach": ["Somnath beach", "Somnath seashore", "Somnath temple sea", "Somnath coast"],
  "bhimbetka": ["Bhimbetka rock shelters", "Bhimbetka caves", "Bhimbetka Madhya Pradesh", "Auditorium cave Bhimbetka"]
};

async function runMissingImporter() {
  console.log("\n=======================================================");
  console.log("   TripSync Targeted Importer — 44 Missing Destinations");
  console.log("=======================================================\n");

  // Connect to MongoDB
  let mongoConnected = false;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tripsync";
  try {
    await mongoose.connect(mongoUri);
    mongoConnected = true;
    const isAtlas = mongoUri.includes(".mongodb.net") || mongoUri.startsWith("mongodb+srv://");
    const dbName = mongoose.connection.name || "tripsync";
    console.log(`✅ Connected to MongoDB "${dbName}" (${isAtlas ? "MongoDB Atlas" : "Local MongoDB"})\n`);
  } catch (err) {
    console.warn("⚠️ MongoDB connection failed. Running in file-only mode:", err.message);
  }

  // Load review entries
  let reviewEntries = [];
  if (fs.existsSync(reviewFilePath)) {
    reviewEntries = JSON.parse(fs.readFileSync(reviewFilePath, "utf8"));
  }

  // Identify the target 44 destinations
  const targetSlugs = new Set(
    reviewEntries
      .filter((r) => r.status === "needs_manual_review" || r.status === "no_suitable_image")
      .map((r) => r.slug)
  );

  console.log(`Found ${targetSlugs.size} destinations needing curation.\n`);

  // Build existing usedFileIds so we never duplicate any existing image
  const usedFileIds = new Set();
  for (const r of reviewEntries) {
    if (r.selectedFileTitle) usedFileIds.add(r.selectedFileTitle);
    if (r.imagePath) usedFileIds.add(r.imagePath);
  }

  let newlyImportedCount = 0;
  let remainingReviewCount = 0;
  let remainingNoImageCount = 0;

  const destinationsToProcess = destinationsMaster.filter((d) => targetSlugs.has(d.slug));

  for (let i = 0; i < destinationsToProcess.length; i++) {
    const dest = destinationsToProcess[i];
    const queries = REFINED_QUERIES[dest.slug] || dest.searchQueries;
    console.log(`[${i + 1}/${destinationsToProcess.length}] 🔍 Evaluating ${dest.name} (${dest.state})...`);

    const candidateMap = new Map();
    for (const q of queries) {
      await sleep(150);
      const found = await searchWikimedia(q, 6);
      for (const item of found) {
        if (!candidateMap.has(item.pageId)) {
          candidateMap.set(item.pageId, item);
        }
      }
    }

    const rejectionStats = {};
    const evaluated = [];
    for (const candidate of candidateMap.values()) {
      const evaluation = evaluateCandidate(candidate, dest, usedFileIds, rejectionStats);
      evaluated.push({ candidate, evaluation });
    }

    // Sort valid candidates by score
    const valid = evaluated
      .filter((x) => x.evaluation.valid && x.evaluation.score >= 50)
      .sort((a, b) => b.evaluation.score - a.evaluation.score);

    let saved = false;

    if (valid.length > 0) {
      for (let v = 0; v < Math.min(valid.length, 3); v++) {
        const choice = valid[v];
        try {
          console.log(`  📥 Downloading Candidate #${v + 1}: "${choice.candidate.title}" (Score: ${choice.evaluation.score})...`);
          const imageMeta = await downloadAndOptimizeImage(choice.candidate, dest, outputDir, choice.evaluation.score);
          usedFileIds.add(choice.candidate.pageId);
          usedFileIds.add(choice.candidate.title);
          usedFileIds.add(choice.candidate.url);

          console.log(`  ✅ SAVED: ${imageMeta.url} [${imageMeta.imageWidth}x${imageMeta.imageHeight} | ${imageMeta.fileSizeKB} KB]`);
          console.log(`     License: ${imageMeta.license} | Author: ${imageMeta.author}`);
          newlyImportedCount++;
          saved = true;

          // Update review entry in reviewEntries
          const revIdx = reviewEntries.findIndex((r) => r.slug === dest.slug);
          const updatedEntry = {
            destination: dest.name,
            slug: dest.slug,
            state: dest.state,
            selectedFileTitle: imageMeta.fileTitle,
            imagePath: imageMeta.url,
            thumbnailPath: imageMeta.thumbnailUrl,
            sourceUrl: imageMeta.sourceUrl,
            author: imageMeta.author,
            license: imageMeta.license,
            confidenceScore: choice.evaluation.score,
            status: "imported",
            rejectionReason: null,
          };

          if (revIdx >= 0) {
            reviewEntries[revIdx] = updatedEntry;
          } else {
            reviewEntries.push(updatedEntry);
          }

          // Update in MongoDB
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
                searchQueries: queries,
                image: imageMeta,
                status: "verified",
              },
              { upsert: true }
            );
          }

          break; // Saved successfully
        } catch (dlErr) {
          console.warn(`  ⚠️ Candidate #${v + 1} download error: ${dlErr.message}`);
        }
      }
    }

    if (!saved) {
      const highest = evaluated.sort((a, b) => b.evaluation.score - a.evaluation.score)[0];
      const isNoCandidate = candidateMap.size === 0;
      const status = isNoCandidate ? "no_suitable_image" : "needs_manual_review";
      const reason = isNoCandidate
        ? "No candidates returned by Wikimedia for search queries"
        : valid.length === 0
        ? "No candidate exceeded confidence threshold (50)"
        : "All candidates failed download/processing";

      if (isNoCandidate) remainingNoImageCount++;
      else remainingReviewCount++;

      console.log(`  ❌ NOT IMPORTED (${status}): ${dest.name} -> Best: "${highest?.candidate?.title || 'None'}" (Score: ${highest?.evaluation?.score || 0})`);

      const revIdx = reviewEntries.findIndex((r) => r.slug === dest.slug);
      const reviewObj = {
        destination: dest.name,
        slug: dest.slug,
        state: dest.state,
        selectedFileTitle: highest?.candidate?.title || null,
        imagePath: null,
        thumbnailPath: null,
        sourceUrl: highest?.candidate?.descriptionUrl || null,
        author: highest?.candidate?.artist || null,
        license: highest?.candidate?.license || null,
        confidenceScore: highest?.evaluation?.score || 0,
        status: status,
        rejectionReason: reason,
        searchQueries: queries,
        bestCandidateTitle: highest?.candidate?.title || "None",
        candidatesEvaluated: evaluated.length,
      };

      if (revIdx >= 0) {
        reviewEntries[revIdx] = reviewObj;
      } else {
        reviewEntries.push(reviewObj);
      }

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
            searchQueries: queries,
            status: "needs_manual_review",
          },
          { upsert: true }
        );
      }
    }
  }

  // Save updated review entries
  fs.writeFileSync(reviewFilePath, JSON.stringify(reviewEntries, null, 2), "utf8");
  console.log(`\n📝 Updated review report: ${reviewFilePath}`);

  // Re-generate client destinationImages.ts with all available images
  const allImages = fs.readdirSync(outputDir).filter((f) => f.endsWith(".json"));
  const imageMap = {};
  for (const jf of allImages) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(outputDir, jf), "utf8"));
      imageMap[meta.destination] = meta.url;
      imageMap[meta.slug] = meta.url;
    } catch (e) {}
  }

  const clientMapContent = `/**
 * Auto-generated by TripSync Wikimedia Bulk Image Importer
 * Total curated photographs: ${Object.keys(imageMap).length / 2}
 * Generated: ${new Date().toISOString()}
 */

export const DESTINATION_IMAGE_MAP: Record<string, string> = ${JSON.stringify(imageMap, null, 2)};

export const getDestinationImage = (nameOrSlug: string, fallback = '/placeholder-travel.svg'): string => {
  if (!nameOrSlug) return fallback;
  const direct = DESTINATION_IMAGE_MAP[nameOrSlug];
  if (direct) return direct;
  
  const normalized = nameOrSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return DESTINATION_IMAGE_MAP[normalized] || fallback;
};

export const getDestinationThumbnail = (nameOrSlug: string, fallback = '/placeholder-travel.svg'): string => {
  const full = getDestinationImage(nameOrSlug, fallback);
  if (full && full.startsWith('/destination-images/') && full.endsWith('.webp') && !full.endsWith('-thumb.webp')) {
    return full.replace(/\\.webp$/, '-thumb.webp');
  }
  return full;
};
`;

  fs.writeFileSync(clientMapPath, clientMapContent, "utf8");
  console.log(`🎨 Updated frontend image map: ${clientMapPath}`);

  console.log("\n=======================================================");
  console.log("   IMPORT RESULTS SUMMARY");
  console.log("=======================================================");
  console.log(`Total 44 Destinations Processed: ${destinationsToProcess.length}`);
  console.log(`Newly Successfully Imported:     ${newlyImportedCount}`);
  console.log(`Remaining Needs Manual Review:   ${remainingReviewCount}`);
  console.log(`Remaining No Suitable Image:     ${remainingNoImageCount}`);
  console.log(`Total Curated Photos in System:  ${Object.keys(imageMap).length / 2} / 300\n`);

  if (mongoConnected) {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected cleanly.");
  }
}

runMissingImporter()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
