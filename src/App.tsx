import React, { useState, useEffect } from 'react';
import type { CardData, GameMode, RuneType, ScreenState } from './types';
import { getStoredCards, saveStoredCards, getScannedCardIds, addScannedCardId, clearScannedCardIds } from './utils/storage';
import { findCardFromScanQuery, startWebNfcScan, isWebNfcSupported } from './utils/nfc';
import { Header } from './components/Header';
import { ScreenHub } from './components/ScreenHub';
import { ScreenKidsMode } from './components/ScreenKidsMode';
import { ScreenAdultsMode } from './components/ScreenAdultsMode';
import { ScreenVictory } from './components/ScreenVictory';
import { AdminPosterStudio } from './components/AdminPosterStudio';
import { RulesModal } from './components/RulesModal';
import { NfcScanClaimModal } from './components/NfcScanClaimModal';
import { SatchelModal } from './components/SatchelModal';
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

  // Phone NFC Card Scans stored in Cookies with LocalStorage backup
  const [scannedCardIds, setScannedCardIds] = useState<string[]>(() => getScannedCardIds());
  const [nfcTargetCard, setNfcTargetCard] = useState<CardData | null>(null);
  const [isSatchelOpen, setIsSatchelOpen] = useState(false);

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

  // Check URL search parameters for pre-programmed NFC scans (e.g. ?scan=card-11 or ?nfc=11)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanQuery = params.get('scan') ||
                      params.get('nfc') ||
                      params.get('claim') ||
                      params.get('token') ||
                      params.get('card');

    if (scanQuery) {
      const matchedCard = findCardFromScanQuery(scanQuery, cards);
      if (matchedCard) {
        setNfcTargetCard(matchedCard);

        // Clean query parameter from URL so browser refresh doesn't trigger again
        const cleanUrl = new URL(window.location.href);
        ['scan', 'nfc', 'claim', 'token', 'card'].forEach(p => cleanUrl.searchParams.delete(p));
        window.history.replaceState({}, '', cleanUrl.toString());
      }
    }
  }, [cards]);

  // Background Web NFC Listener (for Android Chrome or supporting browsers)
  useEffect(() => {
    let stopNfc: (() => void) | null = null;
    if (isWebNfcSupported()) {
      startWebNfcScan((detectedQuery) => {
        const matched = findCardFromScanQuery(detectedQuery, cards);
        if (matched) {
          setNfcTargetCard(matched);
        }
      }).then(cleanup => {
        stopNfc = cleanup;
      }).catch(() => {});
    }

    return () => {
      if (stopNfc) stopNfc();
    };
  }, [cards]);

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
    if (!isMuted) {
      playMusic().catch(() => {});
    }
  };

  // NFC & Satchel handlers
  const handleNfcClaim = (card: CardData) => {
    const result = addScannedCardId(card.id);
    setScannedCardIds(result.collection);
  };

  const handleClearCollection = () => {
    clearScannedCardIds();
    setScannedCardIds([]);
  };

  const handleSimulateScan = (card: CardData) => {
    setNfcTargetCard(card);
  };

  const handleTriggerVictoryFromSatchel = (rune: RuneType) => {
    setSelectedQuestRune(rune);
    setSelectedMode('kids');
    setVictoryStats({ attempts: 1, purity: 100 });
    setCurrentScreen('victory');
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
        collectedCount={scannedCardIds.length}
        onOpenSatchel={() => setIsSatchelOpen(true)}
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
                collectedCount={scannedCardIds.length}
                onOpenSatchel={() => setIsSatchelOpen(true)}
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

      {/* NFC Scan & Hold-to-Claim Modal */}
      <NfcScanClaimModal
        card={nfcTargetCard}
        isOpen={!!nfcTargetCard}
        isAlreadyClaimed={nfcTargetCard ? scannedCardIds.includes(nfcTargetCard.id) : false}
        onClaim={handleNfcClaim}
        onClose={() => setNfcTargetCard(null)}
        onOpenSatchel={() => setIsSatchelOpen(true)}
      />

      {/* Phone Alchemist's Satchel Modal */}
      <SatchelModal
        isOpen={isSatchelOpen}
        cards={cards}
        scannedCardIds={scannedCardIds}
        onClose={() => setIsSatchelOpen(false)}
        onClearCollection={handleClearCollection}
        onSimulateScan={handleSimulateScan}
        onTriggerVictory={handleTriggerVictoryFromSatchel}
      />
    </div>
  );
};

export default App;
