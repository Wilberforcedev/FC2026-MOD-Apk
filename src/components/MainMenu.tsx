import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, Crown, Play, Settings2, Shirt, Shield, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { TEAMS } from '../data/teams';
import { Player } from '../types/soccer';
import { FCBottomNav, FCNavTab } from './FCBottomNav';
import { FCHeaderBar } from './FCHeaderBar';
import { PlayerPortrait } from './PlayerFaceCard';

export type MainMenuDestination = 'team-select' | 'career' | 'tournament' | 'penalties' | 'practice' | 'squad' | 'kits';

interface MainMenuProps {
  coins: number;
  navTab: FCNavTab;
  onNavigate: (destination: MainMenuDestination) => void;
  onSelectNavTab: (tab: FCNavTab) => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

const pick = (players: Player[], position: string, index = 0) => {
  const exact = players.filter(player => player.position === position);
  return exact[index] || exact[0] || players[index % players.length];
};

const TopPlayerCard: React.FC<{ player: Player; teamColor: string; onClick: () => void }> = ({ player, teamColor, onClick }) => (
  <button className="home-player-card" onClick={onClick} style={{ '--card-accent': teamColor } as React.CSSProperties}>
    <div className="home-player-art"><PlayerPortrait player={player} alt={`Original in-game portrait for ${player.name}`} /></div>
    <div className="home-player-shade" />
    <div className="home-player-rating"><b>{player.rating}</b><span>{player.position}</span></div>
    <div className="home-player-info"><strong>{player.shortName}</strong><span>{player.stats.pace} PAC <i /> {player.stats.shooting} SHO <i /> {player.stats.dribbling} DRI</span></div>
    <span className="home-player-number">{String(player.number).padStart(2, '0')}</span>
  </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({
  coins, navTab, onNavigate, onSelectNavTab, onOpenInbox, onOpenSocial, onOpenSettings,
}) => {
  const team = TEAMS[0];
  const [focus, setFocus] = useState('ST');
  const spotlight = useMemo(() => pick(team.players, focus === 'ST' ? 'ST' : focus), [team.players, focus]);
  const stars = useMemo(() => [...team.players].sort((a, b) => b.rating - a.rating).slice(0, 5), [team.players]);
  const modes = [
    { id: 'team-select' as const, eyebrow: 'PLAY NOW', title: 'Kick-off', detail: 'Choose your sides', icon: <Play size={18} fill="currentColor" />, tone: 'gold' },
    { id: 'career' as const, eyebrow: 'BUILD A LEGACY', title: 'Career', detail: 'Take charge of the club', icon: <Trophy size={18} />, tone: 'blue' },
    { id: 'tournament' as const, eyebrow: 'WIN IT ALL', title: 'Tournament', detail: 'Road to the final', icon: <Crown size={18} />, tone: 'violet' },
    { id: 'practice' as const, eyebrow: 'HIT THE TRAINING GROUND', title: 'Practice', detail: 'Sharpen your touch', icon: <Zap size={18} />, tone: 'green' },
    { id: 'kits' as const, eyebrow: 'CLUB CUSTOMISE', title: 'Kit Room', detail: 'Select your matchday look', icon: <Shirt size={18} />, tone: 'cyan' },
  ];

  return (
    <div className="home-shell">
      <FCHeaderBar team={team} coins={coins} onOpenInbox={onOpenInbox} onOpenSocial={onOpenSocial} onOpenSettings={onOpenSettings} showTabs={false} />
      <main className="home-scroll">
        <section className="home-cinematic" aria-label="FC 2026 matchday feature">
          <div className="home-cinematic-background" />
          <div className="home-cinematic-grain" />
          <div className="home-cinematic-content">
            <div className="home-feature-copy">
              <div className="home-overline"><span className="home-live-dot" /> MATCHDAY 07 <b /> ELITE DIVISION</div>
              <h1>MAKE<br /><em>THE MOMENT.</em></h1>
              <p>One club. One season. Every match is yours to shape.</p>
              <div className="home-feature-actions">
                <button className="home-primary-cta" onClick={() => onNavigate('team-select')}><Play size={17} fill="currentColor" /> PLAY MATCH <ArrowRight size={17} /></button>
                <button className="home-secondary-cta" onClick={() => onNavigate('career')}><span>CONTINUE CAREER</span><ChevronRight size={17} /></button>
              </div>
              <div className="home-feature-meta"><span><Shield size={14} /> {team.shortName}</span><span>·</span><span>{team.formation} FORMATION</span><span>·</span><span>OVR {team.overallRating}</span></div>
            </div>
            <div className="home-feature-player" key={spotlight.id}>
              <div className="home-feature-orbit" />
              <PlayerPortrait player={spotlight} className="home-feature-portrait" alt={`Original in-game player portrait of ${spotlight.name}`} />
              <div className="home-feature-player-glow" />
              <div className="home-feature-player-label"><span>MATCHDAY STAR</span><strong>{spotlight.shortName}</strong><small>{spotlight.position} <i /> {spotlight.rating} OVR</small></div>
              <div className="home-feature-rating"><Crown size={13} /><span>OVR</span><b>{spotlight.rating}</b></div>
            </div>
          </div>
          <div className="home-feature-bottom"><span>FC 2026 <b>—</b> FOOTBALL, REIMAGINED</span><button onClick={() => onNavigate('squad')}>SQUAD HUB <ArrowRight size={14} /></button></div>
        </section>

        <section className="home-mode-section">
          <div className="home-section-heading"><div><span>YOUR NEXT CHAPTER</span><h2>Choose your mode</h2></div><button onClick={() => onNavigate('squad')}>CLUB HUB <ChevronRight size={15} /></button></div>
          <div className="home-mode-grid">
            {modes.map(mode => <button key={mode.id} className={`home-mode-card mode-${mode.tone}`} onClick={() => onNavigate(mode.id)}><span className="home-mode-icon">{mode.icon}</span><span className="home-mode-copy"><small>{mode.eyebrow}</small><strong>{mode.title}</strong><span>{mode.detail}</span></span><ArrowRight className="home-mode-arrow" size={18} /></button>)}
          </div>
        </section>

        <section className="home-roster-section">
          <div className="home-section-heading"><div><span>THE STARTING XI</span><h2>{team.shortName}<i> / </i> Season squad</h2></div><button onClick={() => onNavigate('squad')}><Settings2 size={14} /> MANAGE SQUAD</button></div>
          <div className="home-roster-layout">
            <div className="home-player-shelf">
              {stars.map((player, index) => <TopPlayerCard key={player.id} player={player} teamColor={index === 0 ? '#e9c567' : team.kit.secondary} onClick={() => setFocus(player.position)} />)}
            </div>
            <div className="home-squad-summary">
              <div className="home-squad-crest"><span>FC</span><b>26</b></div>
              <div className="home-squad-summary-title"><span>CLUB OVERVIEW</span><strong>{team.name}</strong><small>{team.stadium || 'Home ground'} · {team.formation}</small></div>
              <div className="home-squad-stat"><b>{team.overallRating}</b><span>OVERALL</span></div>
              <div className="home-squad-summary-line"><span>ATT <b>{team.attackRating}</b></span><i /><span>MID <b>{team.midfieldRating}</b></span><i /><span>DEF <b>{team.defenseRating}</b></span></div>
              <button onClick={() => onNavigate('squad')}>OPEN CLUB <ArrowRight size={14} /></button>
            </div>
          </div>
        </section>
      </main>
      <FCBottomNav activeTab={navTab} onSelectTab={onSelectNavTab} />
    </div>
  );
};
