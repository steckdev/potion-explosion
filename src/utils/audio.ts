// Synthesized Web Audio API Sound Effects Engine & Background Music System

export interface MusicTrack {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  icon: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'silver_mortar',
    name: 'Silver Mortar',
    subtitle: 'Mystical Alchemist Workshop & Bubbling Cauldrons',
    src: '/audio/silver_mortar.m4a',
    icon: '⚗️'
  },
  {
    id: 'starlight',
    name: 'Starlight',
    subtitle: 'Celestial Night Ambiance & Shimmering Magic',
    src: '/audio/starlight.m4a',
    icon: '✨'
  },
  {
    id: 'lantern_grove',
    name: 'Lantern Grove',
    subtitle: 'Enchanted Forest & Whispering Woods',
    src: '/audio/lantern_grove.m4a',
    icon: '🏮'
  },
  {
    id: 'midnight_potion',
    name: 'Midnight Potion',
    subtitle: 'Deep Secret Spells & Shadow Laboratory',
    src: '/audio/midnight_potion.m4a',
    icon: '🌙'
  }
];

export interface AudioState {
  isMuted: boolean;
  musicEnabled: boolean;
  isPlayingMusic: boolean;
  currentTrackId: string;
  musicVolume: number; // 0.0 to 1.0
  sfxVolume: number;   // 0.0 to 1.0
  autoAdvance: boolean;
}

// Storage helpers
const STORAGE_KEY = 'potion_explosion_audio_settings_v1';

function loadStoredSettings(): Partial<AudioState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug('Failed to read audio settings from storage', e);
  }
  return {};
}

function saveStoredSettings(state: AudioState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      isMuted: state.isMuted,
      musicEnabled: state.musicEnabled,
      currentTrackId: state.currentTrackId,
      musicVolume: state.musicVolume,
      sfxVolume: state.sfxVolume,
      autoAdvance: state.autoAdvance
    }));
  } catch (e) {
    console.debug('Failed to save audio settings', e);
  }
}

const initialSaved = loadStoredSettings();

let audioCtx: AudioContext | null = null;
let bgAudioElement: HTMLAudioElement | null = null;
const stateListeners = new Set<(state: AudioState) => void>();

let audioState: AudioState = {
  isMuted: initialSaved.isMuted ?? false,
  musicEnabled: initialSaved.musicEnabled ?? false,
  isPlayingMusic: false,
  currentTrackId: initialSaved.currentTrackId || 'silver_mortar',
  musicVolume: typeof initialSaved.musicVolume === 'number' ? initialSaved.musicVolume : 0.45,
  sfxVolume: typeof initialSaved.sfxVolume === 'number' ? initialSaved.sfxVolume : 0.70,
  autoAdvance: initialSaved.autoAdvance ?? true
};

function notifyStateChanged() {
  saveStoredSettings(audioState);
  stateListeners.forEach(listener => {
    try {
      listener({ ...audioState });
    } catch (e) {
      console.debug('Audio listener error', e);
    }
  });
}

export function subscribeAudioState(listener: (state: AudioState) => void): () => void {
  stateListeners.add(listener);
  listener({ ...audioState });
  return () => {
    stateListeners.delete(listener);
  };
}

export function getAudioState(): AudioState {
  return { ...audioState };
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Background Music Engine
function getBgAudio(): HTMLAudioElement {
  if (!bgAudioElement) {
    bgAudioElement = new Audio();
    bgAudioElement.preload = 'auto';

    const track = MUSIC_TRACKS.find(t => t.id === audioState.currentTrackId) || MUSIC_TRACKS[0];
    bgAudioElement.src = track.src;
    bgAudioElement.volume = audioState.isMuted ? 0 : audioState.musicVolume;

    bgAudioElement.addEventListener('ended', () => {
      if (audioState.autoAdvance) {
        nextTrack();
      } else {
        bgAudioElement?.play().catch(() => {});
      }
    });

    bgAudioElement.addEventListener('playing', () => {
      audioState.isPlayingMusic = true;
      notifyStateChanged();
    });

    bgAudioElement.addEventListener('pause', () => {
      audioState.isPlayingMusic = false;
      notifyStateChanged();
    });

    bgAudioElement.addEventListener('error', (e) => {
      console.debug('Background audio playback warning', e);
      audioState.isPlayingMusic = false;
      notifyStateChanged();
    });
  }
  return bgAudioElement;
}

// Enable music playback with user interaction handler
let unlockAttached = false;
function setupUnlockAudioOnFirstGesture() {
  if (unlockAttached) return;
  unlockAttached = true;

  const handleFirstGesture = () => {
    // Unlock Web Audio context
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}

    // If music was set as enabled by user preference, start playback
    if (audioState.musicEnabled && !audioState.isPlayingMusic) {
      playMusic(audioState.currentTrackId).catch(() => {});
    }

    window.removeEventListener('click', handleFirstGesture);
    window.removeEventListener('keydown', handleFirstGesture);
    window.removeEventListener('touchstart', handleFirstGesture);
  };

  window.addEventListener('click', handleFirstGesture, { once: true });
  window.addEventListener('keydown', handleFirstGesture, { once: true });
  window.addEventListener('touchstart', handleFirstGesture, { once: true });
}

if (typeof window !== 'undefined') {
  setupUnlockAudioOnFirstGesture();
}

export async function playMusic(trackId?: string): Promise<void> {
  const audio = getBgAudio();
  const targetId = trackId || audioState.currentTrackId;
  const track = MUSIC_TRACKS.find(t => t.id === targetId) || MUSIC_TRACKS[0];

  audioState.musicEnabled = true;
  audioState.currentTrackId = track.id;

  if (!audio.src.endsWith(track.src)) {
    audio.src = track.src;
    audio.load();
  }

  audio.volume = audioState.isMuted ? 0 : audioState.musicVolume;

  try {
    await audio.play();
    audioState.isPlayingMusic = true;
  } catch (err) {
    console.debug('Autoplay was prevented or audio failed to play', err);
    audioState.isPlayingMusic = false;
  }
  notifyStateChanged();
}

export function pauseMusic(): void {
  if (bgAudioElement) {
    bgAudioElement.pause();
  }
  audioState.isPlayingMusic = false;
  audioState.musicEnabled = false;
  notifyStateChanged();
}

export function toggleMusic(): void {
  if (audioState.isPlayingMusic) {
    pauseMusic();
  } else {
    playMusic();
  }
}

export function selectTrack(trackId: string): void {
  const track = MUSIC_TRACKS.find(t => t.id === trackId);
  if (!track) return;

  const wasPlaying = audioState.isPlayingMusic || audioState.musicEnabled;
  audioState.currentTrackId = track.id;
  
  const audio = getBgAudio();
  audio.src = track.src;
  audio.load();
  audio.volume = audioState.isMuted ? 0 : audioState.musicVolume;

  if (wasPlaying) {
    audio.play().catch(() => {});
    audioState.isPlayingMusic = true;
  }
  notifyStateChanged();
}

export function nextTrack(): void {
  const currentIndex = MUSIC_TRACKS.findIndex(t => t.id === audioState.currentTrackId);
  const nextIndex = (currentIndex + 1) % MUSIC_TRACKS.length;
  selectTrack(MUSIC_TRACKS[nextIndex].id);
}

export function previousTrack(): void {
  const currentIndex = MUSIC_TRACKS.findIndex(t => t.id === audioState.currentTrackId);
  const prevIndex = (currentIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
  selectTrack(MUSIC_TRACKS[prevIndex].id);
}

export function setMusicVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  audioState.musicVolume = clamped;
  if (bgAudioElement) {
    bgAudioElement.volume = audioState.isMuted ? 0 : clamped;
  }
  notifyStateChanged();
}

export function setSfxVolume(volume: number): void {
  const clamped = Math.max(0, Math.min(1, volume));
  audioState.sfxVolume = clamped;
  notifyStateChanged();
}

export function setAutoAdvance(enabled: boolean): void {
  audioState.autoAdvance = enabled;
  notifyStateChanged();
}

export function setMuted(muted: boolean): void {
  audioState.isMuted = muted;
  if (bgAudioElement) {
    bgAudioElement.volume = muted ? 0 : audioState.musicVolume;
  }
  notifyStateChanged();
}

export function getMuted(): boolean {
  return audioState.isMuted;
}

// -------------------------------------------------------------
// Synthesized Sound Effects (Scaled by SFX Volume)
// -------------------------------------------------------------

function getEffectiveSfxGain(baseGain: number): number {
  if (audioState.isMuted || audioState.sfxVolume <= 0) return 0;
  return baseGain * audioState.sfxVolume;
}

// 1. Cute bubbly bloop sound for card clicks
export function playBloop(pitchMultiplier = 1.0) {
  const effectiveGain = getEffectiveSfxGain(0.25);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const startFreq = 420 * pitchMultiplier;
    const endFreq = 780 * pitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.debug('Audio playback error', e);
  }
}

// 2. Heavy Stone Lock Chime (for when a letter locks in green!)
export function playStoneLock() {
  const effectiveGain = getEffectiveSfxGain(1.0);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Deep stone thud
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    oscThud.type = 'triangle';
    oscThud.frequency.setValueAtTime(140, now);
    oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.2);
    gainThud.gain.setValueAtTime(0.4 * effectiveGain, now);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    oscThud.connect(gainThud);
    gainThud.connect(ctx.destination);
    oscThud.start(now);
    oscThud.stop(now + 0.25);

    // Magical chime ping
    const oscChime = ctx.createOscillator();
    const gainChime = ctx.createGain();
    oscChime.type = 'sine';
    oscChime.frequency.setValueAtTime(880, now + 0.04);
    oscChime.frequency.setValueAtTime(1174.66, now + 0.12); // D6
    gainChime.gain.setValueAtTime(0.25 * effectiveGain, now + 0.04);
    gainChime.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    oscChime.connect(gainChime);
    gainChime.connect(ctx.destination);
    oscChime.start(now + 0.04);
    oscChime.stop(now + 0.65);
  } catch (e) {
    console.debug('Audio error', e);
  }
}

// 3. Amber Chime (letter is in word, but wrong spot)
export function playAmberChime() {
  const effectiveGain = getEffectiveSfxGain(0.2);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain.gain.setValueAtTime(effectiveGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch (e) {
    console.debug('Audio error', e);
  }
}

// 4. Soft Poof / Smoke sound for wrong letters or removed cards
export function playPoof() {
  const effectiveGain = getEffectiveSfxGain(0.25);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(effectiveGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.2);
  } catch (e) {
    console.debug('Audio error', e);
  }
}

// 5. Tactile Potion Clicker Sound (Simulating the 3D printed mechanical click)
export function playPotionClick() {
  const effectiveGain = getEffectiveSfxGain(1.0);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Crisp high snap
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.02);
    gain1.gain.setValueAtTime(0.35 * effectiveGain, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // Subtle plastic resonance pop
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(650, now + 0.01);
    gain2.gain.setValueAtTime(0.2 * effectiveGain, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.01);
    osc2.stop(now + 0.06);
  } catch (e) {
    console.debug('Audio error', e);
  }
}

// 6. Cauldron Explosion & Victory Fanfare!
export function playVictoryFanfare() {
  const effectiveGain = getEffectiveSfxGain(0.3);
  if (effectiveGain <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Musical arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(effectiveGain, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  } catch (e) {
    console.debug('Audio error', e);
  }
}
