import React, { useState } from 'react';
import { 
  Sparkles, 
  Globe2, 
  UserPlus, 
  GraduationCap, 
  Compass, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Star, 
  ChevronRight, 
  Search, 
  Zap, 
  Users, 
  Filter, 
  TrendingUp, 
  ShieldCheck, 
  Footprints,
  Briefcase,
  Layers
} from 'lucide-react';
import { 
  CareerState, 
  Team, 
  Player, 
  ScoutedProspect, 
  ScoutingRegionId, 
  ScoutProfilePriority, 
  PotentialTier 
} from '../types/soccer';
import { 
  SCOUTING_REGIONS, 
  RegionMetadata, 
  dispatchScoutMission, 
  promoteProspectToSenior, 
  signProspectToAcademy, 
  releaseProspectReport, 
  hireClubScout,
  initializeScoutingNetwork 
} from '../services/scoutingService';
import { PlayerFaceCard } from './PlayerFaceCard';

interface ScoutingHubProps {
  career: CareerState;
  userTeam: Team;
  onUpdateCareer: (updated: CareerState) => void;
  onOpenDevelopment?: (player?: Player) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ScoutingHub: React.FC<ScoutingHubProps> = ({
  career,
  userTeam,
  onUpdateCareer,
  onOpenDevelopment,
  onClose,
  isModal = false,
}) => {
  const [subTab, setSubTab] = useState<'dispatch' | 'dossiers' | 'academy' | 'staff'>('dossiers');
  const [selectedRegionForDispatch, setSelectedRegionForDispatch] = useState<ScoutingRegionId | null>(null);
  const [selectedScoutId, setSelectedScoutId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<ScoutProfilePriority>('any');
  const [isInstantDispatch, setIsInstantDispatch] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dossierFilterTier, setDossierFilterTier] = useState<string>('ALL');
  const [dossierFilterPos, setDossierFilterPos] = useState<string>('ALL');
  const [inspectedProspect, setInspectedProspect] = useState<ScoutedProspect | null>(null);

  // Ensure network is initialized
  const network = career.scoutingNetwork || initializeScoutingNetwork();
  const availableScouts = network.scouts.filter((s) => s.hired && s.status === 'available');
  const activeScoutingMissions = network.scouts.filter((s) => s.hired && s.status === 'scouting');

  // Filtered dossiers
  const filteredDossiers = network.activeReports.filter((p) => {
    if (dossierFilterTier !== 'ALL' && p.potentialTier !== dossierFilterTier) return false;
    if (dossierFilterPos !== 'ALL') {
      if (dossierFilterPos === 'FWD' && !['ST', 'LW', 'RW'].includes(p.position)) return false;
      if (dossierFilterPos === 'MID' && !['CAM', 'CM', 'CDM'].includes(p.position)) return false;
      if (dossierFilterPos === 'DEF' && !['CB', 'LB', 'RB'].includes(p.position)) return false;
      if (dossierFilterPos === 'GK' && p.position !== 'GK') return false;
    }
    return true;
  });

  const handleOpenDispatchModal = (regionId: ScoutingRegionId) => {
    setSelectedRegionForDispatch(regionId);
    if (availableScouts.length > 0) {
      setSelectedScoutId(availableScouts[0].id);
    }
  };

  const handleConfirmDispatch = () => {
    if (!selectedRegionForDispatch || !selectedScoutId) {
      setNotification({ type: 'error', message: 'Please select an available scout.' });
      return;
    }

    const res = dispatchScoutMission(
      career,
      selectedScoutId,
      selectedRegionForDispatch,
      selectedPriority,
      isInstantDispatch
    );

    if (res.success) {
      onUpdateCareer(res.updatedCareer);
      setNotification({ type: 'success', message: res.message });
      setSelectedRegionForDispatch(null);
      if (isInstantDispatch) {
        setSubTab('dossiers');
      }
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handlePromoteProspect = (prospect: ScoutedProspect) => {
    const res = promoteProspectToSenior(career, userTeam, prospect);
    if (res.success) {
      onUpdateCareer(res.updatedCareer);
      setNotification({ type: 'success', message: res.message });
      if (inspectedProspect?.id === prospect.id) {
        setInspectedProspect(null);
      }
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleSignToAcademy = (prospect: ScoutedProspect) => {
    const res = signProspectToAcademy(career, prospect);
    if (res.success) {
      onUpdateCareer(res.updatedCareer);
      setNotification({ type: 'success', message: res.message });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  const handleReleaseProspect = (prospectId: string) => {
    const updated = releaseProspectReport(career, prospectId);
    onUpdateCareer(updated);
    setNotification({ type: 'success', message: 'Prospect released from scouting report.' });
    if (inspectedProspect?.id === prospectId) {
      setInspectedProspect(null);
    }
  };

  const handleHireScout = (scoutId: string) => {
    const res = hireClubScout(career, scoutId);
    if (res.success) {
      onUpdateCareer(res.updatedCareer);
      setNotification({ type: 'success', message: res.message });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
  };

  // Helper for potential tier styling & badge text
  const getPotentialBadge = (tier: PotentialTier) => {
    switch (tier) {
      case 'generational':
        return {
          title: 'Has Potential to be Special',
          badgeClass: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-amber-300 animate-pulse',
          icon: '🌟',
          rangeColor: 'text-amber-300',
        };
      case 'exciting':
        return {
          title: 'An Exciting Prospect',
          badgeClass: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold border border-purple-400/50 shadow-md shadow-purple-500/20',
          icon: '✨',
          rangeColor: 'text-purple-300',
        };
      case 'great':
        return {
          title: 'Showing Great Potential',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
          icon: '⚡',
          rangeColor: 'text-emerald-300',
        };
      default:
        return {
          title: 'Solid Squad Potential',
          badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700 font-semibold',
          icon: '🛡️',
          rangeColor: 'text-slate-300',
        };
    }
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl' : 'space-y-6'}`}>
      {/* =========================================================================
          MODULE HEADER & CLUB METRICS BANNER
      ========================================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cyan-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              EA SPORTS FC 26 CAREER
            </span>
            <span className="text-xs text-white/50 font-mono">
              MATCHDAY {career.currentMatchday} OF {career.totalMatchdays}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-['Chakra_Petch'] text-white uppercase tracking-wider flex items-center gap-3 mt-1">
            <Compass className="w-7 h-7 text-cyan-400" />
            GLOBAL SCOUTING & YOUTH ACADEMY
          </h2>
          <p className="text-xs text-white/60 font-['Outfit'] mt-0.5">
            Dispatch chief scouts to global talent hotspots, unearth generational wonderkids with unique potential ratings, and promote academy graduates to the senior squad.
          </p>
        </div>

        {/* Club Quick Stats & Close Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 rounded-2xl px-4 py-2">
            <div className="text-right">
              <div className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Transfer & Scout Budget</div>
              <div className="text-lg font-black font-mono text-cyan-300">
                €{career.budget.toFixed(1)}M
              </div>
            </div>
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between transition animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-3 text-xs md:text-sm font-['Outfit']">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-white/50 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          MODULE NAVIGATION TABS
      ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-900/30 pb-3">
        <button
          onClick={() => setSubTab('dossiers')}
          className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            subTab === 'dossiers'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/80 text-white/70 hover:text-white hover:bg-slate-800 border border-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Talent Dossiers ({network.activeReports.length})</span>
          {network.activeReports.some((p) => p.potentialTier === 'generational') && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setSubTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            subTab === 'dispatch'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/80 text-white/70 hover:text-white hover:bg-slate-800 border border-white/10'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Global Scout Dispatch</span>
          {activeScoutingMissions.length > 0 && (
            <span className="px-1.5 py-0.2 bg-teal-400 text-slate-950 rounded-full text-[9px] font-mono">
              {activeScoutingMissions.length} Active
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('academy')}
          className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            subTab === 'academy'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/80 text-white/70 hover:text-white hover:bg-slate-800 border border-white/10'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Youth Academy Roster ({career.youthAcademy?.length || 0})</span>
        </button>

        <button
          onClick={() => setSubTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            subTab === 'staff'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900/80 text-white/70 hover:text-white hover:bg-slate-800 border border-white/10'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Scouting Staff ({network.scouts.filter((s) => s.hired).length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SCOUT TALENT DOSSIERS (DISCOVERED PROSPECTS)
      ========================================================================= */}
      {subTab === 'dossiers' && (
        <div className="space-y-4">
          {/* Filters & Count Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-cyan-900/40 rounded-2xl p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-['Chakra_Petch'] font-bold text-white/50 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Potential:
              </span>
              {(['ALL', 'generational', 'exciting', 'great', 'rotation'] as const).map((tierKey) => (
                <button
                  key={tierKey}
                  onClick={() => setDossierFilterTier(tierKey)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-['Chakra_Petch'] font-bold uppercase tracking-wider transition cursor-pointer ${
                    dossierFilterTier === tierKey
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-white/70 hover:bg-slate-700'
                  }`}
                >
                  {tierKey === 'ALL' ? 'All Tiers' : tierKey === 'generational' ? 'Special (91+)' : tierKey === 'exciting' ? 'Exciting (86-90)' : tierKey === 'great' ? 'Great (81-85)' : 'Squad'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-['Chakra_Petch'] font-bold text-white/50">Position:</span>
              {(['ALL', 'FWD', 'MID', 'DEF', 'GK'] as const).map((posKey) => (
                <button
                  key={posKey}
                  onClick={() => setDossierFilterPos(posKey)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition cursor-pointer ${
                    dossierFilterPos === posKey
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-white/70 hover:bg-slate-700'
                  }`}
                >
                  {posKey}
                </button>
              ))}
            </div>
          </div>

          {/* Dossiers Grid */}
          {filteredDossiers.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-cyan-900/40 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
                <Compass className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-['Chakra_Petch'] font-black text-white uppercase tracking-wider">
                No Talent Dossiers Matching Criteria
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto mt-1 font-['Outfit']">
                Dispatch your scouts across South America, Western Europe, or Africa to unearth exciting new youth prodigies!
              </p>
              <button
                onClick={() => setSubTab('dispatch')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                Dispatch Scouts Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDossiers.map((prospect) => {
                const tierInfo = getPotentialBadge(prospect.potentialTier);
                const isPromoted = userTeam.players.some((p) => p.id === prospect.id) || prospect.status === 'promoted';
                const isSignedAcademy = (career.youthAcademy || []).some((p) => p.id === prospect.id) || prospect.status === 'signed_to_academy';

                return (
                  <div
                    key={prospect.id}
                    className={`bg-slate-950/90 border rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition ${
                      prospect.potentialTier === 'generational'
                        ? 'border-amber-400/60 shadow-amber-500/10 hover:border-amber-300'
                        : prospect.potentialTier === 'exciting'
                        ? 'border-purple-500/50 shadow-purple-500/10 hover:border-purple-400'
                        : 'border-cyan-500/30 hover:border-cyan-400'
                    }`}
                  >
                    {/* Top Tier Badge & Region */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1.5 ${tierInfo.badgeClass}`}>
                        <span>{tierInfo.icon}</span>
                        <span>{tierInfo.title}</span>
                      </div>

                      <div className="text-[10px] font-mono text-white/60 flex items-center gap-1">
                        <span>{prospect.flag}</span>
                        <span>{prospect.nationality}</span>
                      </div>
                    </div>

                    {/* Main Face Card + Bio */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="shrink-0">
                        <PlayerFaceCard
                          player={prospect}
                          team={userTeam}
                          size="sm"
                          showDetails={false}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase truncate">
                            {prospect.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/70 mt-0.5">
                          <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
                            {prospect.position}
                          </span>
                          <span>•</span>
                          <span>{prospect.age} Yrs Old</span>
                          <span>•</span>
                          <span>{prospect.preferredFoot}-Foot</span>
                        </div>

                        {/* Unique Potential Display */}
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-white/10">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-white/50 font-mono uppercase">Potential Range:</span>
                            <span className={`font-black font-['Chakra_Petch'] text-sm ${tierInfo.rangeColor}`}>
                              {prospect.potentialMin} - {prospect.potentialMax} POT
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-white/60 font-mono">
                            <span>Current OVR: <strong className="text-white">{prospect.rating}</strong></span>
                            <span className="text-emerald-400 font-bold">+{prospect.potentialMax - prospect.rating} Growth Ceiling</span>
                          </div>
                        </div>

                        {/* Estimated Value */}
                        <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-white/50">
                          <span>Market Value: <strong className="text-white">€{prospect.marketValue}M</strong></span>
                          <span>Wage: <strong className="text-white">€{prospect.wage}K/wk</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900/70 rounded-xl border border-white/5 text-center font-mono text-[10px] mb-3">
                      <div>
                        <div className="text-white/40 text-[9px]">PAC</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.pace}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px]">SHO</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.shooting}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px]">PAS</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.passing}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px]">DRI</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.dribbling}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px]">DEF</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.defending}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-[9px]">PHY</div>
                        <div className="font-bold text-cyan-300">{prospect.stats.physicality}</div>
                      </div>
                    </div>

                    {/* PlayStyles & Skills */}
                    <div className="flex items-center justify-between text-[10px] text-white/60 mb-3 px-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Skills: {prospect.skillMoves}★</span>
                        <span className="mx-1">•</span>
                        <span>WF: {prospect.weakFoot}★</span>
                      </div>
                      {prospect.playStyles && prospect.playStyles.length > 0 && (
                        <span className="text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {prospect.playStyles[0]}
                        </span>
                      )}
                    </div>

                    {/* Scout Notes */}
                    <p className="text-[11px] text-white/60 italic bg-slate-900/40 p-2.5 rounded-xl border border-white/5 mb-4 line-clamp-2">
                      "{prospect.scoutComment}"
                    </p>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                      {isPromoted ? (
                        <div className="w-full py-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-center text-xs font-['Chakra_Petch'] font-black text-emerald-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>In Senior Squad (#{prospect.number})</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePromoteProspect(prospect)}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
                            title="Directly add to First Team Squad"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Promote</span>
                          </button>

                          {!isSignedAcademy && (
                            <button
                              onClick={() => handleSignToAcademy(prospect)}
                              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 font-['Chakra_Petch'] font-bold text-xs uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                              title="Sign to Youth Academy"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Academy</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleReleaseProspect(prospect.id)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-white/40 hover:text-rose-400 border border-white/5 transition cursor-pointer"
                            title="Discard / Release"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: GLOBAL SCOUT DISPATCH (SELECT REGIONS & SEND MISSIONS)
      ========================================================================= */}
      {subTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-cyan-400" />
                  GLOBAL TALENT SCOUTING NETWORK
                </h3>
                <p className="text-xs text-white/60 font-['Outfit'] mt-0.5">
                  Select a footballing region to deploy your chief scouts. Different continents cultivate unique positional archetypes and skill traits.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/70">
                  Available Scouts: <strong className="text-cyan-400">{availableScouts.length}</strong> / {network.scouts.filter((s) => s.hired).length}
                </span>
              </div>
            </div>
          </div>

          {/* 7 World Regions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.values(SCOUTING_REGIONS).map((region: RegionMetadata) => {
              const activeMission = network.scouts.find(
                (s) => s.hired && s.status === 'scouting' && s.currentMission?.region === region.id
              );

              return (
                <div
                  key={region.id}
                  className="bg-slate-950/80 border border-cyan-500/30 hover:border-cyan-400 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group transition"
                >
                  {/* Top Bar: Region name & mission cost */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{region.flag.split(' ')[0]}</span>
                        <h4 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase tracking-wider group-hover:text-cyan-300 transition">
                          {region.name}
                        </h4>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                        €{region.missionCost}M
                      </span>
                    </div>

                    <p className="text-xs text-white/70 font-['Outfit'] leading-relaxed mb-4">
                      {region.description}
                    </p>

                    {/* Regional Specialties & Archetypes */}
                    <div className="space-y-2 mb-4 bg-slate-900/80 p-3 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase font-mono tracking-wider">Cultivated Archetypes:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {region.archetypes.map((arch) => (
                          <span
                            key={arch}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-['Chakra_Petch'] font-bold bg-white/5 text-white/80 border border-white/10"
                          >
                            {arch}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-white/5 text-[10px] text-white/50">
                        Key Traits: <strong className="text-white/80">{region.topTraits}</strong>
                      </div>

                      <div className="text-[10px] text-cyan-400/80 font-mono">
                        Historic Icons: {region.notableAlumni}
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action */}
                  <div className="pt-3 border-t border-white/10">
                    {activeMission ? (
                      <div className="p-2.5 rounded-xl bg-teal-950/70 border border-teal-500/40 text-center text-xs font-['Chakra_Petch'] font-black text-teal-300 uppercase tracking-wider flex items-center justify-center gap-2">
                        <Footprints className="w-4 h-4 text-teal-400 animate-bounce" />
                        <span>Scout {activeMission.name} On-Site</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenDispatchModal(region.id)}
                        disabled={availableScouts.length === 0}
                        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Compass className="w-4 h-4" />
                        <span>
                          {availableScouts.length > 0 ? `Send Scout (€${region.missionCost}M)` : 'No Scouts Free'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DISPATCH CONFIGURATION MODAL */}
          {selectedRegionForDispatch && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SCOUTING_REGIONS[selectedRegionForDispatch].flag.split(' ')[0]}</span>
                    <h3 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase tracking-wider">
                      DISPATCH EXPEDITION TO {SCOUTING_REGIONS[selectedRegionForDispatch].name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedRegionForDispatch(null)}
                    className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 1. Select Scout */}
                <div>
                  <label className="block text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase mb-2">
                    Select Available Scout:
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {availableScouts.map((scout) => (
                      <div
                        key={scout.id}
                        onClick={() => setSelectedScoutId(scout.id)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          selectedScoutId === scout.id
                            ? 'bg-cyan-500/15 border-cyan-400 text-white'
                            : 'bg-slate-900/60 border-white/10 text-white/70 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="font-['Chakra_Petch'] font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{scout.flag}</span>
                            <span>{scout.name}</span>
                          </div>
                          <div className="text-[11px] text-white/50">{scout.specialty}</div>
                        </div>

                        <div className="text-right font-mono text-xs">
                          <div className="text-cyan-300">Exp: {scout.experience}★</div>
                          <div className="text-amber-300">Judge: {scout.judgement}★</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Target Profile Priority */}
                <div>
                  <label className="block text-xs font-['Chakra_Petch'] font-bold text-white/70 uppercase mb-2">
                    Target Talent Priority:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'any', label: '🌟 Best Available Talent' },
                      { key: 'technically_gifted', label: '🪄 Technically Gifted' },
                      { key: 'pace_winger', label: '⚡ Pacy Winger / Attacker' },
                      { key: 'playmaker', label: '🎯 Midfield Playmaker' },
                      { key: 'defensive_minded', label: '🛡️ Defensive Wall' },
                      { key: 'physically_strong', label: '🥊 Physical Powerhouse' },
                      { key: 'goalkeeper', label: '🧤 Sweeper Keeper' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setSelectedPriority(p.key as ScoutProfilePriority)}
                        className={`p-2 rounded-xl text-xs text-left font-['Outfit'] font-semibold transition cursor-pointer border ${
                          selectedPriority === p.key
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                            : 'bg-slate-900/80 text-white/70 hover:bg-slate-800 border-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Expedition Mode */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                  <div className="text-xs font-['Chakra_Petch'] font-bold text-white uppercase">Expedition Pace:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInstantDispatch(true)}
                      className={`p-2.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider border transition text-center cursor-pointer ${
                        isInstantDispatch
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : 'bg-slate-800 text-white/60 border-white/5 hover:text-white'
                      }`}
                    >
                      ⚡ Rapid Deep-Scout (Instant)
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsInstantDispatch(false)}
                      className={`p-2.5 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider border transition text-center cursor-pointer ${
                        !isInstantDispatch
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : 'bg-slate-800 text-white/60 border-white/5 hover:text-white'
                      }`}
                    >
                      📅 1 Matchday Mission
                    </button>
                  </div>

                  <div className="text-[11px] text-white/50 leading-relaxed font-['Outfit']">
                    {isInstantDispatch 
                      ? '⚡ Rapid Deep-Scout: Chief scout contacts local regional networks immediately and returns 3-5 discovered youth prospects on the spot.'
                      : '📅 Standard Expedition: Scout embeds in regional youth tournaments and files full dossier after the next matchday.'}
                  </div>
                </div>

                {/* Cost Summary & Dispatch Button */}
                <div className="pt-2 border-t border-cyan-900/30 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white/50 uppercase font-mono">Mission Budget Cost:</div>
                    <div className="text-lg font-black font-mono text-cyan-300">
                      €{SCOUTING_REGIONS[selectedRegionForDispatch].missionCost}M
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmDispatch}
                    disabled={career.budget < SCOUTING_REGIONS[selectedRegionForDispatch].missionCost}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/30 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Confirm & Dispatch</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: YOUTH ACADEMY ROSTER
      ========================================================================= */}
      {subTab === 'academy' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-teal-500/30 rounded-3xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-400" />
                  YOUTH ACADEMY TRAINING & NURTURING
                </h3>
                <p className="text-xs text-white/60 font-['Outfit'] mt-0.5">
                  Signed youth prospects train under club academy coaches. Track their growth ceiling and promote them to the senior team once ready.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-950/60 border border-teal-500/40 text-teal-300">
                {career.youthAcademy?.length || 0} Academy Enrollees
              </span>
            </div>
          </div>

          {(!career.youthAcademy || career.youthAcademy.length === 0) ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-teal-900/40 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-['Chakra_Petch'] font-black text-white uppercase tracking-wider">
                Youth Academy Roster Empty
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto mt-1 font-['Outfit']">
                Head to your Talent Dossiers or Dispatch Scouts to discover promising teens and sign them to the Youth Academy!
              </p>
              <button
                onClick={() => setSubTab('dossiers')}
                className="mt-4 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow cursor-pointer"
              >
                Inspect Discovered Dossiers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {career.youthAcademy.map((player) => {
                const prospectData = network.activeReports.find((p) => p.id === player.id);
                const potMin = prospectData?.potentialMin || (player.potential ? player.potential - 4 : 85);
                const potMax = prospectData?.potentialMax || player.potential || 90;
                const tier = prospectData?.potentialTier || 'great';
                const tierInfo = getPotentialBadge(tier);

                return (
                  <div
                    key={player.id}
                    className="bg-slate-950/90 border border-teal-500/30 hover:border-teal-400 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${tierInfo.badgeClass}`}>
                          {tierInfo.title}
                        </div>
                        <span className="text-[10px] font-mono text-teal-300">
                          {player.position}
                        </span>
                      </div>

                      <div className="flex items-start gap-4 mb-3">
                        <PlayerFaceCard
                          player={player}
                          team={userTeam}
                          size="sm"
                          showDetails={false}
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase truncate">
                            {player.name}
                          </h4>
                          <div className="text-xs text-white/60 font-mono">
                            OVR: <strong className="text-white">{player.rating}</strong> • POT: <strong className="text-teal-300">{potMin}-{potMax}</strong>
                          </div>

                          <div className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] font-mono space-y-1">
                            <div className="flex justify-between text-white/60">
                              <span>Growth Ceiling:</span>
                              <span className="text-emerald-400 font-bold">+{potMax - player.rating} pts</span>
                            </div>
                            <div className="flex justify-between text-white/60">
                              <span>Academy Status:</span>
                              <span className="text-teal-300">Enrolled & Developing</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900/60 rounded-xl border border-white/5 text-center font-mono text-[9px] mb-3">
                        <div>
                          <div className="text-white/40">PAC</div>
                          <div className="font-bold text-white">{player.stats.pace}</div>
                        </div>
                        <div>
                          <div className="text-white/40">SHO</div>
                          <div className="font-bold text-white">{player.stats.shooting}</div>
                        </div>
                        <div>
                          <div className="text-white/40">PAS</div>
                          <div className="font-bold text-white">{player.stats.passing}</div>
                        </div>
                        <div>
                          <div className="text-white/40">DRI</div>
                          <div className="font-bold text-white">{player.stats.dribbling}</div>
                        </div>
                        <div>
                          <div className="text-white/40">DEF</div>
                          <div className="font-bold text-white">{player.stats.defending}</div>
                        </div>
                        <div>
                          <div className="text-white/40">PHY</div>
                          <div className="font-bold text-white">{player.stats.physicality}</div>
                        </div>
                      </div>
                    </div>

                    {/* Academy Actions */}
                    <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const prospectObj: ScoutedProspect = prospectData || {
                            ...player,
                            age: 17,
                            nationality: userTeam.country,
                            flag: '🌐',
                            region: 'western_europe',
                            potentialMin: potMin,
                            potentialMax: potMax,
                            potentialTier: tier,
                            weakFoot: 4,
                            skillMoves: 4,
                            workRate: 'High/Med',
                            scoutComment: 'Academy graduate ready for first-team introduction.',
                            scoutedAtMatchday: career.currentMatchday,
                            scoutId: 'scout_internal',
                            scoutName: 'Academy Director',
                            status: 'signed_to_academy',
                          };
                          handlePromoteProspect(prospectObj);
                        }}
                        className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Promote to Senior</span>
                      </button>

                      {onOpenDevelopment && (
                        <button
                          onClick={() => onOpenDevelopment(player)}
                          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-['Chakra_Petch'] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                          title="Open Training Drills"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Train</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleReleaseProspect(player.id)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-white/40 hover:text-rose-400 border border-white/5 transition cursor-pointer"
                        title="Release"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: SCOUTING STAFF DIRECTORY (HIRE & MANAGE CHIEF SCOUTS)
      ========================================================================= */}
      {subTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-5">
            <h3 className="font-['Chakra_Petch'] font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              CLUB SCOUTING STAFF & TALENT DIRECTORS
            </h3>
            <p className="text-xs text-white/60 font-['Outfit'] mt-0.5">
              Hire world-class talent evaluators. 5★ Experience scouts unearth higher volume of prodigies; 5★ Judgement scouts pinpoint potential ranges with surgical accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {network.scouts.map((scout) => (
              <div
                key={scout.id}
                className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between transition ${
                  scout.hired
                    ? 'bg-slate-950/80 border-cyan-500/40'
                    : 'bg-slate-950/50 border-white/10 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{scout.flag}</span>
                      <h4 className="font-['Chakra_Petch'] font-black text-base text-white uppercase">
                        {scout.name}
                      </h4>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-['Chakra_Petch'] font-bold uppercase tracking-wider ${
                      scout.hired
                        ? scout.status === 'scouting'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-white/5 text-white/50 border border-white/10'
                    }`}>
                      {scout.hired ? (scout.status === 'scouting' ? 'In Field' : 'Available') : 'Free Agent'}
                    </span>
                  </div>

                  <p className="text-xs text-cyan-300/90 font-['Outfit'] mb-3">
                    {scout.specialty}
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-2xl border border-white/5 mb-4">
                    <div>
                      <div className="text-[10px] text-white/50 uppercase font-mono">Experience:</div>
                      <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < scout.experience ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                        <span className="text-xs font-mono font-bold text-white ml-1.5">{scout.experience}/5</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-white/50 uppercase font-mono">Judgement:</div>
                      <div className="flex items-center gap-0.5 text-cyan-400 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < scout.judgement ? 'fill-cyan-400 text-cyan-400' : 'text-slate-700'}`}
                          />
                        ))}
                        <span className="text-xs font-mono font-bold text-white ml-1.5">{scout.judgement}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs font-mono text-white/60">
                    {scout.hired ? (
                      <span>Weekly Wage: <strong className="text-white">€{scout.wage}K/wk</strong></span>
                    ) : (
                      <span>Hiring Fee: <strong className="text-cyan-300">€{scout.hiringCost}M</strong></span>
                    )}
                  </div>

                  {scout.hired ? (
                    <span className="text-xs text-emerald-400 font-['Chakra_Petch'] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> On Club Staff
                    </span>
                  ) : (
                    <button
                      onClick={() => handleHireScout(scout.id)}
                      disabled={career.budget < scout.hiringCost}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-['Chakra_Petch'] font-black text-xs uppercase tracking-wider transition shadow cursor-pointer disabled:cursor-not-allowed"
                    >
                      Hire Scout (€{scout.hiringCost}M)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
