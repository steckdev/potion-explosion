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
import { RelicAttunementModal } from './components/RelicAttunementModal';
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
  const [relicModalRune, setRelicModalRune] = useState<RuneType | null>(null);

  // Victory stats
  const [victoryStats, setVictoryStats] = useState({ attempts: 1, purity: 100 });

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // Rules modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Check URL search parameters for pre-programmed NFC scans (e.g. ?quest=fire or ?scan=card-11)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // 1. Check for 4 Physical NFC Relic Scans (one for each of the 4 Elemental Totems)
    const questQuery = params.get('quest') ||
                       params.get('relic') ||
                       params.get('rune') ||
                       params.get('totem');

    if (questQuery) {
      const q = questQuery.trim().toLowerCase();
      let matchedRune: RuneType | null = null;
      if (q === 'fire' || q === 'torch' || q === '1') matchedRune = 'fire';
      else if (q === 'frost' || q === 'crystal' || q === 'ice' || q === '2') matchedRune = 'frost';
      else if (q === 'venom' || q === 'leaf' || q === 'poison' || q === '3') matchedRune = 'venom';
      else if (q === 'moon' || q === 'shadow' || q === 'dark' || q === '4') matchedRune = 'moon';

      if (matchedRune) {
        setSelectedQuestRune(matchedRune);
        setRelicModalRune(matchedRune);

        // Clean query parameter from URL so browser refresh doesn't trigger again
        const cleanUrl = new URL(window.location.href);
        ['quest', 'relic', 'rune', 'totem'].forEach(p => cleanUrl.searchParams.delete(p));
        window.history.replaceState({}, '', cleanUrl.toString());
      }
    }

    // 2. Check for individual ingredient card scans
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
        const q = detectedQuery.trim().toLowerCase();
        if (q.includes('quest=fire') || q === 'fire') {
          setSelectedQuestRune('fire');
          setRelicModalRune('fire');
          return;
        }
        if (q.includes('quest=frost') || q === 'frost') {
          setSelectedQuestRune('frost');
          setRelicModalRune('frost');
          return;
        }
        if (q.includes('quest=venom') || q === 'venom') {
          setSelectedQuestRune('venom');
          setRelicModalRune('venom');
          return;
        }
        if (q.includes('quest=moon') || q === 'moon') {
          setSelectedQuestRune('moon');
          setRelicModalRune('moon');
          return;
        }

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

  // Default to fullscreen on load and trigger native fullscreen on user gesture
  useEffect(() => {
    if (isAdmin) return;

    if (typeof document !== 'undefined') {
      document.body.classList.add('kiosk-fullscreen-mode');
    }

    const triggerFullscreen = () => {
      if (typeof document === 'undefined') return;
      const doc = document as any;
      const docEl = document.documentElement as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      if (!isFull) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.webkitRequestFullScreen) {
          docEl.webkitRequestFullScreen();
        }
      }
      document.body.classList.add('kiosk-fullscreen-mode');
    };

    // Attempt immediately on mount
    triggerFullscreen();

    // Trigger on first click / touch / pointer gesture (satisfies browser gesture requirements)
    const handleGesture = () => {
      triggerFullscreen();
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };

    window.addEventListener('pointerdown', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('click', handleGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };
  }, [isAdmin]);

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
    if (typeof document !== 'undefined') {
      const doc = document as any;
      const docEl = document.documentElement as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      }
      document.body.classList.add('kiosk-fullscreen-mode');
    }
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

  const handleCardScanned = (card: CardData) => {
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
        activeQuestRune={selectedQuestRune}
        onClose={() => setIsSatchelOpen(false)}
        onClearCollection={handleClearCollection}
        onCardScanned={handleCardScanned}
        onTriggerVictory={handleTriggerVictoryFromSatchel}
      />

      {/* 4 Physical NFC Relic Attunement Modal */}
      <RelicAttunementModal
        rune={relicModalRune}
        isOpen={!!relicModalRune}
        cards={cards}
        scannedCardIds={scannedCardIds}
        currentMode={selectedMode}
        onStartQuest={(rune, mode) => {
          setRelicModalRune(null);
          handleSelectQuest(rune, mode);
        }}
        onOpenSatchel={() => {
          setRelicModalRune(null);
          setIsSatchelOpen(true);
        }}
        onClose={() => setRelicModalRune(null)}
      />
    </div>
  );
};

export default App;
