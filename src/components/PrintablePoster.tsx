import React, { useState, useEffect } from 'react';
import type { CardData } from '../types';
import { QUESTS } from '../data/quests';
import { getCardQrCode } from '../utils/qrcode';

interface PrintablePosterProps {
  card: CardData;
  scale?: number;
  showAdminHelper?: boolean;
  showAnswerKey?: boolean;
  showStaffNotes?: boolean;
  baseUrl?: string;
}

export const PrintablePoster: React.FC<PrintablePosterProps> = ({
  card,
  scale = 1,
  showAnswerKey = false,
  showStaffNotes = false,
  baseUrl
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    getCardQrCode(card, baseUrl, 240).then(url => {
      if (isMounted) setQrCodeUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [card, baseUrl]);

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
            gap: '6px',
            width: '130px'
          }}>
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              filter: `drop-shadow(0 0 12px ${leftRune.color}) drop-shadow(0 4px 8px rgba(0,0,0,0.35))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}>
              <img
                src={leftRune.icon}
                alt={leftRune.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: leftRune.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {leftRune.rune} Rune
            </span>
          </div>
        ) : <div style={{ width: '130px' }} />}

        {/* Center Card Number & Title Pin */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          textAlign: 'center'
        }}>
          {thirdRune && (
            <div style={{
              marginTop: '4px',
              fontSize: '0.75rem',
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
            gap: '6px',
            width: '130px'
          }}>
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              filter: `drop-shadow(0 0 12px ${rightRune.color}) drop-shadow(0 4px 8px rgba(0,0,0,0.35))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}>
              <img
                src={rightRune.icon}
                alt={rightRune.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: rightRune.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {rightRune.rune} Rune
            </span>
          </div>
        ) : <div style={{ width: '130px' }} />}
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
          width: '350px',
          height: '260px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.35rem'
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
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#78350f',
          marginTop: '3px'
        }}>
          Alchemist Ingredient
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
        <div className="font-scroll" style={{
          fontSize: '1.38rem',
          lineHeight: 1.45,
          color: '#2d1810',
          textAlign: 'center',
          margin: 0,
          fontWeight: 600
        }}>
          "{card.riddle.replace(/\s*\(Take my 1st letter!\)/i, '')}"
          <div style={{
            marginTop: '8px',
            fontSize: '1.18rem',
            color: '#78350f',
            fontWeight: 800,
            letterSpacing: '0.5px'
          }}>
            ✨ (Take my 1st letter!)
          </div>
        </div>

        {/* Explorer's Camera QR Scan Portal */}
        <div style={{
          marginTop: '0.8rem',
          paddingTop: '0.65rem',
          borderTop: '1.5px dashed rgba(180, 83, 9, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '14px',
          padding: '0.65rem 1.4rem',
          border: '1.5px solid rgba(180, 83, 9, 0.3)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
        }}>
          {qrCodeUrl ? (
            <div style={{
              padding: '3px',
              backgroundColor: '#ffffff',
              border: '2px solid #78350f',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={qrCodeUrl}
                alt={`QR code for card ${card.number}`}
                style={{ width: '64px', height: '64px', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '8px',
              border: '1px dashed #78350f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              color: '#78350f'
            }}>
              QR Code
            </div>
          )}

          <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
            <div style={{
              fontSize: '0.98rem',
              fontWeight: 900,
              color: '#2d1810',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <span>📷</span>
              <span>POINT CAMERA TO CAPTURE</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 600, marginTop: '3px' }}>
              Scan QR code with your phone camera to seal this ingredient into your satchel!
            </div>
          </div>
        </div>

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
