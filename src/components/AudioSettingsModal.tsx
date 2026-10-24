import React, { useEffect, useState } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Repeat, 
  Shuffle, 
  Music, 
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import { 
  MUSIC_TRACKS, 
  subscribeAudioState, 
  setMusicVolume, 
  setSfxVolume, 
  setMuted, 
  setAutoAdvance,
  playMusic, 
  toggleMusic, 
  selectTrack, 
  nextTrack, 
  previousTrack, 
  playBloop, 
  playStoneLock, 
  playAmberChime, 
  playVictoryFanfare,
  type AudioState 
} from '../utils/audio';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [audioState, setAudioState] = useState<AudioState>(() => ({
    isMuted: false,
    musicEnabled: false,
    isPlayingMusic: false,
    currentTrackId: 'silver_mortar',
    musicVolume: 0.45,
    sfxVolume: 0.70,
    autoAdvance: true
  }));

  useEffect(() => {
    const unsubscribe = subscribeAudioState((newState) => {
      setAudioState(newState);
    });
    return unsubscribe;
  }, []);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTrack = MUSIC_TRACKS.find(t => t.id === audioState.currentTrackId) || MUSIC_TRACKS[0];

  const applyPreset = (preset: 'quiet' | 'balanced' | 'epic') => {
    playBloop(1.1);
    if (preset === 'quiet') {
      setMusicVolume(0.20);
      setSfxVolume(0.35);
    } else if (preset === 'balanced') {
      setMusicVolume(0.45);
      setSfxVolume(0.70);
    } else if (preset === 'epic') {
      setMusicVolume(0.75);
      setSfxVolume(0.85);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(8, 6, 18, 0.82)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem',
      boxSizing: 'border-box'
    }}
    onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'rgba(18, 14, 34, 0.96)',
          border: '1px solid rgba(191, 90, 242, 0.35)',
          borderRadius: '24px',
          padding: '1.5rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(191, 90, 242, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(191, 90, 242, 0.4), rgba(58, 134, 255, 0.4))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Sliders size={20} color="#ffbe0b" />
            </div>
            <div>
              <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', letterSpacing: '0.5px' }}>
                ALCHEMICAL SOUND CHAMBER
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Background Atmosphere & Acoustic Frequency Controls
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playBloop(0.9);
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Close Settings"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Mute & Quick Atmospheric Presets */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: '0.65rem 0.9rem',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Master Mute Toggle */}
          <button
            onClick={() => {
              setMuted(!audioState.isMuted);
              playBloop(audioState.isMuted ? 1.1 : 0.8);
            }}
            style={{
              background: audioState.isMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(57, 255, 20, 0.15)',
              border: audioState.isMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(57, 255, 20, 0.35)',
              color: audioState.isMuted ? '#f87171' : '#39ff14',
              borderRadius: '999px',
              padding: '0.35rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            {audioState.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{audioState.isMuted ? 'All Audio Muted' : 'Sound Active'}</span>
          </button>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Presets:</span>
            <button
              onClick={() => applyPreset('quiet')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Low volume for quiet focus"
            >
              Quiet
            </button>
            <button
              onClick={() => applyPreset('balanced')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffbe0b',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Recommended balanced levels"
            >
              Balanced
            </button>
            <button
              onClick={() => applyPreset('epic')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Full atmospheric quest sound"
            >
              Immersive
            </button>
          </div>
        </div>

        {/* Section 1: Background Music Player */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '18px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {/* Header of Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Music size={16} color="#bf5af2" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Background Ambient Music
              </span>
            </div>

            {/* Playlist Cycle Toggle */}
            <button
              onClick={() => {
                setAutoAdvance(!audioState.autoAdvance);
                playBloop(1.1);
              }}
              style={{
                background: audioState.autoAdvance ? 'rgba(191, 90, 242, 0.2)' : 'rgba(255, 255, 255, 0.07)',
                border: audioState.autoAdvance ? '1px solid rgba(191, 90, 242, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: audioState.autoAdvance ? '#e9d5ff' : '#94a3b8',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600
              }}
              title={audioState.autoAdvance ? 'Cycle songs to avoid room fatigue (Enabled)' : 'Repeat current song endlessly'}
            >
              {audioState.autoAdvance ? <Shuffle size={12} /> : <Repeat size={12} />}
              <span>{audioState.autoAdvance ? 'Playlist Cycle: ON' : 'Repeat Single Track'}</span>
            </button>
          </div>

          {/* Now Playing Banner with Controls */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 24, 54, 0.9), rgba(18, 14, 34, 0.9))',
            border: '1px solid rgba(191, 90, 242, 0.3)',
            borderRadius: '14px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{currentTrack.icon}</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="font-mystic" style={{ fontSize: '1.05rem', color: '#ffbe0b', whiteSpace: 'nowrap' }}>
                    {currentTrack.name}
                  </span>
                  {audioState.isPlayingMusic && !audioState.isMuted && (
                    <span style={{
                      backgroundColor: 'rgba(57, 255, 20, 0.2)',
                      border: '1px solid #39ff14',
                      color: '#39ff14',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}>
                      PLAYING
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentTrack.subtitle}
                </div>
              </div>
            </div>

            {/* Transport Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <button
                onClick={() => {
                  playBloop(0.9);
                  previousTrack();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Previous Track"
              >
                <SkipBack size={14} />
              </button>

              <button
                onClick={() => {
                  playBloop(1.1);
                  toggleMusic();
                }}
                style={{
                  background: audioState.isPlayingMusic
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#090714',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
                title={audioState.isPlayingMusic ? 'Pause Music' : 'Play Music'}
              >
                {audioState.isPlayingMusic ? <Pause size={18} fill="#090714" /> : <Play size={18} fill="#090714" style={{ marginLeft: '2px' }} />}
              </button>

              <button
                onClick={() => {
                  playBloop(1.1);
                  nextTrack();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Next Track"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </div>

          {/* Music Volume Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Music Volume</span>
              <span style={{ color: '#ffbe0b', fontWeight: 800 }}>
                {Math.round(audioState.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#ffbe0b',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px'
              }}
            />
          </div>

          {/* Song Switcher Grid (The 4 Ambient Tracks) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
              SELECT ATMOSPHERE THEME (SWITCH INSTANTLY):
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '0.45rem'
            }}>
              {MUSIC_TRACKS.map(track => {
                const isSelected = track.id === audioState.currentTrackId;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      playBloop(1.1);
                      selectTrack(track.id);
                      if (!audioState.isPlayingMusic) {
                        playMusic(track.id);
                      }
                    }}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(191, 90, 242, 0.25), rgba(58, 134, 255, 0.25))' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected 
                        ? '1.5px solid #ffbe0b' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '0.55rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(255, 190, 11, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <span style={{ fontSize: '1.25rem' }}>{track.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isSelected ? '#ffffff' : '#e2e8f0',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.name}
                        </div>
                        <div style={{
                          fontSize: '0.68rem',
                          color: '#94a3b8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {track.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="#ffbe0b" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Sound Effects (SFX) Volume & Preview */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '18px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={16} color="#39ff14" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sound Effects (SFX) & Chimes
            </span>
          </div>

          {/* SFX Volume Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>SFX Volume</span>
              <span style={{ color: '#39ff14', fontWeight: 800 }}>
                {Math.round(audioState.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#39ff14',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px'
              }}
            />
          </div>

          {/* Sound Testing Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
              TEST SOUND CLUES & CHIMES:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              <button
                onClick={() => playBloop(1.1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e2e8f0',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                💧 Bubble Click
              </button>

              <button
                onClick={() => playStoneLock()}
                style={{
                  background: 'rgba(57, 255, 20, 0.12)',
                  border: '1px solid rgba(57, 255, 20, 0.3)',
                  color: '#39ff14',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔒 Stone Lock (Green)
              </button>

              <button
                onClick={() => playAmberChime()}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✨ Amber Chime
              </button>

              <button
                onClick={() => playVictoryFanfare()}
                style={{
                  background: 'rgba(191, 90, 242, 0.15)',
                  border: '1px solid rgba(191, 90, 242, 0.35)',
                  color: '#da8fff',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🏆 Victory Fanfare
              </button>
            </div>
          </div>
        </div>

        {/* Modal Done Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button
            onClick={() => {
              playBloop(1.0);
              onClose();
            }}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#090714',
              borderRadius: '999px',
              padding: '0.65rem 1.6rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
