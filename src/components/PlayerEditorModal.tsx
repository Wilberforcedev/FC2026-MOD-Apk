/**
 * PlayerEditorModal Component
 * Comprehensive editor for creating new players or modifying existing player attributes,
 * appearance likeness (skin tone, hair style, hair color, facial hair), playstyles, and face card tier.
 */

import React, { useState, useMemo } from 'react';
import {
  Player,
  Team,
  Position,
  PlayStyle,
  HairStyle,
  FacialHair,
  FaceCardTheme,
} from '../types/soccer';
import { PlayerFaceCard } from './PlayerFaceCard';
import {
  X,
  Sparkles,
  Sliders,
  User,
  Shield,
  Shuffle,
  Check,
  Zap,
} from 'lucide-react';

interface PlayerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlayer: (player: Player) => void;
  initialPlayer?: Player | null;
  team: Team;
  isCreateMode?: boolean;
}

const POSITIONS: Position[] = [
  'ST',
  'LW',
  'RW',
  'CAM',
  'CM',
  'CDM',
  'LB',
  'CB',
  'RB',
  'GK',
];

const PLAYSTYLES_LIST: PlayStyle[] = [
  'Finesse Shot',
  'Power Header',
  'Speed Dribbler',
  'Whipped Cross',
  'Relentless',
  'Trickster',
  'Anchor',
  'Long Ball',
  'Tiki Taka',
  'Block',
];

const SKIN_TONES = [
  { label: 'Fair Ivory', hex: '#fde047' },
  { label: 'Warm Peach', hex: '#fed7aa' },
  { label: 'Golden Sand', hex: '#fcd34d' },
  { label: 'Warm Tan', hex: '#f5d0b0' },
  { label: 'Bronze Olive', hex: '#d49b6a' },
  { label: 'Caramel', hex: '#b45309' },
  { label: 'Rich Chestnut', hex: '#78350f' },
  { label: 'Deep Espresso', hex: '#3b1d0c' },
];

const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Crop Short' },
  { id: 'fade', label: 'Skin Fade' },
  { id: 'curly', label: 'Curly Top' },
  { id: 'dreads', label: 'Locs' },
  { id: 'slick', label: 'Slick Back' },
  { id: 'buzz', label: 'Buzz Cut' },
  { id: 'afro', label: 'Athletic Afro' },
  { id: 'mohawk', label: 'Mohawk Fade' },
];

const HAIR_COLORS = [
  { label: 'Midnight Black', hex: '#111827' },
  { label: 'Dark Chocolate', hex: '#3f2212' },
  { label: 'Golden Blonde', hex: '#d97706' },
  { label: 'Auburn Ginger', hex: '#b91c1c' },
  { label: 'Platinum Silver', hex: '#e2e8f0' },
  { label: 'Cyber Neon Cyan', hex: '#06b6d4' },
];

const FACIAL_HAIR_OPTIONS: { id: FacialHair; label: string }[] = [
  { id: 'none', label: 'Clean Shaven' },
  { id: 'stubble', label: 'Light Stubble' },
  { id: 'goatee', label: 'Sharp Goatee' },
  { id: 'beard', label: 'Full Beard' },
];

const CARD_THEMES: { id: FaceCardTheme; label: string; bgBadge: string }[] = [
  { id: 'gold', label: 'Gold Rare', bgBadge: 'bg-amber-400 text-amber-950' },
  { id: 'tots', label: 'TOTS Blue', bgBadge: 'bg-cyan-500 text-slate-950' },
  { id: 'totw', label: 'TOTW Black', bgBadge: 'bg-black text-amber-300 border border-amber-400/40' },
  { id: 'future_stars', label: 'Future Stars', bgBadge: 'bg-pink-600 text-white' },
  { id: 'icon', label: 'FC Icon', bgBadge: 'bg-stone-200 text-stone-900 border border-amber-300' },
];

export const PlayerEditorModal: React.FC<PlayerEditorModalProps> = ({
  isOpen,
  onClose,
  onSavePlayer,
  initialPlayer,
  team,
  isCreateMode = false,
}) => {
  // Navigation tabs inside the editor
  const [activeTab, setActiveTab] = useState<'face' | 'stats' | 'identity'>('face');

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [number, setNumber] = useState(10);
  const [position, setPosition] = useState<Position>('ST');
  const [preferredFoot, setPreferredFoot] = useState<'Left' | 'Right'>('Right');
  const [rating, setRating] = useState(85);

  // Core Stats (50 - 99)
  const [pace, setPace] = useState(84);
  const [shooting, setShooting] = useState(82);
  const [passing, setPassing] = useState(78);
  const [dribbling, setDribbling] = useState(85);
  const [defending, setDefending] = useState(45);
  const [physicality, setPhysicality] = useState(76);

  // Appearance & Likeness
  const [skinTone, setSkinTone] = useState('#d49b6a');
  const [hairStyle, setHairStyle] = useState<HairStyle>('fade');
  const [hairColor, setHairColor] = useState('#111827');
  const [facialHair, setFacialHair] = useState<FacialHair>('none');
  const [faceCardTheme, setFaceCardTheme] = useState<FaceCardTheme>('gold');

  // PlayStyles
  const [playStyles, setPlayStyles] = useState<PlayStyle[]>(['Finesse Shot']);

  // Sync state whenever modal opens or initialPlayer changes
  React.useEffect(() => {
    if (initialPlayer) {
      setName(initialPlayer.name);
      setShortName(initialPlayer.shortName);
      setNumber(initialPlayer.number);
      setPosition(initialPlayer.position);
      setPreferredFoot(initialPlayer.preferredFoot || 'Right');
      setRating(initialPlayer.rating);

      setPace(initialPlayer.stats.pace);
      setShooting(initialPlayer.stats.shooting);
      setPassing(initialPlayer.stats.passing);
      setDribbling(initialPlayer.stats.dribbling);
      setDefending(initialPlayer.stats.defending);
      setPhysicality(initialPlayer.stats.physicality);

      if (initialPlayer.likeness) {
        setSkinTone(initialPlayer.likeness.skinTone || '#d49b6a');
        setHairStyle(initialPlayer.likeness.hairStyle || 'fade');
        setHairColor(initialPlayer.likeness.hairColor || '#111827');
        setFacialHair(initialPlayer.likeness.facialHair || 'none');
        setFaceCardTheme(initialPlayer.likeness.faceCardTheme || 'gold');
      }
      setPlayStyles(initialPlayer.playStyles || ['Finesse Shot']);
    } else {
      // Default template for a newly drafted superstar player
      const nextNum = Math.floor(Math.random() * 80) + 12;
      setName('Alex Vance');
      setShortName('VANCE');
      setNumber(nextNum);
      setPosition('ST');
      setPreferredFoot('Right');
      setRating(86);

      setPace(88);
      setShooting(85);
      setPassing(80);
      setDribbling(86);
      setDefending(42);
      setPhysicality(78);

      setSkinTone('#d49b6a');
      setHairStyle('fade');
      setHairColor('#111827');
      setFacialHair('none');
      setFaceCardTheme('gold');
      setPlayStyles(['Speed Dribbler', 'Finesse Shot']);
    }
  }, [initialPlayer, isOpen]);

  // Construct draft player object for real-time Face Card preview
  const draftPlayer: Player = useMemo(() => {
    return {
      id: initialPlayer?.id || `custom_${Date.now()}`,
      name: name.trim() || 'Custom Star',
      shortName: shortName.trim().toUpperCase() || 'PLAYER',
      number: Number(number) || 10,
      position,
      rating,
      stats: {
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physicality,
      },
      preferredFoot,
      playStyles,
      likeness: {
        skinTone,
        hairStyle,
        hairColor,
        bootColor: initialPlayer?.likeness?.bootColor || '#0284c7',
        facialHair,
        faceCardTheme,
      },
      marketValue: initialPlayer?.marketValue || Math.round(rating * 0.9),
      wage: initialPlayer?.wage || Math.round(rating * 2.2),
    };
  }, [
    initialPlayer,
    name,
    shortName,
    number,
    position,
    rating,
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physicality,
    preferredFoot,
    playStyles,
    skinTone,
    hairStyle,
    hairColor,
    facialHair,
    faceCardTheme,
  ]);

  // Random Face Generator for quick inspired designs
  const handleRandomizeFace = () => {
    const randSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex;
    const randHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randBeard = FACIAL_HAIR_OPTIONS[Math.floor(Math.random() * FACIAL_HAIR_OPTIONS.length)].id;
    const randTheme = CARD_THEMES[Math.floor(Math.random() * CARD_THEMES.length)].id;

    setSkinTone(randSkin);
    setHairStyle(randHair);
    setHairColor(randColor);
    setFacialHair(randBeard);
    setFaceCardTheme(randTheme);
  };

  // Toggle PlayStyles
  const togglePlayStyle = (ps: PlayStyle) => {
    if (playStyles.includes(ps)) {
      setPlayStyles(playStyles.filter((p) => p !== ps));
    } else {
      if (playStyles.length < 3) {
        setPlayStyles([...playStyles, ps]);
      }
    }
  };

  // Auto-calculate realistic overall rating based on tactical position weights
  const calculateOvr = () => {
    let calculated = 75;
    if (position === 'ST' || position === 'CF') {
      calculated = Math.round(shooting * 0.4 + pace * 0.25 + dribbling * 0.2 + physicality * 0.15);
    } else if (position === 'LW' || position === 'RW') {
      calculated = Math.round(pace * 0.35 + dribbling * 0.3 + shooting * 0.2 + passing * 0.15);
    } else if (position === 'CAM' || position === 'CM') {
      calculated = Math.round(passing * 0.35 + dribbling * 0.3 + shooting * 0.2 + pace * 0.15);
    } else if (position === 'CDM') {
      calculated = Math.round(defending * 0.35 + physicality * 0.3 + passing * 0.2 + pace * 0.15);
    } else if (position === 'CB') {
      calculated = Math.round(defending * 0.45 + physicality * 0.35 + pace * 0.2);
    } else if (position === 'LB' || position === 'RB') {
      calculated = Math.round(pace * 0.35 + defending * 0.3 + dribbling * 0.2 + passing * 0.15);
    } else if (position === 'GK') {
      calculated = Math.round(defending * 0.5 + physicality * 0.3 + pace * 0.2);
    }
    setRating(Math.max(55, Math.min(99, calculated)));
  };

  const handleSave = () => {
    onSavePlayer(draftPlayer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none font-['Outfit'] animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-cyan-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Chakra_Petch'] font-black text-lg md:text-xl text-white tracking-wide uppercase">
                  {isCreateMode ? 'CREATE NEW PLAYER' : 'PLAYER & FACE CARD EDITOR'}
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  {team.name}
                </span>
              </div>
              <p className="text-xs text-white/50">
                Customize in-game face likeness, face card edition, and technical attributes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6">
          {/* LEFT 5 COLS: Live Face Card Preview & Theme Picker */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 relative">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-[11px] font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider">
                LIVE ULTIMATE FACE CARD
              </span>
              <button
                onClick={handleRandomizeFace}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold transition"
                title="Randomize Appearance"
              >
                <Shuffle className="w-3 h-3" />
                RANDOM FACE
              </button>
            </div>

            {/* Central Card Display */}
            <div className="my-2 py-2 flex items-center justify-center">
              <PlayerFaceCard player={draftPlayer} team={team} size="lg" />
            </div>

            {/* Face Card Theme Selector */}
            <div className="w-full mt-2 pt-3 border-t border-white/10">
              <span className="text-[10px] text-white/50 font-mono block mb-1.5 uppercase">
                FACE CARD THEME / TIER
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {CARD_THEMES.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => setFaceCardTheme(themeOption.id)}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-['Chakra_Petch'] font-black uppercase tracking-tighter text-center transition border ${
                      faceCardTheme === themeOption.id
                        ? 'border-white ring-2 ring-cyan-400 scale-105'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    } ${themeOption.bgBadge}`}
                  >
                    {themeOption.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: Navigation Tabs & Sliders */}
          <div className="lg:col-span-7 flex flex-col bg-slate-900/40 border border-white/5 rounded-2xl p-4 sm:p-5">
            {/* Editor Sub-Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('face')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
                  activeTab === 'face'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                FACE & HAIR
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
                  activeTab === 'stats'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                ATTRIBUTES
              </button>
              <button
                onClick={() => setActiveTab('identity')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
                  activeTab === 'identity'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                IDENTITY & BIO
              </button>
            </div>

            {/* TAB 1: FACE & HAIR LIKENESS */}
            {activeTab === 'face' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Skin Tone Palette */}
                <div>
                  <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-2">
                    SKIN TONE PALETTE
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.hex}
                        onClick={() => setSkinTone(tone.hex)}
                        style={{ backgroundColor: tone.hex }}
                        className={`h-9 rounded-xl border-2 transition flex items-center justify-center ${
                          skinTone === tone.hex
                            ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-md'
                            : 'border-white/10 hover:border-white/40'
                        }`}
                        title={tone.label}
                      >
                        {skinTone === tone.hex && (
                          <Check className="w-4 h-4 text-slate-950 drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Style */}
                <div>
                  <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-2">
                    HAIR STYLE
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setHairStyle(style.id)}
                        className={`py-2 px-2.5 rounded-xl border text-left text-xs font-['Chakra_Petch'] font-bold transition flex items-center justify-between ${
                          hairStyle === style.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-950/60 border-white/10 text-white/70 hover:bg-slate-900'
                        }`}
                      >
                        <span>{style.label}</span>
                        {hairStyle === style.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-2">
                    HAIR COLOR
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setHairColor(c.hex)}
                        className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                          hairColor === c.hex
                            ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/40 text-cyan-300'
                            : 'bg-slate-950/60 border-white/10 text-white/70 hover:border-white/30'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate text-[10px]">{c.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facial Hair */}
                <div>
                  <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-2">
                    FACIAL HAIR & BEARD
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FACIAL_HAIR_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFacialHair(f.id)}
                        className={`py-2 px-2.5 rounded-xl border text-left text-xs font-['Chakra_Petch'] font-bold transition flex items-center justify-between ${
                          facialHair === f.id
                            ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                            : 'bg-slate-950/60 border-white/10 text-white/70 hover:bg-slate-900'
                        }`}
                      >
                        <span>{f.label}</span>
                        {facialHair === f.id && <Check className="w-3.5 h-3.5 text-teal-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTRIBUTES & STATS */}
            {activeTab === 'stats' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Overall Rating & Auto Calculate button */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase">
                      OVERALL RATING (OVR)
                    </span>
                    <div className="text-3xl font-black font-['Chakra_Petch'] text-cyan-300 leading-none">
                      {rating}
                    </div>
                  </div>

                  <button
                    onClick={calculateOvr}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    AUTO-CALCULATE OVR
                  </button>
                </div>

                {/* 6 Core Attribute Sliders */}
                <div className="space-y-3">
                  <AttributeSlider
                    label="PACE (PAC)"
                    value={pace}
                    onChange={setPace}
                    color="text-cyan-400"
                  />
                  <AttributeSlider
                    label="SHOOTING (SHO)"
                    value={shooting}
                    onChange={setShooting}
                    color="text-amber-400"
                  />
                  <AttributeSlider
                    label="PASSING (PAS)"
                    value={passing}
                    onChange={setPassing}
                    color="text-teal-400"
                  />
                  <AttributeSlider
                    label="DRIBBLING (DRI)"
                    value={dribbling}
                    onChange={setDribbling}
                    color="text-cyan-400"
                  />
                  <AttributeSlider
                    label="DEFENDING (DEF)"
                    value={defending}
                    onChange={setDefending}
                    color="text-emerald-400"
                  />
                  <AttributeSlider
                    label="PHYSICALITY (PHY)"
                    value={physicality}
                    onChange={setPhysicality}
                    color="text-amber-400"
                  />
                </div>

                {/* Signature PlayStyles selection */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-['Chakra_Petch'] font-bold text-white/90 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      SIGNATURE PLAYSTYLES (Max 3)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {playStyles.length}/3 Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {PLAYSTYLES_LIST.map((ps) => {
                      const isSelected = playStyles.includes(ps);
                      return (
                        <button
                          key={ps}
                          onClick={() => togglePlayStyle(ps)}
                          className={`py-1.5 px-2.5 rounded-xl border text-left text-xs font-['Chakra_Petch'] font-bold transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-slate-950/60 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{ps}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: IDENTITY & BIO */}
            {activeTab === 'identity' && (
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Full Name & Short Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-1.5">
                      FULL PLAYER NAME
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Wilber Ronaldo"
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-1.5">
                      KIT DISPLAY NAME (SHORT)
                    </label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value.toUpperCase())}
                      placeholder="e.g. RONALDO"
                      maxLength={12}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-cyan-400 font-['Chakra_Petch'] font-bold"
                    />
                  </div>
                </div>

                {/* Jersey Number & Preferred Foot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-1.5">
                      JERSEY NUMBER (#1 - #99)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={number}
                      onChange={(e) => setNumber(Math.max(1, Math.min(99, Number(e.target.value))))}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-xl px-3 py-2 text-sm text-cyan-300 font-['Chakra_Petch'] font-black focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-1.5">
                      PREFERRED FOOT
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPreferredFoot('Right')}
                        className={`py-2 rounded-xl border text-xs font-['Chakra_Petch'] font-bold transition ${
                          preferredFoot === 'Right'
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow'
                            : 'bg-slate-950 border-white/10 text-white/70'
                        }`}
                      >
                        RIGHT FOOT
                      </button>
                      <button
                        onClick={() => setPreferredFoot('Left')}
                        className={`py-2 rounded-xl border text-xs font-['Chakra_Petch'] font-bold transition ${
                          preferredFoot === 'Left'
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow'
                            : 'bg-slate-950 border-white/10 text-white/70'
                        }`}
                      >
                        LEFT FOOT
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pitch Position Selection */}
                <div>
                  <label className="text-xs font-['Chakra_Petch'] font-bold text-white/80 block mb-1.5">
                    TACTICAL POSITION
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => {
                          setPosition(pos);
                        }}
                        className={`py-2 rounded-xl border text-center text-xs font-mono font-black transition ${
                          position === pos
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40'
                            : 'bg-slate-950 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-cyan-900/40 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white/70 hover:text-white text-xs font-bold transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {isCreateMode ? 'CREATE & ADD TO SQUAD' : 'SAVE ATTRIBUTES & CARD'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable Attribute Slider Component
function AttributeSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color: string;
}) {
  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-xl p-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-['Chakra_Petch'] font-bold text-white/80">{label}</span>
        <span className={`font-['Chakra_Petch'] font-black text-sm ${color}`}>{value}</span>
      </div>
      <input
        type="range"
        min={50}
        max={99}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  );
}
