import React from 'react';
import {
  ArrowRight, Award, CalendarDays, ChevronRight, CircleUserRound,
  Gift, Goal, Shield, ShoppingBag, Sparkles, Trophy, Users,
} from 'lucide-react';
import { TEAMS } from '../data/teams';
import { FCHeaderBar } from './FCHeaderBar';

export type MainMenuDestination = 'team-select' | 'career' | 'tournament' | 'penalties' | 'practice' | 'squad' | 'kits' | 'pack-store';

interface MainMenuProps {
  coins: number;
  navTab: 'home' | 'play' | 'club' | 'store';
  onNavigate: (destination: MainMenuDestination) => void;
  onSelectNavTab: (tab: 'home' | 'play' | 'club' | 'store') => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

type DashboardTileProps = {
  title: string;
  subtitle?: string;
  tone?: 'blue' | 'cyan' | 'red' | 'gold';
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
};

const DashboardTile: React.FC<DashboardTileProps> = ({
  title, subtitle, tone = 'blue', className = '', onClick, children,
}) => (
  <button type="button" className={`matchday-tile matchday-${tone} ${className}`} onClick={onClick}>
    <span className="matchday-tile-heading">
      <strong>{title}</strong>
      <ChevronRight aria-hidden="true" size={19} />
    </span>
    <span className="matchday-tile-content">{children}</span>
    {subtitle && <span className="matchday-tile-subtitle">{subtitle}</span>}
  </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({
  coins, onNavigate, onOpenInbox, onOpenSocial, onOpenSettings,
}) => {
  const team = TEAMS[0];
  const featuredOpponent = TEAMS[1];

  return (
    <div className="home-shell matchday-home">
      <FCHeaderBar
        team={team}
        coins={coins}
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />
      <main className="home-scroll matchday-scroll">
        <div className="matchday-dashboard" aria-label="Main game menu">
          <DashboardTile title="Career" subtitle="Your journey to football greatness" tone="red" className="matchday-career" onClick={() => onNavigate('career')}>
            <span className="matchday-career-crest"><Trophy size={32} /><small>FC 26</small></span>
            <span className="matchday-career-copy"><b>{team.name}</b><span className="matchday-stars" aria-label="Five star club">★ ★ ★ ★ ★</span><small>BUILD YOUR CLUB. MAKE HISTORY.</small></span>
            <span className="matchday-career-progress"><b>SEASON 1</b><span>CONTINUE</span><ArrowRight size={19} /></span>
          </DashboardTile>

          <DashboardTile title="Scenario" subtitle="Play a featured challenge" tone="cyan" className="matchday-scenario" onClick={() => onNavigate('tournament')}>
            <span className="matchday-versus"><b>{team.shortName.slice(0, 2)}</b><i>V</i><b>{featuredOpponent.shortName.slice(0, 2)}</b></span>
            <small className="matchday-scenario-note"><CalendarDays size={12} /> MATCHDAY CHALLENGE</small>
          </DashboardTile>

          <DashboardTile title="Friends" subtitle="Connect and compare progress" tone="cyan" className="matchday-friends" onClick={onOpenSocial}>
            <span className="matchday-friends-art"><CircleUserRound /><Users /><CircleUserRound /></span>
            <small>OPEN SOCIAL HUB</small>
          </DashboardTile>

          <DashboardTile title="Dream League Live" subtitle="Take on the world" tone="cyan" className="matchday-live" onClick={() => onNavigate('team-select')}>
            <span className="matchday-live-mark"><Goal size={42} /><b>LIVE</b></span>
            <span className="matchday-live-copy"><b>ONLINE MATCHDAY</b><small>Ready for your next fixture</small></span>
            <span className="matchday-rank"><b>01</b><small>RANK</small></span>
          </DashboardTile>

          <DashboardTile title="Clans" subtitle="Join your football community" tone="gold" className="matchday-clans" onClick={() => onNavigate('squad')}>
            <span className="matchday-clan-crest"><Shield size={39} /><b>FC</b></span>
            <small>CLUB COMMUNITY</small>
          </DashboardTile>

          <DashboardTile title="Daily Bonus" subtitle="Claim your reward" tone="cyan" className="matchday-bonus" onClick={onOpenInbox}>
            <span className="matchday-bonus-ball"><Gift size={36} /><Sparkles size={16} /></span>
            <b className="matchday-bonus-label">FREE REWARD</b>
          </DashboardTile>

          <DashboardTile title="Challenges" tone="blue" className="matchday-small" onClick={() => onNavigate('tournament')}>
            <span className="matchday-challenge-stats"><b>1/5<small>DAILY</small></b><b>0/5<small>WEEKLY</small></b><b>0/4<small>CAREER</small></b></span><Award size={21} />
          </DashboardTile>

          <DashboardTile title="Team" tone="blue" className="matchday-small" onClick={() => onNavigate('squad')}>
            <span className="matchday-team-crest"><Shield size={35} /><b>{team.shortName}</b></span>
            <span className="matchday-small-copy"><b>{team.name}</b><small>{team.formation} FORMATION</small></span>
          </DashboardTile>

          <DashboardTile title="Transfers" tone="blue" className="matchday-small" onClick={() => onNavigate('pack-store')}>
            <span className="matchday-transfer-card"><ShoppingBag size={25} /><b>MARKET</b></span>
            <span className="matchday-small-copy"><b>Improve your squad</b><small>EXPLORE PLAYERS</small></span>
          </DashboardTile>

          <DashboardTile title="My Club" tone="blue" className="matchday-small" onClick={() => onNavigate('kits')}>
            <span className="matchday-pitch-thumb"><span /></span>
            <span className="matchday-small-copy"><b>Club customisation</b><small>KITS · STADIUM · IDENTITY</small></span>
          </DashboardTile>
        </div>
        <div className="matchday-footer"><span>FC 2026 <i>•</i> THE BEAUTIFUL GAME</span><button onClick={onOpenInbox}>CLAIM DAILY REWARD <Gift size={13} /></button></div>
      </main>
    </div>
  );
};
