import React, { useState } from 'react';
import { CareerState, SeasonFixture, Team, Player } from '../types/soccer';
import { TEAMS } from '../data/teams';
import { 
  Trophy, 
  Calendar, 
  DollarSign, 
  Users, 
  Play, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Plus, 
  Mail, 
  Search, 
  Filter, 
  GraduationCap, 
  Target, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  ChevronLeft,
  RefreshCw,
  Shield,
  Globe,
  UserPlus,
  Edit3,
  Zap,
  MapPin
} from 'lucide-react';
import { FCHeaderBar } from './FCHeaderBar';
import { ClubEmblem } from './ClubEmblem';
import { LeagueEmblem } from './LeagueEmblem';
import { LEAGUES } from '../data/emblems';
import { initializeCareer } from '../services/careerService';
import { createPlayerSigningNews, CareerNewsItem } from '../services/careerNewsService';
import { PlayerFaceCard, PlayerFaceAvatar } from './PlayerFaceCard';
import { PlayerEditorModal } from './PlayerEditorModal';
import { PlayerDevelopmentModal } from './PlayerDevelopmentModal';
import { getStadiumForTeam } from '../data/stadiums';

interface CareerModeProps {
  career: CareerState;
  onPlayNextMatch: (fixture: SeasonFixture, homeTeam: Team, awayTeam: Team) => void;
  onUpdateCareer: (updated: CareerState) => void;
  onExit: () => void;
  onOpenInbox: () => void;
  onOpenSocial: () => void;
  onOpenSettings: () => void;
}

export const CareerMode: React.FC<CareerModeProps> = ({
  career,
  onPlayNextMatch,
  onUpdateCareer,
  onExit,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'hub' | 'squad' | 'table' | 'fixtures' | 'transfers'>('hub');
  const [selectedMatchday, setSelectedMatchday] = useState(career.currentMatchday);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  // My Squad Management State
  const [squadFilterPos, setSquadFilterPos] = useState<'ALL' | 'FWD' | 'MID' | 'DEF' | 'GK'>('ALL');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [showPlayerEditorModal, setShowPlayerEditorModal] = useState(false);

  // Player Development & Training Academy
  const [developingPlayer, setDevelopingPlayer] = useState<Player | null>(null);
  const [showDevelopmentModal, setShowDevelopmentModal] = useState(false);

  const handleOpenDevelopment = (player?: Player) => {
    const target = player || userTeam.players[0];
    setDevelopingPlayer(target);
    setShowDevelopmentModal(true);
  };

  const handlePlayerDevelopmentUpdated = (updatedPlayer: Player, newsItem?: CareerNewsItem) => {
    userTeam.players = userTeam.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    
    // Also sync in TEAMS array so match engine reflects upgraded stats
    const teamInList = TEAMS.find(t => t.id === userTeam.id);
    if (teamInList) {
      teamInList.players = userTeam.players;
    }

    let updatedNews = career.newsFeed;
    if (newsItem) {
      updatedNews = [newsItem, ...(career.newsFeed || [])];
    }

    onUpdateCareer({
      ...career,
      newsFeed: updatedNews,
    });
    setTransferFeedback(`Training Complete! ${updatedPlayer.name} boosted attributes!`);
    setTimeout(() => setTransferFeedback(null), 3500);
  };

  // Transfer Market Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');
  const [transferLeagueFilter, setTransferLeagueFilter] = useState<'ALL' | 'PL' | 'PD' | 'BL1' | 'INT'>('ALL');
  const [selectedTransferPlayer, setSelectedTransferPlayer] = useState<Player | null>(
    career.transferMarket[0] || null
  );

  // League Table Filter
  const [tableLeagueFilter, setTableLeagueFilter] = useState<'ALL' | 'PL' | 'PD' | 'BL1' | 'INT'>('ALL');

  // Club Switcher / Selection Modal
  const [showClubSelectModal, setShowClubSelectModal] = useState(false);
  const [clubSelectLeagueFilter, setClubSelectLeagueFilter] = useState<'ALL' | 'PL' | 'PD' | 'BL1' | 'INT'>('ALL');

  // Modals for Manager's Office, Training Centre, Youth Academy
  const [activeOfficeModal, setActiveOfficeModal] = useState<string | null>(null);

  const userTeam = TEAMS.find(t => t.id === career.userTeamId) || TEAMS[0];

  // Helper to find origin club for any player
  const getPlayerClub = (player: Player): Team => {
    const found = TEAMS.find(t => t.players.some(p => p.id === player.id || p.name === player.name));
    if (found) return found;
    if (player.id.includes('rma') || player.name.includes('Mbappé') || player.name.includes('Vinícius') || player.name.includes('Bellingham')) {
      return TEAMS.find(t => t.id === 'madrid') || TEAMS[0];
    }
    if (player.id.includes('mci') || player.name.includes('Haaland') || player.name.includes('De Bruyne')) {
      return TEAMS.find(t => t.id === 'mancity') || TEAMS[1];
    }
    if (player.id.includes('ars') || player.name.includes('Saka') || player.name.includes('Saliba') || player.name.includes('Ødegaard')) {
      return TEAMS.find(t => t.id === 'arsenal') || TEAMS[3];
    }
    if (player.name.includes('Wirtz') || player.name.includes('Musiala') || player.name.includes('Kane')) {
      return TEAMS.find(t => t.id === 'bayern') || TEAMS[4];
    }
    if (player.name.includes('Salah') || player.name.includes('Van Dijk')) {
      return TEAMS.find(t => t.id === 'liverpool') || TEAMS[5];
    }
    return TEAMS[0];
  };

  // Find next unplayed fixture for user team
  const nextFixture = career.fixtures.find(
    f => !f.isPlayed && (f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id)
  );

  const opponentId = nextFixture
    ? nextFixture.homeTeamId === userTeam.id
      ? nextFixture.awayTeamId
      : nextFixture.homeTeamId
    : null;
  const opponentTeam = opponentId ? TEAMS.find(t => t.id === opponentId) || null : null;

  const userTableRow = career.table.find(r => r.teamId === userTeam.id);
  const userPosition = career.table.findIndex(r => r.teamId === userTeam.id) + 1;

  // Handle Editing & Creating Custom Players for Career Squad
  const handleEditSquadPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsCreatingPlayer(false);
    setShowPlayerEditorModal(true);
  };

  const handleCreateSquadPlayer = () => {
    setEditingPlayer(null);
    setIsCreatingPlayer(true);
    setShowPlayerEditorModal(true);
  };

  const handleSaveSquadPlayer = (savedPlayer: Player) => {
    if (isCreatingPlayer) {
      // Append to team roster
      userTeam.players = [...userTeam.players, savedPlayer];
      // Generate dynamic news announcement for the new signing
      const signingNews = createPlayerSigningNews(userTeam, savedPlayer, 0, career.currentMatchday);
      const updatedNews = [signingNews, ...(career.newsFeed || [])];
      onUpdateCareer({
        ...career,
        newsFeed: updatedNews,
      });
      setTransferFeedback(`Prodigy Signed! ${savedPlayer.name} has joined ${userTeam.name}!`);
    } else {
      // Update player in team roster
      userTeam.players = userTeam.players.map((p) => (p.id === savedPlayer.id ? savedPlayer : p));
      onUpdateCareer({
        ...career,
      });
      setTransferFeedback(`Player Updated! ${savedPlayer.name}'s attributes & face card have been saved.`);
    }
  };

  // Dynamic Squad Ratings for My Squad view
  const fwdSquad = userTeam.players.filter((p) => ['ST', 'LW', 'RW'].includes(p.position));
  const midSquad = userTeam.players.filter((p) => ['CAM', 'CM', 'CDM'].includes(p.position));
  const defSquad = userTeam.players.filter((p) => ['CB', 'LB', 'RB'].includes(p.position));
  const gkSquad = userTeam.players.filter((p) => p.position === 'GK');

  const calcAvgRating = (list: Player[]) => {
    if (!list || list.length === 0) return 80;
    return Math.round(list.reduce((acc, p) => acc + p.rating, 0) / list.length);
  };

  const squadAttRating = calcAvgRating(fwdSquad);
  const squadMidRating = calcAvgRating(midSquad);
  const squadDefRating = calcAvgRating([...defSquad, ...gkSquad]);
  const squadOverallRating = calcAvgRating(userTeam.players);

  const filteredSquadList = userTeam.players.filter((p) => {
    if (squadFilterPos === 'ALL') return true;
    if (squadFilterPos === 'FWD') return ['ST', 'LW', 'RW'].includes(p.position);
    if (squadFilterPos === 'MID') return ['CAM', 'CM', 'CDM'].includes(p.position);
    if (squadFilterPos === 'DEF') return ['CB', 'LB', 'RB'].includes(p.position);
    if (squadFilterPos === 'GK') return p.position === 'GK';
    return true;
  });

  // Handle Signing a Player
  const handleSignPlayer = (player: Player) => {
    const cost = player.marketValue || 60;
    if (career.budget < cost) {
      setTransferFeedback(`Insufficient transfer budget to sign ${player.name} (€${cost}M required)`);
      setTimeout(() => setTransferFeedback(null), 3500);
      return;
    }

    const updatedBudget = Math.round((career.budget - cost) * 10) / 10;
    const updatedTransferMarket = career.transferMarket.filter(p => p.id !== player.id);

    // Add to user team roster
    userTeam.players.push(player);

    const signingNews = createPlayerSigningNews(userTeam, player, cost, career.currentMatchday);
    const updatedNews = [signingNews, ...(career.newsFeed || [])];

    const updatedCareer: CareerState = {
      ...career,
      budget: updatedBudget,
      transferMarket: updatedTransferMarket,
      newsFeed: updatedNews,
    };

    onUpdateCareer(updatedCareer);
    setTransferFeedback(`Transfer Complete! ${player.name} signed for €${cost}M!`);
    setTimeout(() => setTransferFeedback(null), 3500);
  };

  // Switch Managed Club
  const handleSwitchClub = (newTeamId: string) => {
    const newCareer = initializeCareer(newTeamId);
    onUpdateCareer(newCareer);
    setShowClubSelectModal(false);
    setTransferFeedback(`You are now the Manager of ${TEAMS.find(t => t.id === newTeamId)?.name}!`);
    setTimeout(() => setTransferFeedback(null), 3500);
  };

  // Filtered transfer market list
  const filteredTransfers = career.transferMarket.filter(player => {
    const originClub = getPlayerClub(player);
    const matchesLeague = transferLeagueFilter === 'ALL' || originClub.leagueId === transferLeagueFilter;
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          originClub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = filterPosition === 'ALL' || player.position === filterPosition;
    const matchesRating = filterRating === 'ALL' ||
                          (filterRating === '90+' && player.rating >= 90) ||
                          (filterRating === '85-89' && player.rating >= 85 && player.rating < 90);
    return matchesLeague && matchesSearch && matchesPos && matchesRating;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative font-['Outfit']">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* FC Header Bar */}
      <FCHeaderBar
        team={userTeam}
        coins={Math.round(career.budget * 1000000)}
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      {/* Sub-Header: Mode Title & Tabs */}
      <div className="h-16 px-4 md:px-8 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 text-cyan-300 flex items-center justify-center transition shadow cursor-pointer"
            title="Main Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Active Club Emblem & Switcher */}
          <button
            onClick={() => setShowClubSelectModal(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-white transition cursor-pointer group shadow"
            title="Switch your Career Club"
          >
            <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="sm" glow />
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider group-hover:text-cyan-300 transition">
                  {userTeam.name}
                </span>
                {userTeam.leagueId && (
                  <LeagueEmblem leagueId={userTeam.leagueId} size="xs" />
                )}
              </div>
              <span className="text-[10px] text-white/50 font-mono block leading-none">
                Matchday {career.currentMatchday}/{career.totalMatchdays} • Switch Club ▾
              </span>
            </div>
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 sm:hidden" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-cyan-500/30 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'hub'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            CAREER HUB
          </button>
          <button
            onClick={() => setActiveTab('squad')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'squad'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>MY SQUAD</span>
            <span className="text-[10px] bg-slate-950/60 text-cyan-300 font-mono font-bold px-1.5 py-0.2 rounded-full">
              {userTeam.players.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            TRANSFER MARKET
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'table'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            LEAGUE TABLE
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'fixtures'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            FIXTURES
          </button>
        </div>
      </div>

      {/* Transfer Alert Toast */}
      {transferFeedback && (
        <div className="bg-cyan-950/90 border-b border-cyan-400 text-cyan-300 px-6 py-2 text-xs font-bold flex items-center justify-between z-20 animate-pulse">
          <span>{transferFeedback}</span>
          <button onClick={() => setTransferFeedback(null)} className="underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* =========================================================================
            TAB 1: CAREER HUB (Bento Grid)
        ========================================================================= */}
        {activeTab === 'hub' && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* HERO TILE: NEXT MATCH (Large Top-Left Tile, 7 Cols) */}
              <div className="md:col-span-7 bg-slate-950/80 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-widest bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full">
                      NEXT MATCH
                    </span>
                    <span className="text-xs text-white/50 font-mono">
                      Fixtures {career.currentMatchday} | Kick-off 20:00
                    </span>
                  </div>

                  {nextFixture && opponentTeam ? (
                    <div className="my-6">
                      <div className="flex items-center justify-between">
                        {/* User Club */}
                        <div className="flex items-center gap-4">
                          <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="xl" glow />
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                              {userTeam.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              {userTeam.leagueId && (
                                <LeagueEmblem leagueId={userTeam.leagueId} size="xs" showName />
                              )}
                              <span className="text-xs text-cyan-400 font-mono font-bold">
                                • OVR {userTeam.overallRating} • RANK #{userPosition}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="font-['Chakra_Petch'] font-black text-2xl text-white/40 italic px-2">VS</span>

                        {/* Opponent Club */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                              {opponentTeam.name}
                            </h2>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <span className="text-xs text-rose-400 font-mono font-bold">
                                OVR {opponentTeam.overallRating}
                              </span>
                              {opponentTeam.leagueId && (
                                <>
                                  <span className="text-xs text-white/30">•</span>
                                  <LeagueEmblem leagueId={opponentTeam.leagueId} size="xs" showName />
                                </>
                              )}
                            </div>
                          </div>
                          <ClubEmblem teamId={opponentTeam.id} shortName={opponentTeam.shortName} size="xl" glow />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-white/60">
                      <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                      <h3 className="font-black text-xl font-['Chakra_Petch']">Season Completed!</h3>
                      <p className="text-xs text-white/50">You achieved position #{userPosition} in the final table.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-cyan-900/40">
                  {(() => {
                    const stadium = getStadiumForTeam(userTeam.id);
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏟️</span>
                        <div>
                          <span className="text-xs text-white/90 font-['Chakra_Petch'] font-black uppercase tracking-wider block">
                            {stadium.name}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {stadium.city}, {stadium.country} • {stadium.capacity.toLocaleString()} Seats • {stadium.lawnPattern.toUpperCase()} TURF
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {nextFixture && opponentTeam && (
                    <button
                      onClick={() => onPlayNextMatch(nextFixture, userTeam, opponentTeam)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition scale-105 cursor-pointer shrink-0"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      PLAY MATCH
                    </button>
                  )}
                </div>
              </div>

              {/* TILE: MANAGER'S OFFICE (Top-Right Tile, 5 Cols) */}
              <div 
                onClick={() => setActiveOfficeModal('office')}
                className="md:col-span-5 bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between cursor-pointer group transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-black text-teal-400 uppercase tracking-wider">
                    MANAGER'S OFFICE
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider group-hover:text-teal-300 transition">
                    DIRECTIVES & CONTRACTS
                  </h3>
                  <ul className="text-xs text-white/60 space-y-1 mt-2">
                    <li className="flex items-center gap-2">• Board Objectives: Qualify for Top 4</li>
                    <li className="flex items-center gap-2">• 2 Contract Extensions Due</li>
                    <li className="flex items-center gap-2">• Press Conference Available</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyan-900/30 text-xs text-teal-400 font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                  <span>Open Manager Desk</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* TILE: TRAINING CENTRE (Bottom-Left Tile, 6 Cols) */}
              <div 
                onClick={() => handleOpenDevelopment()}
                className="md:col-span-6 bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between cursor-pointer group transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider">
                    TRAINING CENTRE & DEVELOPMENT
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider group-hover:text-cyan-300 transition">
                      PLAYER ACADEMY DRILLS
                    </h3>
                    <p className="text-xs text-white/60 mt-1">
                      Execute precision passing, power finishing, agility dribbling, and fitness drills to gain permanent XP and attribute boosts.
                    </p>
                  </div>

                  {/* Tactical Target Reticle Graphic */}
                  <div className="w-14 h-14 border border-cyan-400/40 rounded-xl relative flex items-center justify-center shrink-0 ml-3">
                    <div className="w-8 h-8 border border-cyan-400/40 rounded-full" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-cyan-400/30" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-cyan-400/30" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyan-900/30 text-xs text-cyan-400 font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                  <span>Launch Training Academy</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* TILE: YOUTH ACADEMY (Bottom-Right Tile, 6 Cols) */}
              <div 
                onClick={() => setActiveOfficeModal('youth')}
                className="md:col-span-6 bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between cursor-pointer group transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-black text-teal-400 uppercase tracking-wider">
                    YOUTH ACADEMY
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider group-hover:text-teal-300 transition">
                    TALENT SCOUT REPORT
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    3 High-Potential Prospects Scouted in South America & Western Europe (88-94 Potential).
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyan-900/30 text-xs text-teal-400 font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                  <span>Inspect Prospects</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* LEAGUE STANDINGS QUICK VIEW (Authentic Club Emblems & Points) */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-['Chakra_Petch'] font-black text-white uppercase tracking-wider">
                    LEAGUE STANDINGS SNAPSHOT
                  </span>
                  {userTeam.leagueId && (
                    <LeagueEmblem leagueId={userTeam.leagueId} size="xs" showName />
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('table')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-['Chakra_Petch'] font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                >
                  Full Table <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {career.table.slice(0, 4).map((row, idx) => {
                  const t = TEAMS.find(item => item.id === row.teamId);
                  const isUser = row.teamId === userTeam.id;
                  return (
                    <div
                      key={row.teamId}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                        isUser
                          ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-900/70 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-5 text-center font-mono font-bold text-xs ${idx === 0 ? 'text-amber-400' : 'text-white/50'}`}>
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </span>
                        <ClubEmblem teamId={row.teamId} shortName={t?.shortName} size="sm" glow={isUser} />
                        <div className="truncate">
                          <span className="font-['Chakra_Petch'] font-black text-xs text-white truncate block">
                            {t?.shortName || row.teamName}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            {row.played} PL • {row.won}W
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-['Chakra_Petch'] font-black text-xs text-cyan-300">
                          {row.points} PTS
                        </span>
                        <span className="text-[9px] text-white/40 block font-mono">
                          {row.gd > 0 ? `+${row.gd}` : row.gd} GD
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM NEWS TICKER */}
            <div 
              onClick={onOpenSocial}
              className="bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400/70 rounded-2xl p-2.5 flex items-center gap-3 overflow-hidden shadow-lg cursor-pointer transition group"
              title="Open Dynamic News Feed"
            >
              <span className="shrink-0 bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1.5 transition">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                NEWS FEED
              </span>
              <div className="overflow-hidden whitespace-nowrap text-xs text-white/80 font-['Outfit'] flex-1 flex items-center justify-between">
                <div className="truncate flex items-center gap-2">
                  <span className="text-cyan-400 font-bold uppercase font-['Chakra_Petch'] text-[11px]">
                    {career.newsFeed?.[0]?.category || 'LIVE'}:
                  </span>
                  <span className="text-white/90 font-medium truncate">
                    {career.newsFeed?.[0]?.title || `Matchday ${career.currentMatchday} kicks off with high stakes across the table`}
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono font-bold ml-2 shrink-0 group-hover:text-white transition flex items-center gap-1">
                  VIEW INBOX & NEWS &rarr;
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: MY SQUAD MANAGEMENT & FACE CARDS (Create & Edit Players)
        ========================================================================= */}
        {activeTab === 'squad' && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Squad Header: Club Crest, Formation & Team Ratings */}
            <div className="bg-slate-950/85 border border-cyan-500/30 rounded-3xl p-4 md:p-5 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="lg" glow />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                      {userTeam.name} SQUAD
                    </h2>
                    {userTeam.leagueId && (
                      <LeagueEmblem leagueId={userTeam.leagueId} size="xs" showName />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60 font-mono mt-0.5">
                    <span>Tactics: 4-3-3 Attack</span>
                    <span>•</span>
                    <span>Roster: {userTeam.players.length} Players</span>
                  </div>
                </div>
              </div>

              {/* Team Overall & Sub-Ratings Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-2xl shadow">
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-white/50 block leading-none">ATT</span>
                    <span className="text-sm font-black font-['Chakra_Petch'] text-rose-400 leading-none">
                      {squadAttRating}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-white/50 block leading-none">MID</span>
                    <span className="text-sm font-black font-['Chakra_Petch'] text-amber-400 leading-none">
                      {squadMidRating}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-white/50 block leading-none">DEF</span>
                    <span className="text-sm font-black font-['Chakra_Petch'] text-emerald-400 leading-none">
                      {squadDefRating}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[9px] font-mono text-cyan-400 block leading-none">OVR</span>
                    <span className="text-sm font-black font-['Chakra_Petch'] text-cyan-300 leading-none">
                      {squadOverallRating}
                    </span>
                  </div>
                </div>

                {/* Create Custom Player Button */}
                <button
                  onClick={handleCreateSquadPlayer}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ CREATE PLAYER</span>
                </button>
              </div>
            </div>

            {/* Position Filters Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-2 px-3 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSquadFilterPos('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    squadFilterPos === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  ALL ({userTeam.players.length})
                </button>
                <button
                  onClick={() => setSquadFilterPos('FWD')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    squadFilterPos === 'FWD'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  FORWARDS ({fwdSquad.length})
                </button>
                <button
                  onClick={() => setSquadFilterPos('MID')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    squadFilterPos === 'MID'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  MIDFIELDERS ({midSquad.length})
                </button>
                <button
                  onClick={() => setSquadFilterPos('DEF')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    squadFilterPos === 'DEF'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  DEFENDERS ({defSquad.length})
                </button>
                <button
                  onClick={() => setSquadFilterPos('GK')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    squadFilterPos === 'GK'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  GOALKEEPERS ({gkSquad.length})
                </button>
              </div>

              <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
                Click any player or edit button to customize face & stats
              </span>
            </div>

            {/* Players Face Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSquadList.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-950/80 border border-cyan-500/20 hover:border-cyan-400/60 rounded-3xl p-3.5 flex flex-col items-center justify-between gap-3 shadow-xl transition group relative overflow-hidden"
                >
                  {/* Face Card Display */}
                  <div 
                    onClick={() => handleEditSquadPlayer(player)}
                    className="w-full flex justify-center cursor-pointer transform group-hover:scale-[1.02] transition duration-300"
                    title={`Click to edit ${player.name}`}
                  >
                    <PlayerFaceCard
                      player={player}
                      teamName={userTeam.name}
                      teamId={userTeam.id}
                      size="md"
                      showGlow={false}
                    />
                  </div>

                  {/* Quick Action Buttons: Train Drills & Edit Attributes */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handleOpenDevelopment(player)}
                      className="py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>TRAIN</span>
                    </button>
                    <button
                      onClick={() => handleEditSquadPlayer(player)}
                      className="py-2 px-2 rounded-xl bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 text-cyan-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>EDIT</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Draft New Prodigy Quick Card */}
              <div
                onClick={handleCreateSquadPlayer}
                className="bg-slate-950/40 border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 transition cursor-pointer min-h-[360px] group"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shadow-inner">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-['Chakra_Petch'] font-black text-base text-white uppercase tracking-wider group-hover:text-emerald-300 transition">
                    CREATE NEW PLAYER
                  </h3>
                  <p className="text-xs text-white/50 max-w-[200px] mt-1 font-['Outfit']">
                    Draft a custom wonderkid with personalized facial card, skin, hair, and attributes.
                  </p>
                </div>
                <span className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                  LAUNCH CREATOR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: TRANSFER MARKET (With Club Crests & League Filters)
        ========================================================================= */}
        {activeTab === 'transfers' && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Top Toolbar: Search bar, League Pills, Position & Rating Filters */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-4 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                      GLOBAL TRANSFER MARKET
                    </h2>
                    <span className="text-xs text-white/50">
                      Transfer Budget: <strong className="text-amber-300 font-mono font-bold">€{career.budget}M</strong>
                    </span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search player, position, club..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Filter Selectors: POSITION, RATING */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-['Chakra_Petch'] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="ALL">POSITION: ALL</option>
                    <option value="ST">POSITION: ST</option>
                    <option value="LW">POSITION: LW</option>
                    <option value="RW">POSITION: RW</option>
                    <option value="CAM">POSITION: CAM</option>
                    <option value="CM">POSITION: CM</option>
                    <option value="CB">POSITION: CB</option>
                  </select>

                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(e.target.value)}
                    className="bg-slate-900 border border-cyan-500/30 text-teal-300 text-xs font-['Chakra_Petch'] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="ALL">RATING: ALL</option>
                    <option value="90+">RATING: 90+</option>
                    <option value="85-89">RATING: 85-89</option>
                  </select>
                </div>
              </div>

              {/* League Filter Badges (Matches Kickoff screen) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-white/5">
                <button
                  onClick={() => setTransferLeagueFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    transferLeagueFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  ALL LEAGUES
                </button>
                {Object.entries(LEAGUES)
                  .filter(([id]) => ['PL', 'PD', 'BL1', 'INT'].includes(id))
                  .map(([id, l]) => (
                    <button
                      key={id}
                      onClick={() => setTransferLeagueFilter(id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider transition cursor-pointer ${
                        transferLeagueFilter === id
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                      }`}
                    >
                      <LeagueEmblem leagueId={id} size="xs" />
                      <span>{l.shortName}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Cards Grid: Ultimate Team style cards with Club Crests */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredTransfers.map((player) => {
                const cost = player.marketValue || 60;
                const canAfford = career.budget >= cost;
                const isSelected = selectedTransferPlayer?.id === player.id;
                const originClub = getPlayerClub(player);

                return (
                  <div
                    key={player.id}
                    onClick={() => setSelectedTransferPlayer(player)}
                    className={`rounded-2xl p-3 flex flex-col justify-between transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-950/80 via-slate-900 to-slate-950 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-102 z-10'
                        : 'bg-slate-950/80 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Card Top: OVR, Position & Origin Club Emblem */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-['Chakra_Petch'] font-black text-lg text-cyan-300 leading-none">
                            {player.rating}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-white/70">
                            {player.position}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" title={originClub.name}>
                          <ClubEmblem teamId={originClub.id} shortName={originClub.shortName} size="xs" />
                          {originClub.leagueId && (
                            <LeagueEmblem leagueId={originClub.leagueId} size="xs" />
                          )}
                        </div>
                      </div>

                      {/* Likeness Portrait Avatar */}
                      <div className="my-2 flex justify-center relative">
                        <div className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-inner bg-slate-900">
                          <PlayerFaceAvatar
                            skinTone={player.likeness?.skinTone || '#d49b6a'}
                            hairStyle={player.likeness?.hairStyle || 'short'}
                            hairColor={player.likeness?.hairColor || '#111827'}
                            facialHair={player.likeness?.facialHair || 'none'}
                            jerseyColor={originClub.kit?.primary || '#0284c7'}
                            size={56}
                          />
                        </div>
                        {/* Club watermark mini badge */}
                        <div className="absolute -bottom-1 right-1/4 bg-slate-950 rounded-full p-0.5 border border-white/20 shadow">
                          <ClubEmblem teamId={originClub.id} shortName={originClub.shortName} size="xs" />
                        </div>
                      </div>

                      {/* Player Name & Current Club */}
                      <div className="text-center">
                        <h4 className="font-black text-xs text-white uppercase tracking-tight truncate font-['Chakra_Petch']">
                          {player.name}
                        </h4>
                        <span className="text-[9px] text-cyan-400/80 block font-mono">
                          {originClub.shortName} • PAC {player.stats.pace}
                        </span>
                      </div>
                    </div>

                    {/* Live Bidding & Price */}
                    <div className="mt-3 pt-2 border-t border-white/10 text-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400/80 block">
                        LIVE BIDDING
                      </span>
                      <div className="flex items-center justify-center gap-1 font-['Chakra_Petch'] font-black text-xs text-amber-300 mt-0.5">
                        <span>🪙</span>
                        <span>€{cost}M</span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-center gap-2 p-1 rounded-xl bg-slate-900/90 border border-white/10 text-[9px] text-white/70">
                            <ClubEmblem teamId={originClub.id} shortName={originClub.shortName} size="xs" />
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="xs" glow />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignPlayer(player);
                            }}
                            disabled={!canAfford}
                            className={`w-full py-1.5 rounded-xl font-['Chakra_Petch'] font-black text-[10px] uppercase tracking-wider transition cursor-pointer ${
                              canAfford
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                                : 'bg-slate-800 text-white/30 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'SUBMIT BID' : 'FUNDS LOW'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: LEAGUE TABLE (With Club Crests & League Badges)
        ========================================================================= */}
        {activeTab === 'table' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Table Header & League Filter */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="md" glow />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                      SEASON STANDINGS
                    </h2>
                    {userTeam.leagueId && (
                      <LeagueEmblem leagueId={userTeam.leagueId} size="xs" showName />
                    )}
                  </div>
                  <p className="text-xs text-white/50">Top 4 qualify for Champions Cup European Tournament</p>
                </div>
              </div>

              {/* League Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setTableLeagueFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                    tableLeagueFilter === 'ALL'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  ALL CLUBS
                </button>
                {Object.entries(LEAGUES)
                  .filter(([id]) => ['PL', 'PD', 'BL1', 'INT'].includes(id))
                  .map(([id, l]) => (
                    <button
                      key={id}
                      onClick={() => setTableLeagueFilter(id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider transition cursor-pointer ${
                        tableLeagueFilter === id
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 text-white/60 hover:text-white border border-white/10'
                      }`}
                    >
                      <LeagueEmblem leagueId={id} size="xs" />
                      <span>{l.shortName}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Standings Table Card */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-['Outfit']">
                  <thead>
                    <tr className="border-b border-cyan-900/40 text-cyan-400 font-['Chakra_Petch'] uppercase tracking-wider">
                      <th className="py-3 px-3">POS</th>
                      <th className="py-3 px-4">CLUB / CREST</th>
                      <th className="py-3 px-3 text-center">PL</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">D</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-center">GD</th>
                      <th className="py-3 px-4 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {career.table
                      .filter(row => {
                        if (tableLeagueFilter === 'ALL') return true;
                        const t = TEAMS.find(item => item.id === row.teamId);
                        return t?.leagueId === tableLeagueFilter;
                      })
                      .map((row, idx) => {
                        const isUser = row.teamId === userTeam.id;
                        const team = TEAMS.find(t => t.id === row.teamId);
                        return (
                          <tr 
                            key={row.teamId} 
                            className={`border-b border-white/5 transition ${
                              isUser
                                ? 'bg-cyan-950/40 font-bold text-cyan-300 border-cyan-500/40'
                                : 'text-white/80 hover:bg-slate-900/60'
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-bold">
                              {idx === 0 ? (
                                <span className="text-amber-400 flex items-center gap-1">👑 1</span>
                              ) : idx < 4 ? (
                                <span className="text-cyan-300">{idx + 1}</span>
                              ) : (
                                <span className="text-white/50">{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 flex items-center gap-3">
                              <ClubEmblem teamId={row.teamId} shortName={team?.shortName} size="sm" glow={isUser} />
                              <div className="flex items-center gap-2">
                                <span className={isUser ? 'font-black text-cyan-300' : 'text-white/90 font-medium'}>
                                  {row.teamName}
                                </span>
                                <span className="text-white/40 text-[10px] font-mono hidden sm:inline">
                                  ({team?.shortName})
                                </span>
                                {team?.leagueId && (
                                  <LeagueEmblem leagueId={team.leagueId} size="xs" />
                                )}
                                {isUser && (
                                  <span className="text-[9px] bg-cyan-500 text-slate-950 px-2 py-0.5 rounded font-black font-['Chakra_Petch'] uppercase tracking-wider">
                                    YOUR CLUB
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono">{row.played}</td>
                            <td className="py-3 px-3 text-center font-mono">{row.won}</td>
                            <td className="py-3 px-3 text-center font-mono">{row.drawn}</td>
                            <td className="py-3 px-3 text-center font-mono">{row.lost}</td>
                            <td className="py-3 px-3 text-center font-mono">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                            <td className="py-3 px-4 text-right font-black font-['Chakra_Petch'] text-sm text-cyan-300">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: FIXTURES CALENDAR (With Official Club Badges)
        ========================================================================= */}
        {activeTab === 'fixtures' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4">
              <span className="font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider text-white">
                SELECT MATCHDAY
              </span>
              <div className="flex items-center gap-2">
                {Array.from({ length: career.totalMatchdays }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMatchday(m)}
                    className={`w-8 h-8 rounded-xl font-['Chakra_Petch'] font-bold text-xs transition cursor-pointer ${
                      selectedMatchday === m
                        ? 'bg-cyan-500 text-slate-950 font-black shadow'
                        : 'bg-slate-900 border border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {career.fixtures
                .filter((f) => f.matchday === selectedMatchday)
                .map((fix) => {
                  const hTeam = TEAMS.find((t) => t.id === fix.homeTeamId);
                  const aTeam = TEAMS.find((t) => t.id === fix.awayTeamId);
                  const isUserMatch = fix.homeTeamId === userTeam.id || fix.awayTeamId === userTeam.id;

                  return (
                    <div
                      key={fix.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                        isUserMatch
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Home Club */}
                      <div className="flex items-center gap-3 w-5/12 justify-end">
                        <div className="text-right hidden sm:block">
                          <div className="font-black font-['Chakra_Petch'] text-sm text-white truncate max-w-[150px]">
                            {hTeam?.name || hTeam?.shortName}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">
                            OVR {hTeam?.overallRating} • {hTeam?.stadium}
                          </div>
                        </div>
                        <span className="font-black font-['Chakra_Petch'] text-sm sm:hidden text-white truncate max-w-[90px]">
                          {hTeam?.shortName}
                        </span>
                        <ClubEmblem teamId={fix.homeTeamId} shortName={hTeam?.shortName} size="md" glow={fix.homeTeamId === userTeam.id} />
                      </div>

                      {/* Center Score / Fixture Status */}
                      <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/20 font-['Chakra_Petch']">
                        <span className="font-black text-sm text-cyan-300">
                          {fix.isPlayed ? `${fix.homeScore} - ${fix.awayScore}` : 'VS'}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono">
                          {fix.isPlayed ? 'FINAL' : '20:00'}
                        </span>
                      </div>

                      {/* Away Club */}
                      <div className="flex items-center gap-3 w-5/12">
                        <ClubEmblem teamId={fix.awayTeamId} shortName={aTeam?.shortName} size="md" glow={fix.awayTeamId === userTeam.id} />
                        <div className="text-left hidden sm:block">
                          <div className="font-black font-['Chakra_Petch'] text-sm text-white truncate max-w-[150px]">
                            {aTeam?.name || aTeam?.shortName}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">
                            OVR {aTeam?.overallRating}
                          </div>
                        </div>
                        <span className="font-black font-['Chakra_Petch'] text-sm sm:hidden text-white truncate max-w-[90px]">
                          {aTeam?.shortName}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CLUB SELECTION MODAL (Switch managed team with authentic badges)
      ========================================================================= */}
      {showClubSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ClubEmblem teamId={userTeam.id} shortName={userTeam.shortName} size="md" glow />
                <div>
                  <h3 className="font-['Chakra_Petch'] font-black text-xl text-white uppercase tracking-wider">
                    SELECT CAREER CLUB
                  </h3>
                  <p className="text-xs text-white/50">Manage any world football club with authentic logos & rosters</p>
                </div>
              </div>
              <button
                onClick={() => setShowClubSelectModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* League Filters */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-3">
              <button
                onClick={() => setClubSelectLeagueFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition cursor-pointer ${
                  clubSelectLeagueFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/80 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                ALL LEAGUES
              </button>
              {Object.entries(LEAGUES)
                .filter(([id]) => ['PL', 'PD', 'BL1', 'INT'].includes(id))
                .map(([id, l]) => (
                  <button
                    key={id}
                    onClick={() => setClubSelectLeagueFilter(id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider transition cursor-pointer ${
                      clubSelectLeagueFilter === id
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/80 text-white/60 hover:text-white border border-white/10'
                    }`}
                  >
                    <LeagueEmblem leagueId={id} size="xs" />
                    <span>{l.name}</span>
                  </button>
                ))}
            </div>

            {/* Clubs Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {TEAMS.filter(t => {
                if (clubSelectLeagueFilter === 'ALL') return true;
                return t.leagueId === clubSelectLeagueFilter;
              }).map(t => {
                const isCurrent = t.id === userTeam.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSwitchClub(t.id)}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'bg-slate-900/80 border-white/10 hover:border-cyan-500/50 hover:bg-slate-900'
                    }`}
                  >
                    <ClubEmblem teamId={t.id} shortName={t.shortName} size="lg" glow={isCurrent} />
                    <div className="my-2">
                      <h4 className="font-['Chakra_Petch'] font-black text-sm text-white uppercase tracking-wider">
                        {t.name}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-white/50 font-mono">
                        <span>OVR {t.overallRating}</span>
                        <span>•</span>
                        <span>€{t.budget || 80}M</span>
                      </div>
                    </div>
                    <button
                      className={`w-full py-1.5 rounded-xl font-['Chakra_Petch'] font-black text-[10px] uppercase tracking-wider transition ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-white/70 hover:bg-cyan-500 hover:text-slate-950'
                      }`}
                    >
                      {isCurrent ? 'CURRENT CLUB' : 'MANAGE CLUB'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE DESK MODALS (Manager's Office, Training, Youth)
      ========================================================================= */}
      {activeOfficeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white mb-2 uppercase tracking-wider">
              {activeOfficeModal === 'office' && "MANAGER'S EXECUTIVE DESK"}
              {activeOfficeModal === 'training' && 'TRAINING CENTRE DRILLS'}
              {activeOfficeModal === 'youth' && 'YOUTH ACADEMY SCOUTING'}
            </h3>

            <p className="text-xs text-white/60 leading-relaxed mb-6 font-['Outfit']">
              {activeOfficeModal === 'office' &&
                'Club board confidence is high at 92%. Maintain matchday win streaks to trigger end-of-season transfer fund bonuses.'}
              {activeOfficeModal === 'training' &&
                'Drill simulation complete: Striker finishing improved (+2 SHO), Midfield recovery rate boosted (+3 STAMINA).'}
              {activeOfficeModal === 'youth' &&
                'Scouts have recommended promoting 17-year old attacking midfielder Mateo Silva (Overall 74, Potential 91).'}
            </p>

            <button
              onClick={() => setActiveOfficeModal(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow cursor-pointer"
            >
              Confirm Directive
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PLAYER EDITOR & CREATOR MODAL
      ========================================================================= */}
      <PlayerEditorModal
        isOpen={showPlayerEditorModal}
        player={editingPlayer}
        isCreateMode={isCreatingPlayer}
        teamId={userTeam.id}
        teamName={userTeam.name}
        onClose={() => setShowPlayerEditorModal(false)}
        onSave={handleSaveSquadPlayer}
      />

      {/* =========================================================================
          PLAYER DEVELOPMENT & TRAINING MODAL
      ========================================================================= */}
      <PlayerDevelopmentModal
        isOpen={showDevelopmentModal}
        player={developingPlayer}
        team={userTeam}
        matchday={career.currentMatchday}
        onClose={() => setShowDevelopmentModal(false)}
        onPlayerUpdated={handlePlayerDevelopmentUpdated}
      />
    </div>
  );
};
