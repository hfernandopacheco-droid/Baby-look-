import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { BabyEvent, BabyUser, GrowthRecord, LanguageCode, VaccineItem, EventType, BreastSide } from '../types';
import { rE } from '../i18n';
import { InventarioPredictivo } from './InventarioPredictivo';
import { ResumenDelDia } from './ResumenDelDia';
import { BabyAvatar } from './BabyAvatar';
import { AvatarCustomizerModal } from './AvatarCustomizerModal';
import { GrowthTimeLapseModal } from './GrowthTimeLapseModal';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../normativeTables';
import {
  KE,
  LE,
  TE,
  ZE,
  QH,
  g9,
  wH,
  bA,
  YA,
  PB,
  B7,
  W9_EVENTS,
  TC_GROUPS,
  yn,
  getLocalDateString,
  isEventFromToday
} from '../utils';
import {
  Sparkles,
  Plus,
  ArrowRight,
  Pencil,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Mic,
  Volume2,
  QrCode
} from 'lucide-react';
import { DiaperIcon } from './DiaperIcon';

interface HomeTabProps {
  user: BabyUser;
  events: BabyEvent[];
  growth: GrowthRecord[];
  vaccines: VaccineItem[];
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  onOpenLogModal: (initialType?: EventType) => void;
  onNavigateTab: (tab: 'diario' | 'stats' | 'crecimiento' | 'vacunas' | 'nutricion') => void;
  onSelectEventHistory?: (eventType: EventType) => void;
  openCatalogTrigger?: number;
  // Cronómetros sincronizados
  tA?: boolean;
  mA?: number;
  v9?: BreastSide;
  Dz?: () => void;
  uz?: () => void;
  GA?: boolean;
  _A?: number;
  Mz?: () => void;
  Oz?: () => void;
  onSaveEvent?: (eventData: Omit<BabyEvent, 'id' | 'timestamp'>) => void;
}

// Array Cf quick events
export const Cf_QUICK_EVENTS = [
  { id: 'sueno' as EventType, icon: "🌙", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'lactancia' as EventType, icon: "🤱", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'panal' as EventType, icon: "🧷", bgLight: "bg-[#FEF3C7]", bgDark: "bg-[#3A2E2E]" },
  { id: 'biberon' as EventType, icon: "🍼", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'solidos' as EventType, icon: "🥣", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'bombeo' as EventType, icon: "💧", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'paseo' as EventType, icon: "🌳", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
  { id: 'bano' as EventType, icon: "🛁", bgLight: "bg-white/95", bgDark: "bg-[#2A2A40]" },
];

// Custom quick events styling (pañal real 🧷, bgLight bg-[#FEF3C7], bgDark bg-[#3A2E2E])
const QUICK_EVENT_STYLES: Record<string, { icon: string; bgLight: string; bgDark: string }> = {
  panal: { icon: "🧷", bgLight: "bg-[#FEF3C7]", bgDark: "bg-[#3A2E2E]" },
};

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  events,
  growth,
  vaccines,
  lang,
  isDark,
  useClay,
  onOpenLogModal,
  onNavigateTab,
  onSelectEventHistory,
  openCatalogTrigger,
  tA,
  mA,
  v9,
  Dz,
  uz,
  GA,
  _A,
  Mz,
  Oz,
  onSaveEvent
}) => {
  const t = rE[lang] || rE.es;
  const q9 = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCryingDetectorActive, setIsCryingDetectorActive] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('bubblo_avatar_config');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR_CONFIG;
    } catch {
      return DEFAULT_AVATAR_CONFIG;
    }
  });
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
  const [showTimeLapseModal, setShowTimeLapseModal] = useState(false);

  const handleUpdateAvatarConfig = (newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    localStorage.setItem('bubblo_avatar_config', JSON.stringify(newConfig));
  };

  const currentTimerState = {
    type: GA ? ('sueno' as const) : (tA ? ('biberon' as const) : null),
    active: !!GA || !!tA
  };
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const detectorIntervalRef = useRef<any>(null);

  const toggleCryingDetector = async () => {
    if (isCryingDetectorActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
      }
      setIsCryingDetectorActive(false);
      YA('Detector de llanto desactivado');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let hits = 0;

        detectorIntervalRef.current = setInterval(() => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          const sampleRate = ctx.sampleRate;
          const binHz = sampleRate / analyser.fftSize;
          const lowBin = Math.floor(300 / binHz);
          const highBin = Math.floor(600 / binHz);

          let sum = 0;
          for (let i = lowBin; i <= highBin; i++) {
            sum += dataArray[i];
          }
          const avg = sum / (highBin - lowBin + 1);

          if (avg > 135) {
            hits++;
            if (hits >= 4) {
              hits = 0;
              if (Notification.permission === 'granted') {
                new Notification("🚨 ¡Posible llanto de bebé detectado!", {
                  body: "El detector acústico Web Audio captó frecuencias de llanto.",
                  icon: "/favicon.ico"
                });
              }
              YA("🚨 ¡Llanto detectado por Web Audio! Tu bebé necesita atención.");
            }
          } else {
            hits = Math.max(0, hits - 1);
          }
        }, 500);

        if (Notification.permission !== 'granted') {
          Notification.requestPermission();
        }

        setIsCryingDetectorActive(true);
        YA('🎤 Detector de llanto Web Audio activo');
      } catch (err) {
        console.error(err);
        alert('No se pudo acceder al micrófono para el detector de llanto.');
      }
    }
  };

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const raw = normalizeText(transcript);
      setIsListening(false);

      const sueñoIniciar = ["sueno iniciar", "iniciar sueno", "se durmio", "a dormir", "empezar sueno"];
      const sueñoFin = ["terminar sueno", "sueno terminar", "se desperto", "desperto"];
      const lactanciaIniciar = ["iniciar teta", "iniciar lactancia", "empezar teta", "empezar lactancia", "dar teta", "teta", "pecho", "lactancia"];
      const lactanciaFin = ["terminar teta", "fin lactancia", "terminar lactancia"];
      const pañalSucio = ["panal sucio", "popo", "caca"];
      const pañalMojado = ["panal", "pipi"];
      const biberon = ["biberon", "bibi", "leche"];

      if (sueñoIniciar.some(kw => raw.includes(kw))) {
        if (Mz) Mz();
        YA('🌙 Sueño iniciado por voz');
        return;
      }
      if (sueñoFin.some(kw => raw.includes(kw))) {
        if (Oz) Oz();
        YA('☀️ Sueño finalizado y guardado');
        return;
      }
      if (lactanciaIniciar.some(kw => raw.includes(kw))) {
        if (Dz) Dz();
        YA('🤱 Lactancia iniciada por voz');
        return;
      }
      if (lactanciaFin.some(kw => raw.includes(kw))) {
        if (uz) uz();
        YA('✅ Lactancia finalizada y guardada');
        return;
      }
      if (pañalSucio.some(kw => raw.includes(kw))) {
        if (onSaveEvent) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const dateStr = getLocalDateString(now);
          onSaveEvent({
            type: 'panal',
            date: dateStr,
            time: timeStr,
            subType: 'Sucio',
            notes: `Voz: ${transcript}`
          });
          YA('💩 Pañal sucio guardado • ¡Auto guardado!');
        }
        return;
      }
      if (pañalMojado.some(kw => raw.includes(kw))) {
        if (onSaveEvent) {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const dateStr = getLocalDateString(now);
          onSaveEvent({
            type: 'panal',
            date: dateStr,
            time: timeStr,
            subType: 'Mojado',
            notes: `Voz: ${transcript}`
          });
          YA('💧 Pañal mojado guardado • ¡Auto guardado!');
        }
        return;
      }
      if (biberon.some(kw => raw.includes(kw))) {
        if (onSaveEvent) {
          const match = raw.match(/\d+/);
          const amount = match ? parseInt(match[0], 10) : 120;
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          const dateStr = getLocalDateString(now);
          onSaveEvent({
            type: 'biberon',
            date: dateStr,
            time: timeStr,
            amount,
            notes: `Voz: ${transcript}`
          });
          YA(`🍼 Biberón ${amount}ml guardado • ¡Auto guardado!`);
        }
        return;
      }

      YA('No se reconoció el comando de voz. Prueba: "pañal sucio", "iniciar sueño", "biberón 150ml"');
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Carousel scroll index state p9
  const [p9, setP9] = useState<number>(0);
  const isScrollingProgrammatically = useRef(false);

  // C: updates p9 Math.round(scrollLeft / (118+12))
  const C = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const newIdx = Math.round(scrollLeft / (118 + 12));
    setP9(newIdx);
  };

  useLayoutEffect(() => {
    if (q9.current && isScrollingProgrammatically.current) {
      const width = 118 + 12;
      q9.current.scrollTo({ left: p9 * width, behavior: 'smooth' });
    }
  }, [p9]);

  useEffect(() => {
    const el = q9.current;
    if (!el) return;
    const handlePassiveScroll = () => {
      const scrollLeft = el.scrollLeft;
      const newIdx = Math.round(scrollLeft / (118 + 12));
      setP9(newIdx);
    };
    el.addEventListener('scroll', handlePassiveScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handlePassiveScroll);
    };
  }, []);

  // Mouse drag support for smooth rotation on desktop
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!q9.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - q9.current.offsetLeft;
    startScrollLeftRef.current = q9.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !q9.current) return;
    e.preventDefault();
    const x = e.pageX - q9.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    q9.current.scrollLeft = startScrollLeftRef.current - walk;
  };

  // Load quick cards Cf from localStorage bubblo_quick_{user} or bubblo_quickOrder_{user}
  const [Cf, setCf] = useState<EventType[]>(() => {
    if (!user?.id) return yn;
    try {
      const saved =
        localStorage.getItem(`bubblo_quickOrder_${user.id}`) ||
        localStorage.getItem(`bubblo_quick_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback to yn
    }
    return yn;
  });

  // Reorder modal state
  const [showReorderModal, setShowReorderModal] = useState<boolean>(false);

  // Catalog modal state (add from catalog)
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);

  // Watch for external catalog trigger (e.g. from FAB +)
  useEffect(() => {
    if (openCatalogTrigger && openCatalogTrigger > 0) {
      setShowCatalogModal(true);
    }
  }, [openCatalogTrigger]);

  // S9 function to save quick cards order
  const S9 = (newOrder: EventType[]) => {
    setCf(newOrder);
    if (user?.id) {
      localStorage.setItem(`bubblo_quick_${user.id}`, JSON.stringify(newOrder));
      localStorage.setItem(`bubblo_quickOrder_${user.id}`, JSON.stringify(newOrder));
    }
  };

  // Move item up in order
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...Cf];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    S9(updated);
  };

  // Move item down in order
  const moveDown = (idx: number) => {
    if (idx >= Cf.length - 1) return;
    const updated = [...Cf];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    S9(updated);
  };

  // Remove item from quick cards
  const removeItem = (idx: number) => {
    if (Cf.length <= 1) return; // Keep at least one
    const updated = Cf.filter((_, i) => i !== idx);
    S9(updated);
  };

  // addEvento(nuevo) from catalog
  const addEvento = (nuevo: EventType) => {
    if (Cf.includes(nuevo)) {
      setShowCatalogModal(false);
      return;
    }
    const nuevos = [...Cf, nuevo];
    S9(nuevos);
    setShowCatalogModal(false);
    bA(window.innerWidth / 2, window.innerHeight / 2);
    YA(`+ ${W9_EVENTS[nuevo].label}`);
    setTimeout(() => {
      if (q9.current) {
        const w = 118;
        q9.current.scrollTo({ left: nuevos.length * w, behavior: 'smooth' });
      }
    }, 400);
  };

  // Scroll to top on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

// Dynamic welcome message
  // Today's events filter (using local date to prevent UTC offset mismatch)
  const todayStr = useMemo(() => getLocalDateString(), []);
  const todayEvents = useMemo(() => {
    return events.filter((e) => isEventFromToday(e, todayStr));
  }, [events, todayStr]);

  // Daily stats summaries
  const diaperStats = useMemo(() => KE(todayEvents), [todayEvents]);
  const nursingStats = useMemo(() => LE(todayEvents), [todayEvents]);
  const sleepStats = useMemo(() => TE(todayEvents), [todayEvents]);
  const bottleStats = useMemo(() => ZE(todayEvents), [todayEvents]);

  // Latest measures
  const latestGrowth = useMemo(() => QH(growth), [growth]);

  // Upcoming vaccines
  const pendingVaccines = useMemo(() => {
    return vaccines.filter((v) => !v.applied).slice(0, 2);
  }, [vaccines]);

  // Event counts today and latest timestamp for each event
  const eventStatsMap = useMemo(() => {
    const map: Record<string, { count: number; lastTimestamp?: number }> = {};
    Object.keys(W9_EVENTS).forEach((k) => {
      map[k] = { count: 0 };
    });
    events.forEach((ev) => {
      if (!map[ev.type]) {
        map[ev.type] = { count: 0 };
      }
      if (ev.date === todayStr) {
        map[ev.type].count++;
      }
      if (!map[ev.type].lastTimestamp || ev.timestamp > map[ev.type].lastTimestamp!) {
        map[ev.type].lastTimestamp = ev.timestamp;
      }
    });
    return map;
  }, [events, todayStr]);

  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  // Events available to add from catalog (those NOT in Cf)
  const availableInCatalog = useMemo(() => {
    const all = Object.keys(W9_EVENTS) as EventType[];
    return all.filter((k) => !Cf.includes(k));
  }, [Cf]);

  // Read bubblo_announcements & bubblo_cms_banner
  const [announcement, setAnnouncement] = useState<{ id: number; title: string; message: string; date: string } | null>(() => {
    try {
      const list = JSON.parse(localStorage.getItem('bubblo_announcements') || '[]');
      if (Array.isArray(list) && list.length > 0) {
        const active = list.filter((a: any) => a.active !== false && (!a.scheduled || new Date(a.date).getTime() <= Date.now()));
        if (active.length > 0) {
          const dismissed = JSON.parse(sessionStorage.getItem('bubblo_dismissed_announcements') || '[]');
          const unread = active.slice().reverse().find((a: any) => !dismissed.includes(a.id));
          return unread || null;
        }
      }
    } catch {}
    return null;
  });

  const [cmsBanner] = useState<string>(() => {
    try {
      return localStorage.getItem('bubblo_cms_banner') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    if (announcement) {
      try {
        const list = JSON.parse(localStorage.getItem('bubblo_announcements') || '[]');
        const updated = list.map((a: any) => (a.id === announcement.id ? { ...a, opens: (a.opens || 0) + 1 } : a));
        localStorage.setItem('bubblo_announcements', JSON.stringify(updated));
      } catch {}
    }
  }, [announcement]);

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-4">
      {/* CMS Banner si está configurado en Admin */}
      {cmsBanner && (
        <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-amber-200/60 dark:border-[#3A3A55]">
          <img src={cmsBanner} alt="Promoción" className="w-full max-h-40 object-cover" />
        </div>
      )}

      {/* Ventana emergente / aviso de anuncio de Inicio */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-400/50 dark:border-amber-500/40 p-3.5 rounded-2xl relative shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-xl leading-none">🔔</span>
              <div>
                <h4 className="font-black text-sm text-[#111827] dark:text-amber-400 leading-tight">
                  {announcement.title}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-200 mt-1 leading-relaxed">
                  {announcement.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const dismissed = JSON.parse(sessionStorage.getItem('bubblo_dismissed_announcements') || '[]');
                dismissed.push(announcement.id);
                sessionStorage.setItem('bubblo_dismissed_announcements', JSON.stringify(dismissed));
                setAnnouncement(null);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              title="Cerrar anuncio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Cards Carrusel q9 */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wider font-heading text-[#111827] dark:text-[#FFFFFF]">
              {t.quickEvents || 'Eventos rápidos'}
            </h3>
            {/* Lápiz ✏️ para ordenar */}
            <button
              id="btn-reorder-quick-cards"
              onClick={() => setShowReorderModal(true)}
              title={t.reorderTitle || 'Ordenar eventos rápidos'}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {/* Controles de giro manual izquierda/derecha */}
            <button
              id="btn-scroll-left-quick-cards"
              onClick={() => {
                const nextP9 = Math.max(0, p9 - 1);
                setP9(nextP9);
                if (q9.current) {
                  isScrollingProgrammatically.current = true;
                  q9.current.scrollTo({ left: nextP9 * (132 + 12), behavior: 'smooth' });
                  setTimeout(() => { isScrollingProgrammatically.current = false; }, 400);
                }
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition cursor-pointer"
              title="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-scroll-right-quick-cards"
              onClick={() => {
                const nextP9 = Math.min(Cf.length - 1, p9 + 1);
                setP9(nextP9);
                if (q9.current) {
                  isScrollingProgrammatically.current = true;
                  q9.current.scrollTo({ left: nextP9 * (132 + 12), behavior: 'smooth' });
                  setTimeout(() => { isScrollingProgrammatically.current = false; }, 400);
                }
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition cursor-pointer"
              title="Desplazar a la derecha"
            >
               <ChevronRight className="w-4 h-4" />
             </button>
           </div>
         </div>

        {/* Carrusel q9 conforme a especificación JSX */}
        <div
          ref={q9}
          className="bottom-nav-scroll flex gap-2 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth touch-pan-x overscroll-x-contain pb-5 pt-1 px-1 cursor-grab active:cursor-grabbing"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onScroll={C}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {Cf.map((card) => {
            const customStyle = QUICK_EVENT_STYLES[card] || Cf_QUICK_EVENTS.find(c => c.id === card);
            const meta = W9_EVENTS[card] || {
              label: card,
              emoji: '✨',
              color: 'amber',
              hex: '#FEF08A',
              group: 'ACTIVIDAD'
            };
            const cardEmoji = customStyle?.icon || meta.emoji;
            const cardBgClass = isDark
              ? `${customStyle?.bgDark || 'bg-[#2A2A40]'} text-white border border-[#3A3A55]`
              : `${customStyle?.bgLight || 'bg-white/95'} text-[#111827] border border-amber-200/80 shadow-sm`;
            const cardLabel = t.types?.[card] || meta.label;
            // Contar eventos del día de hoy para que se actualicen por día
            const todayStr = new Date().toISOString().split('T')[0];
            const now = new Date();
            const todayYear = now.getFullYear();
            const todayMonth = now.getMonth();
            const todayDay = now.getDate();

            const countToday = events.filter(e => {
              if (e.type !== card) return false;
              if (e.date === todayStr) return true;
              if (e.timestamp) {
                const ed = new Date(e.timestamp);
                return ed.getFullYear() === todayYear && ed.getMonth() === todayMonth && ed.getDate() === todayDay;
              }
              return false;
            }).length;

            return (
              <div
                key={card}
                className="flex flex-col items-center flex-shrink-0 min-w-[118px] max-w-[118px] relative"
              >
                <div
                  id={`quick-card-${card}`}
                  onClick={() => {
                    if (onSelectEventHistory) {
                      onSelectEventHistory(card);
                    } else {
                      onNavigateTab('stats');
                    }
                  }}
                  className={`quick-card clay-press w-full min-h-[132px] pt-3 pb-4 px-2 flex flex-col items-center justify-between relative overflow-visible cursor-pointer select-none transition-transform ${cardBgClass} ${card === 'panal' ? 'card-panal' : ''}`}
                  style={{
                    backgroundColor: (() => {
                      switch (card) {
                        case 'panal': return isDark ? '#3A3226' : '#FEF3C7';
                        case 'sueno': return isDark ? '#2A2A48' : '#EEF2FF';
                        case 'lactancia': return isDark ? '#3B262E' : '#FFF1F2';
                        case 'biberon': return isDark ? '#223240' : '#EFF6FF';
                        case 'solidos': return isDark ? '#22382D' : '#ECFDF5';
                        case 'bombeo': return isDark ? '#3B2238' : '#FDF4FF';
                        case 'paseo': return isDark ? '#203825' : '#F0FDF4';
                        case 'bano': return isDark ? '#203240' : '#F0F9FF';
                        case 'medicamento': return isDark ? '#3A3020' : '#FFFBEB';
                        case 'temperatura': return isDark ? '#3A2222' : '#FEF2F2';
                        default: return isDark ? '#1E293B' : '#F8FAFC';
                      }
                    })(),
                    boxShadow: isDark
                      ? '0 10px 25px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -2px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.12), inset 0 -3px 6px rgba(0, 0, 0, 0.6)'
                      : '0 12px 25px -4px rgba(160, 170, 190, 0.5), 0 4px 8px -2px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.9), inset 0 -3px 6px rgba(150, 160, 180, 0.25)',
                    borderRadius: '24px',
                    border: isDark ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {/* Notification badge at top right corner - Actualizado por día */}
                  <span
                    title={`${countToday} eventos registrados hoy`}
                    className={`absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md transition-transform ${
                      countToday > 0
                        ? isDark
                          ? 'bg-amber-400 text-slate-900 border border-amber-500 scale-105'
                          : 'bg-amber-500 text-white border border-amber-600 shadow-amber-500/30'
                        : isDark
                          ? 'bg-slate-700 text-slate-400 border border-slate-600'
                          : 'bg-slate-200 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {countToday}
                  </span>

                  <span className="text-[36px] leading-none select-none block mb-1 flex items-center justify-center">
                    {card === 'panal' ? <DiaperIcon className="w-10 h-10" /> : cardEmoji}
                  </span>
                  <div className="flex flex-col items-center text-center w-full">
                    <span className={`font-extrabold text-[12px] tracking-tight truncate max-w-[110px] ${
                      isDark ? 'text-white' : 'text-[#111827]'
                    }`}>
                      {cardLabel}
                    </span>
                    <span className={`text-[10px] font-bold mt-0.5 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {PB(eventStatsMap[card]?.lastTimestamp)}
                    </span>
                  </div>
                </div>

                {/* + EN EL BORDE INFERIOR SOLAPADO */}
                <button
                  id={`btn-plus-below-${card}`}
                  type="button"
                  className={`absolute left-1/2 -translate-x-1/2 bottom-[-12px] w-7 h-7 rounded-full flex items-center justify-center text-[14px] font-extrabold z-20 shadow-[0_4px_12px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-110 active:scale-95 transition-transform ${
                    isDark
                      ? 'bg-[#2A2A40] text-white border-[2px] border-slate-600 shadow-black/50'
                      : 'bg-white text-black border-[2px] border-slate-300 shadow-slate-300/60'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLogModal(card);
                    bA(e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().top);
                  }}
                  title={`+ ${cardLabel}`}
                >
                  +
                </button>
              </div>
            );
          })}

          {/* Plus card at the end of carousel */}
          <div className="flex flex-col items-center flex-shrink-0 min-w-[110px] max-w-[110px] relative">
            <div
              onClick={() => setShowCatalogModal(true)}
              className={`quick-card clay-press w-full min-h-[84px] select-none p-2.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${
                isDark
                  ? 'border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-500 bg-[#2A2A40]'
                  : 'border-slate-300 hover:border-amber-400 text-slate-400 hover:text-amber-500 bg-white/70'
              }`}
            >
              <Plus className="w-5 h-5 stroke-[2.5] mb-1" />
              <span className="text-[10px] font-bold">{t.more || 'Más'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Actividad en curso debajo de q9 carrusel */}
      {tA && (
        <div className={`cronometro-box mt-3 p-4 rounded-[20px] border-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-fadeIn ${
          !isDark
            ? "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#FDBA74]"
            : "bg-gradient-to-br from-[#2D2A3A] to-[#3A2E4A] border-[#6B4A7A]"
        }`}>
          <div className="flex items-center gap-2 text-[11px] font-bold opacity-60">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>🤱 Lactancia en curso • {v9 === 'I' ? (t.leftShort || 'Izq') : v9 === 'D' ? (t.rightShort || 'Der') : (t.bothShort || 'Ambos')}</span>
          </div>
          <div
            className={`text-[32px] font-black tracking-wider font-mono ${
              !isDark ? "text-[#111827]" : "text-white"
            }`}
            style={
              isDark
                ? {
                    WebkitTextStroke: "1.5px black",
                    textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                  }
                : {}
            }
          >
            {B7(mA || 0)}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={Dz}
              className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold clay-press transition cursor-pointer"
            >
              {tA ? (t.pause || 'Pausar') : (t.resume || 'Reanudar')}
            </button>
            <button
              type="button"
              onClick={uz}
              className="px-4 py-1.5 rounded-full bg-[#111827] hover:bg-black text-white text-[12px] font-bold clay-press transition cursor-pointer"
            >
              {t.saveLact || 'Guardar toma'}
            </button>
          </div>
        </div>
      )}

      {GA && (
        <div className={`cronometro-box mt-3 p-4 rounded-[20px] border-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-fadeIn ${
          !isDark
            ? "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#FDBA74]"
            : "bg-gradient-to-br from-[#2D2A3A] to-[#3A2E4A] border-[#6B4A7A]"
        }`}>
          <div className="flex items-center gap-2 text-[11px] font-bold opacity-60">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span>🌙 Sueño en curso •</span>
          </div>
          <div
            className={`text-[32px] font-black tracking-wider font-mono ${
              !isDark ? "text-[#111827]" : "text-white"
            }`}
            style={
              isDark
                ? {
                    WebkitTextStroke: "1.5px black",
                    textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                  }
                : {}
            }
          >
            {B7(_A || 0)}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={Mz}
              className="px-4 py-1.5 rounded-full bg-[#A855F7] hover:bg-purple-600 text-white text-[12px] font-bold clay-press transition cursor-pointer"
            >
              {GA ? (t.pause || 'Pausar') : (t.resume || 'Reanudar')}
            </button>
            <button
              type="button"
              onClick={Oz}
              className="px-4 py-1.5 rounded-full bg-[#111827] hover:bg-black text-white text-[12px] font-bold clay-press transition cursor-pointer"
            >
              {t.wakeSave || 'Despertar y guardar'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Kawaii Animated Avatar component placed centered ABOVE Resumen del Día */}
      <BabyAvatar
        events={events}
        user={user}
        timerState={currentTimerState}
        isCrying={isCryingDetectorActive && Math.random() > 0.9}
        onOpenLogModal={onOpenLogModal}
        onOpenAvatarCustomizer={() => setShowAvatarCustomizer(true)}
      />

      {/* Modales Avatar y Time-Lapse */}
      {showAvatarCustomizer && (
        <AvatarCustomizerModal
          config={avatarConfig}
          onUpdateConfig={handleUpdateAvatarConfig}
          onClose={() => setShowAvatarCustomizer(false)}
          isDark={isDark}
        />
      )}

      {showTimeLapseModal && (
        <GrowthTimeLapseModal
          config={avatarConfig}
          user={user}
          growth={growth}
          onClose={() => setShowTimeLapseModal(false)}
          isDark={isDark}
        />
      )}

      {/* ¿Qué quieres que te recordemos? (Resumen del Día con Recordatorios Inteligentes) */}
      <ResumenDelDia
        lang={lang}
        isDark={isDark}
        useClay={useClay}
        currentUserId={user?.id}
        events={todayEvents}
        onNavigateTab={onNavigateTab}
      />

      {/* Inventario Predictivo de Suministros */}
      <InventarioPredictivo isDark={isDark} userId={user?.id} />

      {/* Snapshot Modules: Growth */}
      <div className="grid grid-cols-1 gap-4">
        {/* Growth Snapshot */}
        <div
          className={`p-5 ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                <h4 className="font-extrabold text-sm font-heading">{t.crecimiento}</h4>
              </div>
              <button
                onClick={() => onNavigateTab('crecimiento')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Historial</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className={`p-3 rounded-2xl border ${!isDark ? 'bg-[#FFFBF7] text-[#111827] border-amber-200/60' : 'bg-[#2A2A40] text-white border-[#3A3A55]'}`}>
                <div className={`text-[10px] font-bold uppercase ${!isDark ? 'text-[#111827]' : 'text-white'}`}>
                  {t.lastWeight}
                </div>
                <div className="text-xl font-black font-heading mt-0.5 text-amber-500">
                  {latestGrowth.weight ? `${latestGrowth.weight.value} kg` : 'Sin datos'}
                </div>
                <div className={`text-[10px] mt-0.5 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {latestGrowth.weight ? latestGrowth.weight.date : 'Sin registro aún'}
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${!isDark ? 'bg-[#FFFBF7] text-[#111827] border-teal-200/60' : 'bg-[#2A2A40] text-white border-[#3A3A55]'}`}>
                <div className={`text-[10px] font-bold uppercase ${!isDark ? 'text-[#111827]' : 'text-white'}`}>
                  {t.lastHeight}
                </div>
                <div className="text-xl font-black font-heading mt-0.5 text-teal-500">
                  {latestGrowth.height ? `${latestGrowth.height.value} cm` : 'Sin datos'}
                </div>
                <div className={`text-[10px] mt-0.5 ${!isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {latestGrowth.height ? latestGrowth.height.date : 'Sin registro aún'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ✏️: Reorder Quick Cards */}
      {showReorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowReorderModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className={`relative w-full max-w-md rounded-3xl p-5 shadow-2xl z-10 border ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base font-heading">Ordenar eventos rápidos</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Usa ↑ ↓ para cambiar el orden en el carrusel principal • ahora puedes eliminar con 🗑️
                </p>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 py-2">
              {Cf.map((card, idx) => {
                const meta = W9_EVENTS[card] || { label: card, emoji: '✨' };
                const emoji = QUICK_EVENT_STYLES[card]?.icon || Cf_QUICK_EVENTS.find(c => c.id === card)?.icon || meta.emoji;
                return (
                  <div
                    key={card}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{emoji}</span>
                      <span className="font-bold">{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Subir"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === Cf.length - 1}
                        className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Bajar"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={Cf.length <= 1}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/20 disabled:opacity-30 cursor-pointer"
                        title="Eliminar de rápidos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowReorderModal(false);
                  setShowCatalogModal(true);
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir más eventos</span>
              </button>
              <button
                onClick={() => setShowReorderModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow clay-press transition cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 📋: Catalog Modal (Add from Catalog grouped by TC) */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowCatalogModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className={`relative w-full max-w-lg rounded-3xl p-5 shadow-2xl z-10 border max-h-[85vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-black text-base font-heading flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Añadir a eventos rápidos</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Eventos que no están en tu carrusel rápido
                </p>
              </div>
              <button
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {availableInCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ¡Ya tienes todos los 16 eventos disponibles en tu carrusel rápido! 🎉
              </div>
            ) : (
              <div className="space-y-4">
                {(
                  Object.keys(TC_GROUPS) as (keyof typeof TC_GROUPS)[]
                ).map((groupKey) => {
                  const groupEvents = TC_GROUPS[groupKey].filter((k) =>
                    availableInCatalog.includes(k)
                  );
                  if (groupEvents.length === 0) return null;

                  return (
                    <div key={groupKey} className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block px-1">
                        {groupKey}
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {groupEvents.map((evtKey) => {
                          const meta = W9_EVENTS[evtKey];
                          return (
                            <button
                              key={evtKey}
                              onClick={() => addEvento(evtKey)}
                              className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer clay-press ${
                                isDark
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-amber-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-amber-400'
                              }`}
                            >
                              <span className="text-2xl">{meta.emoji}</span>
                              <div className="overflow-hidden">
                                <div className="text-xs font-bold truncate">{meta.label}</div>
                                <div className="text-[9px] text-slate-400">+ Añadir</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal QR Link /quick */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowQrModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 text-center ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base">QR de Registro Rápido Sin Login</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
              >
                <X className="w-5 h-5 opacity-70" />
              </button>
            </div>

            <p className="text-xs opacity-80 leading-relaxed">
              Comparte este código QR o enlace con abuelos, niñeras o familiares para que registren eventos sin iniciar sesión.
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-md border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/baby/${user.id}/quick`)}`}
                alt="QR Code Quick Link"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="space-y-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/baby/${user.id}/quick`}
                className={`w-full p-2.5 rounded-xl text-xs font-mono border text-center ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/baby/${user.id}/quick`);
                  YA('¡Enlace QR copiado al portapapeles! 📋');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Copiar Enlace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
