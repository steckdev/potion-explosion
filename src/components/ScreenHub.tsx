import React, { useState, useRef } from 'react';
import type { GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playPoof } from '../utils/audio';
import { ToddlerStirStation } from './ToddlerStirStation';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';

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
        setTapHintMessage('✨ Tap 2 more times for Stir Station!');
      } else if (nextCount === 2) {
        setTapHintMessage('✨ 1 more tap to enter Stir Station! 🧪');
      }

      tapResetTimer.current = setTimeout(() => {
        setCauldronTapCount(0);
        setTapHintMessage(null);
      }, 2500);
    }
  };

  // If Toddler Stir Station is open, render it as the primary view (prevents double cauldron)
  if (showToddlerMode) {
    return <ToddlerStirStation onClose={() => setShowToddlerMode(false)} />;
  }

  const activeGlowColor = hoveredRune ? QUESTS[hoveredRune].color : '#bf5af2';

  return (
    <div style={{
      maxWidth: '1050px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.6rem 1rem 1rem 1rem',
      gap: '1rem'
    }}>
      {/* Immersive MagiQuest / Disneyland Hero Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.78rem',
          fontWeight: 800,
          color: '#ffbe0b',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '2px'
        }}>
          <Wand2 size={14} />
          <span>The Ancient Cauldron Awakens</span>
          <Wand2 size={14} />
        </div>
        <h2 className="font-mystic" style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          fontWeight: 900,
          letterSpacing: '1.5px',
          background: 'linear-gradient(135deg, #ffffff 30%, #fef08a 65%, #ffbe0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.15,
          margin: 0
        }}>
          CHOOSE YOUR MAGICAL QUEST
        </h2>
        <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '3px', maxWidth: '600px' }}>
          Select your guild rank, grab your elemental relic, and seek out the enchanted posters hidden across the office!
        </div>
      </div>

      {/* MAGIQUEST GUILD PATH SWITCHER (Apprentice vs Master) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 12, 34, 0.95)',
        border: '1.5px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '999px',
        padding: '5px',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5), inset 0 2px 8px rgba(0,0,0,0.4)',
        gap: '6px'
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
            padding: '0.65rem 1.6rem',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: selectedMode === 'kids' ? '0 0 20px rgba(57, 255, 20, 0.5)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🧒✨</span>
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
            padding: '0.65rem 1.6rem',
            fontSize: '0.95rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: selectedMode === 'adults' ? '0 0 20px rgba(191, 90, 242, 0.5)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🧩</span>
          <span>Master Alchemist (Cryptic Cipher)</span>
        </button>
      </div>

      {/* 4 Elemental Relic Portal Cards (MagiQuest / Sorcerers of Magic Kingdom) */}
      <div style={{
        width: '100%',
        maxWidth: '980px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.85rem',
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
                    ? `linear-gradient(180deg, rgba(38, 28, 70, 0.98), rgba(18, 14, 38, 0.98))`
                    : 'linear-gradient(180deg, rgba(28, 22, 53, 0.88), rgba(15, 11, 32, 0.88))',
                  border: `2px solid ${isHovered ? quest.color : 'rgba(255, 255, 255, 0.16)'}`,
                  borderRadius: '20px',
                  padding: '1rem 0.65rem 0.85rem 0.65rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'space-between',
                  minHeight: '230px',
                  cursor: 'pointer',
                  boxShadow: isHovered 
                    ? `0 14px 28px rgba(0, 0, 0, 0.65), 0 0 25px ${quest.glowColor}`
                    : '0 6px 18px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden'
                }}
              >
                {/* Glowing Relic Medallion on Floating Pedestal */}
                <div
                  className="glow-rune-pedestal"
                  style={{
                    width: '105px',
                    height: '105px',
                    marginBottom: '0.35rem',
                    boxShadow: isHovered ? `0 0 24px ${quest.glowColor}` : 'none',
                    transition: 'box-shadow 0.25s ease'
                  }}
                >
                  <img
                    src={quest.icon}
                    alt={quest.title}
                    className="rune-icon-img"
                    style={{
                      width: '95px',
                      height: '95px',
                      objectFit: 'contain',
                      filter: `drop-shadow(0 0 12px ${quest.color})`
                    }}
                  />
                </div>

                {/* Relic Title and Lore */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  minHeight: '44px'
                }}>
                  <h3 className="font-mystic" style={{
                    fontSize: '1rem',
                    fontWeight: 900,
                    color: quest.color,
                    lineHeight: 1.2,
                    margin: 0,
                    textShadow: `0 0 10px ${quest.glowColor}`
                  }}>
                    {quest.title}
                  </h3>
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    marginTop: '2px'
                  }}>
                    {quest.totemName}
                  </div>
                </div>

                {/* Embark Action Prompt */}
                <div style={{
                  padding: '5px 14px',
                  borderRadius: '999px',
                  backgroundColor: isHovered ? quest.color : 'rgba(255, 255, 255, 0.09)',
                  color: isHovered ? '#090714' : '#f8fafc',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  marginTop: '0.4rem',
                  boxShadow: isHovered ? `0 0 12px ${quest.color}` : 'none'
                }}>
                  <span>
                    {selectedMode === 'kids' ? 'HUNT 6 RECIPES' : 'BREW RUNESTONE'}
                  </span>
                  <ArrowRight size={12} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Large Majestic Bubbling Cauldron Centerpiece (1024x1024 Crystal Clear) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '0.2rem',
        position: 'relative'
      }}>
        <div
          onClick={handleCauldronTap}
          style={{
            position: 'relative',
            width: '230px',
            height: '220px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.93)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Tap 3 times to enter the Little Alchemist Stir Station!"
        >
          {/* Expansive Pulsing Elemental Aura */}
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeGlowColor} 0%, rgba(191, 90, 242, 0.25) 50%, transparent 72%)`,
            opacity: 0.65,
            filter: 'blur(30px)',
            animation: 'pulseGlow 2.5s infinite ease-in-out'
          }} />

          {/* Crisp, Crystal-Clear 1024x1024 Cauldron Sprite */}
          <img
            src="/sprites/cauldron_bubble.png"
            alt="Cauldron"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
              zIndex: 3,
              filter: `drop-shadow(0 0 22px ${activeGlowColor}) drop-shadow(0 10px 20px rgba(0,0,0,0.65))`
            }}
          />

          {/* Glowing Pedestal Shadow */}
          <div style={{
            position: 'absolute',
            bottom: '2px',
            width: '170px',
            height: '20px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${activeGlowColor} 0%, transparent 70%)`,
            opacity: 0.5,
            filter: 'blur(6px)',
            zIndex: 1
          }} />
        </div>

        {/* Secret Tap Station Hint */}
        {tapHintMessage ? (
          <div style={{
            fontSize: '0.84rem',
            fontWeight: 800,
            color: '#39ff14',
            backgroundColor: 'rgba(9, 7, 20, 0.95)',
            border: '1.5px solid #39ff14',
            padding: '5px 18px',
            borderRadius: '999px',
            boxShadow: '0 0 16px rgba(57, 255, 20, 0.5)',
            animation: 'pulseGlow 1.5s infinite ease-in-out'
          }}>
            {tapHintMessage}
          </div>
        ) : (
          <div style={{
            fontSize: '0.76rem',
            color: '#cbd5e1',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            padding: '4px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Sparkles size={13} color="#ffbe0b" />
            <span>Secret: Tap cauldron 3 times for Little Alchemist Stir Station! 🧪</span>
          </div>
        )}
      </div>
    </div>
  );
};
