export interface NormativeRule {
  ageRange: string;
  minMonths: number;
  maxMonths: number;
  sleep: {
    totalHours: string;
    wakeWindowMin: number;
    napsCount: string;
  };
  feeding: {
    frequency: string;
    notes: string;
  };
  diaper: {
    wet: string;
    dirty: string;
  };
}

export const NORMATIVE_TABLES: NormativeRule[] = [
  {
    ageRange: '0-3 meses',
    minMonths: 0,
    maxMonths: 3,
    sleep: { totalHours: '14-17h', wakeWindowMin: 75, napsCount: '4-5 siestas' },
    feeding: { frequency: '8-12 veces al día', notes: 'Lactancia materna o fórmula a demanda' },
    diaper: { wet: '6+ mojados', dirty: '3-4 sucios' }
  },
  {
    ageRange: '4-6 meses',
    minMonths: 4,
    maxMonths: 6,
    sleep: { totalHours: '12-16h', wakeWindowMin: 135, napsCount: '3 siestas' },
    feeding: { frequency: '6-8 veces al día', notes: 'Inicio posible de alimentación complementaria (sólidos)' },
    diaper: { wet: '5-6 mojados', dirty: '1-3 sucios' }
  },
  {
    ageRange: '6-9 meses',
    minMonths: 6,
    maxMonths: 9,
    sleep: { totalHours: '12-15h', wakeWindowMin: 165, napsCount: '2 siestas' },
    feeding: { frequency: '4-6 veces + sólidos', notes: 'Alimentación complementaria activa' },
    diaper: { wet: '4-5 mojados', dirty: '1-2 sucios' }
  },
  {
    ageRange: '9-12 meses',
    minMonths: 9,
    maxMonths: 12,
    sleep: { totalHours: '11-14h', wakeWindowMin: 210, napsCount: '2 siestas' },
    feeding: { frequency: '3-5 veces + 3 comidas sólidas', notes: 'Sólidos variados y leche' },
    diaper: { wet: '4-5 mojados', dirty: '1-2 sucios' }
  }
];

export interface AvatarConfig {
  sex: 'niño' | 'niña' | 'neutral';
  skinTone: string; // hex or tailwind class
  eyeShape: 'normal' | 'happy' | 'sleepy' | 'star';
  clothes: string; // id of outfit item
  unlockedOutfits: string[]; // ids
  unlockedMilestones: string[]; // ids
  bondScore: number; // 0 - 100
  lastLogTimestamp: number;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  sex: 'neutral',
  skinTone: '#ffd1b3',
  eyeShape: 'happy',
  clothes: 'basic_onesie',
  unlockedOutfits: ['basic_onesie'],
  unlockedMilestones: [],
  bondScore: 85,
  lastLogTimestamp: Date.now()
};

export const OUTFITS_CATALOG = [
  { id: 'basic_onesie', name: 'Pijama Clásico', emoji: '👕', requirement: 'Inicial' },
  { id: 'dino_bib', name: 'Babero Dinosaurio', emoji: '🦖', requirement: 'Primer diente registrado' },
  { id: 'bear_kneepads', name: 'Rodilleras de Oso', emoji: '🧸', requirement: 'Primer gateo registrado' },
  { id: 'super_cape', name: 'Capa de Superhéroe', emoji: '🦸', requirement: 'Primeros sólidos' },
  { id: 'crown_hat', name: 'Gorrito de Rey/Reina', emoji: '👑', requirement: 'Primer hito / 1 mes' }
];
