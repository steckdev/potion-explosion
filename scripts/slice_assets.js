import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const spritesDir = path.join(publicDir, 'sprites');
const assetsDir = path.join(publicDir, 'assets');

if (!fs.existsSync(spritesDir)) fs.mkdirSync(spritesDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// Copy root PNGs into public/assets
const rootImages = [
  '3D_printed_potions.png',
  'alchemy_quest_assets.png',
  'example_app_experience.png',
  'poster_example.png',
  'sprite_images.png',
  'success_alchemist.png'
];

for (const img of rootImages) {
  if (fs.existsSync(img)) {
    fs.copyFileSync(img, path.join(assetsDir, img));
  }
}

// Slice sprite_images.png (1024x1024, 5x5 grid)
async function sliceSpriteSheet() {
  const spriteSheet = path.resolve('sprite_images.png');
  const metadata = await sharp(spriteSheet).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const cols = 5;
  const rows = 5;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);

  const gridNames = [
    // Row 0
    ['rune_fire', 'rune_frost', 'rune_venom', 'rune_moon', 'medallion_all'],
    // Row 1
    ['dragon_scale', 'ghost_tears', 'werewolf_fur', 'witch_brew_herb', 'candy_corn'],
    // Row 2
    ['bat_wing', 'banshee_scream', 'pumpkin_seeds', 'spider_venom', 'toad_slime'],
    // Row 3
    ['ui_scroll_play', 'ui_locked_check', 'ui_slot_empty', 'ui_slot_locked_s', 'ui_skull_lock'],
    // Row 4
    ['potion_orange', 'potion_green', 'potion_purple', 'cauldron_bubble', 'ghost_witch']
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const name = gridNames[r][c];
      const left = Math.round(c * (width / cols));
      const top = Math.round(r * (height / rows));
      const w = Math.min(cellW, width - left);
      const h = Math.min(cellH, height - top);

      await sharp(spriteSheet)
        .extract({ left, top, width: w, height: h })
        .toFile(path.join(spritesDir, `${name}.png`));
    }
  }
  console.log('Successfully sliced sprite_images.png into 25 icons!');
}

// Slice alchemy_quest_assets.png (1200x896, 3 rows of 4 items)
async function sliceQuestAssets() {
  const questSheet = path.resolve('alchemy_quest_assets.png');
  const metadata = await sharp(questSheet).metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  // Header is around top 100px, remaining ~796px is 3 rows
  const topOffset = 90;
  const rows = 3;
  const cols = 4;
  const usableH = height - topOffset;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(usableH / rows);

  const questNames = [
    ['avatar_bat', 'avatar_pumpkin', 'avatar_cat', 'avatar_ghost'],
    ['item_glow_lantern', 'item_tome_ciphers', 'item_fungal_spores', 'item_magical_compass'],
    ['cauldron_mild', 'cauldron_churning', 'cauldron_sizzling', 'cauldron_poof']
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const name = questNames[r][c];
      const left = Math.round(c * (width / cols));
      const top = Math.round(topOffset + r * (usableH / rows));
      const w = Math.min(cellW, width - left);
      const h = Math.min(cellH, height - top);

      await sharp(questSheet)
        .extract({ left, top, width: w, height: h })
        .toFile(path.join(spritesDir, `${name}.png`));
    }
  }
  console.log('Successfully sliced alchemy_quest_assets.png into 12 quest items!');
}

async function run() {
  await sliceSpriteSheet();
  await sliceQuestAssets();
}

run().catch(console.error);
