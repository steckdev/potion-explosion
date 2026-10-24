import React, { useState, useEffect } from 'react';
import type { CardData, GameMode, RuneType, ScreenState } from './types';
import { getStoredCards, saveStoredCards } from './utils/storage';
import { Header } from './components/Header';
import { ScreenHub } from './components/ScreenHub';
import { ScreenKidsMode } from './components/ScreenKidsMode';
import { ScreenAdultsMode } from './components/ScreenAdultsMode';
import { ScreenVictory } from './components/ScreenVictory';
import { AdminPosterStudio } from './components/AdminPosterStudio';
import { RulesModal } from './components/RulesModal';
import { playMusic } from './utils/audio';

export const App: React.FC = () => {
  // Load card data from localStorage or fallback to default
  const [cards, setCards] = useState<CardData[]>(() => getStoredCards());

  // URL query check: ?admin=true
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true';
  });

  // Game Screen State
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('hub');
  const [selectedQuestRune, setSelectedQuestRune] = useState<RuneType | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>('kids');

  // Victory stats
  const [victoryStats, setVictoryStats] = useState({ attempts: 1, purity: 100 });

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Rules modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Start background music automatically on load
  useEffect(() => {
    playMusic().catch(() => {});
  }, []);

  // Sync admin state with URL query param
  const handleToggleAdmin = () => {
    setIsAdmin(prev => {
      const next = !prev;
      const url = new URL(window.location.href);
      if (next) {
        url.searchParams.set('admin', 'true');
      } else {
        url.searchParams.delete('admin');
      }
      window.history.replaceState({}, '', url.toString());
      return next;
    });
  };

  // Start quest from Hub
  const handleSelectQuest = (rune: RuneType, mode: GameMode) => {
    setSelectedQuestRune(rune);
    setSelectedMode(mode);
    if (mode === 'kids') {
      setCurrentScreen('kids_game');
    } else {
      setCurrentScreen('adults_game');
    }
  };

  // Handle victory
  const handleWin = (attempts: number, purity = 100) => {
    setVictoryStats({ attempts, purity });
    setCurrentScreen('victory');
  };

  // Reset back to Hub
  const handleResetToHub = () => {
    setCurrentScreen('hub');
    setSelectedQuestRune(null);
  };

  return (
    <div className="spooky-ambient-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Header */}
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(m => !m)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onHome={handleResetToHub}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isAdmin ? (
          <AdminPosterStudio
            cards={cards}
            onUpdateCards={(newCards) => {
              setCards(newCards);
              saveStoredCards(newCards);
            }}
            onExitAdmin={() => {
              handleToggleAdmin();
            }}
          />
        ) : (
          <>
            {currentScreen === 'hub' && (
              <ScreenHub
                onSelectQuest={handleSelectQuest}
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
              />
            )}

            {currentScreen === 'kids_game' && selectedQuestRune && (
              <ScreenKidsMode
                questRune={selectedQuestRune}
                cards={cards}
                onBack={handleResetToHub}
                onWin={(attempts) => handleWin(attempts, 100)}
              />
            )}

            {currentScreen === 'adults_game' && selectedQuestRune && (
              <ScreenAdultsMode
                questRune={selectedQuestRune}
                cards={cards}
                onBack={handleResetToHub}
                onWin={(attempts, purity) => handleWin(attempts, purity)}
              />
            )}

            {currentScreen === 'victory' && selectedQuestRune && (
              <ScreenVictory
                questRune={selectedQuestRune}
                mode={selectedMode}
                attempts={victoryStats.attempts}
                purity={victoryStats.purity}
                onReset={handleResetToHub}
              />
            )}
          </>
        )}
      </main>



      {/* Rules Modal */}
      <RulesModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
