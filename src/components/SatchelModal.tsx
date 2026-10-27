import React, { useState, useEffect } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { playBloop, playPoof, getAudioState, subscribeAudioState, toggleMusic } from '../utils/audio';
import { findCardFromScanQuery } from '../utils/nfc';
import { CameraQrScannerModal } from './CameraQrScannerModal';
import { X, Sparkles, Lock, Radio, MapPin, Camera, Volume2, VolumeX } from 'lucide-react';

interface SatchelModalProps {
  isOpen: boolean;
  cards: CardData[];
  scannedCardIds: string[];
  onClose: () => void;
  onClearCollection: () => void;
  onCardScanned: (card: CardData) => void;
  onTriggerVictory: (rune: RuneType) => void;
}

export const SatchelModal: React.FC<SatchelModalProps> = ({
  isOpen,
  cards,
  scannedCardIds,
  onClose,
  onClearCollection,
  onCardScanned,
  onTriggerVictory
}) => {
  const [selectedInspectCard, setSelectedInspectCard] = useState<CardData | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => getAudioState().isMuted);

  useEffect(() => {
    return subscribeAudioState(state => {
      setIsAudioMuted(state.isMuted);
    });
  }, []);

  const handleCameraCodeDetected = (code: string) => {
    setIsCameraScannerOpen(false);
    const matched = findCardFromScanQuery(code, cards);
    if (matched) {
      onCardScanned(matched);
    } else {
      alert(`Scanned code: "${code}", but could not find a matching card in this quest.`);
    }
  };

  if (!isOpen) return null;

  const collectedCount = scannedCardIds.length;
  const totalCount = cards.length;
  const progressRatio = totalCount > 0 ? collectedCount / totalCount : 0;

  // Calculate readiness for each of the 4 quests
  const questStatus = (['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(rune => {
    const quest = QUESTS[rune];
    const questCards = cards.filter(c => c.runes.includes(rune));
    const collectedMatching = questCards.filter(c => scannedCardIds.includes(c.id));
    const isComplete = questCards.length > 0 && collectedMatching.length === questCards.length;

    return {
      rune,
      quest,
      total: questCards.length,
      collected: collectedMatching.length,
      isComplete,
      matchingCards: questCards
    };
  });

  const grandMasterComplete = collectedCount === totalCount && totalCount > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        backgroundColor: 'rgba(5, 3, 15, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c081e',
          border: '2px solid rgba(191, 90, 242, 0.4)',
          boxShadow: '0 0 30px rgba(191, 90, 242, 0.3), 0 20px 45px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to right, rgba(131, 56, 236, 0.25), rgba(9, 7, 20, 0.8))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🎒</span>
            <div>
              <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
                Alchemist's Satchel
              </h2>
            </div>
          </div>

          {/* Header Controls: Audio Mute, Camera Scanner, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Quick Audio Mute / Unmute */}
            <button
              onClick={() => {
                playBloop(1.0);
                toggleMusic();
              }}
              title={isAudioMuted ? "Unmute room music" : "Mute room music (Silent Office Mode)"}
              style={{
                backgroundColor: isAudioMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                border: isAudioMuted ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAudioMuted ? '#f87171' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Quick In-App Camera QR Scanner */}
            <button
              onClick={() => {
                playBloop(1.1);
                setIsCameraScannerOpen(true);
              }}
              title="Open camera to scan poster QR code"
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <Camera size={14} />
              <span>Scan QR</span>
            </button>

            <button
              onClick={() => {
                playBloop(0.9);
                onClose();
              }}
              aria-label="Close satchel modal"
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
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem'
        }}>
          {/* Progress Overview Banner */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                Total Office Ingredients Found
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {collectedCount > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Empty your satchel to start over?')) {
                        onClearCollection();
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    title="Empty Satchel"
                  >
                    Empty
                  </button>
                )}
                <strong style={{ fontSize: '1.1rem', color: '#39ff14', fontFamily: 'monospace' }}>
                  {collectedCount} / {totalCount}
                </strong>
              </div>
            </div>

            {/* Glowing Progress Bar */}
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                height: '100%',
                width: `${progressRatio * 100}%`,
                background: 'linear-gradient(to right, #8338ec, #39ff14)',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
                boxShadow: '0 0 10px #39ff14'
              }} />
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
              💡 Scan NFC stickers on wall cards around the office with your phone or point your camera at the QR code to claim ingredients.
            </p>
          </div>

          {/* Explorer's Dual Scan Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.65rem'
          }}>
            <button
              onClick={() => {
                playBloop(1.1);
                setIsCameraScannerOpen(true);
              }}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                border: '1.5px solid #38bdf8',
                borderRadius: '12px',
                padding: '0.75rem 0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#f8fafc',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
              }}
            >
              <Camera size={18} color="#38bdf8" />
              <span>Scan QR Code</span>
            </button>

            <button
              onClick={() => {
                playBloop(1.1);
                alert("📱 How NFC Works on iPhone & Android:\n\n• iPhone: Hold the top edge of your phone against any wall poster sticker. iOS will show a banner to claim!\n• Android: Tap the poster sticker directly.\n• Or use 'Scan QR Code' with your camera!");
              }}
              style={{
                backgroundColor: 'rgba(57, 255, 20, 0.08)',
                border: '1.5px solid rgba(57, 255, 20, 0.45)',
                borderRadius: '12px',
                padding: '0.75rem 0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#39ff14',
                fontWeight: 700,
                fontSize: '0.84rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <Radio size={16} color="#39ff14" />
              <span>📱 Tap with NFC</span>
            </button>
          </div>

          {/* Quest Readiness Cards */}
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#ffbe0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Elemental Totem Quests
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              {questStatus.map(q => (
                <div
                  key={q.rune}
                  style={{
                    backgroundColor: q.isComplete ? 'rgba(57, 255, 20, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${q.isComplete ? '#39ff14' : q.quest.color}`,
                    borderRadius: '12px',
                    padding: '0.65rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    boxShadow: q.isComplete ? '0 0 12px rgba(57, 255, 20, 0.3)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <img src={q.quest.icon} alt={q.rune} style={{ width: '18px', height: '18px' }} />
                      <strong style={{ fontSize: '0.82rem', color: '#f8fafc', textTransform: 'capitalize' }}>
                        {q.rune}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: q.isComplete ? '#39ff14' : q.quest.color
                    }}>
                      {q.collected} / {q.total}
                    </span>
                  </div>

                  {q.isComplete ? (
                    <button
                      onClick={() => {
                        playBloop(1.2);
                        onClose();
                        onTriggerVictory(q.rune);
                      }}
                      style={{
                        backgroundColor: '#39ff14',
                        color: '#090714',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 6px',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        boxShadow: '0 0 8px #39ff14'
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Brew & Win!</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      {q.collected} / {q.total} Ingredients
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Grand Victory Button if All 12 Found */}
          {grandMasterComplete && (
            <div style={{
              backgroundColor: 'rgba(255, 190, 11, 0.15)',
              border: '2px solid #ffbe0b',
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(255, 190, 11, 0.4)'
            }}>
              <div style={{ fontSize: '1.5rem' }}>👑 ✨ 🧪</div>
              <strong style={{ color: '#ffbe0b', fontSize: '1rem' }}>
                GRAND MASTER ALCHEMIST COMPLETED!
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
                You have scanned and secured all 12 ingredients in the office!
              </p>
              <button
                onClick={() => {
                  playBloop(1.3);
                  onClose();
                  onTriggerVictory('moon');
                }}
                style={{
                  backgroundColor: '#ffbe0b',
                  color: '#090714',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px #ffbe0b'
                }}
              >
                Claim Grand Master Clicker Prize! 🏆
              </button>
            </div>
          )}

          {/* 12 Ingredient Tokens Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Ingredient Pocket ({collectedCount}/12)
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Tap any collected item to view riddle clue
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '0.65rem'
            }}>
              {cards.map(card => {
                const isCollected = scannedCardIds.includes(card.id);

                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      if (isCollected) {
                        playBloop(1.1);
                        setSelectedInspectCard(card);
                      } else {
                        playPoof();
                      }
                    }}
                    style={{
                      background: isCollected ? 'rgba(30, 20, 50, 0.7)' : 'rgba(15, 12, 28, 0.6)',
                      border: isCollected ? '1.5px solid #39ff14' : '1px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '0.55rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: isCollected ? 'pointer' : 'default',
                      position: 'relative',
                      opacity: isCollected ? 1 : 0.45,
                      boxShadow: isCollected ? '0 0 10px rgba(57, 255, 20, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: isCollected ? '#39ff14' : '#64748b'
                    }}>
                      #{card.number}
                    </div>

                    {/* Sprite or Lock */}
                    <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isCollected ? (
                        <img
                          src={card.sprite}
                          alt={card.name}
                          style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                        />
                      ) : (
                        <Lock size={22} color="#64748b" />
                      )}
                    </div>

                    {/* Name */}
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: isCollected ? '#ffffff' : '#94a3b8',
                      textAlign: 'center',
                      lineHeight: 1.2
                    }}>
                      {isCollected ? card.name : 'Unknown Token'}
                    </div>

                    {/* Rune Badges */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {card.runes.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: QUESTS[r].color
                          }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Inspect Modal (When clicking a collected card) */}
          {selectedInspectCard && (
            <div
              style={{
                backgroundColor: '#17112c',
                border: '1px solid #bf5af2',
                borderRadius: '16px',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                animation: 'popIn 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: '#ffbe0b', fontSize: '0.95rem' }}>
                  #{selectedInspectCard.number} {selectedInspectCard.name}
                </strong>
                <button
                  onClick={() => setSelectedInspectCard(null)}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {selectedInspectCard.location && (
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={12} />
                  <span>{selectedInspectCard.location}</span>
                </div>
              )}

              <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{selectedInspectCard.riddle.replace(/\s*\(Take my 1st letter!\)/i, '')}"
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 190, 11, 0.1)',
                border: '1px solid rgba(255, 190, 11, 0.25)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                color: '#ffbe0b',
                fontWeight: 700
              }}>
                ✨ Solve the riddle & take its 1st letter!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* In-App Camera QR Code Scanner */}
      <CameraQrScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onCodeDetected={handleCameraCodeDetected}
      />
    </div>
  );
};
