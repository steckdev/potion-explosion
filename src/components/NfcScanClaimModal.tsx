import React, { useState, useEffect, useRef } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playNfcHum, playNfcClaimSuccess, playStoneLock, playPoof, getAudioState, subscribeAudioState, toggleMusic } from '../utils/audio';
import { Check, X, BookOpen, MapPin, Radio, KeyRound, Volume2, VolumeX } from 'lucide-react';

interface NfcScanClaimModalProps {
  card: CardData | null;
  isOpen: boolean;
  isAlreadyClaimed: boolean;
  onClaim: (card: CardData) => void;
  onClose: () => void;
  onOpenSatchel: () => void;
}

const HOLD_REQUIRED_MS = 1400; // 1.4 seconds intentional hold to prevent accidental claims

export const NfcScanClaimModal: React.FC<NfcScanClaimModalProps> = ({
  card,
  isOpen,
  isAlreadyClaimed,
  onClaim,
  onClose,
  onOpenSatchel
}) => {
  // Hold state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0.0 to 1.0
  const [isJustClaimed, setIsJustClaimed] = useState(false);
  const [holdHint, setHoldHint] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(() => getAudioState().isMuted);

  const holdStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const soundThrottleRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);

  useEffect(() => {
    return subscribeAudioState(state => {
      setIsAudioMuted(state.isMuted);
    });
  }, []);

  // Reset state when card or open changes
  useEffect(() => {
    if (isOpen) {
      setHoldProgress(0);
      progressRef.current = 0;
      setIsHolding(false);
      isHoldingRef.current = false;
      setIsJustClaimed(false);
      setHoldHint(null);
    }
  }, [isOpen, card?.id]);

  // Primary rune theme for styling
  const primaryRune: RuneType = card?.runes[0] || 'fire';
  const primaryQuest = QUESTS[primaryRune];

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isAlreadyClaimed || isJustClaimed) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    setIsHolding(true);
    isHoldingRef.current = true;
    setHoldHint(null);
    holdStartRef.current = performance.now();

    playBloop(1.1);

    const step = (now: number) => {
      if (!isHoldingRef.current || !holdStartRef.current) return;
      const elapsed = now - holdStartRef.current;
      const progress = Math.min(1.0, elapsed / HOLD_REQUIRED_MS);
      progressRef.current = progress;
      setHoldProgress(progress);

      // Play rising hum sound every 220ms
      if (now - soundThrottleRef.current > 220) {
        soundThrottleRef.current = now;
        playNfcHum(progress);
      }

      if (progress >= 1.0) {
        // Complete claim!
        isHoldingRef.current = false;
        setIsHolding(false);
        setIsJustClaimed(true);
        holdStartRef.current = null;
        playStoneLock();
        playNfcClaimSuccess();
        if (card) {
          onClaim(card);
        }
      } else {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    holdStartRef.current = null;
    isHoldingRef.current = false;
    setIsHolding(false);

    if (progressRef.current < 1.0 && !isJustClaimed && !isAlreadyClaimed) {
      if (progressRef.current > 0.12) {
        playPoof();
        setHoldHint('✋ Keep holding for 1.5 seconds to seal the ingredient!');
      }
      progressRef.current = 0;
      setHoldProgress(0);
    }
  };

  if (!isOpen || !card) return null;

  const showSecured = isAlreadyClaimed || isJustClaimed;

  // SVG circular gauge math
  const ringRadius = 54;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - holdProgress * circumference;

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
          padding: '1.25rem 1.1rem calc(1.75rem + env(safe-area-inset-bottom, 20px)) 1.1rem',
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
        {/* Quick Audio Mute / Unmute Button */}
        <button
          onClick={() => {
            playBloop(1.0);
            toggleMusic();
          }}
          aria-label={isAudioMuted ? "Unmute room music" : "Mute room music"}
          title={isAudioMuted ? "Unmute room music" : "Mute room music (Silent Mode)"}
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
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
            zIndex: 10,
            fontSize: '0.74rem',
            fontWeight: 700
          }}
        >
          {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isAudioMuted ? 'Muted' : 'Music'}</span>
        </button>

        {/* Close Button */}
        <button
          onClick={() => {
            playBloop(0.9);
            onClose();
          }}
          aria-label="Close NFC scan modal"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
        >
          <X size={18} />
        </button>

        {/* Top NFC Beacon Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: showSecured ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 190, 11, 0.2)',
            border: `1px solid ${showSecured ? '#39ff14' : '#ffbe0b'}`,
            animation: 'pulseGlow 2s infinite ease-in-out'
          }}>
            <Radio size={16} color={showSecured ? '#39ff14' : '#ffbe0b'} />
          </div>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: showSecured ? '#39ff14' : '#ffbe0b'
          }}>
            {showSecured ? 'NFC TOKEN IN SATCHEL' : 'NFC INGREDIENT RESONANCE'}
          </span>
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
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0.25rem 0'
          }}
        >
          {/* Pulsing Aura Rings */}
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${primaryQuest.glowColor} 0%, transparent 70%)`,
              opacity: isHolding ? 0.9 : 0.45,
              transform: `scale(${1 + holdProgress * 0.25})`,
              transition: 'transform 0.1s linear, opacity 0.2s ease',
              pointerEvents: 'none'
            }}
          />

          {/* Clean Ingredient Sprite */}
          <img
            src={card.sprite}
            alt={card.name}
            style={{
              width: '140px',
              height: '140px',
              objectFit: 'contain',
              filter: showSecured
                ? 'drop-shadow(0 0 16px rgba(57, 255, 20, 0.6))'
                : `drop-shadow(0 0 14px ${primaryQuest.color})`,
              transition: 'transform 0.2s ease',
              transform: isHolding ? 'scale(1.08)' : 'scale(1)',
              zIndex: 2
            }}
          />

          {/* Checkmark Stamp when Claimed */}
          {showSecured && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
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

        {/* Station Location Tag */}
        {card.location && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            color: '#cbd5e1',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '4px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <MapPin size={14} color="#38bdf8" />
            <span>{card.location}</span>
          </div>
        )}

        {/* Interactive Claim Section */}
        {!showSecured ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {/* Accidental Claim Prevention Warning */}
            <div style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              lineHeight: 1.4,
              maxWidth: '340px'
            }}>
              Press and hold for <strong>1.5 seconds</strong> to attune your phone and claim this ingredient token.
            </div>

            {/* Hold Button with Circular SVG Progress Gauge */}
            <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="130" height="130" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                {/* Background Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={ringRadius}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={ringRadius}
                  stroke="#39ff14"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 8px #39ff14)',
                    transition: isHolding ? 'none' : 'stroke-dashoffset 0.25s ease'
                  }}
                />
              </svg>

              {/* The Interactive Hold Touch Target */}
              <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUpOrCancel}
                onPointerCancel={handlePointerUpOrCancel}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isHolding
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
                  transform: isHolding ? 'scale(0.94)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: isHolding ? '0 0 25px #39ff14' : '0 6px 20px rgba(131, 56, 236, 0.5)',
                  zIndex: 4
                }}
              >
                <KeyRound size={26} color={isHolding ? '#090714' : '#ffffff'} />
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: '2px',
                  color: isHolding ? '#090714' : '#ffffff'
                }}>
                  {isHolding ? `${Math.round(holdProgress * 100)}%` : 'HOLD'}
                </span>
              </button>
            </div>

            {/* Early Release Hint */}
            {holdHint && (
              <div style={{
                fontSize: '0.8rem',
                color: '#ffbe0b',
                fontWeight: 600,
                animation: 'shake 0.4s ease'
              }}>
                {holdHint}
              </div>
            )}
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
        <div style={{ width: '100%', display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
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
            {showSecured ? 'Keep Hunting' : 'Cancel'}
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
