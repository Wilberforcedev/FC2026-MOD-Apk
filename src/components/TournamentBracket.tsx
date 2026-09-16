import React from 'react';
import { TournamentMatch, Team } from '../types/soccer';
import { Trophy, ChevronLeft, Play, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FCHeaderBar } from './FCHeaderBar';

interface TournamentBracketProps {
  userTeam: Team;
  matches: TournamentMatch[];
  currentRound: 'quarter' | 'semi' | 'final' | 'champion';
  championTeam?: Team;
  onPlayMatch: (match: TournamentMatch) => void;
  onResetTournament: () => void;
  onBack: () => void;
  onOpenInbox?: () => void;
  onOpenSocial?: () => void;
  onOpenSettings?: () => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  userTeam,
  matches,
  currentRound,
  championTeam,
  onPlayMatch,
  onResetTournament,
  onBack,
  onOpenInbox,
  onOpenSocial,
  onOpenSettings,
}) => {
  const quarters = matches.filter(m => m.round === 'quarter');
  const semis = matches.filter(m => m.round === 'semi');
  const finalMatch = matches.find(m => m.round === 'final');

  const nextPlayableMatch = matches.find(m => m.isPlayerMatch && !m.isCompleted);

  const isUserChampion = championTeam?.id === userTeam.id;

  React.useEffect(() => {
    if (isUserChampion) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#00f0ff', '#00e6a8', '#ffd700', '#38bdf8', '#ffffff'],
      });
    }
  }, [isUserChampion]);

  return (
    <div className="h-full flex flex-col bg-[#070e17] text-white overflow-hidden select-none relative font-['Outfit']">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* FC Header Bar */}
      <FCHeaderBar
        onOpenInbox={onOpenInbox}
        onOpenSocial={onOpenSocial}
        onOpenSettings={onOpenSettings}
        showTabs={false}
      />

      {/* Mode Sub-Header */}
      <div className="h-16 px-4 md:px-8 bg-slate-950/80 border-b border-cyan-900/30 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 flex items-center justify-center transition shadow"
            title="Main Menu"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl md:text-2xl font-black font-['Chakra_Petch'] tracking-wide text-white uppercase">
                CHAMPIONS KNOCKOUT CUP
              </h1>
            </div>
            <p className="text-[11px] text-white/50">Knockout Tournament — Win 3 matches to lift the trophy!</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {nextPlayableMatch && (
            <button
              onClick={() => onPlayMatch(nextPlayableMatch)}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-['Chakra_Petch'] font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition scale-105"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              PLAY {nextPlayableMatch.roundName.toUpperCase()}
            </button>
          )}

          <button
            onClick={onResetTournament}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-['Chakra_Petch'] font-bold uppercase tracking-wider transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Bracket
          </button>
        </div>
      </div>

      {/* Main Bracket Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full flex flex-col justify-center">
        {/* Champion Podium Banner if Complete */}
        {championTeam && (
          <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-teal-500/20 border-2 border-amber-400/50 text-center flex flex-col items-center shadow-2xl">
            <Trophy className="w-14 h-14 text-amber-400 animate-bounce" />
            <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest mt-2">
              TOURNAMENT CHAMPIONS
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-['Chakra_Petch'] text-white mt-1 flex items-center gap-3">
              <span>{championTeam.badgeIcon}</span>
              <span>{championTeam.name.toUpperCase()}</span>
            </h2>
            <p className="text-sm text-cyan-300 font-bold mt-2 font-mono">
              {isUserChampion ? '🏆 Incredible! You conquered the European Champions Cup!' : `${championTeam.name} lifted the trophy.`}
            </p>
          </div>
        )}

        {/* Visual Tournament Bracket Tree */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Quarter-Finals (4 Matches) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-cyan-400 font-['Chakra_Petch'] uppercase tracking-wider text-center">
              QUARTER-FINALS
            </div>
            {quarters.map(match => (
              <BracketCard key={match.id} match={match} userTeam={userTeam} />
            ))}
          </div>

          {/* Semi-Finals (2 Matches) */}
          <div className="space-y-8">
            <div className="text-xs font-bold text-teal-400 font-['Chakra_Petch'] uppercase tracking-wider text-center">
              SEMI-FINALS
            </div>
            {semis.map(match => (
              <BracketCard key={match.id} match={match} userTeam={userTeam} />
            ))}
          </div>

          {/* Grand Final (1 Match) */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-amber-400 font-['Chakra_Petch'] uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              GRAND FINAL
            </div>
            {finalMatch && (
              <BracketCard match={finalMatch} userTeam={userTeam} isFinal />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BracketCard: React.FC<{ match: TournamentMatch; userTeam: Team; isFinal?: boolean }> = ({ match, userTeam, isFinal }) => {
  const isUserInvolved = match.isPlayerMatch;
  const isPlayable = isUserInvolved && !match.isCompleted;

  return (
    <div
      className={`rounded-2xl p-3.5 border transition relative ${
        isPlayable
          ? 'bg-gradient-to-r from-cyan-950/60 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/40'
          : isFinal
          ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40 shadow-xl'
          : match.isCompleted
          ? 'bg-slate-950/80 border-cyan-900/40'
          : 'bg-slate-950/60 border-white/5 opacity-80'
      }`}
    >
      {/* Top Team */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          {match.homeTeam ? (
            <>
              <span className="text-base">{match.homeTeam.badgeIcon}</span>
              <span className={`text-xs font-['Chakra_Petch'] font-bold ${match.winner?.id === match.homeTeam.id ? 'text-cyan-300 font-black' : 'text-white/80'}`}>
                {match.homeTeam.shortName}
              </span>
              {match.homeTeam.id === userTeam.id && (
                <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-1 rounded">YOU</span>
              )}
            </>
          ) : (
            <span className="text-xs text-white/30 italic">TBD</span>
          )}
        </div>
        {match.isCompleted && (
          <span className="font-mono font-black text-sm text-cyan-300">{match.homeScore}</span>
        )}
      </div>

      <div className="border-t border-white/10 my-1" />

      {/* Bottom Team */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          {match.awayTeam ? (
            <>
              <span className="text-base">{match.awayTeam.badgeIcon}</span>
              <span className={`text-xs font-['Chakra_Petch'] font-bold ${match.winner?.id === match.awayTeam.id ? 'text-cyan-300 font-black' : 'text-white/80'}`}>
                {match.awayTeam.shortName}
              </span>
              {match.awayTeam.id === userTeam.id && (
                <span className="text-[9px] bg-cyan-500 text-slate-950 font-black px-1 rounded">YOU</span>
              )}
            </>
          ) : (
            <span className="text-xs text-white/30 italic">TBD</span>
          )}
        </div>
        {match.isCompleted && (
          <span className="font-mono font-black text-sm text-cyan-300">{match.awayScore}</span>
        )}
      </div>
    </div>
  );
};
