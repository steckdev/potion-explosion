import React, { useState } from 'react';
import type { CardData, RuneType } from '../types';
import { QUESTS } from '../data/quests';
import { PrintablePoster } from './PrintablePoster';
import { saveStoredCards, resetStoredCards, exportCardsAsJSON, importCardsFromJSON } from '../utils/storage';
import { playBloop, playStoneLock } from '../utils/audio';
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
  Copy
} from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'editor' | 'print_all' | 'cheat_sheet' | 'table_sign' | 'certificates' | 'plinko_discs' | 'prompts'>('editor');
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [saveToast, setSaveToast] = useState(false);
  
  // Wall printing vs Answer Key toggles
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showStaffNotes, setShowStaffNotes] = useState(false);

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
    { label: "Witch's Herb", path: '/sprites/witch_brew_herb.png' },
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
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(18, 14, 36, 0.95)'
      }}>
        {/* Left: View Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { playBloop(1.0); setViewMode('editor'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'editor' ? '#8338ec' : 'rgba(255,255,255,0.08)',
              color: '#ffffff'
            }}
          >
            <Edit3 size={15} />
            <span>Card Editor & Preview</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('print_all'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'print_all' ? '#ff3b30' : 'rgba(255,255,255,0.08)',
              color: '#ffffff'
            }}
          >
            <Printer size={15} />
            <span>Print Posters ({cards.length} Cards)</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('cheat_sheet'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'cheat_sheet' ? '#00c8ff' : 'rgba(255,255,255,0.08)',
              color: '#ffffff'
            }}
          >
            <FileText size={15} />
            <span>Quest Master Cheat Sheet</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('table_sign'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'table_sign' ? '#39ff14' : 'rgba(255,255,255,0.08)',
              color: viewMode === 'table_sign' ? '#090714' : '#ffffff'
            }}
          >
            <span>📜</span>
            <span>Table Pedestal Sign</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('certificates'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'certificates' ? '#ffbe0b' : 'rgba(255,255,255,0.08)',
              color: viewMode === 'certificates' ? '#090714' : '#ffffff'
            }}
          >
            <Award size={15} />
            <span>Alchemist Certificates</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('plinko_discs'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'plinko_discs' ? '#00d2ff' : 'rgba(255,255,255,0.08)',
              color: viewMode === 'plinko_discs' ? '#090714' : '#ffffff'
            }}
          >
            <span>🎲</span>
            <span>Plinko Disc Tokens (Print)</span>
          </button>

          <button
            onClick={() => { playBloop(1.0); setViewMode('prompts'); }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: viewMode === 'prompts' ? '#bf5af2' : 'rgba(255,255,255,0.08)',
              color: '#ffffff'
            }}
          >
            <Sparkles size={15} />
            <span>AI Asset Prompter & Style Guide</span>
          </button>
        </div>

        {/* Right: Print Button, JSON, Reset, Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              padding: '0.45rem 1rem',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
            }}
          >
            <Printer size={15} />
            <span>PRINT THIS VIEW</span>
          </button>

          <button
            onClick={handleExportJSON}
            title="Export Cards as JSON"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1',
              borderRadius: '999px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Download size={14} />
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
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button
            onClick={handleResetDefaults}
            title="Reset to Original Cards"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              borderRadius: '999px',
              padding: '0.45rem 0.75rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={onExitAdmin}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '999px',
              padding: '0.45rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Exit Admin ✕
          </button>
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
            {/* Poster Print & Spoiler Options Bar */}
            <div className="no-print glass-panel" style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(20, 15, 42, 0.85)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffbe0b' }}>
                  Poster Print Options:
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  (Configure what appears on the physical printed wall cards)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                {/* Answer Key Toggle */}
                <button
                  onClick={() => { playBloop(1.0); setShowAnswerKey(v => !v); }}
                  style={{
                    backgroundColor: showAnswerKey ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${showAnswerKey ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: showAnswerKey ? '#39ff14' : '#cbd5e1',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showAnswerKey ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{showAnswerKey ? 'Riddle Answers: VISIBLE (Staff Key)' : 'Riddle Answers: HIDDEN (Wall Print)'}</span>
                </button>

                {/* Office Location Notes Toggle */}
                <button
                  onClick={() => { playBloop(1.0); setShowStaffNotes(v => !v); }}
                  style={{
                    backgroundColor: showStaffNotes ? 'rgba(217, 119, 6, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${showStaffNotes ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: showStaffNotes ? '#fbbf24' : '#cbd5e1',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MapPin size={14} />
                  <span>{showStaffNotes ? 'Mounting Notes: ON' : 'Mounting Notes: OFF (Clean)'}</span>
                </button>
              </div>
            </div>

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

                {/* Office Location */}
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                    Office Wall Location Hint (Staff Guide):
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
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              maxWidth: '8.5in',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f87171' }}>
                  Ready to Print {cards.length} Wall Posters!
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#fecaca' }}>
                  Each card will print on its own 8.5" x 11" sheet with margins and headers automatically hidden.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { playBloop(1.0); setShowAnswerKey(v => !v); }}
                  style={{
                    backgroundColor: showAnswerKey ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${showAnswerKey ? '#39ff14' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: showAnswerKey ? '#39ff14' : '#ffffff',
                    padding: '0.45rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {showAnswerKey ? <Eye size={15} /> : <EyeOff size={15} />}
                  <span>{showAnswerKey ? 'Answers: VISIBLE' : 'Answers: HIDDEN (Wall Print)'}</span>
                </button>

                <button
                  onClick={() => { playBloop(1.0); setShowStaffNotes(v => !v); }}
                  style={{
                    backgroundColor: showStaffNotes ? 'rgba(217, 119, 6, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${showStaffNotes ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}`,
                    color: showStaffNotes ? '#fbbf24' : '#ffffff',
                    padding: '0.45rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <MapPin size={15} />
                  <span>{showStaffNotes ? 'Locations: ON' : 'Locations: OFF'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.65rem 1.5rem',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  <Printer size={18} />
                  <span>PRINT ALL {cards.length} POSTERS NOW</span>
                </button>
              </div>
            </div>

            {/* Cards in Print Containers */}
            {cards.map(card => (
              <div key={card.id} style={{ marginBottom: '1.5rem' }}>
                <PrintablePoster 
                  card={card} 
                  showAdminHelper={false} 
                  showAnswerKey={showAnswerKey}
                  showStaffNotes={showStaffNotes}
                />
              </div>
            ))}
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
                  iPad Station Facilitator Reference • 4 Elemental Totems & Secret Solutions
                </p>
              </div>

              {/* 4 Totems Table */}
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
                              {quest.title} ({quest.totemName})
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
                            <th style={{ padding: '4px 8px', border: '1px solid #d97706' }}>Office Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questMatchingCards.map(c => (
                            <tr key={c.id}>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d', fontWeight: 700 }}>#{c.number}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.name}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d', fontWeight: 900, color: '#b45309' }}>[{c.targetLetter}]</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.riddleAnswer}</td>
                              <td style={{ padding: '4px 8px', border: '1px solid #fcd34d' }}>{c.location || 'Office'}</td>
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

        {/* VIEW 4: Printable Table Sign for iPad Desk */}
        {viewMode === 'table_sign' && (
          <div style={{ maxWidth: '8.5in', margin: '0.1in auto', padding: '0.1in 0.15in' }}>
            <div className="print-page-container" style={{
              width: '8.0in',
              height: '10.4in',
              margin: '0 auto',
              backgroundColor: '#fbf7ea',
              border: '12px solid #3d2314',
              borderRadius: '16px',
              padding: '0.45in 0.4in',
              color: '#2d1810',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#b45309', letterSpacing: '2px' }}>
                  WELCOME TO THE OFFICE ADVENTURE
                </div>
                <h1 className="font-mystic" style={{ fontSize: '2.8rem', margin: '0.4rem 0', color: '#3d2314' }}>
                  THE GREAT ALCHEMY QUEST
                </h1>
                <p style={{ fontSize: '1.2rem', color: '#78350f', margin: 0, fontWeight: 600 }}>
                  Solve the riddles • Brew your potion • Win a 3D-Printed Mini Potion Clicker!
                </p>
              </div>

              {/* 3 Simple Steps */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                margin: '1.5rem 0'
              }}>
                <div style={{
                  background: '#ffffff',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '2.5rem' }}>🏮</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3d2314' }}>1. Pick a Totem</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.35, textAlign: 'center' }}>
                    Grab one available Elemental Totem from the desk:
                  </p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    {(['fire', 'frost', 'venom', 'moon'] as RuneType[]).map(r => (
                      <div key={r} style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#1e1b2e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: `drop-shadow(0 2px 4px ${QUESTS[r].color})`
                      }}>
                        <img src={QUESTS[r].icon} alt={r} style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '2.5rem' }}>🗺️</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3d2314' }}>2. Explore Office</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.35 }}>
                    Walk around looking for posters bearing your Totem's Rune emblem in the corners.
                  </p>
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '2px solid #b45309',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{ fontSize: '2.5rem' }}>✨</div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#3d2314' }}>3. Brew & Claim!</h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f', lineHeight: 1.35 }}>
                    Return to this iPad, tap your Rune, solve the puzzle, and claim your Potion Clicker prize!
                  </p>
                </div>
              </div>

              {/* 3D Printed Potion Callout */}
              <div style={{
                background: '#fffbeb',
                border: '2px dashed #d97706',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem'
              }}>
                <img
                  src="/assets/3D_printed_potions.png"
                  alt="Potion Clickers"
                  style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3d2314' }}>
                    Real 3D-Printed Mini Potion Fidget Toys!
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                    Collect all 4 elemental colors by solving additional quests throughout the day!
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: 600 }}>
                Please return Totems to the Quest Master station after finishing your brew! Happy Halloween! 🎃
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
                has braved the enchanted corridors, attuned the sacred path, and decoded the hidden ingredients of the office to attain the rank of:
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
                    Quest Master Office Station
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
                      const p = `Set of 4 physical 3D-printed tabletop gaming totems for Halloween office scavenger hunt, translucent silk colored filament: 1) Crimson Fire Torch in glowing ruby red, 2) Glacial Frost Crystal in ice sapphire blue, 3) Toxic Venom Leaf in emerald neon green, 4) Mystic Shadow Moon in astral amethyst purple. Carved dark stone pedestal bases with glowing runes, internal LED tea-light glow, cinematic macro studio product render, isolated on pure white background, clean product design, ultra high detail --v 6.0`;
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
                  Use this to render visual mockups or 3D print guides for the physical handheld totems players carry through the office.
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
      </div>
    </div>
  );
};
