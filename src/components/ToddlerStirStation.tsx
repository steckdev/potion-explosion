import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { playBloop, playPoof, playStoneLock, playVictoryFanfare } from '../utils/audio';
import { X, RefreshCw } from 'lucide-react';

interface ToddlerStirStationProps {
  onClose: () => void;
}

interface IngredientOption {
  name: string;
  sprite: string;
  color: string;
  emoji: string;
}

const TODDLER_INGREDIENTS: IngredientOption[] = [
  { name: 'Candy Corn', sprite: '/sprites/candy_corn.png', color: '#ffbe0b', emoji: '🌽' },
  { name: 'Dragon Pepper', sprite: '/sprites/dragon_pepper.png', color: '#ff3b30', emoji: '🌶️' },
  { name: 'Pixie Dust', sprite: '/sprites/pixie_dust.png', color: '#bf5af2', emoji: '✨' },
  { name: 'Pumpkin Seeds', sprite: '/sprites/pumpkin_seeds.png', color: '#30d158', emoji: '🎃' },
  { name: 'Bat Wing', sprite: '/sprites/bat_wing.png', color: '#38bdf8', emoji: '🦇' }
];

export const ToddlerStirStation: React.FC<ToddlerStirStationProps> = ({ onClose }) => {
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientOption[]>([]);
  const [stirCount, setStirCount] = useState(0); // 0, 1, 2, 3 -> Poof!
  const [isBrewed, setIsBrewed] = useState(false);
  const [spoonAngle, setSpoonAngle] = useState(-20);
  const [isCauldronBouncing, setIsCauldronBouncing] = useState(false);
  const [isStirringActive, setIsStirringActive] = useState(false);
  
  const lastStirTimeRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const lastAngleRef = useRef<number | null>(null);
  const accumulatedAngleRef = useRef(0);
  const cauldronCenterRef = useRef<{ cx: number; cy: number } | null>(null);

  // Add ingredient
  const handleAddIngredient = (item: IngredientOption) => {
    if (selectedIngredients.length >= 3) return;
    playBloop(1.1 + selectedIngredients.length * 0.25);
    setIsCauldronBouncing(true);
    setTimeout(() => setIsCauldronBouncing(false), 260);

    setSelectedIngredients(prev => [...prev, item]);
  };

  // Remove ingredient by slot
  const handleRemoveIngredient = (index: number) => {
    if (isBrewed) return;
    playBloop(0.85);
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
    setStirCount(0);
  };

  // Perform a stir (either via mouse swirl, touch swirl, or tap)
  const triggerStirStep = () => {
    if (selectedIngredients.length < 3 || isBrewed) return;

    // Debounce fast touches slightly (180ms)
    const now = Date.now();
    if (now - lastStirTimeRef.current < 180) return;
    lastStirTimeRef.current = now;

    const nextStir = stirCount + 1;
    setIsStirringActive(true);
    setTimeout(() => setIsStirringActive(false), 300);

    setSpoonAngle(prev => (prev <= 0 ? 35 : -25));
    setIsCauldronBouncing(true);
    setTimeout(() => setIsCauldronBouncing(false), 220);

    playBloop(1.15 + nextStir * 0.35);

    // Mini bubbles confetti
    confetti({
      particleCount: 14,
      spread: 60,
      origin: { y: 0.52 },
      colors: ['#39ff14', '#ffbe0b', '#bf5af2', '#38bdf8']
    });

    if (nextStir >= 3) {
      setStirCount(3);
      playPoof();
      setTimeout(() => {
        playStoneLock();
        playVictoryFanfare();
        setIsBrewed(true);

        confetti({
          particleCount: 75,
          spread: 110,
          origin: { y: 0.48 },
          colors: ['#ffbe0b', '#39ff14', '#bf5af2', '#ff3b30', '#00c8ff']
        });
      }, 400);
    } else {
      setStirCount(nextStir);
    }
  };

  // Pointer Event Handlers for Swirling / Dragging (Mouse & Touch compatible!)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedIngredients.length < 3 || isBrewed) return;
    isPointerDownRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const rect = e.currentTarget.getBoundingClientRect();
    cauldronCenterRef.current = {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2
    };

    const dx = e.clientX - cauldronCenterRef.current.cx;
    const dy = e.clientY - cauldronCenterRef.current.cy;
    lastAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
    accumulatedAngleRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || !cauldronCenterRef.current || isBrewed) return;

    const dx = e.clientX - cauldronCenterRef.current.cx;
    const dy = e.clientY - cauldronCenterRef.current.cy;
    const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Update spoon rotation visually to track hand / cursor
    setSpoonAngle(currentAngle / 2);

    if (lastAngleRef.current !== null) {
      let delta = currentAngle - lastAngleRef.current;
      // Handle 180 -> -180 wrap
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      accumulatedAngleRef.current += Math.abs(delta);

      // Once user has swirled approximately 140 degrees, trigger a stir!
      if (accumulatedAngleRef.current >= 140) {
        accumulatedAngleRef.current = 0;
        triggerStirStep();
      }
    }

    lastAngleRef.current = currentAngle;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    lastAngleRef.current = null;
    accumulatedAngleRef.current = 0;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleReset = () => {
    playBloop(1.0);
    setSelectedIngredients([]);
    setStirCount(0);
    setIsBrewed(false);
    setSpoonAngle(-20);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(7, 5, 16, 0.88)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.75rem',
      color: '#ffffff',
      userSelect: 'none',
      touchAction: 'none'
    }}>
      {/* Vertically Bounded Stir Station Card */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: 'min(94vh, 740px)',
        borderRadius: '24px',
        border: '2px solid rgba(57, 255, 20, 0.45)',
        backgroundColor: 'rgba(16, 12, 34, 0.98)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 35px rgba(57, 255, 20, 0.25)',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.65rem',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          paddingBottom: '0.55rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src="/sprites/avatar_apprentice.png"
              alt="Apprentice Alchemist"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '2px solid #39ff14',
                boxShadow: '0 0 12px rgba(57, 255, 20, 0.5)',
                objectFit: 'cover'
              }}
            />
            <div>
              <h2 className="font-mystic" style={{
                fontSize: '1.2rem',
                color: '#39ff14',
                margin: 0,
                textShadow: '0 0 12px rgba(57, 255, 20, 0.55)',
                letterSpacing: '0.5px',
                lineHeight: 1.15
              }}>
                LITTLE ALCHEMIST STIR STATION
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Apprentice Potion Brewing • Tap 3 Ingredients & Swirl!
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              flexShrink: 0
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Exit Stir Station"
          >
            <X size={22} />
          </button>
        </div>

        {/* Main Interactive Stage */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          width: '100%'
        }}>
          {/* 3 Ingredient Droplet Bubbles */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            padding: '0.45rem 1.4rem',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.4)'
          }}>
            {[0, 1, 2].map((idx) => {
              const item = selectedIngredients[idx];
              return (
                <div
                  key={idx}
                  onClick={() => item && handleRemoveIngredient(idx)}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    border: item ? `2.5px solid ${item.color}` : '2px dashed rgba(255, 255, 255, 0.35)',
                    backgroundColor: item ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: item ? `0 0 16px ${item.color}` : 'none',
                    transform: item ? 'scale(1.06)' : 'scale(1)',
                    cursor: item ? 'pointer' : 'default',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  title={item ? 'Tap to remove' : `Slot ${idx + 1}`}
                >
                  {item ? (
                    <img
                      src={item.sprite}
                      alt={item.name}
                      style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.15rem', color: '#64748b', fontWeight: 800 }}>{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Prompt Banner */}
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: isBrewed ? '#39ff14' : selectedIngredients.length < 3 ? '#ffbe0b' : '#38bdf8',
            textShadow: '0 2px 10px rgba(0,0,0,0.7)',
            textAlign: 'center',
            minHeight: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            {isBrewed
              ? '🎉 KABOOM! YOUR POTION IS READY!'
              : selectedIngredients.length < 3
                ? `👇 Tap ${3 - selectedIngredients.length} Ingredients to add to the Cauldron!`
                : `🥄 Drag/Swirl your finger or mouse over the pot to Stir! (${stirCount}/3)`}
          </div>

          {/* Interactive Cauldron & Spoon Arena with Pointer Swirl Tracking */}
          <div
            onClick={triggerStirStep}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: 'relative',
              width: '210px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: selectedIngredients.length === 3 && !isBrewed ? 'grab' : 'default',
              transform: isCauldronBouncing ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              touchAction: 'none'
            }}
          >
            {/* Expansive Pulsing Radial Aura */}
            <div style={{
              position: 'absolute',
              width: '210px',
              height: '210px',
              borderRadius: '50%',
              background: isBrewed
                ? 'radial-gradient(circle, #39ff14 0%, #bf5af2 60%, transparent 80%)'
                : selectedIngredients.length === 3
                  ? 'radial-gradient(circle, #ffbe0b 0%, #38bdf8 60%, transparent 80%)'
                  : 'radial-gradient(circle, #bf5af2 0%, transparent 72%)',
              opacity: 0.65,
              filter: 'blur(20px)',
              animation: 'pulseGlow 2.5s infinite ease-in-out'
            }} />

            {/* Crisp 1024x1024 Cauldron Artwork */}
            <img
              src={isBrewed ? '/sprites/cauldron_poof.png' : selectedIngredients.length === 3 ? '/sprites/cauldron_churning.png' : '/sprites/cauldron_bubble.png'}
              alt="Cauldron"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 5,
                pointerEvents: 'none',
                filter: isBrewed
                  ? 'drop-shadow(0 0 24px #39ff14) drop-shadow(0 8px 18px rgba(0,0,0,0.7))'
                  : 'drop-shadow(0 0 18px rgba(191, 90, 242, 0.65)) drop-shadow(0 8px 18px rgba(0,0,0,0.6))'
              }}
            />

            {/* Glowing Pedestal Shadow */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              width: '160px',
              height: '18px',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 70%)',
              zIndex: 2
            }} />

            {/* Interactive Wooden Stir Spoon (Smoothly angles with user gesture) */}
            {selectedIngredients.length === 3 && !isBrewed && (
              <div style={{
                position: 'absolute',
                top: '5px',
                right: '20px',
                zIndex: 10,
                fontSize: '3.6rem',
                transform: `rotate(${spoonAngle}deg) ${isStirringActive ? 'scale(1.15)' : 'scale(1)'}`,
                transformOrigin: 'bottom center',
                transition: isPointerDownRef.current ? 'none' : 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.65)) drop-shadow(0 0 10px #ffbe0b)',
                pointerEvents: 'none'
              }}>
                🥄
              </div>
            )}

            {/* Animated Swirl Guide Ring */}
            {selectedIngredients.length === 3 && !isBrewed && (
              <div style={{
                position: 'absolute',
                top: '25px',
                width: '130px',
                height: '52px',
                borderRadius: '50%',
                border: '3px dashed #ffbe0b',
                animation: 'spin 3s linear infinite',
                zIndex: 8,
                opacity: 0.85,
                pointerEvents: 'none'
              }} />
            )}
          </div>

          {/* 3-Step Stir Progress Beads */}
          {selectedIngredients.length === 3 && !isBrewed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 800 }}>Stir Progress:</span>
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: stirCount >= step ? '#39ff14' : 'rgba(255, 255, 255, 0.22)',
                    boxShadow: stirCount >= step ? '0 0 14px #39ff14' : 'none',
                    border: '2px solid rgba(255, 255, 255, 0.35)',
                    transform: stirCount >= step ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.25s ease'
                  }}
                />
              ))}
            </div>
          )}

          {/* Direct Stir Action Button (Also lets toddler tap easily) */}
          {selectedIngredients.length === 3 && !isBrewed && (
            <button
              onClick={triggerStirStep}
              style={{
                background: 'linear-gradient(135deg, #ffbe0b, #f59e0b)',
                border: 'none',
                color: '#090714',
                borderRadius: '999px',
                padding: '0.65rem 1.8rem',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 20px rgba(255, 190, 11, 0.6), 0 4px 12px rgba(0,0,0,0.5)',
                transform: isStirringActive ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>🥄 Tap or Swirl to Stir Pot! ({stirCount}/3)</span>
            </button>
          )}
        </div>

        {/* Bottom Controls / Ingredients Bar */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '0.65rem'
        }}>
          {isBrewed ? (
            /* Victory Replay Buttons */
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={handleReset}
                style={{
                  background: 'linear-gradient(135deg, #39ff14, #28cd41)',
                  border: 'none',
                  color: '#090714',
                  borderRadius: '999px',
                  padding: '0.8rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 25px rgba(57, 255, 20, 0.6)'
                }}
              >
                <RefreshCw size={20} />
                <span>Stir Another Potion! 🧒✨</span>
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '999px',
                  padding: '0.8rem 1.8rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Back to Quests
              </button>
            </div>
          ) : (
            /* 5 Big Friendly Ingredient Tap Cards (Directly beneath the cauldron) */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.55rem',
              width: '100%'
            }}>
              {TODDLER_INGREDIENTS.map((item) => {
                const countAdded = selectedIngredients.filter(i => i.name === item.name).length;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleAddIngredient(item)}
                    disabled={selectedIngredients.length >= 3}
                    style={{
                      background: 'linear-gradient(180deg, rgba(35, 28, 58, 0.95), rgba(20, 15, 38, 0.95))',
                      border: `2px solid ${item.color}`,
                      borderRadius: '16px',
                      padding: '0.5rem 0.35rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: selectedIngredients.length >= 3 ? 'default' : 'pointer',
                      opacity: selectedIngredients.length >= 3 ? 0.35 : 1,
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                    onMouseDown={(e) => {
                      if (selectedIngredients.length < 3) e.currentTarget.style.transform = 'scale(0.92)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={item.sprite}
                      alt={item.name}
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                    {countAdded > 0 && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        backgroundColor: item.color,
                        color: '#090714',
                        padding: '1px 6px',
                        borderRadius: '999px'
                      }}>
                        ✓ {countAdded}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
