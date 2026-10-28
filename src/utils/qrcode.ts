import QRCode from 'qrcode';
import type { CardData } from '../types';
import { generateNfcUrl } from './nfc';

const qrCache = new Map<string, string>();

/**
 * Generate a crisp base64 PNG data URL for a given target URL or card.
 */
export async function getQrCodeDataUrl(text: string, size = 160): Promise<string> {
  const cacheKey = `${text}_${size}`;
  if (qrCache.has(cacheKey)) {
    return qrCache.get(cacheKey)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#1e1b4b', // Deep magical navy
        light: '#ffffff'  // Pure crisp white
      },
      errorCorrectionLevel: 'M'
    });
    qrCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.debug('Failed to generate QR code', err);
    return '';
  }
}

/**
 * Get the exact QR code data URL for a card
 */
export async function getCardQrCode(card: CardData, baseUrl?: string, size = 160): Promise<string> {
  const url = generateNfcUrl(card, baseUrl);
  return getQrCodeDataUrl(url, size);
}

/**
 * Trigger an instant browser download of the card's QR code PNG image.
 */
export async function downloadCardQrCode(card: CardData, baseUrl?: string): Promise<void> {
  const dataUrl = await getCardQrCode(card, baseUrl, 512); // High-res 512x512 for printing
  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `AlchemyQuest_Card_${card.number}_${card.name.replace(/\s+/g, '_')}_QR.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Trigger an instant browser download of a Totem's quest starter QR code PNG image.
 */
export async function downloadTotemQrCode(rune: string, baseUrl?: string): Promise<void> {
  const url = `${baseUrl || window.location.origin}/?quest=${rune}`;
  const dataUrl = await getQrCodeDataUrl(url, 512); // High-res 512x512 for printing
  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `AlchemyQuest_Totem_${rune.toUpperCase()}_QR.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
