import React from 'react';
import type { CardData } from '../types';
import { QUESTS } from '../data/quests';

interface PrintablePosterProps {
  card: CardData;
  scale?: number;
  showAdminHelper?: boolean;
  showAnswerKey?: boolean;
  showStaffNotes?: boolean;
}

export const PrintablePoster: React.FC<PrintablePosterProps> = ({
  card,
  scale = 1,
  showAnswerKey = false,
  showStaffNotes = false
}) => {
  // Get active quests for this card
  const activeQuests = card.runes.map(r => QUESTS[r]).filter(Boolean);

  // Left rune & Right rune (if card has 2 or more)
  const leftRune = activeQuests[0];
  const rightRune = activeQuests.length > 1 ? activeQuests[1] : null;
  const thirdRune = activeQuests.length > 2 ? activeQuests[2] : null;

  return (
    <div
      className="print-page-container"
      style={{
        width: '7.8in',
        height: '10.3in',
        maxWidth: '7.8in',
        maxHeight: '10.3in',
        backgroundColor: '#f8f2de',
        backgroundImage: `
          radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 90% 90%, rgba(180, 83, 9, 0.08) 0%, transparent 40%),
          linear-gradient(180deg, #fbf7ea 0%, #f6edd4 50%, #f0e3bf 100%)
        `,
        border: '10px solid #3d2314',
        borderRadius: '16px',
        boxSizing: 'border-box',
        padding: '0.4in 0.45in',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: scale === 1 ? '0 10px 30px rgba(0,0,0,0.4)' : 'none',
        overflow: 'hidden',
        color: '#2d1810',
        margin: '0 auto',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
    >
      {/* Decorative Ornate Border Inset */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
        border: '2px solid #b45309',
        borderRadius: '8px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Subtle Spiderweb Corner Accents */}
      <div style={{ position: 'absolute', top: '14px', left: '14px', fontSize: '1.3rem', opacity: 0.45 }}>🕸️</div>
      <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '1.3rem', opacity: 0.45 }}>🕸️</div>

      {/* TOP HEADER: High-Contrast Elemental Rune Badges (Centered & Clean) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 0.5rem',
        zIndex: 5
      }}>
        {/* Left Rune Badge */}
        {leftRune ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            width: '110px'
          }}>
            <div style={{
              width: '92px',
              height: '92px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              filter: `drop-shadow(0 0 10px ${leftRune.color})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={leftRune.icon}
                alt={leftRune.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: leftRune.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {leftRune.rune} Rune
            </span>
          </div>
        ) : <div style={{ width: '110px' }} />}

        {/* Center Card Number & Title Pin */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#78350f',
            textTransform: 'uppercase'
          }}>
            THE GREAT ALCHEMY QUEST
          </div>
          <div style={{
            backgroundColor: '#3d2314',
            color: '#ffbe0b',
            padding: '4px 18px',
            borderRadius: '999px',
            fontSize: '0.95rem',
            fontWeight: 900,
            letterSpacing: '1px',
            boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
          }}>
            CLUE CARD #{card.number}
          </div>
          {thirdRune && (
            <div style={{
              marginTop: '4px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: thirdRune.color,
              backgroundColor: '#090714',
              padding: '2px 10px',
              borderRadius: '999px',
              border: `2px solid ${thirdRune.color}`
            }}>
              + {thirdRune.rune.toUpperCase()} RUNE
            </div>
          )}
        </div>

        {/* Right Rune Badge */}
        {rightRune ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            width: '110px'
          }}>
            <div style={{
              width: '92px',
              height: '92px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              filter: `drop-shadow(0 0 10px ${rightRune.color})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={rightRune.icon}
                alt={rightRune.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: rightRune.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {rightRune.rune} Rune
            </span>
          </div>
        ) : <div style={{ width: '110px' }} />}
      </div>

      {/* CENTER STAGE: Clean Kawaii Illustration & Bold Title */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'auto 0',
        zIndex: 5
      }}>
        {/* Ingredient Art - Pure transparent, cleanly centered, no box */}
        <div style={{
          width: '290px',
          height: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.4rem'
        }}>
          <img
            src={card.sprite}
            alt={card.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))'
            }}
          />
        </div>

        {/* Big Bold Ingredient Title */}
        <h1 className="font-mystic" style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: '#2d1810',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          margin: 0,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {card.name}
        </h1>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#78350f',
          marginTop: '3px'
        }}>
          ✨ Magical Alchemist Ingredient ✨
        </div>
      </div>

      {/* BOTTOM SCROLL: The Master Alchemist Rhyming Riddle */}
      <div style={{
        background: 'linear-gradient(180deg, #fffcf4, #fbf2dc)',
        border: '3px solid #78350f',
        borderRadius: '16px',
        padding: '1.35rem 1.75rem',
        boxShadow: '0 6px 16px rgba(61, 35, 20, 0.25)',
        position: 'relative',
        zIndex: 5,
        margin: '0 0.5rem 0.2rem 0.5rem'
      }}>
        {/* Inner Scroll Decorative Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '0.65rem',
          borderBottom: '1.5px solid #d97706',
          paddingBottom: '0.45rem'
        }}>
          <span className="font-mystic" style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#78350f',
            letterSpacing: '1px'
          }}>
            📜 THE MASTER ALCHEMIST RIDDLE
          </span>
        </div>

        {/* Riddle Rhyme */}
        <p className="font-scroll" style={{
          fontSize: '1.38rem',
          lineHeight: 1.48,
          color: '#2d1810',
          textAlign: 'center',
          margin: 0,
          fontWeight: 600
        }}>
          "{card.riddle}"
        </p>

        {/* Staff Answer Key (Only shown when printing the Staff Answer Key) */}
        {showAnswerKey && (
          <div style={{
            marginTop: '0.8rem',
            paddingTop: '0.55rem',
            borderTop: '1px dashed #d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#92400e'
          }}>
            <span>Target Letter:</span>
            <span style={{
              backgroundColor: '#3d2314',
              color: '#39ff14',
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '1.05rem',
              fontWeight: 900
            }}>
              [ {card.targetLetter} ]
            </span>
            <span style={{ fontSize: '0.85rem', color: '#78350f', fontStyle: 'italic' }}>
              ({card.riddleAnswer})
            </span>
          </div>
        )}

        {/* Optional Mounting Note for staff setup */}
        {showStaffNotes && card.location && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#b45309',
            textAlign: 'center',
            fontWeight: 600
          }}>
            📍 Staff Mounting Note: {card.location}
          </div>
        )}
      </div>
    </div>
  );
};
