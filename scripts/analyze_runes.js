import sharp from 'sharp';

async function analyzeRunes() {
  const img = sharp('game_sprites_runes.png');
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  const lineDensity = [];
  for (let y = 0; y < height; y++) {
    let nonWhite = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r < 240 || g < 240 || b < 240) {
        nonWhite++;
      }
    }
    lineDensity.push(nonWhite);
  }

  for (let y = 0; y < height; y += 10) {
    const bar = '#'.repeat(Math.min(50, Math.round(lineDensity[y] / 20)));
    console.log(`y=${String(y).padStart(3, '0')}: density=${String(lineDensity[y]).padStart(4, '0')} ${bar}`);
  }
}

analyzeRunes().catch(console.error);
