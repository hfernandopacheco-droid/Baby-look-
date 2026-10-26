import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BabyEvent, LanguageCode } from '../types';
import { rE } from '../i18n';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { DiaperIcon } from './DiaperIcon';
import { W9_EVENTS, getLocalDateString, isEventFromToday, KE, ZE, g9, YA } from '../utils';
import {
  ReminderType,
  ReminderConfig,
  RemindersMap,
  DEFAULT_REMINDERS,
  getReminderText,
  isCurrentlyDayTime,
  formatMinutesToHoursMins,
  formatNextReminderTime,
  calcularPromedio5Dias,
  calcularSiguienteAviso,
  persistirRecordatorio,
  getRecordatoriosLocal,
  actualizarBadge,
  actualizarBadgeUniversal
} from '../services/recordatoriosService';
import { HelpCircle, Clock, Check, X, Moon, Sun, ChevronDown, ChevronUp } from 'lucide-react';

interface ResumenDelDiaProps {
  lang: LanguageCode;
  isDark: boolean;
  useClay?: boolean;
  currentUserId?: string | null;
  events?: BabyEvent[];
  onNavigateTab?: (tab: string) => void;
}

export const ResumenDelDia: React.FC<ResumenDelDiaProps> = ({
  lang,
  isDark,
  currentUserId,
  events,
  onNavigateTab
}) => {
  const t = rE[lang] || rE.es;
  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  const uid = currentUserId || auth.currentUser?.uid || localStorage.getItem('bubblo_current_user') || 'anonymous';
  const todayStr = useMemo(() => getLocalDateString(), []);

  // Eventos de Firestore si no vienen por props
  const [firestoreEvents, setFirestoreEvents] = useState<BabyEvent[]>([]);

  // Configuración de recordatorios inteligentes
  const [reminders, setReminders] = useState<RemindersMap>(() => getRecordatoriosLocal(uid));

  // Modal "¿A qué horas te aviso mamá?"
  const [editingType, setEditingType] = useState<ReminderType | null>(null);
  const [modalDiaMin, setModalDiaMin] = useState<number>(180);
  const [modalNocheMin, setModalNocheMin] = useState<number>(240);
  const [isSavingReminder, setIsSavingReminder] = useState<boolean>(false);

  // Tooltip activo
  const [activeTooltip, setActiveTooltip] = useState<ReminderType | null>(null);

  // Control para expandir/colapsar historial de hoy
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(true);

  // Escuchar si vienen eventos por props
  const propTodayEvents = useMemo(() => {
    if (!events) return null;
    return events.filter(e => isEventFromToday(e, todayStr));
  }, [events, todayStr]);

  // Sincronizar eventos en tiempo real si no vienen por props
  useEffect(() => {
    if (propTodayEvents !== null) return;
    if (!uid || uid === 'anonymous') return;

    const collectionsList = ['panal', 'biberon', 'lactancia', 'sueno'];
    const unsubs: (() => void)[] = [];
    const map: Record<string, BabyEvent[]> = {};

    collectionsList.forEach(col => {
      const q = query(collection(db, "users", uid, col), limit(60));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => {
          const data = d.data();
          const timestamp = data.createdAt?.toDate ? data.createdAt.toDate().getTime()
            : (data.fecha?.toDate ? data.fecha.toDate().getTime()
            : (data.hora?.toDate ? data.hora.toDate().getTime()
            : (data.timestamp || (data.fechaISO ? new Date(data.fechaISO).getTime() : Date.now()))));

          const dateStr = data.date || (data.fechaISO ? data.fechaISO.split('T')[0] : getLocalDateString(new Date(timestamp)));

          return {
            id: d.id,
            type: (data.type || col) as any,
            date: dateStr,
            time: data.time || (data.hora && typeof data.hora === 'string' ? data.hora : new Date(timestamp).toTimeString().slice(0, 5)),
            duration: data.duration,
            side: data.side,
            amount: data.amount !== undefined ? Number(data.amount) : (data.cantidad !== undefined ? Number(data.cantidad) : undefined),
            subType: data.subType || (data.tipo && !['panal', 'pañal', 'biberon', 'biberón'].includes(data.tipo.toLowerCase()) ? data.tipo : (col === 'panal' ? 'Mojado' : undefined)),
            notes: data.notes || (data.tipo && !['panal', 'pañal', 'biberon', 'biberón'].includes(data.tipo.toLowerCase()) && data.tipo !== col ? data.tipo : '') || data.name || '',
            timestamp
          } as BabyEvent;
        });

        const filtered = list.filter(ev => isEventFromToday(ev, todayStr));
        map[col] = filtered;
        const combined = Object.values(map).flat().sort((a, b) => b.timestamp - a.timestamp);
        setFirestoreEvents(combined);
      }, (err) => console.warn(`Error onSnapshot ${col}:`, err));
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [uid, propTodayEvents, todayStr]);

  const eventosHoy = propTodayEvents !== null ? propTodayEvents : firestoreEvents;

  // Estadísticas consolidadas de hoy
  const diaperStats = useMemo(() => KE(eventosHoy), [eventosHoy]);
  const bottleStats = useMemo(() => ZE(eventosHoy), [eventosHoy]);

  const sleepStats = useMemo(() => {
    const sleepEvents = eventosHoy.filter(e => e.type === 'sueno');
    const totalSeconds = sleepEvents.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return {
      totalSeconds,
      totalSessions: sleepEvents.length
    };
  }, [eventosHoy]);

  const nursingStats = useMemo(() => {
    const feeds = eventosHoy.filter(e => e.type === 'lactancia');
    const totalDuration = feeds.reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return {
      count: feeds.length,
      totalDuration
    };
  }, [eventosHoy]);

  // Cargar configuración local de recordatorios
  useEffect(() => {
    const local = getRecordatoriosLocal(uid);
    setReminders(local);
  }, [uid]);

  // Escuchar actualizaciones de recordatorios
  useEffect(() => {
    const handleRemindersUpdated = (e: any) => {
      if (e.detail?.updated) {
        setReminders(e.detail.updated);
      }
    };
    window.addEventListener('recordatorios_updated', handleRemindersUpdated);
    return () => window.removeEventListener('recordatorios_updated', handleRemindersUpdated);
  }, []);

  // 3. LOGICA AUTO 5 DIAS DIA/NOCHE:
  // Al montar o cuando cambia el usuario, si los recordatorios están en auto y hace más de 5 días
  // que no se calculan, ejecuta calcularPromedio5Dias para cada tipo.
  useEffect(() => {
    if (!uid || uid === 'anonymous') return;

    const checkAndAutoUpdate = async () => {
      const types: ReminderType[] = ['panal', 'sueno', 'lactancia', 'biberon'];
      let hasChanges = false;
      const currentConfig = { ...reminders };

      for (const t of types) {
        const item = currentConfig[t];
        const lastUpdate = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
        const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
        // Si nunca se ha calculado o pasaron más de 5 días y está en auto
        if (item.auto && (Date.now() - lastUpdate > fiveDaysMs)) {
          const prom = await calcularPromedio5Dias(uid, t);
          currentConfig[t] = {
            ...item,
            intervaloDiaMin: prom.diaMin,
            intervaloNocheMin: prom.nocheMin,
            auto: true,
            updatedAt: Date.now()
          };
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setReminders(currentConfig);
        try {
          localStorage.setItem(`bubblo_recordatorios_${uid}`, JSON.stringify(currentConfig));
        } catch (e) {}
      }
    };

    checkAndAutoUpdate();
  }, [uid]);

  // Obtener último evento registrado de cada tipo
  const getLastEventTimestamp = useCallback((tipo: ReminderType): number | undefined => {
    const list = eventosHoy.filter(e => e.type === tipo).sort((a, b) => b.timestamp - a.timestamp);
    return list[0]?.timestamp;
  }, [eventosHoy]);

  // Toggle Switch ON / OFF
  const handleToggleSwitch = async (tipo: ReminderType, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = reminders[tipo];
    const willBeActive = !current.activo;

    let siguienteAviso = current.siguienteAviso;
    if (willBeActive) {
      const lastTs = getLastEventTimestamp(tipo);
      siguienteAviso = calcularSiguienteAviso(current, lastTs);
    }

    const updatedConfig: ReminderConfig = {
      ...current,
      activo: willBeActive,
      siguienteAviso: willBeActive ? siguienteAviso : undefined,
      ultimoAviso: Date.now()
    };

    const newMap = await persistirRecordatorio(uid, tipo, updatedConfig, eventosHoy, lang);
    setReminders(newMap);
    actualizarBadgeUniversal(uid, eventosHoy, lang);

    if (willBeActive) {
      const timeStr = siguienteAviso ? formatNextReminderTime(siguienteAviso) : '';
      const textMsg = getReminderText('teAvisare', lang).replace('{time}', timeStr);
      YA(`🔔 ${getReminderText(tipo, lang)}: ${textMsg}`);
    }
  };

  // Abrir modal "¿A qué horas te aviso mamá?"
  const handleOpenEditModal = (tipo: ReminderType) => {
    setEditingType(tipo);
    const item = reminders[tipo] || DEFAULT_REMINDERS[tipo];
    setModalDiaMin(item.intervaloDiaMin);
    setModalNocheMin(item.intervaloNocheMin);
    setActiveTooltip(null);
  };

  // Guardar desde modal
  const handleSaveModal = async () => {
    if (!editingType) return;
    setIsSavingReminder(true);

    try {
      const current = reminders[editingType];
      const diaNum = Math.max(10, Math.min(720, Number(modalDiaMin) || current.intervaloDiaMin));
      const nocheNum = Math.max(10, Math.min(720, Number(modalNocheMin) || current.intervaloNocheMin));

      const updatedItem: ReminderConfig = {
        ...current,
        intervaloDiaMin: diaNum,
        intervaloNocheMin: nocheNum,
        auto: false // personalizado manualmente
      };

      if (updatedItem.activo) {
        const lastTs = getLastEventTimestamp(editingType);
        updatedItem.siguienteAviso = calcularSiguienteAviso(updatedItem, lastTs);
      }

      const newMap = await persistirRecordatorio(uid, editingType, updatedItem, eventosHoy, lang);
      setReminders(newMap);
      setEditingType(null);
      YA(getReminderText('savedToast', lang));
      actualizarBadgeUniversal(uid, eventosHoy, lang);
    } catch (err) {
      console.warn("Error guardando recordatorio:", err);
    } finally {
      setIsSavingReminder(false);
    }
  };

  // Render detalle de eventos en el historial de hoy
  const formatEventDetail = (ev: BabyEvent) => {
    const parts: string[] = [];

    if (ev.type === 'panal') {
      const cond = ev.subType || (ev as any).tipo;
      if (cond && !['panal', 'pañal'].includes(cond.toLowerCase())) {
        const lower = cond.toLowerCase();
        const icon = lower.includes('suc') || lower.includes('dirt') || lower.includes('caca') ? '💩'
          : lower.includes('mix') ? '🌟'
          : '💧';
        parts.push(`${icon} ${cond}`);
      } else {
        parts.push('💧 Mojado');
      }
    } else if (ev.type === 'biberon') {
      const ml = ev.amount !== undefined ? ev.amount : (ev as any).cantidad;
      if (ml !== undefined && ml !== null && Number(ml) > 0) {
        parts.push(`${ml} ml`);
      }
      if (ev.subType && !['biberon', 'biberón'].includes(ev.subType.toLowerCase())) {
        parts.push(ev.subType);
      }
    } else if (ev.type === 'lactancia') {
      if (ev.side) {
        const sideLabel = ev.side === 'I' ? (t.leftShort || 'Izq') : ev.side === 'D' ? (t.rightShort || 'Der') : (t.bothShort || 'Ambos');
        parts.push(`${t.pecho || 'Pecho'}: ${sideLabel}`);
      }
      if (ev.duration) {
        const mins = Math.round(ev.duration / 60) || 1;
        parts.push(`${mins} min`);
      }
    } else if (ev.type === 'sueno') {
      if (ev.duration) {
        const mins = Math.round(ev.duration / 60);
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        parts.push(hrs > 0 ? `${hrs}h ${rem}m` : `${mins} min`);
      }
    } else {
      if (ev.amount) parts.push(`${ev.amount} ${ev.type === 'solidos' ? 'g' : 'ml'}`);
      if (ev.duration) parts.push(`${Math.round(ev.duration / 60)} min`);
      if (ev.subType && ev.subType.toLowerCase() !== ev.type.toLowerCase()) parts.push(ev.subType);
    }

    return parts.join(' • ');
  };

  const isDay = isCurrentlyDayTime();

  // Lista de las 4 actividades con sus estadísticas y configuraciones
  const rows: {
    tipo: ReminderType;
    label: string;
    icon: React.ReactNode;
    colorBgLight: string;
    colorBgDark: string;
    borderLight: string;
    borderDark: string;
    textColorLight: string;
    textColorDark: string;
    statsMain: string;
    statsSub: string;
    lastTime?: string;
  }[] = [
    {
      tipo: 'panal',
      label: getReminderText('panal', lang),
      icon: <DiaperIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      colorBgLight: 'bg-amber-50',
      colorBgDark: 'bg-amber-950/30',
      borderLight: 'border-amber-200',
      borderDark: 'border-amber-800/50',
      textColorLight: 'text-amber-900',
      textColorDark: 'text-amber-200',
      statsMain: `${diaperStats.total} ${diaperStats.total === 1 ? 'pañal' : 'pañales'}`,
      statsSub: [
        diaperStats.wet > 0 ? `${diaperStats.wet} 💧` : null,
        diaperStats.dirty > 0 ? `${diaperStats.dirty} 💩` : null,
        diaperStats.mixed > 0 ? `${diaperStats.mixed} 🌟` : null,
        diaperStats.clean > 0 ? `${diaperStats.clean} ✨` : null,
      ].filter(Boolean).join(' • ') || '0 💧 • 0 💩'
    },
    {
      tipo: 'sueno',
      label: getReminderText('sueno', lang),
      icon: <span className="text-base">🌙</span>,
      colorBgLight: 'bg-purple-50',
      colorBgDark: 'bg-purple-950/30',
      borderLight: 'border-purple-200',
      borderDark: 'border-purple-800/50',
      textColorLight: 'text-purple-900',
      textColorDark: 'text-purple-200',
      statsMain: g9(sleepStats.totalSeconds),
      statsSub: `${sleepStats.totalSessions} ${sleepStats.totalSessions === 1 ? 'siesta' : 'siestas'}`
    },
    {
      tipo: 'lactancia',
      label: getReminderText('lactancia', lang),
      icon: <span className="text-base">🤱</span>,
      colorBgLight: 'bg-rose-50',
      colorBgDark: 'bg-rose-950/30',
      borderLight: 'border-rose-200',
      borderDark: 'border-rose-800/50',
      textColorLight: 'text-rose-900',
      textColorDark: 'text-rose-200',
      statsMain: g9(nursingStats.totalDuration),
      statsSub: `${nursingStats.count} ${nursingStats.count === 1 ? 'toma' : 'tomas'}`
    },
    {
      tipo: 'biberon',
      label: getReminderText('biberon', lang),
      icon: <span className="text-base">🍼</span>,
      colorBgLight: 'bg-blue-50',
      colorBgDark: 'bg-blue-950/30',
      borderLight: 'border-blue-200',
      borderDark: 'border-blue-800/50',
      textColorLight: 'text-blue-900',
      textColorDark: 'text-blue-200',
      statsMain: `${bottleStats.totalMl} ml`,
      statsSub: `${bottleStats.count} ${bottleStats.count === 1 ? 'toma' : 'tomas'}`
    }
  ];

  // 1.5. Calcular edad en meses y ventana de sueño
  const birthDateStr = (() => {
    try {
      const b = JSON.parse(localStorage.getItem('bubblo_baby') || '{}');
      return b.birthDate || '2026-02-15';
    } catch {
      return '2026-02-15';
    }
  })();
  const ageMonths = Math.max(0, Math.floor((Date.now() - new Date(birthDateStr).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
  let recommendedWindowMin = 90;
  if (ageMonths < 3) recommendedWindowMin = 60;
  else if (ageMonths < 6) recommendedWindowMin = 90;
  else if (ageMonths < 9) recommendedWindowMin = 120;
  else if (ageMonths < 12) recommendedWindowMin = 180;
  else recommendedWindowMin = 240;

  const sleepEvs = eventosHoy.filter(e => e.type === 'sueno');
  sleepEvs.sort((a, b) => (b.timestamp || new Date(`${b.date}T${b.time}`).getTime()) - (a.timestamp || new Date(`${a.date}T${a.time}`).getTime()));
  let lastWakeMs = Date.now() - (75 * 60 * 1000);
  if (sleepEvs.length > 0) {
    const last = sleepEvs[0];
    lastWakeMs = last.timestamp || new Date(`${last.date}T${last.time}`).getTime();
  }
  const elapsedMin = Math.floor((Date.now() - lastWakeMs) / (1000 * 60));
  const remainingWakeMin = recommendedWindowMin - elapsedMin;

  return (
    <div
      id="panel-resumen-del-dia"
      className={`resumen-dia ${isDark ? 'dark' : 'light'} p-4 sm:p-5 rounded-3xl shadow-lg border space-y-4 transition-all`}
    >
      {/* 1. Header con Título "RESUMEN DEL DÍA" */}
      <div className="flex items-center justify-between gap-2 border-b pb-3 border-slate-200/60 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="text-sm sm:text-base font-black font-heading text-slate-800 dark:text-white tracking-tight">
              {lang === 'en' ? 'TODAY\'S SUMMARY' : lang === 'fr' ? 'RÉSUMÉ DU JOUR' : lang === 'pt' ? 'RESUMO DO DIA' : 'RESUMEN DEL DÍA'}
            </h3>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isDay ? '☀️ Día' : '🌙 Noche'} • {eventosHoy.length} {lang === 'en' ? 'events today' : 'eventos hoy'}
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('stats')}
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition cursor-pointer whitespace-nowrap"
          >
            {t.viewAnalytics || 'Ver analíticas'} →
          </button>
        )}
      </div>

      {/* 1.5. Ventana de sueño calculada por edad en meses */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
        isDark ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💤</span>
          <div>
            <div className="font-black text-xs sm:text-sm">
              {(() => {
                const formatHumanNap = (totalMins: number) => {
                  const absMins = Math.abs(totalMins);
                  const hours = Math.floor(absMins / 60);
                  const mins = absMins % 60;
                  if (hours === 0) return `${mins} minutos`;
                  if (mins === 0) return hours === 1 ? `1 hora` : `${hours} horas`;
                  if (mins === 30) return hours === 1 ? `1 hora y media` : `${hours} horas y media`;
                  return hours === 1 ? `1 hora y ${mins} minutos` : `${hours} horas y ${mins} minutos`;
                };
                const humanNap = formatHumanNap(remainingWakeMin);
                return remainingWakeMin > 0 
                  ? (lang === 'en' ? `Next nap in ${humanNap}` : `Próxima siesta en ${humanNap}`)
                  : (lang === 'en' ? `Sleep window exceeded by ${humanNap}` : `Ventana de sueño excedida por ${humanNap}`);
              })()}
            </div>
            <div className="text-[10px] opacity-75 font-medium">
              Edad: {ageMonths} meses • Ventana ideal: {(() => {
                const hours = Math.floor(recommendedWindowMin / 60);
                const mins = recommendedWindowMin % 60;
                if (hours === 0) return `${mins} min`;
                if (mins === 0) return hours === 1 ? `1 hora` : `${hours} horas`;
                if (mins === 30) return hours === 1 ? `1 hora y media` : `${hours} horas y media`;
                return hours === 1 ? `1 hora y ${mins} min` : `${hours} horas y ${mins} min`;
              })()}
            </div>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-xl bg-indigo-500/20 font-black uppercase tracking-wider">
          {ageMonths < 3 ? 'RN' : `${ageMonths}m`}
        </span>
      </div>

      {/* 2. Grid 2x2 con las 4 tarjetas de eventos de hoy */}
      <div className="grid grid-cols-2 gap-3.5">
        {rows.map(row => (
          <div
            key={row.tipo}
            onClick={() => onNavigateTab && onNavigateTab('stats')}
            className={`p-4.5 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between shadow-md hover:shadow-lg active:scale-[0.98] ${
              isDark
                ? `${row.colorBgDark} ${row.borderDark} hover:border-amber-400/60`
                : `${row.colorBgLight} ${row.borderLight} hover:border-amber-400/80`
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold shadow-xs ${
                isDark ? 'bg-black/40 text-white' : 'bg-white shadow-sm text-slate-800'
              }`}>
                {row.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-2xs ${
                isDark ? 'bg-black/30 text-slate-200' : 'bg-white/80 text-slate-700'
              }`}>
                {row.label}
              </span>
            </div>
            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight ${
                isDark ? row.textColorDark : row.textColorLight
              }`}>
                {row.statsMain}
              </div>
              <div className="text-[11px] font-bold opacity-80 mt-1">
                {row.statsSub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Historial de eventos de hoy */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/70">
        <button
          type="button"
          onClick={() => setIsHistoryExpanded(prev => !prev)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 hover:opacity-80 py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span>📋</span>
            <span>{getReminderText('todayHistory', lang)} ({eventosHoy.length})</span>
          </span>
          {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isHistoryExpanded && (
          <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {eventosHoy.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
                {getReminderText('noEventsToday', lang)}
              </p>
            ) : (
              eventosHoy.map(ev => {
                const meta = W9_EVENTS[ev.type] || { emoji: '✨', label: ev.type };
                const detail = formatEventDetail(ev);
                return (
                  <div
                    key={ev.id}
                    className={`p-2.5 rounded-xl ${cardBase} border flex items-center justify-between gap-2 text-xs`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {ev.type === 'panal' ? <DiaperIcon className="w-3.5 h-3.5" /> : meta.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold capitalize truncate">{meta.label || ev.type}</div>
                        <div className="text-[10px] opacity-70 truncate">{ev.time} {detail ? `• ${detail}` : ''}</div>
                      </div>
                    </div>
                    {ev.notes && (
                      <div className="text-[10px] italic opacity-75 truncate max-w-[100px] flex-shrink-0">
                        "{ev.notes}"
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Exportar también como DailySummary para retrocompatibilidad completa
export const DailySummary = ResumenDelDia;
