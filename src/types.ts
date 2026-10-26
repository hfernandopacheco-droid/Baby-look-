export type EventType =
  | 'lactancia'
  | 'biberon'
  | 'solidos'
  | 'bombeo'
  | 'panal'
  | 'sueno'
  | 'paseo'
  | 'bano'
  | 'peso'
  | 'largo'
  | 'cabeza'
  | 'temperatura'
  | 'medicina'
  | 'juego'
  | 'hito'
  | 'animo';

export type DiaperSubType = 'Mojado' | 'Sucio' | 'Mixto' | 'Limpio';
export type BreastSide = 'I' | 'D' | 'Ambos';

export interface BabyUser {
  id: string;
  babyName: string;
  email?: string;
  password?: string;
  birthDate?: string;
  gender?: 'niño' | 'niña' | 'neutral';
  photo?: string;
  height?: number;
  weight?: number;
  createdAt: number;
}

export interface BabyEvent {
  id: string;
  type: EventType;
  subType?: string; // Mojado / Sucio / Mixto or custom
  side?: BreastSide; // I / D / Ambos
  amount?: number; // ml for bottles, grams for solids
  duration?: number; // in seconds
  notes?: string;
  temp?: number; // temperature in Celsius
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
}

export interface GrowthRecord {
  id: string;
  type: 'peso' | 'largo' | 'cabeza'; // peso in kg, largo in cm, cabeza in cm
  value: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface VaccineItem {
  id: string;
  name: string;
  ageMonth: number;
  ageLabel: string;
  dose: string;
  disease: string;
  explain: string;
  applied?: boolean;
  appliedDate?: string;
  lote?: string;
  notas?: string;
  isCustom?: boolean;
}

export type PantryCategory = 'Frutas' | 'Verduras' | 'Proteína' | 'Cereales' | 'Lácteos' | 'Pasta' | 'Otros';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  addedAt: string;
}

export interface RecipeIngredient {
  name: string;
  grams?: number;
  notes?: string;
  amount?: string;
}

export type RecipeCategory = string;

export interface Recipe {
  id: string;
  title: string;
  name?: string;
  category: string; // 'desayunos' | 'almuerzos' | 'blw' | 'untables' | 'bebidas' | 'postres' | 'unicos' | 'frios' | 'sopas' | 'colaciones'
  prepMin: number;
  cookMin: number;
  prepTime?: number;
  ageLabel: string; // "+6 meses", etc.
  minAgeMonths: number;
  ageMonths?: number;
  emoji?: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrition?: string;
  description?: string;
  storage?: string;
  tips?: string;
  pediatricTip?: string;
  allergens?: string;
  difficulty?: string;
  blwCut?: string;
  edadBebeMeses?: number;
  aptaParaEdad?: string;
}

export interface RecipeHistoryItem {
  id: string;
  recipe: Recipe;
  action: 'preparada' | 'guardada' | 'generada';
  timestamp: number;
  dateStr: string;
  notes?: string;
}

export type LanguageCode = 'es' | 'en' | 'ru' | 'pt' | 'pl' | 'fr' | 'de' | 'zh' | 'ar' | 'hi';
export type NavTab = 'inicio' | 'diario' | 'stats' | 'crecimiento' | 'vacunas' | 'nutricion';

export type CommunityReactionType = 'me_gusta' | 'me_encanta' | 'me_divierte';

export interface CommunityProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  bebeEdad?: string;
  followersCount: number;
  followingCount: number;
  createdAt: number | any;
}

export interface CommunityPost {
  id: string;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  texto: string;
  mediaUrls?: string[];
  mediaType?: 'foto' | 'video' | 'ninguno';
  likesCount: number;
  comentariosCount: number;
  compartidosCount: number;
  timestamp: number | any;
  userReaction?: CommunityReactionType | null;
}

export interface CommunityComment {
  id: string;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  texto: string;
  timestamp: number | any;
}

export interface CommunityFollow {
  id?: string;
  followerId: string;
  followingId: string;
  timestamp?: number | any;
}

export interface CommunityReport {
  id?: string;
  postId: string;
  reporterUid: string;
  motivo: string;
  timestamp: number | any;
}

declare global {
  const __APP_BUILD_TIME__: string;
  const __APP_VERSION__: string;
}
