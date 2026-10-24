import type { QuestInfo, RuneType } from '../types';

export const QUESTS: Record<RuneType, QuestInfo> = {
  fire: {
    rune: 'fire',
    title: 'Crimson Fire Torch',
    totemName: 'The Fire Torch (Red)',
    icon: '/sprites/rune_fire.png',
    color: '#ff3b30',
    accentColor: '#ff9500',
    secondaryColor: '#ff453a',
    glowColor: 'rgba(255, 69, 58, 0.7)',
    secretWord: 'SPIDER',
    subtitle: 'Blazing embers that ignite mystical brews',
    description: 'Carry the glowing Fire Torch through the office. Hunt for cards bearing the Red Torch emblem!'
  },
  frost: {
    rune: 'frost',
    title: 'Glacial Frost Crystal',
    totemName: 'The Frost Crystal (Blue)',
    icon: '/sprites/rune_frost.png',
    color: '#00c8ff',
    accentColor: '#5ac8fa',
    secondaryColor: '#30b0c7',
    glowColor: 'rgba(0, 200, 255, 0.7)',
    secretWord: 'SHADOW',
    subtitle: 'Chilled crystalline magic that freezes time',
    description: 'Carry the glowing Frost Crystal through the office. Hunt for cards bearing the Blue Crystal emblem!'
  },
  venom: {
    rune: 'venom',
    title: 'Toxic Venom Leaf',
    totemName: 'The Venom Leaf (Green)',
    icon: '/sprites/rune_venom.png',
    color: '#39ff14',
    accentColor: '#30d158',
    secondaryColor: '#28cd41',
    glowColor: 'rgba(57, 255, 20, 0.7)',
    secretWord: 'POWDER',
    subtitle: 'Bubbly acidic botanicals and rare swamp concoctions',
    description: 'Carry the glowing Venom Leaf through the office. Hunt for cards bearing the Green Leaf emblem!'
  },
  moon: {
    rune: 'moon',
    title: 'Mystic Shadow Moon',
    totemName: 'The Shadow Moon (Purple)',
    icon: '/sprites/rune_moon.png',
    color: '#bf5af2',
    accentColor: '#da8fff',
    secondaryColor: '#af52de',
    glowColor: 'rgba(191, 90, 242, 0.7)',
    secretWord: 'CHARMS',
    subtitle: 'Astral moonlight that reveals hidden enchantments',
    description: 'Carry the glowing Shadow Moon through the office. Hunt for cards bearing the Purple Moon emblem!'
  }
};
