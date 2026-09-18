/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CareerNewsItem, PlayerInjury, Team, Player, CareerState } from '../types/soccer';
import { TEAMS } from '../data/teams';

export type { CareerNewsItem };

/**
 * Initial news feed at season start
 */
export function getInitialNewsFeed(userTeamId: string): { news: CareerNewsItem[]; injuries: PlayerInjury[] } {
  const userTeam = TEAMS.find(t => t.id === userTeamId) || TEAMS[0];

  const initialInjuries: PlayerInjury[] = [
    {
      id: 'inj_rodri',
      playerId: 'mc_rodri',
      playerName: 'Rodri',
      teamId: 'mancity',
      injuryName: 'Knee Ligament Hyperextension',
      weeksRemaining: 3,
      severity: 'Moderate',
    },
    {
      id: 'inj_vini',
      playerId: 'rm_vini',
      playerName: 'Vinícius Júnior',
      teamId: 'madrid',
      injuryName: 'Grade 2 Hamstring Strain',
      weeksRemaining: 2,
      severity: 'Moderate',
    },
    {
      id: 'inj_odegaard',
      playerId: 'ars_odegaard',
      playerName: 'Martin Ødegaard',
      teamId: 'arsenal',
      injuryName: 'Lateral Ankle Sprain',
      weeksRemaining: 2,
      severity: 'Minor',
    },
    {
      id: 'inj_de_jong',
      playerId: 'bar_dejong',
      playerName: 'Frenkie de Jong',
      teamId: 'barca',
      injuryName: 'Syndesmosis Ankle Knock',
      weeksRemaining: 1,
      severity: 'Minor',
    },
  ];

  const initialNews: CareerNewsItem[] = [
    {
      id: 'news_start_1',
      type: 'transfer',
      category: 'TRANSFER',
      importance: 'breaking',
      title: 'BREAKING: Manchester City Agree Record €115M Deal For Florian Wirtz',
      summary: 'Bayer Leverkusen playmaker Florian Wirtz is set for a blockbuster Premier League switch after personal terms were fully agreed.',
      fullBody: 'Manchester City have reached an agreement in principle with Bayer Leverkusen for the signature of German international Florian Wirtz in an astronomical €115M transfer package. Pep Guardiola identified Wirtz as the prime attacking midfield architect for the 2026/27 European campaign. Medical examinations have been scheduled in Manchester, with a five-year contract awaiting final ratification.',
      date: 'Pre-Season • 18:45',
      matchday: 1,
      author: 'Fabrizio Romano',
      handle: '@FabrizioRomano',
      verified: true,
      avatarText: 'FR',
      teamId: 'mancity',
      secondaryTeamId: 'bayern',
      playerName: 'Florian Wirtz',
      playerPosition: 'CAM',
      playerRating: 88,
      transferFee: 115,
      likes: '142.5K',
      retweets: '38.2K',
      isRead: false,
    },
    {
      id: 'news_start_2',
      type: 'injury',
      category: 'INJURY',
      importance: 'high',
      title: 'INJURY CRISIS: Rodri Ruled Out for 3 Weeks Following Knee Scans',
      summary: 'Reigning Ballon d\'Or holder Rodri has suffered a collateral ligament sprain during final tactical training.',
      fullBody: 'Manchester City medical department has officially confirmed that midfield anchor Rodri will be sidelined for up to 3 weeks following acute knee discomfort sustained in squad drills. MRI scans revealed moderate ligament inflammation without structural tear. Head physios will oversee intensive hydrotherapy to restore full match sharpness before Champions Cup fixtures.',
      date: 'Matchday 1 • 09:15',
      matchday: 1,
      author: 'David Ornstein',
      handle: '@David_Ornstein',
      verified: true,
      avatarText: 'DO',
      teamId: 'mancity',
      playerName: 'Rodri',
      playerPosition: 'CDM',
      playerRating: 91,
      injuryType: 'Knee Ligament Hyperextension',
      recoveryWeeks: 3,
      likes: '45.1K',
      retweets: '12.8K',
      isRead: false,
    },
    {
      id: 'news_start_3',
      type: 'injury',
      category: 'INJURY',
      importance: 'high',
      title: 'PHYSIO UPDATE: Vinícius Júnior Sidelined With Hamstring Strain',
      summary: 'Real Madrid medical staff deliver verdict on Brazilian winger after sprint test discomfort.',
      fullBody: 'Real Madrid Sanitas Medical Centre released an official statement confirming Vinícius Júnior has sustained a Grade 2 biceps femoris hamstring elongation. The dynamic forward is estimated to miss approximately two weeks of competitive action. Carlo Ancelotti indicated that Arda Güler and Rodrygo will rotate on the flank while the Brazilian recovers.',
      date: 'Matchday 1 • 11:30',
      matchday: 1,
      author: 'Club Medical Staff',
      handle: '@RealMadridMed',
      verified: true,
      avatarText: 'RM',
      teamId: 'madrid',
      playerName: 'Vinícius Júnior',
      playerPosition: 'LW',
      playerRating: 90,
      injuryType: 'Grade 2 Hamstring Strain',
      recoveryWeeks: 2,
      likes: '62.4K',
      retweets: '16.9K',
      isRead: false,
    },
    {
      id: 'news_start_4',
      type: 'transfer',
      category: 'TRANSFER',
      importance: 'high',
      title: 'DONE DEAL: Arsenal Confirm €75M Signing of Striker Viktor Gyökeres',
      summary: 'The Swedish powerhouse striker completes his medical in North London to finalize marquee frontline upgrade.',
      fullBody: 'Arsenal Football Club have formally announced the arrival of clinical marksman Viktor Gyökeres on a long-term contract from Sporting CP for a guaranteed €75M fee plus €10M in performance add-ons. Mikel Arteta lauded the 27-year-old\'s physical pressing, aerial prowess, and clinical finishing inside the box.',
      date: 'Pre-Season • 21:00',
      matchday: 1,
      author: 'Sky Sports Premier League',
      handle: '@SkySportsPL',
      verified: true,
      avatarText: 'SS',
      teamId: 'arsenal',
      secondaryTeamId: 'arsenal',
      playerName: 'Viktor Gyökeres',
      playerPosition: 'ST',
      playerRating: 87,
      transferFee: 75,
      likes: '89.7K',
      retweets: '22.3K',
      isRead: true,
    },
    {
      id: 'news_start_5',
      type: 'recovery',
      category: 'RECOVERY',
      importance: 'normal',
      title: 'FITNESS BOOST: Gavi Given Green Light to Return to Full Training',
      summary: 'Barcelona academy graduate successfully clears final stamina and joint mobility testing.',
      fullBody: 'Inspiring news from the Ciutat Esportiva Joan Gamper: midfield dynamo Gavi has been formally discharged by orthopedic specialists and rejoined Hansi Flick\'s first-team training squad with full contact clearance. The 21-year-old expressed boundless enthusiasm ahead of upcoming league fixtures.',
      date: 'Matchday 1 • 14:10',
      matchday: 1,
      author: 'FC Barcelona Media',
      handle: '@FCBarcelona',
      verified: true,
      avatarText: 'FCB',
      teamId: 'barca',
      playerName: 'Gavi',
      playerPosition: 'CM',
      playerRating: 85,
      likes: '110.2K',
      retweets: '31.4K',
      isRead: true,
    },
    {
      id: 'news_start_6',
      type: 'rumor',
      category: 'RUMOR',
      importance: 'normal',
      title: 'DEADLINE BUZZ: Paris Saint-Germain Prepare €120M Bid for Victor Osimhen',
      summary: 'Ligue 1 champions prepare late mega-swoop to bolster center-forward firepower.',
      fullBody: 'According to French and Italian media reports, Paris Saint-Germain have sanctioned a colossal €120M offer to secure Nigerian international striker Victor Osimhen. Contract terms spanning five years are being drafted by super-agents in Paris as the transfer deadline draws near.',
      date: 'Pre-Season • 23:15',
      matchday: 1,
      author: 'L\'Équipe Insider',
      handle: '@lequipe',
      verified: true,
      avatarText: 'LE',
      teamId: 'psg',
      playerName: 'Victor Osimhen',
      playerPosition: 'ST',
      playerRating: 88,
      transferFee: 120,
      likes: '54.0K',
      retweets: '14.1K',
      isRead: true,
    },
  ];

  return { news: initialNews, injuries: initialInjuries };
}

/**
 * Pool of realistic CPU-to-CPU transfers for dynamic simulation
 */
const DYNAMIC_TRANSFER_POOL = [
  {
    player: 'Theo Hernández',
    pos: 'LB',
    rating: 87,
    fromTeamId: 'inter',
    toTeamId: 'bayern',
    fee: 72,
    headline: 'Bayern Munich Complete €72M Deal For French Speedster Theo Hernández',
    body: 'Bundesliga titans Bayern Munich have reached agreement for dynamic left-back Theo Hernández. The French international completed medical tests in Munich and signed a contract through 2030, reinforcing Bayern\'s flank with electrifying pace and physical overlapping.',
  },
  {
    player: 'Rafael Leão',
    pos: 'LW',
    rating: 88,
    fromTeamId: 'inter',
    toTeamId: 'barca',
    fee: 92,
    headline: 'Barcelona Seal €92M Marquee Agreement For Portuguese Sensation Rafael Leão',
    body: 'In one of the most stunning European coups of the season, FC Barcelona have finalized terms for Portuguese winger Rafael Leão. Sporting director Deco praised Leão\'s world-class 1v1 dribbling and explosive finishing from outside the box.',
  },
  {
    player: 'Joshua Kimmich',
    pos: 'CDM',
    rating: 89,
    fromTeamId: 'bayern',
    toTeamId: 'mancity',
    fee: 68,
    headline: 'Manchester City Secure German Maestro Joshua Kimmich In €68M Transfer',
    body: 'Pep Guardiola has reunited with midfield tactician Joshua Kimmich in an audacious €68M deal. Kimmich brings pinpoint diagonal passing, defensive grit, and championship pedigree to City\'s tactical machine.',
  },
  {
    player: 'Lautaro Martínez',
    pos: 'ST',
    rating: 89,
    fromTeamId: 'inter',
    toTeamId: 'madrid',
    fee: 105,
    headline: 'Real Madrid Confirm €105M Arrival of Inter Captain Lautaro Martínez',
    body: 'Real Madrid president Florentino Pérez announced the high-profile acquisition of Argentine Copa América winner Lautaro Martínez. The clinical striker joins the European champions on a lucrative 4-year contract.',
  },
  {
    player: 'Nico Williams',
    pos: 'LW',
    rating: 86,
    fromTeamId: 'atletico',
    toTeamId: 'arsenal',
    fee: 65,
    headline: 'Arsenal Trigger €65M Release Clause For Speed Demon Nico Williams',
    body: 'Mikel Arteta\'s Arsenal have triggered the €65M buyout clause for Spain\'s Euro-winning winger Nico Williams. The electric winger will wear the number 11 shirt in North London after completing physical examinations.',
  },
  {
    player: 'Bruno Guimarães',
    pos: 'CM',
    rating: 87,
    fromTeamId: 'liverpool',
    toTeamId: 'mancity',
    fee: 85,
    headline: 'Manchester City Land Brazilian Engine Bruno Guimarães in €85M Move',
    body: 'Manchester City have bolstered their midfield engine room by capturing Brazilian midfielder Bruno Guimarães. The deal was finalized late evening following rapid negotiations.',
  },
  {
    player: 'Alphonso Davies',
    pos: 'LB',
    rating: 85,
    fromTeamId: 'bayern',
    toTeamId: 'madrid',
    fee: 55,
    headline: 'Real Madrid Finalize €55M Transfer For Canadian Jet Alphonso Davies',
    body: 'The speed merchant officially arrives at the Santiago Bernabéu! Real Madrid concluded negotiations with Bayern Munich for Alphonso Davies, who will inject unmatched recovery speed on the left side.',
  },
  {
    player: 'Alexander Isak',
    pos: 'ST',
    rating: 86,
    fromTeamId: 'liverpool',
    toTeamId: 'chelsea',
    fee: 88,
    headline: 'Chelsea Win Race For Premier League Striker Alexander Isak in €88M Swoop',
    body: 'Chelsea have confirmed the signing of Swedish international Alexander Isak. The tall, silky center-forward completed his medical at Cobham to spearhead the Blues\' attack.',
  },
];

/**
 * Pool of realistic player injuries across league clubs
 */
const DYNAMIC_INJURY_POOL: Array<{
  injuryName: string;
  weeks: number;
  severity: 'Minor' | 'Moderate' | 'Severe';
  diagnosis: string;
}> = [
  {
    injuryName: 'Acute Hamstring Strain',
    weeks: 2,
    severity: 'Minor',
    diagnosis: 'Suffered during maximum sprint acceleration in second-half transition. Ultrasound shows minor muscle fiber tear.',
  },
  {
    injuryName: 'Lateral Ankle Ligament Sprain',
    weeks: 3,
    severity: 'Moderate',
    diagnosis: 'Twisted ankle following a high-impact sliding tackle. Immobilized in a protective boot for initial 7 days.',
  },
  {
    injuryName: 'Knee Meniscus Irritation',
    weeks: 4,
    severity: 'Moderate',
    diagnosis: 'Discomfort and swelling triggered during sudden deceleration. Keyhole arthroscopic consultation recommends 4 weeks rest.',
  },
  {
    injuryName: 'Cruciate Ligament Micro-Tear',
    weeks: 6,
    severity: 'Severe',
    diagnosis: 'Severe knee twist sustained during contested aerial duel. Specialized knee brace applied with surgical consult.',
  },
  {
    injuryName: 'Groin Adductor Strain',
    weeks: 2,
    severity: 'Minor',
    diagnosis: 'Overstretched adductor tendon while taking a long-range curling strike. Cleared for light stationary cycling.',
  },
  {
    injuryName: 'Metatarsal Bone Bruise',
    weeks: 4,
    severity: 'Moderate',
    diagnosis: 'Direct impact collision to the foot during matchday set piece. Weight-bearing load strictly restricted.',
  },
  {
    injuryName: 'Severe Shoulder Acromioclavicular Sprain',
    weeks: 3,
    severity: 'Moderate',
    diagnosis: 'Awkward landing following an aerial duel. Arm sling fitted to prevent joint dislocation.',
  },
  {
    injuryName: 'Soleus Calf Muscle Tear',
    weeks: 3,
    severity: 'Moderate',
    diagnosis: 'Felt sudden sharp tightness during late-game press. Rehabilitation progressing under sports science oversight.',
  },
];

/**
 * Generates matchday news updates: decrements injuries, recovers players, adds transfers & new injuries
 */
export function generateMatchdayNews(
  career: CareerState,
  matchday: number
): { newNews: CareerNewsItem[]; updatedInjuries: PlayerInjury[] } {
  const currentInjuries = career.activeInjuries || [];
  const updatedInjuries: PlayerInjury[] = [];
  const newNews: CareerNewsItem[] = [];

  // 1. Progress active injuries
  for (const inj of currentInjuries) {
    const remaining = inj.weeksRemaining - 1;
    if (remaining <= 0) {
      // Player has recovered!
      newNews.push({
        id: `news_rec_${inj.id}_md${matchday}`,
        type: 'recovery',
        category: 'RECOVERY',
        importance: 'normal',
        title: `FITNESS CLEARANCE: ${inj.playerName} Returns to Full Team Training!`,
        summary: `${inj.playerName} has fully completed rehabilitation for ${inj.injuryName} and is certified fit for match selection.`,
        fullBody: `Excellent news from the medical facility: ${inj.playerName} underwent comprehensive biomechanical and stamina testing this morning, passing all tests with flying colors. The medical team has discharged the player from the treatment table, making them available for the upcoming Matchday ${matchday + 1} tactical setup.`,
        date: `Matchday ${matchday} • 08:30`,
        matchday,
        author: 'Chief Medical Officer',
        handle: '@PhysioRoomFC',
        verified: true,
        avatarText: 'MED',
        teamId: inj.teamId,
        playerName: inj.playerName,
        likes: `${(Math.random() * 20 + 20).toFixed(1)}K`,
        retweets: `${(Math.random() * 5 + 4).toFixed(1)}K`,
        isRead: false,
      });
    } else {
      updatedInjuries.push({
        ...inj,
        weeksRemaining: remaining,
      });
    }
  }

  // 2. Generate 1 dynamic League Transfer on select matchdays
  const transferIdx = (matchday - 1) % DYNAMIC_TRANSFER_POOL.length;
  const transferTemplate = DYNAMIC_TRANSFER_POOL[transferIdx];

  // Don't duplicate if buyer is userTeam (user handles their own signings)
  const isUserBuying = transferTemplate.toTeamId === career.userTeamId;
  const actualToTeam = isUserBuying ? 'bayern' : transferTemplate.toTeamId;

  newNews.push({
    id: `news_tr_${matchday}_${Date.now()}`,
    type: 'transfer',
    category: 'TRANSFER',
    importance: matchday % 2 === 0 ? 'breaking' : 'high',
    title: `OFFICIAL: ${transferTemplate.headline}`,
    summary: `${transferTemplate.player} completes high-profile European transfer for €${transferTemplate.fee}M!`,
    fullBody: transferTemplate.body,
    date: `Matchday ${matchday} • 16:45`,
    matchday,
    author: 'Fabrizio Romano',
    handle: '@FabrizioRomano',
    verified: true,
    avatarText: 'FR',
    teamId: actualToTeam,
    secondaryTeamId: transferTemplate.fromTeamId,
    playerName: transferTemplate.player,
    playerPosition: transferTemplate.pos,
    playerRating: transferTemplate.rating,
    transferFee: transferTemplate.fee,
    likes: `${(Math.random() * 80 + 50).toFixed(1)}K`,
    retweets: `${(Math.random() * 20 + 10).toFixed(1)}K`,
    isRead: false,
  });

  // 3. Generate 1 new dynamic player injury update across the league
  // Pick an opponent or league player
  const candidateTeams = TEAMS.filter(t => t.id !== career.userTeamId);
  const randomTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
  const candidatePlayers = randomTeam.players.filter(p => !updatedInjuries.some(i => i.playerName === p.name));

  if (candidatePlayers.length > 0) {
    const victimPlayer = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];
    const injuryType = DYNAMIC_INJURY_POOL[Math.floor(Math.random() * DYNAMIC_INJURY_POOL.length)];

    const newInjury: PlayerInjury = {
      id: `inj_${victimPlayer.id || victimPlayer.name}_md${matchday}`,
      playerId: victimPlayer.id || String(victimPlayer.number),
      playerName: victimPlayer.name,
      teamId: randomTeam.id,
      injuryName: injuryType.injuryName,
      weeksRemaining: injuryType.weeks,
      severity: injuryType.severity,
    };

    updatedInjuries.push(newInjury);

    newNews.push({
      id: `news_inj_${matchday}_${Date.now()}`,
      type: 'injury',
      category: 'INJURY',
      importance: injuryType.severity === 'Severe' ? 'breaking' : 'high',
      title: `INJURY REPORT: ${victimPlayer.name} Sidelined With ${injuryType.injuryName}`,
      summary: `${randomTeam.name} star ${victimPlayer.name} is ruled out for ${injuryType.weeks} weeks following matchday knock.`,
      fullBody: `During fierce Matchday ${matchday} competition, ${victimPlayer.name} was forced off with visible discomfort. ${randomTeam.name} head of medicine confirmed: "${injuryType.diagnosis} We anticipate a recovery window of approximately ${injuryType.weeks} weeks under strict physiotherapy."`,
      date: `Matchday ${matchday} • 21:15`,
      matchday,
      author: 'The Athletic Football',
      handle: '@TheAthleticFC',
      verified: true,
      avatarText: 'TA',
      teamId: randomTeam.id,
      playerName: victimPlayer.name,
      playerPosition: victimPlayer.position,
      playerRating: victimPlayer.rating,
      injuryType: injuryType.injuryName,
      recoveryWeeks: injuryType.weeks,
      likes: `${(Math.random() * 30 + 15).toFixed(1)}K`,
      retweets: `${(Math.random() * 8 + 3).toFixed(1)}K`,
      isRead: false,
    });
  }

  return { newNews, updatedInjuries };
}

/**
 * Creates an instant Breaking News item when the user signs a player
 */
export function createPlayerSigningNews(
  userTeam: Team,
  player: Player,
  fee: number,
  matchday: number
): CareerNewsItem {
  return {
    id: `news_user_sign_${player.id}_${Date.now()}`,
    type: 'transfer',
    category: 'TRANSFER',
    importance: 'breaking',
    title: `HERE WE GO! ${userTeam.name} Complete Sensational €${fee}M Signing of ${player.name}!`,
    summary: `Blockbuster deal confirmed! ${player.name} officially arrives at ${userTeam.name} on a marquee contract.`,
    fullBody: `🚨 HERE WE GO! ${userTeam.name} have pulled off one of the most exciting transfers of the campaign by confirming the signing of ${player.name} for €${fee}M! The ${player.position} ace (Overall Rating: ${player.rating}) completed all medical tests and signed a five-year contract. Manager and supporters have hailed the acquisition as a monumental statement of ambition!`,
    date: `Matchday ${matchday} • Just Now`,
    matchday,
    author: 'Fabrizio Romano',
    handle: '@FabrizioRomano',
    verified: true,
    avatarText: 'FR',
    teamId: userTeam.id,
    playerName: player.name,
    playerPosition: player.position,
    playerRating: player.rating,
    transferFee: fee,
    likes: `${(Math.random() * 100 + 120).toFixed(1)}K`,
    retweets: `${(Math.random() * 30 + 25).toFixed(1)}K`,
    isRead: false,
  };
}

/**
  * Creates an instant Breaking News item when the user promotes an academy prodigy to the senior first team
  */
export function createYouthPromotionNews(
  userTeam: Team,
  player: Player,
  potential: number,
  matchday: number
): CareerNewsItem {
  return {
    id: `news_youth_promo_${player.id}_${Date.now()}`,
    type: 'development',
    category: 'DEVELOPMENT',
    importance: 'breaking',
    title: `🚨 WONDERKID PROMOTED! ${userTeam.name} Register 17yo Prodigy ${player.name} to First Team!`,
    summary: `Academy sensation ${player.name} officially earns a senior squad contract with an extraordinary potential ceiling of ${potential}!`,
    fullBody: `🌟 GENERATIONAL TALENT! ${userTeam.name} have promoted youth academy phenom ${player.name} to the first-team roster. Discovered through the club's scouting network, the ${player.position} gem (Overall: ${player.rating}, Potential: ${potential}) has stunned coaches with his technique and maturity. Expect to see him feature in upcoming matchdays!`,
    date: `Matchday ${matchday} • Just Now`,
    matchday,
    author: 'Youth Scout Weekly',
    handle: '@ScoutAcademyFC',
    verified: true,
    avatarText: 'YS',
    teamId: userTeam.id,
    playerName: player.name,
    playerPosition: player.position,
    playerRating: player.rating,
    likes: `${(Math.random() * 70 + 80).toFixed(1)}K`,
    retweets: `${(Math.random() * 20 + 15).toFixed(1)}K`,
    isRead: false,
  };
}
