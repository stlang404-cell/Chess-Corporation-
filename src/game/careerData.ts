/**
 * Authored career data for SEVEN v0.2.
 *
 * Five dimensions are kept separate (see docs/CAREER_ECONOMY.md):
 *   seniority step  — ordered responsibility level (0 Intern … 13 Chief officer)
 *   job family      — the function a player works in (cosmetic identity choice)
 *   scope           — team → department → division → business unit → company → …
 *   appointment     — the formal title = f(family, seniority) or an enterprise office
 *   honours         — cups, board seats, distinctions (never a job title)
 */

export type Scope = 'Team' | 'Department' | 'Division' | 'Business unit' | 'Company' | 'Group' | 'Enterprise';

/** Seniority steps of a functional ladder, with the number of grades in each. */
export const STEPS: { name: string; grades: number; scope: Scope; major?: boolean }[] = [
  { name: 'Intern', grades: 3, scope: 'Team' },
  { name: 'Junior', grades: 3, scope: 'Team' },
  { name: 'Professional', grades: 3, scope: 'Team' },
  { name: 'Senior professional', grades: 3, scope: 'Team' },
  { name: 'Lead', grades: 4, scope: 'Team' },
  { name: 'Team lead', grades: 4, scope: 'Team' },
  { name: 'Manager', grades: 4, scope: 'Department', major: true },
  { name: 'Senior manager', grades: 4, scope: 'Department' },
  { name: 'Director', grades: 4, scope: 'Division', major: true },
  { name: 'Senior director', grades: 4, scope: 'Division' },
  { name: 'Vice president', grades: 5, scope: 'Business unit', major: true },
  { name: 'Senior vice president', grades: 5, scope: 'Business unit' },
  { name: 'Executive vice president', grades: 5, scope: 'Company', major: true },
  { name: 'Chief officer', grades: 5, scope: 'Company', major: true },
];

export interface Family {
  id: string;
  name: string;
  /** words at least one of which must appear in every title of this family */
  keywords: string[];
  /** 14 titles, one per seniority step */
  titles: string[];
}

/** Standard pattern for families whose titles follow the common corporate grammar. */
function ladder(f: {
  intern: string;
  junior: string;
  base: string;
  senior?: string;
  lead: string;
  teamLead: string;
  dept: string; // "Finance" → Finance Manager, Director of Finance …
  evp?: string;
  chief: string;
}): string[] {
  return [
    f.intern,
    f.junior,
    f.base,
    f.senior ?? `Senior ${f.base}`,
    f.lead,
    f.teamLead,
    `${f.dept} Manager`,
    `Senior ${f.dept} Manager`,
    `Director of ${f.dept}`,
    `Senior Director of ${f.dept}`,
    `Vice President of ${f.dept}`,
    `Senior Vice President of ${f.dept}`,
    f.evp ?? `Executive Vice President of ${f.dept}`,
    f.chief,
  ];
}

export const FAMILIES: Family[] = [
  { id: 'finance', name: 'Finance', keywords: ['Financ'], titles: ladder({ intern: 'Finance Intern', junior: 'Junior Financial Analyst', base: 'Financial Analyst', lead: 'Lead Financial Analyst', teamLead: 'Finance Team Lead', dept: 'Finance', chief: 'Chief Financial Officer' }) },
  { id: 'accounting', name: 'Accounting', keywords: ['Account'], titles: ladder({ intern: 'Accounting Intern', junior: 'Accounting Assistant', base: 'Staff Accountant', senior: 'Senior Accountant', lead: 'Lead Accountant', teamLead: 'Accounting Supervisor', dept: 'Accounting', evp: 'Executive Vice President of Accounting', chief: 'Chief Accounting Officer' }) },
  { id: 'treasury', name: 'Treasury', keywords: ['Treasur'], titles: ladder({ intern: 'Treasury Intern', junior: 'Junior Treasury Analyst', base: 'Treasury Analyst', lead: 'Lead Treasury Analyst', teamLead: 'Treasury Team Lead', dept: 'Treasury', chief: 'Group Treasurer' }) },
  { id: 'operations', name: 'Operations', keywords: ['Operat'], titles: ladder({ intern: 'Operations Intern', junior: 'Operations Associate', base: 'Operations Analyst', lead: 'Lead Operations Analyst', teamLead: 'Operations Supervisor', dept: 'Operations', chief: 'Chief Operating Officer' }) },
  { id: 'supply', name: 'Supply Chain', keywords: ['Supply Chain'], titles: ladder({ intern: 'Supply Chain Intern', junior: 'Supply Chain Coordinator', base: 'Supply Chain Analyst', lead: 'Lead Supply Chain Planner', teamLead: 'Supply Chain Team Lead', dept: 'Supply Chain', chief: 'Chief Supply Chain Officer' }) },
  { id: 'procurement', name: 'Procurement', keywords: ['Procure', 'Purchas', 'Buyer'], titles: ladder({ intern: 'Procurement Intern', junior: 'Purchasing Assistant', base: 'Procurement Buyer', senior: 'Senior Procurement Buyer', lead: 'Lead Procurement Buyer', teamLead: 'Procurement Team Lead', dept: 'Procurement', chief: 'Chief Procurement Officer' }) },
  { id: 'strategy', name: 'Strategy', keywords: ['Strateg'], titles: ladder({ intern: 'Strategy Intern', junior: 'Junior Strategy Analyst', base: 'Strategy Analyst', lead: 'Lead Strategy Consultant', teamLead: 'Strategy Team Lead', dept: 'Strategy', evp: 'Executive Vice President of Corporate Strategy', chief: 'Chief Strategy Officer' }) },
  { id: 'research', name: 'Research', keywords: ['Research', 'Scien'], titles: ladder({ intern: 'Research Intern', junior: 'Research Assistant', base: 'Research Scientist', lead: 'Principal Research Scientist', teamLead: 'Research Team Lead', dept: 'Research', chief: 'Chief Research Officer' }) },
  {
    id: 'legal',
    name: 'Legal',
    keywords: ['Legal', 'Counsel', 'Paralegal'],
    titles: [
      'Legal Intern',
      'Paralegal',
      'Legal Counsel',
      'Senior Legal Counsel',
      'Lead Counsel',
      'Legal Team Lead',
      'Legal Manager',
      'Senior Legal Manager',
      'Director of Legal Affairs',
      'Senior Director of Legal Affairs',
      'Vice President of Legal Affairs',
      'Senior Vice President of Legal Affairs',
      'Executive Vice President and General Counsel',
      'Chief Legal Officer',
    ],
  },
  { id: 'hr', name: 'Human Resources', keywords: ['Human Resources', 'HR'], titles: ladder({ intern: 'Human Resources Intern', junior: 'HR Assistant', base: 'HR Specialist', lead: 'HR Business Partner', teamLead: 'HR Team Lead', dept: 'Human Resources', chief: 'Chief Human Resources Officer' }) },
  {
    id: 'engineering',
    name: 'Engineering',
    keywords: ['Engineer', 'Developer', 'Technology'],
    titles: [
      'Engineering Intern',
      'Junior Developer',
      'Software Engineer',
      'Senior Software Engineer',
      'Staff Engineer',
      'Engineering Team Lead',
      'Engineering Manager',
      'Senior Engineering Manager',
      'Director of Engineering',
      'Senior Director of Engineering',
      'Vice President of Engineering',
      'Senior Vice President of Engineering',
      'Executive Vice President of Technology',
      'Chief Technology Officer',
    ],
  },
  { id: 'it', name: 'Information Technology', keywords: ['IT', 'Information', 'Systems'], titles: ladder({ intern: 'IT Intern', junior: 'IT Support Technician', base: 'Systems Administrator', lead: 'Lead Systems Engineer', teamLead: 'IT Team Lead', dept: 'Information Technology', chief: 'Chief Information Officer' }) },
  { id: 'data', name: 'Data & Analytics', keywords: ['Data', 'Analytics'], titles: ladder({ intern: 'Data Intern', junior: 'Junior Data Analyst', base: 'Data Analyst', lead: 'Lead Data Scientist', teamLead: 'Analytics Team Lead', dept: 'Analytics', evp: 'Executive Vice President of Data and Analytics', chief: 'Chief Data Officer' }) },
  { id: 'security', name: 'Security', keywords: ['Security'], titles: ladder({ intern: 'Security Intern', junior: 'Junior Security Analyst', base: 'Security Analyst', lead: 'Lead Security Engineer', teamLead: 'Security Team Lead', dept: 'Security', evp: 'Executive Vice President of Information Security', chief: 'Chief Information Security Officer' }) },
  { id: 'marketing', name: 'Marketing', keywords: ['Marketing'], titles: ladder({ intern: 'Marketing Intern', junior: 'Marketing Assistant', base: 'Marketing Specialist', lead: 'Lead Marketing Strategist', teamLead: 'Marketing Team Lead', dept: 'Marketing', chief: 'Chief Marketing Officer' }) },
  {
    id: 'sales',
    name: 'Sales',
    keywords: ['Sales', 'Account', 'Revenue'],
    titles: [
      'Sales Intern',
      'Sales Development Representative',
      'Account Executive',
      'Senior Account Executive',
      'Strategic Account Lead',
      'Sales Team Lead',
      'Sales Manager',
      'Senior Sales Manager',
      'Director of Sales',
      'Senior Director of Sales',
      'Vice President of Sales',
      'Senior Vice President of Sales',
      'Executive Vice President of Sales',
      'Chief Revenue Officer',
    ],
  },
  { id: 'communications', name: 'Communications', keywords: ['Communications'], titles: ladder({ intern: 'Communications Intern', junior: 'Communications Assistant', base: 'Communications Specialist', lead: 'Lead Communications Strategist', teamLead: 'Communications Team Lead', dept: 'Communications', evp: 'Executive Vice President of Corporate Communications', chief: 'Chief Communications Officer' }) },
  { id: 'compliance', name: 'Risk & Compliance', keywords: ['Compliance', 'Risk'], titles: ladder({ intern: 'Compliance Intern', junior: 'Compliance Assistant', base: 'Compliance Analyst', lead: 'Lead Risk Analyst', teamLead: 'Compliance Team Lead', dept: 'Risk and Compliance', chief: 'Chief Risk Officer' }) },
  { id: 'customer', name: 'Customer Experience', keywords: ['Customer'], titles: ladder({ intern: 'Customer Experience Intern', junior: 'Customer Service Representative', base: 'Customer Success Specialist', lead: 'Lead Customer Success Specialist', teamLead: 'Customer Service Team Lead', dept: 'Customer Experience', chief: 'Chief Customer Officer' }) },
  {
    id: 'administration',
    name: 'Administration',
    keywords: ['Administ', 'Office', 'Corporate Services'],
    titles: [
      'Office Intern',
      'Office Assistant',
      'Administrative Specialist',
      'Senior Administrative Specialist',
      'Lead Office Administrator',
      'Office Supervisor',
      'Office Manager',
      'Senior Office Manager',
      'Director of Administration',
      'Senior Director of Administration',
      'Vice President of Administration',
      'Senior Vice President of Administration',
      'Executive Vice President of Corporate Services',
      'Chief Administrative Officer',
    ],
  },
  { id: 'design', name: 'Design', keywords: ['Design'], titles: ladder({ intern: 'Design Intern', junior: 'Junior Designer', base: 'Designer', senior: 'Senior Designer', lead: 'Lead Designer', teamLead: 'Design Team Lead', dept: 'Design', chief: 'Chief Design Officer' }) },
  { id: 'quality', name: 'Quality', keywords: ['Quality'], titles: ladder({ intern: 'Quality Intern', junior: 'Quality Inspector', base: 'Quality Engineer', lead: 'Lead Quality Engineer', teamLead: 'Quality Team Lead', dept: 'Quality', chief: 'Chief Quality Officer' }) },
  { id: 'sustainability', name: 'Sustainability', keywords: ['Sustainab'], titles: ladder({ intern: 'Sustainability Intern', junior: 'Sustainability Coordinator', base: 'Sustainability Analyst', lead: 'Lead Sustainability Analyst', teamLead: 'Sustainability Team Lead', dept: 'Sustainability', chief: 'Chief Sustainability Officer' }) },
];

export const DEFAULT_FAMILY = 'strategy';
export const familyById = (id: string) => FAMILIES.find((f) => f.id === id) ?? FAMILIES.find((f) => f.id === DEFAULT_FAMILY)!;

/** General-management track that follows any functional chief-officer role. */
export const GM_TITLES: { title: string; scope: Scope }[] = [
  { title: 'Business Unit President', scope: 'Business unit' },
  { title: 'Group President', scope: 'Group' },
  { title: 'President', scope: 'Company' },
  { title: 'Chief Executive Officer', scope: 'Company' },
];
export const GM_GRADES = 5;

/** The player's first employer: functional and general-management careers happen here. */
export const HOME_COMPANY = { name: 'Seven Meridian Corporation', city: 'Tokyo', hq: 'Meridian Tower' };

export type ScaleClass = 'Regional company' | 'National group' | 'International group' | 'Multinational group' | 'Global holding company';

export interface Institution {
  name: string;
  city: string;
  hq: string;
  sector: string;
  scale: ScaleClass;
}

/**
 * Authored institutions, ordered by size. After leading the home company the
 * player is appointed President, then CEO, of each larger institution in turn.
 */
export const INSTITUTIONS: Institution[] = [
  // Regional companies
  { name: 'Kitahama Industrial Company', city: 'Osaka', hq: 'Kitahama Tower', sector: 'Manufacturing', scale: 'Regional company' },
  { name: 'Hakata Harbour Logistics', city: 'Fukuoka', hq: 'Harbour House', sector: 'Logistics', scale: 'Regional company' },
  { name: 'Sendai Precision Works', city: 'Sendai', hq: 'Aoba Works', sector: 'Engineering', scale: 'Regional company' },
  { name: 'Kanazawa Lacquer & Craft', city: 'Kanazawa', hq: 'Kenroku Hall', sector: 'Consumer goods', scale: 'Regional company' },
  { name: 'Hokkaido Northern Foods', city: 'Sapporo', hq: 'Odori Building', sector: 'Food', scale: 'Regional company' },
  { name: 'Setouchi Shipping Company', city: 'Hiroshima', hq: 'Ujina Wharf Offices', sector: 'Shipping', scale: 'Regional company' },
  { name: 'Nagoya Motor Components', city: 'Nagoya', hq: 'Sakae Plaza', sector: 'Automotive', scale: 'Regional company' },
  { name: 'Kobe Pearl Trading', city: 'Kobe', hq: 'Meriken House', sector: 'Trading', scale: 'Regional company' },
  { name: 'Nara Heritage Hotels', city: 'Nara', hq: 'Deer Park Lodge', sector: 'Hospitality', scale: 'Regional company' },
  { name: 'Shizuoka Green Tea Company', city: 'Shizuoka', hq: 'Tea Exchange Hall', sector: 'Agriculture', scale: 'Regional company' },
  // National groups
  { name: 'Marunouchi Financial Group', city: 'Tokyo', hq: 'Marunouchi Tower', sector: 'Banking', scale: 'National group' },
  { name: 'Shinjuku Media Group', city: 'Tokyo', hq: 'West Gate Building', sector: 'Media', scale: 'National group' },
  { name: 'Yokohama Port Holdings', city: 'Yokohama', hq: 'Minato Mirai Center', sector: 'Infrastructure', scale: 'National group' },
  { name: 'Kansai Electric Railways', city: 'Kyoto', hq: 'Karasuma Station Offices', sector: 'Transport', scale: 'National group' },
  { name: 'Nihon Steel & Alloy', city: 'Kitakyushu', hq: 'Yawata Works', sector: 'Steel', scale: 'National group' },
  { name: 'Sakura Insurance Group', city: 'Tokyo', hq: 'Hibiya Building', sector: 'Insurance', scale: 'National group' },
  { name: 'Aozora Telecom', city: 'Tokyo', hq: 'Shiodome Tower', sector: 'Telecommunications', scale: 'National group' },
  { name: 'Mizuho Valley Pharmaceuticals', city: 'Osaka', hq: 'Doshomachi Laboratory', sector: 'Pharmaceuticals', scale: 'National group' },
  { name: 'Tohoku Energy Group', city: 'Sendai', hq: 'Hirose Power Building', sector: 'Energy', scale: 'National group' },
  { name: 'Japan Coastal Construction', city: 'Chiba', hq: 'Makuhari Offices', sector: 'Construction', scale: 'National group' },
  { name: 'Tsukiji Food Distribution', city: 'Tokyo', hq: 'Toyosu Market Offices', sector: 'Distribution', scale: 'National group' },
  { name: 'Hikari Electronics', city: 'Kawasaki', hq: 'Lightfield Campus', sector: 'Electronics', scale: 'National group' },
  // International groups
  { name: 'Pacific Rim Capital Group', city: 'Singapore', hq: 'Marina Tower', sector: 'Asset management', scale: 'International group' },
  { name: 'Seoul Han River Industries', city: 'Seoul', hq: 'Yeouido Center', sector: 'Industrials', scale: 'International group' },
  { name: 'Taipei Semiconductor Alliance', city: 'Taipei', hq: 'Xinyi Fab Offices', sector: 'Semiconductors', scale: 'International group' },
  { name: 'Mumbai Coastal Trading', city: 'Mumbai', hq: 'Nariman Point House', sector: 'Trading', scale: 'International group' },
  { name: 'Sydney Harbour Resources', city: 'Sydney', hq: 'Circular Quay Tower', sector: 'Mining', scale: 'International group' },
  { name: 'Jakarta Archipelago Logistics', city: 'Jakarta', hq: 'Sudirman Plaza', sector: 'Logistics', scale: 'International group' },
  { name: 'Vancouver Pacific Timber', city: 'Vancouver', hq: 'Burrard Inlet Offices', sector: 'Forestry', scale: 'International group' },
  { name: 'Istanbul Bosphorus Trading', city: 'Istanbul', hq: 'Levent Tower', sector: 'Trading', scale: 'International group' },
  { name: 'Nairobi Highlands Agritech', city: 'Nairobi', hq: 'Westlands Campus', sector: 'Agritech', scale: 'International group' },
  { name: 'Lisbon Atlantic Shipping', city: 'Lisbon', hq: 'Tagus Quay House', sector: 'Shipping', scale: 'International group' },
  { name: 'Mexico City Andina Foods', city: 'Mexico City', hq: 'Reforma Tower', sector: 'Food', scale: 'International group' },
  { name: 'Cairo Nile Infrastructure', city: 'Cairo', hq: 'Zamalek Building', sector: 'Infrastructure', scale: 'International group' },
  // Multinational groups
  { name: 'Meridian Pacific Holdings', city: 'Hong Kong', hq: 'Victoria Harbour Tower', sector: 'Diversified', scale: 'Multinational group' },
  { name: 'Northern Lights Energy', city: 'Oslo', hq: 'Fjord House', sector: 'Energy', scale: 'Multinational group' },
  { name: 'Rhine Valley Chemicals', city: 'Frankfurt', hq: 'Main Tower Offices', sector: 'Chemicals', scale: 'Multinational group' },
  { name: 'Atlantic Meridian Bank', city: 'London', hq: 'Thames Court', sector: 'Banking', scale: 'Multinational group' },
  { name: 'São Paulo Continental Group', city: 'São Paulo', hq: 'Paulista Tower', sector: 'Diversified', scale: 'Multinational group' },
  { name: 'Zürich Alpine Assurance', city: 'Zürich', hq: 'Paradeplatz House', sector: 'Insurance', scale: 'Multinational group' },
  { name: 'Lagos Gulf Industries', city: 'Lagos', hq: 'Victoria Island Tower', sector: 'Industrials', scale: 'Multinational group' },
  { name: 'New York Hudson Capital', city: 'New York', hq: 'Hudson Yards Tower', sector: 'Private equity', scale: 'Multinational group' },
  // Global holding companies
  { name: 'Seven Seas Global Holdings', city: 'Tokyo', hq: 'Seven Seas Tower', sector: 'Holding company', scale: 'Global holding company' },
  { name: 'Orion Worldwide Holdings', city: 'Singapore', hq: 'Orion Tower', sector: 'Holding company', scale: 'Global holding company' },
  { name: 'Continental Alliance Holdings', city: 'Geneva', hq: 'Lakeside Palais', sector: 'Holding company', scale: 'Global holding company' },
  { name: 'Meridian World Holdings', city: 'Tokyo', hq: 'Meridian Summit', sector: 'Holding company', scale: 'Global holding company' },
];

export const INSTITUTION_OFFICES = ['President', 'Chief Executive Officer'] as const;
export const OFFICE_GRADES = 5;

// ---------- procedural institutions ----------
export const PROC_ROOTS = [
  'Aokawa', 'Kitamura', 'Shirogane', 'Minase', 'Takanawa', 'Asahina', 'Kirishima', 'Hoshino', 'Yamabuki', 'Tachibana',
  'Ishikari', 'Kamogawa', 'Hanazono', 'Tsurugi', 'Akebono', 'Kasumi', 'Nishiki', 'Fujimori', 'Momiji', 'Sakaki',
  'Meridian', 'Solenne', 'Halcyon', 'Corvin', 'Altamira', 'Brightwater', 'Castellan', 'Delmar', 'Everton', 'Fairhaven',
  'Granville', 'Harrow', 'Ironwood', 'Kestrel', 'Larkspur', 'Marlowe', 'Northgate', 'Oakmont', 'Pemberton', 'Queensbury',
  'Ravenna', 'Sterling', 'Thornbury', 'Valencia', 'Westbrook', 'Ashdown', 'Belmont', 'Calder', 'Dunmore', 'Elmhurst',
  'Kaveri', 'Nilgiri', 'Zambezi', 'Kilimanjaro', 'Andalus', 'Patagonia', 'Tasman', 'Baltica', 'Caspian', 'Sahel',
];
export const PROC_REGIONS = [
  'Pacific', 'Atlantic', 'Northern', 'Southern', 'Eastern', 'Western', 'Continental', 'Coastal', 'Asia-Pacific', 'Nordic',
  'Mediterranean', 'Andean', 'Alpine', 'Caribbean', 'Gulf', 'Baltic', 'Iberian', 'Saharan', 'Siberian', 'Oceanic',
  'Highland', 'Delta', 'Isthmus', 'Archipelago',
];
export const PROC_TYPES = [
  'Holdings', 'Capital Group', 'Industries', 'Trading Company', 'Financial Group', 'Logistics Group', 'Technologies',
  'Energy Group', 'Infrastructure Group', 'Partners',
];
export const PROC_CITIES = [
  'Tokyo', 'Osaka', 'Singapore', 'Seoul', 'Hong Kong', 'Mumbai', 'Dubai', 'Nairobi', 'Lagos', 'Cairo', 'Istanbul',
  'Vienna', 'Zürich', 'London', 'Paris', 'Madrid', 'Lisbon', 'Oslo', 'Stockholm', 'Toronto', 'New York', 'Chicago',
  'Mexico City', 'São Paulo', 'Buenos Aires', 'Santiago', 'Sydney', 'Auckland', 'Jakarta', 'Bangkok',
];
export const PROC_HQ = ['Tower', 'House', 'Plaza', 'Centre', 'Court', 'Building', 'Campus', 'Exchange'];

/** Words that must never appear in any title (anti-inflation grammar rule). */
export const BANNED_WORDS = ['Supreme', 'Eternal', 'Emperor', 'Imperial', 'Infinite', 'Grand', 'Ultimate', 'Mega', 'Ultra', 'Overlord', 'Divine'];

// ---------- arenas ----------
export const MOTIFS = ['plain', 'seigaiha', 'asanoha', 'kikko', 'shippo', 'ichimatsu', 'uroko', 'yagasuri'] as const;
export type Motif = (typeof MOTIFS)[number];

/** Arenas for the 14 functional steps and the 4 general-management titles. */
export const STAGE_ARENAS: { name: string; kanji: string; accent: string; motif: Motif }[] = [
  { name: 'Mailroom Annex', kanji: '始', accent: '#7d7466', motif: 'plain' },
  { name: 'Copy Floor', kanji: '写', accent: '#4f7a68', motif: 'ichimatsu' },
  { name: 'Open-Plan Office', kanji: '机', accent: '#3d6593', motif: 'seigaiha' },
  { name: "Analysts' Gallery", kanji: '析', accent: '#8a6a3a', motif: 'shippo' },
  { name: 'Project Room', kanji: '案', accent: '#4a5b9a', motif: 'kikko' },
  { name: 'Team Lead Corner', kanji: '導', accent: '#7a4f7a', motif: 'uroko' },
  { name: "Managers' Garden", kanji: '庭', accent: '#2f7d5b', motif: 'asanoha' },
  { name: 'Department Hall', kanji: '課', accent: '#a0662e', motif: 'yagasuri' },
  { name: "Directors' Pavilion", kanji: '館', accent: '#2e3a6e', motif: 'yagasuri' },
  { name: 'Division Terrace', kanji: '部', accent: '#1f7a7a', motif: 'seigaiha' },
  { name: 'Vice Presidents\' Floor', kanji: '副', accent: '#5b4a8e', motif: 'kikko' },
  { name: 'Senior Leadership Wing', kanji: '翼', accent: '#8e3b5a', motif: 'shippo' },
  { name: 'Executive Floor', kanji: '執', accent: '#b8432c', motif: 'asanoha' },
  { name: 'C-Suite Terrace', kanji: '長', accent: '#a5853f', motif: 'uroko' },
  { name: 'Business Unit Hall', kanji: '事', accent: '#3b6ea8', motif: 'ichimatsu' },
  { name: 'Group Pavilion', kanji: '群', accent: '#2f5d4f', motif: 'seigaiha' },
  { name: "President's Office", kanji: '社', accent: '#9b3b2a', motif: 'kikko' },
  { name: 'Meridian Tower Summit', kanji: '峰', accent: '#b08d3c', motif: 'asanoha' },
];

export const INSTITUTION_KANJI = ['商', '港', '工', '漆', '食', '船', '車', '珠', '宿', '茶', '銀', '映', '浜', '鉄', '鋼', '保', '通', '薬', '電', '建', '市', '光', '資', '漢', '晶', '印', '豪', '島', '林', '橋', '農', '海', '墨', '河', '環', '北', '化', '岸', '南', '盾', '湾', '金', '七', '星', '盟', '頂'];
