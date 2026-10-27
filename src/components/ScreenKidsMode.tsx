import React, { useState, useMemo } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playPoof, playStoneLock } from '../utils/audio';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';

interface ScreenKidsModeProps {
  questRune: RuneType;
  cards: CardData[];
  onBack: () => void;
  onWin: (attempts: number) => void;
}

export const ScreenKidsMode: React.FC<ScreenKidsModeProps> = ({
  questRune,
  cards,
  onBack,
  onWin
}) => {
  const quest = QUESTS[questRune];
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [lockedCorrectIds, setLockedCorrectIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [shakingCardIds, setShakingCardIds] = useState<string[]>([]);
  // Find all cards that actually have this rune (6 cards)
  const matchingCards = useMemo(() => cards.filter(c => c.runes.includes(questRune)), [cards, questRune]);
  const matchingCardIds = useMemo(() => new Set(matchingCards.map(c => c.id)), [matchingCards]);

  // Exactly 10 total ingredients: 6 matching + 4 decoys (sorted by card number)
  const displayCards = useMemo(() => {
    const decoys = cards.filter(c => !c.runes.includes(questRune)).slice(0, 4);
    return [...matchingCards, ...decoys].sort((a, b) => a.number - b.number);
  }, [cards, matchingCards, questRune]);

  const toggleSelectCard = (cardId: string) => {
    // If it's already permanently locked as correct, keep it
    if (lockedCorrectIds.includes(cardId)) {
      playBloop(1.4);
      return;
    }

    if (selectedCardIds.includes(cardId)) {
      playBloop(0.85);
      setSelectedCardIds(prev => prev.filter(id => id !== cardId));
      setFeedbackMessage(null);
    } else {
      if (selectedCardIds.length >= 6) {
        playPoof();
        setFeedbackMessage('You have 6 ingredients picked! Tap one to swap it out.');
        return;
      }
      playBloop(1.15);
      setSelectedCardIds(prev => [...prev, cardId]);
      setFeedbackMessage(null);
    }
  };

  const handleBrew = () => {
    const newAttempt = attempts + 1;
    setAttempts(newAttempt);

    // Calculate how many are correct
    const correctIds = selectedCardIds.filter(id => matchingCardIds.has(id));
    const wrongIds = selectedCardIds.filter(id => !matchingCardIds.has(id));

    if (correctIds.length === 6 && wrongIds.length === 0) {
      // Perfect match!
      playStoneLock();
      onWin(newAttempt);
    } else {
      const newWrong = wrongAttempts + 1;
      setWrongAttempts(newWrong);
      playPoof();

      // Lock in correct ones found so far
      const updatedLocked = Array.from(new Set([...lockedCorrectIds, ...correctIds]));
      setLockedCorrectIds(updatedLocked);
      setShakingCardIds(wrongIds);

      // Deselect wrong cards after shake
      setTimeout(() => {
        setSelectedCardIds(correctIds);
        setShakingCardIds([]);
      }, 700);

      if (correctIds.length === 0) {
        setFeedbackMessage(
          `🧪 The cauldron fizzled! 0 of those ingredients match your ${quest.totemName} recipe. Look around the office for posters with the ${quest.totemName} rune!`
        );
      } else {
        setFeedbackMessage(
          `🧪 Bubbling! Locked ${correctIds.length} of 6 correct ingredients! Keep searching for the remaining ${6 - correctIds.length}!`
        );
      }
    }
  };

  const selectedCount = selectedCardIds.length;

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%',
      padding: '0.65rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {/* Top Header Navigation & Progress Bar */}
      <div className="glass-panel" style={{
        padding: '0.65rem 1rem',
        borderRadius: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderLeft: `4px solid ${quest.color}`
      }}>
        {/* Back button and Quest title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Return to Totem Hub"
          >
            <ArrowLeft size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img
              src={quest.icon}
              alt={quest.title}
              style={{ width: '40px', height: '40px', filter: `drop-shadow(0 0 8px ${quest.color})` }}
            />
            <div>
              <div style={{ fontSize: '0.72rem', color: quest.color, fontWeight: 700, textTransform: 'uppercase' }}>
                Apprentice Alchemist Quest
              </div>
              <h2 className="font-mystic" style={{ fontSize: '1.2rem', margin: 0, color: '#f8fafc' }}>
                {quest.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* 6 Potion Droplet Tracker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            backgroundColor: 'rgba(15, 11, 30, 0.75)',
            padding: '5px 14px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
              Progress: {selectedCount} / 6
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[0, 1, 2, 3, 4, 5].map(idx => {
                const isFilled = idx < selectedCount;
                return (
                  <div
                    key={idx}
                    style={{
                      width: '16px',
                      height: '20px',
                      borderRadius: '50% 50% 40% 40%',
                      backgroundColor: isFilled ? quest.color : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: isFilled ? `0 0 8px ${quest.color}` : 'none',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Friendly Feedback Message Banner */}
      {feedbackMessage && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
          border: '1px solid rgba(147, 51, 234, 0.5)',
          padding: '0.6rem 1rem',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#f8fafc',
          fontSize: '0.88rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <Sparkles size={16} color="#38bdf8" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Exactly 10-Card Picture Tap Grid (5x2 Layout for iPad 4:3) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.75rem',
        width: '100%'
      }}>
        {displayCards.map((card) => {
          const isSelected = selectedCardIds.includes(card.id);
          const isLocked = lockedCorrectIds.includes(card.id);
          const isShaking = shakingCardIds.includes(card.id);

          return (
            <div
              key={card.id}
              onClick={() => toggleSelectCard(card.id)}
              className={`ingredient-tap-card ${isLocked ? 'locked' : ''} ${isShaking ? 'animate-shake' : ''}`}
              style={{
                position: 'relative',
                background: isSelected 
                  ? 'linear-gradient(180deg, rgba(45, 34, 75, 0.95), rgba(28, 20, 52, 0.95))'
                  : 'linear-gradient(180deg, rgba(25, 20, 48, 0.8), rgba(15, 11, 30, 0.8))',
                border: isLocked
                  ? '3px solid #39ff14'
                  : isSelected 
                    ? `3px solid ${quest.color}` 
                    : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '0.65rem 0.5rem 0.5rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                justifyContent: 'space-between',
                minHeight: '190px',
                cursor: isLocked ? 'default' : 'pointer',
                boxShadow: isLocked
                  ? '0 0 20px rgba(57, 255, 20, 0.5)'
                  : isSelected 
                    ? `0 10px 25px rgba(0, 0, 0, 0.5), 0 0 16px ${quest.glowColor}` 
                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden'
              }}
            >
              {/* Checkmark badge */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isLocked ? '#39ff14' : quest.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                  zIndex: 10
                }}>
                  <Check size={15} strokeWidth={3} />
                </div>
              )}

              {/* Card Number Pill */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '999px'
              }}>
                #{card.number}
              </div>

              {/* Clean Transparent Sprite Art */}
              <div style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0.3rem 0 0.1rem 0'
              }}>
                <img
                  src={card.sprite}
                  alt={card.name}
                  className="ingredient-img"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: isSelected ? `drop-shadow(0 0 10px ${quest.color})` : 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
                    transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              </div>

              {/* Title */}
              <div style={{
                minHeight: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '0 4px'
              }}>
                <h3 style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  margin: 0,
                  textAlign: 'center',
                  lineHeight: 1.2
                }}>
                  {card.name}
                </h3>
              </div>

              {/* Status footer */}
              <div style={{
                fontSize: '0.68rem',
                color: isLocked ? '#39ff14' : isSelected ? quest.color : '#94a3b8',
                fontWeight: 700,
                marginTop: 'auto',
                letterSpacing: '0.5px'
              }}>
                {isLocked ? '✓ RECIPE LOCKED' : isSelected ? 'SELECTED' : 'Tap to Pick'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer: Big Brew Button */}
      <div style={{
        position: 'sticky',
        bottom: '0.5rem',
        display: 'flex',
        justifyContent: 'center',
        padding: '0.3rem 0',
        zIndex: 40
      }}>
        <button
          onClick={handleBrew}
          disabled={selectedCount !== 6}
          style={{
            background: selectedCount === 6
              ? `linear-gradient(135deg, ${quest.color}, ${quest.accentColor})`
              : 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: selectedCount === 6 ? '#090714' : '#64748b',
            borderRadius: '999px',
            padding: '0.85rem 2.6rem',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: selectedCount === 6 ? 'pointer' : 'not-allowed',
            boxShadow: selectedCount === 6 
              ? `0 10px 25px rgba(0, 0, 0, 0.5), 0 0 25px ${quest.color}` 
              : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: selectedCount === 6 ? 'scale(1.04)' : 'scale(1)'
          }}
        >
          <Sparkles size={22} />
          <span>{selectedCount === 6 ? '🔥 BREW POTION NOW!' : `Pick ${6 - selectedCount} More Ingredients`}</span>
        </button>
      </div>
    </div>
  );
};
