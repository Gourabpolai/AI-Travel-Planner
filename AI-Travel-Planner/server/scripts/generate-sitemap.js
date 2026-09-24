/**
 * TripSync — Phase 3 Production XML Sitemap Generator
 *
 * Generates a validated XML sitemap for search engines covering:
 * - 1 Homepage (/)
 * - 300 Curated Indian Destination Guides (/destination/:slug)
 * Total: 301 verified URLs with image sitemap extensions.
 *
 * Protects private workspaces (dashboard, trips, profile, APIs) from search indexation.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://tripsync.app').replace(/\/$/, '');
const MASTER_DATA_PATH = path.join(__dirname, '../src/data/indianDestinationsMaster.json');
const IMAGES_DIR = path.join(__dirname, '../../client/public/destination-images');
const SITEMAP_OUTPUT_PATH = path.join(__dirname, '../../client/public/sitemap.xml');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap() {
  console.log('============================================================');
  console.log('🗺️  TripSync — Production XML Sitemap Generator');
  console.log('============================================================\n');
  console.log(`Base URL: ${SITE_URL}`);

  // 1. Load authoritative dataset
  if (!fs.existsSync(MASTER_DATA_PATH)) {
    throw new Error(`Master destinations file not found at: ${MASTER_DATA_PATH}`);
  }

  const destinations = JSON.parse(fs.readFileSync(MASTER_DATA_PATH, 'utf-8'));
  console.log(`Loaded ${destinations.length} destination records.`);

  if (destinations.length !== 300) {
    throw new Error(`Expected exactly 300 destinations, found: ${destinations.length}`);
  }

  // 2. Validate unique slugs
  const slugSet = new Set();
  const duplicateSlugs = [];

  for (const dest of destinations) {
    if (!dest.slug) {
      throw new Error(`Destination missing slug: ${dest.name}`);
    }
    const cleanSlug = dest.slug.trim().toLowerCase();
    if (slugSet.has(cleanSlug)) {
      duplicateSlugs.push(cleanSlug);
    }
    slugSet.add(cleanSlug);
  }

  if (duplicateSlugs.length > 0) {
    throw new Error(`Duplicate slugs found: ${duplicateSlugs.join(', ')}`);
  }
  console.log(`Verified ${slugSet.size} unique destination slugs.`);

  // 3. Validate image assets
  let missingImages = 0;
  for (const dest of destinations) {
    const expectedImgPath = path.join(IMAGES_DIR, `${dest.slug}.webp`);
    if (!fs.existsSync(expectedImgPath)) {
      console.warn(`⚠️ Warning: Missing image asset for slug: ${dest.slug}`);
      missingImages++;
    }
  }

  if (missingImages > 0) {
    throw new Error(`Found ${missingImages} missing image files in public/destination-images`);
  }
  console.log(`Verified all 300 destination WebP images exist in public storage.`);

  // 4. Build XML Sitemap
  const today = new Date().toISOString().split('T')[0];
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // Entry 1: Homepage
  xml += '  <!-- Homepage -->\n';
  xml += '  <url>\n';
  xml += `    <loc>${SITE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Entries 2-301: 300 Curated Indian Destinations
  xml += '  <!-- Curated Indian Destination Guides -->\n';
  let destinationUrlCount = 0;

  for (const dest of destinations) {
    const destUrl = `${SITE_URL}/destination/${dest.slug}`;
    const imgUrl = `${SITE_URL}/destination-images/${dest.slug}.webp`;
    const title = `${dest.name}, ${dest.state} Travel Guide`;

    xml += '  <url>\n';
    xml += `    <loc>${destUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '    <image:image>\n';
    xml += `      <image:loc>${imgUrl}</image:loc>\n`;
    xml += `      <image:title>${escapeXml(title)}</image:title>\n`;
    xml += '    </image:image>\n';
    xml += '  </url>\n';
    destinationUrlCount++;
  }

  xml += '</urlset>\n';

  const totalUrls = 1 + destinationUrlCount;

  // 5. Write to output
  fs.writeFileSync(SITEMAP_OUTPUT_PATH, xml, 'utf-8');
  console.log(`\n✅ Generated sitemap at: ${SITEMAP_OUTPUT_PATH}`);
  console.log(`Total URLs in sitemap: ${totalUrls} (1 Homepage + ${destinationUrlCount} Destination Guides)`);

  // Also write to dist/sitemap.xml if client/dist exists
  const distDir = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
    console.log(`✅ Synced sitemap to client/dist/sitemap.xml`);
  }

  console.log('\n============================================================');
  console.log('🎉 Sitemap validation & generation complete!');
  console.log('============================================================\n');

  return totalUrls;
}

if (require.main === module) {
  try {
    generateSitemap();
  } catch (err) {
    console.error('💥 Fatal error generating sitemap:', err.message);
    process.exit(1);
  }
}

module.exports = { generateSitemap };
