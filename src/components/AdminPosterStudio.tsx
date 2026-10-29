import React, { useState, useEffect } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { PrintablePoster } from './PrintablePoster';
import { saveStoredCards, resetStoredCards, exportCardsAsJSON, importCardsFromJSON } from '../utils/storage';
import { playBloop, playStoneLock } from '../utils/audio';
import { getCardQrCode, downloadCardQrCode, getQrCodeDataUrl, downloadTotemQrCode } from '../utils/qrcode';
import { 
  Printer, 
  RotateCcw, 
  Download, 
  Upload, 
  Edit3, 
  FileText, 
  Check,
  Award,
  Sparkles,
  Eye,
  EyeOff,
  MapPin,
  Copy,
  QrCode,
  Globe,
  ListChecks
} from 'lucide-react';

export type AdminViewMode = 'print_all' | 'totem_cards' | 'map_guide' | 'table_sign' | 'cheat_sheet' | 'checklist' | 'certificates' | 'plinko_discs' | 'nfc_tags' | 'editor' | 'prompts';

interface AdminPosterStudioProps {
  cards: CardData[];
  onUpdateCards: (newCards: CardData[]) => void;
  onExitAdmin: () => void;
}

export const AdminPosterStudio: React.FC<AdminPosterStudioProps> = ({
  cards,
  onUpdateCards,
  onExitAdmin
}) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState<AdminViewMode>('print_all');
  const [copiedNfcUrl, setCopiedNfcUrl] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  const [totemPrintLayout, setTotemPrintLayout] = useState<'full_page' | 'compact_4up'>('full_page');
  
  // Scanning Base Host / Domain configuration
  const [scanBaseUrl, setScanBaseUrl] = useState(() => (typeof window !== 'undefined' ? window.location.origin : 'https://potion-explosion.netlify.app'));
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});
  const [totemQrPreviews, setTotemQrPreviews] = useState<Record<string, string>>({});
  const [isDownloadingAllQr, setIsDownloadingAllQr] = useState(false);

  // Wall printing vs Answer Key toggles
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showStaffNotes, setShowStaffNotes] = useState(false);

  // Generate QR previews whenever cards or base URL change
  useEffect(() => {
    let isMounted = true;
    async function loadPreviews() {
      const previews: Record<string, string> = {};
      for (const card of cards) {
        previews[card.id] = await getCardQrCode(card, scanBaseUrl, 160);
      }
      
      const runes: RuneType[] = ['fire', 'frost', 'venom', 'moon'];
      const totemPreviews: Record<string, string> = {};
      for (const r of runes) {
        totemPreviews[r] = await getQrCodeDataUrl(`${scanBaseUrl}/?quest=${r}`, 200);
      }

      if (isMounted) {
        setQrPreviews(previews);
        setTotemQrPreviews(totemPreviews);
      }
    }
    loadPreviews();
    return () => {
      isMounted = false;
    };
  }, [cards, scanBaseUrl]);

  // Certificate customization
  const [certRecipient, setCertRecipient] = useState('');
  const [certRank, setCertRank] = useState<'Apprentice Alchemist' | 'Master Alchemist'>('Apprentice Alchemist');

  // AI Prompt Builder
  const [customPromptName, setCustomPromptName] = useState('');
  const [promptCopied, setPromptCopied] = useState<string | null>(null);

  const activeCard = cards[selectedCardIndex] || cards[0];

  // Available clean sprite choices for the card editor
  const availableSprites = [
    { label: 'Dragon Scale', path: '/sprites/dragon_scale.png' },
    { label: 'Ghost Tears', path: '/sprites/ghost_tears.png' },
    { label: 'Werewolf Fur', path: '/sprites/werewolf_fur.png' },
    { label: "Herb", path: '/sprites/witch_brew_herb.png' },
    { label: 'Candy Corn', path: '/sprites/candy_corn.png' },
    { label: 'Bat Wings', path: '/sprites/bat_wing.png' },
    { label: 'Banshee Scream', path: '/sprites/banshee_scream.png' },
    { label: 'Pumpkin Seeds', path: '/sprites/pumpkin_seeds.png' },
    { label: 'Spider Venom', path: '/sprites/spider_venom.png' },
    { label: 'Toad Slime', path: '/sprites/toad_slime.png' },
    { label: 'Glow Worms', path: '/sprites/glow_worms.png' },
    { label: 'Pixie Dust', path: '/sprites/pixie_dust.png' },
    { label: 'Dragon Pepper', path: '/sprites/dragon_pepper.png' },
    { label: 'Eye of Newt', path: '/sprites/eye_of_newt.png' },
    { label: 'Vampire Giggles', path: '/sprites/vampire_giggles.png' },
    { label: 'Bone Powder', path: '/sprites/bone_powder.png' },
    { label: 'Glow Lantern', path: '/sprites/item_glow_lantern.png' },
    { label: 'Magical Compass', path: '/sprites/item_magical_compass.png' },
    { label: 'Tome of Ciphers', path: '/sprites/item_tome_ciphers.png' },
    { label: 'Fungal Spores', path: '/sprites/item_fungal_spores.png' }
  ];

  // Update field on active card
  const handleCardFieldChange = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    const updated = [...cards];
    updated[selectedCardIndex] = {
      ...updated[selectedCardIndex],
      [field]: value
    };
    onUpdateCards(updated);
    saveStoredCards(updated);
    showSavedIndicator();
  };

  // Toggle rune on active card
  const handleToggleRune = (rune: RuneType) => {
    playBloop(1.1);
    const currentRunes = activeCard.runes || [];
    let nextRunes: RuneType[];
    if (currentRunes.includes(rune)) {
      if (currentRunes.length === 1) {
        alert('Card must have at least 1 rune!');
        return;
      }
      nextRunes = currentRunes.filter(r => r !== rune);
    } else {
      nextRunes = [...currentRunes, rune];
    }
    handleCardFieldChange('runes', nextRunes);
  };

  const showSavedIndicator = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1500);
  };

  // Reset to factory defaults
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all cards and riddles to default?')) {
      const defs = resetStoredCards();
      onUpdateCards(defs);
      playStoneLock();
      showSavedIndicator();
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonStr = exportCardsAsJSON(cards);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alchemy_quest_cards.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportSubmit = () => {
    try {
      const parsed = importCardsFromJSON(jsonInput);
      onUpdateCards(parsed);
      saveStoredCards(parsed);
      setIsImporting(false);
      setJsonInput('');
      playStoneLock();
      alert('Successfully imported card data!');
    } catch (e) {
      alert('Failed to import JSON: ' + (e as Error).message);
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#090714', color: '#f8fafc' }}>
      {/* Admin Action Bar (Hidden during actual print) */}
      <div className="no-print glass-panel" style={{
        position: 'sticky',
        top: '60px',
        zIndex: 40,
        padding: '0.65rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(18, 14, 36, 0.96)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        {/* Row 1: Materials & Tools Tabs + Main Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Left: Material Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '0.2rem' }}>
              🖨️ Materials:
            </span>

            <button
              onClick={() => { playBloop(1.0); setViewMode('print_all'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'print_all' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'print_all' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'print_all' ? '#fca5a5' : '#cbd5e1'
              }}
            >
              <Printer size={13} />
              <span>Wall Posters (12)</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('totem_cards'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'totem_cards' ? '1px solid #39ff14' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'totem_cards' ? 'rgba(57, 255, 20, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'totem_cards' ? '#86efac' : '#cbd5e1'
              }}
            >
              <span>🏷️</span>
              <span>4 Rune NFC Cards</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('map_guide'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'map_guide' ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'map_guide' ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'map_guide' ? '#fdba74' : '#cbd5e1'
              }}
            >
              <span>🗺️</span>
              <span>Map Backside Guide</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('table_sign'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'table_sign' ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'table_sign' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'table_sign' ? '#fde047' : '#cbd5e1'
              }}
            >
              <span>📜</span>
              <span>Mythical Welcome Sign</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('cheat_sheet'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'cheat_sheet' ? '1px solid #00c8ff' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'cheat_sheet' ? 'rgba(0, 200, 255, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'cheat_sheet' ? '#7dd3fc' : '#cbd5e1'
              }}
            >
              <FileText size={13} />
              <span>Master Cheat Sheet</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('checklist'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'checklist' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'checklist' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'checklist' ? '#d8b4fe' : '#cbd5e1'
              }}
            >
              <ListChecks size={13} />
              <span>Setup Checklist</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('nfc_tags'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'nfc_tags' ? '1px solid #39ff14' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'nfc_tags' ? 'rgba(57, 255, 20, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'nfc_tags' ? '#86efac' : '#cbd5e1'
              }}
            >
              <QrCode size={13} />
              <span>📱 NFC Programmer</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('certificates'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'certificates' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'certificates' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'certificates' ? '#fcd34d' : '#cbd5e1'
              }}
            >
              <Award size={13} />
              <span>Certificates</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('plinko_discs'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'plinko_discs' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'plinko_discs' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'plinko_discs' ? '#67e8f9' : '#cbd5e1'
              }}
            >
              <span>🎲</span>
              <span>Plinko Discs</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 0.2rem' }} />

            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🛠️ Tools:
            </span>

            <button
              onClick={() => { playBloop(1.0); setViewMode('editor'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'editor' ? '1px solid #8338ec' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'editor' ? 'rgba(131, 56, 236, 0.35)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'editor' ? '#c084fc' : '#cbd5e1'
              }}
            >
              <Edit3 size={13} />
              <span>Card Editor</span>
            </button>

            <button
              onClick={() => { playBloop(1.0); setViewMode('prompts'); }}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: viewMode === 'prompts' ? '1px solid #bf5af2' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: viewMode === 'prompts' ? 'rgba(191, 90, 242, 0.35)' : 'rgba(255,255,255,0.06)',
                color: viewMode === 'prompts' ? '#e9d5ff' : '#cbd5e1'
              }}
            >
              <Sparkles size={13} />
              <span>AI Prompts</span>
            </button>
          </div>

          {/* Right: Print Action, Data, Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {saveToast && (
              <span style={{ fontSize: '0.8rem', color: '#39ff14', fontWeight: 700 }}>
                ✓ Saved!
              </span>
            )}

            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#38bdf8',
                color: '#090714',
                border: 'none',
                borderRadius: '999px',
                padding: '0.45rem 1.15rem',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <Printer size={15} />
              <span>PRINT VIEW NOW</span>
            </button>

            <button
              onClick={handleExportJSON}
              title="Export Cards as JSON"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                borderRadius: '999px',
                padding: '0.38rem 0.65rem',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsImporting(true)}
              title="Import Cards JSON"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#cbd5e1',
                borderRadius: '999px',
                padding: '0.38rem 0.65rem',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Upload size={13} />
              <span>Import</span>
            </button>

            <button
              onClick={handleResetDefaults}
              title="Reset Cards to Default"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '999px',
                padding: '0.38rem 0.65rem',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              onClick={onExitAdmin}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Exit Admin ✕
            </button>
          </div>
        </div>

        {/* Row 2: Global Print Toggles & Scan Host URL Configuration */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b' }}>
              ⚙️ Print Toggles:
            </span>

            {/* Answer Key Toggle */}
            <button
              onClick={() => { playBloop(1.0); setShowAnswerKey(v => !v); }}
              style={{
                backgroundColor: showAnswerKey ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 255, 255, 0.07)',
                border: `1px solid ${showAnswerKey ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                color: showAnswerKey ? '#39ff14' : '#cbd5e1',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              {showAnswerKey ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{showAnswerKey ? 'Riddle Answers: VISIBLE (Staff Key)' : 'Riddle Answers: HIDDEN (Wall Print)'}</span>
            </button>

            {/* Staff Mounting Notes Toggle */}
            <button
              onClick={() => { playBloop(1.0); setShowStaffNotes(v => !v); }}
              style={{
                backgroundColor: showStaffNotes ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.07)',
                border: `1px solid ${showStaffNotes ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}`,
                color: showStaffNotes ? '#fbbf24' : '#cbd5e1',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s ease'
              }}
            >
              <MapPin size={13} />
              <span>{showStaffNotes ? 'Mounting Notes: ON (Setup Guide)' : 'Mounting Notes: OFF (Clean)'}</span>
            </button>
          </div>

          {/* Scan Base URL Config */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Globe size={13} color="#38bdf8" />
              <span>Scan QR Host:</span>
            </span>
            <input
              type="text"
              value={scanBaseUrl}
              onChange={(e) => setScanBaseUrl(e.target.value)}
              placeholder="https://..."
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                width: '180px'
              }}
            />
            {typeof window !== 'undefined' && scanBaseUrl !== window.location.origin && (
              <button
                onClick={() => setScanBaseUrl(window.location.origin)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  padding: '3px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Reset to current browser origin"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {isImporting && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '550px',
            width: '100%',
            padding: '1.5rem',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Import Cards JSON</h3>
            <textarea
              rows={10}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON array of cards here..."
              style={{
                width: '100%',
                backgroundColor: 'rgba(10, 7, 20, 0.8)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                padding: '0.75rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setIsImporting(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                style={{
                  background: '#8338ec',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0.5rem 1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Import & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      <div style={{ padding: '1.5rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* VIEW 1: Interactive Live Poster Editor & Preview */}
        {viewMode === 'editor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 12-Card Quick Strip */}
            <div className="no-print" style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem'
            }}>
              {cards.map((c, idx) => {
                const isSelected = idx === selectedCardIndex;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      playBloop(1.0);
                      setSelectedCardIndex(idx);
                    }}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      backgroundColor: isSelected 
                        ? 'rgba(131, 56, 236, 0.45)' 
                        : 'rgba(255, 255, 255, 0.06)',
                      border: isSelected 
                        ? '2px solid #a855f7' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '0.4rem 0.75rem',
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={c.sprite} alt={c.name} style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        #{c.number}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{c.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split Screen: Live Poster (Left/Center) + Editor Panel (Right) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(340px, 8.5in) minmax(320px, 450px)',
              gap: '2rem',
              alignItems: 'start',
              justifyContent: 'center'
            }}>
              {/* Live Poster Card Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <PrintablePoster 
                  card={activeCard} 
                  showAdminHelper={false} 
                  showAnswerKey={showAnswerKey}
                  showStaffNotes={showStaffNotes}
                  baseUrl={scanBaseUrl}
                />
              </div>

              {/* Live Form Editor Panel */}
              <div className="no-print glass-panel" style={{
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffbe0b' }}>
                    Edit Card #{activeCard.number} Details
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Changes live & autosaved</span>
                </div>

                {/* Card Title */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Ingredient Name (Kids View):
                  </label>
                  <input
                    type="text"
                    value={activeCard.name}
                    onChange={(e) => handleCardFieldChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(10, 7, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginTop: '4px'
                    }}
                  />
                </div>

                {/* Assigned Runes Toggle */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Active Elemental Runes on this Card:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '6px' }}>
                    {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(r => {
                      const quest = QUESTS[r];
                      const isActive = activeCard.runes.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => handleToggleRune(r)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '8px',
                            border: `2px solid ${isActive ? quest.color : 'rgba(255, 255, 255, 0.15)'}`,
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.3)',
                            color: isActive ? '#ffffff' : '#94a3b8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: quest.color
                          }} />
                          <span style={{ textTransform: 'capitalize' }}>{r} Rune</span>
                          {isActive && <Check size={14} color={quest.color} style={{ marginLeft: 'auto' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secret Target Letter & Answer */}
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                      Letter [A-Z]:
                    </label>
                    <input
                      type="text"
                      maxLength={1}
                      value={activeCard.targetLetter}
                      onChange={(e) => handleCardFieldChange('targetLetter', e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(10, 7, 20, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#39ff14',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                      Riddle Secret Answer:
                    </label>
                    <input
                      type="text"
                      value={activeCard.riddleAnswer}
                      onChange={(e) => handleCardFieldChange('riddleAnswer', e.target.value)}
                      placeholder="e.g. Pumpkin"
                      style={{
                        width: '100%',
                        padding: '0.55rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(10, 7, 20, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                </div>

                {/* Riddle Rhyme */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Riddle Poem (For Master Alchemists):
                  </label>
                  <textarea
                    rows={4}
                    value={activeCard.riddle}
                    onChange={(e) => handleCardFieldChange('riddle', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(10, 7, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      lineHeight: 1.4,
                      marginTop: '4px'
                    }}
                  />
                </div>

                {/* Sprite Selector */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Choose Graphic Art:
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.4rem',
                    marginTop: '6px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {availableSprites.map(s => {
                      const isChosen = activeCard.sprite === s.path;
                      return (
                        <div
                          key={s.path}
                          onClick={() => handleCardFieldChange('sprite', s.path)}
                          style={{
                            padding: '4px',
                            borderRadius: '8px',
                            border: isChosen ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: isChosen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={s.label}
                        >
                          <img src={s.path} alt={s.label} style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Station Location */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Station Wall Location Hint (Staff Guide):
                  </label>
                  <input
                    type="text"
                    value={activeCard.location || ''}
                    onChange={(e) => handleCardFieldChange('location', e.target.value)}
                    placeholder="e.g. Breakroom Fridge"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(10, 7, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      marginTop: '4px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Print Posters Sequentially */}
        {viewMode === 'print_all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
            <div className="no-print" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              maxWidth: '8.5in',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxSizing: 'border-box'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f87171' }}>
                  Ready to Print {cards.length} Wall Posters
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#fecaca' }}>
                  Standard 8.5" x 11" letter sheets. All headers and UI controls hidden automatically during printing.
                </p>
              </div>
              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.55rem 1.3rem',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.5)',
                  flexShrink: 0
                }}
              >
                <Printer size={16} />
                <span>PRINT ALL {cards.length} POSTERS</span>
              </button>
            </div>

            {/* Cards in Print Containers */}
            {cards.map(card => (
              <div key={card.id} style={{ marginBottom: '1.5rem' }}>
                <PrintablePoster 
                  card={card} 
                  showAdminHelper={false} 
                  showAnswerKey={showAnswerKey}
                  showStaffNotes={showStaffNotes}
                  baseUrl={scanBaseUrl}
                />
              </div>
            ))}
          </div>
        )}

        {/* VIEW: 4 Totem NFC Cards / Quest Starters (Full-Page Standees or 4-up Sheet) */}
        {viewMode === 'totem_cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%', maxWidth: '8.5in', margin: '0 auto' }}>
            {/* Action Bar */}
            <div className="no-print" style={{
              backgroundColor: 'rgba(57, 255, 20, 0.1)',
              border: '1.5px solid #39ff14',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxSizing: 'border-box',
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏷️</span>
                  <span>4 Elemental Rune NFC Cards (Quest Starters)</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  {totemPrintLayout === 'full_page'
                    ? 'Prints 4 individual full-page 8.5" x 11" desk standees with large NFC targets, QR codes, and mystery clue slots. Zero ingredient spoilers!'
                    : 'Prints all 4 Rune cards on one 8.5" x 11" sheet with cut guides and mystery clue slots. Zero ingredient spoilers!'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Layout Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '3px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  <button
                    onClick={() => { playBloop(1.0); setTotemPrintLayout('full_page'); }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: totemPrintLayout === 'full_page' ? '#39ff14' : 'transparent',
                      color: totemPrintLayout === 'full_page' ? '#090714' : '#cbd5e1',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>📄</span>
                    <span>Full-Page (4 Pages)</span>
                  </button>
                  <button
                    onClick={() => { playBloop(1.0); setTotemPrintLayout('compact_4up'); }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: totemPrintLayout === 'compact_4up' ? '#39ff14' : 'transparent',
                      color: totemPrintLayout === 'compact_4up' ? '#090714' : '#cbd5e1',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>📇</span>
                    <span>4-on-1 Sheet</span>
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  style={{
                    backgroundColor: '#39ff14',
                    color: '#090714',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.55rem 1.3rem',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 0 16px rgba(57, 255, 20, 0.4)',
                    flexShrink: 0
                  }}
                >
                  <Printer size={16} />
                  <span>
                    {totemPrintLayout === 'full_page' ? 'PRINT 4 FULL-PAGE SIGNS' : 'PRINT 4-UP SHEET'}
                  </span>
                </button>
              </div>
            </div>

            {/* LAYOUT A: FULL-PAGE STANDS (4 Individual 8.5" x 11" Pages) */}
            {totemPrintLayout === 'full_page' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'center' }}>
                {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map((r) => {
                  const quest = QUESTS[r];
                  const qrUrl = totemQrPreviews[r];

                  return (
                    <div
                      key={r}
                      className="print-page-container"
                      style={{
                        width: '8.0in',
                        minHeight: '10.4in',
                        maxHeight: '10.4in',
                        backgroundColor: '#fbf7ea',
                        backgroundImage: `
                          radial-gradient(circle at 50% 12%, rgba(${r === 'fire' ? '255,59,48' : r === 'frost' ? '0,200,255' : r === 'venom' ? '57,255,20' : '191,90,242'}, 0.12) 0%, transparent 65%),
                          linear-gradient(180deg, #ffffff 0%, #fbf7ee 60%, #f7edd7 100%)
                        `,
                        border: '8px solid #3d2314',
                        borderRadius: '16px',
                        padding: '0.38in 0.45in',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                        color: '#2d1810',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Inner Ornate Accent Border */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        right: '8px',
                        bottom: '8px',
                        border: `2px solid ${quest.color}`,
                        borderRadius: '10px',
                        pointerEvents: 'none',
                        opacity: 0.8
                      }} />

                      {/* Header Section */}
                      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '0.25rem 0.9rem',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                          boxShadow: `0 0 14px ${quest.color}`
                        }}>
                          <span style={{ color: quest.color }}>{r.toUpperCase()} RUNESTONE</span>
                        </div>

                        {/* Large Rune Emblem Icon */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.35rem 0' }}>
                          <div style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: `3px solid ${quest.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 24px rgba(${r === 'fire' ? '255,59,48' : r === 'frost' ? '0,200,255' : r === 'venom' ? '57,255,20' : '191,90,242'}, 0.45)`
                          }}>
                            <img
                              src={quest.icon}
                              alt={quest.title}
                              style={{ width: '64px', height: '64px', filter: `drop-shadow(0 3px 6px ${quest.color})` }}
                            />
                          </div>
                        </div>

                        <h2 className="font-mystic" style={{
                          margin: '0.25rem 0 0.15rem 0',
                          fontSize: '2.1rem',
                          fontWeight: 900,
                          color: '#1e1b4b',
                          letterSpacing: '1px'
                        }}>
                          {quest.title}
                        </h2>

                        <p style={{
                          margin: 0,
                          fontSize: '0.92rem',
                          color: '#78350f',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          maxWidth: '6.2in',
                          marginLeft: 'auto',
                          marginRight: 'auto'
                        }}>
                          Bond your satchel and hunt your 6 elemental ingredients across the office!
                        </p>
                      </div>

                      {/* Dual Starter Center: Physical NFC Target + Camera QR Code */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: `2px solid ${quest.color}`,
                        borderRadius: '14px',
                        padding: '0.9rem 1.1rem',
                        margin: '0.5rem 0',
                        boxShadow: 'inset 0 0 14px rgba(0,0,0,0.05)',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {/* Left: NFC Circle Target */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          justifyContent: 'center',
                          borderRight: '1.5px dashed #d97706',
                          paddingRight: '0.75rem'
                        }}>
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: `3px dashed ${quest.color}`,
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 16px rgba(${r === 'fire' ? '255,59,48' : r === 'frost' ? '0,200,255' : r === 'venom' ? '57,255,20' : '191,90,242'}, 0.35)`
                          }}>

                          </div>

                          <span style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 600, marginTop: '10px' }}>
                            Tap phone against Rune to bond satchel
                          </span>
                        </div>

                        {/* Right: Camera QR Code */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          justifyContent: 'center',
                          paddingLeft: '0.75rem'
                        }}>
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`${r} quest QR`}
                              title="Click to download 512x512 QR code PNG"
                              onClick={() => {
                                playBloop(1.1);
                                downloadTotemQrCode(r, scanBaseUrl);
                              }}
                              style={{
                                width: '100px',
                                height: '100px',
                                border: '2px solid #78350f',
                                borderRadius: '10px',
                                backgroundColor: '#ffffff',
                                padding: '4px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                              }}
                            />
                          ) : (
                            <div style={{ width: '100px', height: '100px', backgroundColor: '#e2e8f0', borderRadius: '10px' }} />
                          )}
                          <span style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 600, marginTop: '2px' }}>
                            Scan QR code to launch quest satchel
                          </span>
                        </div>
                      </div>

                      {/* 6 Heroic Ingredients to Discover (ZERO SPOILERS!) */}
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: `2px solid ${quest.color}`,
                          paddingBottom: '4px',
                          marginBottom: '6px'
                        }}>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 900,
                            color: '#78350f',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>🧪</span>
                            <span>6 Sacred Ingredients to Discover:</span>
                          </div>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: quest.color,
                            backgroundColor: '#0f172a',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {r.toUpperCase()} QUEST
                          </span>
                        </div>

                        {/* Dual Age Group Guidance */}
                        <div style={{
                          backgroundColor: '#fef3c7',
                          border: '1.5px solid #f59e0b',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.72rem',
                          color: '#78350f',
                          fontWeight: 700
                        }}>
                          <span>🌿 <strong>Age &lt;9:</strong> Record ingredient found</span>
                          <span>⭐ <strong>Age 9+:</strong> Solve riddle & note secret letter</span>
                        </div>

                        {/* 6 Discovery Slots (2 columns x 3 rows) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '6px'
                        }}>
                          {[1, 2, 3, 4, 5, 6].map((slot) => (
                            <div
                              key={slot}
                              style={{
                                backgroundColor: '#ffffff',
                                border: '1.5px solid #d97706',
                                borderRadius: '8px',
                                padding: '5px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                              }}
                            >
                              {/* Left: Checkbox + Slot */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  border: '2px solid #78350f',
                                  borderRadius: '4px',
                                  backgroundColor: '#fffdf8',
                                  flexShrink: 0
                                }} title="Check off when found" />
                                <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1e1b4b' }}>
                                  #{slot}
                                </span>
                              </div>

                              {/* Middle: Write ingredient */}
                              <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderBottom: '1.5px dashed #b45309',
                                paddingBottom: '1px',
                                margin: '0 4px',
                                minWidth: '40px'
                              }}>
                                <span style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  Ingredient:
                                </span>
                              </div>

                              {/* Right: Secret Letter (Age 9+) */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fcd34d',
                                borderRadius: '4px',
                                padding: '2px 5px'
                              }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#78350f', whiteSpace: 'nowrap' }}>
                                  Letter:
                                </span>
                                <div style={{
                                  width: '20px',
                                  height: '18px',
                                  border: '1.5px solid #78350f',
                                  borderRadius: '3px',
                                  backgroundColor: '#ffffff'
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Consistent 6 Letters Blanks for Secret Brew Word */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#ffffff',
                          border: `1.5px solid ${quest.color}`,
                          borderRadius: '8px',
                          padding: '6px 12px',
                          marginTop: '8px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#78350f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🧩</span>
                              <span>Secret Brew Word (6 Letters):</span>
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#92400e', fontWeight: 600 }}>
                              Unscramble your 6 collected letters to reveal the secret word!
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  border: `2px solid ${quest.color}`,
                                  borderRadius: '6px',
                                  backgroundColor: '#fffdf8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.85rem',
                                  fontWeight: 900,
                                  color: '#1e1b4b',
                                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Guidance */}
                      <div style={{
                        textAlign: 'center',
                        borderTop: '1.5px dashed #d97706',
                        paddingTop: '6px',
                        marginTop: '6px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{ fontSize: '0.76rem', color: '#78350f', fontWeight: 700 }}>
                          🏆 Once all 6 ingredients are collected in your satchel, return to the Master Cauldron to brew your potion and claim your <strong>3D-Printed Mini Potion Fidget Toy!</strong> 🎃
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LAYOUT B: 4-ON-1 SHEET (Compact Cutout with Scissor Lines) */}
            {totemPrintLayout === 'compact_4up' && (
              <div className="print-page-container print-grid-container" style={{
                width: '8.0in',
                height: '10.4in',
                maxHeight: '10.4in',
                maxWidth: '8.0in',
                backgroundColor: '#fbf7ea',
                border: '8px solid #3d2314',
                borderRadius: '16px',
                padding: '0.22in',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: '0.22in',
                position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                color: '#2d1810',
                overflow: 'hidden'
              }}>
                {/* Center Scissors Guides */}
                <div style={{
                  position: 'absolute',
                  top: '0.2in',
                  bottom: '0.2in',
                  left: '50%',
                  width: '0',
                  borderLeft: '1.5px dashed #b45309',
                  pointerEvents: 'none',
                  opacity: 0.6,
                  zIndex: 10
                }}>
                  <span style={{ position: 'absolute', top: '48%', left: '-8px', fontSize: '14px', backgroundColor: '#fbf7ea' }}>✂</span>
                </div>
                <div style={{
                  position: 'absolute',
                  left: '0.2in',
                  right: '0.2in',
                  top: '50%',
                  height: '0',
                  borderTop: '1.5px dashed #b45309',
                  pointerEvents: 'none',
                  opacity: 0.6,
                  zIndex: 10
                }}>
                  <span style={{ position: 'absolute', left: '48%', top: '-10px', fontSize: '14px', backgroundColor: '#fbf7ea' }}>✂</span>
                </div>

                {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map((r, idx) => {
                  const quest = QUESTS[r];
                  const qrUrl = totemQrPreviews[r];
                  const tagNum = idx + 1;

                  return (
                    <div
                      key={r}
                      style={{
                        border: `3px solid ${quest.color}`,
                        borderRadius: '14px',
                        backgroundColor: '#fffdf8',
                        backgroundImage: `
                          radial-gradient(circle at 50% 0%, rgba(${r === 'fire' ? '255,59,48' : r === 'frost' ? '0,200,255' : r === 'venom' ? '57,255,20' : '191,90,242'}, 0.08) 0%, transparent 60%),
                          linear-gradient(180deg, #ffffff 0%, #fdf8ee 100%)
                        `,
                        padding: '0.14in',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.04)',
                        position: 'relative'
                      }}
                    >
                      {/* Header */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: `2px solid ${quest.color}`,
                          paddingBottom: '4px',
                          marginBottom: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img
                              src={quest.icon}
                              alt={quest.title}
                              style={{ width: '32px', height: '32px', filter: `drop-shadow(0 2px 4px ${quest.color})` }}
                            />
                            <div>
                              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: quest.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                NFC RELIC #{tagNum} • {r.toUpperCase()}
                              </div>
                              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: '#1e1b4b', lineHeight: 1.1 }}>
                                {quest.title}
                              </h4>
                            </div>
                          </div>
                          <span style={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            fontSize: '0.64rem',
                            fontWeight: 800
                          }}>
                            START QUEST
                          </span>
                        </div>

                        <div style={{ fontSize: '0.72rem', color: '#78350f', fontWeight: 600, textAlign: 'center', marginBottom: '6px' }}>
                          Bond your satchel to this Rune to track your 6 elemental ingredients!
                        </div>
                      </div>

                      {/* Dual Starter Center: Physical NFC Target + Camera QR */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        border: '1.5px solid #d97706',
                        borderRadius: '10px',
                        padding: '6px'
                      }}>
                        {/* Left: NFC Circle Target */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '66px',
                            height: '66px',
                            borderRadius: '50%',
                            border: `2px dashed ${quest.color}`,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px rgba(0,0,0,0.06)`
                          }}>
 
                          </div>
            
                        </div>

                        {/* Right: Camera QR Code */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          justifyContent: 'center'
                        }}>
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`${r} quest QR`}
                              title="Click to download 512x512 QR code PNG"
                              onClick={() => {
                                playBloop(1.1);
                                downloadTotemQrCode(r, scanBaseUrl);
                              }}
                              style={{
                                width: '100px',
                                height: '100px',
                                border: '1px solid #78350f',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                padding: '2px',
                                cursor: 'pointer'
                              }}
                            />
                          ) : (
                            <div style={{ width: '64px', height: '64px', backgroundColor: '#e2e8f0', borderRadius: '6px' }} />
                          )}
                        </div>
                      </div>

                      {/* 6 Heroic Ingredients to Discover (ZERO SPOILERS!) */}
                      <div style={{ marginTop: '4px' }}>
                        <div style={{
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          color: '#78350f',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>6 Ingredients to Discover:</span>
                          <span style={{ fontSize: '0.52rem', color: '#b45309', fontWeight: 800 }}>
                            🌿 &lt;9: Item • ⭐ 9+: Letter
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '3px',
                          fontSize: '0.6rem',
                          color: '#1e1b4b',
                          backgroundColor: '#fffbeb',
                          padding: '3px 4px',
                          borderRadius: '6px',
                          border: '1px solid #fcd34d'
                        }}>
                          {[1, 2, 3, 4, 5, 6].map((slot) => (
                            <div key={slot} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#ffffff',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              border: '1px solid #d97706',
                              boxSizing: 'border-box',
                              gap: '3px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                                <div style={{
                                  width: '12px',
                                  height: '12px',
                                  border: '1.5px solid #78350f',
                                  borderRadius: '2px',
                                  backgroundColor: '#fffdf8',
                                  flexShrink: 0
                                }} title="Check off" />
                                <span style={{
                                  fontSize: '0.56rem',
                                  fontWeight: 900,
                                  color: '#1e1b4b'
                                }}>
                                  #{slot}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0, margin: '0 2px' }}>
                                <span style={{
                                  fontSize: '0.5rem',
                                  color: '#92400e',
                                  borderBottom: '1px dashed #b45309',
                                  width: '100%',
                                  display: 'inline-block'
                                }}>
                                  Item:
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#78350f' }}>Ltr:</span>
                                <div style={{
                                  width: '13px',
                                  height: '13px',
                                  border: '1px solid #78350f',
                                  borderRadius: '2px',
                                  backgroundColor: '#ffffff',
                                  flexShrink: 0
                                }} title="Letter" />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 6-Letter Secret Brew Word Blanks */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#ffffff',
                          border: '1px dashed #d97706',
                          borderRadius: '4px',
                          padding: '2px 5px',
                          marginTop: '3px'
                        }}>
                          <span style={{ fontSize: '0.54rem', fontWeight: 900, color: '#78350f' }}>
                            🧩 Secret Word (6 Letters):
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {[0, 1, 2, 3, 4, 5].map((idx) => (
                              <div
                                key={idx}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  border: `1.5px solid ${quest.color}`,
                                  borderRadius: '2px',
                                  backgroundColor: '#fffdf8'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer Instructions */}
                      <div style={{
                        fontSize: '0.6rem',
                        color: '#92400e',
                        textAlign: 'center',
                        fontWeight: 600,
                        borderTop: '1px dashed #d97706',
                        paddingTop: '3px',
                        marginTop: '4px'
                      }}>
                        Tap phone or scan QR to start. Return to the Alchemy lab for brewing! 🎃
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Office Map Backside Guide • Explorer's Field Guide (8.5" x 11") */}
        {viewMode === 'map_guide' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {/* Action Bar */}
            <div className="no-print" style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1.5px solid #f97316',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxSizing: 'border-box',
              flexWrap: 'wrap'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fdba74', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🗺️</span>
                  <span>Office Map Backside: Explorer's Field Guide</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  Print directly on the back of your office floor plan map! 100% spoiler-free heroic quest log with dual spaces for Age &lt;9 and Age 9+.
                </p>
              </div>

              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.55rem 1.3rem',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 0 16px rgba(249, 115, 22, 0.4)',
                  flexShrink: 0
                }}
              >
                <Printer size={16} />
                <span>PRINT FIELD GUIDE (8.5" x 11")</span>
              </button>
            </div>

            {/* Authentic Printable 8.5" x 11" Explorer's Field Guide */}
            <div className="print-page-container" style={{
              width: '8.0in',
              minHeight: '10.4in',
              maxHeight: '10.4in',
              backgroundColor: '#ffffff',
              color: '#1c1917',
              border: '2.5px solid #1c1917',
              borderRadius: '2px',
              padding: '0.2in 0.32in',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              fontFamily: 'serif'
            }}>
              {/* Inner Decorative Framing Border */}
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '5px',
                right: '5px',
                bottom: '5px',
                border: '1px solid #1c1917',
                borderRadius: '2px',
                pointerEvents: 'none'
              }} />

              {/* CORNER DECORATION 1: TOP-LEFT COBWEB WITH HANGING STAR */}
              <svg width="65" height="65" viewBox="0 0 65 65" style={{ position: 'absolute', top: '6px', left: '6px', pointerEvents: 'none' }}>
                <path d="M0,0 L60,0 M0,0 L45,45 M0,0 L0,60" stroke="#1c1917" strokeWidth="1.2" fill="none" />
                <path d="M20,0 Q18,18 0,20 M40,0 Q36,36 0,40 M60,0 Q54,54 0,60" stroke="#1c1917" strokeWidth="0.9" fill="none" />
                <line x1="30" y1="28" x2="30" y2="52" stroke="#1c1917" strokeWidth="0.8" strokeDasharray="1,1" />
                <polygon points="30,52 31.5,56 35,56 32,58 33,62 30,59.5 27,62 28,58 25,56 28.5,56" fill="#1c1917" />
                <polygon points="48,15 49,18 52,18 49.5,20 50.5,23 48,21 45.5,23 46.5,20 44,18 47,18" fill="#1c1917" />
              </svg>

              {/* CORNER DECORATION 2: TOP-RIGHT COBWEB WITH STARS */}
              <svg width="65" height="65" viewBox="0 0 65 65" style={{ position: 'absolute', top: '6px', right: '6px', pointerEvents: 'none' }}>
                <path d="M65,0 L5,0 M65,0 L20,45 M65,0 L65,60" stroke="#1c1917" strokeWidth="1.2" fill="none" />
                <path d="M45,0 Q47,18 65,20 M25,0 Q29,36 65,40 M5,0 Q11,54 65,60" stroke="#1c1917" strokeWidth="0.9" fill="none" />
                <polygon points="17,15 18,18 21,18 18.5,20 19.5,23 17,21 14.5,23 15.5,20 13,18 16,18" fill="#1c1917" />
                <polygon points="35,35 36,38 39,38 36.5,40 37.5,43 35,41 32.5,43 33.5,40 31,38 34,38" fill="#1c1917" />
              </svg>

              {/* CORNER DECORATION 3: BOTTOM-LEFT COBWEB WITH FLYING BAT */}
              <svg width="70" height="70" viewBox="0 0 70 70" style={{ position: 'absolute', bottom: '6px', left: '6px', pointerEvents: 'none' }}>
                <path d="M0,70 L60,70 M0,70 L45,25 M0,70 L0,10" stroke="#1c1917" strokeWidth="1.2" fill="none" />
                <path d="M20,70 Q18,52 0,50 M40,70 Q36,34 0,30 M60,70 Q54,16 0,10" stroke="#1c1917" strokeWidth="0.9" fill="none" />
                {/* Cute Bat icon */}
                <path d="M20,20 C22,14 26,14 28,18 C30,14 34,14 36,20 C38,16 44,17 42,24 C38,28 34,30 28,30 C22,30 18,28 14,24 C12,17 18,16 20,20 Z" fill="#1c1917" />
                <polygon points="50,45 51,48 54,48 51.5,50 52.5,53 50,51 47.5,53 48.5,50 46,48 49,48" fill="#1c1917" />
              </svg>

              {/* CORNER DECORATION 4: BOTTOM-RIGHT COBWEB WITH CUTE GHOST */}
              <svg width="70" height="70" viewBox="0 0 70 70" style={{ position: 'absolute', bottom: '6px', right: '6px', pointerEvents: 'none' }}>
                <path d="M70,70 L10,70 M70,70 L25,25 M70,70 L70,10" stroke="#1c1917" strokeWidth="1.2" fill="none" />
                <path d="M50,70 Q52,52 70,50 M30,70 Q34,34 70,30 M10,70 Q16,16 70,10" stroke="#1c1917" strokeWidth="0.9" fill="none" />
                {/* Cute Ghost icon */}
                <path d="M42,28 C42,20 54,20 54,28 C55,34 56,40 54,42 C52,40 50,42 48,40 C46,42 44,40 42,42 C40,40 41,34 42,28 Z" fill="#1c1917" />
                <circle cx="46" cy="25" r="1.2" fill="#ffffff" />
                <circle cx="50" cy="25" r="1.2" fill="#ffffff" />
                <polygon points="20,45 21,48 24,48 21.5,50 22.5,53 20,51 17.5,53 18.5,50 16,48 19,48" fill="#1c1917" />
              </svg>

              {/* SECTION 1: TITLE & HEROIC LORE INTRO */}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginTop: '2px' }}>
                {/* Witch Hat Doodle with Stars */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem' }}>★</span>
                  <svg width="28" height="24" viewBox="0 0 28 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M3,20 C8,21 20,21 25,20 C27,19 27,22 25,22 C18,23 10,23 3,22 C1,22 1,19 3,20 Z" fill="#1c1917" />
                    <path d="M14,2 C15,2 17,9 19,19 C15,19.5 13,19.5 9,19 C11,9 13,2 14,2 Z" fill="#1c1917" />
                    <path d="M10,16 C12,16.3 16,16.3 18,16 L18.5,18 C16.5,18.3 11.5,18.3 9.5,18 Z" fill="#b45309" />
                  </svg>
                  <span style={{ fontSize: '0.8rem' }}>★</span>
                </div>

                <h1 style={{
                  margin: '2px 0 0 0',
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#1c1917',
                  letterSpacing: '1px',
                  lineHeight: 1.1,
                  textTransform: 'uppercase'
                }}>
                  THE GREAT ALCHEMY QUEST!
                </h1>

                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  color: '#1c1917',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginTop: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <span>★</span>
                  <span>EXPLORER'S FIELD GUIDE</span>
                  <span>★</span>
                </div>

                <p style={{
                  margin: '3px auto 0 auto',
                  fontSize: '0.9rem',
                  color: '#292524',
                  fontWeight: 600,
                  lineHeight: 1.25,
                  maxWidth: '6.8in'
                }}>
                  Seeker of elixirs, your journey begins! Search the office to discover 6 ingredients that match your rune. For a greater challenge you can solve the riddles and unscramble the letters to reveal the potion!
                </p>
              </div>

              {/* SECTION 2: HOW TO PLAY (WITH VINTAGE NON-WHITE PARCHMENT ACCENT) */}
              <div style={{
                margin: '2px 0',
                position: 'relative',
                zIndex: 1,
                backgroundColor: '#fbf9f2',
                border: '1.5px solid #1c1917',
                borderRadius: '6px',
                padding: '4px 8px 5px 8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  color: '#1c1917',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '3px'
                }}>
                  <span>📜</span>
                  <span>HOW TO PLAY</span>
                  <span>📜</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '5px',
                  textAlign: 'left'
                }}>
                  {/* Step 1: All Explorers */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #78716c',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    fontSize: '0.59rem',
                    lineHeight: 1.2,
                    color: '#1c1917'
                  }}>
                    <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px', color: '#1c1917' }}>
                      <span>🔮</span>
                      <span>1. Choose a Rune</span>
                    </div>
                    Fate decides your rune when you play the game in the Alchemy Lab (Software R&D).
                  </div>

                  {/* Step 2: All Explorers */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #78716c',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    fontSize: '0.59rem',
                    lineHeight: 1.2,
                    color: '#1c1917'
                  }}>
                    <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px', color: '#1c1917' }}>
                      <span>📜</span>
                      <span>2. Find Posters</span>
                    </div>
                    Search rooms for hidden posters marked with your Rune.
                  </div>

                  {/* Step 3: Age 3-9 Apprentice Track */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #15803d',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    fontSize: '0.59rem',
                    lineHeight: 1.2,
                    color: '#1c1917'
                  }}>
                    <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px', color: '#15803d' }}>
                      <span>🌿</span>
                      <span>3A. Ages 3–9 Path</span>
                    </div>
                    Spot the ingredient on the poster! Write or draw it in your log below (or tap to register).
                  </div>

                  {/* Step 4: Age 9+ Master Alchemist Track */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #b45309',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    fontSize: '0.59rem',
                    lineHeight: 1.2,
                    color: '#1c1917'
                  }}>
                    <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px', color: '#b45309' }}>
                      <span>⭐</span>
                      <span>3B. Age 9+ Path</span>
                    </div>
                    Read the riddle, note your answer, collect the secret letter, and unscramble the brew word!
                  </div>
                </div>
              </div>

              {/* SECTION 3: 2. THE QUEST LOG (PERFECTLY ALIGNED DUAL-AGE TABLE) */}
              <div style={{ position: 'relative', zIndex: 1, margin: '1px 0' }}>
                <div style={{
                  border: '1.5px solid #1c1917',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff'
                }}>
                  {/* Table Header Bar */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr 1.15fr',
                    backgroundColor: '#f5efe4',
                    borderBottom: '1.5px solid #1c1917'
                  }}>
                    <div style={{
                      padding: '4px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.68rem',
                      color: '#1c1917',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderRight: '1px solid #1c1917'
                    }}>
                      SLOT
                    </div>

                    <div style={{
                      padding: '3px 8px',
                      borderRight: '1px solid #1c1917',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🌿</span>
                        <span>AGES 3–9 • APPRENTICE QUEST</span>
                      </div>
                      <div style={{ fontSize: '0.56rem', color: '#44403c', fontWeight: 600 }}>
                        What ingredient did you discover? (write or draw)
                      </div>
                    </div>

                    <div style={{
                      padding: '3px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>⭐</span>
                        <span>AGES 9+ • MASTER ALCHEMIST QUEST</span>
                      </div>
                      <div style={{ fontSize: '0.56rem', color: '#44403c', fontWeight: 600 }}>
                        Solve the riddle & record the secret letter
                      </div>
                    </div>
                  </div>

                  {/* 6 Aligned Ingredient Rows */}
                  {[1, 2, 3, 4, 5, 6].map((slot, index) => (
                    <div
                      key={slot}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '70px 1fr 1.15fr',
                        borderBottom: index < 5 ? '1px solid #e7e5e4' : 'none',
                        minHeight: '34px',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#faf9f5'
                      }}
                    >
                      {/* Col 1: Ingredient Slot Badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3px 4px',
                        borderRight: '1px solid #1c1917',
                        backgroundColor: '#fbf9f2'
                      }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          color: '#1c1917',
                          backgroundColor: '#ffffff',
                          border: '1px solid #1c1917',
                          borderRadius: '3px',
                          padding: '1px 5px',
                          whiteSpace: 'nowrap'
                        }}>
                          🔍 #{slot}
                        </span>
                      </div>

                      {/* Col 2: Age 3-9 Writing Area */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRight: '1px solid #1c1917',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#1c1917', whiteSpace: 'nowrap' }}>
                          Ingredient:
                        </span>
                        <div style={{
                          flex: 1,
                          borderBottom: '1.2px solid #1c1917',
                          height: '14px',
                          minWidth: '40px'
                        }} />
                      </div>

                      {/* Col 3: Age 9+ Riddle & Letter Area */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        gap: '6px'
                      }}>
                        <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#1c1917', whiteSpace: 'nowrap' }}>
                          Riddle Answer:
                        </span>
                        <div style={{
                          flex: 1,
                          borderBottom: '1.2px solid #1c1917',
                          height: '14px',
                          minWidth: '35px'
                        }} />

                        <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#1c1917', whiteSpace: 'nowrap', marginLeft: '3px' }}>
                          Letter:
                        </span>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '1.5px solid #1c1917',
                          borderRadius: '3px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.78rem',
                          color: '#1c1917',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
                          flexShrink: 0
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: 3. UNSCRAMBLE THE SECRET WORD (PARCHMENT SCROLL BANNER) */}
              <div style={{ position: 'relative', zIndex: 1, margin: '2px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#1c1917',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    3. UNSCRAMBLE THE SECRET WORD (AGE 9+)
                  </h3>
                </div>

                {/* Parchment Scroll with Curled Ends (Non-White Vintage Parchment Accent) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                  maxWidth: '7.2in',
                  margin: '0 auto'
                }}>
        

                  {/* Center Scroll Body */}
                  <div style={{
                    flex: 1,
                    backgroundColor: '#fbf9f2',
                    borderTop: '1.5px solid #1c1917',
                    borderBottom: '1.5px solid #1c1917',
                    padding: '4px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <div style={{
                      fontSize: '0.74rem',
                      fontWeight: 900,
                      color: '#1c1917',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>🧩</span>
                      <span>THE SECRET BREW WORD (6 LETTERS):</span>
                    </div>

                    {/* 6 Large Letter Boxes in Crisp Pure White */}
                    <div style={{ display: 'flex', gap: '8px', margin: '1px 0' }}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '2px solid #1c1917',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ fontSize: '0.58rem', color: '#292524', fontWeight: 600, textAlign: 'center' }}>
                      Take your 6 secret letters from the clue posters, unscramble them, and return to the Altar to claim your <strong>3D-Printed Potion Clicker!</strong>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 5: FOOTER NOTICE */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                border: '1.5px solid #1c1917',
                borderRadius: '999px',
                padding: '3px 14px',
                margin: '2px auto 0 auto',
                maxWidth: '5.2in',
                backgroundColor: '#fbf9f2',
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#1c1917'
              }}>
                Please return to the Master Cauldron after finishing! Happy Halloween! 🎃
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Realm Setup Checklist */}
        {viewMode === 'checklist' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto', width: '100%' }}>
            <div className="print-page-container" style={{
              backgroundColor: '#f8f2de',
              backgroundImage: 'linear-gradient(180deg, #fbf7ea 0%, #f6edd4 50%, #f0e3bf 100%)',
              color: '#2d1810',
              border: '8px solid #3d2314',
              borderRadius: '16px',
              padding: '0.4in 0.5in',
              boxSizing: 'border-box',
              minHeight: '10.5in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                {/* Header */}
                <div style={{
                  textAlign: 'center',
                  borderBottom: '2px solid #b45309',
                  paddingBottom: '0.6rem',
                  marginBottom: '0.8rem'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Event Preparation & Game Runner Guide
                  </div>
                  <h1 className="font-mystic" style={{ margin: '4px 0', fontSize: '1.75rem', color: '#3d2314' }}>
                    THE GREAT ALCHEMY QUEST • SETUP CHECKLIST
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', fontWeight: 600 }}>
                    12 Stations Readiness • Wall Mounting & Camera QR Verification
                  </p>
                </div>

                {/* Stations Table */}
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.78rem',
                  marginBottom: '1rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#3d2314', color: '#fef3c7' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'center', width: '35px' }}>#</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Ingredient & Runes</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Station Hiding Spot / Location</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', width: '70px' }}>Letter</th>
                      <th style={{ padding: '6px 6px', textAlign: 'center', width: '60px' }}>Printed</th>
                      <th style={{ padding: '6px 6px', textAlign: 'center', width: '60px' }}>Mounted</th>
                      <th style={{ padding: '6px 6px', textAlign: 'center', width: '60px' }}>QR Tested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((c, i) => (
                      <tr
                        key={c.id}
                        style={{
                          backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.6)' : 'transparent',
                          borderBottom: '1px solid rgba(180, 83, 9, 0.25)'
                        }}
                      >
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#78350f' }}>
                          #{c.number}
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#1e1b4b' }}>
                          {c.name}
                          <span style={{ fontSize: '0.7rem', color: '#92400e', marginLeft: '6px' }}>
                            ({c.runes.map(r => r.toUpperCase()).join(' & ')})
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', color: '#451a03', fontWeight: 600 }}>
                          📍 {c.location || 'Assign location'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: '#3d2314',
                            color: '#39ff14',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontWeight: 800
                          }}>
                            {c.targetLetter}
                          </span>
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center', fontSize: '1rem', color: '#78350f' }}>
                          ▢
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center', fontSize: '1rem', color: '#78350f' }}>
                          ▢
                        </td>
                        <td style={{ padding: '6px 6px', textAlign: 'center', fontSize: '1rem', color: '#78350f' }}>
                          ▢
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pre-Event Launch Checks */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid #b45309',
                  borderRadius: '8px',
                  padding: '0.65rem 0.9rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.76rem',
                  color: '#3d2314'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Audio & Music:</strong> Tested on iPad hub / speakers
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Welcome Pedestal Sign:</strong> Displayed at starting table
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Satchel Modal:</strong> Test Camera QR Scans & Rune NFC Bonding
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Plinko Board & Tokens:</strong> Cut out and ready for drops
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Certificates & Pens:</strong> Printed for winning alchemists
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1rem' }}>▢</span>
                    <strong>Staff Cheat Sheet:</strong> Kept at desk for hint facilitation
                  </div>
                </div>
              </div>

              {/* Sign-off footer */}
              <div style={{
                marginTop: '0.8rem',
                paddingTop: '0.5rem',
                borderTop: '1px dashed #b45309',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: '#78350f'
              }}>
                <div>
                  <strong>Quest Master On-Duty:</strong> ___________________________________
                </div>
                <div>
                  <strong>Pre-Flight Verified Date:</strong> ___________________
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Quest Master Cheat Sheet */}
        {viewMode === 'cheat_sheet' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto' }}>
            <div className="print-page-container" style={{
              backgroundColor: '#ffffff',
              color: '#090714',
              padding: '0.5in',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #b45309', paddingBottom: '0.5rem' }}>
                <h1 className="font-mystic" style={{ fontSize: '1.8rem', color: '#78350f', margin: 0 }}>
                  THE GREAT ALCHEMY QUEST • MASTER CHEAT SHEET
                </h1>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#92400e', fontWeight: 600 }}>
                  iPad Station Facilitator Reference • 4 Elemental Runes & Secret Solutions
                </p>
              </div>

              {/* 4 Runes Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(r => {
                  const quest = QUESTS[r];
                  const questMatchingCards = cards.filter(c => c.runes.includes(r));

                  return (
                    <div
                      key={r}
                      style={{
                        border: `2px solid ${quest.color}`,
                        borderRadius: '12px',
                        padding: '0.75rem',
                        backgroundColor: '#fffbeb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            filter: `drop-shadow(0 2px 8px ${quest.color})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#090714'
                          }}>
                            <img
                              src={quest.icon}
                              alt={quest.title}
                              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                            />
                          </div>
                          <div>
                            <strong style={{ fontSize: '1.15rem', color: '#1e1b4b', display: 'block' }}>
                              {quest.title}
                            </strong>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: quest.color, textTransform: 'uppercase' }}>
                              {quest.rune} Rune • {quest.color}
                            </span>
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '4px 14px',
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '1.05rem',
                          letterSpacing: '2px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                          SECRET WORD: {quest.secretWord}
                        </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#fed7aa', textAlign: 'left' }}>
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Card #</th>
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Ingredient (Kids)</th>
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Letter</th>
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Riddle Answer</th>
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Station Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questMatchingCards.map(c => (
                            <tr key={c.id}>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d', fontWeight: 700 }}>#{c.number}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.name}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d', fontWeight: 900, color: '#b45309' }}>[{c.targetLetter}]</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.riddleAnswer}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.location || 'Station'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: Printable Mythical Welcome Sign for iPad Desk */}
        {viewMode === 'table_sign' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
            {/* Top Toolbar */}
            <div className="no-print" style={{
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: '1.5px solid #eab308',
              padding: '0.85rem 1.25rem',
              borderRadius: '16px',
              maxWidth: '8.5in',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxSizing: 'border-box'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fde047', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📜</span>
                  <span>Mythical Welcome Station Poster</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#fef08a' }}>
                  Print this 8.5" x 11" sign to frame or stand on the welcome table next to the iPad in the Alchemy Lab (Software R&D).
                </p>
              </div>
              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: '#eab308',
                  color: '#090714',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.55rem 1.3rem',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 0 16px rgba(234, 179, 8, 0.4)',
                  flexShrink: 0
                }}
              >
                <Printer size={16} />
                <span>PRINT WELCOME SIGN (8.5" x 11")</span>
              </button>
            </div>

            {/* Poster Print Page */}
            <div className="print-page-container" style={{
              width: '8.0in',
              height: '10.4in',
              maxHeight: '10.4in',
              maxWidth: '8.0in',
              margin: '0 auto',
              backgroundColor: '#fbf5e6',
              backgroundImage: `
                radial-gradient(circle at 50% 10%, rgba(217, 119, 6, 0.12) 0%, transparent 55%),
                radial-gradient(circle at 50% 90%, rgba(180, 83, 9, 0.1) 0%, transparent 60%),
                linear-gradient(180deg, #fcf7ed 0%, #f6edd6 40%, #edd9ad 100%)
              `,
              border: '12px solid #2d1408',
              borderRadius: '16px',
              padding: '0.38in 0.42in',
              color: '#2d1810',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              position: 'relative',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}>
              {/* Ornate Gold Filigree Inner Inset */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                right: '10px',
                bottom: '10px',
                border: '2px solid #b45309',
                borderRadius: '8px',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Corner Filigree Flourishes */}
              <div style={{ position: 'absolute', top: '14px', left: '16px', fontSize: '1.2rem', color: '#b45309', opacity: 0.7, zIndex: 2 }}>⚜</div>
              <div style={{ position: 'absolute', top: '14px', right: '16px', fontSize: '1.2rem', color: '#b45309', opacity: 0.7, zIndex: 2 }}>⚜</div>
              <div style={{ position: 'absolute', bottom: '14px', left: '16px', fontSize: '1.2rem', color: '#b45309', opacity: 0.7, zIndex: 2 }}>⚜</div>
              <div style={{ position: 'absolute', bottom: '14px', right: '16px', fontSize: '1.2rem', color: '#b45309', opacity: 0.7, zIndex: 2 }}>⚜</div>

              {/* Hero Header */}
              <div style={{ position: 'relative', zIndex: 5 }}>
                {/* Grand Medallion */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                  <img
                    src="/sprites/medallion_all.png"
                    alt="Grand Alchemist Medallion"
                    style={{
                      width: '58px',
                      height: '58px',
                      filter: 'drop-shadow(0 4px 10px rgba(180, 83, 9, 0.45))'
                    }}
                  />
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  color: '#92400e',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <span>★</span>
                  <span>WELCOME TO THE ALCHEMY ADVENTURE</span>
                  <span>★</span>
                </div>

                <h1 className="font-mystic" style={{
                  fontSize: '2.6rem',
                  margin: '0.3rem 0',
                  color: '#2a1205',
                  letterSpacing: '1px',
                  lineHeight: 1.1,
                  textShadow: '0 2px 4px rgba(180, 83, 9, 0.25)'
                }}>
                  THE GREAT ALCHEMY QUEST
                </h1>

                <p style={{
                  fontSize: '1.05rem',
                  color: '#78350f',
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '0.2px'
                }}>
                  Solve the riddles • Transmute the elements • Win a 3D-Printed Mini Potion Clicker!
                </p>
              </div>

              {/* 3 Mythical Step Plaques */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.85rem',
                margin: '0.85rem 0',
                position: 'relative',
                zIndex: 5
              }}>
                {/* Step 1: Pick a Totem */}
                <div style={{
                  background: 'linear-gradient(180deg, #fffdf8 0%, #fdf5df 100%)',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '0.95rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(61, 35, 20, 0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    <img
                      src="/sprites/item_glow_lantern.png"
                      alt="Alchemical Lantern"
                      style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(57, 255, 20, 0.35))' }}
                    />
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#2a1205', fontWeight: 800 }}>
                    1. Choose a Rune
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.79rem', color: '#78350f', lineHeight: 1.35, textAlign: 'center' }}>
                    Allow fate to decide your Rune! Tap phone (NFC) or scan its QR code to bond your satchel!
                  </p>

                  <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                    {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(r => (
                      <div key={r} style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#1e1b2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: `drop-shadow(0 2px 4px ${QUESTS[r].color})`
                      }}>
                        <img src={QUESTS[r].icon} alt={r} style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Explore & Seek */}
                <div style={{
                  background: 'linear-gradient(180deg, #fffdf8 0%, #fdf5df 100%)',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '0.95rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(61, 35, 20, 0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    <img
                      src="/sprites/item_magical_compass.png"
                      alt="Magical Compass"
                      style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0, 200, 255, 0.35))' }}
                    />
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#2a1205', fontWeight: 800 }}>
                    2. Explore & Seek
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.79rem', color: '#78350f', lineHeight: 1.35, textAlign: 'center' }}>
                    Walk around looking for posters bearing your Rune emblem in the corners.
                  </p>

                  <div style={{
                    backgroundColor: 'rgba(180, 83, 9, 0.1)',
                    border: '1px solid rgba(180, 83, 9, 0.25)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    color: '#78350f',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}>
                    📷 Point Camera to Scan
                  </div>
                </div>

                {/* Step 3: Brew & Claim */}
                <div style={{
                  background: 'linear-gradient(180deg, #fffdf8 0%, #fdf5df 100%)',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '0.95rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(61, 35, 20, 0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}>
                    <img
                      src="/sprites/cauldron_bubble.png"
                      alt="Bubbling Cauldron"
                      style={{ width: '52px', height: '52px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(191, 90, 242, 0.35))' }}
                    />
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#2a1205', fontWeight: 800 }}>
                    3. Brew & Claim!
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.79rem', color: '#78350f', lineHeight: 1.35, textAlign: 'center' }}>
                    Return to this iPad, tap your Rune, solve the puzzle, and claim your Potion Clicker prize!
                  </p>

                  <div style={{
                    backgroundColor: 'rgba(191, 90, 242, 0.12)',
                    border: '1px solid rgba(191, 90, 242, 0.3)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    color: '#6b21a8',
                    fontWeight: 700,
                    marginTop: '8px'
                  }}>
                    ✨ 6-Letter Secret Brew
                  </div>
                </div>
              </div>

              {/* 3D Printed Potion Callout (Enchanted Treasure Scroll) */}
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '2.5px dashed #d97706',
                borderRadius: '18px',
                padding: '0.8rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.4rem',
                position: 'relative',
                zIndex: 5,
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
              }}>
                <div style={{
                  padding: '3px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #b45309',
                  borderRadius: '14px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                  flexShrink: 0
                }}>
                  <img
                    src="/assets/3D_printed_potions.png"
                    alt="Potion Clickers"
                    style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#3d2314', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>✨</span>
                    <span>Real 3D-Printed Mini Potion Fidget Toys!</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#92400e', marginTop: '3px', lineHeight: 1.35 }}>
                    Collect all 4 elemental colors by solving additional quests throughout the day! Handcrafted with clicking corks!
                  </div>
                </div>
              </div>

              {/* Mystical Footer */}
              <div style={{
                fontSize: '0.85rem',
                color: '#78350f',
                fontWeight: 700,
                position: 'relative',
                zIndex: 5,
                borderTop: '1.5px dashed rgba(180, 83, 9, 0.4)',
                paddingTop: '0.45rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <div>
                  Please return to the Master Cauldron to finish your brew! Happy Halloween! 🎃
                </div>
                <div style={{ fontSize: '0.72rem', color: '#92400e', letterSpacing: '1px' }}>
                  🜂 Crimson Fire  •  🜄 Glacial Frost  •  🜁 Toxic Venom  •  🜃 Shadow Moon
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: Alchemist Certificates of Achievement */}
        {viewMode === 'certificates' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {/* Customizer Toolbar */}
            <div className="no-print glass-panel" style={{
              width: '100%',
              padding: '1rem 1.25rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, display: 'block' }}>
                    Alchemist Name (or leave blank to hand-sign):
                  </label>
                  <input
                    type="text"
                    value={certRecipient}
                    onChange={(e) => setCertRecipient(e.target.value)}
                    placeholder="e.g. Maya the Brave Alchemist"
                    style={{
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(10, 7, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      minWidth: '240px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, display: 'block' }}>
                    Rank / Mode:
                  </label>
                  <select
                    value={certRank}
                    onChange={(e) => setCertRank(e.target.value as any)}
                    style={{
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(10, 7, 20, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="Apprentice Alchemist">Apprentice Alchemist (Kids Picture Hunter)</option>
                    <option value="Master Alchemist">Master Alchemist (Cipher Cryptographer)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handlePrint}
                style={{
                  backgroundColor: '#ffbe0b',
                  color: '#090714',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.55rem 1.4rem',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 15px rgba(255, 190, 11, 0.5)'
                }}
              >
                <Printer size={16} />
                <span>PRINT CERTIFICATE (8.5" x 11")</span>
              </button>
            </div>

            {/* Printable 8.5" x 11" Certificate Container */}
            <div className="print-page-container" style={{
              width: '8.0in',
              height: '10.4in',
              margin: '0 auto',
              backgroundColor: '#fbf5e5',
              backgroundImage: `
                radial-gradient(circle at 10% 10%, rgba(217, 119, 6, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 90% 90%, rgba(180, 83, 9, 0.08) 0%, transparent 40%),
                linear-gradient(180deg, #fdfaf0 0%, #fbf3df 50%, #f6e8c3 100%)
              `,
              border: '16px solid #3d2314',
              borderRadius: '16px',
              boxSizing: 'border-box',
              padding: '0.6in 0.5in',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
              color: '#2d1810',
              overflow: 'hidden'
            }}>
              {/* Ornate Inset Border */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                bottom: '16px',
                border: '2px solid #b45309',
                borderRadius: '8px',
                pointerEvents: 'none',
                zIndex: 1
              }} />

              {/* Spiderweb corners */}
              <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '1.6rem', opacity: 0.6 }}>🕸️</div>
              <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '1.6rem', opacity: 0.6 }}>🕸️</div>
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', fontSize: '1.6rem', opacity: 0.6 }}>🎃</div>
              <div style={{ position: 'absolute', bottom: '24px', right: '24px', fontSize: '1.6rem', opacity: 0.6 }}>🎃</div>

              {/* Certificate Top Header */}
              <div style={{ zIndex: 5, marginTop: '0.2in' }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  letterSpacing: '3px',
                  color: '#78350f',
                  textTransform: 'uppercase'
                }}>
                  THE ANCIENT GUILD OF ALCHEMISTS
                </div>
                <h1 className="font-mystic" style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: '#3d2314',
                  letterSpacing: '2px',
                  margin: '0.3rem 0',
                  textTransform: 'uppercase'
                }}>
                  CERTIFICATE OF ALCHEMY
                </h1>
                <div style={{
                  width: '180px',
                  height: '3px',
                  backgroundColor: '#b45309',
                  margin: '0.2rem auto 0.6rem auto'
                }} />
                <div style={{ fontSize: '1.05rem', color: '#92400e', fontStyle: 'italic', fontFamily: 'serif' }}>
                  This hereby certifies that
                </div>
              </div>

              {/* Recipient Name Stage */}
              <div style={{ zIndex: 5, width: '100%', maxWidth: '5.5in', margin: '0.3in 0' }}>
                <div style={{
                  borderBottom: '3px solid #3d2314',
                  paddingBottom: '0.2rem',
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-scroll)',
                  color: '#78350f',
                  minHeight: '2.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {certRecipient || ''}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#78350f', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Name of Honored Initiate
                </div>
              </div>

              {/* Body Text */}
              <div style={{ zIndex: 5, maxWidth: '6in', fontSize: '1.15rem', lineHeight: 1.5, color: '#3d2314' }}>
                has braved the enchanted corridors, attuned the sacred path, and decoded the hidden ingredients of the realm to attain the rank of:
                <div style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#b45309',
                  fontFamily: 'var(--font-mystic)',
                  margin: '0.5rem 0',
                  letterSpacing: '1px'
                }}>
                  ★ {certRank.toUpperCase()} ★
                </div>
                and is hereby granted full honors of Master Potion Explorer!
              </div>

              {/* Signatures & Seal Stage */}
              <div style={{
                zIndex: 5,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                padding: '0 0.4in',
                marginBottom: '0.2in'
              }}>
                {/* Grand Alchemist Sig */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-scroll)',
                    fontSize: '1.3rem',
                    color: '#78350f',
                    marginBottom: '4px',
                    fontStyle: 'italic'
                  }}>
                    Ignis Thorne, Arch-Mage
                  </div>
                  <div style={{ width: '180px', height: '2px', backgroundColor: '#78350f' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginTop: '3px' }}>
                    Grand Alchemist
                  </span>
                </div>

                {/* Golden Wax Seal */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #f59e0b 0%, #b45309 80%, #78350f 100%)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  border: '3px solid #fef3c7'
                }}>
                  <div style={{ fontSize: '4rem' }}>⚗️</div>
                </div>

                {/* Quest Master Date */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-scroll)',
                    fontSize: '1.15rem',
                    color: '#78350f',
                    marginBottom: '4px'
                  }}>
                    October 31, 2026
                  </div>
                  <div style={{ width: '180px', height: '2px', backgroundColor: '#78350f' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', marginTop: '3px' }}>
                    Quest Master Realm Station
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5.5: Printable Circular Plinko Discs (8.5" x 11" Sheet) */}
        {viewMode === 'plinko_discs' && (
          <div style={{ maxWidth: '8.5in', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {/* Toolbar Banner */}
            <div className="no-print glass-panel" style={{
              width: '100%',
              padding: '1rem 1.4rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}>
              <div>
                <h3 className="font-mystic" style={{ margin: 0, color: '#00d2ff', fontSize: '1.2rem' }}>
                  🎲 PLINKO DISC LABELS & RELIC QUEST TOKENS
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: '#cbd5e1' }}>
                  Print on standard Letter Cardstock or Label Sticker Paper. Cut out along the dotted circles to stick onto wooden or plastic Plinko discs so players can be assigned their Elemental Quest!
                </p>
              </div>

              <button
                onClick={handlePrint}
                style={{
                  background: 'linear-gradient(135deg, #00d2ff, #0077b6)',
                  border: 'none',
                  color: '#090714',
                  borderRadius: '999px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 18px rgba(0, 210, 255, 0.5)'
                }}
              >
                <Printer size={18} />
                <span>Print Plinko Discs Sheet</span>
              </button>
            </div>

            {/* Standard 8.5" x 11" Printable Page Container */}
            <div className="print-page-container" style={{
              width: '8.0in',
              height: '10.4in',
              margin: '0 auto',
              padding: '0.3in 0.4in',
              backgroundColor: '#fbf5e5',
              border: '2px solid #8b5e34',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              color: '#1e293b'
            }}>
              {/* Page Title & Instructions */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #b45309', paddingBottom: '0.2in' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '2px', color: '#92400e', textTransform: 'uppercase' }}>
                  The Great Alchemy Quest • Official Game Tokens
                </div>
                <h2 className="font-mystic" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#78350f', margin: '2px 0' }}>
                  ELEMENTAL PLINKO DISCS & FAMILIARS
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#78350f', fontStyle: 'italic' }}>
                  ✂️ Cut along the outer dotted lines to attach to 2.25" – 2.5" Plinko chips or player badges
                </div>
              </div>

              {/* 3 x 4 Grid of 12 Circular Plinko Tokens */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.35in 0.3in',
                padding: '0.2in 0.1in',
                justifyItems: 'center',
                alignItems: 'center',
                flex: 1
              }}>
                {[
                  // 2x Fire
                  { name: 'FIRE TORCH', rune: 'fire', icon: '/sprites/rune_fire.png', color: '#dc2626', tag: 'Crimson Relic' },
                  { name: 'FIRE TORCH', rune: 'fire', icon: '/sprites/rune_fire.png', color: '#dc2626', tag: 'Crimson Relic' },
                  // 2x Frost
                  { name: 'FROST CRYSTAL', rune: 'frost', icon: '/sprites/rune_frost.png', color: '#0284c7', tag: 'Glacial Relic' },
                  { name: 'FROST CRYSTAL', rune: 'frost', icon: '/sprites/rune_frost.png', color: '#0284c7', tag: 'Glacial Relic' },
                  // 2x Venom
                  { name: 'VENOM LEAF', rune: 'venom', icon: '/sprites/rune_venom.png', color: '#16a34a', tag: 'Toxic Relic' },
                  { name: 'VENOM LEAF', rune: 'venom', icon: '/sprites/rune_venom.png', color: '#16a34a', tag: 'Toxic Relic' },
                  // 2x Moon
                  { name: 'SHADOW MOON', rune: 'moon', icon: '/sprites/rune_moon.png', color: '#9333ea', tag: 'Mystic Relic' },
                  { name: 'SHADOW MOON', rune: 'moon', icon: '/sprites/rune_moon.png', color: '#9333ea', tag: 'Mystic Relic' },
                  // Guild Avatars & Animal Familiars (from avatars.png)
                  { name: 'APPRENTICE', rune: 'guild', icon: '/sprites/avatar_apprentice.png', color: '#ea580c', tag: 'Picture Quest' },
                  { name: 'MASTER MAGE', rune: 'guild', icon: '/sprites/avatar_master.png', color: '#7c3aed', tag: 'Cipher Quest' },
                  { name: 'GUILD OWL', rune: 'pet', icon: '/sprites/avatar_guildmaster.png', color: '#d97706', tag: 'Guild Master' },
                  { name: 'SHADOW RACCOON', rune: 'pet', icon: '/sprites/avatar_ranger.png', color: '#4c1d95', tag: 'Shadow Ranger' },
                ].map((token, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '2.15in',
                      height: '2.15in',
                      borderRadius: '50%',
                      border: '1.5px dashed #64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Inner Token Disc */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: `3px solid ${token.color}`,
                      backgroundColor: '#1e1b2e',
                      backgroundImage: 'radial-gradient(circle, #2d244a 0%, #130f24 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
                      padding: '6px',
                      boxSizing: 'border-box'
                    }}>
                      {/* Metallic Ring Accent */}
                      <div style={{
                        position: 'absolute',
                        inset: '3px',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 215, 0, 0.45)',
                        pointerEvents: 'none'
                      }} />

                      {/* Icon */}
                      <img
                        src={token.icon}
                        alt={token.name}
                        style={{
                          width: '1.2in',
                          height: '1.2in',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.65))'
                        }}
                      />

                      {/* Name Banner */}
                      <div style={{
                        backgroundColor: token.color,
                        color: '#ffffff',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        letterSpacing: '0.8px',
                        padding: '1px 8px',
                        borderRadius: '999px',
                        marginTop: '2px',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap'
                      }}>
                        {token.name}
                      </div>

                      {/* Sub-tag */}
                      <div style={{
                        fontSize: '0.52rem',
                        color: '#cbd5e1',
                        fontWeight: 700,
                        marginTop: '1px'
                      }}>
                        {token.tag}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Page Footer */}
              <div style={{
                textAlign: 'center',
                borderTop: '1px solid #b45309',
                paddingTop: '0.1in',
                fontSize: '0.68rem',
                color: '#78350f',
                fontWeight: 700
              }}>
                🏰 The Great Alchemy Quest • Suitable for Plinko Drop Discs, Table Markers & Player Team Badges
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: AI Asset Prompter & Consistency Style Guide */}
        {viewMode === 'prompts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '20px',
              borderLeft: '4px solid #bf5af2',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={22} color="#bf5af2" />
                <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                  AI ASSET PROMPTER & VISUAL CONSISTENCY GUIDE
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Use this style blueprint to generate new, perfectly harmonized icons, physical 3D totems, and signage matching the clean Kawaii Alchemy aesthetic in Midjourney, DALL-E 3, or Antigravity's image generator.
              </p>
            </div>

            {/* Interactive Prompt Generator */}
            <div className="glass-panel" style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffbe0b' }}>
                🔮 Generate Instant Ingredient Prompt
              </h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={customPromptName}
                  onChange={(e) => setCustomPromptName(e.target.value)}
                  placeholder="e.g. Phoenix Feather, Goblin Jelly, Starlight Dew..."
                  style={{
                    flex: '1 1 300px',
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(10, 7, 20, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.95rem'
                  }}
                />
                <button
                  onClick={() => {
                    const prompt = `Cute Kawaii Halloween alchemy ingredient icon of ${customPromptName || 'Magical Elixir'}, stylized 3D game asset, bold rounded dark outlines, vibrant jewel-tone gradient, magical sparkle particles, isolated pure white background, centered frontal view, soft ambient lighting, clean casual mobile game UI sprite, zero text, high resolution --v 6.0`;
                    navigator.clipboard.writeText(prompt);
                    setPromptCopied('custom');
                    setTimeout(() => setPromptCopied(null), 2000);
                  }}
                  style={{
                    backgroundColor: '#8338ec',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.65rem 1.4rem',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 15px rgba(131, 56, 236, 0.5)'
                  }}
                >
                  <Copy size={16} />
                  <span>{promptCopied === 'custom' ? '✓ Copied Prompt!' : 'Copy Ingredient Prompt'}</span>
                </button>
              </div>
            </div>

            {/* Prompt Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Card 1: 4 Elemental Physical Totems */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, color: '#ff3b30', fontSize: '1rem' }}>🔴 🔵 🟢 🟣 4 Physical Elemental Totems</h4>
                  <button
                    onClick={() => {
                      const p = `Set of 4 physical 3D-printed tabletop gaming totems for Halloween alchemy quest scavenger hunt, translucent silk colored filament: 1) Crimson Fire Torch in glowing ruby red, 2) Glacial Frost Crystal in ice sapphire blue, 3) Toxic Venom Leaf in emerald neon green, 4) Mystic Shadow Moon in astral amethyst purple. Carved dark stone pedestal bases with glowing runes, internal LED tea-light glow, cinematic macro studio product render, isolated on pure white background, clean product design, ultra high detail --v 6.0`;
                      navigator.clipboard.writeText(p);
                      setPromptCopied('totems');
                      setTimeout(() => setPromptCopied(null), 2000);
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} />
                    <span>{promptCopied === 'totems' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Use this to render visual mockups or 3D print guides for the physical handheld totems players carry through the realm.
                </p>
              </div>

              {/* Card 2: 3D-Printed Mini Potion Fidget Clickers */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, color: '#39ff14', fontSize: '1rem' }}>🧪 3D-Printed Mini Potion Fidget Clickers</h4>
                  <button
                    onClick={() => {
                      const p = `3D printed mini potion bottle desk fidget toys, ringless smooth glass body, cute natural cork stopper top acting as a tactile mechanical clicker button, vibrant translucent filament filled with swirl glitter potion in orange, neon green, and purple. Real product photograph, macro desk perspective, soft warm studio lighting, playful tactile aesthetic, clean background --v 6.0`;
                      navigator.clipboard.writeText(p);
                      setPromptCopied('potions');
                      setTimeout(() => setPromptCopied(null), 2000);
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} />
                    <span>{promptCopied === 'potions' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Use this for the victory prize showcase or 3D-printer model generation matching the real prize tokens.
                </p>
              </div>

              {/* Card 3: Bubbling Cauldrons */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, color: '#00d2ff', fontSize: '1rem' }}>🍲 Mystical Animated Cauldrons</h4>
                  <button
                    onClick={() => {
                      const p = `Cute Kawaii magical cast-iron cauldron with 3 small curved legs, bubbling glowing green and purple potion with rising magical spheres, dripping slime droplets over the rim, bold smooth dark outlines, stylized casual game asset, isolated pure white background, centered perspective, clean vibrant colors, zero text --v 6.0`;
                      navigator.clipboard.writeText(p);
                      setPromptCopied('cauldron');
                      setTimeout(() => setPromptCopied(null), 2000);
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#cbd5e1', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} />
                    <span>{promptCopied === 'cauldron' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                  Use this for alternate cauldron brewing animation frames or potion explosion screens.
                </p>
              </div>

              {/* Card 4: Negative Prompt Guidelines */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#f87171', fontSize: '1rem' }}>⛔ Universal Negative Prompts</h4>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                  Always append to avoid unwanted text, boxes, or photo clutter:
                </p>
                <code style={{
                  backgroundColor: 'rgba(10, 7, 20, 0.8)',
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#fbbf24',
                  lineHeight: 1.4,
                  wordBreak: 'break-word'
                }}>
                  --no text, letters, watermarks, frames, borders, dark background boxes, photorealistic humans, blurry, cropped
                </code>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: NFC & QR Code Directory */}
        {viewMode === 'nfc_tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
            {/* Guide & Domain Configuration Banner */}
            <div className="glass-panel" style={{
              padding: '1.35rem 1.6rem',
              borderRadius: '20px',
              borderLeft: '4px solid #39ff14',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>📱</span>
                  <div>
                    <h2 className="font-mystic" style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc' }}>
                      NFC & QR CODE DIRECTORY & PROGRAMMER
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: '#39ff14', fontWeight: 700 }}>
                      Pre-program physical NTAG213/215 stickers or download scannable QR codes for wall posters
                    </span>
                  </div>
                </div>

                {/* Batch Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    disabled={isDownloadingAllQr}
                    onClick={async () => {
                      setIsDownloadingAllQr(true);
                      playBloop(1.1);
                      for (const card of cards) {
                        await downloadCardQrCode(card, scanBaseUrl);
                        await new Promise(r => setTimeout(r, 200));
                      }
                      setIsDownloadingAllQr(false);
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.55rem 1.1rem',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: isDownloadingAllQr ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 0 12px rgba(2, 132, 199, 0.4)',
                      opacity: isDownloadingAllQr ? 0.7 : 1
                    }}
                  >
                    <QrCode size={15} />
                    <span>{isDownloadingAllQr ? 'Downloading All...' : 'Download All 12 QR Codes (PNG)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      playBloop(1.1);
                      const allUrls = cards.map(c => `Card #${c.number} (${c.name}): ${scanBaseUrl}/?scan=card-${c.number}`).join('\n');
                      navigator.clipboard.writeText(allUrls);
                      setCopiedNfcUrl('all');
                      setTimeout(() => setCopiedNfcUrl(null), 2500);
                    }}
                    style={{
                      backgroundColor: '#8338ec',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.55rem 1.1rem',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 0 12px rgba(131, 56, 236, 0.4)'
                    }}
                  >
                    <Copy size={15} />
                    <span>{copiedNfcUrl === 'all' ? '✓ Copied All 12 URLs!' : 'Copy All 12 URLs (Batch)'}</span>
                  </button>
                </div>
              </div>

              {/* Host / Domain Config Row */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
                  <Globe size={18} color="#38bdf8" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                      Scan Host / Domain Address
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Phones must access this address over local Wi-Fi (use Wi-Fi IP e.g. <code style={{ color: '#38bdf8' }}>http://192.168.x.x:5173</code> instead of localhost)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 350px' }}>
                  <input
                    type="text"
                    value={scanBaseUrl}
                    onChange={e => setScanBaseUrl(e.target.value.trim())}
                    placeholder="https://your-domain.com or http://192.168.1.50:5173"
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#38bdf8',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    onClick={() => {
                      playBloop(1.0);
                      setScanBaseUrl(window.location.origin);
                    }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Auto-Detect
                  </button>
                </div>
              </div>

              {/* Instructions Guide */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.85rem',
                fontSize: '0.82rem',
                color: '#cbd5e1'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <strong style={{ color: '#39ff14' }}>📱 1. NFC Tags (NTAG213 / 215 Stickers)</strong>
                  <div>• Open free <strong>"NFC Tools"</strong> on iPhone or Android.</div>
                  <div>• Tap <strong>Write</strong> ➔ <strong>Add a record</strong> ➔ <strong>URL / URI</strong>.</div>
                  <div>• Paste the card URL below and hold phone to the sticker.</div>
                  <div>• Stick behind the 📱 icon on each printed poster or station token.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <strong style={{ color: '#38bdf8' }}>📷 2. QR Codes (Zero-Install Camera Scanning)</strong>
                  <div>• QR codes are automatically embedded on all printed posters!</div>
                  <div>• Participants can point their phone's native <strong>Camera app</strong> at the QR code.</div>
                  <div>• Or they can download high-resolution individual PNGs below.</div>
                  <div>• Tapping the link opens the card and auto-syncs room music.</div>
                </div>
              </div>
            </div>

            {/* FEATURED: 4 Physical NFC Relic Tags Setup (One for each Elemental Rune) */}
            <div style={{
              backgroundColor: 'rgba(57, 255, 20, 0.05)',
              border: '2px solid #39ff14',
              borderRadius: '20px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.2)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.4rem' }}>⭐</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#39ff14', letterSpacing: '0.5px' }}>
                    YOUR 4 PHYSICAL NFC RELIC TAGS (Elemental Quest Starters)
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Since you have <strong>4 physical NFC tags</strong>, program one for each of the 4 Elemental Runes! Stick one tag onto each Rune sign or start station in the Alchemy Lab (Software R&D). When players tap their phone to a Rune, it <strong>bonds with that Relic Quest</strong> and displays their 6 assigned ingredients to hunt!
                </p>
              </div>

              {/* 4 Rune Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.85rem'
              }}>
                {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(r => {
                  const q = QUESTS[r];
                  const relicUrl = `${scanBaseUrl}/?quest=${r}`;
                  const isCopied = copiedNfcUrl === `quest-${r}`;
                  const qCards = cards.filter(c => c.runes.includes(r));

                  return (
                    <div
                      key={r}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        border: `1.5px solid ${q.color}`,
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        boxShadow: `0 0 15px ${q.glowColor}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={q.icon} alt={q.title} style={{ width: '28px', height: '28px' }} />
                          <div>
                            <div style={{ fontSize: '0.68rem', color: q.color, fontWeight: 800, textTransform: 'uppercase' }}>
                              NFC Tag #{r === 'fire' ? 1 : r === 'frost' ? 2 : r === 'venom' ? 3 : 4}
                            </div>
                            <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                              {q.title}
                            </strong>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#ffbe0b', fontWeight: 800, backgroundColor: 'rgba(255, 190, 11, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                          Word: {q.secretWord}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Assigned 6 Cards: <strong>{qCards.map(c => `#${c.number} ${c.name}`).join(', ')}</strong>
                      </div>

                      {/* URL Code snippet */}
                      <div style={{
                        backgroundColor: '#090714',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: '#38bdf8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {relicUrl}
                      </div>

                      {/* Copy Action */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(relicUrl);
                            setCopiedNfcUrl(`quest-${r}`);
                            setTimeout(() => setCopiedNfcUrl(null), 2000);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: isCopied ? '#39ff14' : 'rgba(255, 255, 255, 0.1)',
                            color: isCopied ? '#090714' : '#ffffff',
                            border: `1px solid ${isCopied ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <Copy size={13} />
                          <span>{isCopied ? 'Copied to Clipboard!' : 'Copy NFC Tag URL'}</span>
                        </button>
                        <a
                          href={relicUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          Test
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: 12 Clue Posters (Individual Camera QR Codes) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffbe0b' }}>
                  📷 12 Wall Posters (Camera QR Codes)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Players point their phone camera at each printed poster to collect individual ingredient tokens into their satchel.
                </p>
              </div>
            </div>

            {/* List of 12 Cards with URLs & QR Codes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {cards.map(card => {
                const tagUrl = `${scanBaseUrl}/?scan=card-${card.number}`;
                const isCopied = copiedNfcUrl === card.id;
                const qrDataUrl = qrPreviews[card.id];

                return (
                  <div
                    key={card.id}
                    className="glass-panel"
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    {/* Left: Card Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '220px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: '#1e1b4b',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <img src={card.sprite} alt={card.name} style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffbe0b' }}>#{card.number}</span>
                          <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{card.name}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {card.location || 'Station'} • Letter: <strong style={{ color: '#39ff14' }}>{card.targetLetter}</strong> ({card.riddleAnswer})
                        </div>
                      </div>
                    </div>

                    {/* Runes */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {card.runes.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: QUESTS[r].color,
                            border: `1px solid ${QUESTS[r].color}`
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>

                    {/* QR Code Thumbnail & Download */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {qrDataUrl ? (
                        <div style={{
                          padding: '2px',
                          backgroundColor: '#ffffff',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.4)'
                        }}>
                          <img src={qrDataUrl} alt={`QR for card ${card.number}`} style={{ width: '42px', height: '42px', display: 'block' }} />
                        </div>
                      ) : (
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#334155', borderRadius: '6px' }} />
                      )}

                      <button
                        onClick={() => {
                          playBloop(1.0);
                          downloadCardQrCode(card, scanBaseUrl);
                        }}
                        style={{
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Download size={13} />
                        <span>QR PNG</span>
                      </button>
                    </div>

                    {/* Right: URL & Copy Button & Test Scan */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: '1 1 280px', justifyContent: 'flex-end' }}>
                      <code style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>
                        {tagUrl}
                      </code>

                      <button
                        onClick={() => {
                          playBloop(1.1);
                          navigator.clipboard.writeText(tagUrl);
                          setCopiedNfcUrl(card.id);
                          setTimeout(() => setCopiedNfcUrl(null), 2000);
                        }}
                        style={{
                          backgroundColor: isCopied ? '#15803d' : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          border: isCopied ? '1px solid #39ff14' : '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isCopied ? <Check size={13} color="#39ff14" /> : <Copy size={13} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={tagUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: '#39ff14',
                          color: '#090714',
                          textDecoration: 'none',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          boxShadow: '0 0 8px rgba(57, 255, 20, 0.3)'
                        }}
                      >
                        <span>Test Scan ➔</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
