import React, { useState } from 'react';
import type { CardData, GameMode, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop } from '../utils/audio';
import { Sparkles, X, Radio, ArrowRight } from 'lucide-react';

interface RelicAttunementModalProps {
  rune: RuneType | null;
  isOpen: boolean;
  cards: CardData[];
  scannedCardIds: string[];
  currentMode: GameMode;
  onStartQuest: (rune: RuneType, mode: GameMode) => void;
  onOpenSatchel: () => void;
  onClose: () => void;
}

export const RelicAttunementModal: React.FC<RelicAttunementModalProps> = ({
  rune,
  isOpen,
  cards,
  scannedCardIds,
  currentMode,
  onStartQuest,
  onOpenSatchel,
  onClose
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentMode);

  if (!isOpen || !rune) return null;

  const quest = QUESTS[rune];
  const questCards = cards.filter(c => c.runes.includes(rune));
  const collectedCount = questCards.filter(c => scannedCardIds.includes(c.id)).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 3, 15, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="glass-panel scrollable-modal-content"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: 'min(90vh, 90dvh)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          borderRadius: '24px',
          padding: '1.25rem 1.25rem calc(1.75rem + env(safe-area-inset-bottom, 20px)) 1.25rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
          border: `2px solid ${quest.color}`,
          boxShadow: `0 0 35px ${quest.glowColor}, 0 20px 45px rgba(0, 0, 0, 0.85)`,
          background: `radial-gradient(circle at 50% 20%, rgba(30, 20, 60, 0.9) 0%, rgba(9, 7, 20, 0.98) 100%)`,
          textAlign: 'center'
        }}
      >
        {/* Top Header */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(57, 255, 20, 0.15)',
            border: '1px solid #39ff14',
            color: '#39ff14',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            <Radio size={14} color="#39ff14" />
            <span>NFC RELIC BONDED</span>
          </div>

          <button
            onClick={() => {
              playBloop(0.9);
              onClose();
            }}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Totem Artwork */}
        <div style={{
          position: 'relative',
          width: '110px',
          height: '110px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0.1rem 0'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${quest.glowColor} 0%, transparent 70%)`,
            animation: 'pulseGlow 2s infinite ease-in-out'
          }} />
          <img
            src={quest.icon}
            alt={quest.title}
            style={{
              width: '90px',
              height: '90px',
              objectFit: 'contain',
              filter: `drop-shadow(0 0 16px ${quest.color})`,
              zIndex: 2
            }}
          />
        </div>

        {/* Quest Title & Flavor */}
        <div>
          <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.6rem', color: '#ffbe0b', lineHeight: 1.2 }}>
            {quest.title.toUpperCase()}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#cbd5e1', fontStyle: 'italic' }}>
            {quest.subtitle}
          </p>
        </div>

        {/* Mission Briefing */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '0.75rem 0.9rem',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.55rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: quest.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your 6 Assigned Quest Ingredients
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: collectedCount === 6 ? '#39ff14' : '#ffbe0b' }}>
              {collectedCount} / 6 Collected
            </span>
          </div>

          {/* 6 Ingredient Cards Grid - Mystery until scanned */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.35rem' }}>
            {questCards.map((c) => {
              const isFound = scannedCardIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 2px',
                    borderRadius: '8px',
                    backgroundColor: isFound ? 'rgba(57, 255, 20, 0.18)' : 'rgba(0, 0, 0, 0.45)',
                    border: `1px solid ${isFound ? '#39ff14' : 'rgba(255, 255, 255, 0.15)'}`,
                    opacity: isFound ? 1 : 0.75
                  }}
                  title={isFound ? `${c.name} - Discovered!` : `Mystery Clue - Search the rooms for posters with the ${quest.rune} rune!`}
                >
                  {isFound ? (
                    <img src={c.sprite} alt={c.name} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>❓</span>
                  )}
                  <span style={{
                    fontSize: '0.62rem',
                    color: isFound ? '#39ff14' : '#cbd5e1',
                    fontWeight: 700,
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {isFound ? c.name : 'Mystery'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.35 }}>
            💡 <strong>How to play:</strong> Walk through the realm and scan the posters bearing the <strong>{quest.rune} rune</strong> using your phone camera (or enter riddle answers in your satchel).
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div style={{
          width: '100%',
          display: 'flex',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setSelectedMode('kids')}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: selectedMode === 'kids' ? '#8338ec' : 'transparent',
              color: selectedMode === 'kids' ? '#ffffff' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🧒 Tiny Alchemist
          </button>
          <button
            onClick={() => setSelectedMode('adults')}
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: selectedMode === 'adults' ? '#8338ec' : 'transparent',
              color: selectedMode === 'adults' ? '#ffffff' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🧙 Master Alchemist
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button
            onClick={() => {
              playBloop(1.2);
              onClose();
              onStartQuest(rune, selectedMode);
            }}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '14px',
              backgroundColor: '#39ff14',
              color: '#090714',
              fontSize: '0.95rem',
              fontWeight: 900,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(57, 255, 20, 0.4)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Sparkles size={18} />
            <span>START {quest.rune.toUpperCase()} QUEST HUNT</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => {
              playBloop(1.1);
              onClose();
              onOpenSatchel();
            }}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: '1px solid rgba(255, 255, 255, 0.18)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem'
            }}
          >
            <span>🎒 Open Satchel Tracker ({collectedCount}/6)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
