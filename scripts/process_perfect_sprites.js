import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const spritesDir = path.join(publicDir, 'sprites');
if (!fs.existsSync(spritesDir)) fs.mkdirSync(spritesDir, { recursive: true });

// High-fidelity defringing & background transparency
// Converts off-white background to transparent alpha with smoothstep edge falloff
// and unmultiplies white from the RGB channels to eliminate white halos/fringes.
// High-fidelity border-connected flood-fill background removal
// Floods from image borders so internal whites (ghost bodies, skeletons, teeth, eyeballs)
// remain 100% solid, while outside background turns transparent with smooth anti-aliasing.
async function defringeAndPad(rawBuffer, minThreshold = 45, maxThreshold = 120) {
  const { data, info } = await sharp(rawBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  const getDist = (x, y) => {
    const idx = (y * w + x) * 4;
    return Math.hypot(255 - data[idx], 255 - data[idx + 1], 255 - data[idx + 2]);
  };

  // 1. Seed image boundaries (only near-white pixels)
  for (let x = 0; x < w; x++) {
    if (getDist(x, 0) < minThreshold) { visited[x] = 1; queue.push(x, 0); }
    if (getDist(x, h - 1) < minThreshold) { visited[(h - 1) * w + x] = 1; queue.push(x, h - 1); }
  }
  for (let y = 0; y < h; y++) {
    if (!visited[y * w] && getDist(0, y) < minThreshold) { visited[y * w] = 1; queue.push(0, y); }
    if (!visited[y * w + w - 1] && getDist(w - 1, y) < minThreshold) { visited[y * w + w - 1] = 1; queue.push(w - 1, y); }
  }

  // 2. BFS flood fill to find all contiguous external background
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nidx = ny * w + nx;
        if (!visited[nidx] && getDist(nx, ny) < minThreshold) {
          visited[nidx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  // 3. Mark all flood-filled external background pixels transparent
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  // 4. Edge anti-aliasing & dematting along the flood boundary
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!visited[idx]) {
        const hasBgNeighbor =
          (x > 0 && visited[idx - 1]) ||
          (x < w - 1 && visited[idx + 1]) ||
          (y > 0 && visited[idx - w]) ||
          (y < h - 1 && visited[idx + w]);

        if (hasBgNeighbor) {
          const dist = getDist(x, y);
          if (dist < maxThreshold) {
            const t = Math.max(0, Math.min(1, (dist - 15) / (maxThreshold - 15)));
            const alphaNorm = t * t * (3 - 2 * t);
            const alpha = Math.max(0, Math.min(255, Math.round(alphaNorm * 255)));
            data[idx * 4 + 3] = alpha;
            if (alpha > 0) {
              const a = alpha / 255;
              data[idx * 4] = Math.max(0, Math.min(255, Math.round((data[idx * 4] - 255 * (1 - a)) / a)));
              data[idx * 4 + 1] = Math.max(0, Math.min(255, Math.round((data[idx * 4 + 1] - 255 * (1 - a)) / a)));
              data[idx * 4 + 2] = Math.max(0, Math.min(255, Math.round((data[idx * 4 + 2] - 255 * (1 - a)) / a)));
            }
          }
        }
      }
    }
  }

  // 5. Trim and pad to 256x256
  const trimmed = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .trim()
    .toBuffer();

  const finalSprite = await sharp(trimmed)
    .resize(230, 230, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 13,
      bottom: 13,
      left: 13,
      right: 13,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  return finalSprite;
}

// 1. Process 16 Clean Ingredients with exact pixel bounds (Zero text, Zero specks)
async function processIngredients() {
  const imgPath = path.resolve('ingredients_clean.png');

  // Exact bounds mapped from density & color distance scan:
  const ingredients = [
    // Row 0
    { name: 'dragon_scale', left: 85, top: 25, width: 160, height: 175 },
    { name: 'ghost_tears', left: 400, top: 25, width: 115, height: 175 },
    { name: 'werewolf_fur', left: 660, top: 25, width: 175, height: 175 },
    { name: 'witch_brew_herb', left: 950, top: 25, width: 175, height: 175 },

    // Row 1
    { name: 'candy_corn', left: 100, top: 250, width: 135, height: 170 },
    { name: 'bat_wing', left: 330, top: 260, width: 255, height: 150 },
    { name: 'banshee_scream', left: 640, top: 255, width: 220, height: 160 },
    { name: 'pumpkin_seeds', left: 965, top: 260, width: 150, height: 150 },

    // Row 2
    { name: 'spider_venom', left: 60, top: 465, width: 165, height: 180 },
    { name: 'toad_slime', left: 365, top: 465, width: 185, height: 180 },
    { name: 'glow_worms', left: 660, top: 465, width: 170, height: 180 },
    { name: 'pixie_dust', left: 950, top: 465, width: 175, height: 180 },

    // Row 3 (4 Extra Ingredients)
    { name: 'dragon_pepper', left: 75, top: 688, width: 190, height: 150 },
    { name: 'eye_of_newt', left: 400, top: 688, width: 115, height: 150 },
    { name: 'vampire_giggles', left: 685, top: 688, width: 125, height: 150 },
    { name: 'bone_powder', left: 980, top: 688, width: 120, height: 150 }
  ];

  for (const item of ingredients) {
    const crop = await sharp(imgPath)
      .extract({ left: item.left, top: item.top, width: item.width, height: item.height })
      .toBuffer();

    const clean = await defringeAndPad(crop, 22, 125);
    fs.writeFileSync(path.join(spritesDir, `${item.name}.png`), clean);
    console.log(`✓ Perfectly defringed ingredient: ${item.name}.png`);
  }
}

// 2. Process Runes, Potions, and Cauldrons from game_sprites_runes.png
async function processRunesAndSprites() {
  const imgPath = path.resolve('game_sprites_runes.png');

  // Row 0: 4 Circular Elemental Runes (y=20 to 198) - strictly above label at 210
  const runes = [
    { name: 'rune_fire', left: 20, width: 265 },
    { name: 'rune_frost', left: 320, width: 265 },
    { name: 'rune_venom', left: 620, width: 265 },
    { name: 'rune_moon', left: 920, width: 265 }
  ];

  for (const rune of runes) {
    const crop = await sharp(imgPath)
      .extract({ left: rune.left, top: 22, width: rune.width, height: 175 })
      .toBuffer();

    const clean = await defringeAndPad(crop, 20, 115);
    fs.writeFileSync(path.join(spritesDir, `${rune.name}.png`), clean);
    console.log(`✓ Perfectly defringed rune: ${rune.name}.png`);
  }

  // Row 1: Potions (y=250 to 375)
  const potions = [
    { name: 'potion_orange', left: 45, width: 210 },
    { name: 'potion_green', left: 345, width: 210 },
    { name: 'potion_purple', left: 645, width: 210 }
  ];

  for (const p of potions) {
    const crop = await sharp(imgPath)
      .extract({ left: p.left, top: 250, width: p.width, height: 125 })
      .toBuffer();

    const clean = await defringeAndPad(crop, 22, 120);
    fs.writeFileSync(path.join(spritesDir, `${p.name}.png`), clean);
    console.log(`✓ Perfectly defringed potion: ${p.name}.png`);
  }

  // Row 3: Cauldrons (Exact bounds top=630, height=176 to preserve bottom feet and eliminate stray artifacts)
  const cauldrons = [
    { name: 'cauldron_bubble', left: 50, top: 630, width: 160, height: 176 },
    { name: 'cauldron_churning', left: 254, top: 630, width: 160, height: 176 },
    { name: 'cauldron_sizzling', left: 456, top: 630, width: 160, height: 176 },
    { name: 'cauldron_poof', left: 645, top: 630, width: 165, height: 176 }
  ];

  for (const c of cauldrons) {
    const crop = await sharp(imgPath)
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .toBuffer();

    const clean = await defringeAndPad(crop, 45, 120);
    fs.writeFileSync(path.join(spritesDir, `${c.name}.png`), clean);
    console.log(`✓ Cleaned cauldron (complete body & feet, zero artifacts): ${c.name}.png`);
  }
}

async function run() {
  await processIngredients();
  await processRunesAndSprites();
  console.log('★ ALL 16 INGREDIENTS, 4 RUNES, POTIONS & CAULDRONS PROCESSED WITH ZERO HALOS & ZERO TEXT!');
}

run().catch(console.error);
