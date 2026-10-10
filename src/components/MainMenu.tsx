import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Crown, Flame, Play, Shield, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { TEAMS } from '../data/teams';
import { Player, Team } from '../types/soccer';
import { FCBottomNav, FCNavTab } from './FCBottomNav';
import { FCHeaderBar } from './FCHeaderBar';
import { PlayerFaceAvatar } from './PlayerFaceCard';

export type MainMenuDestination = 'team-select' | 'career' | 'tournament' | 'penalties' | 'practice' | 'squad';

interface MainMenuProps {
  coins: number;
  navTab: FCNavTab;
  onNavigate: (destination: MainMenuDestination) => void;
  onSelectNavTab: (tab: FCNavTab) => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

const lineup: Array<{ key: string; x: string; y: string }> = [
  { key: 'GK', x: '50%', y: '88%' },
  { key: 'LB', x: '15%', y: '69%' },
  { key: 'CB1', x: '38%', y: '73%' },
  { key: 'CB2', x: '62%', y: '73%' },
  { key: 'RB', x: '85%', y: '69%' },
  { key: 'CM1', x: '29%', y: '49%' },
  { key: 'CM2', x: '50%', y: '55%' },
  { key: 'CM3', x: '71%', y: '49%' },
  { key: 'LW', x: '18%', y: '24%' },
  { key: 'ST', x: '50%', y: '18%' },
  { key: 'RW', x: '82%', y: '24%' },
];

const getPlayer = (players: Player[], position: string, index = 0) => {
  const matches = players.filter((player) => player.position === position);
  return matches[index] || matches[0] || players[index % players.length];
};

const MiniCard: React.FC<{ player: Player; team: Team; selected: boolean; onClick: () => void }> = ({ player, team, selected, onClick }) => (
  <button onClick={onClick} className={`lineup-card ${selected ? 'lineup-card-selected' : ''}`} aria-label={`Select ${player.name}`}>
    <div className="lineup-card-shine" />
    <div className="lineup-card-top">
      <span className="lineup-rating">{player.rating}</span>
      <span className="lineup-position">{player.position}</span>
    </div>
    <PlayerFaceAvatar
      skinTone={player.likeness?.skinTone}
      hairStyle={player.likeness?.hairStyle}
      hairColor={player.likeness?.hairColor}
      facialHair={player.likeness?.facialHair}
      jerseyColor={team.kit?.primary}
      size={48}
    />
    <span className="lineup-name">{player.shortName}</span>
    <span className="lineup-stat">{player.stats.pace} PAC · {player.stats.dribbling} DRI</span>
  </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({
  coins,
  navTab,
  onNavigate,
  onSelectNavTab,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const team = TEAMS[0];
  const players = team.players;
  const [selectedKey, setSelectedKey] = useState('ST');
  const selectedPlayer = useMemo(() => getPlayer(players, 'ST'), [players]);
  const mappedPlayers = useMemo(() => ({
    GK: getPlayer(players, 'GK'), LB: getPlayer(players, 'LB'), RB: getPlayer(players, 'RB'),
    CB1: getPlayer(players, 'CB'), CB2: getPlayer(players, 'CB', 1),
    CM1: getPlayer(players, 'CM'), CM2: getPlayer(players, 'CM', 1), CM3: getPlayer(players, 'CAM'),
    LW: getPlayer(players, 'LW'), ST: getPlayer(players, 'ST'), RW: getPlayer(players, 'RW'),
  }), [players]);

  return (
    <div className="home-shell">
      <FCHeaderBar team={team} coins={coins} onOpenInbox={onOpenInbox} onOpenSocial={onOpenSocial} onOpenSettings={onOpenSettings} showTabs={false} />
      <main className="home-scroll">
        <section className="home-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> MATCHDAY 07 <span className="eyebrow-divider" /> ELITE DIVISION</div>
            <h1>Build your<br /><span>ultimate XI.</span></h1>
            <p>Every card. Every decision. Your squad writes the story.</p>
          </div>
          <div className="hero-badge"><Crown size={15} /><span>OVR</span><strong>84</strong></div>
        </section>

        <section className="squad-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">TACTICAL HUB</span><h2>{team.shortName} <span>starting XI</span></h2></div>
            <button className="formation-pill" onClick={() => onNavigate('squad')}>{team.formation}<ChevronRight size={14} /></button>
          </div>
          <div className="pitch-board">
            <div className="pitch-lines pitch-halfway" /><div className="pitch-lines pitch-box top" /><div className="pitch-lines pitch-box bottom" /><div className="pitch-circle" />
            <div className="pitch-glow" />
            {lineup.map((slot) => {
              const player = mappedPlayers[slot.key as keyof typeof mappedPlayers];
              return <div key={slot.key} className="lineup-slot" style={{ left: slot.x, top: slot.y }}><MiniCard player={player} team={team} selected={selectedKey === slot.key} onClick={() => { setSelectedKey(slot.key); }} /></div>;
            })}
            <span className="pitch-label top-label">ATTACK</span><span className="pitch-label bottom-label">DEFENCE</span>
          </div>
          <div className="squad-footer"><div><span className="footer-label">TEAM CHEMISTRY</span><strong>92 <small>/ 100</small></strong></div><div className="chemistry-bar"><span /></div><button className="edit-link" onClick={() => onNavigate('squad')}>EDIT SQUAD <ArrowRight size={14} /></button></div>
        </section>

        <section className="feature-grid">
          <button className="feature-card feature-match" onClick={() => onNavigate('team-select')}><span className="feature-icon"><Play size={16} fill="currentColor" /></span><span><small>READY TO PLAY</small><strong>Kick-off match</strong></span><ArrowRight size={18} /></button>
          <button className="feature-card feature-career" onClick={() => onNavigate('career')}><span className="feature-icon"><Trophy size={16} /></span><span><small>MANAGER MODE</small><strong>Continue career</strong></span><ArrowRight size={18} /></button>
        </section>

        <section className="spotlight-row">
          <div className="spotlight-card"><div className="spotlight-top"><span className="section-kicker">PLAYER SPOTLIGHT</span><Sparkles size={16} /></div><div className="spotlight-content"><div className="spotlight-avatar"><PlayerFaceAvatar skinTone={selectedPlayer.likeness?.skinTone} hairStyle={selectedPlayer.likeness?.hairStyle} hairColor={selectedPlayer.likeness?.hairColor} facialHair={selectedPlayer.likeness?.facialHair} jerseyColor={team.kit?.primary} size={80} /></div><div><h3>{selectedPlayer.name}</h3><p>{selectedPlayer.position} · {team.shortName}</p><div className="mini-stats"><span><b>{selectedPlayer.stats.pace}</b><small>PAC</small></span><span><b>{selectedPlayer.stats.shooting}</b><small>SHO</small></span><span><b>{selectedPlayer.stats.passing}</b><small>PAS</small></span></div></div><div className="spotlight-rating"><strong>{selectedPlayer.rating}</strong><span>OVR</span></div></div></div>
          <button className="quick-card" onClick={() => onNavigate('tournament')}><span className="quick-icon"><Zap size={18} /></span><strong>Champions<br />Cup</strong><span className="quick-meta">QUARTER-FINALS <ArrowRight size={14} /></span></button>
          <button className="quick-card alt" onClick={() => onNavigate('squad')}><span className="quick-icon"><Users size={18} /></span><strong>Squad<br />management</strong><span className="quick-meta">11 STARTERS <ArrowRight size={14} /></span></button>
        </section>
      </main>
      <FCBottomNav activeTab={navTab} onSelectTab={onSelectNavTab} />
    </div>
  );
};
