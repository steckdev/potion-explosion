import type { CardData } from '../types';
import { DEFAULT_CARDS } from '../data/defaultCards';

const STORAGE_KEY_CARDS = 'potion_quest_cards_v6';

export function getStoredCards(): CardData[] {
  try {
    // Purge outdated card storage from prior iterations
    ['potion_quest_cards_v1', 'potion_quest_cards_v2', 'potion_quest_cards_v3', 'potion_quest_cards_v4', 'potion_quest_cards_v5'].forEach(k => {
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

// -------------------------------------------------------------
// NFC Token Collection: Cookie-First Storage with LocalStorage Sync
// -------------------------------------------------------------

const COOKIE_NFC_COLLECTION = 'potion_nfc_collection';
const STORAGE_NFC_BACKUP = 'potion_nfc_collection_backup';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

/**
 * Returns the list of card IDs currently stored in participant's phone cookies
 */
export function getScannedCardIds(): string[] {
  // 1. Try reading cookie
  try {
    const cookieVal = getCookie(COOKIE_NFC_COLLECTION);
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // 2. Try localStorage fallback/sync
  try {
    const localVal = localStorage.getItem(STORAGE_NFC_BACKUP);
    if (localVal) {
      const parsed = JSON.parse(localVal);
      if (Array.isArray(parsed)) {
        // sync to cookie
        setCookie(COOKIE_NFC_COLLECTION, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {}

  return [];
}

/**
 * Persists collected card IDs to both cookies (30-day life) and localStorage backup
 */
export function saveScannedCardIds(cardIds: string[]): void {
  const uniqueIds = Array.from(new Set(cardIds));
  const payload = JSON.stringify(uniqueIds);
  try {
    setCookie(COOKIE_NFC_COLLECTION, payload, 30);
  } catch (e) {
    console.debug('Failed to set cookie', e);
  }
  try {
    localStorage.setItem(STORAGE_NFC_BACKUP, payload);
  } catch (e) {
    console.debug('Failed to set localStorage backup', e);
  }
}

/**
 * Safely add a card to the participant's collection
 */
export function addScannedCardId(cardId: string): { isNew: boolean; collection: string[] } {
  const current = getScannedCardIds();
  if (current.includes(cardId)) {
    return { isNew: false, collection: current };
  }
  const next = [...current, cardId];
  saveScannedCardIds(next);
  return { isNew: true, collection: next };
}

/**
 * Reset participant's collected cards
 */
export function clearScannedCardIds(): void {
  removeCookie(COOKIE_NFC_COLLECTION);
  try {
    localStorage.removeItem(STORAGE_NFC_BACKUP);
  } catch {}
}

