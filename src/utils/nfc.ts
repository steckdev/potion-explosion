import type { CardData } from '../types';

/**
 * Robustly find a card from an NFC tag scan query.
 * Supports:
 * - Card ID (e.g. 'card-1', 'card-11')
 * - Card number (e.g. '1', '11')
 * - Card name slug (e.g. 'glow_worms', 'glowworms', 'dragon-scale')
 * - Full URL (e.g. 'https://site.com/?scan=card-11' or '?nfc=11')
 */
export function findCardFromScanQuery(rawQuery: string, cards: CardData[]): CardData | null {
  if (!rawQuery || typeof rawQuery !== 'string') return null;

  let query = rawQuery.trim();

  // If a full URL or query string was passed, extract the parameter value
  if (query.includes('?') || query.startsWith('http://') || query.startsWith('https://')) {
    try {
      const url = new URL(query, window.location.origin);
      const scanParam = url.searchParams.get('scan') ||
                        url.searchParams.get('nfc') ||
                        url.searchParams.get('claim') ||
                        url.searchParams.get('token') ||
                        url.searchParams.get('card');
      if (scanParam) {
        query = scanParam.trim();
      }
    } catch {
      // not a standard URL, continue with raw query
    }
  }

  // 1. Direct ID match (e.g. 'card-11')
  const byId = cards.find(c => c.id.toLowerCase() === query.toLowerCase());
  if (byId) return byId;

  // 2. Exact Card Number match (e.g. '11' or 'card11')
  const numericOnly = query.replace(/^card[-_]?/i, '');
  const parsedNum = parseInt(numericOnly, 10);
  if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
    const byNum = cards.find(c => c.number === parsedNum);
    if (byNum) return byNum;
  }

  // 3. Name slug match (e.g. 'glow_worms' or 'glowworms' or 'apple')
  const cleanSlug = query.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanSlug) {
    const byName = cards.find(c => {
      const nameClean = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const riddleClean = c.riddleAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
      return nameClean === cleanSlug || riddleClean === cleanSlug;
    });
    if (byName) return byName;
  }

  return null;
}

/**
 * Generate standard NFC tag URL for physical sticker programming
 */
export function generateNfcUrl(card: CardData, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://potion-explosion.netlify.app');
  return `${origin}/?scan=card-${card.number}`;
}

/**
 * Check if Web NFC API (NDEFReader) is available in current browser (e.g. Chrome on Android)
 */
export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

/**
 * Listen for live NFC tags via Web NFC API if supported.
 * Returns an abort/stop function.
 */
export async function startWebNfcScan(
  onCardDetected: (cardQuery: string) => void,
  onError?: (err: any) => void
): Promise<(() => void) | null> {
  if (!isWebNfcSupported()) {
    if (onError) onError(new Error('Web NFC is not supported on this browser/platform.'));
    return null;
  }

  try {
    const ndef = new (window as any).NDEFReader();
    const ctrl = new AbortController();

    await ndef.scan({ signal: ctrl.signal });

    ndef.addEventListener('reading', (event: any) => {
      try {
        const records = event.message?.records || [];
        for (const record of records) {
          if (record.recordType === 'url') {
            const decoder = new TextDecoder();
            const urlString = decoder.decode(record.data);
            onCardDetected(urlString);
            return;
          } else if (record.recordType === 'text') {
            const decoder = new TextDecoder();
            const textString = decoder.decode(record.data);
            onCardDetected(textString);
            return;
          }
        }
        // Fallback: serial number or generic ping
        if (event.serialNumber) {
          onCardDetected(event.serialNumber);
        }
      } catch (err) {
        console.debug('Error processing NFC record', err);
      }
    });

    ndef.addEventListener('readingerror', () => {
      if (onError) onError(new Error('Cannot read data from the NFC tag. Try again.'));
    });

    return () => {
      try {
        ctrl.abort();
      } catch {}
    };
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}
