/**
 * Player nationalities for the Ultimate Team card flag row.
 * Keyed by Player.shortName — players missing here fall back to their club country.
 */
export const NATIONALITY_BY_SHORT_NAME: Record<string, string> = {
  // Real Madrid
  Courtois: 'Belgium', Carvajal: 'Spain', 'Militão': 'Brazil', 'Rüdiger': 'Germany', Mendy: 'France',
  Valverde: 'Uruguay', 'Tchouaméni': 'France', Bellingham: 'England', Rodrygo: 'Brazil', 'Mbappé': 'France',
  'Vinícius Jr.': 'Brazil', 'Modrić': 'Croatia', Brahim: 'Spain', Endrick: 'Brazil', 'Güler': 'Turkey',
  Camavinga: 'France', 'Vázquez': 'Spain', Lunin: 'Ukraine',

  // Manchester City
  Ederson: 'Brazil', Walker: 'England', Dias: 'Portugal', Akanji: 'Switzerland', Gvardiol: 'Croatia',
  Rodri: 'Spain', 'De Bruyne': 'Belgium', 'B. Silva': 'Portugal', Foden: 'England', Haaland: 'Norway',
  Doku: 'Belgium', 'Gündoğan': 'Germany', 'Kovačić': 'Croatia', Savinho: 'Brazil', Stones: 'England',
  Lewis: 'England', Ortega: 'Germany',

  // Barcelona
  'Ter Stegen': 'Germany', 'Koundé': 'France', 'Cubarsí': 'Spain', 'I. Martínez': 'Spain', Balde: 'Spain',
  Pedri: 'Spain', Gavi: 'Spain', Olmo: 'Spain', Yamal: 'Spain', Lewandowski: 'Poland', Raphinha: 'Brazil',
  Ferran: 'Spain', 'Fermín': 'Spain', 'Casadó': 'Spain', 'Pau Víctor': 'Spain', 'Peña': 'Spain',

  // Arsenal
  Raya: 'Spain', White: 'England', Saliba: 'France', Gabriel: 'Brazil', Timber: 'Netherlands',
  Rice: 'England', 'Ødegaard': 'Norway', Merino: 'Spain', Saka: 'England', Havertz: 'Germany',
  Martinelli: 'Brazil', Trossard: 'Belgium', Jesus: 'Brazil', Sterling: 'England', Partey: 'Ghana',
  Jorginho: 'Italy', Neto: 'Brazil',

  // Bayern München
  Neuer: 'Germany', Laimer: 'Austria', Kim: 'South Korea', Upamecano: 'France', Davies: 'Canada',
  Kimmich: 'Germany', Palhinha: 'Portugal', Olise: 'France', Musiala: 'Germany', 'Sané': 'Germany',
  Kane: 'England', 'Müller': 'Germany', Gnabry: 'Germany', Coman: 'France', Tel: 'France',
  Dier: 'England', Ulreich: 'Germany',

  // Argentina
  Dibu: 'Argentina', Molina: 'Argentina', Romero: 'Argentina', 'L. Martínez': 'Argentina',
  Tagliafico: 'Argentina', 'De Paul': 'Argentina', Enzo: 'Argentina', 'Mac Allister': 'Argentina',
  Messi: 'Argentina', 'Álvarez': 'Argentina', Lautaro: 'Argentina', Garnacho: 'Argentina',
  Paredes: 'Argentina', 'Lo Celso': 'Argentina', Otamendi: 'Argentina', Dybala: 'Argentina', Rulli: 'Argentina',

  // France
  Maignan: 'France', 'T. Hernández': 'France', Griezmann: 'France', 'Dembélé': 'France',
  Barcola: 'France', 'Kolo Muani': 'France', Thuram: 'France', Fofana: 'France', 'Konaté': 'France',
  Rabiot: 'France', Samba: 'France',

  // Liverpool
  Alisson: 'Brazil', 'Alexander-Arnold': 'England', 'Van Dijk': 'Netherlands', Robertson: 'Scotland',
  Gravenberch: 'Netherlands', Szoboszlai: 'Hungary', Salah: 'Egypt', 'Núñez': 'Uruguay',
  'Díaz': 'Colombia', Gakpo: 'Netherlands', Jota: 'Portugal', Chiesa: 'Italy', Jones: 'England',
  Endo: 'Japan', Kelleher: 'Ireland',
};

export const PACK_NATIONALITIES = [
  'Brazil', 'Argentina', 'France', 'England', 'Spain', 'Portugal', 'Germany', 'Netherlands',
  'Italy', 'Belgium', 'Croatia', 'Uruguay', 'Colombia', 'Norway', 'Sweden', 'Denmark',
  'Switzerland', 'Austria', 'Poland', 'Turkey', 'Ghana', 'Senegal', 'Nigeria', 'Morocco',
  'Ivory Coast', 'Algeria', 'Cameroon', 'Egypt', 'Japan', 'South Korea', 'Mexico', 'USA',
  'Canada', 'Serbia', 'Czechia', 'Scotland', 'Wales', 'Ireland', 'Ukraine', 'Hungary',
];

export function getNationality(shortName: string, fallback: string): string {
  return NATIONALITY_BY_SHORT_NAME[shortName] || fallback;
}
