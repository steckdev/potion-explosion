import type { CardData } from '../types';
import { DEFAULT_CARDS } from '../data/defaultCards';

const STORAGE_KEY_CARDS = 'potion_quest_cards_v5';

export function getStoredCards(): CardData[] {
  try {
    // Purge outdated card storage from prior iterations
    ['potion_quest_cards_v1', 'potion_quest_cards_v2', 'potion_quest_cards_v3', 'potion_quest_cards_v4'].forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });

    const raw = localStorage.getItem(STORAGE_KEY_CARDS);
    if (!raw) return DEFAULT_CARDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 12) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load cards from storage', e);
  }
  return DEFAULT_CARDS;
}

export function saveStoredCards(cards: CardData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards to storage', e);
  }
}

export function resetStoredCards(): CardData[] {
  try {
    localStorage.removeItem(STORAGE_KEY_CARDS);
  } catch (e) {
    console.error('Failed to clear stored cards', e);
  }
  return DEFAULT_CARDS;
}

export function exportCardsAsJSON(cards: CardData[]): string {
  return JSON.stringify(cards, null, 2);
}

export function importCardsFromJSON(jsonString: string): CardData[] {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) throw new Error('Invalid JSON format: expected an array of cards');
  return parsed as CardData[];
}
