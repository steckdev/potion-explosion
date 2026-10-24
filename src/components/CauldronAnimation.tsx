import React, { useState } from 'react';
import { playBloop } from '../utils/audio';

interface CauldronAnimationProps {
  glowColor?: string;
  size?: number;
  interactive?: boolean;
}

export const CauldronAnimation: React.FC<CauldronAnimationProps> = ({
  glowColor = '#bf5af2',
  size = 180,
  interactive = true
}) => {
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = () => {
    if (!interactive) return;
    setIsBouncing(true);
    playBloop(1.2);
    setTimeout(() => setIsBouncing(false), 500);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: interactive ? 'pointer' : 'default',
        transform: isBouncing ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      title={interactive ? 'Tap the Cauldron to stir!' : ''}
    >
      {/* Dynamic Magical Aura Glow */}
      <div style={{
        position: 'absolute',
        width: `${size * 0.9}px`,
        height: `${size * 0.9}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        opacity: 0.45,
        filter: 'blur(20px)',
        zIndex: 1,
        animation: 'pulseGlow 3s ease-in-out infinite'
      }} />

      {/* Floating Magic Bubbles */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '42%',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: glowColor,
        boxShadow: `0 0 10px ${glowColor}`,
        animation: 'bubbleRise 2.4s infinite ease-out',
        zIndex: 4
      }} />
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '55%',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        boxShadow: `0 0 8px ${glowColor}`,
        animation: 'bubbleRise 1.8s infinite 0.7s ease-out',
        zIndex: 4
      }} />
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '32%',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: glowColor,
        boxShadow: `0 0 10px ${glowColor}`,
        animation: 'bubbleRise 2.1s infinite 1.2s ease-out',
        zIndex: 4
      }} />

      {/* Cauldron Sprite / Artwork */}
      <img
        src="/sprites/cauldron_bubble.png"
        alt="Bubbling Cauldron"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 3,
          filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.6)) drop-shadow(0 0 16px ${glowColor})`
        }}
      />
    </div>
  );
};
