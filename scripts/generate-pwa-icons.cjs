/**
 * Generates PWA icons from public/images/caliness-master.png.
 *
 * Approach:
 * 1. Crop the hexagonal "C" emblem (upper portion, no wordmark)
 * 2. Composite onto a dark square (#0a0c0e) with a subtle green radial glow
 * 3. Emit normal + maskable variants in the required sizes
 *
 * Run: node scripts/generate-pwa-icons.cjs
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MASTER = path.join(PUBLIC_DIR, 'images', 'caliness-master.png');

const BG = { r: 10, g: 12, b: 14, alpha: 1 }; // #0a0c0e — matches app theme
const GREEN = '#22c55e';                       // brand primary

// The master is 1024×1024; the hexagonal emblem sits roughly centered horizontally
// in the upper half. Crop tightly around it to exclude the wordmark below.
const EMBLEM_CROP = { left: 300, top: 220, width: 420, height: 420 };

/**
 * Build a square dark background with a soft green radial glow behind the emblem.
 */
function buildBackground(size) {
  const cx = size / 2;
  const cy = size / 2;
  const glowRadius = Math.round(size * 0.75);
  // Bold: dramatic green aura ring. Emblem reads as energetically lit from behind.
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${GREEN}" stop-opacity="1.0"/>
          <stop offset="35%" stop-color="${GREEN}" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="${GREEN}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="rgb(${BG.r},${BG.g},${BG.b})"/>
      <circle cx="${cx}" cy="${cy}" r="${glowRadius}" fill="url(#halo)"/>
    </svg>
  `;
  return Buffer.from(svg);
}

/**
 * Generates one icon.
 *  - size:    final pixel dimensions
 *  - padding: inner padding fraction (0–0.3). Higher = more safe space (for maskable).
 *  - outFile: destination filename in public/
 */
async function generateIcon({ size, padding, outFile }) {
  const innerSize = Math.round(size * (1 - padding * 2));

  // 1. Build the background canvas
  const bg = await sharp(buildBackground(size))
    .resize(size, size)
    .png()
    .toBuffer();

  // 2. Crop emblem + resize to inner size
  const emblem = await sharp(MASTER)
    .extract(EMBLEM_CROP)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 3. Composite emblem centered on background
  const offset = Math.round((size - innerSize) / 2);
  const finalBuf = await sharp(bg)
    .composite([{ input: emblem, top: offset, left: offset }])
    .png({ quality: 95 })
    .toBuffer();

  const outPath = path.join(PUBLIC_DIR, outFile);
  fs.writeFileSync(outPath, finalBuf);
  console.log(`✓ ${outFile}  (${size}×${size}, padding ${Math.round(padding * 100)}%)`);
}

async function main() {
  if (!fs.existsSync(MASTER)) {
    console.error(`Master fehlt: ${MASTER}`);
    process.exit(1);
  }

  console.log(`Generiere PWA-Icons aus ${path.basename(MASTER)}...\n`);

  // Standard icons (tight padding, emblem dominates)
  await generateIcon({ size: 512, padding: 0.08, outFile: 'icon-512.png' });
  await generateIcon({ size: 192, padding: 0.08, outFile: 'icon-192.png' });
  await generateIcon({ size: 180, padding: 0.08, outFile: 'apple-touch-icon.png' });

  // Maskable variants (more padding so Android's circular/squircle crop doesn't clip)
  await generateIcon({ size: 512, padding: 0.18, outFile: 'icon-512-maskable.png' });
  await generateIcon({ size: 192, padding: 0.18, outFile: 'icon-192-maskable.png' });

  // Favicon (small browser tab)
  await generateIcon({ size: 32, padding: 0.05, outFile: 'favicon-32.png' });
  await generateIcon({ size: 16, padding: 0.05, outFile: 'favicon-16.png' });

  // Replace the old favicon-512 (which was wrongly the 1920×967 banner)
  await generateIcon({ size: 512, padding: 0.08, outFile: 'favicon-512.png' });

  console.log('\n✓ Alle Icons generiert.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
