import { Team, TeamKit, KitPattern } from '../types/soccer';
import { getClubEmblemUrl, getClubLeague } from './emblems';

const RAW_TEAMS: Team[] = [
  {
    id: 'madrid',
    name: 'Real Madrid',
    shortName: 'RMA',
    country: 'Spain',
    badgeBg: '#ffffff',
    badgeBorder: '#f59e0b',
    badgeTextColor: '#1e3a8a',
    badgeIcon: '👑',
    attackRating: 93,
    midfieldRating: 90,
    defenseRating: 88,
    overallRating: 91,
    formation: '4-3-3',
    tactic: 'Balanced',
    stadium: 'Santiago Bernabéu',
    kit: {
      primary: '#ffffff',
      secondary: '#f59e0b',
      shorts: '#ffffff',
      socks: '#ffffff',
      numberColor: '#1e3a8a',
    },
    awayKit: {
      primary: '#1e1b4b',
      secondary: '#f59e0b',
      shorts: '#1e1b4b',
      socks: '#1e1b4b',
      numberColor: '#ffffff',
    },
    players: [
      { id: 'rma-1', name: 'Thibaut Courtois', shortName: 'Courtois', number: 1, position: 'GK', rating: 90, stats: { pace: 50, shooting: 20, passing: 74, dribbling: 50, defending: 90, physicality: 89 }, isGoalkeeper: true },
      { id: 'rma-2', name: 'Dani Carvajal', shortName: 'Carvajal', number: 2, position: 'RB', rating: 86, stats: { pace: 82, shooting: 60, passing: 81, dribbling: 82, defending: 85, physicality: 84 } },
      { id: 'rma-3', name: 'Éder Militão', shortName: 'Militão', number: 3, position: 'CB', rating: 87, stats: { pace: 85, shooting: 52, passing: 74, dribbling: 72, defending: 87, physicality: 85 } },
      { id: 'rma-22', name: 'Antonio Rüdiger', shortName: 'Rüdiger', number: 22, position: 'CB', rating: 88, stats: { pace: 86, shooting: 55, passing: 73, dribbling: 70, defending: 88, physicality: 89 } },
      { id: 'rma-23', name: 'Ferland Mendy', shortName: 'Mendy', number: 23, position: 'LB', rating: 84, stats: { pace: 90, shooting: 64, passing: 77, dribbling: 80, defending: 84, physicality: 85 } },
      { id: 'rma-8', name: 'Federico Valverde', shortName: 'Valverde', number: 8, position: 'CM', rating: 89, stats: { pace: 88, shooting: 84, passing: 86, dribbling: 84, defending: 82, physicality: 87 } },
      { id: 'rma-14', name: 'Aurélien Tchouaméni', shortName: 'Tchouaméni', number: 14, position: 'CDM', rating: 86, stats: { pace: 78, shooting: 75, passing: 83, dribbling: 80, defending: 86, physicality: 88 } },
      { id: 'rma-5', name: 'Jude Bellingham', shortName: 'Bellingham', number: 5, position: 'CAM', rating: 91, stats: { pace: 83, shooting: 88, passing: 89, dribbling: 90, defending: 81, physicality: 86 } },
      { id: 'rma-11', name: 'Rodrygo', shortName: 'Rodrygo', number: 11, position: 'RW', rating: 87, stats: { pace: 91, shooting: 83, passing: 82, dribbling: 89, defending: 45, physicality: 68 } },
      { id: 'rma-9', name: 'Kylian Mbappé', shortName: 'Mbappé', number: 9, position: 'ST', rating: 94, stats: { pace: 97, shooting: 92, passing: 82, dribbling: 93, defending: 38, physicality: 80 } },
      { id: 'rma-7', name: 'Vinícius Júnior', shortName: 'Vinícius Jr.', number: 7, position: 'LW', rating: 92, stats: { pace: 96, shooting: 85, passing: 82, dribbling: 93, defending: 35, physicality: 72 } },
      // Bench Substitutes
      { id: 'rma-10', name: 'Luka Modrić', shortName: 'Modrić', number: 10, position: 'CM', rating: 86, stats: { pace: 70, shooting: 76, passing: 91, dribbling: 88, defending: 72, physicality: 66 } },
      { id: 'rma-21', name: 'Brahim Díaz', shortName: 'Brahim', number: 21, position: 'CAM', rating: 84, stats: { pace: 87, shooting: 78, passing: 81, dribbling: 88, defending: 40, physicality: 62 } },
      { id: 'rma-16', name: 'Endrick', shortName: 'Endrick', number: 16, position: 'ST', rating: 82, stats: { pace: 91, shooting: 83, passing: 72, dribbling: 84, defending: 36, physicality: 82 } },
      { id: 'rma-15', name: 'Arda Güler', shortName: 'Güler', number: 15, position: 'CAM', rating: 83, stats: { pace: 78, shooting: 79, passing: 86, dribbling: 87, defending: 44, physicality: 60 } },
      { id: 'rma-6', name: 'Eduardo Camavinga', shortName: 'Camavinga', number: 6, position: 'CDM', rating: 86, stats: { pace: 83, shooting: 72, passing: 84, dribbling: 85, defending: 83, physicality: 83 } },
      { id: 'rma-17', name: 'Lucas Vázquez', shortName: 'Vázquez', number: 17, position: 'RB', rating: 81, stats: { pace: 82, shooting: 74, passing: 80, dribbling: 81, defending: 76, physicality: 75 } },
      { id: 'rma-13', name: 'Andriy Lunin', shortName: 'Lunin', number: 13, position: 'GK', rating: 82, stats: { pace: 50, shooting: 20, passing: 75, dribbling: 50, defending: 83, physicality: 78 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'mancity',
    name: 'Manchester City',
    shortName: 'MCI',
    country: 'England',
    badgeBg: '#67e8f9',
    badgeBorder: '#0284c7',
    badgeTextColor: '#0c4a6e',
    badgeIcon: '🚢',
    attackRating: 93,
    midfieldRating: 92,
    defenseRating: 89,
    overallRating: 92,
    formation: '4-3-3',
    tactic: 'Tiki-Taka',
    stadium: 'Etihad Stadium',
    kit: {
      primary: '#67e8f9',
      secondary: '#ffffff',
      shorts: '#ffffff',
      socks: '#67e8f9',
      numberColor: '#0f172a',
    },
    awayKit: {
      primary: '#0f172a',
      secondary: '#eab308',
      shorts: '#0f172a',
      socks: '#0f172a',
      numberColor: '#eab308',
    },
    players: [
      { id: 'mci-31', name: 'Ederson', shortName: 'Ederson', number: 31, position: 'GK', rating: 88, stats: { pace: 62, shooting: 30, passing: 93, dribbling: 60, defending: 88, physicality: 80 }, isGoalkeeper: true },
      { id: 'mci-2', name: 'Kyle Walker', shortName: 'Walker', number: 2, position: 'RB', rating: 85, stats: { pace: 92, shooting: 63, passing: 77, dribbling: 78, defending: 83, physicality: 84 } },
      { id: 'mci-3', name: 'Rúben Dias', shortName: 'Dias', number: 3, position: 'CB', rating: 89, stats: { pace: 70, shooting: 40, passing: 76, dribbling: 72, defending: 90, physicality: 88 } },
      { id: 'mci-25', name: 'Manuel Akanji', shortName: 'Akanji', number: 25, position: 'CB', rating: 85, stats: { pace: 80, shooting: 52, passing: 78, dribbling: 76, defending: 85, physicality: 84 } },
      { id: 'mci-24', name: 'Joško Gvardiol', shortName: 'Gvardiol', number: 24, position: 'LB', rating: 86, stats: { pace: 82, shooting: 68, passing: 81, dribbling: 82, defending: 86, physicality: 85 } },
      { id: 'mci-16', name: 'Rodri', shortName: 'Rodri', number: 16, position: 'CDM', rating: 92, stats: { pace: 72, shooting: 83, passing: 90, dribbling: 85, defending: 90, physicality: 88 } },
      { id: 'mci-17', name: 'Kevin De Bruyne', shortName: 'De Bruyne', number: 17, position: 'CM', rating: 92, stats: { pace: 74, shooting: 89, passing: 95, dribbling: 87, defending: 68, physicality: 77 } },
      { id: 'mci-20', name: 'Bernardo Silva', shortName: 'B. Silva', number: 20, position: 'CAM', rating: 88, stats: { pace: 78, shooting: 80, passing: 88, dribbling: 92, defending: 68, physicality: 72 } },
      { id: 'mci-47', name: 'Phil Foden', shortName: 'Foden', number: 47, position: 'RW', rating: 90, stats: { pace: 86, shooting: 87, passing: 88, dribbling: 92, defending: 58, physicality: 70 } },
      { id: 'mci-9', name: 'Erling Haaland', shortName: 'Haaland', number: 9, position: 'ST', rating: 93, stats: { pace: 91, shooting: 95, passing: 70, dribbling: 82, defending: 45, physicality: 91 } },
      { id: 'mci-11', name: 'Jérémy Doku', shortName: 'Doku', number: 11, position: 'LW', rating: 84, stats: { pace: 95, shooting: 74, passing: 78, dribbling: 92, defending: 35, physicality: 70 } },
      // Bench Substitutes
      { id: 'mci-19', name: 'İlkay Gündoğan', shortName: 'Gündoğan', number: 19, position: 'CM', rating: 87, stats: { pace: 70, shooting: 80, passing: 89, dribbling: 85, defending: 72, physicality: 72 } },
      { id: 'mci-8', name: 'Mateo Kovačić', shortName: 'Kovačić', number: 8, position: 'CM', rating: 83, stats: { pace: 76, shooting: 70, passing: 85, dribbling: 87, defending: 78, physicality: 76 } },
      { id: 'mci-26', name: 'Savinho', shortName: 'Savinho', number: 26, position: 'RW', rating: 82, stats: { pace: 89, shooting: 76, passing: 78, dribbling: 86, defending: 40, physicality: 62 } },
      { id: 'mci-5', name: 'John Stones', shortName: 'Stones', number: 5, position: 'CB', rating: 85, stats: { pace: 72, shooting: 52, passing: 81, dribbling: 77, defending: 86, physicality: 81 } },
      { id: 'mci-82', name: 'Rico Lewis', shortName: 'Lewis', number: 82, position: 'RB', rating: 79, stats: { pace: 81, shooting: 60, passing: 80, dribbling: 82, defending: 78, physicality: 68 } },
      { id: 'mci-18', name: 'Stefan Ortega', shortName: 'Ortega', number: 18, position: 'GK', rating: 80, stats: { pace: 50, shooting: 20, passing: 82, dribbling: 50, defending: 81, physicality: 75 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'barcelona',
    name: 'FC Barcelona',
    shortName: 'BAR',
    country: 'Spain',
    badgeBg: '#1e3a8a',
    badgeBorder: '#dc2626',
    badgeTextColor: '#facc15',
    badgeIcon: '🔴',
    attackRating: 90,
    midfieldRating: 89,
    defenseRating: 86,
    overallRating: 89,
    formation: '4-3-3',
    tactic: 'Tiki-Taka',
    stadium: 'Spotify Camp Nou',
    kit: {
      primary: '#1e3a8a',
      secondary: '#dc2626',
      shorts: '#1e3a8a',
      socks: '#1e3a8a',
      numberColor: '#facc15',
    },
    awayKit: {
      primary: '#facc15',
      secondary: '#1e3a8a',
      shorts: '#facc15',
      socks: '#facc15',
      numberColor: '#1e3a8a',
    },
    players: [
      { id: 'bar-1', name: 'Marc-André ter Stegen', shortName: 'Ter Stegen', number: 1, position: 'GK', rating: 89, stats: { pace: 50, shooting: 20, passing: 86, dribbling: 50, defending: 89, physicality: 78 }, isGoalkeeper: true },
      { id: 'bar-23', name: 'Jules Koundé', shortName: 'Koundé', number: 23, position: 'RB', rating: 86, stats: { pace: 84, shooting: 50, passing: 78, dribbling: 77, defending: 87, physicality: 82 } },
      { id: 'bar-2', name: 'Pau Cubarsí', shortName: 'Cubarsí', number: 2, position: 'CB', rating: 83, stats: { pace: 75, shooting: 42, passing: 84, dribbling: 75, defending: 84, physicality: 76 } },
      { id: 'bar-5', name: 'Iñigo Martínez', shortName: 'I. Martínez', number: 5, position: 'CB', rating: 84, stats: { pace: 72, shooting: 48, passing: 78, dribbling: 68, defending: 85, physicality: 83 } },
      { id: 'bar-3', name: 'Alejandro Balde', shortName: 'Balde', number: 3, position: 'LB', rating: 84, stats: { pace: 93, shooting: 58, passing: 77, dribbling: 82, defending: 78, physicality: 76 } },
      { id: 'bar-8', name: 'Pedri', shortName: 'Pedri', number: 8, position: 'CM', rating: 88, stats: { pace: 80, shooting: 78, passing: 91, dribbling: 90, defending: 73, physicality: 72 } },
      { id: 'bar-6', name: 'Gavi', shortName: 'Gavi', number: 6, position: 'CM', rating: 85, stats: { pace: 81, shooting: 74, passing: 84, dribbling: 86, defending: 79, physicality: 84 } },
      { id: 'bar-20', name: 'Dani Olmo', shortName: 'Olmo', number: 20, position: 'CAM', rating: 86, stats: { pace: 81, shooting: 84, passing: 87, dribbling: 88, defending: 58, physicality: 70 } },
      { id: 'bar-19', name: 'Lamine Yamal', shortName: 'Yamal', number: 19, position: 'RW', rating: 87, stats: { pace: 92, shooting: 82, passing: 86, dribbling: 91, defending: 42, physicality: 65 } },
      { id: 'bar-9', name: 'Robert Lewandowski', shortName: 'Lewandowski', number: 9, position: 'ST', rating: 89, stats: { pace: 76, shooting: 91, passing: 80, dribbling: 84, defending: 44, physicality: 82 } },
      { id: 'bar-11', name: 'Raphinha', shortName: 'Raphinha', number: 11, position: 'LW', rating: 87, stats: { pace: 91, shooting: 85, passing: 84, dribbling: 88, defending: 55, physicality: 74 } },
      // Bench Substitutes
      { id: 'bar-7', name: 'Ferran Torres', shortName: 'Ferran', number: 7, position: 'ST', rating: 82, stats: { pace: 84, shooting: 82, passing: 78, dribbling: 83, defending: 45, physicality: 73 } },
      { id: 'bar-16', name: 'Fermín López', shortName: 'Fermín', number: 16, position: 'CAM', rating: 82, stats: { pace: 80, shooting: 81, passing: 81, dribbling: 84, defending: 66, physicality: 75 } },
      { id: 'bar-17', name: 'Marc Casadó', shortName: 'Casadó', number: 17, position: 'CDM', rating: 80, stats: { pace: 74, shooting: 62, passing: 82, dribbling: 78, defending: 81, physicality: 78 } },
      { id: 'bar-18', name: 'Pau Víctor', shortName: 'Pau Víctor', number: 18, position: 'ST', rating: 77, stats: { pace: 82, shooting: 78, passing: 72, dribbling: 77, defending: 35, physicality: 72 } },
      { id: 'bar-24', name: 'Eric García', shortName: 'Eric', number: 24, position: 'CB', rating: 79, stats: { pace: 72, shooting: 45, passing: 80, dribbling: 74, defending: 80, physicality: 76 } },
      { id: 'bar-13', name: 'Iñaki Peña', shortName: 'Peña', number: 13, position: 'GK', rating: 78, stats: { pace: 50, shooting: 20, passing: 76, dribbling: 50, defending: 78, physicality: 72 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'arsenal',
    name: 'Arsenal',
    shortName: 'ARS',
    country: 'England',
    badgeBg: '#dc2626',
    badgeBorder: '#ffffff',
    badgeTextColor: '#ffffff',
    badgeIcon: '🎯',
    attackRating: 88,
    midfieldRating: 90,
    defenseRating: 90,
    overallRating: 89,
    formation: '4-3-3',
    tactic: 'High Press',
    stadium: 'Emirates Stadium',
    kit: {
      primary: '#dc2626',
      secondary: '#ffffff',
      shorts: '#ffffff',
      socks: '#dc2626',
      numberColor: '#ffffff',
    },
    awayKit: {
      primary: '#0f172a',
      secondary: '#22c55e',
      shorts: '#0f172a',
      socks: '#0f172a',
      numberColor: '#22c55e',
    },
    players: [
      { id: 'ars-22', name: 'David Raya', shortName: 'Raya', number: 22, position: 'GK', rating: 86, stats: { pace: 50, shooting: 20, passing: 84, dribbling: 55, defending: 86, physicality: 76 }, isGoalkeeper: true },
      { id: 'ars-4', name: 'Ben White', shortName: 'White', number: 4, position: 'RB', rating: 84, stats: { pace: 80, shooting: 54, passing: 80, dribbling: 79, defending: 85, physicality: 80 } },
      { id: 'ars-2', name: 'William Saliba', shortName: 'Saliba', number: 2, position: 'CB', rating: 89, stats: { pace: 84, shooting: 44, passing: 78, dribbling: 78, defending: 90, physicality: 86 } },
      { id: 'ars-6', name: 'Gabriel Magalhães', shortName: 'Gabriel', number: 6, position: 'CB', rating: 87, stats: { pace: 78, shooting: 48, passing: 74, dribbling: 72, defending: 88, physicality: 88 } },
      { id: 'ars-12', name: 'Jurriën Timber', shortName: 'Timber', number: 12, position: 'LB', rating: 83, stats: { pace: 83, shooting: 56, passing: 79, dribbling: 81, defending: 84, physicality: 80 } },
      { id: 'ars-41', name: 'Declan Rice', shortName: 'Rice', number: 41, position: 'CDM', rating: 89, stats: { pace: 79, shooting: 78, passing: 86, dribbling: 82, defending: 89, physicality: 89 } },
      { id: 'ars-8', name: 'Martin Ødegaard', shortName: 'Ødegaard', number: 8, position: 'CAM', rating: 90, stats: { pace: 77, shooting: 84, passing: 92, dribbling: 90, defending: 66, physicality: 72 } },
      { id: 'ars-23', name: 'Mikel Merino', shortName: 'Merino', number: 23, position: 'CM', rating: 84, stats: { pace: 75, shooting: 78, passing: 83, dribbling: 81, defending: 83, physicality: 85 } },
      { id: 'ars-7', name: 'Bukayo Saka', shortName: 'Saka', number: 7, position: 'RW', rating: 89, stats: { pace: 88, shooting: 85, passing: 86, dribbling: 89, defending: 65, physicality: 78 } },
      { id: 'ars-29', name: 'Kai Havertz', shortName: 'Havertz', number: 29, position: 'ST', rating: 85, stats: { pace: 82, shooting: 82, passing: 82, dribbling: 84, defending: 55, physicality: 82 } },
      { id: 'ars-11', name: 'Gabriel Martinelli', shortName: 'Martinelli', number: 11, position: 'LW', rating: 85, stats: { pace: 92, shooting: 80, passing: 79, dribbling: 87, defending: 48, physicality: 73 } },
      // Bench Substitutes
      { id: 'ars-19', name: 'Leandro Trossard', shortName: 'Trossard', number: 19, position: 'LW', rating: 84, stats: { pace: 81, shooting: 84, passing: 81, dribbling: 86, defending: 45, physicality: 68 } },
      { id: 'ars-9', name: 'Gabriel Jesus', shortName: 'Jesus', number: 9, position: 'ST', rating: 82, stats: { pace: 83, shooting: 81, passing: 76, dribbling: 86, defending: 42, physicality: 75 } },
      { id: 'ars-30', name: 'Raheem Sterling', shortName: 'Sterling', number: 30, position: 'RW', rating: 81, stats: { pace: 88, shooting: 78, passing: 76, dribbling: 85, defending: 40, physicality: 65 } },
      { id: 'ars-5', name: 'Thomas Partey', shortName: 'Partey', number: 5, position: 'CDM', rating: 83, stats: { pace: 68, shooting: 72, passing: 82, dribbling: 81, defending: 83, physicality: 84 } },
      { id: 'ars-20', name: 'Jorginho', shortName: 'Jorginho', number: 20, position: 'CM', rating: 81, stats: { pace: 55, shooting: 68, passing: 86, dribbling: 80, defending: 76, physicality: 66 } },
      { id: 'ars-32', name: 'Neto', shortName: 'Neto', number: 32, position: 'GK', rating: 78, stats: { pace: 50, shooting: 20, passing: 76, dribbling: 50, defending: 78, physicality: 75 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'bayern',
    name: 'Bayern München',
    shortName: 'BAY',
    country: 'Germany',
    badgeBg: '#b91c1c',
    badgeBorder: '#ffffff',
    badgeTextColor: '#ffffff',
    badgeIcon: '⚡',
    attackRating: 91,
    midfieldRating: 88,
    defenseRating: 87,
    overallRating: 89,
    formation: '4-2-3-1',
    tactic: 'High Press',
    stadium: 'Allianz Arena',
    kit: {
      primary: '#dc2626',
      secondary: '#ffffff',
      shorts: '#dc2626',
      socks: '#dc2626',
      numberColor: '#ffffff',
    },
    awayKit: {
      primary: '#18181b',
      secondary: '#eab308',
      shorts: '#18181b',
      socks: '#18181b',
      numberColor: '#eab308',
    },
    players: [
      { id: 'bay-1', name: 'Manuel Neuer', shortName: 'Neuer', number: 1, position: 'GK', rating: 88, stats: { pace: 58, shooting: 30, passing: 87, dribbling: 60, defending: 88, physicality: 82 }, isGoalkeeper: true },
      { id: 'bay-27', name: 'Konrad Laimer', shortName: 'Laimer', number: 27, position: 'RB', rating: 83, stats: { pace: 82, shooting: 70, passing: 78, dribbling: 80, defending: 82, physicality: 84 } },
      { id: 'bay-3', name: 'Kim Min-jae', shortName: 'Kim', number: 3, position: 'CB', rating: 85, stats: { pace: 80, shooting: 40, passing: 74, dribbling: 70, defending: 86, physicality: 87 } },
      { id: 'bay-2', name: 'Dayot Upamecano', shortName: 'Upamecano', number: 2, position: 'CB', rating: 84, stats: { pace: 84, shooting: 42, passing: 73, dribbling: 72, defending: 85, physicality: 86 } },
      { id: 'bay-19', name: 'Alphonso Davies', shortName: 'Davies', number: 19, position: 'LB', rating: 86, stats: { pace: 96, shooting: 71, passing: 80, dribbling: 87, defending: 80, physicality: 82 } },
      { id: 'bay-6', name: 'Joshua Kimmich', shortName: 'Kimmich', number: 6, position: 'CDM', rating: 88, stats: { pace: 70, shooting: 76, passing: 91, dribbling: 84, defending: 83, physicality: 79 } },
      { id: 'bay-16', name: 'Joao Palhinha', shortName: 'Palhinha', number: 16, position: 'CDM', rating: 85, stats: { pace: 70, shooting: 68, passing: 75, dribbling: 74, defending: 87, physicality: 89 } },
      { id: 'bay-17', name: 'Michael Olise', shortName: 'Olise', number: 17, position: 'RW', rating: 85, stats: { pace: 85, shooting: 82, passing: 85, dribbling: 88, defending: 45, physicality: 70 } },
      { id: 'bay-42', name: 'Jamal Musiala', shortName: 'Musiala', number: 42, position: 'CAM', rating: 90, stats: { pace: 88, shooting: 84, passing: 86, dribbling: 94, defending: 55, physicality: 72 } },
      { id: 'bay-10', name: 'Leroy Sané', shortName: 'Sané', number: 10, position: 'LW', rating: 86, stats: { pace: 92, shooting: 83, passing: 81, dribbling: 88, defending: 38, physicality: 70 } },
      { id: 'bay-9', name: 'Harry Kane', shortName: 'Kane', number: 9, position: 'ST', rating: 91, stats: { pace: 75, shooting: 94, passing: 86, dribbling: 83, defending: 48, physicality: 84 } },
      // Bench Substitutes
      { id: 'bay-25', name: 'Thomas Müller', shortName: 'Müller', number: 25, position: 'CAM', rating: 84, stats: { pace: 68, shooting: 82, passing: 83, dribbling: 80, defending: 55, physicality: 72 } },
      { id: 'bay-7', name: 'Serge Gnabry', shortName: 'Gnabry', number: 7, position: 'RW', rating: 83, stats: { pace: 83, shooting: 82, passing: 78, dribbling: 84, defending: 42, physicality: 72 } },
      { id: 'bay-11', name: 'Kingsley Coman', shortName: 'Coman', number: 11, position: 'LW', rating: 84, stats: { pace: 89, shooting: 78, passing: 79, dribbling: 87, defending: 35, physicality: 68 } },
      { id: 'bay-39', name: 'Mathys Tel', shortName: 'Tel', number: 39, position: 'ST', rating: 79, stats: { pace: 87, shooting: 80, passing: 72, dribbling: 82, defending: 32, physicality: 74 } },
      { id: 'bay-15', name: 'Eric Dier', shortName: 'Dier', number: 15, position: 'CB', rating: 80, stats: { pace: 62, shooting: 64, passing: 76, dribbling: 68, defending: 81, physicality: 82 } },
      { id: 'bay-26', name: 'Sven Ulreich', shortName: 'Ulreich', number: 26, position: 'GK', rating: 76, stats: { pace: 50, shooting: 20, passing: 72, dribbling: 50, defending: 76, physicality: 74 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'argentina',
    name: 'Argentina',
    shortName: 'ARG',
    country: 'Argentina',
    badgeBg: '#38bdf8',
    badgeBorder: '#ffffff',
    badgeTextColor: '#0369a1',
    badgeIcon: '☀️',
    attackRating: 92,
    midfieldRating: 88,
    defenseRating: 87,
    overallRating: 90,
    formation: '4-3-3',
    tactic: 'Counter Attack',
    stadium: 'Estadio Monumental',
    kit: {
      primary: '#38bdf8',
      secondary: '#ffffff',
      shorts: '#000000',
      socks: '#ffffff',
      numberColor: '#000000',
    },
    awayKit: {
      primary: '#1e1b4b',
      secondary: '#a855f7',
      shorts: '#1e1b4b',
      socks: '#1e1b4b',
      numberColor: '#ffffff',
    },
    players: [
      { id: 'arg-23', name: 'Emiliano Martínez', shortName: 'Dibu', number: 23, position: 'GK', rating: 88, stats: { pace: 50, shooting: 20, passing: 80, dribbling: 50, defending: 89, physicality: 86 }, isGoalkeeper: true },
      { id: 'arg-4', name: 'Nahuel Molina', shortName: 'Molina', number: 4, position: 'RB', rating: 82, stats: { pace: 85, shooting: 60, passing: 78, dribbling: 79, defending: 80, physicality: 78 } },
      { id: 'arg-13', name: 'Cristian Romero', shortName: 'Romero', number: 13, position: 'CB', rating: 87, stats: { pace: 80, shooting: 45, passing: 72, dribbling: 73, defending: 88, physicality: 89 } },
      { id: 'arg-25', name: 'Lisandro Martínez', shortName: 'L. Martínez', number: 25, position: 'CB', rating: 86, stats: { pace: 78, shooting: 54, passing: 82, dribbling: 79, defending: 86, physicality: 85 } },
      { id: 'arg-3', name: 'Nicolás Tagliafico', shortName: 'Tagliafico', number: 3, position: 'LB', rating: 81, stats: { pace: 79, shooting: 58, passing: 75, dribbling: 76, defending: 82, physicality: 81 } },
      { id: 'arg-7', name: 'Rodrigo De Paul', shortName: 'De Paul', number: 7, position: 'CM', rating: 85, stats: { pace: 80, shooting: 78, passing: 84, dribbling: 82, defending: 81, physicality: 86 } },
      { id: 'arg-24', name: 'Enzo Fernández', shortName: 'Enzo', number: 24, position: 'CM', rating: 84, stats: { pace: 75, shooting: 80, passing: 87, dribbling: 83, defending: 78, physicality: 80 } },
      { id: 'arg-20', name: 'Alexis Mac Allister', shortName: 'Mac Allister', number: 20, position: 'CM', rating: 87, stats: { pace: 78, shooting: 83, passing: 87, dribbling: 85, defending: 79, physicality: 80 } },
      { id: 'arg-10', name: 'Lionel Messi', shortName: 'Messi', number: 10, position: 'RW', rating: 91, stats: { pace: 80, shooting: 93, passing: 94, dribbling: 94, defending: 35, physicality: 65 } },
      { id: 'arg-9', name: 'Julián Álvarez', shortName: 'Álvarez', number: 9, position: 'ST', rating: 87, stats: { pace: 86, shooting: 87, passing: 81, dribbling: 86, defending: 58, physicality: 83 } },
      { id: 'arg-15', name: 'Lautaro Martínez', shortName: 'Lautaro', number: 15, position: 'LW', rating: 89, stats: { pace: 84, shooting: 90, passing: 76, dribbling: 86, defending: 48, physicality: 85 } },
      // Bench Substitutes
      { id: 'arg-17', name: 'Alejandro Garnacho', shortName: 'Garnacho', number: 17, position: 'LW', rating: 81, stats: { pace: 88, shooting: 78, passing: 76, dribbling: 84, defending: 36, physicality: 65 } },
      { id: 'arg-5', name: 'Leandro Paredes', shortName: 'Paredes', number: 5, position: 'CDM', rating: 82, stats: { pace: 66, shooting: 75, passing: 85, dribbling: 80, defending: 79, physicality: 81 } },
      { id: 'arg-16', name: 'Giovani Lo Celso', shortName: 'Lo Celso', number: 16, position: 'CM', rating: 81, stats: { pace: 76, shooting: 77, passing: 83, dribbling: 82, defending: 70, physicality: 73 } },
      { id: 'arg-19', name: 'Nicolás Otamendi', shortName: 'Otamendi', number: 19, position: 'CB', rating: 81, stats: { pace: 62, shooting: 52, passing: 70, dribbling: 64, defending: 83, physicality: 86 } },
      { id: 'arg-21', name: 'Paulo Dybala', shortName: 'Dybala', number: 21, position: 'CAM', rating: 86, stats: { pace: 78, shooting: 86, passing: 87, dribbling: 90, defending: 40, physicality: 62 } },
      { id: 'arg-12', name: 'Gerónimo Rulli', shortName: 'Rulli', number: 12, position: 'GK', rating: 79, stats: { pace: 50, shooting: 20, passing: 76, dribbling: 50, defending: 79, physicality: 75 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'france',
    name: 'France',
    shortName: 'FRA',
    country: 'France',
    badgeBg: '#1e3a8a',
    badgeBorder: '#dc2626',
    badgeTextColor: '#ffffff',
    badgeIcon: '🐓',
    attackRating: 93,
    midfieldRating: 88,
    defenseRating: 89,
    overallRating: 91,
    formation: '4-3-3',
    tactic: 'Counter Attack',
    stadium: 'Stade de France',
    kit: {
      primary: '#1e3a8a',
      secondary: '#dc2626',
      shorts: '#ffffff',
      socks: '#dc2626',
      numberColor: '#ffffff',
    },
    awayKit: {
      primary: '#ffffff',
      secondary: '#1e3a8a',
      shorts: '#1e3a8a',
      socks: '#ffffff',
      numberColor: '#1e3a8a',
    },
    players: [
      { id: 'fra-16', name: 'Mike Maignan', shortName: 'Maignan', number: 16, position: 'GK', rating: 88, stats: { pace: 50, shooting: 20, passing: 83, dribbling: 50, defending: 88, physicality: 84 }, isGoalkeeper: true },
      { id: 'fra-5', name: 'Jules Koundé', shortName: 'Koundé', number: 5, position: 'RB', rating: 86, stats: { pace: 84, shooting: 50, passing: 78, dribbling: 77, defending: 87, physicality: 82 } },
      { id: 'fra-4', name: 'Dayot Upamecano', shortName: 'Upamecano', number: 4, position: 'CB', rating: 84, stats: { pace: 84, shooting: 42, passing: 73, dribbling: 72, defending: 85, physicality: 86 } },
      { id: 'fra-17', name: 'William Saliba', shortName: 'Saliba', number: 17, position: 'CB', rating: 89, stats: { pace: 84, shooting: 44, passing: 78, dribbling: 78, defending: 90, physicality: 86 } },
      { id: 'fra-22', name: 'Théo Hernández', shortName: 'T. Hernández', number: 22, position: 'LB', rating: 87, stats: { pace: 94, shooting: 74, passing: 79, dribbling: 84, defending: 82, physicality: 86 } },
      { id: 'fra-8', name: 'Aurélien Tchouaméni', shortName: 'Tchouaméni', number: 8, position: 'CDM', rating: 86, stats: { pace: 78, shooting: 75, passing: 83, dribbling: 80, defending: 86, physicality: 88 } },
      { id: 'fra-6', name: 'Eduardo Camavinga', shortName: 'Camavinga', number: 6, position: 'CM', rating: 86, stats: { pace: 83, shooting: 72, passing: 84, dribbling: 85, defending: 83, physicality: 83 } },
      { id: 'fra-7', name: 'Antoine Griezmann', shortName: 'Griezmann', number: 7, position: 'CAM', rating: 88, stats: { pace: 80, shooting: 87, passing: 89, dribbling: 88, defending: 70, physicality: 74 } },
      { id: 'fra-11', name: 'Ousmane Dembélé', shortName: 'Dembélé', number: 11, position: 'RW', rating: 86, stats: { pace: 94, shooting: 78, passing: 82, dribbling: 91, defending: 35, physicality: 62 } },
      { id: 'fra-10', name: 'Kylian Mbappé', shortName: 'Mbappé', number: 10, position: 'ST', rating: 94, stats: { pace: 97, shooting: 92, passing: 82, dribbling: 93, defending: 38, physicality: 80 } },
      { id: 'fra-20', name: 'Bradley Barcola', shortName: 'Barcola', number: 20, position: 'LW', rating: 84, stats: { pace: 93, shooting: 78, passing: 79, dribbling: 87, defending: 40, physicality: 70 } },
      // Bench Substitutes
      { id: 'fra-12', name: 'Randal Kolo Muani', shortName: 'Kolo Muani', number: 12, position: 'ST', rating: 82, stats: { pace: 89, shooting: 80, passing: 75, dribbling: 82, defending: 38, physicality: 78 } },
      { id: 'fra-15', name: 'Marcus Thuram', shortName: 'Thuram', number: 15, position: 'ST', rating: 83, stats: { pace: 86, shooting: 81, passing: 76, dribbling: 83, defending: 44, physicality: 82 } },
      { id: 'fra-19', name: 'Youssouf Fofana', shortName: 'Fofana', number: 19, position: 'CM', rating: 81, stats: { pace: 78, shooting: 72, passing: 80, dribbling: 79, defending: 81, physicality: 84 } },
      { id: 'fra-24', name: 'Ibrahima Konaté', shortName: 'Konaté', number: 24, position: 'CB', rating: 84, stats: { pace: 82, shooting: 40, passing: 68, dribbling: 68, defending: 85, physicality: 87 } },
      { id: 'fra-14', name: 'Adrien Rabiot', shortName: 'Rabiot', number: 14, position: 'CM', rating: 83, stats: { pace: 78, shooting: 76, passing: 81, dribbling: 81, defending: 80, physicality: 82 } },
      { id: 'fra-1', name: 'Brice Samba', shortName: 'Samba', number: 1, position: 'GK', rating: 80, stats: { pace: 50, shooting: 20, passing: 74, dribbling: 50, defending: 80, physicality: 76 }, isGoalkeeper: true },
    ],
  },
  {
    id: 'liverpool',
    name: 'Liverpool FC',
    shortName: 'LIV',
    country: 'England',
    badgeBg: '#dc2626',
    badgeBorder: '#047857',
    badgeTextColor: '#ffffff',
    badgeIcon: '🦅',
    attackRating: 90,
    midfieldRating: 88,
    defenseRating: 89,
    overallRating: 89,
    formation: '4-3-3',
    tactic: 'High Press',
    stadium: 'Anfield',
    kit: {
      primary: '#dc2626',
      secondary: '#047857',
      shorts: '#dc2626',
      socks: '#dc2626',
      numberColor: '#ffffff',
    },
    awayKit: {
      primary: '#1e293b',
      secondary: '#06b6d4',
      shorts: '#1e293b',
      socks: '#1e293b',
      numberColor: '#ffffff',
    },
    players: [
      { id: 'liv-1', name: 'Alisson Becker', shortName: 'Alisson', number: 1, position: 'GK', rating: 89, stats: { pace: 50, shooting: 20, passing: 85, dribbling: 50, defending: 89, physicality: 80 }, isGoalkeeper: true },
      { id: 'liv-66', name: 'Trent Alexander-Arnold', shortName: 'Alexander-Arnold', number: 66, position: 'RB', rating: 86, stats: { pace: 78, shooting: 76, passing: 92, dribbling: 82, defending: 80, physicality: 74 } },
      { id: 'liv-4', name: 'Virgil van Dijk', shortName: 'Van Dijk', number: 4, position: 'CB', rating: 90, stats: { pace: 80, shooting: 60, passing: 76, dribbling: 72, defending: 91, physicality: 89 } },
      { id: 'liv-5', name: 'Ibrahima Konaté', shortName: 'Konaté', number: 5, position: 'CB', rating: 84, stats: { pace: 82, shooting: 40, passing: 68, dribbling: 68, defending: 85, physicality: 87 } },
      { id: 'liv-26', name: 'Andy Robertson', shortName: 'Robertson', number: 26, position: 'LB', rating: 85, stats: { pace: 84, shooting: 62, passing: 82, dribbling: 80, defending: 82, physicality: 78 } },
      { id: 'liv-38', name: 'Ryan Gravenberch', shortName: 'Gravenberch', number: 38, position: 'CDM', rating: 84, stats: { pace: 82, shooting: 74, passing: 83, dribbling: 85, defending: 80, physicality: 83 } },
      { id: 'liv-10', name: 'Alexis Mac Allister', shortName: 'Mac Allister', number: 10, position: 'CM', rating: 87, stats: { pace: 78, shooting: 83, passing: 87, dribbling: 85, defending: 79, physicality: 80 } },
      { id: 'liv-8', name: 'Dominik Szoboszlai', shortName: 'Szoboszlai', number: 8, position: 'CAM', rating: 85, stats: { pace: 84, shooting: 86, passing: 85, dribbling: 84, defending: 66, physicality: 80 } },
      { id: 'liv-11', name: 'Mohamed Salah', shortName: 'Salah', number: 11, position: 'RW', rating: 90, stats: { pace: 90, shooting: 89, passing: 84, dribbling: 89, defending: 45, physicality: 77 } },
      { id: 'liv-9', name: 'Darwin Núñez', shortName: 'Núñez', number: 9, position: 'ST', rating: 83, stats: { pace: 91, shooting: 83, passing: 72, dribbling: 79, defending: 42, physicality: 86 } },
      { id: 'liv-7', name: 'Luis Díaz', shortName: 'Díaz', number: 7, position: 'LW', rating: 85, stats: { pace: 92, shooting: 81, passing: 78, dribbling: 88, defending: 42, physicality: 74 } },
      // Bench Substitutes
      { id: 'liv-18', name: 'Cody Gakpo', shortName: 'Gakpo', number: 18, position: 'LW', rating: 83, stats: { pace: 84, shooting: 82, passing: 80, dribbling: 84, defending: 44, physicality: 76 } },
      { id: 'liv-20', name: 'Diogo Jota', shortName: 'Jota', number: 20, position: 'ST', rating: 85, stats: { pace: 83, shooting: 84, passing: 76, dribbling: 85, defending: 46, physicality: 76 } },
      { id: 'liv-14', name: 'Federico Chiesa', shortName: 'Chiesa', number: 14, position: 'RW', rating: 82, stats: { pace: 88, shooting: 81, passing: 77, dribbling: 85, defending: 45, physicality: 72 } },
      { id: 'liv-17', name: 'Curtis Jones', shortName: 'Jones', number: 17, position: 'CM', rating: 80, stats: { pace: 78, shooting: 74, passing: 81, dribbling: 83, defending: 74, physicality: 76 } },
      { id: 'liv-3', name: 'Wataru Endo', shortName: 'Endo', number: 3, position: 'CDM', rating: 80, stats: { pace: 68, shooting: 65, passing: 78, dribbling: 74, defending: 82, physicality: 80 } },
      { id: 'liv-62', name: 'Caoimhín Kelleher', shortName: 'Kelleher', number: 62, position: 'GK', rating: 80, stats: { pace: 50, shooting: 20, passing: 78, dribbling: 50, defending: 80, physicality: 74 }, isGoalkeeper: true },
    ],
  },
];

// Enrich teams with custom kits, sponsors, budgets and authentic player likeness & playstyles
const leftFootedStars = new Set(['Messi', 'Salah', 'Haaland', 'Bernardo', 'Saka', 'Foden', 'Camavinga', 'Alaba', 'Robertson', 'Di María', 'Griezmann']);

const teamKitMetadata: Record<string, {
  pattern: 'solid' | 'stripes' | 'hoops' | 'sash' | 'split' | 'chevron';
  sponsorText: string;
  crestShape: 'shield' | 'circle' | 'diamond' | 'hexagon';
  budget: number;
}> = {
  madrid: { pattern: 'solid', sponsorText: 'EMIRATES', crestShape: 'circle', budget: 185 },
  mancity: { pattern: 'solid', sponsorText: 'ETIHAD', crestShape: 'circle', budget: 210 },
  barca: { pattern: 'stripes', sponsorText: 'SPOTIFY', crestShape: 'shield', budget: 95 },
  arsenal: { pattern: 'solid', sponsorText: 'EMIRATES', crestShape: 'shield', budget: 130 },
  bayern: { pattern: 'solid', sponsorText: 'T-MOBILE', crestShape: 'circle', budget: 145 },
  argentina: { pattern: 'stripes', sponsorText: 'AFA', crestShape: 'shield', budget: 60 },
  france: { pattern: 'solid', sponsorText: 'FFF', crestShape: 'hexagon', budget: 70 },
  liverpool: { pattern: 'solid', sponsorText: 'STANDARD C.', crestShape: 'shield', budget: 155 },
};

const skinTones = ['#f7d0b3', '#ebd0b0', '#c89d7c', '#9c6b4e', '#66432c', '#402719'];
const hairColors = ['#1a1a1a', '#2c1810', '#4a2c11', '#c7a356', '#8d5524'];
const bootColors = ['#22c55e', '#ef4444', '#06b6d4', '#eab308', '#f97316', '#ffffff', '#111827'];
const hairStyles: Array<'short' | 'fade' | 'curly' | 'dreads' | 'slick' | 'buzz'> = ['short', 'fade', 'curly', 'dreads', 'slick', 'buzz'];

export const TEAMS: Team[] = RAW_TEAMS.map(team => {
  const meta = teamKitMetadata[team.id] || { pattern: 'solid' as KitPattern, sponsorText: 'EA FC 26', crestShape: 'shield' as const, budget: 100 };
  
  const enrichedKit: TeamKit = {
    ...team.kit,
    pattern: meta.pattern,
    sponsorText: meta.sponsorText,
    crestShape: meta.crestShape,
    crestSymbol: team.badgeIcon,
  };

  const enrichedAwayKit: TeamKit = {
    ...team.awayKit,
    pattern: meta.pattern === 'stripes' ? 'stripes' : 'solid',
    sponsorText: meta.sponsorText,
    crestShape: meta.crestShape,
    crestSymbol: team.badgeIcon,
  };

  const enrichedPlayers = team.players.map((p, idx) => {
    // Generate authentic playstyles based on position and rating
    const playStyles: Array<'Finesse Shot' | 'Power Header' | 'Speed Dribbler' | 'Whipped Cross' | 'Relentless' | 'Trickster' | 'Anchor' | 'Long Ball'> = [];
    if (p.stats.shooting >= 85) playStyles.push('Finesse Shot');
    if (p.stats.pace >= 88) playStyles.push('Speed Dribbler');
    if (p.stats.passing >= 86) playStyles.push('Whipped Cross');
    if (p.stats.physicality >= 85) playStyles.push('Power Header');
    if (p.stats.dribbling >= 88) playStyles.push('Trickster');
    if (p.stats.defending >= 86) playStyles.push('Anchor');
    if (playStyles.length === 0) playStyles.push('Relentless');

    const isLeft = leftFootedStars.has(p.shortName) || idx === 4 || idx === 10;
    const skinTone = skinTones[(p.id.length * 3 + idx) % skinTones.length];
    const hairColor = hairColors[(idx * 2 + p.number) % hairColors.length];
    const bootColor = bootColors[(p.number * 4 + idx) % bootColors.length];
    const hairStyle = hairStyles[(idx + p.number) % hairStyles.length];

    const marketValue = Math.max(15, Math.round(Math.pow((p.rating - 68) / 2.5, 2.1)));
    const wage = Math.round(marketValue * 1.8 + 60);

    return {
      ...p,
      preferredFoot: isLeft ? ('Left' as const) : ('Right' as const),
      playStyles,
      likeness: {
        skinTone,
        hairStyle,
        hairColor,
        bootColor,
      },
      marketValue,
      wage,
      form: 'Good' as const,
      staminaCondition: 100,
      isInjured: false,
    };
  });

  const league = getClubLeague(team.id);
  const emblemUrl = getClubEmblemUrl(team.id);

  return {
    ...team,
    emblemUrl,
    leagueId: league.id,
    budget: meta.budget,
    transferBudget: meta.budget,
    stadiumName: team.stadium || 'FC Arena',
    sponsor: meta.sponsorText,
    rating: team.overallRating,
    kit: enrichedKit,
    awayKit: enrichedAwayKit,
    players: enrichedPlayers,
  };
});
