# 📜 The Great Alchemy Quest — Master Clue Cards & Totem Reference

A complete facilitator reference and solution matrix for **The Great Alchemy Quest** Halloween scavenger hunt.

---

## 🔮 The 4 Elemental Totems & Secret Words

| Totem | Rune Emblem | Color | Target Secret Word | Participant Audience |
| :--- | :--- | :--- | :--- | :--- |
| **Fire Torch** | 🔴 Fire | Crimson Red | **`S P I D E R`** | All Ages |
| **Frost Crystal** | 🔵 Frost | Ice Blue | **`S H A D O W`** | All Ages |
| **Venom Leaf** | 🟢 Venom | Toxic Green | **`P O W D E R`** | All Ages |
| **Shadow Moon** | 🟣 Moon | Mystic Violet | **`C H A R M S`** | All Ages |

---

## 🗺️ Master 12-Card Dual-Rune Matrix

Every card in the room carries exactly **two Elemental Runes** in the top corners. 
- **Tiny Alchemists (Kids):** Look for their Totem's rune in the top corner, identify the cute ingredient picture, and match all 6 on the iPad grid.
- **Master Alchemists (Teens & Adults):** Read the bottom riddle, solve the mystery object/creature, and take its **1st letter** to decipher their 6-letter secret word.

| # | Ingredient Name (Kids) | Dual Runes | Station Location | Riddle Answer (Adults) | 1st Letter |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | **Dragon Scale** | 🔵 Frost + 🟣 Moon | Breakroom Kitchen *(by the fruit bowl)* | **Apple** *(Fruit/Object)* | **A** |
| **2** | **Ghost Tears** | 🔵 Frost + 🟣 Moon | Lobby Reception Desk | **Haunted House** *(Structure)* | **H** |
| **3** | **Werewolf Fur** | 🔵 Frost + 🟢 Venom | Window Sill *(overlooking courtyard)* | **Owl** *(Creature)* | **O** |
| **4** | **Herbs** | 🔵 Frost + 🟢 Venom | Green Planter / Living Wall | **Werewolf** *(Creature)* | **W** |
| **5** | **Candy Corn** | 🔴 Fire + 🔵 Frost | Snack Pantry / Treat Station | **Skeleton** *(Bones/Object)* | **S** |
| **6** | **Bat Wings** | 🔴 Fire + 🔵 Frost | Ceiling Vent Beam / Coat Rack | **Darkness** *(Mystery)* | **D** |
| **7** | **Banshee Scream** | 🔴 Fire + 🟢 Venom | Phone Booth 3 *(Soundproof Room)* | **Pumpkin** *(Jack-o'-lantern)* | **P** |
| **8** | **Pumpkin Seeds** | 🔴 Fire + 🟢 Venom | Main Conference Room Whiteboard | **Eyeball** *(Curiosity in a jar)* | **E** |
| **9** | **Spider Venom** | 🔴 Fire + 🟣 Moon | Corner Quiet Pod *(under dim lamp)* | **Raven** *(Creature)* | **R** |
| **10** | **Toad Slime** | 🟢 Venom + 🟣 Moon | Water Dispenser / Kitchen Sink | **Dracula** *(Vampire Count)* | **D** |
| **11** | **Glow Worms** | 🔴 Fire + 🟣 Moon | Tech Rack / Blinking Server Station | **Ink** *(Alchemical Object)* | **I** |
| **12** | **Pixie Dust** | 🟢 Venom + 🟣 Moon | Library Bookshelf / Game Cabinet | **Cauldron** *(Cast-iron Pot)* | **C** |

---

## 🔍 Full Riddle Text for Card #11 (Updated)

* **Card Number:** 11
* **Card Ingredient:** Glow Worms
* **Dual Runes:** 🔴 Fire Torch + 🟣 Shadow Moon
* **Station Location:** Tech Rack / Blinking Server Station
* **Target Letter:** `I`
* **Riddle Answer:** `Ink`
* **Riddle Text:**
  > *"Dark as midnight in a bottle or well, dip a feathered quill to write an ancient spell! What am I? (Take my 1st letter!)"*

---

## 🧪 Rune Breakdown by Quest

### 🔴 Crimson Fire Torch (`S P I D E R`)
* **Cards:** #5 (S - Skeleton), #7 (P - Pumpkin), #11 (I - Ink), #6 (D - Darkness), #8 (E - Eyeball), #9 (R - Raven)
* **Word Lock Letters:** `S` • `P` • `I` • `D` • `E` • `R`

### 🔵 Glacial Frost Crystal (`S H A D O W`)
* **Cards:** #5 (S - Skeleton), #2 (H - Haunted House), #1 (A - Apple), #6 (D - Darkness), #3 (O - Owl), #4 (W - Werewolf)
* **Word Lock Letters:** `S` • `H` • `A` • `D` • `O` • `W`

### 🟢 Toxic Venom Leaf (`P O W D E R`)
* **Cards:** #7 (P - Pumpkin), #3 (O - Owl), #4 (W - Werewolf), #10 (D - Dracula), #8 (E - Eyeball), #9 / #12 (R / C)
* **Word Lock Letters:** `P` • `O` • `W` • `D` • `E` • `R`

### 🟣 Mystic Shadow Moon (`C H A R M S`)
* **Cards:** #12 (C - Cauldron), #2 (H - Haunted House), #1 (A - Apple), #9 (R - Raven), #10, #11 (I - Ink)
* **Word Lock Letters:** `C` • `H` • `A` • `R` • `M` • `S`

---

## 📱 Phone Scavenger Hunt & NFC Tag Programming

Participants can hunt for ingredients using their own mobile phones without crowding around the iPad station!

### 1. How It Works
1. Pre-program physical **NTAG213** or **NTAG215** NFC stickers with the card URLs below using any free app (e.g. *NFC Tools* on iPhone/Android).
2. Attach the NFC sticker to the physical clue card on the wall or on the 3D-printed token.
3. When a participant taps the card with their phone, it launches the app and triggers the **Alchemical Attunement Modal**.
4. **Accidental Claim Prevention:** To avoid accidental triggers, participants must **press and hold for 1.5 seconds** to bind the ingredient token to their phone's **Alchemist Satchel**.
5. **Cookie Persistence:** Collected tokens are saved directly into phone **cookies** (`potion_nfc_collection`) with a 30-day lifetime and localStorage sync.
6. **Mobile Victory:** Once all 6 ingredients for their chosen quest (or all 12) are collected, the player can tap **"Brew & Win"** in their satchel to trigger the Cauldron Eruption victory screen directly on their phone and show their clicker prize badge to the Quest Master!

### 2. Pre-Programmed NFC URLs Reference

| Card # | Ingredient Name | URL to Write on NFC Tag |
| :-: | :--- | :--- |
| **1** | Dragon Scale | `https://<your-domain>/?scan=card-1` |
| **2** | Ghost Tears | `https://<your-domain>/?scan=card-2` |
| **3** | Werewolf Fur | `https://<your-domain>/?scan=card-3` |
| **4** | Herbs | `https://<your-domain>/?scan=card-4` |
| **5** | Candy Corn | `https://<your-domain>/?scan=card-5` |
| **6** | Bat Wings | `https://<your-domain>/?scan=card-6` |
| **7** | Banshee Scream | `https://<your-domain>/?scan=card-7` |
| **8** | Pumpkin Seeds | `https://<your-domain>/?scan=card-8` |
| **9** | Spider Venom | `https://<your-domain>/?scan=card-9` |
| **10** | Toad Slime | `https://<your-domain>/?scan=card-10` |
| **11** | Glow Worms | `https://<your-domain>/?scan=card-11` |
| **12** | Pixie Dust | `https://<your-domain>/?scan=card-12` |

