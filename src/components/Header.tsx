import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Printer, HelpCircle, Maximize, Minimize, Music, Sliders } from 'lucide-react';
import { setMuted, playBloop, subscribeAudioState, getAudioState, MUSIC_TRACKS, type AudioState } from '../utils/audio';
import { AudioSettingsModal } from './AudioSettingsModal';

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  onHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  isMuted: _isMuted,
  onToggleMute,
  onOpenHelp,
  onHome
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
      {/* Fullscreen Toast Notification */}
      {fullscreenToast && (
        <div style={{
          position: 'fixed',
          top: '65px',
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
          zIndex: 1000
        }}>
          {fullscreenToast}
        </div>
      )}
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
            fontSize: 'clamp(1rem, 2.4vw, 1.25rem)',
            letterSpacing: '0.8px',
            color: '#ffbe0b',
            textShadow: '0 0 10px rgba(255, 190, 11, 0.4)',
            lineHeight: 1.1,
            margin: 0,
            whiteSpace: 'nowrap'
          }}>
            THE GREAT ALCHEMY QUEST
          </h1>
        </div>
      </button>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
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
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
        >
          <HelpCircle size={15} color="#38bdf8" />
          <span>Rules</span>
        </button>

        {/* Audio Sound Chamber & Mixer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          border: audioState.isPlayingMusic && !audioState.isMuted
            ? '1px solid rgba(255, 190, 11, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.15)',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: audioState.isPlayingMusic && !audioState.isMuted
            ? '0 0 12px rgba(255, 190, 11, 0.25)'
            : 'none'
        }}>
          {/* Open Audio Mixer Button */}
          <button
            onClick={() => {
              playBloop(1.0);
              setIsAudioModalOpen(true);
            }}
            title="Open Alchemical Sound Chamber (Adjust Songs & Volume)"
            style={{
              background: 'none',
              border: 'none',
              color: audioState.isPlayingMusic && !audioState.isMuted ? '#ffbe0b' : '#e2e8f0',
              padding: '0.45rem 0.65rem 0.45rem 0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Music size={15} color={audioState.isPlayingMusic && !audioState.isMuted ? '#ffbe0b' : '#38bdf8'} />
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {audioState.isPlayingMusic && !audioState.isMuted 
                ? (MUSIC_TRACKS.find(t => t.id === audioState.currentTrackId)?.name || 'Music')
                : 'Audio & Music'}
            </span>
            <Sliders size={13} color="#94a3b8" />
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          {/* Quick Mute Toggle */}
          <button
            onClick={() => {
              const nextMute = !audioState.isMuted;
              setMuted(nextMute);
              onToggleMute();
            }}
            title={audioState.isMuted ? 'Unmute Sound' : 'Mute All Sound'}
            style={{
              background: 'none',
              border: 'none',
              color: audioState.isMuted ? '#f87171' : '#39ff14',
              padding: '0.45rem 0.65rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {audioState.isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        {/* Poster Studio & Admin Toggle */}
        <button
          onClick={onToggleAdmin}
          style={{
            background: isAdmin 
              ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
              : 'rgba(131, 56, 236, 0.25)',
            border: isAdmin 
              ? '1px solid #fbbf24' 
              : '1px solid rgba(191, 90, 242, 0.5)',
            color: '#ffffff',
            padding: '0.45rem 0.85rem',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            boxShadow: isAdmin ? '0 0 14px rgba(245, 158, 11, 0.5)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!isAdmin) e.currentTarget.style.backgroundColor = 'rgba(131, 56, 236, 0.45)';
          }}
          onMouseLeave={(e) => {
            if (!isAdmin) e.currentTarget.style.backgroundColor = 'rgba(131, 56, 236, 0.25)';
          }}
        >
          <Printer size={15} color={isAdmin ? '#ffffff' : '#bf5af2'} />
          <span>{isAdmin ? 'Exit Admin' : '🖨️ Poster Studio & Admin'}</span>
        </button>
      </div>

      {/* Audio Settings Modal */}
      <AudioSettingsModal 
        isOpen={isAudioModalOpen} 
        onClose={() => setIsAudioModalOpen(false)} 
      />
    </header>
  );
};
