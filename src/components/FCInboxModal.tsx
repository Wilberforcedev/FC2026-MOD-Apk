/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Check,
  MessageSquare,
  Flame,
  Search,
  Filter,
  ArrowRight,
  Heart,
  Repeat,
  Share2,
  AlertTriangle,
  Activity,
  UserCheck,
  TrendingUp,
  Clock,
  Radio,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import { CareerState, CareerNewsItem, NewsCategory, PlayerInjury } from '../types/soccer';
import { TEAMS } from '../data/teams';
import { ClubEmblem } from './ClubEmblem';
import { getInitialNewsFeed } from '../services/careerNewsService';

interface FCInboxModalProps {
  isOpen: boolean;
  initialTab?: 'inbox' | 'news' | 'social';
  career?: CareerState;
  onUpdateCareer?: (updated: CareerState) => void;
  onClose: () => void;
}

interface MailItem {
  id: string;
  sender: string;
  subject: string;
  date: string;
  preview: string;
  fullBody: string;
  isRead: boolean;
  tag: 'BOARD' | 'TRANSFER' | 'SCOUT' | 'PHYSIO';
}

interface SocialPost {
  id: string;
  author: string;
  handle: string;
  verified: boolean;
  avatarText: string;
  timeAgo: string;
  content: string;
  likes: string;
  retweets: string;
  badge?: string;
}

export const FCInboxModal: React.FC<FCInboxModalProps> = ({
  isOpen,
  initialTab = 'news',
  career,
  onUpdateCareer,
  onClose,
}) => {
  // Map 'social' to 'news' if user opened to view season news feed
  const [activeTab, setActiveTab] = useState<'news' | 'inbox' | 'social'>(() => {
    if (initialTab === 'social' || initialTab === 'news') return 'news';
    return 'inbox';
  });

  // News Filtering & Selection state
  const [selectedNewsId, setSelectedNewsId] = useState<string>('');
  const [newsFilter, setNewsFilter] = useState<'ALL' | 'TRANSFER' | 'INJURY' | 'RECOVERY' | 'RUMOR'>('ALL');
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Mail state
  const [selectedMailId, setSelectedMailId] = useState<string>('m1');
  const [mails, setMails] = useState<MailItem[]>([
    {
      id: 'm1',
      sender: 'Club Chairman (Board of Directors)',
      subject: 'Season Objectives & Champions Cup Ambitions',
      date: 'Today, 09:30',
      preview: 'The board has set our strategic objectives for the ongoing campaign...',
      fullBody:
        'Manager, we expect high pressing, clinical finishing, and qualification for the Champions Cup knockouts. You have full backing in the transfer market to sign world-class talent. Ensure squad morale and player stamina remain high.',
      isRead: false,
      tag: 'BOARD',
    },
    {
      id: 'm2',
      sender: 'Chief Scout (European Scouting Network)',
      subject: 'Scouting Intelligence: Star Wonderkids Identified',
      date: 'Yesterday, 18:15',
      preview: 'Our scouts have filed dossiers on top forwards with Speed Dribbler traits...',
      fullBody:
        'We have finalized scouting reports on high-pace wingers and clinical number 9s. Mbappé, Bellingham, and Vinícius Jr. represent the pinnacle of modern playstyles. Review their market value in the Transfer Market hub and submit bids before the deadline.',
      isRead: true,
      tag: 'SCOUT',
    },
    {
      id: 'm3',
      sender: 'Head of Sports Science',
      subject: 'Match Day Stamina & Recovery Update',
      date: 'Sep 14, 11:20',
      preview: 'Dynamic stamina tracking is now live during matchday simulations...',
      fullBody:
        'Our dynamic stamina monitor now displays real-time aerobic capacity in the Broadcast HUD. Sidelined players undergo specialized physical conditioning. Track the Injury Report in the News Feed to anticipate player returns.',
      isRead: true,
      tag: 'PHYSIO',
    },
  ]);

  // Social Posts
  const socialPosts: SocialPost[] = [
    {
      id: 's1',
      author: 'Fabrizio Romano',
      handle: '@FabrizioRomano',
      verified: true,
      avatarText: 'FR',
      timeAgo: '12m',
      content:
        '🚨 HERE WE GO! Major contract talks progressing in Career Mode. Clubs are preparing formal bids in the Transfer Market. The title race is set for incredible drama! ⚽🔥 #FC26',
      likes: '48.2K',
      retweets: '11.5K',
      badge: 'TRANSFER NEWS',
    },
    {
      id: 's2',
      author: 'EA SPORTS FC',
      handle: '@EASPORTSFC',
      verified: true,
      avatarText: 'FC',
      timeAgo: '1h',
      content:
        'New PlayStyle+ active: Speed Dribbler, Finesse Shot & Power Header giving players an unstoppable edge on the pitch. Who is leading your squad to glory today? 🏆',
      likes: '92.1K',
      retweets: '24.8K',
      badge: 'OFFICIAL',
    },
    {
      id: 's3',
      author: 'Sky Sports Football',
      handle: '@SkyFootball',
      verified: true,
      avatarText: 'SS',
      timeAgo: '3h',
      content:
        'Sensational technique shown from outside the box this matchday! The swerve physics and curling free kicks in the Practice Arena are breathtaking. 🎯⚽',
      likes: '34.6K',
      retweets: '6.2K',
    },
  ];

  // Resolve news feed from career state or initial fallback
  const newsFeed: CareerNewsItem[] = useMemo(() => {
    if (career?.newsFeed && career.newsFeed.length > 0) {
      return career.newsFeed;
    }
    const fallback = getInitialNewsFeed(career?.userTeamId || 'madrid');
    return fallback.news;
  }, [career?.newsFeed, career?.userTeamId]);

  // Active injuries across league
  const activeInjuries: PlayerInjury[] = useMemo(() => {
    if (career?.activeInjuries) {
      return career.activeInjuries;
    }
    const fallback = getInitialNewsFeed(career?.userTeamId || 'madrid');
    return fallback.injuries;
  }, [career?.activeInjuries, career?.userTeamId]);

  // Filtered news items
  const filteredNews = useMemo(() => {
    return newsFeed.filter((item) => {
      const matchesCategory =
        newsFilter === 'ALL' || item.category === newsFilter;
      const matchesSearch =
        !newsSearch.trim() ||
        item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
        item.summary.toLowerCase().includes(newsSearch.toLowerCase()) ||
        (item.playerName && item.playerName.toLowerCase().includes(newsSearch.toLowerCase())) ||
        (item.author && item.author.toLowerCase().includes(newsSearch.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [newsFeed, newsFilter, newsSearch]);

  // Selected news item
  const selectedNews = useMemo(() => {
    if (selectedNewsId) {
      const found = filteredNews.find((n) => n.id === selectedNewsId);
      if (found) return found;
    }
    return filteredNews[0] || newsFeed[0];
  }, [selectedNewsId, filteredNews, newsFeed]);

  if (!isOpen) return null;

  const selectedMail = mails.find((m) => m.id === selectedMailId) || mails[0];

  const markMailAsRead = (id: string) => {
    setMails((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );
  };

  const handleSelectNews = (item: CareerNewsItem) => {
    setSelectedNewsId(item.id);
    if (!item.isRead && career && onUpdateCareer) {
      const updatedNews = (career.newsFeed || newsFeed).map((n) =>
        n.id === item.id ? { ...n, isRead: true } : n
      );
      onUpdateCareer({
        ...career,
        newsFeed: updatedNews,
      });
    }
  };

  const handleShareStory = (story: CareerNewsItem) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${story.title} - Reported by ${story.author} (#FC26)`);
    }
    setCopiedNotification(`Copied to clipboard: "${story.title}"`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Helper to get team display info
  const getTeamInfo = (teamId?: string) => {
    if (!teamId) return null;
    return TEAMS.find((t) => t.id === teamId) || null;
  };

  const unreadNewsCount = newsFeed.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none animate-fadeIn font-['Outfit']">
      <div className="w-full max-w-5xl h-[680px] bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden relative">
        
        {/* Toast alert for copy */}
        {copiedNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-cyan-950 border border-cyan-400 text-cyan-200 px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-bounce">
            {copiedNotification}
          </div>
        )}

        {/* Modal Header Bar */}
        <div className="px-5 md:px-7 py-3.5 bg-slate-900/90 border-b border-cyan-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              {activeTab === 'news' ? (
                <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
              ) : activeTab === 'inbox' ? (
                <Mail className="w-5 h-5 text-cyan-300" />
              ) : (
                <MessageSquare className="w-5 h-5 text-cyan-300" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                {/* TAB 1: DYNAMIC NEWS FEED */}
                <button
                  id="tab-news-feed"
                  onClick={() => setActiveTab('news')}
                  className={`font-['Chakra_Petch'] font-black text-xs md:text-sm tracking-wider uppercase transition flex items-center gap-1.5 ${
                    activeTab === 'news'
                      ? 'text-cyan-300 border-b-2 border-cyan-400 pb-0.5'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span>DYNAMIC NEWS FEED</span>
                  {unreadNewsCount > 0 && (
                    <span className="text-[10px] bg-cyan-400 text-slate-950 font-mono font-black px-1.5 py-0.2 rounded-full">
                      {unreadNewsCount}
                    </span>
                  )}
                </button>

                <span className="text-white/20">|</span>

                {/* TAB 2: CLUB INBOX */}
                <button
                  id="tab-club-inbox"
                  onClick={() => setActiveTab('inbox')}
                  className={`font-['Chakra_Petch'] font-black text-xs md:text-sm tracking-wider uppercase transition flex items-center gap-1.5 ${
                    activeTab === 'inbox'
                      ? 'text-cyan-300 border-b-2 border-cyan-400 pb-0.5'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <span>CLUB INBOX</span>
                  <span className="text-[10px] bg-slate-800 text-white/60 font-mono font-bold px-1.5 py-0.2 rounded-full">
                    {mails.filter((m) => !m.isRead).length}
                  </span>
                </button>

                <span className="text-white/20">|</span>

                {/* TAB 3: SOCIAL BUZZ */}
                <button
                  id="tab-social-buzz"
                  onClick={() => setActiveTab('social')}
                  className={`font-['Chakra_Petch'] font-black text-xs md:text-sm tracking-wider uppercase transition ${
                    activeTab === 'social'
                      ? 'text-cyan-300 border-b-2 border-cyan-400 pb-0.5'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  SOCIAL BUZZ
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {career && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-900 border border-cyan-500/30 text-cyan-300 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                SEASON 2026 • MATCHDAY {career.currentMatchday}/{career.totalMatchdays}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 hover:bg-slate-700 text-white/70 hover:text-white flex items-center justify-center transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            VIEW 1: DYNAMIC NEWS FEED (Transfers, Injuries, Recoveries & Rumors)
        ========================================================================= */}
        {activeTab === 'news' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60">
            {/* Top Toolbar: Filter Chips, Search, and Active Injury Ticker */}
            <div className="p-3 md:px-5 bg-slate-900/70 border-b border-cyan-900/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {(['ALL', 'TRANSFER', 'INJURY', 'RECOVERY', 'RUMOR'] as const).map((cat) => {
                  const isActive = newsFilter === cat;
                  const labelMap = {
                    ALL: `ALL REPORTS (${newsFeed.length})`,
                    TRANSFER: 'TRANSFERS 🪙',
                    INJURY: 'INJURIES ⚠️',
                    RECOVERY: 'RECOVERIES 🩺',
                    RUMOR: 'RUMORS 🔥',
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => setNewsFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-['Chakra_Petch'] font-black uppercase tracking-wider transition whitespace-nowrap ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900 border border-white/10 text-white/60 hover:text-white hover:border-cyan-500/30'
                      }`}
                    >
                      {labelMap[cat]}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player, club, injury..."
                  value={newsSearch}
                  onChange={(e) => setNewsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* League Physio Room Strip: Active injuries banner */}
            {activeInjuries.length > 0 && (
              <div className="bg-rose-950/20 border-b border-rose-500/20 px-5 py-2 flex items-center gap-3 overflow-x-auto scrollbar-none shrink-0">
                <div className="flex items-center gap-1.5 text-rose-400 font-['Chakra_Petch'] font-black text-xs shrink-0">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>LEAGUE PHYSIO ROOM:</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  {activeInjuries.map((inj) => {
                    const team = getTeamInfo(inj.teamId);
                    return (
                      <div
                        key={inj.id}
                        className="flex items-center gap-1.5 bg-slate-900/80 border border-rose-500/30 px-2.5 py-0.5 rounded-lg shrink-0"
                      >
                        <ClubEmblem teamId={inj.teamId} size="xs" />
                        <span className="text-white font-bold">{inj.playerName}</span>
                        <span className="text-white/40">({team?.shortName || 'FC'})</span>
                        <span className="text-rose-300 font-bold">• {inj.injuryName}</span>
                        <span className="text-amber-400 font-black">[{inj.weeksRemaining}w remaining]</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Content Area: Split 2-Column News Layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Left Column: News Bulletin List (5 Cols) */}
              <div className="md:col-span-5 border-r border-cyan-900/30 overflow-y-auto p-3 space-y-2 bg-slate-950/70">
                {filteredNews.length === 0 ? (
                  <div className="p-8 text-center text-white/40 text-xs font-mono">
                    No reports found matching criteria.
                  </div>
                ) : (
                  filteredNews.map((item) => {
                    const isSelected = selectedNews?.id === item.id;
                    const primaryTeam = getTeamInfo(item.teamId);
                    const secondaryTeam = getTeamInfo(item.secondaryTeamId);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectNews(item)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400/90 shadow-[0_0_18px_rgba(6,182,212,0.2)]'
                            : 'bg-slate-900/70 border-white/5 hover:border-cyan-500/40 hover:bg-slate-900'
                        }`}
                      >
                        {/* Unread dot */}
                        {!item.isRead && (
                          <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}

                        {/* Top Category & Tag Bar */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {item.category === 'TRANSFER' && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded font-mono font-bold">
                              TRANSFER DEAL
                            </span>
                          )}
                          {item.category === 'INJURY' && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              INJURY REPORT
                            </span>
                          )}
                          {item.category === 'RECOVERY' && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5" />
                              CLEARED FIT
                            </span>
                          )}
                          {item.category === 'RUMOR' && (
                            <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" />
                              DEADLINE RUMOR
                            </span>
                          )}

                          <span className="text-[10px] text-white/40 font-mono">{item.date}</span>
                        </div>

                        {/* Title & Emblems */}
                        <div className="flex items-start gap-2.5">
                          <div className="flex items-center gap-1 mt-0.5 shrink-0">
                            {primaryTeam && (
                              <ClubEmblem teamId={primaryTeam.id} size="sm" />
                            )}
                            {secondaryTeam && (
                              <>
                                <ArrowRight className="w-3 h-3 text-cyan-400/80" />
                                <ClubEmblem teamId={secondaryTeam.id} size="sm" />
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white leading-snug line-clamp-2 font-['Outfit']">
                              {item.title}
                            </h4>
                          </div>
                        </div>

                        {/* Bottom Highlight Pills */}
                        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1 text-white/60">
                            <span>{item.author}</span>
                            {item.verified && <span className="text-cyan-400 font-bold">✓</span>}
                          </div>

                          {/* Stat Pill */}
                          {item.transferFee && (
                            <span className="text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              €{item.transferFee}M FEE
                            </span>
                          )}
                          {item.recoveryWeeks && (
                            <span className="text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              {item.recoveryWeeks} WEEKS OUT
                            </span>
                          )}
                          {item.category === 'RECOVERY' && (
                            <span className="text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              SQUAD RETURN
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Interactive News Dossier / Detail View (7 Cols) */}
              <div className="md:col-span-7 p-5 md:p-6 flex flex-col justify-between bg-slate-900/40 overflow-y-auto">
                {selectedNews ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {selectedNews.category} BULLETIN
                          </span>
                          <span className="text-xs text-white/40 font-mono">{selectedNews.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShareStory(selectedNews)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white/60 hover:text-white transition"
                            title="Copy story link / headline"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h2 className="font-['Chakra_Petch'] font-black text-xl md:text-2xl text-white mt-2 leading-tight">
                        {selectedNews.title}
                      </h2>

                      {/* Author Bar */}
                      <div className="flex items-center gap-2.5 mt-3 pb-3 border-b border-white/10">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xs font-['Chakra_Petch']">
                          {selectedNews.avatarText || 'FC'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <span>{selectedNews.author}</span>
                            {selectedNews.verified && (
                              <span className="text-cyan-400 text-[11px]">✓</span>
                            )}
                            <span className="text-white/40 font-mono font-normal">
                              {selectedNews.handle || '@fc26_press'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FEATURE GRAPHIC CARD: Transfer Showcase or Physio Diagnosis Card */}
                    {selectedNews.category === 'TRANSFER' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                          {/* Club transfer path */}
                          <div className="flex items-center gap-3">
                            {selectedNews.secondaryTeamId && (
                              <div className="flex flex-col items-center">
                                <ClubEmblem teamId={selectedNews.secondaryTeamId} size="lg" />
                                <span className="text-[10px] text-white/60 font-mono mt-1">
                                  {getTeamInfo(selectedNews.secondaryTeamId)?.name || 'SELLER'}
                                </span>
                              </div>
                            )}

                            {selectedNews.secondaryTeamId && selectedNews.teamId && (
                              <ArrowRight className="w-6 h-6 text-amber-400 animate-pulse" />
                            )}

                            {selectedNews.teamId && (
                              <div className="flex flex-col items-center">
                                <ClubEmblem teamId={selectedNews.teamId} size="lg" glow />
                                <span className="text-[10px] text-cyan-300 font-mono font-bold mt-1">
                                  {getTeamInfo(selectedNews.teamId)?.name || 'BUYER'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Player and Fee */}
                          <div className="text-right">
                            {selectedNews.playerName && (
                              <div>
                                <span className="text-sm font-black font-['Chakra_Petch'] text-white uppercase block">
                                  {selectedNews.playerName}
                                </span>
                                <span className="text-[10px] text-white/60 font-mono">
                                  POSITION: {selectedNews.playerPosition || 'FWD'} • RATING: {selectedNews.playerRating || 88}
                                </span>
                              </div>
                            )}
                            {selectedNews.transferFee && (
                              <div className="mt-2 inline-block px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-['Chakra_Petch'] font-black text-sm">
                                €{selectedNews.transferFee}.0M TRANSFER FEE
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNews.category === 'INJURY' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-rose-950/20 to-slate-950 border border-rose-500/30 relative overflow-hidden shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedNews.teamId && (
                              <ClubEmblem teamId={selectedNews.teamId} size="lg" />
                            )}
                            <div>
                              <span className="text-xs text-rose-400 font-mono font-bold uppercase block">
                                MEDICAL CLINICAL ASSESSMENT
                              </span>
                              <h4 className="text-base font-black font-['Chakra_Petch'] text-white">
                                {selectedNews.playerName || 'Squad Member'}
                              </h4>
                              <p className="text-xs text-white/70 font-mono mt-0.5">
                                Diagnosis: <strong className="text-rose-300">{selectedNews.injuryType || 'Soft Tissue Strain'}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-white/50 uppercase font-mono block">
                              ESTIMATED RECOVERY
                            </span>
                            <span className="text-xl font-black font-['Chakra_Petch'] text-amber-400">
                              ~{selectedNews.recoveryWeeks || 3} WEEKS
                            </span>
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 font-mono">
                          <span>Rehabilitation status: Physiotherapy in progress</span>
                          <span className="text-cyan-400">Matchday Return: MD {career ? career.currentMatchday + (selectedNews.recoveryWeeks || 2) : 3}</span>
                        </div>
                      </div>
                    )}

                    {selectedNews.category === 'RECOVERY' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border border-emerald-500/30 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                            <UserCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs text-emerald-400 font-mono font-bold uppercase block">
                              PHYSICAL DISCHARGE CERTIFICATE
                            </span>
                            <h4 className="text-base font-black font-['Chakra_Petch'] text-white">
                              {selectedNews.playerName} Cleared
                            </h4>
                            <p className="text-xs text-white/60">Passed all high-intensity stamina & joint agility testing.</p>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-['Chakra_Petch'] font-black text-xs uppercase">
                          READY FOR MATCHDAY
                        </span>
                      </div>
                    )}

                    {/* Article Summary & Body */}
                    <div className="space-y-3 text-sm text-white/80 leading-relaxed">
                      <p className="font-semibold text-white/95">{selectedNews.summary}</p>
                      <p className="text-white/75">{selectedNews.fullBody}</p>
                    </div>

                    {/* Social engagement footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1 hover:text-rose-400 transition cursor-pointer">
                          <Heart className="w-3.5 h-3.5" /> {selectedNews.likes || '42.1K'}
                        </span>
                        <span className="flex items-center gap-1 hover:text-cyan-400 transition cursor-pointer">
                          <Repeat className="w-3.5 h-3.5" /> {selectedNews.retweets || '12.8K'}
                        </span>
                      </div>

                      <span className="text-[10px] text-white/40 italic">
                        Verified FC 26 Global Feed Source
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-white/40">Select a news report to view full dossier.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CLUB INBOX TAB (Board directives & Physio Mails)
        ========================================================================= */}
        {activeTab === 'inbox' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            {/* Left: Message List */}
            <div className="md:col-span-5 border-r border-cyan-900/30 overflow-y-auto p-3 space-y-2 bg-slate-950/70">
              {mails.map((mail) => {
                const isSelected = selectedMailId === mail.id;
                return (
                  <div
                    key={mail.id}
                    onClick={() => {
                      setSelectedMailId(mail.id);
                      markMailAsRead(mail.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-900/60 border-white/5 hover:border-cyan-500/30 hover:bg-slate-900'
                    }`}
                  >
                    {!mail.isRead && (
                      <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.2 rounded font-mono font-bold">
                        {mail.tag}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">{mail.date}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate">{mail.sender}</h4>
                    <p className="text-xs font-medium text-white/90 truncate mt-0.5">{mail.subject}</p>
                    <p className="text-[11px] text-white/50 line-clamp-1 mt-1">{mail.preview}</p>
                  </div>
                );
              })}
            </div>

            {/* Right: Message Details */}
            <div className="md:col-span-7 p-6 flex flex-col justify-between bg-slate-900/40 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {selectedMail.tag} NOTIFICATION
                    </span>
                    <h3 className="font-['Chakra_Petch'] font-black text-xl text-white mt-2">
                      {selectedMail.subject}
                    </h3>
                    <p className="text-xs text-white/60 mt-1">
                      From: <strong className="text-cyan-300">{selectedMail.sender}</strong>
                    </p>
                  </div>
                  <span className="text-xs text-white/40 font-mono">{selectedMail.date}</span>
                </div>

                <div className="mt-6 text-sm text-white/80 leading-relaxed font-['Outfit'] space-y-4">
                  <p>{selectedMail.fullBody}</p>
                  <p className="text-xs text-white/50 italic border-l-2 border-cyan-400 pl-3">
                    FC 2026 Board Confidential — Matchday preparations in effect.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  onClick={() => markMailAsRead(selectedMail.id)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold font-['Chakra_Petch'] uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  Acknowledge Directive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: SOCIAL BUZZ TAB
        ========================================================================= */}
        {activeTab === 'social' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/60">
            {socialPosts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-5 shadow-lg hover:border-cyan-400/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-slate-950 font-black font-['Chakra_Petch'] text-sm">
                      {post.avatarText}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{post.author}</span>
                        {post.verified && <span className="text-[11px] text-cyan-400">✓</span>}
                        <span className="text-xs text-white/40">{post.handle}</span>
                        <span className="text-xs text-white/30">• {post.timeAgo}</span>
                      </div>
                      {post.badge && (
                        <span className="text-[9px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                          {post.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/90 leading-relaxed font-['Outfit']">
                  {post.content}
                </p>

                <div className="mt-3 flex items-center gap-6 text-xs text-white/50 font-mono">
                  <span>❤️ {post.likes}</span>
                  <span>🔄 {post.retweets}</span>
                  <span>💬 Reply</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
