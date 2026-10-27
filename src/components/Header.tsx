import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Maximize, Minimize, Music, Sliders, Play, Pause } from 'lucide-react';
import { setMuted, playBloop, subscribeAudioState, getAudioState, playMusic, pauseMusic, MUSIC_TRACKS, type AudioState } from '../utils/audio';
import { AudioSettingsModal } from './AudioSettingsModal';

interface HeaderProps {
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  onHome: () => void;
  collectedCount?: number;
  onOpenSatchel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin = false,
  onToggleAdmin: _onToggleAdmin,
  isMuted: _isMuted,
  onToggleMute,
  onOpenHelp,
  onHome,
  collectedCount = 0,
  onOpenSatchel
}) => {
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (isAdmin) return false;
    return true; // Default to full screen on load
  });
  const [fullscreenToast, setFullscreenToast] = useState<string | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>(() => getAudioState());

  useEffect(() => {
    const unsub = subscribeAudioState((state) => {
      setAudioState(state);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin && typeof document !== 'undefined') {
      document.body.classList.add('kiosk-fullscreen-mode');
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(isFull);
      if (isFull) {
        document.body.classList.add('kiosk-fullscreen-mode');
      } else {
        document.body.classList.remove('kiosk-fullscreen-mode');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    playBloop(1.1);
    const doc = document as any;
    const docEl = document.documentElement as any;
    const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || document.body.classList.contains('kiosk-fullscreen-mode'));

    if (!isFull) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }

      // Always toggle kiosk mode class for iPad and browsers where native API is restricted
      document.body.classList.add('kiosk-fullscreen-mode');
      setIsFullscreen(true);
      setFullscreenToast('⛶ Fullscreen / Kiosk Mode Activated!');
      setTimeout(() => setFullscreenToast(null), 2500);
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      document.body.classList.remove('kiosk-fullscreen-mode');
      setIsFullscreen(false);
      setFullscreenToast('🗗 Standard View Restored');
      setTimeout(() => setFullscreenToast(null), 2000);
    }
  };

  return (
    <>
      {/* Subtle Floating Exit Tab when in Fullscreen */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fullscreen-exit-tab no-print"
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 1000,
            backgroundColor: 'rgba(13, 10, 26, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#e2e8f0',
            borderRadius: '999px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: 0.35,
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'rgba(13, 10, 26, 0.95)';
            e.currentTarget.style.borderColor = '#39ff14';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.35';
            e.currentTarget.style.backgroundColor = 'rgba(13, 10, 26, 0.45)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Exit Full Screen (or press Esc)"
        >
          <Minimize size={14} color="#39ff14" />
          <span>Exit Full Screen</span>
        </button>
      )}

      {/* Floating Satchel Tab in Full Screen */}
      {isFullscreen && onOpenSatchel && (
        <button
          onClick={() => {
            playBloop(1.1);
            onOpenSatchel();
          }}
          className="no-print"
          style={{
            position: 'fixed',
            top: '12px',
            right: '155px',
            zIndex: 1000,
            backgroundColor: 'rgba(13, 10, 26, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: collectedCount > 0 ? '1px solid #39ff14' : '1px solid rgba(255, 255, 255, 0.18)',
            color: '#e2e8f0',
            borderRadius: '999px',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
          }}
          title="Open Alchemist's Satchel"
        >
          <span>🎒</span>
          <span>Satchel ({collectedCount}/12)</span>
        </button>
      )}

      {/* Main Top Header Bar (Completely Hidden on Full Screen) */}
      {!isFullscreen && (
        <header className="no-print glass-panel" style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(13, 10, 26, 0.92)'
        }}>
          {/* Brand Title (Always routes to Home) */}
      <button
        onClick={() => {
          playBloop(1.0);
          onHome();
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          textAlign: 'left',
          flexShrink: 0
        }}
        title="Return to Main Hub"
      >
        <img
          src="/sprites/cauldron_bubble.png"
          alt="Cauldron"
          style={{
            width: '38px',
            height: '38px',
            filter: 'drop-shadow(0 0 8px rgba(191, 90, 242, 0.5))',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.12)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        <div style={{ flexShrink: 0 }}>
          <h1 className="font-mystic" style={{
            fontSize: 'clamp(0.92rem, 3.2vw, 1.25rem)',
            letterSpacing: '0.8px',
            color: '#ffbe0b',
            textShadow: '0 0 10px rgba(255, 190, 11, 0.4)',
            lineHeight: 1.1,
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            ALCHEMY QUEST
          </h1>
        </div>
      </button>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        {/* Satchel Button */}
        {onOpenSatchel && (
          <button
            onClick={() => {
              playBloop(1.1);
              onOpenSatchel();
            }}
            title="Open Alchemist's Satchel (Your Phone NFC Scanned Tokens)"
            style={{
              background: collectedCount > 0
                ? 'linear-gradient(135deg, rgba(131, 56, 236, 0.45) 0%, rgba(57, 255, 20, 0.25) 100%)'
                : 'rgba(255, 255, 255, 0.08)',
              border: collectedCount > 0 ? '1px solid #39ff14' : '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '0.4rem 0.65rem',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: collectedCount > 0 ? '0 0 12px rgba(57, 255, 20, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = collectedCount > 0 ? 'rgba(131, 56, 236, 0.45)' : 'rgba(255, 255, 255, 0.08)'}
          >
            <span style={{ fontSize: '0.95rem' }}>🎒</span>
            <span className="desktop-only-btn" style={{ display: 'inline' }}>Satchel</span>
            <span style={{
              backgroundColor: collectedCount > 0 ? '#39ff14' : 'rgba(255, 255, 255, 0.2)',
              color: '#090714',
              borderRadius: '999px',
              padding: '1px 5px',
              fontSize: '0.7rem',
              fontWeight: 900
            }}>
              {collectedCount}/12
            </span>
          </button>
        )}

        {/* Fullscreen Toggle (Desktop / iPad only, not on iPhone) */}
        <button
          onClick={toggleFullscreen}
          className="desktop-only-btn"
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen (Ideal for iPad)'}
          style={{
            background: isFullscreen ? 'rgba(57, 255, 20, 0.18)' : 'rgba(255, 255, 255, 0.08)',
            border: isFullscreen ? '1px solid #39ff14' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isFullscreen ? '#39ff14' : '#e2e8f0',
            padding: '0.45rem 0.75rem',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isFullscreen ? 'rgba(57, 255, 20, 0.18)' : 'rgba(255, 255, 255, 0.08)'}
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          <span>{isFullscreen ? 'Exit' : 'Full Screen'}</span>
        </button>

        {/* Help button */}
        <button
          onClick={onOpenHelp}
          title="How to Play"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#e2e8f0',
            padding: '0.4rem 0.6rem',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
        >
          <HelpCircle size={15} color="#38bdf8" />
          <span className="desktop-only-btn">Rules</span>
        </button>

        {/* Audio Sound Chamber & Mixer */}
        {!audioState.isPlayingMusic ? (
          /* Simple Play Music Button (No auto-play startle) */
          <button
            onClick={() => {
              playBloop(1.1);
              playMusic();
            }}
            title="Start Room Background Music"
            style={{
              backgroundColor: 'rgba(57, 255, 20, 0.12)',
              border: '1px solid rgba(57, 255, 20, 0.4)',
              color: '#39ff14',
              padding: '0.4rem 0.75rem',
              borderRadius: '999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 0 10px rgba(57, 255, 20, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.22)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.12)'}
          >
            <Play size={13} fill="#39ff14" />
            <span>Play Music</span>
          </button>
        ) : (
          /* Active Playing Controls */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            border: !audioState.isMuted
              ? '1px solid rgba(255, 190, 11, 0.5)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            boxShadow: !audioState.isMuted
              ? '0 0 12px rgba(255, 190, 11, 0.25)'
              : 'none'
          }}>
            {/* Pause Button */}
            <button
              onClick={() => {
                playBloop(0.9);
                pauseMusic();
              }}
              title="Pause Background Music"
              style={{
                background: 'none',
                border: 'none',
                color: '#ffbe0b',
                padding: '0.4rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Pause size={13} fill="#ffbe0b" />
              <span className="desktop-only-btn">Pause</span>
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

            {/* Open Audio Mixer Button */}
            <button
              onClick={() => {
                playBloop(1.0);
                setIsAudioModalOpen(true);
              }}
              title="Adjust Songs & Volume"
              style={{
                background: 'none',
                border: 'none',
                color: !audioState.isMuted ? '#ffbe0b' : '#e2e8f0',
                padding: '0.4rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Music size={13} color="#ffbe0b" />
              <span className="desktop-only-btn" style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {MUSIC_TRACKS.find(t => t.id === audioState.currentTrackId)?.name || 'Music'}
              </span>
              <Sliders size={12} color="#94a3b8" className="desktop-only-btn" />
            </button>

            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

            {/* Quick Mute Toggle */}
            <button
              onClick={() => {
                const nextMute = !audioState.isMuted;
                setMuted(nextMute);
                onToggleMute();
              }}
              title={audioState.isMuted ? 'Unmute Sound' : 'Mute Sound'}
              style={{
                background: 'none',
                border: 'none',
                color: audioState.isMuted ? '#f87171' : '#39ff14',
                padding: '0.4rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {audioState.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        )}
      </div>
    </header>
    )}

    {/* Fullscreen Toast Notification */}
    {fullscreenToast && (
      <div style={{
        position: 'fixed',
        top: isFullscreen ? '16px' : '65px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#090714',
        border: '2px solid #39ff14',
        color: '#39ff14',
        padding: '6px 18px',
        borderRadius: '999px',
        fontSize: '0.85rem',
        fontWeight: 800,
        boxShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 15px rgba(57, 255, 20, 0.4)',
        zIndex: 2000
      }}>
        {fullscreenToast}
      </div>
    )}

    {/* Audio Settings Modal */}
    <AudioSettingsModal 
      isOpen={isAudioModalOpen} 
      onClose={() => setIsAudioModalOpen(false)} 
    />
  </>
  );
};
