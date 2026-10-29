import React, { useState, useEffect, useCallback } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playAmberChime, playBloop, playPoof, playStoneLock } from '../utils/audio';
import { ArrowLeft, Sparkles, Delete, RotateCcw } from 'lucide-react';

interface ScreenAdultsModeProps {
  questRune: RuneType;
  cards: CardData[];
  onBack: () => void;
  onWin: (attempts: number, purity: number) => void;
}

export const ScreenAdultsMode: React.FC<ScreenAdultsModeProps> = ({
  questRune,
  cards,
  onBack,
  onWin
}) => {
  const quest = QUESTS[questRune];
  const targetWord = quest.secretWord.toUpperCase(); // 6 letters (e.g. SPIDER, SHADOW, etc.)

  // Cards that carry this rune in the realm
  const questCards = cards.filter(c => c.runes.includes(questRune));

  // Game state
  const [attempts, setAttempts] = useState(1);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [purity, setPurity] = useState(100);
  
  // Permanent green locked letters by index (0-5)
  const [lockedSlots, setLockedSlots] = useState<{ [index: number]: string }>({});

  // Current working guess in slots (6 slots)
  const [currentSlots, setCurrentSlots] = useState<string[]>(['', '', '', '', '', '']);

  // Letters confirmed to be in the word (amber discovered)
  const [discoveredLetters, setDiscoveredLetters] = useState<Set<string>>(new Set());

  // Letters confirmed NOT in the word (darkened/eliminated)
  const [eliminatedLetters, setEliminatedLetters] = useState<Set<string>>(new Set());

  // Slot status for flashing animation ('green' | 'amber' | 'wrong' | null)
  const [slotFeedback, setSlotFeedback] = useState<('green' | 'amber' | 'wrong' | null)[]>([null, null, null, null, null, null]);

  // Selected hint card popup
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);

  // Initialize locked slots into currentSlots
  useEffect(() => {
    setCurrentSlots(prev => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) {
        if (lockedSlots[i]) {
          next[i] = lockedSlots[i];
        }
      }
      return next;
    });
  }, [lockedSlots]);

  // Handle typing a letter with smart skip-locked-letter flow
  const handleInputLetter = useCallback((char: string) => {
    const letter = char.toUpperCase();
    if (!/^[A-Z]$/.test(letter)) return;

    let targetSlot = cursorIndex;

    // If cursor is past slot 5, reset to first empty unlocked slot if any
    if (targetSlot >= 6) {
      const firstEmpty = currentSlots.findIndex((c, i) => !lockedSlots[i] && !c);
      if (firstEmpty !== -1) {
        targetSlot = firstEmpty;
      } else {
        playPoof();
        return;
      }
    }

    // 1. If targetSlot is locked and matches the letter typed:
    // (e.g. slot 0 is locked with 'S' and user presses 'S')
    // Acknowledge the locked letter, skip it as already pressed, and advance cursor!
    if (lockedSlots[targetSlot] === letter) {
      playBloop(1.15);
      setCursorIndex(Math.min(6, targetSlot + 1));
      return;
    }

    // 2. If targetSlot is locked with a different letter, scan forward past locked slots:
    // If the user typed a letter matching an upcoming locked slot, acknowledge that locked slot.
    // Otherwise stop at the first unlocked slot!
    while (targetSlot < 6 && lockedSlots[targetSlot]) {
      if (lockedSlots[targetSlot] === letter) {
        // User typed an upcoming locked slot letter!
        playBloop(1.15);
        setCursorIndex(Math.min(6, targetSlot + 1));
        return;
      }
      targetSlot++;
    }

    // 3. Now targetSlot is at an unlocked slot (< 6)
    if (targetSlot < 6 && !lockedSlots[targetSlot]) {
      playBloop(1.1);
      setCurrentSlots(prev => {
        const next = [...prev];
        next[targetSlot] = letter;
        return next;
      });
      setCursorIndex(Math.min(6, targetSlot + 1));
      return;
    }

    // 4. If we reached slot 6 without filling, find any other open slot on the board
    const firstEmpty = currentSlots.findIndex((c, i) => !lockedSlots[i] && !c);
    if (firstEmpty !== -1) {
      playBloop(1.1);
      setCurrentSlots(prev => {
        const next = [...prev];
        next[firstEmpty] = letter;
        return next;
      });
      setCursorIndex(Math.min(6, firstEmpty + 1));
    } else {
      playPoof();
    }
  }, [lockedSlots, currentSlots, cursorIndex]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    // Find rightmost unlocked slot with a letter up to cursorIndex - 1
    for (let i = Math.min(5, cursorIndex - 1); i >= 0; i--) {
      if (!lockedSlots[i] && currentSlots[i]) {
        playBloop(0.85);
        setCurrentSlots(prev => {
          const next = [...prev];
          next[i] = '';
          return next;
        });
        setCursorIndex(i);
        return;
      }
    }

    // Or anywhere on board
    for (let i = 5; i >= 0; i--) {
      if (!lockedSlots[i] && currentSlots[i]) {
        playBloop(0.85);
        setCurrentSlots(prev => {
          const next = [...prev];
          next[i] = '';
          return next;
        });
        setCursorIndex(i);
        return;
      }
    }

    // Reset cursor to 0
    setCursorIndex(0);
  }, [cursorIndex, lockedSlots, currentSlots]);

  // Handle clear non-locked
  const handleClear = useCallback(() => {
    playPoof();
    setCurrentSlots(prev => {
      const next = [...prev];
      for (let i = 0; i < 6; i++) {
        if (!lockedSlots[i]) {
          next[i] = '';
        }
      }
      return next;
    });
    setCursorIndex(0);
  }, [lockedSlots]);

  // Handle Incantation Submission (Word-Lock Check)
  const handleSubmit = useCallback(() => {
    // Must fill all 6 slots
    if (currentSlots.some(ch => !ch)) {
      playPoof();
      return;
    }

    const newFeedback: ('green' | 'amber' | 'wrong' | null)[] = [null, null, null, null, null, null];
    const newLocked: { [index: number]: string } = { ...lockedSlots };
    const newDiscovered = new Set(discoveredLetters);
    const newEliminated = new Set(eliminatedLetters);

    let greenCount = 0;
    let hasAmber = false;

    for (let i = 0; i < 6; i++) {
      const char = currentSlots[i];
      if (char === targetWord[i]) {
        // Correct letter & position!
        newFeedback[i] = 'green';
        newLocked[i] = char;
        newDiscovered.add(char);
        greenCount++;
      } else if (targetWord.includes(char)) {
        // Correct letter, wrong spot!
        newFeedback[i] = 'amber';
        newDiscovered.add(char);
        hasAmber = true;
      } else {
        // Not in word at all
        newFeedback[i] = 'wrong';
        newEliminated.add(char);
      }
    }

    setSlotFeedback(newFeedback);
    setLockedSlots(newLocked);
    setDiscoveredLetters(newDiscovered);
    setEliminatedLetters(newEliminated);

    if (greenCount === 6) {
      // VICTORY!
      playStoneLock();
      setTimeout(() => {
        onWin(attempts, purity);
      }, 700);
      return;
    }

    // Audio feedback for partial result
    if (greenCount > Object.keys(lockedSlots).length) {
      playStoneLock();
    } else if (hasAmber) {
      playAmberChime();
    } else {
      playPoof();
    }

    // Advance attempt & decrease purity slightly
    setAttempts(a => a + 1);
    setPurity(p => Math.max(70, p - 5));

    // Clear feedback and reset non-locked slots after a brief delay
    setTimeout(() => {
      setSlotFeedback([null, null, null, null, null, null]);
      setCurrentSlots(() => {
        const reset = ['', '', '', '', '', ''];
        for (let i = 0; i < 6; i++) {
          if (newLocked[i]) reset[i] = newLocked[i];
        }
        return reset;
      });
      // Set cursor to the first unlocked slot
      const firstUnlocked = [0, 1, 2, 3, 4, 5].find(i => !newLocked[i]) ?? 0;
      setCursorIndex(firstUnlocked);
    }, 1200);
  }, [currentSlots, lockedSlots, targetWord, discoveredLetters, eliminatedLetters, attempts, purity, onWin]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInputLetter(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackspace, handleSubmit, handleClear, handleInputLetter]);

  // Keyboard Rows
  const row1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const row2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const row3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  const allFilled = currentSlots.every(c => !!c);

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      width: '100%',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Top Header Banner */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1.25rem',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        borderLeft: `4px solid ${quest.color}`
      }}>
        {/* Back and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              playBloop(0.9);
              onBack();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Return to Alchemy Lab (R&D)"
          >
            <ArrowLeft size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img
              src={quest.icon}
              alt={quest.title}
              style={{ width: '42px', height: '42px', filter: `drop-shadow(0 0 8px ${quest.color})` }}
            />
            <div>
              <div style={{ fontSize: '0.75rem', color: quest.color, fontWeight: 700, textTransform: 'uppercase' }}>
                Master Alchemist Cipher Lock
              </div>
              <h2 className="font-mystic" style={{ fontSize: '1.25rem', margin: 0, color: '#f8fafc' }}>
                {quest.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Attempt & Purity Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'rgba(15, 11, 30, 0.65)',
          padding: '6px 16px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Cast Attempt: <strong style={{ color: '#ffffff' }}>#{attempts}</strong>
          </div>
          <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ fontSize: '0.82rem', color: purity > 85 ? '#39ff14' : '#ffbe0b' }}>
            Elixir Purity: <strong>{purity}%</strong>
          </div>
        </div>
      </div>

      {/* Center 6 Runic Stone Lock Slots */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem',
        padding: '1.5rem 0 0.5rem 0'
      }}>
        <div style={{
          fontSize: '0.85rem',
          color: '#cbd5e1',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 700
        }}>
          Unscramble the 6 First Letters of Your Riddles:
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          width: '100%'
        }}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const letter = currentSlots[idx];
            const isLocked = !!lockedSlots[idx];
            const feedback = slotFeedback[idx];
            const isActiveCursor = cursorIndex === idx && !isLocked;

            let bgColor = 'rgba(255, 255, 255, 0.05)';
            let borderColor = 'rgba(255, 255, 255, 0.18)';
            let textColor = '#ffffff';
            let shadow = '0 6px 16px rgba(0,0,0,0.4)';

            if (isLocked || feedback === 'green') {
              bgColor = 'rgba(5, 46, 22, 0.9)';
              borderColor = '#39ff14';
              textColor = '#39ff14';
              shadow = '0 0 20px rgba(57, 255, 20, 0.6)';
            } else if (feedback === 'amber') {
              bgColor = 'rgba(69, 26, 3, 0.9)';
              borderColor = '#f59e0b';
              textColor = '#f59e0b';
              shadow = '0 0 20px rgba(245, 158, 11, 0.6)';
            } else if (feedback === 'wrong') {
              bgColor = 'rgba(30, 20, 30, 0.8)';
              borderColor = '#ef4444';
              textColor = '#94a3b8';
            } else if (isActiveCursor) {
              borderColor = '#38bdf8';
              shadow = '0 0 20px rgba(56, 189, 248, 0.7)';
              bgColor = 'rgba(56, 189, 248, 0.12)';
            } else if (letter) {
              borderColor = quest.color;
              shadow = `0 0 12px ${quest.glowColor}`;
            }

            return (
              <div
                key={idx}
                onClick={() => {
                  if (!isLocked) {
                    playBloop(1.0);
                    setCursorIndex(idx);
                  }
                }}
                style={{
                  width: 'clamp(52px, 12vw, 84px)',
                  height: 'clamp(64px, 14vw, 96px)',
                  borderRadius: '16px',
                  background: bgColor,
                  border: `3px solid ${borderColor}`,
                  boxShadow: shadow,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: isLocked ? 'scale(1.02)' : isActiveCursor ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: isLocked ? 'default' : 'pointer'
                }}
                title={isLocked ? `Slot #${idx + 1} locked!` : `Slot #${idx + 1} - Tap to type here`}
              >
                {/* Slot index number */}
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  left: '8px',
                  fontSize: '0.65rem',
                  color: isLocked ? '#39ff14' : isActiveCursor ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)',
                  fontWeight: 700
                }}>
                  #{idx + 1}
                </span>

                {/* Letter */}
                <span className="font-mystic" style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                  fontWeight: 900,
                  color: textColor,
                  textShadow: isLocked ? '0 0 12px #39ff14' : isActiveCursor ? '0 0 12px #38bdf8' : 'none'
                }}>
                  {letter || '_'}
                </span>

                {/* Locked chains or active cursor pointer */}
                {isLocked ? (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    fontSize: '0.65rem',
                    color: '#39ff14',
                    fontWeight: 800,
                    letterSpacing: '0.5px'
                  }}>
                    LOCKED
                  </div>
                ) : isActiveCursor ? (
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    lineHeight: 1
                  }}>
                    ▲
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Discovered Letters Tray (Amber feedback) */}
        {discoveredLetters.size > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            color: '#fbbf24',
            marginTop: '0.2rem'
          }}>
            <Sparkles size={14} />
            <span>Confirmed Letters in Word:</span>
            <div style={{ display: 'flex', gap: '4px', fontWeight: 800 }}>
              {Array.from(discoveredLetters).sort().map(ch => (
                <span
                  key={ch}
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.25)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    color: '#ffffff'
                  }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reference Card Strip (Clean 6-Card Grid Aligned with Slots & Keyboard) */}
      <div className="glass-panel" style={{
        padding: '0.65rem 1rem',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
        maxWidth: '750px',
        margin: '0 auto'
      }}>
        <div style={{
          fontSize: '0.74rem',
          color: '#cbd5e1',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}>
          CARDS WITH {quest.title.toUpperCase()} RUNE (TAP TO VIEW RIDDLE CLUE):
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.45rem',
          width: '100%'
        }}>
          {questCards.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                playBloop(1.0);
                setInspectedCard(card);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px',
                padding: '6px 4px',
                color: '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = quest.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title={`Card #${card.number}: ${card.name} - Tap to view riddle`}
            >
              <img src={card.sprite} alt={card.name} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {card.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Inspected Card Clue Modal (if user taps an ingredient chip) */}
      {inspectedCard && (
        <div style={{
          background: 'rgba(15, 11, 30, 0.95)',
          border: `2px solid ${quest.color}`,
          borderRadius: '16px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: `0 0 20px ${quest.glowColor}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img src={inspectedCard.sprite} alt={inspectedCard.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: quest.color, fontWeight: 700 }}>
                CARD #{inspectedCard.number} • {inspectedCard.name.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.35 }}>
                  "{inspectedCard.riddle.replace(/\s*\(Take my 1st letter!\)/i, '')}"
                </div>
                <div style={{ fontSize: '0.82rem', color: '#ffbe0b', fontWeight: 800, marginTop: '4px' }}>
                  ✨ (Take my 1st letter!)
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setInspectedCard(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* On-Screen Alchemist Fantasy Touch Keyboard */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.45rem',
        width: '100%',
        maxWidth: '750px',
        margin: '0 auto'
      }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', width: '100%' }}>
          {row1.map(char => renderKey(char))}
        </div>
        {/* Row 2 */}
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', width: '100%' }}>
          {row2.map(char => renderKey(char))}
        </div>
        {/* Row 3 with Backspace & Clear */}
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', width: '100%' }}>
          <button
            onClick={handleClear}
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            title="Clear Unlocked Slots"
          >
            <RotateCcw size={15} />
          </button>
          {row3.map(char => renderKey(char))}
          <button
            onClick={handleBackspace}
            style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            title="Backspace"
          >
            <Delete size={16} />
          </button>
        </div>
      </div>

      {/* Action Footer: CAST INCANTATION BUTTON */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0.5rem 0'
      }}>
        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          style={{
            background: allFilled 
              ? `linear-gradient(135deg, ${quest.color}, ${quest.accentColor})`
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: allFilled ? '#090714' : '#64748b',
            borderRadius: '999px',
            padding: '1rem 2.8rem',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: allFilled ? 'pointer' : 'not-allowed',
            boxShadow: allFilled ? `0 10px 25px rgba(0,0,0,0.5), 0 0 25px ${quest.color}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: allFilled ? 'scale(1.04)' : 'scale(1)'
          }}
        >
          <Sparkles size={22} />
          <span>{allFilled ? '🔥 CAST INCANTATION (SUBMIT)' : 'Fill All 6 Slots to Cast'}</span>
        </button>
      </div>
    </div>
  );

  function renderKey(char: string) {
    const isEliminated = eliminatedLetters.has(char);
    const isDiscovered = discoveredLetters.has(char);

    return (
      <button
        key={char}
        onClick={() => handleInputLetter(char)}
        disabled={isEliminated}
        style={{
          flex: 1,
          maxWidth: '54px',
          height: '46px',
          borderRadius: '10px',
          border: isDiscovered 
            ? '2px solid #f59e0b' 
            : '1px solid rgba(255, 255, 255, 0.15)',
          background: isEliminated 
            ? 'rgba(15, 11, 26, 0.5)' 
            : isDiscovered 
              ? 'rgba(245, 158, 11, 0.25)' 
              : 'rgba(35, 28, 58, 0.85)',
          color: isEliminated 
            ? '#475569' 
            : isDiscovered 
              ? '#fbbf24' 
              : '#f8fafc',
          fontSize: '1.05rem',
          fontWeight: 700,
          cursor: isEliminated ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          transition: 'all 0.15s ease'
        }}
      >
        {char}
      </button>
    );
  }
};
