import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { playBloop } from '../utils/audio';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '650px',
        width: '100%',
        borderRadius: '24px',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        border: '2px solid rgba(191, 90, 242, 0.5)',
        boxShadow: '0 0 35px rgba(191, 90, 242, 0.35)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={() => {
            playBloop(0.9);
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(255, 190, 11, 0.15)',
            border: '1px solid rgba(255, 190, 11, 0.4)',
            padding: '3px 12px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            color: '#ffbe0b',
            marginBottom: '0.4rem',
            fontWeight: 700
          }}>
            <Sparkles size={14} />
            <span>HOW TO PLAY THE ALCHEMY QUEST</span>
          </div>
          <h2 className="font-mystic" style={{ fontSize: '1.6rem', margin: 0, color: '#f8fafc' }}>
            The Great Alchemy Adventure Guide
          </h2>
        </div>

        {/* 4 Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🏮</span>
            <div>
              <strong style={{ color: '#ffbe0b' }}>Step 1: Choose Your Rune</strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                Choose 1 of the 4 Elemental Runes in the Alchemy Lab (Software R&D): 🔴 Fire, 🔵 Frost, 🟢 Venom, or 🟣 Moon. Each rune represents a unique quest in the realm!
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
            <div>
              <strong style={{ color: '#00c8ff' }}>Step 2: Hunt for Clue Posters</strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                Seek out the 12 magical clue posters. Only focus on posters that have your Rune emblem in the top corners!
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🧒✨</span>
            <div>
              <strong style={{ color: '#39ff14' }}>Apprentice Alchemist (Age 3–8 • Seek & Spot)</strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                Remember the 6 cute ingredient pictures on your cards, return to the iPad, and tap them on the grid to brew your potion!
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🧩</span>
            <div>
              <strong style={{ color: '#bf5af2' }}>Master Alchemist (Age 9+ • Cryptic Cipher)</strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                Solve the 6 rhyming riddles on your cards. Take the 1st letter of each riddle answer, return to the iPad, and unscramble the 6-letter mystery word! Correct letters lock into green stone slots!
              </div>
            </div>
          </div>
        </div>

        {/* Prize Callout */}
        <div style={{
          backgroundColor: 'rgba(57, 255, 20, 0.1)',
          border: '1px solid rgba(57, 255, 20, 0.3)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <img src="/sprites/potion_green.png" alt="Potion" style={{ width: '38px', height: '38px' }} />
          <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
            <strong style={{ color: '#39ff14' }}>The Grand Prize:</strong> Successfully brew your potion to receive an authentic 3D-printed Mini Potion Fidget Clicker from the Quest Master!
          </div>
        </div>

        {/* Got it button */}
        <button
          onClick={() => {
            playBloop(1.0);
            onClose();
          }}
          style={{
            background: 'linear-gradient(135deg, #8338ec, #3a86ff)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Got It, Let's Quest! ✨
        </button>
      </div>
    </div>
  );
};
