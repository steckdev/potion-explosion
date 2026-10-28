import React, { useState, useEffect, useRef } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playNfcClaimSuccess, playStoneLock, getAudioState, subscribeAudioState, toggleMusic } from '../utils/audio';
import { Check, X, BookOpen, Radio, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface NfcScanClaimModalProps {
  card: CardData | null;
  isOpen: boolean;
  isAlreadyClaimed: boolean;
  onClaim: (card: CardData) => void;
  onClose: () => void;
  onOpenSatchel: () => void;
}

const AUTO_CLAIM_MS = 3000; // 3 seconds auto-claim if not tapped manually

export const NfcScanClaimModal: React.FC<NfcScanClaimModalProps> = ({
  card,
  isOpen,
  isAlreadyClaimed,
  onClaim,
  onClose,
  onOpenSatchel
}) => {
  const [isJustClaimed, setIsJustClaimed] = useState(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState(AUTO_CLAIM_MS);
  const [isPressed, setIsPressed] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => getAudioState().isMuted);

  const autoClaimTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasClaimedRef = useRef(false);

  useEffect(() => {
    return subscribeAudioState(state => {
      setIsAudioMuted(state.isMuted);
    });
  }, []);

  const executeClaim = () => {
    if (hasClaimedRef.current || isAlreadyClaimed) return;
    hasClaimedRef.current = true;

    if (autoClaimTimerRef.current) {
      cancelAnimationFrame(autoClaimTimerRef.current);
      autoClaimTimerRef.current = null;
    }

    setIsJustClaimed(true);
    playStoneLock();
    playNfcClaimSuccess();

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 100]);
      }
    } catch {}

    if (card) {
      onClaim(card);
    }
  };

  // Reset and start 3-second auto-claim countdown when modal opens
  useEffect(() => {
    if (isOpen && card) {
      setIsJustClaimed(false);
      hasClaimedRef.current = isAlreadyClaimed;
      setTimeRemainingMs(AUTO_CLAIM_MS);
      setIsPressed(false);

      if (!isAlreadyClaimed) {
        startTimeRef.current = performance.now();

        const tick = (now: number) => {
          if (hasClaimedRef.current) return;
          if (!startTimeRef.current) startTimeRef.current = now;

          const elapsed = now - startTimeRef.current;
          const remaining = Math.max(0, AUTO_CLAIM_MS - elapsed);
          setTimeRemainingMs(remaining);

          if (remaining <= 0) {
            executeClaim();
          } else {
            autoClaimTimerRef.current = requestAnimationFrame(tick);
          }
        };

        autoClaimTimerRef.current = requestAnimationFrame(tick);
      }
    }

    return () => {
      if (autoClaimTimerRef.current) {
        cancelAnimationFrame(autoClaimTimerRef.current);
        autoClaimTimerRef.current = null;
      }
    };
  }, [isOpen, card?.id, isAlreadyClaimed]);

  if (!isOpen || !card) return null;

  const showSecured = isAlreadyClaimed || isJustClaimed;
  const primaryRune: RuneType = card.runes[0] || 'fire';
  const primaryQuest = QUESTS[primaryRune];

  // SVG circular countdown gauge math (3 seconds ring)
  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const progressRatio = showSecured ? 1 : Math.max(0, Math.min(1, (AUTO_CLAIM_MS - timeRemainingMs) / AUTO_CLAIM_MS));
  const strokeDashoffset = circumference - progressRatio * circumference;
  const secondsDisplay = Math.max(1, Math.ceil(timeRemainingMs / 1000));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 3, 15, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      {/* Modal Container */}
      <div
        className="glass-panel scrollable-modal-content"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'min(90vh, 90dvh)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          borderRadius: '24px',
          padding: '1.1rem 1.1rem calc(1.75rem + env(safe-area-inset-bottom, 20px)) 1.1rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          border: `2px solid ${showSecured ? '#39ff14' : primaryQuest.color}`,
          boxShadow: `0 0 35px ${primaryQuest.glowColor}, 0 15px 40px rgba(0, 0, 0, 0.8)`,
          background: `radial-gradient(circle at 50% 20%, rgba(30, 20, 60, 0.85) 0%, rgba(9, 7, 20, 0.98) 100%)`,
          textAlign: 'center'
        }}
      >
        {/* Top Control Bar: Audio + Resonance Status + Close (Clean flex row, zero overlap) */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          marginBottom: '0.15rem'
        }}>
          {/* Quick Audio Mute / Unmute Button */}
          <button
            onClick={() => {
              playBloop(1.0);
              toggleMusic();
            }}
            aria-label={isAudioMuted ? "Unmute room music" : "Mute room music"}
            title={isAudioMuted ? "Unmute room music" : "Mute room music (Silent Mode)"}
            style={{
              background: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: isAudioMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isAudioMuted ? '#f87171' : '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.74rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isAudioMuted ? 'Muted' : 'Music'}</span>
          </button>

          {/* Center Resonance Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: showSecured ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 190, 11, 0.15)',
            border: `1px solid ${showSecured ? '#39ff14' : '#ffbe0b'}`,
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: showSecured ? '#39ff14' : '#ffbe0b',
            whiteSpace: 'nowrap'
          }}>
            <Radio size={13} color={showSecured ? '#39ff14' : '#ffbe0b'} />
            <span>{showSecured ? 'TOKEN IN SATCHEL' : 'INGREDIENT RESONANCE'}</span>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              playBloop(0.9);
              onClose();
            }}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Number & Name */}
        <div>
          <div style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: '999px',
            backgroundColor: '#1e1b4b',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffbe0b',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: '4px'
          }}>
            CLUE CARD #{card.number}
          </div>
          <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.75rem', color: '#f8fafc', lineHeight: 1.2 }}>
            {card.name}
          </h2>
        </div>

        {/* Dual Elemental Runes Badges */}
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
          {card.runes.map((r, i) => {
            const q = QUESTS[r];
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${q.color}`,
                  boxShadow: `0 0 10px ${q.glowColor}`
                }}
              >
                <img src={q.icon} alt={q.rune} style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', textTransform: 'capitalize' }}>
                  {q.rune} Rune
                </span>
              </div>
            );
          })}
        </div>

        {/* Center Artwork Container */}
        <div
          style={{
            position: 'relative',
            width: '170px',
            height: '170px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0.15rem 0'
          }}
        >
          {/* Pulsing Aura Rings */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${primaryQuest.glowColor} 0%, transparent 70%)`,
              opacity: isPressed ? 0.95 : 0.5,
              transform: `scale(${1 + progressRatio * 0.15})`,
              transition: 'transform 0.15s ease, opacity 0.2s ease',
              pointerEvents: 'none'
            }}
          />

          {/* Clean Ingredient Sprite */}
          <img
            src={card.sprite}
            alt={card.name}
            style={{
              width: '135px',
              height: '135px',
              objectFit: 'contain',
              filter: showSecured
                ? 'drop-shadow(0 0 16px rgba(57, 255, 20, 0.6))'
                : `drop-shadow(0 0 14px ${primaryQuest.color})`,
              transition: 'transform 0.2s ease',
              transform: isPressed ? 'scale(1.08)' : 'scale(1)',
              zIndex: 2
            }}
          />

          {/* Checkmark Stamp when Claimed */}
          {showSecured && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#39ff14',
                color: '#090714',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px #39ff14',
                zIndex: 5,
                animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <Check size={26} strokeWidth={3.5} />
            </div>
          )}
        </div>

        {/* Interactive Claim Section with 3-Second Auto-Accept and Enhanced Sparkle Button */}
        {!showSecured ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            {/* Circular Progress Gauge with Touch Button */}
            <div style={{ position: 'relative', width: '124px', height: '124px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="124" height="124" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                {/* Background Ring */}
                <circle
                  cx="62"
                  cy="62"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="7"
                  fill="none"
                />
                {/* Animated 3-Second Countdown Progress Ring */}
                <circle
                  cx="62"
                  cy="62"
                  r={ringRadius}
                  stroke="#39ff14"
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 8px #39ff14)',
                    transition: 'stroke-dashoffset 0.1s linear'
                  }}
                />
              </svg>

              {/* Intuitive Magical Attune Touch Button */}
              <button
                onClick={() => {
                  playBloop(1.1);
                  executeClaim();
                }}
                onPointerDown={() => setIsPressed(true)}
                onPointerUp={() => setIsPressed(false)}
                onPointerCancel={() => setIsPressed(false)}
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isPressed
                    ? `radial-gradient(circle, #39ff14 0%, #15803d 100%)`
                    : `radial-gradient(circle, #8338ec 0%, #3d1b7a 100%)`,
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  transform: isPressed ? 'scale(0.94)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: isPressed ? '0 0 25px #39ff14' : '0 6px 20px rgba(131, 56, 236, 0.5)',
                  zIndex: 4
                }}
                title="Tap to claim immediately, or auto-claims in 3 seconds"
              >
                <Sparkles size={28} color={isPressed ? '#090714' : '#ffffff'} />
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginTop: '2px',
                  color: isPressed ? '#090714' : '#ffffff'
                }}>
                  ATTUNE
                </span>
              </button>
            </div>

            {/* 3-Second Auto-Accept Status Caption */}
            <div style={{
              fontSize: '0.8rem',
              color: '#38bdf8',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span>✨</span>
              <span>Auto-attuning in <strong>{secondsDisplay}s</strong>... (or tap to claim)</span>
            </div>
          </div>
        ) : (
          /* Post-Claim Revealed Clue Box */
          <div style={{
            width: '100%',
            backgroundColor: 'rgba(16, 24, 39, 0.75)',
            border: '1px solid rgba(57, 255, 20, 0.35)',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ffbe0b', fontSize: '0.82rem', fontWeight: 700 }}>
                <BookOpen size={15} />
                <span>Alchemist Riddle Captured</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(57, 255, 20, 0.15)',
                color: '#39ff14',
                border: '1px solid rgba(57, 255, 20, 0.4)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.78rem'
              }}>
                ✓ Added to Satchel
              </div>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.88rem',
              color: '#e2e8f0',
              fontStyle: 'italic',
              lineHeight: 1.45
            }}>
              "{card.riddle.replace(/\s*\(Take my 1st letter!\)/i, '')}"
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 190, 11, 0.1)',
              border: '1px solid rgba(255, 190, 11, 0.25)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.78rem',
              color: '#ffbe0b',
              fontWeight: 700
            }}>
              ✨ Solve the riddle & take its 1st letter!
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ width: '100%', display: 'flex', gap: '0.65rem', marginTop: '0.2rem' }}>
          <button
            onClick={() => {
              playBloop(1.0);
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {showSecured ? 'Keep Hunting' : 'Dismiss'}
          </button>

          {showSecured && (
            <button
              onClick={() => {
                playBloop(1.2);
                onClose();
                onOpenSatchel();
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '12px',
                backgroundColor: '#8338ec',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 15px rgba(131, 56, 236, 0.5)'
              }}
            >
              <span>🎒 View Satchel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
