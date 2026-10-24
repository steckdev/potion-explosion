import React, { useState, useRef } from 'react';
import type { GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playPoof } from '../utils/audio';
import { ToddlerStirStation } from './ToddlerStirStation';
import { Sparkles, Wand2, CheckCircle2, Compass } from 'lucide-react';

interface ScreenHubProps {
  onSelectQuest: (rune: RuneType, mode: GameMode) => void;
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const AMBIENT_EMBERS = [
  { left: '6%', delay: '0s', duration: '9s', color: '#ffbe0b', size: 6 },
  { left: '20%', delay: '3.2s', duration: '12s', color: '#bf5af2', size: 8 },
  { left: '36%', delay: '1.4s', duration: '10s', color: '#39ff14', size: 5 },
  { left: '52%', delay: '4.8s', duration: '11s', color: '#00d2ff', size: 7 },
  { left: '68%', delay: '2.1s', duration: '13s', color: '#ff3b30', size: 6 },
  { left: '84%', delay: '4.1s', duration: '9.5s', color: '#ffbe0b', size: 5 },
  { left: '93%', delay: '0.9s', duration: '14s', color: '#bf5af2', size: 7 }
];

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
        setTapHintMessage('✨ Tap 2 more times for Little Alchemist Station!');
      } else if (nextCount === 2) {
        setTapHintMessage('✨ 1 more tap to enter Little Alchemist Station! 🧪');
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
      padding: '0.65rem 1rem 1.2rem 1rem',
      gap: '0.85rem',
      position: 'relative'
    }}>
      {/* Slow Ambient Floating Embers (Brings the room to life while kiosk is idle) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {AMBIENT_EMBERS.map((ember, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: ember.left,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              borderRadius: '50%',
              backgroundColor: ember.color,
              boxShadow: `0 0 14px ${ember.color}`,
              animation: `ambientEmberFloat ${ember.duration} linear infinite`,
              animationDelay: ember.delay,
              opacity: 0.55
            }}
          />
        ))}
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
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
        <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '3px', maxWidth: '620px' }}>
          Select your guild rank, grab your elemental relic, and seek out the enchanted posters hidden across the office!
        </div>
      </div>

      {/* STEP 1: GUILD ADVENTURE SELECTION (Illustrated Avatar Cards) */}
      <div style={{
        width: '100%',
        maxWidth: '920px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.45rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.76rem',
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#cbd5e1',
          textTransform: 'uppercase'
        }}>
          <Sparkles size={13} color="#ffbe0b" />
          <span>Step 1: Choose Your Adventurer Rank</span>
        </div>

        {/* 2 Big Illustrated Guild Cards (The Most Important Choice) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1rem',
          width: '100%'
        }}>
          {/* Card 1: Apprentice Alchemist (Ages 3-8 / Seek & Spot) */}
          <div
            onClick={() => {
              playBloop(1.15);
              onModeChange('kids');
            }}
            className="quest-rune-card"
            style={{
              position: 'relative',
              background: selectedMode === 'kids'
                ? 'linear-gradient(135deg, rgba(28, 52, 24, 0.96), rgba(16, 32, 18, 0.96))'
                : 'linear-gradient(135deg, rgba(24, 20, 44, 0.85), rgba(16, 12, 32, 0.85))',
              border: selectedMode === 'kids'
                ? '3px solid #39ff14'
                : '2px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '24px',
              padding: '1.15rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.15rem',
              cursor: 'pointer',
              boxShadow: selectedMode === 'kids'
                ? '0 12px 30px rgba(0,0,0,0.65), 0 0 32px rgba(57, 255, 20, 0.45)'
                : '0 6px 18px rgba(0,0,0,0.4)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Active Guild Badge */}
            {selectedMode === 'kids' && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#39ff14',
                color: '#090714',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 900,
                boxShadow: '0 0 12px rgba(57, 255, 20, 0.7)'
              }}>
                <CheckCircle2 size={13} />
                <span>SELECTED GUILD</span>
              </div>
            )}

            {/* Prominent Avatar Graphic */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              border: selectedMode === 'kids' ? '3px solid #39ff14' : '2px solid rgba(255, 255, 255, 0.25)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: selectedMode === 'kids' ? '0 0 20px rgba(57, 255, 20, 0.55)' : 'none',
              animation: selectedMode === 'kids' ? 'gentleBreathe 4s ease-in-out infinite' : 'none'
            }}>
              <img
                src="/sprites/avatar_apprentice.png"
                alt="Apprentice Alchemist"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Clear, Streamlined Info (No clutter, simple Age & message) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="font-mystic" style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: selectedMode === 'kids' ? '#39ff14' : '#ffffff',
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: selectedMode === 'kids' ? '0 0 12px rgba(57, 255, 20, 0.6)' : 'none'
                }}>
                  Apprentice Alchemist
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  backgroundColor: 'rgba(57, 255, 20, 0.22)',
                  color: '#39ff14',
                  border: '1.5px solid #39ff14',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  boxShadow: '0 0 10px rgba(57, 255, 20, 0.3)'
                }}>
                  Age 3–8
                </span>
              </div>

              <div style={{
                fontSize: '1rem',
                color: selectedMode === 'kids' ? '#ffbe0b' : '#cbd5e1',
                fontWeight: 800,
                letterSpacing: '0.3px'
              }}>
                Seek & Spot (Picture Hunt)
              </div>
            </div>
          </div>

          {/* Card 2: Master Alchemist (Age 9+ / Cryptic Cipher) */}
          <div
            onClick={() => {
              playBloop(1.15);
              onModeChange('adults');
            }}
            className="quest-rune-card"
            style={{
              position: 'relative',
              background: selectedMode === 'adults'
                ? 'linear-gradient(135deg, rgba(46, 20, 68, 0.96), rgba(24, 10, 40, 0.96))'
                : 'linear-gradient(135deg, rgba(24, 20, 44, 0.85), rgba(16, 12, 32, 0.85))',
              border: selectedMode === 'adults'
                ? '3px solid #bf5af2'
                : '2px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '24px',
              padding: '1.15rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.15rem',
              cursor: 'pointer',
              boxShadow: selectedMode === 'adults'
                ? '0 12px 30px rgba(0,0,0,0.65), 0 0 32px rgba(191, 90, 242, 0.45)'
                : '0 6px 18px rgba(0,0,0,0.4)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Active Guild Badge */}
            {selectedMode === 'adults' && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#bf5af2',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 900,
                boxShadow: '0 0 12px rgba(191, 90, 242, 0.7)'
              }}>
                <CheckCircle2 size={13} />
                <span>SELECTED GUILD</span>
              </div>
            )}

            {/* Prominent Avatar Graphic */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              border: selectedMode === 'adults' ? '3px solid #bf5af2' : '2px solid rgba(255, 255, 255, 0.25)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: selectedMode === 'adults' ? '0 0 20px rgba(191, 90, 242, 0.55)' : 'none',
              animation: selectedMode === 'adults' ? 'gentleBreathe 4s ease-in-out infinite' : 'none'
            }}>
              <img
                src="/sprites/avatar_master.png"
                alt="Master Alchemist"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>

            {/* Clear, Streamlined Info (No clutter, simple Age & message) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="font-mystic" style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: selectedMode === 'adults' ? '#bf5af2' : '#ffffff',
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: selectedMode === 'adults' ? '0 0 12px rgba(191, 90, 242, 0.6)' : 'none'
                }}>
                  Master Alchemist
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  backgroundColor: 'rgba(191, 90, 242, 0.22)',
                  color: '#bf5af2',
                  border: '1.5px solid #bf5af2',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  boxShadow: '0 0 10px rgba(191, 90, 242, 0.3)'
                }}>
                  Age 9+
                </span>
              </div>

              <div style={{
                fontSize: '1rem',
                color: selectedMode === 'adults' ? '#38bdf8' : '#cbd5e1',
                fontWeight: 800,
                letterSpacing: '0.3px'
              }}>
                Cryptic Cipher (Riddle Hunt)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: 4 ELEMENTAL RELIC PORTAL CARDS (With Staggered Floating Levitation) */}
      <div style={{
        width: '100%',
        maxWidth: '980px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.78rem',
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#cbd5e1',
          textTransform: 'uppercase'
        }}>
          <Compass size={14} color="#00d2ff" />
          <span>Step 2: Choose Your Elemental Relic Quest</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '-2px' }}>
          🎲 Drop your Plinko disc to be assigned your relic quest, or choose your element directly:
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          width: '100%'
        }}>
          {runeOrder.map((rune, index) => {
            const quest = QUESTS[rune];
            const isHovered = hoveredRune === rune;
            // Staggered floating delays: 0s, 0.7s, 1.4s, 2.1s
            const floatDelay = `${index * 0.7}s`;

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
                  padding: '0.85rem 0.55rem 0.75rem 0.55rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  justifyContent: 'space-between',
                  minHeight: '215px',
                  cursor: 'pointer',
                  boxShadow: isHovered 
                    ? `0 14px 28px rgba(0, 0, 0, 0.65), 0 0 25px ${quest.glowColor}`
                    : '0 6px 18px rgba(0, 0, 0, 0.4)',
                  animation: `floatGentle 4.5s ease-in-out infinite`,
                  animationDelay: floatDelay,
                  overflow: 'hidden'
                }}
              >
                {/* Glowing Relic Medallion on Floating Pedestal */}
                <div
                  className="glow-rune-pedestal"
                  style={{
                    width: '95px',
                    height: '95px',
                    marginBottom: '0.25rem',
                    boxShadow: isHovered ? `0 0 24px ${quest.glowColor}` : 'none',
                    transition: 'box-shadow 0.25s ease'
                  }}
                >
                  <img
                    src={quest.icon}
                    alt={quest.title}
                    className="rune-icon-img"
                    style={{
                      width: '88px',
                      height: '88px',
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
                    fontSize: '0.96rem',
                    fontWeight: 900,
                    color: quest.color,
                    lineHeight: 1.2,
                    margin: 0,
                    textShadow: `0 0 10px ${quest.glowColor}`
                  }}>
                    {quest.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Large Majestic Bubbling Cauldron Centerpiece (Slow Breathing Aura) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        marginTop: '0.1rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div
          onClick={handleCauldronTap}
          style={{
            position: 'relative',
            width: '200px',
            height: '190px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: 'gentleBreathe 5s ease-in-out infinite'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.93)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Tap 3 times to enter the Little Alchemist Stir Station!"
        >
          {/* Expansive Pulsing Elemental Aura */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeGlowColor} 0%, rgba(191, 90, 242, 0.25) 50%, transparent 72%)`,
            opacity: 0.65,
            filter: 'blur(28px)',
            animation: 'pulseGlow 3s infinite ease-in-out'
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
            width: '150px',
            height: '18px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${activeGlowColor} 0%, transparent 70%)`,
            opacity: 0.5,
            filter: 'blur(6px)',
            zIndex: 1
          }} />
        </div>

        {/* Quick Launch & Hint Bar */}
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
          <button
            onClick={() => {
              playPoof();
              setShowToddlerMode(true);
            }}
            style={{
              fontSize: '0.78rem',
              color: '#f8fafc',
              backgroundColor: 'rgba(57, 255, 20, 0.12)',
              border: '1px solid rgba(57, 255, 20, 0.35)',
              padding: '5px 18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.22)';
              e.currentTarget.style.borderColor = '#39ff14';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(57, 255, 20, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(57, 255, 20, 0.35)';
            }}
          >
            <Sparkles size={13} color="#39ff14" />
            <span>Little Alchemist in the Party? <strong>Tap Here for Stir Station!</strong> 🧪</span>
          </button>
        )}
      </div>
    </div>
  );
};
