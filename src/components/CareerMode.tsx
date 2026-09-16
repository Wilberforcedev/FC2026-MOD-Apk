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
  ChevronLeft
} from 'lucide-react';
import { FCHeaderBar } from './FCHeaderBar';
import { ClubEmblem } from './ClubEmblem';
import { LeagueEmblem } from './LeagueEmblem';
import { createPlayerSigningNews } from '../services/careerNewsService';

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
  const [activeTab, setActiveTab] = useState<'hub' | 'table' | 'fixtures' | 'transfers'>('hub');
  const [selectedMatchday, setSelectedMatchday] = useState(career.currentMatchday);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  // Transfer Market Filters (matches top-left of image.png)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [filterRating, setFilterRating] = useState<string>('ALL');
  const [selectedTransferPlayer, setSelectedTransferPlayer] = useState<Player | null>(
    career.transferMarket[0] || null
  );

  // Modals for Manager's Office, Training Centre, Youth Academy
  const [activeOfficeModal, setActiveOfficeModal] = useState<string | null>(null);

  const userTeam = TEAMS.find(t => t.id === career.userTeamId) || TEAMS[0];

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

  // Filtered transfer market list
  const filteredTransfers = career.transferMarket.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = filterPosition === 'ALL' || player.position === filterPosition;
    const matchesRating = filterRating === 'ALL' ||
                          (filterRating === '90+' && player.rating >= 90) ||
                          (filterRating === '85-89' && player.rating >= 85 && player.rating < 90);
    return matchesSearch && matchesPos && matchesRating;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative font-['Outfit']">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* FC Header Bar */}
      <FCHeaderBar
        coins={Math.round(career.budget * 1000000)}
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      {/* Sub-Header: Mode Title & Tabs */}
      <div className="h-14 px-4 md:px-8 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 text-cyan-300 flex items-center justify-center transition shadow"
            title="Main Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-['Chakra_Petch'] font-black text-lg md:text-xl tracking-wider uppercase text-white">
              CAREER MODE
            </h1>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-bold">
              MATCHDAY {career.currentMatchday}/{career.totalMatchdays}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 border border-cyan-500/30 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'hub'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            CAREER HUB
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'transfers'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            TRANSFER MARKET
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
              activeTab === 'table'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            LEAGUE TABLE
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition ${
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
          <button onClick={() => setTransferFeedback(null)} className="underline">Dismiss</button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* =========================================================================
            TAB 1: CAREER HUB (Matches image.png bottom-right Bento Grid)
        ========================================================================= */}
        {activeTab === 'hub' && (
          <div className="max-w-6xl mx-auto flex flex-col justify-between h-full space-y-5">
            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1">
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
                          <div 
                            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xl"
                            style={{ backgroundColor: userTeam.badgeBg, borderColor: userTeam.badgeBorder }}
                          >
                            {userTeam.badgeIcon}
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                              {userTeam.name}
                            </h2>
                            <span className="text-xs text-cyan-400 font-mono font-bold">
                              OVR {userTeam.overallRating} • RANK #{userPosition}
                            </span>
                          </div>
                        </div>

                        <span className="font-['Chakra_Petch'] font-black text-2xl text-white/40 italic">VS</span>

                        {/* Opponent Club */}
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                              {opponentTeam.name}
                            </h2>
                            <span className="text-xs text-rose-400 font-mono font-bold">
                              OVR {opponentTeam.overallRating}
                            </span>
                          </div>
                          <div 
                            className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-xl"
                            style={{ backgroundColor: opponentTeam.badgeBg, borderColor: opponentTeam.badgeBorder }}
                          >
                            {opponentTeam.badgeIcon}
                          </div>
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

                <div className="flex items-center justify-between pt-4 border-t border-cyan-900/40">
                  <span className="text-xs text-white/50 font-mono">
                    Stadium: {userTeam.stadium}
                  </span>

                  {nextFixture && opponentTeam && (
                    <button
                      onClick={() => onPlayNextMatch(nextFixture, userTeam, opponentTeam)}
                      className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition scale-105"
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
                onClick={() => setActiveOfficeModal('training')}
                className="md:col-span-6 bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between cursor-pointer group transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-['Chakra_Petch'] font-black text-cyan-400 uppercase tracking-wider">
                    TRAINING CENTRE
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <Target className="w-5 h-5" />
                  </div>
                </div>

                <div className="my-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider group-hover:text-cyan-300 transition">
                      DRILL SELECTION
                    </h3>
                    <p className="text-xs text-white/60 mt-1">
                      Target passing accuracy, chip shooting, and stamina sharpening drills.
                    </p>
                  </div>

                  {/* Tactical Target Reticle Graphic (matches image) */}
                  <div className="w-14 h-14 border border-cyan-400/40 rounded-xl relative flex items-center justify-center shrink-0 ml-3">
                    <div className="w-8 h-8 border border-cyan-400/40 rounded-full" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-cyan-400/30" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-cyan-400/30" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cyan-900/30 text-xs text-cyan-400 font-['Chakra_Petch'] font-bold uppercase tracking-wider">
                  <span>Start Skill Drills</span>
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

            {/* =========================================================================
                BOTTOM NEWS TICKER (matches image.png bottom ticker)
            ========================================================================= */}
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
            TAB 2: TRANSFER MARKET (Matches image.png top-left screen)
        ========================================================================= */}
        {activeTab === 'transfers' && (
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Top Toolbar: SORT pill, Title, Search bar, Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <button className="px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  &lt; SORT
                </button>
                <h2 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider">
                  TRANSFER MARKET
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Filter Pills: POSITION, RATING */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-['Chakra_Petch'] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400"
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
                  className="bg-slate-900 border border-cyan-500/30 text-teal-300 text-xs font-['Chakra_Petch'] font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-400"
                >
                  <option value="ALL">RATING: ALL</option>
                  <option value="90+">RATING: 90+</option>
                  <option value="85-89">RATING: 85-89</option>
                </select>
              </div>
            </div>

            {/* Cards Grid: Ultimate Team style cards (matches image.png top-left) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredTransfers.map((player) => {
                const cost = player.marketValue || 60;
                const canAfford = career.budget >= cost;
                const isSelected = selectedTransferPlayer?.id === player.id;

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
                    {/* Card Top: OVR & Position */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-['Chakra_Petch'] font-black text-lg text-cyan-300 leading-none">
                          {player.rating}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white/70">
                          {player.position}
                        </span>
                      </div>

                      {/* Likeness Portrait Avatar */}
                      <div className="my-2 flex justify-center">
                        <div
                          className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center text-xl shadow-inner"
                          style={{ backgroundColor: player.likeness?.skinTone || '#d49b6a' }}
                        >
                          ⚽
                        </div>
                      </div>

                      {/* Player Name */}
                      <div className="text-center">
                        <h4 className="font-black text-xs text-white uppercase tracking-tight truncate font-['Chakra_Petch']">
                          {player.name}
                        </h4>
                        <span className="text-[9px] text-white/40 block font-mono">
                          PAC {player.stats.pace} • DRI {player.stats.dribbling}
                        </span>
                      </div>
                    </div>

                    {/* Live Bidding & Price (as in image.png) */}
                    <div className="mt-3 pt-2 border-t border-white/10 text-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400/80 block">
                        LIVE BIDDING
                      </span>
                      <div className="flex items-center justify-center gap-1 font-['Chakra_Petch'] font-black text-xs text-amber-300 mt-0.5">
                        <span>🪙</span>
                        <span>{(cost * 1000000).toLocaleString()}</span>
                      </div>

                      {isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSignPlayer(player);
                          }}
                          disabled={!canAfford}
                          className={`mt-2 w-full py-1.5 rounded-xl font-['Chakra_Petch'] font-black text-[10px] uppercase tracking-wider transition ${
                            canAfford
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-800 text-white/30 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'SUBMIT BID' : 'FUNDS LOW'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: LEAGUE TABLE
        ========================================================================= */}
        {activeTab === 'table' && (
          <div className="max-w-5xl mx-auto bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider mb-4">
              SEASON STANDINGS TABLE
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-['Outfit']">
                <thead>
                  <tr className="border-b border-cyan-900/40 text-cyan-400 font-['Chakra_Petch'] uppercase tracking-wider">
                    <th className="py-3 px-4">POS</th>
                    <th className="py-3 px-4">CLUB</th>
                    <th className="py-3 px-4 text-center">PL</th>
                    <th className="py-3 px-4 text-center">W</th>
                    <th className="py-3 px-4 text-center">D</th>
                    <th className="py-3 px-4 text-center">L</th>
                    <th className="py-3 px-4 text-center">GD</th>
                    <th className="py-3 px-4 text-right">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {career.table.map((row, idx) => {
                    const isUser = row.teamId === userTeam.id;
                    return (
                      <tr 
                        key={row.teamId} 
                        className={`border-b border-white/5 transition ${
                          isUser
                            ? 'bg-cyan-950/40 font-bold text-cyan-300 border-cyan-500/40'
                            : 'text-white/80 hover:bg-slate-900/60'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold">
                          {idx === 0 ? '👑 1' : idx + 1}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <span>{row.teamName}</span>
                          {isUser && (
                            <span className="text-[9px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{row.played}</td>
                        <td className="py-3 px-4 text-center font-mono">{row.won}</td>
                        <td className="py-3 px-4 text-center font-mono">{row.drawn}</td>
                        <td className="py-3 px-4 text-center font-mono">{row.lost}</td>
                        <td className="py-3 px-4 text-center font-mono">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
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
        )}

        {/* =========================================================================
            TAB 4: FIXTURES CALENDAR
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
                    className={`w-8 h-8 rounded-xl font-['Chakra_Petch'] font-bold text-xs transition ${
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
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        isUserMatch
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-950/70 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-5/12 justify-end">
                        <span className="font-black font-['Chakra_Petch'] text-sm">{hTeam?.shortName}</span>
                        <span className="text-xl">{hTeam?.badgeIcon}</span>
                      </div>

                      <div className="px-4 py-1 rounded-xl bg-slate-900 border border-white/10 font-['Chakra_Petch'] font-black text-sm">
                        {fix.isPlayed ? `${fix.homeScore} - ${fix.awayScore}` : 'VS'}
                      </div>

                      <div className="flex items-center gap-3 w-5/12">
                        <span className="text-xl">{aTeam?.badgeIcon}</span>
                        <span className="font-black font-['Chakra_Petch'] text-sm">{aTeam?.shortName}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

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
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow"
            >
              Confirm Directive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
