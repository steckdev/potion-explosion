import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playVictoryFanfare, playStoneLock, playBloop } from '../utils/audio';
import { Sparkles, RotateCcw, Check } from 'lucide-react';

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

  // Direct Tap to Redeem Prize (Zero drag frustration on iPads!)
  const handleRedeemPrize = () => {
    if (isRedeemed) return;
    setIsRedeemed(true);
    playStoneLock();

    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#39ff14', '#ffbe0b', '#00c8ff', '#bf5af2', '#ffffff']
    });
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

        {/* QUEST MASTER TOUCH REDEMPTION (Zero drag frustration on iPads!) */}
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
            /* Big, Tactile, High-Contrast Touch Button */
            <button
              onClick={handleRedeemPrize}
              style={{
                width: '100%',
                minHeight: '66px',
                padding: '0.9rem 1.6rem',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #ffbe0b, #f59e0b)',
                border: 'none',
                color: '#090714',
                fontSize: '1.18rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                boxShadow: '0 8px 24px rgba(255, 190, 11, 0.5), 0 0 20px rgba(255, 190, 11, 0.4)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '1.6rem' }}>🎁</span>
              <span>QUEST MASTER: TAP TO REDEEM PRIZE!</span>
            </button>
          )}

          {/* Helper Note & Reset Option */}
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
                : 'Show to Quest Master at prize table to tap & redeem'}
            </div>

            {isRedeemed && (
              <button
                onClick={() => {
                  playBloop(0.9);
                  setIsRedeemed(false);
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
