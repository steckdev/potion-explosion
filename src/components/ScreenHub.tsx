import React, { useState, useRef } from 'react';
import type { GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playPoof } from '../utils/audio';
import { ToddlerStirStation } from './ToddlerStirStation';
import { ArrowRight } from 'lucide-react';

interface ScreenHubProps {
  onSelectQuest: (rune: RuneType, mode: GameMode) => void;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export const ScreenHub: React.FC<ScreenHubProps> = ({
  onSelectQuest,
  selectedMode,
  onModeChange
}) => {
  const [hoveredRune, setHoveredRune] = useState<RuneType | null>(null);
  const [showToddlerMode, setShowToddlerMode] = useState(false);
  const [cauldronTapCount, setCauldronTapCount] = useState(0);
  const [tapHintMessage, setTapHintMessage] = useState<string | null>(null);
  const tapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runeOrder: RuneType[] = ['fire', 'frost', 'venom', 'moon'];

  const activeGlowColor = hoveredRune 
    ? QUESTS[hoveredRune].color 
    : '#bf5af2';

  // Handle 3 taps on cauldron for toddler mode
  const handleCauldronTap = () => {
    if (tapResetTimer.current) clearTimeout(tapResetTimer.current);

    const nextCount = cauldronTapCount + 1;
    if (nextCount >= 3) {
      setCauldronTapCount(0);
      setTapHintMessage(null);
      playPoof();
      setShowToddlerMode(true);
    } else {
      setCauldronTapCount(nextCount);
      playBloop(1.0 + nextCount * 0.25);
      if (nextCount === 1) {
        setTapHintMessage('✨ Tap 2 more times to open Toddler Stir Station!');
      } else if (nextCount === 2) {
        setTapHintMessage('✨ 1 more tap for Toddler Stir Station! 🧪');
      }

      tapResetTimer.current = setTimeout(() => {
        setCauldronTapCount(0);
        setTapHintMessage(null);
      }, 2500);
    }
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.6rem 1rem 1rem 1rem',
      gap: '0.9rem'
    }}>
      {/* Toddler Stir Modal */}
      {showToddlerMode && (
        <ToddlerStirStation onClose={() => setShowToddlerMode(false)} />
      )}

      {/* Top Title Banner */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 className="font-mystic" style={{
          fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)',
          fontWeight: 900,
          letterSpacing: '1px',
          background: 'linear-gradient(135deg, #ffffff 40%, #cbd5e1 70%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.15,
          margin: 0
        }}>
          THE GREAT ALCHEMY QUEST
        </h2>
        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
          Halloween Office Scavenger Hunt
        </div>
      </div>

      {/* QUICK SEGMENTED TOGGLE (Apprentice Alchemist vs Master Alchemist) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(20, 15, 38, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '999px',
        padding: '4px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
        gap: '4px'
      }}>
        {/* Apprentice Alchemist (Picture Quest) Button */}
        <button
          onClick={() => {
            playBloop(1.1);
            onModeChange('kids');
          }}
          style={{
            background: selectedMode === 'kids'
              ? 'linear-gradient(135deg, #39ff14, #28cd41)'
              : 'transparent',
            border: 'none',
            color: selectedMode === 'kids' ? '#090714' : '#cbd5e1',
            borderRadius: '999px',
            padding: '0.55rem 1.4rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: selectedMode === 'kids' ? '0 0 16px rgba(57, 255, 20, 0.45)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🧒✨</span>
          <span>Apprentice Alchemist (Picture Quest)</span>
        </button>

        {/* Master Alchemist (Cryptic Cipher) Button */}
        <button
          onClick={() => {
            playBloop(1.1);
            onModeChange('adults');
          }}
          style={{
            background: selectedMode === 'adults'
              ? 'linear-gradient(135deg, #bf5af2, #af52de)'
              : 'transparent',
            border: 'none',
            color: selectedMode === 'adults' ? '#ffffff' : '#cbd5e1',
            borderRadius: '999px',
            padding: '0.55rem 1.4rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: selectedMode === 'adults' ? '0 0 16px rgba(191, 90, 242, 0.45)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🧩</span>
          <span>Master Alchemist (Cryptic Cipher)</span>
        </button>
      </div>

      {/* 4 Rune Medallion Cards */}
      <div style={{
        width: '100%',
        maxWidth: '960px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.8rem',
          width: '100%'
        }}>
          {runeOrder.map((rune) => {
            const quest = QUESTS[rune];
            const isHovered = hoveredRune === rune;

            return (
              <button
                key={rune}
                onClick={() => {
                  playBloop(1.1);
                  onSelectQuest(rune, selectedMode);
                }}
                onMouseEnter={() => {
                  setHoveredRune(rune);
                  playBloop(0.9);
                }}
                onMouseLeave={() => setHoveredRune(null)}
                className="quest-rune-card"
                style={{
                  position: 'relative',
                  background: isHovered 
                    ? 'linear-gradient(180deg, rgba(38, 28, 70, 0.95), rgba(20, 15, 42, 0.95))'
                    : 'linear-gradient(180deg, rgba(28, 22, 53, 0.85), rgba(15, 11, 32, 0.85))',
                  border: `2px solid ${isHovered ? quest.color : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: '18px',
                  padding: '0.85rem 0.6rem 0.75rem 0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'space-between',
                  minHeight: '210px',
                  cursor: 'pointer',
                  boxShadow: isHovered 
                    ? `0 12px 25px rgba(0, 0, 0, 0.6), 0 0 22px ${quest.glowColor}`
                    : '0 6px 16px rgba(0, 0, 0, 0.35)',
                  overflow: 'hidden'
                }}
              >
                {/* Centered Circular Rune Medallion */}
                <div
                  className="glow-rune-pedestal"
                  style={{
                    width: '78px',
                    height: '78px',
                    marginBottom: '0.2rem',
                    boxShadow: isHovered ? `0 0 20px ${quest.glowColor}` : 'none',
                    transition: 'box-shadow 0.25s ease'
                  }}
                >
                  <img
                    src={quest.icon}
                    alt={quest.title}
                    className="rune-icon-img"
                    style={{
                      width: '70px',
                      height: '70px',
                      objectFit: 'contain',
                      filter: `drop-shadow(0 0 10px ${quest.color})`
                    }}
                  />
                </div>

                {/* Totem Name */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '40px',
                  width: '100%'
                }}>
                  <h3 className="font-mystic" style={{
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    color: quest.color,
                    lineHeight: 1.2,
                    margin: 0,
                    textShadow: `0 0 8px ${quest.glowColor}`
                  }}>
                    {quest.title}
                  </h3>
                  <div style={{
                    fontSize: '0.72rem',
                    color: '#cbd5e1',
                    fontWeight: 700,
                    marginTop: '2px'
                  }}>
                    {quest.totemName}
                  </div>
                </div>

                {/* Mode-Specific Callout (NO secret word spoilers!) */}
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  backgroundColor: isHovered ? quest.color : 'rgba(255, 255, 255, 0.08)',
                  color: isHovered ? '#000000' : '#e2e8f0',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  marginTop: '0.25rem'
                }}>
                  <span>
                    {selectedMode === 'kids' 
                      ? 'HUNT 6 RECIPES' 
                      : 'BREW RUNESTONE'}
                  </span>
                  <ArrowRight size={11} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Large, Majestic Bubbling Cauldron Centerpiece */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '0.1rem',
        position: 'relative'
      }}>
        <div
          onClick={handleCauldronTap}
          style={{
            position: 'relative',
            width: '220px',
            height: '210px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Tap 3 times to open Little Alchemist Stir Station!"
        >
          {/* Expansive Pulsing Elemental Aura */}
          <div style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeGlowColor} 0%, rgba(191, 90, 242, 0.25) 50%, transparent 72%)`,
            opacity: 0.65,
            filter: 'blur(28px)',
            animation: 'pulseGlow 2.5s infinite ease-in-out'
          }} />

          {/* Cauldron Sprite with complete body & rounded feet */}
          <img
            src="/sprites/cauldron_bubble.png"
            alt="Cauldron"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 3,
              filter: `drop-shadow(0 0 22px ${activeGlowColor}) drop-shadow(0 10px 20px rgba(0,0,0,0.6))`
            }}
          />

          {/* Glowing Pedestal Shadow */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            width: '160px',
            height: '18px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${activeGlowColor} 0%, transparent 70%)`,
            opacity: 0.5,
            filter: 'blur(6px)',
            zIndex: 1
          }} />
        </div>

        {/* 3-Tap Hint Feedback Tooltip */}
        {tapHintMessage ? (
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#39ff14',
            backgroundColor: 'rgba(9, 7, 20, 0.92)',
            border: '1.5px solid #39ff14',
            padding: '4px 16px',
            borderRadius: '999px',
            boxShadow: '0 0 14px rgba(57, 255, 20, 0.45)',
            animation: 'pulseGlow 1.5s infinite ease-in-out'
          }}>
            {tapHintMessage}
          </div>
        ) : (
          <div style={{
            fontSize: '0.74rem',
            color: '#cbd5e1',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            padding: '3px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            ✨ Tip: Tap pot 3 times for Little Alchemist Stir Station! 🧪
          </div>
        )}
      </div>
    </div>
  );
};
