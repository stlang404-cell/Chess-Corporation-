/**
 * Procedural opponent civilisation. An opponent is fully determined by an
 * integer id plus its (tier, style); nothing needs to be stored until the
 * player actually meets them. Met opponents get a persistent head-to-head
 * record in the save.
 */
import { STYLE_IDS, type StyleId } from '../engine/ai';

const REGIONS: { given: string[]; family: string[] }[] = [
  {
    // Japan
    given: ['Haruto', 'Yui', 'Ren', 'Aoi', 'Sota', 'Hina', 'Kaito', 'Mio', 'Riku', 'Sakura', 'Daichi', 'Emi', 'Takumi', 'Nanami', 'Kenji', 'Ayaka', 'Shun', 'Rina', 'Hiroshi', 'Kaori'],
    family: ['Tanaka', 'Sato', 'Watanabe', 'Kobayashi', 'Ishikawa', 'Mori', 'Fujita', 'Okada', 'Hayashi', 'Matsuda', 'Ueda', 'Nakamura', 'Kimura', 'Shimizu', 'Inoue', 'Takeda', 'Arai', 'Sakamoto', 'Kondo', 'Ono'],
  },
  {
    // Korea
    given: ['Minjun', 'Seoyeon', 'Jiho', 'Haeun', 'Dohyun', 'Jiwoo', 'Yejun', 'Sua', 'Hyunwoo', 'Chaewon', 'Taeyang', 'Eunji', 'Sungmin', 'Dahye', 'Joon'],
    family: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Han', 'Seo', 'Shin', 'Oh', 'Hwang', 'Song', 'Baek', 'Jang'],
  },
  {
    // China
    given: ['Wei', 'Lin', 'Jun', 'Xiu', 'Hao', 'Mei', 'Yu', 'Fang', 'Lei', 'Ying', 'Tao', 'Qing', 'Bo', 'Xin', 'Rui'],
    family: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Ma', 'Hu', 'Guo'],
  },
  {
    // South Asia
    given: ['Aarav', 'Ananya', 'Vihaan', 'Diya', 'Arjun', 'Isha', 'Rohan', 'Priya', 'Kabir', 'Meera', 'Nikhil', 'Sanya', 'Dev', 'Kavya', 'Rahul'],
    family: ['Sharma', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Mehta', 'Gupta', 'Rao', 'Kapoor', 'Menon', 'Bose', 'Desai', 'Pillai', 'Joshi', 'Chopra'],
  },
  {
    // West Africa
    given: ['Chidi', 'Amara', 'Kwame', 'Adaeze', 'Tunde', 'Ngozi', 'Kofi', 'Ama', 'Emeka', 'Folake', 'Yaw', 'Zainab', 'Sekou', 'Ifeoma', 'Bayo'],
    family: ['Okafor', 'Mensah', 'Adeyemi', 'Owusu', 'Nwosu', 'Diallo', 'Boateng', 'Balogun', 'Asante', 'Eze', 'Traoré', 'Okonkwo', 'Ofori', 'Sow', 'Afolabi'],
  },
  {
    // East Africa
    given: ['Baraka', 'Wanjiru', 'Juma', 'Achieng', 'Tendai', 'Neema', 'Abebe', 'Makena', 'Kamau', 'Selam', 'Otieno', 'Amani'],
    family: ['Mwangi', 'Odhiambo', 'Kipchoge', 'Tesfaye', 'Mutua', 'Haile', 'Njoroge', 'Wekesa', 'Bekele', 'Kariuki', 'Moyo', 'Chebet'],
  },
  {
    // Middle East / North Africa
    given: ['Omar', 'Layla', 'Karim', 'Yasmin', 'Tariq', 'Nour', 'Samir', 'Rania', 'Hassan', 'Salma', 'Faris', 'Dalia', 'Youssef', 'Lina', 'Rami'],
    family: ['Haddad', 'Nasser', 'Khalil', 'Mansour', 'Saleh', 'Farouk', 'Aziz', 'Rahman', 'Darwish', 'Hamdan', 'Sabbagh', 'Tahan', 'Kassem', 'Halabi', 'Barakat'],
  },
  {
    // Europe (various)
    given: ['Lukas', 'Elena', 'Matteo', 'Sofia', 'Jonas', 'Ingrid', 'Pierre', 'Clara', 'Mateusz', 'Freya', 'Nikolai', 'Ana', 'Henrik', 'Lucía', 'Tomas', 'Marta', 'Emil', 'Irene'],
    family: ['Müller', 'Rossi', 'Novak', 'Lindqvist', 'Dubois', 'García', 'Kowalski', 'Jansen', 'Petrov', 'Costa', 'Andersen', 'Moreau', 'Horvat', 'Bianchi', 'Fischer', 'Silva', 'Virtanen', 'Ferreira'],
  },
  {
    // Americas
    given: ['Mateo', 'Valentina', 'Santiago', 'Camila', 'Diego', 'Isabela', 'Ethan', 'Grace', 'Gabriel', 'Luna', 'Caleb', 'Maya', 'Joaquín', 'Ava', 'Rafael'],
    family: ['Hernández', 'Martínez', 'Oliveira', 'Carter', 'Brooks', 'Ramírez', 'Santos', 'Morales', 'Bennett', 'Castillo', 'Reyes', 'Hayes', 'Vargas', 'Sullivan', 'Mendoza'],
  },
  {
    // Southeast Asia / Oceania
    given: ['Anh', 'Siti', 'Bayu', 'Mai', 'Rizal', 'Linh', 'Aroha', 'Tane', 'Putri', 'Minh', 'Kalani', 'Dewi', 'Nikau', 'Thao', 'Arief'],
    family: ['Nguyen', 'Tran', 'Santoso', 'Pham', 'Wijaya', 'Reyes', 'Tanaka-Ngata', 'Le', 'Halim', 'Kusuma', 'Parata', 'Vo', 'Lim', 'Hartono', 'Walker'],
  },
];

export function hash32(n: number): number {
  n = (n ^ 0x9e3779b9) | 0;
  n = Math.imul(n ^ (n >>> 16), 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return (n ^ (n >>> 16)) >>> 0;
}

export interface Crest {
  shape: 'circle' | 'diamond' | 'hexagon' | 'square' | 'octagon';
  mark: number; // index into crest marks
  ink: string;
  ring: boolean;
}
const CREST_SHAPES: Crest['shape'][] = ['circle', 'diamond', 'hexagon', 'square', 'octagon'];
export const CREST_MARKS = ['一', '十', '山', '川', '木', '日', '月', '水', '火', '金', '土', '石', '竹', '心', '王', '玉', '光', '風', '空', '花'];
const INKS = ['#1d1d1b', '#3a3a38', '#5c564c', '#8b3a2b', '#7a6431', '#334452', '#3d4d3a'];

export interface OpponentIdentity {
  id: number;
  name: string;
  initials: string;
  crest: Crest;
  bio: string;
}

const BIOS = [
  'Joined from a rival conglomerate.',
  'Rose through the night-shift ladder.',
  'Known for long, silent thinks.',
  'Collects antique boards.',
  'Plays every lunch break.',
  'Former regional champion.',
  'Learned on a folding board in the break room.',
  'Rumoured to study endgames on the train.',
  'Never misses a quarterly tournament.',
  'Keeps a notebook of every loss.',
  'Transferred in from the overseas office.',
  'Calm under time pressure.',
];

export function identityOf(id: number): OpponentIdentity {
  const h = hash32(id);
  const h2 = hash32(id ^ 0x5bd1e995);
  const region = REGIONS[h % REGIONS.length];
  const given = region.given[(h >>> 8) % region.given.length];
  const family = region.family[(h2 >>> 4) % region.family.length];
  const crest: Crest = {
    shape: CREST_SHAPES[(h2 >>> 12) % CREST_SHAPES.length],
    mark: (h2 >>> 16) % CREST_MARKS.length,
    ink: INKS[(h >>> 20) % INKS.length],
    ring: ((h2 >>> 24) & 1) === 1,
  };
  return {
    id,
    name: `${given} ${family}`,
    initials: given[0] + family[0],
    crest,
    bio: BIOS[(h >>> 4) % BIOS.length],
  };
}

/** Style of a procedurally generated opponent (stable per id). */
export function styleOf(id: number): StyleId {
  return STYLE_IDS[hash32(id * 31 + 7) % STYLE_IDS.length];
}

/**
 * League record abstraction for the broader population: rather than simulating
 * every bot's games, each bot is modelled as having played N games against a
 * population centred on its own rating, so its expected score is 50% with
 * binomial spread. Deterministic per id; real games vs the player are added on top.
 */
export function leagueRecord(id: number): { games: number; wins: number; draws: number; losses: number } {
  const h = hash32(id * 977 + 3);
  const games = 40 + (h % 900);
  const drawRate = 0.18 + ((h >>> 10) % 10) / 100;
  const draws = Math.round(games * drawRate);
  const decisive = games - draws;
  // binomial-ish spread around 50%: sum of uniform deviates
  const u = (((h >>> 14) % 1000) / 1000 + ((h >>> 4) % 1000) / 1000 - 1) * Math.sqrt(decisive) * 0.6;
  const wins = Math.max(0, Math.min(decisive, Math.round(decisive / 2 + u)));
  return { games, wins, draws, losses: decisive - wins };
}
