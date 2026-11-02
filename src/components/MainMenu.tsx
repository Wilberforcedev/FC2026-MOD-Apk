import React from 'react';
import {
  ArrowRight, ChevronRight, CircleUserRound, Goal, Mail, Shield, ShoppingBag, Trophy, Users,
} from 'lucide-react';
import type { Team } from '../types/soccer';
import { FCHeaderBar } from './FCHeaderBar';

export type MainMenuDestination = 'team-select' | 'career' | 'tournament' | 'penalties' | 'practice' | 'squad' | 'kits' | 'pack-store';

interface MainMenuProps {
  coins: number;
  team: Team;
  onNavigate: (destination: MainMenuDestination) => void;
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
  coins, team, onNavigate, onOpenInbox, onOpenSocial, onOpenSettings,
}) => {

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
            <span className="matchday-career-copy"><b>{team.name}</b><small>BUILD YOUR CLUB. MAKE HISTORY.</small></span>
            <span className="matchday-career-progress"><b>CAREER MODE</b><span>OPEN CAREER</span><ArrowRight size={19} /></span>
          </DashboardTile>

          <DashboardTile title="Tournament" subtitle="Compete for the cup" tone="cyan" className="matchday-scenario" onClick={() => onNavigate('tournament')}>
            <span className="matchday-versus"><Trophy size={48} aria-hidden="true" /></span>
            <small className="matchday-scenario-note">TOURNAMENT BRACKET</small>
          </DashboardTile>

          <DashboardTile title="Social" subtitle="See community updates" tone="cyan" className="matchday-friends" onClick={onOpenSocial}>
            <span className="matchday-friends-art"><CircleUserRound /><Users /><CircleUserRound /></span>
            <small>OPEN SOCIAL HUB</small>
          </DashboardTile>

          <DashboardTile title="Play Match" subtitle="Choose teams and kick off" tone="cyan" className="matchday-live" onClick={() => onNavigate('team-select')}>
            <span className="matchday-live-mark"><Goal size={42} aria-hidden="true" /><b>PLAY</b></span>
            <span className="matchday-live-copy"><b>LOCAL MATCH</b><small>Select the teams for your match</small></span>
          </DashboardTile>

          <DashboardTile title="Penalties" subtitle="Take on a shootout" tone="gold" className="matchday-penalties" onClick={() => onNavigate('penalties')}>
            <Goal size={48} aria-hidden="true" />
            <small>PENALTY MODE</small>
          </DashboardTile>

          <DashboardTile title="Inbox" subtitle="Read your messages and updates" tone="cyan" className="matchday-inbox" onClick={onOpenInbox}>
            <Mail className="matchday-inbox-icon" size={44} aria-hidden="true" />
            <b className="matchday-inbox-label">OPEN INBOX</b>
          </DashboardTile>

          <DashboardTile title="Practice" subtitle="Train in the practice arena" tone="blue" className="matchday-small" onClick={() => onNavigate('practice')}>
            <Goal size={34} aria-hidden="true" />
            <span className="matchday-small-copy"><b>Practice arena</b><small>TRAIN YOUR SKILLS</small></span>
          </DashboardTile>

          <DashboardTile title="Team" tone="blue" className="matchday-small" onClick={() => onNavigate('squad')}>
            <span className="matchday-team-crest"><Shield size={35} /><b>{team.shortName}</b></span>
            <span className="matchday-small-copy"><b>{team.name}</b><small>{team.formation} FORMATION</small></span>
          </DashboardTile>

          <DashboardTile title="Pack Shop" tone="blue" className="matchday-small" onClick={() => onNavigate('pack-store')}>
            <span className="matchday-pack-card"><ShoppingBag size={25} /><b>PACKS</b></span>
            <span className="matchday-small-copy"><b>Browse player packs</b><small>OPEN THE STORE</small></span>
          </DashboardTile>

          <DashboardTile title="Kit Room" tone="blue" className="matchday-small" onClick={() => onNavigate('kits')}>
            <span className="matchday-pitch-thumb"><span /></span>
            <span className="matchday-small-copy"><b>Browse and equip kits</b><small>CLUB CUSTOMISATION</small></span>
          </DashboardTile>
        </div>
        <div className="matchday-footer"><span>FC 2026 <i>•</i> THE BEAUTIFUL GAME</span><button onClick={onOpenInbox}>OPEN INBOX <Mail size={13} /></button></div>
      </main>
    </div>
  );
};
