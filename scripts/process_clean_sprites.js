import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const spritesDir = path.join(publicDir, 'sprites');
if (!fs.existsSync(spritesDir)) fs.mkdirSync(spritesDir, { recursive: true });

// Convert near-white background pixels to transparent alpha
async function makeTransparentAndPad(rawBuffer, threshold = 245) {
  const { data, info } = await sharp(rawBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const len = data.length;

  for (let i = 0; i < len; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is pure or near white, make transparent with smooth falloff
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    } else if (r >= threshold - 12 && g >= threshold - 12 && b >= threshold - 12) {
      const minVal = Math.min(r, g, b);
      const alpha = Math.max(0, Math.min(255, Math.round((255 - minVal) * (255 / 12))));
      data[i + 3] = alpha;
    }
  }

  // Trim transparent borders and center in a uniform 256x256 square
  const trimmed = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
    .png()
    .trim()
    .toBuffer();

  const finalSprite = await sharp(trimmed)
    .resize(236, 236, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  return finalSprite;
}

// 1. Process ingredients_clean.png (16 ingredients, 4 cols x 4 rows)
async function processIngredients() {
  const imgPath = path.resolve('ingredients_clean.png');

  // Exact vertical boundaries from density scan:
  const rowBounds = [
    { top: 22, height: 178 },  // Row 0: y=22 to 200 (gap before text at 210)
    { top: 260, height: 160 }, // Row 1: y=260 to 420 (gap before text at 430)
    { top: 472, height: 168 }, // Row 2: y=472 to 640 (gap before text at 650)
    { top: 692, height: 148 }  // Row 3: y=692 to 840 (gap before text at 850)
  ];

  const colWidths = [
    { left: 10, width: 280 },
    { left: 310, width: 280 },
    { left: 610, width: 280 },
    { left: 910, width: 280 }
  ];

  const ingredientNames = [
    // Row 0
    ['dragon_scale', 'ghost_tears', 'werewolf_fur', 'witch_brew_herb'],
    // Row 1
    ['candy_corn', 'bat_wing', 'banshee_scream', 'pumpkin_seeds'],
    // Row 2
    ['spider_venom', 'toad_slime', 'glow_worms', 'pixie_dust'],
    // Row 3 (4 Extra Ingredients)
    ['dragon_pepper', 'eye_of_newt', 'vampire_giggles', 'bone_powder']
  ];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const name = ingredientNames[r][c];
      const { top, height } = rowBounds[r];
      const { left, width } = colWidths[c];

      const crop = await sharp(imgPath)
        .extract({ left, top, width, height })
        .toBuffer();

      const transparent = await makeTransparentAndPad(crop, 245);
      fs.writeFileSync(path.join(spritesDir, `${name}.png`), transparent);
      console.log(`✓ Processed ingredient: ${name}.png`);
    }
  }
}

// 2. Process game_sprites_runes.png
async function processRunesAndSprites() {
  const imgPath = path.resolve('game_sprites_runes.png');

  // Row 0: 4 Elemental Runes (y=20 to 198)
  const runeNames = ['rune_fire', 'rune_frost', 'rune_venom', 'rune_moon'];
  const runeCols = [
    { left: 15, width: 275 },
    { left: 315, width: 275 },
    { left: 615, width: 275 },
    { left: 915, width: 275 }
  ];

  for (let c = 0; c < 4; c++) {
    const name = runeNames[c];
    const { left, width } = runeCols[c];

    const crop = await sharp(imgPath)
      .extract({ left, top: 20, width, height: 180 })
      .toBuffer();

    const transparent = await makeTransparentAndPad(crop, 245);
    fs.writeFileSync(path.join(spritesDir, `${name}.png`), transparent);
    console.log(`✓ Processed rune: ${name}.png`);
  }

  // Row 1: Potions (y=245 to 380)
  const potionNames = ['potion_orange', 'potion_green', 'potion_purple'];
  const potionCols = [
    { left: 40, width: 220 },
    { left: 340, width: 220 },
    { left: 640, width: 220 }
  ];

  for (let c = 0; c < 3; c++) {
    const name = potionNames[c];
    const { left, width } = potionCols[c];

    const crop = await sharp(imgPath)
      .extract({ left, top: 245, width, height: 135 })
      .toBuffer();

    const transparent = await makeTransparentAndPad(crop, 245);
    fs.writeFileSync(path.join(spritesDir, `${name}.png`), transparent);
    console.log(`✓ Processed potion: ${name}.png`);
  }

  // Row 2: Avatars & Lanterns (6 items across 1200: y=425 to 585)
  const row2Names = [
    'avatar_bat',
    'avatar_pumpkin',
    'avatar_cat',
    'avatar_ghost',
    'item_glow_lantern',
    'item_tome_ciphers'
  ];
  for (let c = 0; c < 6; c++) {
    const name = row2Names[c];
    const left = Math.round(c * 200 + 5);
    const width = 190;

    const crop = await sharp(imgPath)
      .extract({ left, top: 425, width, height: 160 })
      .toBuffer();

    const transparent = await makeTransparentAndPad(crop, 245);
    fs.writeFileSync(path.join(spritesDir, `${name}.png`), transparent);
    console.log(`✓ Processed avatar/item: ${name}.png`);
  }

  // Row 3: Cauldrons & Compass (6 items across 1200: y=650 to 830)
  const row3Names = [
    'cauldron_bubble',
    'cauldron_churning',
    'cauldron_sizzling',
    'cauldron_poof',
    'item_fungal_spores',
    'item_magical_compass'
  ];
  for (let c = 0; c < 6; c++) {
    const name = row3Names[c];
    const left = Math.round(c * 200 + 5);
    const width = 190;

    const crop = await sharp(imgPath)
      .extract({ left, top: 650, width, height: 175 })
      .toBuffer();

    const transparent = await makeTransparentAndPad(crop, 245);
    fs.writeFileSync(path.join(spritesDir, `${name}.png`), transparent);
    console.log(`✓ Processed cauldron/compass: ${name}.png`);
  }
}

async function run() {
  await processIngredients();
  await processRunesAndSprites();
  console.log('✓ All 16 ingredients + runes + cauldrons + potions cleanly cropped and transparent!');
}

run().catch(console.error);
