import { BabyEvent, GrowthRecord, LanguageCode, PantryCategory, PantryItem, Recipe, EventType } from './types';
import { w3 } from './i18n';
import {
  getLocalizedRecipe,
  RECIPE_AGE_LABELS,
  RECIPE_BLW_CUTS,
  RECIPE_PREP_STEP,
  RECIPE_DIFFICULTY,
  RECIPE_VARIANT_LABEL
} from './recipeTranslations';

// Period calculation: SE() -> 'manana' | 'tarde' | 'noche'
export function SE(): 'manana' | 'tarde' | 'noche' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 13) return 'manana';
  if (hour >= 13 && hour < 20) return 'tarde';
  return 'noche';
}

// Get dynamic non-repeating welcome message for the user, language and period
export function getDynamicWelcome(babyName: string, userId: string, lang: LanguageCode): { greeting: string; message: string } {
  const period = SE();
  const langConfig = w3[lang] || w3.es;
  const greeting = langConfig.greet[period];
  const list = langConfig[period];

  const storageKey = `bubblo_welcome_used_${userId}_${lang}_${period}`;
  let usedIndices: number[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) usedIndices = JSON.parse(raw);
  } catch (e) {
    usedIndices = [];
  }

  // If all messages have been used, reset the cycle
  if (usedIndices.length >= list.length) {
    usedIndices = [];
  }

  // Find remaining indices
  const availableIndices = list.map((_, i) => i).filter(i => !usedIndices.includes(i));
  const chosenIndex = availableIndices.length > 0 
    ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
    : 0;

  usedIndices.push(chosenIndex);
  try {
    localStorage.setItem(storageKey, JSON.stringify(usedIndices));
  } catch (e) {
    // ignore
  }

  const rawTemplate = list[chosenIndex] || list[0];
  const message = rawTemplate.replace(/\{bebe\}/g, babyName || 'tu bebé');

  return { greeting, message };
}

// W7(birthDate): Long human readable baby age
export function W7(birthDateStr?: string): string {
  if (!birthDateStr) return 'Recién nacido';
  const birth = new Date(birthDateStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return 'Recién nacido';

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) return '0 días';
  if (months === 0) return `${days} días`;
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    return remMonths > 0 ? `${years} año${years > 1 ? 's' : ''} y ${remMonths} m` : `${years} año${years > 1 ? 's' : ''}`;
  }
  return `${months} meses y ${days} días`;
}

// zz(birthDate): Short compact age
export function zz(birthDateStr?: string): string {
  if (!birthDateStr) return '0m 0d';
  const birth = new Date(birthDateStr);
  const now = new Date();
  if (isNaN(birth.getTime())) return '0m 0d';

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) return '0m 0d';
  return `${months}m ${days}d`;
}

// B7(seconds): 00:00:00 stopwatch format
export function B7(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

// g9(seconds): readable duration e.g. "1h 20m 15s" or "15m 12s" or "45s"
export function g9(totalSeconds: number): string {
  const s = totalSeconds && totalSeconds > 0 ? totalSeconds : 0;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}

// kE(text): detects diaper subType from text or notes
export function kE(text?: string): 'Mojado' | 'Sucio' | 'Mixto' | 'Limpio' {
  if (!text) return 'Mojado';
  const lower = text.toLowerCase();
  const hasClean = lower.includes('limp') || lower.includes('clean');
  if (hasClean) return 'Limpio';
  const hasWet = lower.includes('pipi') || lower.includes('orina') || lower.includes('mojad') || lower.includes('wet');
  const hasDirty = lower.includes('caca') || lower.includes('popó') || lower.includes('popo') || lower.includes('suci') || lower.includes('dirty') || lower.includes('poop');
  if (hasWet && hasDirty) return 'Mixto';
  if (hasDirty) return 'Sucio';
  return 'Mojado';
}

// JE(name): Classifies ingredient into PantryCategory based on keyword analysis
export function JE(name: string): PantryCategory {
  const s = name.toLowerCase();
  
  // Frutas
  if (
    s.includes('manzan') || s.includes('pera') || s.includes('platan') || s.includes('banana') ||
    s.includes('fresa') || s.includes('arandan') || s.includes('mango') || s.includes('melocoton') ||
    s.includes('durazno') || s.includes('papaya') || s.includes('naranja') || s.includes('ciruela') ||
    s.includes('sandia') || s.includes('melon') || s.includes('fruta') || s.includes('caqui')
  ) {
    return 'Frutas';
  }

  // Verduras
  if (
    s.includes('calabaz') || s.includes('zanahori') || s.includes('calabacin') || s.includes('brocoli') ||
    s.includes('espinac') || s.includes('patata') || s.includes('papa') || s.includes('boniato') ||
    s.includes('batata') || s.includes('puerro') || s.includes('tomate') || s.includes('pepino') ||
    s.includes('pimiento') || s.includes('remolacha') || s.includes('guisante') || s.includes('judia') ||
    s.includes('verdura') || s.includes('lechuga')
  ) {
    return 'Verduras';
  }

  // Proteína
  if (
    s.includes('pollo') || s.includes('pavo') || s.includes('ternera') || s.includes('vaca') ||
    s.includes('carne') || s.includes('merluza') || s.includes('pescado') || s.includes('salmon') ||
    s.includes('huevo') || s.includes('yema') || s.includes('lenteja') || s.includes('garbanzo') ||
    s.includes('conejo') || s.includes('tofu') || s.includes('higado') || s.includes('bacalao')
  ) {
    return 'Proteína';
  }

  // Cereales
  if (
    s.includes('avena') || s.includes('arroz') || s.includes('quinoa') || s.includes('trigo') ||
    s.includes('pasta') || s.includes('fideo') || s.includes('pan') || s.includes('polenta') ||
    s.includes('maiz') || s.includes('cuscus') || s.includes('mijo') || s.includes('tapioca') ||
    s.includes('semola') || s.includes('cereal')
  ) {
    return 'Cereales';
  }

  // Lácteos
  if (
    s.includes('leche') || s.includes('yogur') || s.includes('yogurt') || s.includes('queso') ||
    s.includes('ricotta') || s.includes('requeson') || s.includes('mantequilla')
  ) {
    return 'Lácteos';
  }

  return 'Otros';
}

// Default base pantry Tf
export const Tf_BASE_PANTRY = [
  'Avena', 'Plátano', 'Manzana', 'Pera', 'Calabaza', 'Zanahoria',
  'Pollo', 'Huevo', 'Boniato', 'Aceite de oliva virgen extra', 'Brócoli', 'Arroz'
];

// qE: Recipe generator
// In normal mode, it evaluates which recipes from allRecipes match the pantry ingredients.
// In free mode, it generates creative nutritious baby recommendations avoiding duplicate history AB.
export function qE(
  pantry: PantryItem[],
  allRecipes: Recipe[],
  historyIds: string[],
  mode: 'normal' | 'free' = 'normal'
): { matched: Recipe[]; scoreMap: Record<string, number> } {
  const pantryNames = pantry.map(p => p.name.toLowerCase());
  const scoreMap: Record<string, number> = {};

  if (mode === 'normal') {
    const scored = allRecipes.map(r => {
      let matches = 0;
      r.ingredients.forEach(ing => {
        const iname = ing.name.toLowerCase();
        const hasMatch = pantryNames.some(p => iname.includes(p) || p.includes(iname.split(' ')[0]));
        if (hasMatch) matches++;
      });
      const ratio = r.ingredients.length > 0 ? matches / r.ingredients.length : 0;
      scoreMap[r.id] = Math.round(ratio * 100);
      return { recipe: r, ratio };
    });

    // Filter by having at least some match, or prioritize highest matches
    const filtered = scored
      .filter(item => item.ratio > 0.25 || pantryNames.length === 0)
      .sort((a, b) => b.ratio - a.ratio)
      .map(item => item.recipe);

    return { matched: filtered.slice(0, 15), scoreMap };
  } else {
    // Free mode: exclude recent history AB if possible to guarantee fresh variety
    const unseen = allRecipes.filter(r => !historyIds.includes(r.id));
    const pool = unseen.length >= 6 ? unseen : allRecipes;
    // Shuffle and pick
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    shuffled.forEach(r => {
      scoreMap[r.id] = Math.floor(Math.random() * 20) + 80;
    });
    return { matched: shuffled.slice(0, 12), scoreMap };
  }
}

// Date helper ensuring local date strings without UTC mismatch
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Check if an event belongs to today (checking date string or timestamp in local time)
export function isEventFromToday(ev: BabyEvent, targetDateStr?: string): boolean {
  const todayStr = targetDateStr || getLocalDateString();
  if (ev.date === todayStr) return true;
  if (ev.timestamp) {
    const d = new Date(ev.timestamp);
    if (getLocalDateString(d) === todayStr) return true;
  }
  return false;
}

// KE(): Diaper stats breakdown
export function KE(events: BabyEvent[]) {
  const diapers = events.filter(e => e.type === 'panal');
  let wet = 0;
  let dirty = 0;
  let mixed = 0;
  let clean = 0;
  diapers.forEach(d => {
    const sub = (d.subType || (d as any).tipo || '').toLowerCase();
    if (sub.includes('limp') || sub.includes('clean')) {
      clean++;
    } else if (sub.includes('mixt') || sub.includes('mix') || (sub.includes('mojad') && sub.includes('suci'))) {
      mixed++;
    } else if (sub.includes('suc') || sub.includes('dirt') || sub.includes('caca') || sub.includes('popó') || sub.includes('popo')) {
      dirty++;
    } else {
      wet++;
    }
  });
  return { total: diapers.length, wet, dirty, mixed, clean };
}

// LE(): Nursing / breastfeeding stats
export function LE(events: BabyEvent[]) {
  const nursing = events.filter(e => e.type === 'lactancia');
  let left = 0;
  let right = 0;
  let both = 0;
  let totalDuration = 0;

  nursing.forEach(n => {
    if (n.side === 'I') left++;
    else if (n.side === 'D') right++;
    else both++;
    totalDuration += n.duration || 0;
  });

  return {
    count: nursing.length,
    left,
    right,
    both,
    totalDuration,
    avgDuration: nursing.length > 0 ? Math.round(totalDuration / nursing.length) : 0
  };
}

// TE(): Sleep stats: day vs night (Día 7:00 a 19:00, Noche 19:00 a 7:00) with g9() h:m:s format
export function TE(events: BabyEvent[]) {
  const sleepEvents = events.filter(e => e.type === 'sueno');
  let daySeconds = 0;
  let nightSeconds = 0;
  let dayCount = 0;
  let nightCount = 0;

  sleepEvents.forEach(s => {
    const dur = s.duration || 0;
    const timeParts = (s.time || '12:00').split(':');
    const hour = parseInt(timeParts[0], 10) || 12;
    const isNight = hour >= 19 || hour < 7;
    if (isNight) {
      nightSeconds += dur;
      nightCount++;
    } else {
      daySeconds += dur;
      dayCount++;
    }
  });

  const totalSeconds = daySeconds + nightSeconds;
  return {
    totalSessions: sleepEvents.length,
    dayCount,
    nightCount,
    totalSeconds,
    daySeconds,
    nightSeconds,
    dayHours: g9(daySeconds),
    nightHours: g9(nightSeconds),
    totalHours: g9(totalSeconds)
  };
}

// ZE(): Bottles stats (total, avg, max, min in ml)
export function ZE(events: BabyEvent[]) {
  const bottles = events.filter(e => e.type === 'biberon');
  if (bottles.length === 0) {
    return { count: 0, totalMl: 0, avgMl: 0, maxMl: 0, minMl: 0 };
  }
  const amounts = bottles
    .map(b => Number(b.amount !== undefined ? b.amount : (b as any).cantidad || 0))
    .filter(a => !isNaN(a) && a > 0);

  if (amounts.length === 0) {
    return { count: bottles.length, totalMl: 0, avgMl: 0, maxMl: 0, minMl: 0 };
  }
  const totalMl = amounts.reduce((acc, v) => acc + v, 0);
  const avgMl = Math.round(totalMl / amounts.length);
  const maxMl = Math.max(...amounts);
  const minMl = Math.min(...amounts);
  return { count: bottles.length, totalMl, avgMl, maxMl, minMl };
}

// hE(): deduplicate growth records by date, sorts by timestamp ascending
export function hE(records: GrowthRecord[]): GrowthRecord[] {
  const map = new Map<string, GrowthRecord>();
  records.forEach(r => {
    const key = `${r.type}_${r.date}`;
    // Keep most recent if duplicate date
    const existing = map.get(key);
    if (!existing || r.timestamp >= existing.timestamp) {
      map.set(key, r);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
}

// QH(): Get latest weight, height and head from growth records
export function QH(records: GrowthRecord[]): { weight?: GrowthRecord; height?: GrowthRecord; head?: GrowthRecord } {
  const clean = hE(records);
  const weights = clean.filter(r => r.type === 'peso');
  const heights = clean.filter(r => r.type === 'largo');
  const heads = clean.filter(r => r.type === 'cabeza');
  return {
    weight: weights.length > 0 ? weights[weights.length - 1] : undefined,
    height: heights.length > 0 ? heights[heights.length - 1] : undefined,
    head: heads.length > 0 ? heads[heads.length - 1] : undefined
  };
}

// ================= ANIMACIONES Y FUNCIONES OBLIGATORIAS =================

// YA(C): Texto temporal (default 1200ms o durationMs especificado)
export function YA(text?: string, durationMs?: number) {
  if (!text || typeof document === 'undefined') return;
  const existing = document.querySelectorAll('.toast-ya');
  existing.forEach(el => el.remove());

  const toast = document.createElement('div');
  toast.className = 'toast-ya px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xl border pointer-events-none flex items-center gap-1.5 z-50';
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    toast.style.backgroundColor = '#0f172a';
    toast.style.color = '#fef3c7';
    toast.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.7)';
  } else {
    toast.style.backgroundColor = '#ffffff';
    toast.style.color = '#78350f';
    toast.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    toast.style.boxShadow = '0 10px 25px -5px rgba(245, 158, 11, 0.3)';
  }
  toast.style.top = '15%';
  toast.innerHTML = `<span>✨</span><span>${text}</span>`;
  document.body.appendChild(toast);

  const timeout = durationMs || 1500;
  setTimeout(() => {
    toast.remove();
  }, timeout);
}

// bA(n, E, C): Confeti con 6 emojis flotantes ✨💫⭐🌟💛🍼🌙🦱
// x: n+(random*80-40), y: E+(random*30-15) y setTimeout 900ms los borra
export function bA(x: number, y: number, text?: string) {
  if (typeof document === 'undefined') return;
  const emojis = ['✨', '💫', '⭐', '🌟', '💛', '🍼', '🌙', '🦱'];

  // Genera 6 emojis flotantes
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'floating-confetti-emoji';
    const chosen = emojis[Math.floor(Math.random() * emojis.length)];
    el.textContent = chosen;

    const offsetX = (Math.random() * 80) - 40;
    const offsetY = (Math.random() * 30) - 15;
    const posX = Math.max(10, Math.min(window.innerWidth - 30, x + offsetX));
    const posY = Math.max(10, Math.min(window.innerHeight - 30, y + offsetY));

    el.style.left = `${posX}px`;
    el.style.top = `${posY}px`;
    el.style.setProperty('--tx', `${(Math.random() * 60) - 30}px`);
    el.style.setProperty('--ty', `${-40 - (Math.random() * 50)}px`);
    el.style.setProperty('--trot', `${(Math.random() * 60) - 30}deg`);

    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 900);
  }

  if (text) {
    YA(text);
  }
}

// wH(n, e, C): Calcula getBoundingClientRect() centro y dispara confeti + YA(C)
export function wH(n: any, e: any, C?: string) {
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;

  if (e && e.currentTarget) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
  } else if (e && e.clientX && e.clientY) {
    cx = e.clientX;
    cy = e.clientY;
  }

  bA(cx, cy, C);
}

// PB(timestamp): Formatea hace cuánto tiempo ocurrió el último evento
export function PB(timestamp?: number): string {
  if (!timestamp) return 'sin reg.';
  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs < 0) return 'recién';
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays}d`;
}

// 16 Eventos W9 agrupados en TC
export const TC_GROUPS = {
  ALIMENTO: ['lactancia', 'biberon', 'solidos', 'bombeo'] as EventType[],
  ACTIVIDAD: ['panal', 'sueno', 'paseo', 'bano', 'animo'] as EventType[],
  CRECIMIENTO: ['peso', 'largo', 'cabeza'] as EventType[],
  SALUD: ['temperatura', 'medicina'] as EventType[],
  DESARROLLO: ['juego', 'hito'] as EventType[]
};

export const W9_EVENTS: Record<EventType, { label: string; emoji: string; color: string; hex: string; group: keyof typeof TC_GROUPS }> = {
  lactancia: { label: 'Lactancia', emoji: '🤱', color: 'emerald', hex: '#BBF7D0', group: 'ALIMENTO' },
  biberon: { label: 'Biberón', emoji: '🍼', color: 'sky', hex: '#BAE6FD', group: 'ALIMENTO' },
  solidos: { label: 'Sólidos', emoji: '🥣', color: 'amber', hex: '#FED7AA', group: 'ALIMENTO' },
  bombeo: { label: 'Bombeo', emoji: '💧', color: 'cyan', hex: '#A5F3FC', group: 'ALIMENTO' },
  panal: { label: 'Pañal', emoji: '🩲', color: 'yellow', hex: '#FEF08A', group: 'ACTIVIDAD' },
  sueno: { label: 'Sueño', emoji: '🌙', color: 'purple', hex: '#E9D5FF', group: 'ACTIVIDAD' },
  paseo: { label: 'Paseo', emoji: '🌳', color: 'blue', hex: '#BFDBFE', group: 'ACTIVIDAD' },
  bano: { label: 'Baño', emoji: '🛁', color: 'teal', hex: '#99F6E4', group: 'ACTIVIDAD' },
  peso: { label: 'Peso', emoji: '⚖️', color: 'pink', hex: '#FBCFE8', group: 'CRECIMIENTO' },
  largo: { label: 'Largo', emoji: '📏', color: 'lime', hex: '#D9F99D', group: 'CRECIMIENTO' },
  cabeza: { label: 'Cabeza', emoji: '🧠', color: 'rose', hex: '#FECDD3', group: 'CRECIMIENTO' },
  temperatura: { label: 'Temperatura', emoji: '🌡️', color: 'red', hex: '#FECACA', group: 'SALUD' },
  medicina: { label: 'Medicina', emoji: '💊', color: 'violet', hex: '#DDD6FE', group: 'SALUD' },
  juego: { label: 'Juego', emoji: '🧸', color: 'yellow', hex: '#FEF9C3', group: 'DESARROLLO' },
  hito: { label: 'Hito', emoji: '⭐', color: 'amber', hex: '#FEF3C7', group: 'DESARROLLO' },
  animo: { label: 'Ánimo', emoji: '😊', color: 'indigo', hex: '#DBEAFE', group: 'ACTIVIDAD' }
};

// Default quick cards yn & Cf quick events array
export const Cf = [
  { id: 'sueno' as EventType, icon: "🌙", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'lactancia' as EventType, icon: "🤱", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'panal' as EventType, icon: "🩲", bgLight: "bg-[#FEF3C7]", bgDark: "bg-[#3A2E2E]" },
  { id: 'biberon' as EventType, icon: "🍼", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'solidos' as EventType, icon: "🥣", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'bombeo' as EventType, icon: "💧", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'paseo' as EventType, icon: "🌳", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'bano' as EventType, icon: "🛁", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
];

export const yn: EventType[] = ['sueno', 'lactancia', 'panal', 'biberon', 'solidos', 'bombeo', 'paseo', 'bano'];

// crono(): detecta /^\d{2}:\d{2}:\d{2}$/ + DURACIÓN/EN CURSO en parent → aplica crono-bn white stroke black 34px
export function crono() {
  if (typeof document === 'undefined') return;
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
  const allElements = document.querySelectorAll('div, span, p');
  allElements.forEach(el => {
    const text = (el.textContent || '').trim();
    if (timeRegex.test(text)) {
      const parentText = (el.parentElement?.textContent || '').toUpperCase();
      if (parentText.includes('DURACIÓN') || parentText.includes('DURACION') || parentText.includes('EN CURSO') || parentText.includes('TIMER')) {
        el.classList.add('crono-bn');
      }
    }
  });
}

// quitarBanners(): setInterval 2500ms + window load 700ms,2000ms,3500ms + click 300ms
// Prohibido mostrar textos promocionales o banners V19/V10 guardado
export function quitarBanners() {
  if (typeof document === 'undefined') return;
  const clean = () => {
    // 1. Specific banner selectors
    const banners = document.querySelectorAll(
      'div.mt-6.opacity-40, div.pb-2.pt-6.opacity-30, [data-banner="true"], .ad-banner, .footer-promo'
    );
    banners.forEach(b => b.remove());

    // 2. Hide any unwanted legacy / banner text if present
    const elements = document.querySelectorAll('p, div, span, h1, h2, h3, header');
    elements.forEach(el => {
      const txt = (el.textContent || '').trim();
      if (
        txt.includes('Nutricion V19 fix Mati') ||
        txt.includes('EL UNIVERSO DE TU BEBÉ • 2026 • V10') ||
        txt.includes('Bienvenida Multi-Idioma + Peso/Largo Funcional') ||
        txt.includes('Estilo V3 guardado')
      ) {
        (el as HTMLElement).style.display = 'none';
      }
    });
  };

  clean();
  // Intervals and timeouts as requested: 700ms, 2000ms, 3500ms, click 300ms, setInterval 2500ms
  if (typeof window !== 'undefined') {
    [700, 2000, 3500].forEach(ms => setTimeout(clean, ms));
    window.addEventListener('click', () => setTimeout(clean, 300), { passive: true });
    setInterval(clean, 2500);
  }
}

// isLight(): detecta classList light/dark o data-theme o backgroundColor luminance >180
export function isLight(): boolean {
  if (typeof document === 'undefined') return true;
  const root = document.documentElement;
  const body = document.body;

  if (root.classList.contains('dark') || body?.classList.contains('dark')) return false;
  if (root.classList.contains('light') || body?.classList.contains('light')) return true;

  const dataTheme = root.getAttribute('data-theme') || body?.getAttribute('data-theme');
  if (dataTheme === 'dark') return false;
  if (dataTheme === 'light') return true;

  // Background luminance check > 180
  if (typeof window !== 'undefined' && body) {
    const bg = window.getComputedStyle(body).backgroundColor;
    const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance > 180;
    }
  }
  return true;
}

// corregirCamposBlancos(): detecta isLight() por classList light/dark o data-theme o backgroundColor luminance >180 → aplica dual inputs
// light input: bg white, color #111827
// dark input: bg rgba(40,40,65,0.95), color rgba(255,255,255,0.92), border 1px solid rgba(255,255,255,0.2)
export function corregirCamposBlancos() {
  if (typeof document === 'undefined') return;
  const light = isLight();
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select');

  inputs.forEach(input => {
    if (!light) {
      input.style.color = 'rgba(255, 255, 255, 0.92)';
      input.style.backgroundColor = 'rgba(40, 40, 65, 0.95)';
      input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    } else {
      input.style.color = '#111827';
      input.style.backgroundColor = '#ffffff';
      input.style.borderColor = '#fde68a';
    }
  });
}

// lapizMovible() y autoScrollFabPlus(): querySelectorAll div con textContent.trim()==='+' + closest('.quick-card') → _plus flag + click scroll
export function lapizMovible() {
  if (typeof document === 'undefined') return;
  const plusElements = document.querySelectorAll<HTMLElement>('div, span, button');
  plusElements.forEach(el => {
    if (el.textContent?.trim() === '+') {
      const card = el.closest('.quick-card');
      if (card) {
        (card as any)._plus = true;
        el.style.cursor = 'pointer';
      }
    }
  });
}

export function autoScrollFabPlus() {
  if (typeof document === 'undefined') return;
  const cards = document.querySelectorAll<HTMLElement>('.quick-card');
  cards.forEach(card => {
    if ((card as any)._plus && !card.getAttribute('data-scroll-bound')) {
      card.setAttribute('data-scroll-bound', 'true');
      card.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, { passive: true });
    }
  });
}

// ================= 20+ RECETAS BASE PEDIÁTRICAS PARA GENERADOR IA qE =================
export interface BaseAiRecipe {
  id: string;
  titleA: string;
  titleB: string;
  category: string;
  emoji: string;
  ingredients: { name: string; grams: number }[];
  steps: string[];
  nutrition: string;
  storage: string;
  tips: string;
}

export const BASE_AI_RECIPES: BaseAiRecipe[] = [
  {
    id: 'ai-base-1',
    titleA: 'Puré Dorado de Calabaza y Avena Suave',
    titleB: 'Crema Solar de Calabaza con Copos de Avena',
    category: 'desayunos',
    emoji: '🥣',
    ingredients: [{ name: 'Calabaza asada', grams: 60 }, { name: 'Avena integral', grams: 25 }, { name: 'Leche tibia', grams: 80 }],
    steps: ['Cocer la avena en la leche a fuego suave 5 min.', 'Añadir la calabaza previamente asada y triturar al gusto de {baby}.', 'Dejar entibiar antes de ofrecer.'],
    nutrition: 'Rico en betacarotenos, vitamina A y fibra soluble para el tracto digestivo de {baby}.',
    storage: 'Refrigerar hasta 24h en frasco hermético.',
    tips: 'Textura cremosa ideal para primeras cucharadas o método mixto.'
  },
  {
    id: 'ai-base-2',
    titleA: 'Bastoncitos BLW de Plátano y Avena al Horno',
    titleB: 'Barritas Tiernas de Plátano para Agarre Palmar',
    category: 'blw',
    emoji: '🍌',
    ingredients: [{ name: 'Plátano maduro', grams: 70 }, { name: 'Avena molida', grams: 40 }, { name: 'Canela de Ceilán', grams: 1 }],
    steps: ['Chafar el plátano e integrar la avena hasta masa maleable.', 'Formar bastones del grosor de un dedo adulto.', 'Hornear a 180°C durante 12 min hasta que no se rompan en la mano de {baby}.'],
    nutrition: 'Aporte de potasio y carbohidratos complejos de absorción lenta.',
    storage: 'Mantener en recipiente seco hasta 48 horas.',
    tips: 'Corte seguro para evitar atragantamiento en método BLW.'
  },
  {
    id: 'ai-base-3',
    titleA: 'Cazuelita de Pollo de Corral con Zanahoria y Patata',
    titleB: 'Guiso Tierno de Pollo con Hortalizas Dulces',
    category: 'almuerzos',
    emoji: '🍲',
    ingredients: [{ name: 'Pechuga de pollo', grams: 45 }, { name: 'Zanahoria', grams: 40 }, { name: 'Patata', grams: 50 }, { name: 'Aceite de oliva virgen', grams: 5 }],
    steps: ['Cocer el pollo y las hortalizas al vapor durante 18 minutos.', 'Desmenuzar finamente o chafar con tenedor adaptado a {baby}.', 'Rematar con hilo de aceite de oliva crudo.'],
    nutrition: 'Hierro de alta biodisponibilidad y proteínas esenciales para el crecimiento.',
    storage: 'Apto para congelar en porciones individuales.',
    tips: 'No añadir sal bajo ningún concepto en menores de 12 meses.'
  },
  {
    id: 'ai-base-4',
    titleA: 'Papilla Aterciopelada de Pera y Manzana al Romero',
    titleB: 'Compota sin Azúcar de Frutas de Huerta',
    category: 'colaciones',
    emoji: '🍐',
    ingredients: [{ name: 'Pera Williams', grams: 60 }, { name: 'Manzana Golden', grams: 60 }, { name: 'Agua mineral', grams: 30 }],
    steps: ['Pelar y trocear las frutas.', 'Cocer al vapor 10 min para ablandar pectinas.', 'Triturar suavemente y servir a temperatura ambiente para {baby}.'],
    nutrition: 'Alta digestibilidad y fibra suave que regula el tránsito intestinal.',
    storage: 'Consumir en el día o congelar en cubitos.',
    tips: 'Excelente opción si el bebé presenta heces duras.'
  },
  {
    id: 'ai-base-5',
    titleA: 'Crema de Brócoli y Patata con Aceite de Oliva',
    titleB: 'Sopita Verde Nutritiva de Arbolitos de Brócoli',
    category: 'sopas',
    emoji: '🥦',
    ingredients: [{ name: 'Brócoli fresco', grams: 50 }, { name: 'Patata tierna', grams: 50 }, { name: 'Aceite de oliva virgen extra', grams: 5 }],
    steps: ['Lavar el brócoli y cortar los ramilletes.', 'Hervir con la patata durante 14 minutos.', 'Triturar hasta lograr una textura aterciopelada que encante a {baby}.'],
    nutrition: 'Calcio vegetal, vitamina C y ácido fólico para el neurodesarrollo.',
    storage: 'Refrigerar máximo 24 horas.',
    tips: 'La grasa saludable del aceite potencia la absorción de vitaminas liposolubles.'
  },
  {
    id: 'ai-base-6',
    titleA: 'Hamburguesitas BLW de Pavo y Calabacín',
    titleB: 'Medallones Jugosos de Pavo para Manitas Pequeñas',
    category: 'blw',
    emoji: '🦃',
    ingredients: [{ name: 'Pavo picado', grams: 50 }, { name: 'Calabacín rallado', grams: 40 }, { name: 'Copo de avena', grams: 15 }],
    steps: ['Mezclar el pavo con calabacín escurrido y avena.', 'Moldear mini hamburguesas suaves.', 'Cocinar a la plancha a fuego medio-bajo 4 min por lado comprobando cocción completa para {baby}.'],
    nutrition: 'Proteína magra de fácil digestión y zinc inmunológico.',
    storage: 'Congelar separadas por papel vegetal hasta 2 meses.',
    tips: 'Textura elástica que se deshace con las encías sin desmigarse bruscamente.'
  },
  {
    id: 'ai-base-7',
    titleA: 'Puré de Lenteja Roja y Boniato al Vapor',
    titleB: 'Crema Digestiva de Lentejas Coral y Batata',
    category: 'unicos',
    emoji: '🍠',
    ingredients: [{ name: 'Lentejas rojas peladas', grams: 35 }, { name: 'Boniato', grams: 55 }, { name: 'Cúrcuma en polvo', grams: 0.5 }],
    steps: ['Lavar las lentejas rojas sin piel.', 'Cocer con el boniato en dados durante 15 min.', 'Pasar por pasapurés y añadir una pizca de cúrcuma suave para el paladar de {baby}.'],
    nutrition: 'Hierro vegetal de fácil asimilación sin pieles indigestas para el estómago infantil.',
    storage: 'Refrigerar 48h.',
    tips: 'Acompañar con fruta rica en vitamina C (naranja, fresa) para duplicar la absorción del hierro.'
  },
  {
    id: 'ai-base-8',
    titleA: 'Pudín Cremoso de Chía con Mango y Leche Materna',
    titleB: 'Vasito Tropical de Chía y Fruta para Bebé',
    category: 'postres',
    emoji: '🥭',
    ingredients: [{ name: 'Semillas de chía molidas', grams: 10 }, { name: 'Mango maduro triturado', grams: 50 }, { name: 'Leche', grams: 60 }],
    steps: ['Hidratar la chía molida en la leche durante 25 minutos.', 'Disponer una base de pulpa de mango puro.', 'Servir fresquito en merienda para {baby}.'],
    nutrition: 'Ácidos grasos Omega-3 esenciales y vitamina E antioxidante.',
    storage: 'Consumir en el día.',
    tips: 'Moler siempre las semillas de chía para garantizar su digestión total.'
  },
  {
    id: 'ai-base-9',
    titleA: 'Tortillita Francesa Tierna con Espinacas Picaditas',
    titleB: 'Rollito de Huevo y Verduras de Hoja Suave',
    category: 'almuerzos',
    emoji: '🍳',
    ingredients: [{ name: 'Huevo campero pasteurizado', grams: 50 }, { name: 'Espinaca fresca picada fina', grams: 15 }, { name: 'Aceite de oliva', grams: 3 }],
    steps: ['Batir el huevo muy bien con las espinacas picadas finísimas.', 'Cuajar en sartén antiadherente a fuego mínimo hasta que quede bien cocido por dentro.', 'Cortar en tiras largas para que {baby} lo sujete con facilidad.'],
    nutrition: 'Colina fosfatidil, luteína para la vista y proteínas de alto valor biológico.',
    storage: 'Consumir recién hecho.',
    tips: 'Asegurar cocción completa del huevo sin partes líquidas.'
  },
  {
    id: 'ai-base-10',
    titleA: 'Porridge Nórdico de Mijo y Manzana Asada',
    titleB: 'Gachas Doradas de Mijo Libre de Gluten',
    category: 'desayunos',
    emoji: '🌾',
    ingredients: [{ name: 'Mijo pelado', grams: 30 }, { name: 'Manzana al horno', grams: 50 }, { name: 'Agua purificada', grams: 100 }],
    steps: ['Enjuagar el mijo y cocer en agua a fuego suave 18 min.', 'Chafar la manzana asada e incorporar.', 'Servir tibio con cuchara suave a {baby}.'],
    nutrition: 'Cereal sin gluten rico en silicio, magnesio y hierro.',
    storage: 'Refrigerar 24h.',
    tips: 'Variación perfecta para alternar con la avena y el arroz.'
  },
  {
    id: 'ai-base-11',
    titleA: 'Fideos de Arroz con Merluza Desmigada al Limón',
    titleB: 'Pastita de Pescado Blanco del Cantábrico',
    category: 'almuerzos',
    emoji: '🐟',
    ingredients: [{ name: 'Filete de merluza fresca sin espinas', grams: 45 }, { name: 'Fideos de arroz para bebé', grams: 30 }, { name: 'Caldo suave de verduras', grams: 100 }],
    steps: ['Revisar al trasluz la merluza asegurando 0 espinas.', 'Cocer en el caldo de verduras durante 6 min junto a los fideos.', 'Desmigar con tenedor y templar para {baby}.'],
    nutrition: 'Pescado blanco bajo en grasa, rico en yodo y fósforo.',
    storage: 'Consumir en el acto.',
    tips: 'Siempre tocar con las yemas cada trozo de pescado antes de cocinar.'
  },
  {
    id: 'ai-base-12',
    titleA: 'Untable Sedoso de Aguacate y Yema al Vapor',
    titleB: 'Guacamole Pediátrico Suave sobre Pan Tierno',
    category: 'untables',
    emoji: '🥑',
    ingredients: [{ name: 'Aguacate maduro Hass', grams: 40 }, { name: 'Yema cocida', grams: 20 }, { name: 'Gota de limón', grams: 1 }],
    steps: ['Machacar el aguacate con un tenedor.', 'Rallar la yema bien cocida por encima.', 'Mezclar hasta obtener una crema homogénea untable para {baby}.'],
    nutrition: 'Grasas monoinsaturadas cardiosaludables y fosfolípidos cerebrales.',
    storage: 'Preparar justo antes de comer para evitar oxidación.',
    tips: 'Apto para untar en corteza de pan blanda en método BLW.'
  },
  {
    id: 'ai-base-13',
    titleA: 'Sopa de Estrellitas con Caldo Casero de Puerro',
    titleB: 'Consomé Suave Tradicional para Días Frescos',
    category: 'sopas',
    emoji: '⭐',
    ingredients: [{ name: 'Pasta estrellitas', grams: 30 }, { name: 'Puerro y calabaza', grams: 50 }, { name: 'Agua purificada', grams: 150 }],
    steps: ['Hacer un caldo hirviendo puerro y calabaza 20 min.', 'Colar y cocinar las estrellitas en el caldo caliente 7 min.', 'Comprobar que los fideos estén súper blanditos para {baby}.'],
    nutrition: 'Hidratación óptima y digestión placentera.',
    storage: 'Caldo congelable por 1 mes.',
    tips: 'Reconforta en días fríos o durante episodios de dentición.'
  },
  {
    id: 'ai-base-14',
    titleA: 'Mini Albóndigas de Ternera y Zanahoria Tiernas',
    titleB: 'Bocaditos de Ternera Esponjosos para Manitas',
    category: 'almuerzos',
    emoji: '🧆',
    ingredients: [{ name: 'Ternera magra picada 2 veces', grams: 50 }, { name: 'Zanahoria cocida rallada', grams: 30 }, { name: 'Miga de pan remojada', grams: 20 }],
    steps: ['Amasar la carne picada con zanahoria y miga para máxima ternura.', 'Bolear bolitas del tamaño de una nuez.', 'Cocinar al vapor o en salsa de tomate casera 15 min hasta tiernas para {baby}.'],
    nutrition: 'Hierro hemo de máxima absorción que previene anemias infantiles.',
    storage: 'Congelable en tupper.',
    tips: 'La miga de pan asegura que queden súper tiernas al morder.'
  },
  {
    id: 'ai-base-15',
    titleA: 'Compota de Ciruela y Manzana Calmante Digestiva',
    titleB: 'Puré de Ciruela Morada Antiestreñimiento',
    category: 'postres',
    emoji: '🍇',
    ingredients: [{ name: 'Ciruela claudia fresca', grams: 50 }, { name: 'Manzana dulce', grams: 50 }, { name: 'Canela suave', grams: 0.5 }],
    steps: ['Pelar la ciruela y retirar el hueso.', 'Cocer con la manzana al vapor 8 min.', 'Triturar hasta néctar denso y ofrecer a {baby}.'],
    nutrition: 'Sorbitol natural y fibra soluble que facilitan la evacuación sin cólicos.',
    storage: 'Refrigerar 48h.',
    tips: 'Recurso estrella de pediatras cuando el bebé retiene heces.'
  },
  {
    id: 'ai-base-16',
    titleA: 'Galletitas BLW de Quinoa, Plátano y Coco Rallado',
    titleB: 'Snacks Horneados Sin Azúcar Añadido',
    category: 'colaciones',
    emoji: '🍪',
    ingredients: [{ name: 'Copos de quinoa inflada', grams: 30 }, { name: 'Plátano bien maduro', grams: 70 }, { name: 'Coco rallado puro', grams: 10 }],
    steps: ['Chafar el plátano e integrar quinoa y coco.', 'Hacer discos planos sobre bandeja de horno.', 'Hornear 10 min a 170°C hasta dorar suavemente para {baby}.'],
    nutrition: 'Aminoácidos completos, triglicéridos de cadena media y energía natural.',
    storage: 'Lata hermética 3 días.',
    tips: 'Crujientes por fuera y tiernas por dentro.'
  },
  {
    id: 'ai-base-17',
    titleA: 'Papilla Multicolor de Guisantes y Calabacín',
    titleB: 'Crema Primaveral de Guisantes Dulces y Puerro',
    category: 'unicos',
    emoji: '🌱',
    ingredients: [{ name: 'Guisantes tiernos', grams: 45 }, { name: 'Calabacín sin piel', grams: 50 }, { name: 'Aceite de oliva virgen', grams: 5 }],
    steps: ['Hervir los guisantes y el calabacín 12 min.', 'Pasar por colador chino para retirar pieles de los guisantes.', 'Añadir aceite crudo y mezclar para {baby}.'],
    nutrition: 'Proteína vegetal, clorofila y fósforo.',
    storage: 'Refrigerar 24h.',
    tips: 'Pasar por colador evita que queden hollejos molestos.'
  },
  {
    id: 'ai-base-18',
    titleA: 'Yogur Natural Pasteurizado con Puré de Frambuesas',
    titleB: 'Copa Probiótica Rosa de Yogur y Frutos Rojos',
    category: 'postres',
    emoji: '🍓',
    ingredients: [{ name: 'Yogur natural sin azúcar ni edulcorantes', grams: 80 }, { name: 'Frambuesas o fresas cocidas', grams: 30 }],
    steps: ['Cocer las frambuesas 3 min y colar semillas.', 'Mezclar el coulis rojo sobre el yogur natural.', 'Ofrecer con cuchara ergonómica a {baby}.'],
    nutrition: 'Probióticos vivos para la microbiota intestinal y calcio lácteo biodisponible.',
    storage: 'Consumir de inmediato.',
    tips: 'A partir de los 9-10 meses según indicación del pediatra.'
  },
  {
    id: 'ai-base-19',
    titleA: 'Croquetitas al Horno de Salmón y Patata Dulce',
    titleB: 'Delicias Marineras de Salmón Sin Espinas',
    category: 'almuerzos',
    emoji: '🍣',
    ingredients: [{ name: 'Salmón fresco revisado', grams: 40 }, { name: 'Patata cocida machacada', grams: 60 }, { name: 'Eneldo seco', grams: 0.5 }],
    steps: ['Cocer el salmón al vapor y desmenuzar minuciosamente.', 'Mezclar con puré espeso de patata y pizca de eneldo.', 'Dar forma cilíndrica y hornear 10 min a 190°C para {baby}.'],
    nutrition: 'DHA y ácidos grasos Omega-3 fundamentales para el cerebro del bebé.',
    storage: 'Aptas para congelar ya horneadas.',
    tips: 'Ideal para comer con sus propias manitas.'
  },
  {
    id: 'ai-base-20',
    titleA: 'Sopa de Pollo de Corral con Fideos Cabellín',
    titleB: 'Caldo de la Abuela Reconfortante para Bebé',
    category: 'sopas',
    emoji: '🥣',
    ingredients: [{ name: 'Muslo de pollo deshuesado', grams: 50 }, { name: 'Zanahoria y puerro', grams: 50 }, { name: 'Fideos finos cabellín', grams: 25 }],
    steps: ['Hervir pollo y verduras 30 min espumando impurezas.', 'Añadir los fideos finos en el caldo colado 4 min.', 'Servir tibio con pollo deshilachado para {baby}.'],
    nutrition: 'Minerales en suspensión, colágeno natural y calor corporal.',
    storage: 'Refrigerar hasta 48 horas.',
    tips: 'El clásico infalible para días con menos apetito o catarro.'
  },
  {
    id: 'ai-base-21',
    titleA: 'Barquitas de Calabacín Rellenas de Ternera y Arroz',
    titleB: 'Canapés BLW de Huerta y Carne Magra',
    category: 'blw',
    emoji: '🛶',
    ingredients: [{ name: 'Calabacín tierno en mitades', grams: 70 }, { name: 'Carne picada de ternera', grams: 40 }, { name: 'Arroz cocido blando', grams: 25 }],
    steps: ['Vaciar el calabacín formando una barquita y cocinar al vapor 8 min.', 'Cocinar la carne con la pulpa del calabacín y mezclar con arroz.', 'Rellenar la barquita y hornear 5 min para que {baby} la agarre fácilmente.'],
    nutrition: 'Equilibrio de carbohidratos, minerales y proteínas.',
    storage: 'Consumir recién hecho.',
    tips: 'Comida completa y divertida que estimula su motricidad fina.'
  }
];

// Enhanced qE AI generator based on specs:
// - Modo normal: usa yA (pantry) + H (ingrediente principal)
// - Modo libre: usa H + E (lista nombres)
// - Toma qE base 20+ recetas base con titleA, titleB, ingredients, steps, nutrition, storage, tips, emoji
// - Shuffle N Fisher-Yates, V7 cantidad 1-10 (default 3)
// - Evita duplicados AB historial con Y.has(EA) + variante Variante {fA}
// - Si Tf despensa definida: añade paso inicial "Lavar y preparar {Tf}..."
// - Crea recetas con prepMin 10+random*8, cookMin 12+random*10, ageLabel +{max(4,min(12,w||6))} meses
// - Steps con {baby} reemplazado por o.name
export function generarRecetasIA_qE(
  pantry: PantryItem[],
  historyTitles: string[],
  mode: 'normal' | 'free',
  babyName: string = 'tu bebé',
  babyMonths: number = 6,
  quantity: number = 3,
  lang: LanguageCode = 'es'
): { recipes: Recipe[]; newHistoryTitles: string[] } {
  const historySet = new Set(historyTitles.map(t => t.toLowerCase().trim()));
  const targetAgeMonths = Math.max(4, Math.min(24, babyMonths || 6));
  const ageLabelTemplate = RECIPE_AGE_LABELS[lang] || RECIPE_AGE_LABELS.es;
  const ageLabel = ageLabelTemplate.replace('{n}', targetAgeMonths.toString());

  const generatedList: Recipe[] = [];
  const updatedHistory = [...historyTitles];

  // Estilos de preparación casera normal para hacer en casa
  const homeCookingStyles: {
    prefix: Record<LanguageCode, string>;
    cookType: string;
    emoji: string;
    category: string;
    prepMinutes: number;
    cookMinutes: number;
    stepGen: (items: string[], baby: string, age: number, lang: LanguageCode) => string[];
    tipsGen: (items: string[], baby: string, age: number) => string;
    blwAdvice: (age: number, lang: LanguageCode) => string;
  }[] = [
    {
      prefix: {
        es: "Puré casero cremoso de",
        en: "Creamy homemade puree of",
        pt: "Purê caseiro cremoso de",
        fr: "Purée maison onctueuse de",
        de: "Cremiges hausgemachtes Püree aus",
        ru: "Нежное домашнее пюре из",
        pl: "Kremowe domowe puree z",
        zh: "自制丝滑泥",
        ar: "بيوريه منزلي كريمي من",
        hi: "घर का बना मलाईदार प्यूरी"
      },
      cookType: 'puré',
      emoji: '🥣',
      category: 'unicos',
      prepMinutes: 10,
      cookMinutes: 12,
      stepGen: (items, baby, age) => [
        `Lavar muy bien y pelar ${items.join(' y ')}.`,
        `Cocinar al vapor durante 12-15 minutos hasta que estén completamente tiernos.`,
        age <= 8 
          ? `Triturar finamente o machacar con tenedor con unas gotas de aceite de oliva crudo para ${baby}.` 
          : `Machacar rústicamente dejando textura suave para que ${baby} comience a masticar.`,
        `Comprobar que la temperatura esté templada antes de servir a ${baby}.`
      ],
      tipsGen: (items, baby) => `Conserva el agua de cocción al vapor para ajustar la consistencia deseada por ${baby}.`,
      blwAdvice: (age) => age <= 8 
        ? "Ofrecer en cuchara precargada para que el bebé experimente llevarla a su boca."
        : "Servir en plato hondo con ventosa y permitir que explore con sus dedos o cubiertos infantiles."
    },
    {
      prefix: {
        es: "Bastoncitos tiernos al vapor de",
        en: "Tender steamed finger sticks of",
        pt: "Bastonetes macios no vapor de",
        fr: "Bâtonnets tendres à la vapeur de",
        de: "Zarte gedämpfte Gemüsesticks aus",
        ru: "Нежные паровые палочки из",
        pl: "Delikatne gotowane na parze słupki z",
        zh: "自制手指食物",
        ar: "أصابع طرية على البخار من",
        hi: "नरम भाप में पके फिंगर स्टिक्स"
      },
      cookType: 'blw',
      emoji: '🥕',
      category: 'blw',
      prepMinutes: 8,
      cookMinutes: 14,
      stepGen: (items, baby, age) => [
        `Cortar ${items.join(' y ')} en forma de bastón del tamaño del dedo índice de un adulto.`,
        `Cocer al vapor durante 12-14 minutos.`,
        `Verificar el punto: deben aplastarse fácilmente entre el pulgar y el índice sin romperse en seco.`,
        `Dejar enfriar unos minutos y colocar en la bandeja de ${baby} para su agarre palmar seguro.`
      ],
      tipsGen: (items, baby) => `El corte longitudinal facilita el agarre seguro y evita atragantamientos en ${baby}.`,
      blwAdvice: (age) => "Corte seguro en bastón: longitud de un dedo adulto. El bebé debe poder sostenerlo en su puño."
    },
    {
      prefix: {
        es: "Tortitas suaves a la sartén de",
        en: "Soft pan-cooked baby pancakes of",
        pt: "Panquecas macias de frigideira de",
        fr: "Galettes douces à la poêle de",
        de: "Weiche Pfannkuchen aus",
        ru: "Мягкие блинчики на сковороде из",
        pl: "Miękkie placuszki z patelni z",
        zh: "自制软松饼",
        ar: "فطائر مقلاة طرية من",
        hi: "नरम पैनकेक"
      },
      cookType: 'tortitas',
      emoji: '🥞',
      category: 'cenas',
      prepMinutes: 10,
      cookMinutes: 8,
      stepGen: (items, baby, age) => [
        `Rallar o triturar ${items.join(' y ')} en un recipiente hondo.`,
        `Mezclar con 1 cucharada de harina de avena o cereal y una gota de aceite.`,
        `Cocinar porciones pequeñas en sartén antiadherente a fuego medio-bajo 3 minutos por lado.`,
        `Retirar cuando estén doraditas pero tiernas por dentro y servir tibias a ${baby}.`
      ],
      tipsGen: (items, baby) => `Sin sal ni azúcar añadido: el sabor natural de los ingredientes fascina a ${baby}.`,
      blwAdvice: (age) => "Cortar en tiras alargadas si el bebé aún usa agarre palmar (6-9 meses) o en cuadraditos si usa pinza (9+ meses)."
    },
    {
      prefix: {
        es: "Sopita casera reconfortante con",
        en: "Comforting homemade soup with",
        pt: "Sopinha caseira reconfortante com",
        fr: "Soupe réconfortante maison à base de",
        de: "Wohltuende hausgemachte Suppe mit",
        ru: "Уютный домашний супчик с",
        pl: "Kojąca domowa zupka z",
        zh: "自制温馨浓汤",
        ar: "شوربة منزلية مهدئة مع",
        hi: "पौष्टिक घर का बना सूप"
      },
      cookType: 'sopas',
      emoji: '🍲',
      category: 'sopas',
      prepMinutes: 10,
      cookMinutes: 18,
      stepGen: (items, baby, age) => [
        `Picar ${items.join(' y ')} en trozos pequeños adecuados para la cocción.`,
        `Hervir en una ollita con agua limpia durante 15-20 minutos a fuego suave.`,
        age <= 8
          ? `Pasar por la batidora o pisar bien hasta lograr un caldito espeso y suave para ${baby}.`
          : `Dejar trocitos muy blandos en el caldo aromático para que ${baby} experimente masticar.`,
        `Servir tibio con un hilito de aceite de oliva virgen extra.`
      ],
      tipsGen: (items, baby) => `Excelente para hidratar y nutrir suavemente el organismo de ${baby}.`,
      blwAdvice: (age) => "Ofrecer en vasito abierto con ayuda o con cuchara honda pequeña."
    },
    {
      prefix: {
        es: "Guisito tierno de la abuela con",
        en: "Tender homestyle stew with",
        pt: "Guisadinho caseiro terno com",
        fr: "Petit mijoté tendre maison avec",
        de: "Zarter hausgemachter Eintopf mit",
        ru: "Нежное домашнее стью с",
        pl: "Delikatny domowy gulasz z",
        zh: "自制香炖慢煮",
        ar: "طاجن منزلي طري مع",
        hi: "नरम घरेलू स्टू"
      },
      cookType: 'almuerzos',
      emoji: '🥘',
      category: 'almuerzos',
      prepMinutes: 12,
      cookMinutes: 16,
      stepGen: (items, baby, age) => [
        `Rehogar suavemente ${items.join(' y ')} con dos gotas de aceite en cazuela sin dorar.`,
        `Cubrir con un vasito de agua o caldo casero sin sal y cocer a fuego lento 15 minutos.`,
        `Comprobar que todo esté perfectamente tierno y jugoso.`,
        `Servir en el plato favorito de ${baby} listo para disfrutar.`
      ],
      tipsGen: (items, baby) => `La cocción lenta potencia los azúcares naturales de los alimentos sin necesidad de condimentos.`,
      blwAdvice: (age) => "Textura súper melosa que se deshace en la boca con la encía."
    },
    {
      prefix: {
        es: "Compota natural sin azúcar de",
        en: "Natural sugar-free compote of",
        pt: "Compota natural sem açúcar de",
        fr: "Compote naturelle sans sucre de",
        de: "Natürliches zuckerfreies Kompott aus",
        ru: "Натуральный компот-пюре без сахара из",
        pl: "Naturalny kompot bez cukru z",
        zh: "天然无糖水果泥",
        ar: "كمبوت طبيعي بدون سكر من",
        hi: "बिना चीनी का ताजा कॉम्पोट"
      },
      cookType: 'postres',
      emoji: '🍎',
      category: 'postres',
      prepMinutes: 6,
      cookMinutes: 10,
      stepGen: (items, baby, age) => [
        `Pelar y descorazonar ${items.join(' y ')}.`,
        `Cocer en vaporera o en cazuela con 2 cucharadas de agua durante 8-10 minutos.`,
        `Chafar con tenedor o batir hasta lograr una compota sedosa y brillante para ${baby}.`,
        `Servir a temperatura ambiente o fresquita.`
      ],
      tipsGen: (items, baby) => `Digestión ligera y rica en fibra saludable para el confort digestivo de ${baby}.`,
      blwAdvice: (age) => "Ideal como postre o merienda nutritiva entre comidas."
    }
  ];

  // Si la mamá tiene productos en la despensa, generamos recetas basadas estrictamente en ellos
  const availablePantryNames = pantry.map(p => p.name.trim()).filter(Boolean);

  if (availablePantryNames.length > 0) {
    // Generar combinaciones de despensa evitando recetas repetidas en historySet
    const targetCount = Math.max(1, Math.min(6, quantity));

    // Barajar estilos de cocina
    const shuffledStyles = [...homeCookingStyles].sort(() => Math.random() - 0.5);

    let styleIdx = 0;
    let attempts = 0;

    while (generatedList.length < targetCount && attempts < 40) {
      attempts++;
      const currentStyle = shuffledStyles[styleIdx % shuffledStyles.length];
      styleIdx++;

      // Tomar 1 o 2 ingredientes de la despensa
      const shuffledPantry = [...availablePantryNames].sort(() => Math.random() - 0.5);
      const chosenItems = shuffledPantry.slice(0, Math.min(2, shuffledPantry.length));
      const itemsLabel = chosenItems.join(' y ');

      const prefix = currentStyle.prefix[lang] || currentStyle.prefix.es;
      const candidateTitle = `${prefix} ${itemsLabel}`;

      // Comprobar no repetición contra historySet
      if (historySet.has(candidateTitle.toLowerCase())) {
        continue; // Intentar con otro estilo o combinación
      }

      // Crear receta casera
      const prepMin = currentStyle.prepMinutes + Math.floor(Math.random() * 4);
      const cookMin = currentStyle.cookMinutes + Math.floor(Math.random() * 5);

      const ingredientsList = [
        ...chosenItems.map(item => ({
          name: `${item} (de tu despensa)`,
          grams: 50 + Math.floor(Math.random() * 40)
        })),
        { name: 'Aceite de oliva virgen extra', grams: 3 },
        { name: 'Agua mineral para cocción', grams: 100 }
      ];

      const steps = currentStyle.stepGen(chosenItems, babyName, targetAgeMonths, lang);
      const blwCut = currentStyle.blwAdvice(targetAgeMonths, lang);
      const tips = currentStyle.tipsGen(chosenItems, babyName, targetAgeMonths);

      const diffLabel = targetAgeMonths <= 8 ? 'Muy fácil' : 'Fácil';

      const recipeObj: Recipe = {
        id: `ai_pantry_${Date.now()}_${generatedList.length}_${Math.random().toString(36).substring(2, 6)}`,
        title: candidateTitle,
        name: candidateTitle,
        category: currentStyle.category,
        prepMin,
        cookMin,
        prepTime: prepMin,
        ageLabel,
        minAgeMonths: targetAgeMonths,
        emoji: currentStyle.emoji,
        ingredients: ingredientsList,
        steps,
        nutrition: `Aporta nutrientes esenciales de ${itemsLabel}, energía sana y fibra suave para ${babyName}.`,
        storage: 'Guardar en recipiente hermético en refrigerador hasta 48 horas.',
        tips,
        pediatricTip: tips,
        difficulty: diffLabel,
        blwCut,
        edadBebeMeses: babyMonths,
        aptaParaEdad: babyMonths < 6 
          ? 'Menor de 6 meses (solo lactancia / consulta a tu pediatra)' 
          : babyMonths <= 8 
          ? '6-8 meses (purés espesos y machacados caseros)' 
          : babyMonths <= 11 
          ? '9-11 meses (bastoncitos BLW y bocaditos blandos)' 
          : '12+ meses (comida casera familiar adaptada)',
      };

      generatedList.push(recipeObj);
      historySet.add(candidateTitle.toLowerCase());
      updatedHistory.unshift(candidateTitle);
    }
  }

  // Si faltan recetas o la despensa estaba vacía, completar con recetas base no repetidas
  if (generatedList.length < quantity) {
    const pool = [...BASE_AI_RECIPES].sort(() => Math.random() - 0.5);
    
    for (const rawBase of pool) {
      if (generatedList.length >= quantity) break;

      const base = getLocalizedRecipe(rawBase, lang);
      const titleCandidate = base.titleA;

      if (historySet.has(titleCandidate.toLowerCase()) && !historySet.has(base.titleB.toLowerCase())) {
        // Usar titleB si titleA ya fue vista
        const finalTitle = base.titleB;
        historySet.add(finalTitle.toLowerCase());
        updatedHistory.unshift(finalTitle);

        const recipeObj: Recipe = {
          ...base,
          id: `ai_gen_${Date.now()}_${generatedList.length}_${Math.random().toString(36).substring(2, 6)}`,
          title: finalTitle,
          name: finalTitle,
          prepMin: 10,
          cookMin: 15,
          ageLabel,
          minAgeMonths: targetAgeMonths,
          steps: base.steps.map(s => s.replace(/\{baby\}/g, babyName)),
          nutrition: base.nutrition.replace(/\{baby\}/g, babyName),
          tips: base.tips.replace(/\{baby\}/g, babyName),
          pediatricTip: base.tips.replace(/\{baby\}/g, babyName),
          edadBebeMeses: babyMonths,
          aptaParaEdad: babyMonths < 6 
            ? 'Menor de 6 meses (solo lactancia)' 
            : babyMonths <= 8 
            ? '6-8 meses (purés espesos y machacados)' 
            : babyMonths <= 11 
            ? '9-11 meses (trocitos blandos / BLW)' 
            : '12+ meses (comida familiar adaptada)',
        };
        generatedList.push(recipeObj);
      } else if (!historySet.has(titleCandidate.toLowerCase())) {
        historySet.add(titleCandidate.toLowerCase());
        updatedHistory.unshift(titleCandidate);

        const recipeObj: Recipe = {
          ...base,
          id: `ai_gen_${Date.now()}_${generatedList.length}_${Math.random().toString(36).substring(2, 6)}`,
          title: titleCandidate,
          name: titleCandidate,
          prepMin: 10,
          cookMin: 15,
          ageLabel,
          minAgeMonths: targetAgeMonths,
          steps: base.steps.map(s => s.replace(/\{baby\}/g, babyName)),
          nutrition: base.nutrition.replace(/\{baby\}/g, babyName),
          tips: base.tips.replace(/\{baby\}/g, babyName),
          pediatricTip: base.tips.replace(/\{baby\}/g, babyName),
          edadBebeMeses: babyMonths,
          aptaParaEdad: babyMonths < 6 
            ? 'Menor de 6 meses (solo lactancia)' 
            : babyMonths <= 8 
            ? '6-8 meses (purés espesos y machacados)' 
            : babyMonths <= 11 
            ? '9-11 meses (trocitos blandos / BLW)' 
            : '12+ meses (comida familiar adaptada)',
        };
        generatedList.push(recipeObj);
      }
    }
  }

  // Cap history to 200 titles
  const cappedHistory = updatedHistory.slice(0, 200);

  return {
    recipes: generatedList,
    newHistoryTitles: cappedHistory
  };
}

export const generateRecipes = async (
  lang: LanguageCode = 'es',
  babyName: string = 'Mathews',
  babyAgeMonths: number = 6,
  quantity: number = 3,
  pantry: PantryItem[] = []
) => {
  const dict: Record<string, string> = {
    es: "Español",
    en: "English",
    pl: "Polski",
    ru: "Русский",
    pt: "Português",
    fr: "Français",
    de: "Deutsch",
    zh: "中文",
    ar: "العربية",
    hi: "हिन्दी"
  };
  const langName = dict[lang] || lang;
  const systemPrompt = `You are Baby Day recipe assistant. You MUST respond ONLY in ${langName}. Translate everything: title, ingredients, instructions, tips. Never mix languages. If currentLanguage is English, respond 100% in English.`;
  const userPrompt = `Bebé: ${babyName} ${babyAgeMonths} meses, ingredientes: ${pantry.map(i => i.name).join(",")}. Genera ${quantity} recetas BLW con título, ingredientes, pasos y valor nutricional TODO en ${dict[lang] || lang}.`;
  
  if (typeof window !== 'undefined' && (window as any).__DEBUG_AI__) {
    console.log('[AI Prompt]:', systemPrompt + '\n' + userPrompt);
  }

  return generarRecetasIA_qE(pantry, [], 'normal', babyName, babyAgeMonths, quantity, lang);
};

