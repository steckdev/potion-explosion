import type { CardData } from '../types';

export const DEFAULT_CARDS: CardData[] = [
  // --- EXACTLY 12 QUEST CARDS (Each card carries exactly 2 elemental runes) ---
  // Distribution across 4 runes (Fire, Frost, Venom, Moon):
  // - Fire: Cards 5, 6, 7, 8, 9, 11 (6 cards) -> S, P, I, D, E, R
  // - Frost: Cards 1, 2, 3, 4, 5, 6 (6 cards) -> S, H, A, D, O, W
  // - Venom: Cards 3, 4, 7, 8, 10, 12 (6 cards) -> P, O, W, D, E, R
  // - Moon: Cards 1, 2, 9, 10, 11, 12 (6 cards) -> C, H, A, R, M, S

  {
    id: 'card-1',
    number: 1,
    name: 'Dragon Scale',
    sprite: '/sprites/dragon_scale.png',
    runes: ['frost', 'moon'],
    targetLetter: 'A',
    riddleAnswer: 'Apple',
    riddle: 'I grow on a branch, red, golden or green; bob for me this Halloween! What am I? (Take my 1st letter!)',
    location: 'Breakroom Kitchen (by the fruit bowl)'
  },
  {
    id: 'card-2',
    number: 2,
    name: 'Ghost Tears',
    sprite: '/sprites/ghost_tears.png',
    runes: ['frost', 'moon'],
    targetLetter: 'H',
    riddleAnswer: 'Haunted House',
    riddle: 'Creaky old floorboards and ghosts in the hall, dare you step through my cobwebbed walls? What am I? (Take my 1st letter!)',
    location: 'Lobby Reception Desk'
  },
  {
    id: 'card-3',
    number: 3,
    name: 'Werewolf Fur',
    sprite: '/sprites/werewolf_fur.png',
    runes: ['frost', 'venom'],
    targetLetter: 'O',
    riddleAnswer: 'Owl',
    riddle: "Perched high in the tree with eyes big and round, I call out 'Whoo-whoo'. What am I? (Take my 1st letter!)",
    location: 'Window Sill overlooking the courtyard'
  },
  {
    id: 'card-4',
    number: 4,
    name: "Herbs",
    sprite: '/sprites/witch_brew_herb.png',
    runes: ['frost', 'venom'],
    targetLetter: 'W',
    riddleAnswer: 'Werewolf',
    riddle: 'When the full silver moon casts its luminous light, I howl at the stars and transform in the night! What am I? (Take my 1st letter!)',
    location: 'Office Planter / Green Wall'
  },
  {
    id: 'card-5',
    number: 5,
    name: 'Candy Corn',
    sprite: '/sprites/candy_corn.png',
    runes: ['fire', 'frost'],
    targetLetter: 'S',
    riddleAnswer: 'Skeleton',
    riddle: 'I rattle my bones as I dance in the street, with no skin or muscles from head to my feet! What am I? (Take my 1st letter!)',
    location: 'Snack Pantry / Treat Station'
  },
  {
    id: 'card-6',
    number: 6,
    name: 'Bat Wings',
    sprite: '/sprites/bat_wing.png',
    runes: ['fire', 'frost'],
    targetLetter: 'D',
    riddleAnswer: 'Darkness',
    riddle: 'When night blankets all and the shadows take flight, I swallow the shadows until morning light! What am I? (Take my 1st letter!)',
    location: 'Ceiling Vent Beam / Coat Rack'
  },
  {
    id: 'card-7',
    number: 7,
    name: 'Banshee Scream',
    sprite: '/sprites/banshee_scream.png',
    runes: ['fire', 'venom'],
    targetLetter: 'P',
    riddleAnswer: 'Pumpkin',
    riddle: 'Carve me a grin with a flickering light, I sit on your porch on Halloween night! What am I? (Take my 1st letter!)',
    location: 'Phone Booth 3 (Soundproof Room)'
  },
  {
    id: 'card-8',
    number: 8,
    name: 'Pumpkin Seeds',
    sprite: '/sprites/pumpkin_seeds.png',
    runes: ['fire', 'venom'],
    targetLetter: 'E',
    riddleAnswer: 'Eyeball',
    riddle: 'In a jar on the shelf I stare through the gloom, watching the witches fly high on their broom! What am I? (Take my 1st letter!)',
    location: 'Main Conference Room Whiteboard'
  },
  {
    id: 'card-9',
    number: 9,
    name: 'Spider Venom',
    sprite: '/sprites/spider_venom.png',
    runes: ['fire', 'moon'],
    targetLetter: 'R',
    riddleAnswer: 'Raven',
    riddle: "With feathers of midnight and perched on a limb, I take flight above the land! What am I? (Take my 1st letter!)",
    location: 'Corner Quiet Pod (under the dim lamp)'
  },
  {
    id: 'card-10',
    number: 10,
    name: 'Toad Slime',
    sprite: '/sprites/toad_slime.png',
    runes: ['venom', 'moon'],
    targetLetter: 'D',
    riddleAnswer: 'Dracula',
    riddle: 'A caped vampire count who can turn to a bat, sleeping by day in his castle! What am I? (Take my 1st letter!)',
    location: 'Water Dispenser / Kitchen Sink'
  },
  {
    id: 'card-11',
    number: 11,
    name: 'Glow Worms',
    sprite: '/sprites/glow_worms.png',
    runes: ['fire', 'moon'],
    targetLetter: 'I',
    riddleAnswer: 'Ink',
    riddle: 'Dark as midnight in a bottle or well, dip a feathered quill to write an ancient spell! What am I? (Take my 1st letter!)',
    location: 'IT Rack / Blinking Server Station'
  },
  {
    id: 'card-12',
    number: 12,
    name: 'Pixie Dust',
    sprite: '/sprites/pixie_dust.png',
    runes: ['venom', 'moon'],
    targetLetter: 'C',
    riddleAnswer: 'Cauldron',
    riddle: 'Black iron pot bubbling over the fire, brewing potions the witches desire! What am I? (Take my 1st letter!)',
    location: 'Library Bookshelf / Game Cabinet'
  }
];
