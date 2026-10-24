# 🧪 The Great Alchemy Quest — High-Resolution Cauldron Prompts

This guide contains production-ready image generation prompts to produce ultra-high-resolution, crisp 4K cauldron sprites for **The Great Alchemy Quest**.

---

## 🎨 Recommended Style Archetype
- **Style**: Cute Kawaii Chibi Casual Game Asset, bold clean dark vector outlines, soft gradient cell-shading.
- **Background**: Isolated pure solid white background (`#FFFFFF`) with generous margin so no feet, handles, or steam are clipped.
- **Perspective**: Front-facing orthographic 2D view, slightly looking down into the cauldron brew.
- **Palette**: Dark violet-charcoal metallic cast-iron pot (`#251d3a`), glowing neon green liquid (`#39ff14`) with purple swirl ripples, warm amber and gold highlights.

---

## 🌟 OPTION A: 4-in-a-Row Sprite Progression Sheet (Recommended)
> Generate all 4 states in a single image to ensure 100% identical cauldron dimensions, smiling face, lighting, and art style.

```text
A horizontal sprite sheet sequence showing 4 progression states of a cute Kawaii chibi magical cast-iron cauldron, from left to right:
1) Resting: cute smiling chibi face on front, 3 curved bottom feet, two round side hoop handles, bubbling neon green and purple potion with tiny rising bubbles and steam wisps;
2) Churning: potion vigorously swirling in a vortex with colorful glowing droplet splashes (cyan, violet, gold) bursting upwards;
3) Sizzling: glowing intensely with magical sparkling runes and dense glowing vapor clouds rising from the brim;
4) Poof Eruption: joyful grand celebration with a giant vibrant rainbow cloud erupting upwards filled with colorful stars, magical confetti sparks, and a playful comic "POOF!" cloud effect.
Consistent dark metallic purple iron cauldron across all 4 states, bold clean dark outlines, soft vibrant cell shading, casual mobile game asset art style, centered composition with generous padding around all edges, zero clipped feet, isolated on a pure seamless solid white background --ar 16:9 --v 6.1 --style raw
```

**Negative Prompt:**
```text
--no photorealistic, dark background, texture gradient, shadows touching image edges, clipped feet, cut off bottom, blurry, grain, low resolution, realistic human face, watermarks, frames, borders
```

---

## 🧪 OPTION B: Individual High-Resolution 1:1 Sprites (2048×2048)

### 1. `cauldron_bubble` — Resting Bubbling Cauldron
*Used for: Landing Hub Centerpiece & Initial Stir Station*

```text
Cute Kawaii chibi magical cast-iron cauldron asset for a mobile game, front-facing view, 3 small sturdy curved cauldron feet fully visible on the bottom, two side ring handles, adorable smiling chibi eyes and mouth on the front of the pot, dark violet-charcoal metallic iron texture with soft highlights, brim filled with glowing neon green and violet magical potion bubbling gently, small cute spiral steam puffs and glowing magical star sparkles floating upwards, bold clean dark outlines, vibrant casual game art, centered, isolated on a pure solid white background with generous padding on all four sides --ar 1:1 --v 6.1
```

---

### 2. `cauldron_churning` — Swirling Stirring Cauldron
*Used for: Active Potion Stirring & Adding Ingredients*

```text
Cute Kawaii chibi magical cast-iron cauldron with 3 small curved bottom feet and two side handles, adorable happy smiling chibi face on front, the inside potion is actively churning and swirling in a glowing spiral vortex, splash droplets of glowing cyan, golden amber, and neon lime potion splashing upward over the rim, energetic bubbly froth and colorful floating sparkles, dark violet cast-iron pot, bold clean dark outlines, casual 2D game asset style, centered, isolated on a pure solid white background with ample edge margin --ar 1:1 --v 6.1
```

---

### 3. `cauldron_sizzling` — Pre-Eruption Sizzling Cauldron
*Used for: Stir #3 Suspense & Potion Transition*

```text
Cute Kawaii chibi magical cast-iron cauldron bubbling vigorously, 3 curved bottom feet fully visible, glowing intense magical energy radiating from inside, bubbling froth with vibrant iridescent cyan, purple, and green bubbles overflowing the brim, glowing magical embers, star bursts and swirling vapor clouds rising into the air, cute excited chibi facial expression on the cauldron, dark metallic iron, bold smooth outlines, high saturation 2D vector game asset, centered on a pure solid white background --ar 1:1 --v 6.1
```

---

### 4. `cauldron_poof` — Grand Rainbow Victory Eruption
*Used for: Victory Celebration Screen & Toddler Stir Climax*

```text
Cute Kawaii chibi magical cast-iron cauldron with 3 curved bottom feet, wide happy smiling chibi eyes and blushing cheeks on the pot, a spectacular vibrant explosion of pastel rainbow smoke clouds erupting high above the cauldron with pastel stars, rainbow magical sparkles, celebratory confetti bursts, and a bold playful cartoon comic "POOF!" magical cloud burst, dark violet-charcoal iron cauldron firmly resting on the ground, bold smooth outlines, ultra clean casual game celebration asset, centered with plenty of space above the smoke, isolated on a pure solid white background --ar 1:1 --v 6.1
```

---

## ⚡ How to Import Your New Generated Sprites

Once you generate your new images:

1. Save the image file as:
   - `cauldron_sheet_hd.png` (if you generated the 4-in-1 sheet), OR
   - individual files: `cauldron_bubble.png`, `cauldron_churning.png`, `cauldron_sizzling.png`, `cauldron_poof.png` into `/public/sprites/`.
2. If you upload a sheet, let me know and our automated script will instantly extract, defringe the white background into transparent alpha, and auto-update the app in under 1 second!
