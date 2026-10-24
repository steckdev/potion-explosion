import React, { useEffect, useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playVictoryFanfare, playStoneLock, playBloop } from '../utils/audio';
import { Sparkles, RotateCcw, Check, ChevronRight } from 'lucide-react';

interface ScreenVictoryProps {
  questRune: RuneType;
  mode: GameMode;
  attempts?: number;
  purity?: number;
  onReset: () => void;
}

export const ScreenVictory: React.FC<ScreenVictoryProps> = ({
  questRune,
  mode,
  onReset
}) => {
  const quest = QUESTS[questRune];
  const [isCauldronBouncing, setIsCauldronBouncing] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  
  // Drag to Redeem state
  const [dragProgress, setDragProgress] = useState(0); // 0.0 to 1.0
  const [isDragging, setIsDragging] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Trigger celebration on victory mount
  useEffect(() => {
    playVictoryFanfare();

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: [quest.color, '#ffbe0b', '#39ff14', '#bf5af2']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: [quest.color, '#00c8ff', '#ff3b30', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [quest.color]);

  // Tap cauldron for fun extra magical feedback
  const handleCauldronTap = () => {
    playBloop(1.2);
    setIsCauldronBouncing(true);
    setTimeout(() => setIsCauldronBouncing(false), 220);

    confetti({
      particleCount: 16,
      spread: 60,
      origin: { y: 0.5 },
      colors: [quest.color, '#ffbe0b', '#39ff14']
    });
  };

  // Direct approval trigger (confetti + stone lock)
  const triggerRedemption = useCallback(() => {
    setIsRedeemed(true);
    setDragProgress(1);
    playStoneLock();

    confetti({
      particleCount: 65,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#39ff14', '#ffbe0b', '#00c8ff', '#bf5af2', '#ffffff']
    });
  }, []);

  // Pointer drag event handlers (Works on mouse, iPad touch, Apple Pencil)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRedeemed) return;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore if not supported */
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isRedeemed || !sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const knobWidth = 56;
    const maxDrag = rect.width - knobWidth - 12;
    if (maxDrag <= 0) return;

    const currentX = e.clientX - rect.left - knobWidth / 2 - 6;
    const progress = Math.max(0, Math.min(1, currentX / maxDrag));
    setDragProgress(progress);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isRedeemed) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (dragProgress >= 0.72) {
      triggerRedemption();
    } else {
      // Smoothly snap back to origin
      setDragProgress(0);
    }
  };

  const handlePointerCancel = () => {
    if (!isRedeemed) {
      setIsDragging(false);
      setDragProgress(0);
    }
  };

  return (
    <div style={{
      maxWidth: '860px',
      margin: '0 auto',
      width: '100%',
      padding: '0.8rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      textAlign: 'center'
    }}>
      {/* Celebratory Title */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="font-mystic" style={{
          fontSize: 'clamp(1.9rem, 4vw, 2.7rem)',
          fontWeight: 900,
          background: `linear-gradient(135deg, #ffffff, ${quest.color}, #ffbe0b)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.15,
          margin: 0
        }}>
          POTION SUCCESSFULLY BREWED!
        </h1>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: quest.color,
          marginTop: '3px'
        }}>
          ✦ The Enchantment of {quest.title} is Broken ✦
        </div>
      </div>

      {/* Main Expansive Stage Card (Focused on the Majestic Cauldron) */}
      <div className="glass-panel" style={{
        borderRadius: '24px',
        padding: '1.5rem 1.5rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem',
        border: `2px solid ${quest.color}`,
        boxShadow: `0 0 35px ${quest.glowColor}, 0 10px 30px rgba(0,0,0,0.5)`,
        position: 'relative'
      }}>
        {/* Large Majestic Cauldron of Victory Centerpiece */}
        <div
          onClick={handleCauldronTap}
          style={{
            position: 'relative',
            width: '210px',
            height: '210px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: isCauldronBouncing ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          title="Tap Cauldron for celebratory magic!"
        >
          {/* Radial Elemental Aura */}
          <div style={{
            position: 'absolute',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${quest.color} 0%, rgba(255, 190, 11, 0.4) 50%, transparent 75%)`,
            opacity: 0.75,
            filter: 'blur(25px)',
            animation: 'pulseGlow 2.5s infinite ease-in-out'
          }} />

          {/* Fully Intact, Clean Cauldron Poof Sprite */}
          <img
            src="/sprites/cauldron_poof.png"
            alt="Cauldron Eruption"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 3,
              filter: `drop-shadow(0 0 20px ${quest.color}) drop-shadow(0 10px 20px rgba(0,0,0,0.6))`
            }}
          />
        </div>

        {/* Incantation Solved Badge */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: `1.5px solid ${quest.color}`,
          borderRadius: '999px',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '1.05rem',
          fontWeight: 800,
          color: '#ffffff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.35)'
        }}>
          <Sparkles size={18} color="#ffbe0b" />
          <span>
            {mode === 'kids' 
              ? 'Apprentice Quest Complete: All 6 Ingredients Restored!' 
              : `Secret Incantation Solved: "${quest.secretWord}"`}
          </span>
        </div>

        {/* QUEST MASTER: DRAG TO THE RIGHT TO REDEEM SLIDER */}
        <div style={{
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.55rem',
          marginTop: '0.2rem'
        }}>
          {isRedeemed ? (
            /* Redeemed Confirmed State */
            <div style={{
              width: '100%',
              minHeight: '66px',
              padding: '0.9rem 1.6rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(57, 255, 20, 0.22)',
              border: '2.5px solid #39ff14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              color: '#39ff14',
              fontSize: '1.12rem',
              fontWeight: 900,
              boxShadow: '0 0 28px rgba(57, 255, 20, 0.6)',
              animation: 'pulseGlow 2s infinite ease-in-out',
              boxSizing: 'border-box'
            }}>
              <Check size={26} strokeWidth={3} />
              <span>QUEST MASTER APPROVED 🎁 PRIZE REDEEMED!</span>
            </div>
          ) : (
            /* Interactive Pointer-Captured Drag Slider */
            <div
              ref={sliderTrackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{
                position: 'relative',
                width: '100%',
                height: '68px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 12, 34, 0.95)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                boxShadow: 'inset 0 3px 12px rgba(0, 0, 0, 0.7), 0 6px 18px rgba(0, 0, 0, 0.45)',
                userSelect: 'none',
                touchAction: 'none',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            >
              {/* Dynamic Gradient Fill Track as slider advances */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${dragProgress * 100}%`,
                background: `linear-gradient(90deg, ${quest.color}, #39ff14)`,
                opacity: 0.55,
                transition: isDragging ? 'none' : 'width 0.25s ease'
              }} />

              {/* Shimmering Center Text Prompt */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                fontSize: '0.98rem',
                fontWeight: 800,
                color: '#cbd5e1',
                pointerEvents: 'none',
                opacity: Math.max(0.15, 1 - dragProgress * 0.85),
                letterSpacing: '0.5px'
              }}>
                <span>👉 Quest Master: Drag to Right to Redeem</span>
                <ChevronRight size={18} color="#ffbe0b" />
                <ChevronRight size={18} color="#39ff14" style={{ marginLeft: '-8px' }} />
              </div>

              {/* Draggable Golden Gift Thumb Knob */}
              <div
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  transform: `translateX(${dragProgress * (sliderTrackRef.current ? sliderTrackRef.current.clientWidth - 68 : 440)}px)`,
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffbe0b, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 18px rgba(255, 190, 11, 0.85), 0 4px 10px rgba(0,0,0,0.5)',
                  transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>🎁</span>
              </div>
            </div>
          )}

          {/* Helper Note & Manual Approve Fallback */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 12px'
          }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {isRedeemed 
                ? '✓ Potion clicker prize verified and issued!' 
                : 'Show to Quest Master at prize table to drag & redeem'}
            </div>

            {isRedeemed ? (
              <button
                onClick={() => {
                  playBloop(0.9);
                  setIsRedeemed(false);
                  setDragProgress(0);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                title="Reset redemption status for testing"
              >
                (Staff: Reset)
              </button>
            ) : (
              <button
                onClick={() => {
                  triggerRedemption();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffbe0b',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                title="Direct tap approval option"
              >
                (Or Tap to Approve)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Return to Hub Button */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button
          onClick={() => {
            playBloop(1.0);
            onReset();
          }}
          style={{
            background: 'linear-gradient(135deg, #8338ec, #3a86ff)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '0.85rem 2.4rem',
            fontSize: '1.05rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            boxShadow: '0 6px 18px rgba(131, 56, 236, 0.45)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <RotateCcw size={18} />
          <span>Brew Another Rune (Return to Hub)</span>
        </button>
      </div>
    </div>
  );
};
