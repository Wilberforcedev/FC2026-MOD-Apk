import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Command, RotateCw, Search, Shirt, Sparkles } from 'lucide-react';
import { TEAMS } from '../data/teams';
import { Team, TeamKit } from '../types/soccer';
import { ClubEmblem } from './ClubEmblem';
import { PlayerPortrait } from './PlayerFaceCard';

interface KitSelectionScreenProps {
  team: Team;
  onBack: () => void;
}

type KitEntry = {
  id: string;
  team: Team;
  kit: TeamKit;
  label: string;
  type: 'Home Kit' | 'Away Kit' | 'Third Kit';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'ELITE';
  owned: boolean;
};

const kitEntries: KitEntry[] = TEAMS.flatMap((team, teamIndex) => [
  { id: `${team.id}-home`, team, kit: team.kit, label: team.name, type: 'Home Kit' as const, tier: teamIndex % 4 === 0 ? 'GOLD' as const : 'BRONZE' as const, owned: teamIndex < 4 },
  ...(team.awayKit ? [{ id: `${team.id}-away`, team, kit: team.awayKit, label: team.name, type: 'Away Kit' as const, tier: teamIndex % 3 === 0 ? 'SILVER' as const : 'BRONZE' as const, owned: teamIndex < 3 }] : []),
]);

const tierClass: Record<KitEntry['tier'], string> = {
  BRONZE: 'kit-tier-bronze',
  SILVER: 'kit-tier-silver',
  GOLD: 'kit-tier-gold',
  ELITE: 'kit-tier-elite',
};

const KitJersey: React.FC<{ kit: TeamKit; compact?: boolean; rotate?: boolean }> = ({ kit, compact = false, rotate = false }) => (
  <div className={`kit-jersey ${compact ? 'kit-jersey-compact' : ''} ${rotate ? 'kit-jersey-rotated' : ''}`} style={{
    '--kit-primary': kit.primary,
    '--kit-secondary': kit.secondary,
    '--kit-number': kit.numberColor,
  } as React.CSSProperties}>
    <div className="kit-jersey-sleeve kit-jersey-sleeve-left" />
    <div className="kit-jersey-sleeve kit-jersey-sleeve-right" />
    <div className="kit-jersey-body">
      <span className="kit-jersey-collar" />
      <span className="kit-jersey-pattern" />
      <span className="kit-jersey-crest">{kit.crestSymbol || 'FC'}</span>
      <span className="kit-jersey-sponsor">{kit.sponsorText || 'FC 2026'}</span>
      <strong className="kit-jersey-number">26</strong>
    </div>
  </div>
);

const KitCard: React.FC<{ entry: KitEntry; selected: boolean; onClick: () => void }> = ({ entry, selected, onClick }) => (
  <button className={`kit-card ${tierClass[entry.tier]} ${selected ? 'kit-card-selected' : ''}`} onClick={onClick} aria-pressed={selected}>
    <div className="kit-card-top"><span>{entry.tier}</span><span>{entry.owned ? 'OWNED' : 'LOCKED'}</span></div>
    <KitJersey kit={entry.kit} compact />
    <div className="kit-card-name">{entry.label}</div>
    <div className="kit-card-meta">{entry.type}</div>
    {selected && <span className="kit-card-bracket" />}
  </button>
);

export const KitSelectionScreen: React.FC<KitSelectionScreenProps> = ({ team, onBack }) => {
  const [selectedId, setSelectedId] = useState(`${team.id}-home`);
  const [filter, setFilter] = useState('');
  const [rotate, setRotate] = useState(false);
  const [active, setActive] = useState(`${team.id}-home`);
  const [notice, setNotice] = useState('');

  const visibleKits = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return kitEntries.filter(entry => !query || `${entry.label} ${entry.type}`.toLowerCase().includes(query));
  }, [filter]);
  const selected = kitEntries.find(entry => entry.id === selectedId) || kitEntries[0];
  const selectedIndex = Math.max(0, visibleKits.findIndex(entry => entry.id === selected.id));
  const previewPlayer = selected.team.players.find(player => player.position === 'ST') || selected.team.players[0];

  const cycle = (direction: number) => {
    if (!visibleKits.length) return;
    const next = (selectedIndex + direction + visibleKits.length) % visibleKits.length;
    setSelectedId(visibleKits[next].id);
  };

  const activate = () => {
    if (!selected.owned) {
      setNotice('This item is locked in the club catalogue.');
      window.setTimeout(() => setNotice(''), 2200);
      return;
    }
    setActive(selected.id);
    setNotice(`${selected.label} ${selected.type} is now active.`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  return (
    <div className="kit-room">
      <div className="kit-room-stadium" />
      <div className="kit-room-grain" />
      <header className="kit-room-header">
        <button className="kit-room-back" onClick={onBack} aria-label="Back to club hub"><ArrowLeft size={18} /></button>
        <div className="kit-room-brand"><span className="kit-room-live" /> CLUB HUB <b /> CUSTOMISE</div>
        <div className="kit-room-header-meta"><span>{team.shortName}</span><ClubEmblem teamId={team.id} shortName={team.shortName} size="sm" /></div>
      </header>

      <main className="kit-room-main">
        <section className="kit-room-inventory">
          <div className="kit-room-title-block">
            <div className="kit-room-kicker">CLUB CATALOGUE</div>
            <h1>SELECT ITEM</h1>
            <p>Preview and select the item you wish to make active for this slot.</p>
            <div className="kit-room-slot"><Shirt size={15} /> KIT <span>·</span> {team.name}</div>
          </div>
          <div className="kit-room-filter-row">
            <div className="kit-room-search"><Search size={14} /><input value={filter} onChange={event => setFilter(event.target.value)} placeholder="Search club kits" /></div>
            <span className="kit-room-count">{visibleKits.length} ITEMS</span>
          </div>
          <div className="kit-room-card-grid">
            {visibleKits.map(entry => <KitCard key={entry.id} entry={entry} selected={entry.id === selected.id} onClick={() => setSelectedId(entry.id)} />)}
          </div>
        </section>

        <section className="kit-room-stage">
          <div className="kit-room-stage-spotlight" />
          <div className="kit-room-stage-copy"><span>PREVIEW</span><strong>{selected.type.toUpperCase()}</strong></div>
          <div className="kit-room-player">
            <PlayerPortrait player={previewPlayer} className="kit-room-player-portrait" alt={`Preview player wearing ${selected.label} ${selected.type}`} />
            <div className="kit-room-player-jersey"><KitJersey kit={selected.kit} rotate={rotate} /></div>
          </div>
          <div className="kit-room-item-caption">
            <div className="kit-room-item-crest"><ClubEmblem teamId={selected.team.id} shortName={selected.team.shortName} size="md" /></div>
            <div><span>{selected.tier} ITEM <i /> {selected.owned ? 'OWNED' : 'LOCKED'}</span><h2>{selected.label}</h2><p>{selected.type} · {selected.team.country}</p></div>
            <div className="kit-room-active">{active === selected.id && <><Check size={14} /> ACTIVE</>}</div>
          </div>
          <div className="kit-room-stage-controls"><button onClick={() => cycle(-1)}><ChevronLeft size={17} /> PREVIOUS</button><button onClick={() => setRotate(value => !value)}><RotateCw size={16} /> ROTATE</button><button onClick={() => cycle(1)}>NEXT <ChevronRight size={17} /></button></div>
        </section>
      </main>

      <footer className="kit-room-footer">
        <div className="kit-room-footer-hint"><span className="kit-key">A</span><b>MAKE THIS ITEM ACTIVE</b><span className="kit-key">B</span><b>BACK</b><span className="kit-key">X</span><b>ACTIONS</b><span className="kit-key">Y</span><b>SEARCH</b></div>
        <button className="kit-room-activate" onClick={activate}><Sparkles size={15} /> {active === selected.id ? 'ACTIVE ITEM' : 'MAKE THIS ITEM ACTIVE'} <Command size={14} /></button>
      </footer>
      {notice && <div className="kit-room-toast">{notice}</div>}
    </div>
  );
};
