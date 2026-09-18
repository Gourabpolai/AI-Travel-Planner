const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { safeFetchWithTimeout } = require("../utils/apiResilience");

/**
 * Wikimedia Commons Image Importer & Aggressive Filter Engine
 * 
 * Implements strict multi-stage heuristic filtering:
 * - Reject non-raster images (SVGs, PDFs, GIFs, etc.)
 * - Reject maps, route maps, diagrams, satellite schemas
 * - Reject logos, flags, crests, emblems, stamps, icons
 * - Reject people, portraits, politicians, crowds, selfies
 * - Reject paintings, drawings, sketches, illustrations, AI art
 * - Reject screenshots, documents, posters
 * - Reject low resolution (< 1000px) or extreme tall aspect ratios (< 0.75)
 * - Score candidate relevance by title, landmark, description, and categories
 * - Convert to WebP (1600px max, 480px thumb) with full attribution preservation
 */

const USER_AGENT = "TripSync-BulkImageImporter/1.0 (https://tripsync.example.com; contact: tripsync273@gmail.com)";

// Negative Regex Blacklists
const MAP_REGEX = /\b(map|maps|karte|carte|locator|location map|route map|plan|schema|cartography|satellite|bathymetry|topographic|cadastral|blueprint|diagram|chart|graph|infographic|locator_map|relief_map|transit_map)\b/i;
const LOGO_REGEX = /\b(flag|flags|flagge|drapeau|logo|logos|emblem|crest|seal|coat of arms|wappen|blason|symbol|badge|icon|stamp|postage stamp|currency|coin|banknote|arms_of|insignia)\b/i;
const PORTRAIT_REGEX = /\b(portrait|portraits|selfie|person|people|politician|minister|governor|chief minister|prime minister|swami|guru|monk|priest|crowd|protest|rally|officials|group photo|headshot|deputy|mp|mla|actor|actress|singer|author|dr\.|prof\.|portrait_of|man|woman|boy|girl|bathers|tourists|visitors|family|child|children|pilgrims)\b/i;
const ART_REGEX = /\b(painting|paintings|drawing|drawings|sketch|illustration|watercolor|oil on canvas|engraving|lithograph|clipart|vector|digital art|ai-generated|midjourney|dall-e|render|cgi|artwork|fresco|miniature painting)\b/i;
const DOC_REGEX = /\b(screenshot|screengrab|document|doc|pdf|poster|advertisement|banner|flyer|pamphlet|newspaper|headline|ticket|certificate|infobox|webpage)\b/i;
const FAUNA_REGEX = /\b(tahr|nilgiri tahr|deer|snake|bird|spider|insect|butterfly|caterpillar|fauna|lizard|langur|baboon|beetle)\b/i;

const SCENIC_REGEX = /\b(temple|beach|fort|palace|lake|waterfall|falls|hills|valley|mountains|monument|ghats|coast|shore|monastery|architecture|sanctuary|national park|island|sea|ruins|stupa|tea gardens|backwaters)\b/i;

// Clean HTML tags from metadata (e.g. <a href="...">Author</a> -> Author)
const cleanHtml = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

/**
 * Search Wikimedia Commons for candidates matching a specific query
 */
const searchWikimedia = async (query, limit = 8) => {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json`;

  try {
    const response = await safeFetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
        },
      },
      6000
    );

    if (!response.ok) {
      console.warn(`Wikimedia query failed with HTTP ${response.status} for: ${query}`);
      return [];
    }

    const data = await response.json();
    if (!data?.query?.pages) return [];

    const candidates = [];
    for (const pageId in data.query.pages) {
      const page = data.query.pages[pageId];
      if (!page.imageinfo || page.imageinfo.length === 0) continue;

      const info = page.imageinfo[0];
      const meta = info.extmetadata || {};

      candidates.push({
        pageId: page.pageid,
        title: page.title || "",
        url: info.url,
        descriptionUrl: info.descriptionurl || "",
        mime: info.mime || "",
        width: Number(info.width) || 0,
        height: Number(info.height) || 0,
        size: Number(info.size) || 0,
        description: cleanHtml(meta.ImageDescription?.value || meta.ObjectName?.value || ""),
        categories: cleanHtml(meta.Categories?.value || ""),
        artist: cleanHtml(meta.Artist?.value || meta.Credit?.value || "Wikimedia Contributor"),
        license: cleanHtml(meta.LicenseShortName?.value || meta.License?.value || "CC BY-SA / Public Domain"),
        licenseUrl: meta.LicenseUrl?.value || "https://creativecommons.org/licenses/",
        attribution: cleanHtml(meta.Attribution?.value || ""),
      });
    }

    return candidates;
  } catch (err) {
    console.warn(`Wikimedia search error for "${query}":`, err.message);
    return [];
  }
};

/**
 * Evaluate and score a candidate image for a destination
 */
const evaluateCandidate = (candidate, destination, usedFileIds = new Set(), rejectionStats = {}) => {
  const { title, mime, width, height, description, categories, artist, pageId, url } = candidate;
  const stats = rejectionStats || {};

  // Check duplicates
  if (usedFileIds.has(pageId) || usedFileIds.has(title) || usedFileIds.has(url)) {
    if (stats.duplicatesRejected !== undefined) stats.duplicatesRejected++;
    return { valid: false, reason: "duplicate_image", score: 0 };
  }

  // 1. MIME Validation
  const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validMimes.includes(mime.toLowerCase())) {
    if (stats.logosRejected !== undefined) stats.logosRejected++;
    return { valid: false, reason: "unsupported_mime", score: 0 };
  }

  // 2. Resolution Check
  if (width < 1000 || height < 600) {
    if (stats.lowResRejected !== undefined) stats.lowResRejected++;
    return { valid: false, reason: "low_resolution", score: 0 };
  }

  // 3. Aspect Ratio Check (reject extreme tall portraits)
  const ratio = width / height;
  if (ratio < 0.75) {
    if (stats.peopleRejected !== undefined) stats.peopleRejected++;
    return { valid: false, reason: "extreme_tall_portrait", score: 0 };
  }

  // Combine text metadata for inspection
  const combinedText = `${title} ${description} ${categories} ${artist}`.toLowerCase();

  // 4. Map & Cartography Filter
  if (MAP_REGEX.test(combinedText)) {
    if (stats.mapsRejected !== undefined) stats.mapsRejected++;
    return { valid: false, reason: "map_or_chart", score: 0 };
  }

  // 5. Logo & Flag Filter
  if (LOGO_REGEX.test(combinedText)) {
    if (stats.logosRejected !== undefined) stats.logosRejected++;
    return { valid: false, reason: "logo_flag_or_emblem", score: 0 };
  }

  // 6. People & Portrait Filter
  const titleLower = title.toLowerCase();
  if (PORTRAIT_REGEX.test(titleLower)) {
    if (stats.peopleRejected !== undefined) stats.peopleRejected++;
    return { valid: false, reason: "people_or_crowd_in_title", score: 0 };
  }
  if (PORTRAIT_REGEX.test(combinedText)) {
    const isMajorMonument = titleLower.includes("temple") || titleLower.includes("fort") || titleLower.includes("palace") || titleLower.includes("monument") || titleLower.includes("stupa");
    if (!isMajorMonument) {
      if (stats.peopleRejected !== undefined) stats.peopleRejected++;
      return { valid: false, reason: "portrait_or_person", score: 0 };
    }
  }

  // 6b. Fauna filter for non-wildlife destinations (prefer landscape / tea gardens / architecture)
  const isWildlifeDest = (destination.category || "").toLowerCase().includes("wildlife") || (destination.category || "").toLowerCase().includes("national park");
  if (!isWildlifeDest && FAUNA_REGEX.test(titleLower)) {
    rejectionStats.irrelevantRejected++;
    return { valid: false, reason: "fauna_not_scenery", score: 0 };
  }

  // 7. Art & Painting Filter
  if (ART_REGEX.test(combinedText)) {
    if (stats.artworkRejected !== undefined) stats.artworkRejected++;
    else if (stats.irrelevantRejected !== undefined) stats.irrelevantRejected++;
    return { valid: false, reason: "painting_or_artwork", score: 0 };
  }

  // 8. Documents & Screenshots Filter
  if (DOC_REGEX.test(combinedText)) {
    rejectionStats.irrelevantRejected++;
    return { valid: false, reason: "document_or_screenshot", score: 0 };
  }

  // Positive Scoring System
  let score = 0;
  const normDestName = destination.name.toLowerCase();
  const normState = destination.state.toLowerCase();

  // Destination name in title (+35) or description (+20)
  if (titleLower.includes(normDestName)) {
    score += 35;
  } else if (combinedText.includes(normDestName)) {
    score += 20;
  }

  // Primary landmark matches
  let matchedLandmark = false;
  for (const landmark of destination.primaryLandmarks || []) {
    const normLandmark = landmark.toLowerCase();
    if (titleLower.includes(normLandmark)) {
      score += 35;
      matchedLandmark = true;
      break;
    } else if (combinedText.includes(normLandmark)) {
      score += 20;
      matchedLandmark = true;
      break;
    }
  }

  // State match in title (+10) or text (+5)
  if (titleLower.includes(normState)) {
    score += 10;
  } else if (combinedText.includes(normState)) {
    score += 5;
  }

  // Scenic destination keyword in title (+15) or text (+10)
  if (SCENIC_REGEX.test(titleLower)) {
    score += 15;
  } else if (SCENIC_REGEX.test(combinedText)) {
    score += 10;
  }

  // Landscape aspect ratio bonus (ideal 16:9 or 4:3)
  if (ratio >= 1.25 && ratio <= 1.9) {
    score += 10;
  } else if (ratio >= 1.0 && ratio <= 2.2) {
    score += 5;
  }

  // High resolution bonus
  if (width >= 1600) {
    score += 10;
  } else if (width >= 1200) {
    score += 5;
  }

  // 7. Statue / Bust Penalty (unless destination/landmarks explicitly seek a statue)
  const isStatueExpected =
    normDestName.includes("statue") ||
    normDestName.includes("bust") ||
    normDestName.includes("monument") ||
    (destination.primaryLandmarks || []).some(
      (l) => l.toLowerCase().includes("statue") || l.toLowerCase().includes("bust") || l.toLowerCase().includes("monument")
    );

  if (!isStatueExpected && /\b(statue|bust|plaque|sculpture|tombstone|cenotaph)\b/i.test(titleLower)) {
    score -= 40;
  }

  // Relevancy Threshold: Must be at least 50 points
  const MIN_SCORE_THRESHOLD = 50;
  if (score < MIN_SCORE_THRESHOLD) {
    if (stats.irrelevantRejected !== undefined) stats.irrelevantRejected++;
    return { valid: false, reason: "insufficient_relevance_score", score };
  }

  return { valid: true, reason: "passed", score };
};

/**
 * Download selected image from Wikimedia and optimize using Sharp
 */
const downloadAndOptimizeImage = async (candidate, destination, outputDir, confidenceScore = null) => {
  const slug = destination.slug;
  const mainFileName = `${slug}.webp`;
  const thumbFileName = `${slug}-thumb.webp`;
  const metaFileName = `${slug}.json`;

  const mainFilePath = path.join(outputDir, mainFileName);
  const thumbFilePath = path.join(outputDir, thumbFileName);
  const metaFilePath = path.join(outputDir, metaFileName);

  // Download raw image
  const response = await safeFetchWithTimeout(
    candidate.url,
    {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
      },
    },
    15000
  );

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate raster image format via Sharp (failOn: 'none' tolerates minor extraneous marker bytes)
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();

  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error(`Downloaded file is not a valid raster photograph (format: ${metadata.format})`);
  }

  // Optimize Main Image (WebP, max width 1600, quality 82)
  await sharp(buffer, { failOn: "none" })
    .resize({
      width: 1600,
      height: 1000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(mainFilePath);

  // Optimize Thumbnail (WebP, max width 480, quality 78)
  await sharp(buffer, { failOn: "none" })
    .resize({
      width: 480,
      height: 320,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 })
    .toFile(thumbFilePath);

  // Get final dimensions of main image
  const finalMeta = await sharp(mainFilePath, { failOn: "none" }).metadata();

  // Create attribution text
  const cleanAuthor = candidate.artist || "Wikimedia Commons Contributor";
  const attributionText = `Photo by ${cleanAuthor}, licensed under ${candidate.license}. Source: ${candidate.descriptionUrl}`;

  const imageMeta = {
    destination: destination.name,
    slug: destination.slug,
    state: destination.state,
    url: `/destination-images/${mainFileName}`,
    thumbnailUrl: `/destination-images/${thumbFileName}`,
    source: "Wikimedia Commons",
    sourceUrl: candidate.descriptionUrl,
    directUrl: candidate.url,
    fileTitle: candidate.title,
    author: cleanAuthor,
    license: candidate.license,
    licenseUrl: candidate.licenseUrl,
    attribution: attributionText,
    confidenceScore: confidenceScore !== null ? confidenceScore : (candidate.score || 0),
    imageWidth: finalMeta.width || metadata.width,
    imageHeight: finalMeta.height || metadata.height,
    fileSizeKB: Math.round(fs.statSync(mainFilePath).size / 1024),
    importedAt: new Date().toISOString(),
  };

  // Write companion metadata JSON
  fs.writeFileSync(metaFilePath, JSON.stringify(imageMeta, null, 2), "utf8");

  return imageMeta;
};

module.exports = {
  searchWikimedia,
  evaluateCandidate,
  downloadAndOptimizeImage,
};
