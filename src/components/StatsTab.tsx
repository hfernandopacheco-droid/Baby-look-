import React, { useState, useMemo } from 'react';
import { BabyEvent, EventType, LanguageCode } from '../types';
import { rE } from '../i18n';
import { KE, LE, TE, ZE, g9, W9_EVENTS } from '../utils';
import {
  Clock,
  ArrowLeft,
  Calendar,
  Layers,
  X,
  Info
} from 'lucide-react';

interface StatsTabProps {
  events: BabyEvent[];
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  filterEventType?: EventType | null;
  onClearFilter?: () => void;
  onSelectFilterEvent?: (type: EventType | null) => void;
}

type HistoryRange = 'dia' | 'semana' | 'mes' | 'ano';

export const StatsTab: React.FC<StatsTabProps> = ({
  events,
  lang,
  isDark,
  filterEventType,
  onClearFilter,
  onSelectFilterEvent
}) => {
  const t = rE[lang] || rE.es;
  const [vista, setVista] = useState<'patrones' | 'tendencias'>('patrones');
  const [periodo, setPeriodo] = useState<'hoy' | '7d' | 'todo'>('todo');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('semana');
  const [sleepFilter, setSleepFilter] = useState<'all' | 'dia' | 'noche'>('all');
  const [selectedHourDetail, setSelectedHourDetail] = useState<{
    hour: number;
    total: number;
    sueno: number;
    panal: number;
    lactancia: number;
    biberon: number;
    otros: number;
    events: BabyEvent[];
  } | null>(null);

  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  const getLastEventTime = (type: EventType) => {
    const filtered = events.filter((e) => e.type === type);
    if (filtered.length === 0) return 'Última: Sin registros';
    const latest = [...filtered].sort((a, b) => b.timestamp - a.timestamp)[0];
    return `Última: ${latest.date} ${latest.time || ''}`;
  };

  // -------------------------------------------------------------
  // Filtered by range for HISTORY VIEW of a specific event
  // -------------------------------------------------------------
  const eventHistoryList = useMemo(() => {
    if (!filterEventType) return [];
    const eventOnly = events.filter((e) => e.type === filterEventType);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return eventOnly.filter((e) => {
      if (historyRange === 'dia') {
        return e.date === todayStr || (e.timestamp && new Date(e.timestamp).toDateString() === now.toDateString());
      }
      if (historyRange === 'semana') {
        const limitTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        const d = new Date(limitTime);
        const limitStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return e.date >= limitStr || (e.timestamp && e.timestamp >= limitTime);
      }
      if (historyRange === 'mes') {
        const limitTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        const d = new Date(limitTime);
        const limitStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return e.date >= limitStr || (e.timestamp && e.timestamp >= limitTime);
      }
      if (historyRange === 'ano') {
        const limitTime = now.getTime() - 365 * 24 * 60 * 60 * 1000;
        const d = new Date(limitTime);
        const limitStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return e.date >= limitStr || (e.timestamp && e.timestamp >= limitTime);
      }
      return true;
    });
  }, [events, filterEventType, historyRange]);

  // Lista filtrada para mostrar en el historial (sincronizada con el filtro día / noche de sueño)
  const displayHistoryList = useMemo(() => {
    if (filterEventType === 'sueno' && sleepFilter !== 'all') {
      return eventHistoryList.filter((e) => {
        const hour = parseInt((e.time || '12:00').split(':')[0], 10) || 12;
        const isNight = hour >= 19 || hour < 7;
        return sleepFilter === 'dia' ? !isNight : isNight;
      });
    }
    return eventHistoryList;
  }, [eventHistoryList, filterEventType, sleepFilter]);

  // Grouped by date for the history list
  const groupedHistory = useMemo<Record<string, BabyEvent[]>>(() => {
    const groups: Record<string, BabyEvent[]> = {};
    // Sort descending by timestamp
    const sorted = [...displayHistoryList].sort((a, b) => {
      const timeA = `${a.date}T${a.time || '00:00'}`;
      const timeB = `${b.date}T${b.time || '00:00'}`;
      return timeB.localeCompare(timeA);
    });

    sorted.forEach((e) => {
      if (!groups[e.date]) {
        groups[e.date] = [];
      }
      groups[e.date].push(e);
    });

    return groups;
  }, [displayHistoryList]);

  // Specific algorithmic stats for the filtered event
  const historyDiaperData = useMemo(() => KE(eventHistoryList), [eventHistoryList]);
  const historyNursingData = useMemo(() => LE(eventHistoryList), [eventHistoryList]);
  const historySleepData = useMemo(() => TE(eventHistoryList), [eventHistoryList]);
  const historyBottleData = useMemo(() => ZE(eventHistoryList), [eventHistoryList]);

  // -------------------------------------------------------------
  // General Stats Filter for GENERAL DASHBOARD
  // -------------------------------------------------------------
  const generalFilteredEvents = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (periodo === 'hoy') {
      return events.filter((e) => {
        if (e.date === todayStr) return true;
        if (e.timestamp) {
          const ts = e.timestamp < 10000000000 ? e.timestamp * 1000 : e.timestamp;
          const evDate = new Date(ts);
          const evStr = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`;
          return evStr === todayStr;
        }
        return false;
      });
    }
    if (periodo === '7d') {
      const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      const d = new Date(sevenDaysAgoTime);
      const limitStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return events.filter((e) => {
        if (e.date && e.date >= limitStr) return true;
        if (e.timestamp) {
          const ts = e.timestamp < 10000000000 ? e.timestamp * 1000 : e.timestamp;
          if (ts >= sevenDaysAgoTime) return true;
        }
        return false;
      });
    }
    return events;
  }, [events, periodo]);

  const generalDiaperData = useMemo(() => KE(generalFilteredEvents), [generalFilteredEvents]);
  const generalNursingData = useMemo(() => LE(generalFilteredEvents), [generalFilteredEvents]);
  const generalSleepData = useMemo(() => TE(generalFilteredEvents), [generalFilteredEvents]);
  const generalBottleData = useMemo(() => ZE(generalFilteredEvents), [generalFilteredEvents]);

  // 24h Hourly Activity Heatmap con desglose multicolor por categoría
  const hourlyActivity = useMemo(() => {
    type HourSlot = {
      hour: number;
      total: number;
      sueno: number;
      panal: number;
      lactancia: number;
      biberon: number;
      otros: number;
      events: BabyEvent[];
    };

    const slots: HourSlot[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total: 0,
      sueno: 0,
      panal: 0,
      lactancia: 0,
      biberon: 0,
      otros: 0,
      events: []
    }));

    generalFilteredEvents.forEach((e) => {
      let h = -1;
      if (e.time) {
        h = parseInt(e.time.split(':')[0], 10);
      } else if (e.timestamp) {
        h = new Date(e.timestamp).getHours();
      }
      if (!isNaN(h) && h >= 0 && h < 24) {
        const slot = slots[h];
        slot.total++;
        slot.events.push(e);
        if (e.type === 'sueno') slot.sueno++;
        else if (e.type === 'panal') slot.panal++;
        else if (e.type === 'lactancia') slot.lactancia++;
        else if (e.type === 'biberon') slot.biberon++;
        else slot.otros++;
      }
    });

    const maxVal = Math.max(...slots.map(s => s.total), 1);
    return { slots, maxVal };
  }, [generalFilteredEvents]);

  // Gráfica de evolución y distribución diaria del sueño (Día vs Noche)
  const sleepDailyTrends = useMemo(() => {
    const map = new Map<string, { date: string; dayHours: number; nightHours: number; totalHours: number }>();
    eventHistoryList.forEach(e => {
      if (e.type !== 'sueno') return;
      const dStr = e.date || (e.timestamp ? new Date(e.timestamp).toISOString().split('T')[0] : 'Hoy');
      const hour = parseInt((e.time || '12:00').split(':')[0], 10) || 12;
      const isNight = hour >= 19 || hour < 7;
      const durHours = (e.duration || 60) / 60;

      const curr = map.get(dStr) || { date: dStr, dayHours: 0, nightHours: 0, totalHours: 0 };
      if (isNight) {
        curr.nightHours = Number((curr.nightHours + durHours).toFixed(1));
      } else {
        curr.dayHours = Number((curr.dayHours + durHours).toFixed(1));
      }
      curr.totalHours = Number((curr.dayHours + curr.nightHours).toFixed(1));
      map.set(dStr, curr);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [eventHistoryList]);

  // =========================================================================
  // VIEW A: SPECIFIC EVENT HISTORY VIEW (History of {B.types[card]})
  // =========================================================================
  if (filterEventType) {
    const meta = W9_EVENTS[filterEventType] || {
      label: filterEventType,
      emoji: '✨',
      color: 'amber',
      hex: '#FEF08A'
    };

    return (
      <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
        {/* Top bar with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onClearFilter && (
              <button
                type="button"
                onClick={onClearFilter}
                className="p-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition clay-press cursor-pointer flex items-center gap-1 text-xs font-bold shadow-sm"
                title="Volver a Estadísticas generales"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
            )}

            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading flex items-center gap-2">
                <span>{meta.emoji}</span>
                <span>Historial de {meta.label}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial cronológico y métricas de {meta.label.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Range tabs: dia / semana / mes / ano */}
          <div
            className={`flex rounded-2xl p-1 self-start sm:self-auto border ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-100/70 border-amber-200'
            }`}
          >
            {(['dia', 'semana', 'mes', 'ano'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setHistoryRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition clay-press cursor-pointer ${
                  historyRange === r
                    ? isDark
                      ? 'bg-amber-500/25 text-amber-300 shadow'
                      : 'bg-white text-slate-800 shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {r === 'dia' ? 'Día' : r === 'semana' ? 'Semana' : r === 'mes' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Card depending on event type */}
        {/* 1. PANAL: KE() breakdown mojado/sucio/mixto/limpio */}
        {filterEventType === 'panal' && (
          <div
            className={`p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧷</span>
                <div>
                  <h4 className="font-black text-sm font-heading">{t.diaperBreakdown}</h4>
                  <div className="text-[10px] text-slate-400">Desglose algorítmico KE()</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300">
                {historyDiaperData.total} {t.panal.toLowerCase()}s
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <div className="text-base sm:text-lg font-black font-heading text-sky-600 dark:text-sky-400">
                  {historyDiaperData.wet}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  {t.wet || 'Mojado'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-base sm:text-lg font-black font-heading text-amber-600 dark:text-amber-400">
                  {historyDiaperData.dirty}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  {t.dirty || 'Sucio'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <div className="text-base sm:text-lg font-black font-heading text-purple-600 dark:text-purple-400">
                  {historyDiaperData.mixed}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  {t.mixed || 'Mixto'}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-base sm:text-lg font-black font-heading text-emerald-600 dark:text-emerald-400">
                  {historyDiaperData.clean}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  Limpio
                </div>
              </div>
            </div>

            {historyDiaperData.total > 0 && (
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
                <div
                  style={{ width: `${(historyDiaperData.wet / historyDiaperData.total) * 100}%` }}
                  className="bg-sky-400"
                  title="Mojado"
                />
                <div
                  style={{ width: `${(historyDiaperData.dirty / historyDiaperData.total) * 100}%` }}
                  className="bg-amber-400"
                  title="Sucio"
                />
                <div
                  style={{ width: `${(historyDiaperData.mixed / historyDiaperData.total) * 100}%` }}
                  className="bg-purple-400"
                  title="Mixto"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. LACTANCIA: LE() left/right/both + duración */}
        {filterEventType === 'lactancia' && (
          <div
            className={`p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤱</span>
                <div>
                  <h4 className="font-black text-sm font-heading">{t.nursingDuration}</h4>
                  <div className="text-[10px] text-slate-400">Desglose por lado y duración LE()</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-300">
                {g9(historyNursingData.totalDuration)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                  {historyNursingData.left}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  Izquierdo (I)
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                  {historyNursingData.right}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  Derecho (D)
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                  {historyNursingData.both}
                </div>
                <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                  Ambos lados
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
              <span>Duración promedio por toma:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {g9(historyNursingData.avgDuration)}
              </span>
            </div>
          </div>
        )}

        {/* 3. SUEÑO: Patrón día / noche interactivo y sincronizado */}
        {filterEventType === 'sueno' && (
          <div
            className={`p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💤</span>
                <div>
                  <h4 className="font-black text-sm font-heading">{t.sleepDayNight}</h4>
                  <div className="text-[10px] text-slate-400">
                    Día (7:00 am - 7:00 pm) · Noche (7:00 pm - 7:00 am)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sleepFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSleepFilter('all')}
                    className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition cursor-pointer"
                    title="Mostrar todos los registros de sueño"
                  >
                    Ver todos
                  </button>
                )}
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-slate-800 text-indigo-800 dark:text-indigo-300">
                  {g9(historySleepData.totalSeconds)} total
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Botón Día (Sol ☀️) */}
              <button
                type="button"
                id="btn-sueno-dia"
                onClick={() => setSleepFilter(prev => prev === 'dia' ? 'all' : 'dia')}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer clay-press relative flex flex-col items-center justify-center ${
                  sleepFilter === 'dia'
                    ? 'bg-amber-500/25 border-2 border-amber-500 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-amber-500/10 border border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-500/15'
                }`}
                title="Toca para filtrar solo registros de día (siestas)"
              >
                {sleepFilter === 'dia' && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-slate-900 shadow-sm uppercase tracking-wider">
                    Activo
                  </span>
                )}
                <div className="text-base sm:text-lg font-black font-heading text-amber-600 dark:text-amber-400">
                  {g9(historySleepData.daySeconds)}
                </div>
                <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
                  <span>☀️</span>
                  <span>{t.daySleep}</span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {historySleepData.dayCount || 0} {(historySleepData.dayCount === 1) ? 'registro' : 'registros'}
                </div>
              </button>

              {/* Botón Noche (Luna 🌙) */}
              <button
                type="button"
                id="btn-sueno-noche"
                onClick={() => setSleepFilter(prev => prev === 'noche' ? 'all' : 'noche')}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer clay-press relative flex flex-col items-center justify-center ${
                  sleepFilter === 'noche'
                    ? 'bg-indigo-500/25 border-2 border-indigo-500 shadow-md ring-2 ring-indigo-400/40'
                    : 'bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400/60 hover:bg-indigo-500/15'
                }`}
                title="Toca para filtrar solo registros de noche"
              >
                {sleepFilter === 'noche' && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full text-[9px] font-black bg-indigo-500 text-white shadow-sm uppercase tracking-wider">
                    Activo
                  </span>
                )}
                <div className="text-base sm:text-lg font-black font-heading text-indigo-600 dark:text-indigo-400">
                  {g9(historySleepData.nightSeconds)}
                </div>
                <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1">
                  <span>🌙</span>
                  <span>{t.nightSleep}</span>
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  {historySleepData.nightCount || 0} {(historySleepData.nightCount === 1) ? 'registro' : 'registros'}
                </div>
              </button>
            </div>

            {sleepFilter !== 'all' && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
                <span>
                  Filtrando por: <strong className="text-amber-500 dark:text-amber-400">{sleepFilter === 'dia' ? '☀️ Solo Día (7:00 am - 7:00 pm)' : '🌙 Solo Noche (7:00 pm - 7:00 am)'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSleepFilter('all')}
                  className="underline text-[11px] hover:text-amber-500 cursor-pointer font-bold"
                >
                  Restablecer
                </button>
              </div>
            )}

            {/* Gráfica de Sueño Interactiva (Evolución y barras diarias Día vs Noche) */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <span>📊</span>
                  <span>Gráfica de Sueño por Días</span>
                </span>
                <span className="text-slate-400 text-[10px]">
                  ☀️ Siestas vs 🌙 Noche
                </span>
              </div>

              {sleepDailyTrends.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  No hay suficientes datos para graficar el sueño en este rango.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end gap-2 h-28 pt-4 px-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    {sleepDailyTrends.map((d, i) => {
                      const maxDaily = Math.max(...sleepDailyTrends.map(x => x.totalHours), 10);
                      const heightPct = Math.min(100, Math.max(12, (d.totalHours / maxDaily) * 100));
                      const dayPct = d.totalHours > 0 ? (d.dayHours / d.totalHours) * 100 : 50;
                      const nightPct = 100 - dayPct;

                      return (
                        <div key={d.date || i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip flotante */}
                          <div className="absolute -top-10 hidden group-hover:flex bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg shadow-lg z-20 whitespace-nowrap flex-col items-center pointer-events-none">
                            <span className="font-bold">{d.date} · {d.totalHours}h total</span>
                            <span className="text-[8px] text-amber-300">☀️ Día: {d.dayHours}h | 🌙 Noche: {d.nightHours}h</span>
                          </div>

                          {/* Barra apilada Día/Noche */}
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full max-w-[28px] rounded-t-lg overflow-hidden flex flex-col justify-end shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <div style={{ height: `${nightPct}%` }} className="bg-indigo-500 w-full" title={`Noche: ${d.nightHours}h`} />
                            <div style={{ height: `${dayPct}%` }} className="bg-amber-400 w-full" title={`Día: ${d.dayHours}h`} />
                          </div>

                          <span className="text-[9px] font-bold text-slate-400 mt-1 truncate max-w-[36px]">
                            {d.date.split('-').slice(1).join('/')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>☀️ Siestas de Día</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span>🌙 Sueño Nocturno</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. BIBERÓN: ZE() */}
        {filterEventType === 'biberon' && (
          <div
            className={`p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍼</span>
                <div>
                  <h4 className="font-black text-sm font-heading">{t.bottleFeeding}</h4>
                  <div className="text-[10px] text-slate-400">Consumo de leche ZE()</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300">
                {historyBottleData.totalMl} ml total
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                <div className="text-base font-black font-heading text-sky-600 dark:text-sky-400">
                  {historyBottleData.avgMl} <span className="text-[10px]">ml</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Promedio</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                <div className="text-base font-black font-heading text-emerald-600 dark:text-emerald-400">
                  {historyBottleData.maxMl} <span className="text-[10px]">ml</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Máximo</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
                <div className="text-base font-black font-heading text-rose-600 dark:text-rose-400">
                  {historyBottleData.minMl} <span className="text-[10px]">ml</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Mínimo</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. LISTA DE REGISTROS AGRUPADA POR FECHA */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Registros de {meta.label} ({displayHistoryList.length})
                {filterEventType === 'sueno' && sleepFilter !== 'all' && (
                  <span className="ml-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 lowercase">
                    ({sleepFilter === 'dia' ? 'solo día' : 'solo noche'})
                  </span>
                )}
              </span>
            </span>
          </h3>

          {Object.keys(groupedHistory).length === 0 ? (
            <div
              className={`p-8 text-center rounded-3xl ${cardBase} border border-dashed border-slate-300 dark:border-slate-700`}
            >
              <span className="text-3xl block mb-2">
                {filterEventType === 'sueno' ? (sleepFilter === 'dia' ? '☀️' : sleepFilter === 'noche' ? '🌙' : meta.emoji) : meta.emoji}
              </span>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {filterEventType === 'sueno' && sleepFilter !== 'all'
                  ? `No hay registros de sueño de ${sleepFilter === 'dia' ? 'día (7:00 am - 7:00 pm)' : 'noche (7:00 pm - 7:00 am)'} en este período.`
                  : `No hay registros de ${meta.label.toLowerCase()} en este período.`}
              </p>
            </div>
          ) : (
            (Object.entries(groupedHistory) as [string, BabyEvent[]][]).map(([dateStr, items]) => (
              <div key={dateStr} className="space-y-2">
                <div className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 px-1 uppercase tracking-wider">
                  📅 {dateStr}
                </div>

                <div className="space-y-2">
                  {items.map((e) => {
                    const isSleep = e.type === 'sueno';
                    const hour = parseInt((e.time || '12:00').split(':')[0], 10) || 12;
                    const isNight = isSleep ? (hour >= 19 || hour < 7) : false;
                    const itemEmoji = isSleep ? (isNight ? '🌙' : '☀️') : meta.emoji;

                    return (
                      <div
                        key={e.id}
                        className={`p-3.5 rounded-2xl ${cardBase} border ${
                          isSleep
                            ? isNight
                              ? 'border-indigo-500/30 bg-indigo-500/5'
                              : 'border-amber-500/30 bg-amber-500/5'
                            : 'border-amber-200/40 dark:border-slate-700/50'
                        } flex items-center justify-between gap-3`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl select-none" title={isSleep ? (isNight ? 'Noche (7pm - 7am)' : 'Día (7am - 7pm)') : meta.label}>
                            {itemEmoji}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black font-heading text-slate-800 dark:text-slate-100">
                                {e.time}
                              </span>
                              {isSleep && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isNight
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                }`}>
                                  {isNight ? '🌙 Noche' : '☀️ Día'}
                                </span>
                              )}
                              {e.subType && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold badge-dark ${
                                  !isDark ? 'bg-[#111827] text-white' : 'bg-white text-black'
                                }`}>
                                  {e.subType}
                                </span>
                              )}
                              {e.side && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold badge-dark ${
                                  !isDark ? 'bg-[#111827] text-white' : 'bg-white text-black'
                                }`}>
                                  Lado {e.side}
                                </span>
                              )}
                              {e.amount && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold badge-dark ${
                                  !isDark ? 'bg-[#111827] text-white' : 'bg-white text-black'
                                }`}>
                                  {e.amount} {e.type === 'solidos' ? 'g' : 'ml'}
                                </span>
                              )}
                              {e.duration && e.duration > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold badge-dark ${
                                  !isDark ? 'bg-[#111827] text-white' : 'bg-white text-black'
                                }`}>
                                  ⏱️ {g9(e.duration)}
                                </span>
                              )}
                            </div>

                            {e.notes && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {e.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-slate-400 shrink-0">
                          {isSleep ? (isNight ? 'Sueño Noche' : 'Sueño Día') : meta.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: GENERAL STATISTICS DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold font-heading flex items-center gap-2">
            <span>📊</span>
            <span>{t.stats} y Patrones de Rutina</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Análisis algorítmico de pañales, tomas, descansos y alimentación
          </p>
        </div>

        <div
          className={`flex rounded-2xl p-1 self-start sm:self-auto border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-100/70 border-amber-200'
          }`}
        >
          <button
            onClick={() => setPeriodo('hoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodo === 'hoy'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.today}
          </button>
          <button
            onClick={() => setPeriodo('7d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodo === '7d'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.last7Days}
          </button>
          <button
            onClick={() => setPeriodo('todo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              periodo === 'todo'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.allHistory}
          </button>
        </div>
      </div>

      {/* Subtabs vista ("patrones" | "tendencias") */}
      <div
        className={`flex rounded-2xl p-1.5 gap-2 border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-amber-100/60 border-amber-200/60'
        }`}
      >
        <button
          onClick={() => setVista('patrones')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center clay-press ${
            vista === 'patrones'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          ⏰ Patrones de Rutina (24h)
        </button>
        <button
          onClick={() => setVista('tendencias')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center clay-press ${
            vista === 'tendencias'
              ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-[1.02]'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          📈 Tendencias y Comparativas
        </button>
      </div>

      {vista === 'patrones' ? (
        /* 24-Hour Activity Pattern */
        generalFilteredEvents.length === 0 ? (
          <div className={`p-8 text-center rounded-3xl ${cardBase} shadow-lg border border-amber-200/40 dark:border-slate-700/50`}>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin datos aún - agrega un pañal, sueño o biberón</p>
          </div>
        ) : (
          <div
            className={`p-5 rounded-3xl ${cardBase} shadow-lg border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-wider font-heading">
                  {t.hourlyPattern}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">24 horas (00:00 - 23:59)</span>
            </div>

            {/* Leyenda interactiva de colores */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span>Guía de Colores por Actividad</span>
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hidden sm:inline">
                  Toca una barra para ver detalles
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>🌙 Sueño</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                  <span>🧷 Pañal</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-pink-500/10 text-pink-700 dark:text-pink-300 border border-pink-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                  <span>🤱 Lactancia</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>🍼 Biberón</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>🥕 Otros</span>
                </div>
              </div>
            </div>

            {/* Gráfica de 24 barras interactivas con segmentos apilados */}
            <div className="space-y-1">
              <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-32 pt-5 px-1 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {hourlyActivity.slots.map((slot) => {
                  const heightPercent = slot.total > 0
                    ? Math.max((slot.total / hourlyActivity.maxVal) * 100, 16)
                    : 6;

                  // Porcentajes de cada segmento dentro de la barra
                  const suenoPct = slot.total > 0 ? (slot.sueno / slot.total) * 100 : 0;
                  const panalPct = slot.total > 0 ? (slot.panal / slot.total) * 100 : 0;
                  const lactanciaPct = slot.total > 0 ? (slot.lactancia / slot.total) * 100 : 0;
                  const biberonPct = slot.total > 0 ? (slot.biberon / slot.total) * 100 : 0;
                  const otrosPct = slot.total > 0 ? (slot.otros / slot.total) * 100 : 0;

                  return (
                    <button
                      key={slot.hour}
                      type="button"
                      onClick={() => setSelectedHourDetail(slot)}
                      className="flex flex-col items-center h-full justify-end group relative cursor-pointer focus:outline-none clay-press"
                      title={`Toca para ver ${slot.hour}:00 - ${slot.total} registros`}
                    >
                      {/* Tooltip rápido al pasar el cursor */}
                      <div className="absolute -top-8 hidden group-hover:flex bg-slate-950 text-white text-[9px] px-2 py-0.5 rounded shadow-lg z-20 whitespace-nowrap pointer-events-none">
                        {slot.hour}:00 • {slot.total} reg.
                      </div>

                      {/* Barra apilada multicolor */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all group-hover:scale-105 shadow-sm ${
                          slot.total === 0 ? 'bg-slate-200/60 dark:bg-slate-700/40' : 'border-t border-white/20'
                        }`}
                      >
                        {otrosPct > 0 && (
                          <div style={{ height: `${otrosPct}%` }} className="bg-emerald-500 w-full" />
                        )}
                        {biberonPct > 0 && (
                          <div style={{ height: `${biberonPct}%` }} className="bg-amber-400 w-full" />
                        )}
                        {lactanciaPct > 0 && (
                          <div style={{ height: `${lactanciaPct}%` }} className="bg-pink-500 w-full" />
                        )}
                        {panalPct > 0 && (
                          <div style={{ height: `${panalPct}%` }} className="bg-cyan-500 w-full" />
                        )}
                        {suenoPct > 0 && (
                          <div style={{ height: `${suenoPct}%` }} className="bg-indigo-500 w-full" />
                        )}
                      </div>

                      <span className="text-[8px] font-bold text-slate-400 mt-1 select-none">
                        {slot.hour % 3 === 0 ? `${slot.hour}h` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-center text-slate-400 italic pt-1">
                Toca cualquier barra horaria para abrir la ventana con el detalle y significado de cada color.
              </p>
            </div>
          </div>
        )
      ) : (
        /* Tendencias y Comparativas View */
        <div className={`p-6 rounded-3xl ${cardBase} shadow-lg border border-amber-200/40 dark:border-slate-700/50 space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider font-heading flex items-center gap-2">
              <span>📈</span>
              <span>Análisis de Tendencias ({generalFilteredEvents.length} eventos en periodo)</span>
            </h3>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Comparativa Activa</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-2xl block mb-1">🧷</span>
              <div className="text-lg font-black">{generalDiaperData.total} pañales</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total en el periodo seleccionado</div>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
              <span className="text-2xl block mb-1">💤</span>
              <div className="text-lg font-black">{generalSleepData.totalHours} h</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Horas totales de sueño</div>
            </div>
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <span className="text-2xl block mb-1">🍼</span>
              <div className="text-lg font-black">{generalBottleData.totalMl} ml</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Consumo total de fórmula</div>
            </div>
          </div>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 italic pt-2">
            Las tendencias se actualizan automáticamente según el filtro de tiempo superior (Hoy, Últimos 7 días, Todo).
          </p>
        </div>
      )}

      {/* Direct link pills to view specific event history */}
      {onSelectFilterEvent && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Ver Historial Detallado por Evento
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['sueno', 'lactancia', 'panal', 'biberon', 'solidos', 'bombeo', 'paseo', 'bano'] as EventType[]).map(
              (et) => {
                const meta = W9_EVENTS[et];
                return (
                  <button
                    key={et}
                    type="button"
                    onClick={() => onSelectFilterEvent(et)}
                    className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition clay-press flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <span>{meta?.emoji}</span>
                    <span>{meta?.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Grid of Statistical Functions KE(), LE(), TE(), ZE() */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KE(): Diaper Breakdown */}
        <div
          onClick={() => onSelectFilterEvent && onSelectFilterEvent('panal')}
          className={`relative p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black ${
            !isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-black shadow-md'
          }`}>
            {generalDiaperData.total} {t.panal.toLowerCase()}s
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧷</span>
              <div>
                <h4 className="font-black text-sm font-heading">{t.diaperBreakdown}</h4>
                <div className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-[10px]`}>Toca para ver historial completo</div>
                <span className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-xs mt-1 block`}>
                  {getLastEventTime('panal')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <div className="text-xl font-black font-heading text-sky-600 dark:text-sky-400">
                {generalDiaperData.wet}
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                {t.wet}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xl font-black font-heading text-amber-600 dark:text-amber-400">
                {generalDiaperData.dirty}
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                {t.dirty}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-xl font-black font-heading text-purple-600 dark:text-purple-400">
                {generalDiaperData.mixed}
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                {t.mixed}
              </div>
            </div>
          </div>

          {generalDiaperData.total > 0 && (
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
              <div
                style={{ width: `${(generalDiaperData.wet / generalDiaperData.total) * 100}%` }}
                className="bg-sky-400"
                title="Mojado"
              />
              <div
                style={{ width: `${(generalDiaperData.dirty / generalDiaperData.total) * 100}%` }}
                className="bg-amber-400"
                title="Sucio"
              />
              <div
                style={{ width: `${(generalDiaperData.mixed / generalDiaperData.total) * 100}%` }}
                className="bg-purple-400"
                title="Mixto"
              />
            </div>
          )}
        </div>

        {/* TE(): Sleep Day / Night */}
        <div
          className={`relative p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4`}
        >
          <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black ${
            !isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-black shadow-md'
          }`}>
            {generalSleepData.totalHours} h total
          </span>

          <div
            onClick={() => {
              setSleepFilter('all');
              if (onSelectFilterEvent) onSelectFilterEvent('sueno');
            }}
            className="flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">💤</span>
              <div>
                <h4 className="font-black text-sm font-heading">{t.sleepDayNight}</h4>
                <div className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-[10px]`}>
                  Día (7am - 7pm) · Noche (7pm - 7am) · Toca para ver historial
                </div>
                <span className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-xs mt-1 block`}>
                  {getLastEventTime('sueno')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              type="button"
              onClick={() => {
                setSleepFilter('dia');
                if (onSelectFilterEvent) onSelectFilterEvent('sueno');
              }}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition cursor-pointer"
              title="Filtrar historial por sueño de día"
            >
              <div className="text-lg font-black font-heading text-amber-600 dark:text-amber-400">
                {generalSleepData.dayHours} h
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center justify-center gap-1">
                <span>☀️</span>
                <span>{t.daySleep}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {generalSleepData.dayCount || 0} reg.
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setSleepFilter('noche');
                if (onSelectFilterEvent) onSelectFilterEvent('sueno');
              }}
              className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition cursor-pointer"
              title="Filtrar historial por sueño de noche"
            >
              <div className="text-lg font-black font-heading text-indigo-600 dark:text-indigo-400">
                {generalSleepData.nightHours} h
              </div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5 flex items-center justify-center gap-1">
                <span>🌙</span>
                <span>{t.nightSleep}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {generalSleepData.nightCount || 0} reg.
              </div>
            </button>
          </div>

          {/* Barra de proporción Día vs Noche */}
          {generalSleepData.totalHours > 0 && (
            <div className="space-y-1 pt-1">
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
                <div
                  style={{ width: `${(generalSleepData.dayHours / generalSleepData.totalHours) * 100}%` }}
                  className="bg-amber-400"
                  title={`Día: ${generalSleepData.dayHours}h`}
                />
                <div
                  style={{ width: `${(generalSleepData.nightHours / generalSleepData.totalHours) * 100}%` }}
                  className="bg-indigo-500"
                  title={`Noche: ${generalSleepData.nightHours}h`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 px-1">
                <span>☀️ Día {Math.round((generalSleepData.dayHours / generalSleepData.totalHours) * 100)}%</span>
                <span>🌙 Noche {Math.round((generalSleepData.nightHours / generalSleepData.totalHours) * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ZE(): Bottle Feeding ml */}
        <div
          onClick={() => onSelectFilterEvent && onSelectFilterEvent('biberon')}
          className={`relative p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black ${
            !isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-black shadow-md'
          }`}>
            {generalBottleData.totalMl} ml total
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍼</span>
              <div>
                <h4 className="font-black text-sm font-heading">{t.bottleFeeding}</h4>
                <div className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-[10px]`}>Toca para ver historial completo</div>
                <span className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-xs mt-1 block`}>
                  {getLastEventTime('biberon')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <div className="text-base font-black font-heading text-sky-600 dark:text-sky-400">
                {generalBottleData.avgMl} <span className="text-[10px]">ml</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Promedio</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <div className="text-base font-black font-heading text-emerald-600 dark:text-emerald-400">
                {generalBottleData.maxMl} <span className="text-[10px]">ml</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Máximo</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60">
              <div className="text-base font-black font-heading text-rose-600 dark:text-rose-400">
                {generalBottleData.minMl} <span className="text-[10px]">ml</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Mínimo</div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span>Total tomas registradas:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{generalBottleData.count}</span>
          </div>
        </div>

        {/* LE(): Breastfeeding by Side + Duration */}
        <div
          onClick={() => onSelectFilterEvent && onSelectFilterEvent('lactancia')}
          className={`relative p-5 rounded-3xl ${cardBase} shadow-md border border-amber-200/40 dark:border-slate-700/50 space-y-4 cursor-pointer hover:border-amber-400 transition-colors`}
        >
          <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-black ${
            !isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-black shadow-md'
          }`}>
            {g9(generalNursingData.totalDuration)}
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤱</span>
              <div>
                <h4 className="font-black text-sm font-heading">{t.nursingDuration}</h4>
                <div className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-[10px]`}>Toca para ver historial completo</div>
                <span className={`${!isDark ? 'text-[#111827] font-bold' : 'text-gray-400'} text-xs mt-1 block`}>
                  {getLastEventTime('lactancia')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                {generalNursingData.left}
              </div>
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Izquierdo (I)
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                {generalNursingData.right}
              </div>
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Derecho (D)
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-base font-black font-heading text-rose-700 dark:text-rose-300">
                {generalNursingData.both}
              </div>
              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                Ambos lados
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span>Duración promedio por toma:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {g9(generalNursingData.avgDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal flotante ("ventana pequeñita") al tocar cualquier barra de la gráfica de patrones */}
      {selectedHourDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedHourDetail(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />
          <div
            className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 border transition-all ${
              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-900'
            }`}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-sm font-heading">
                    Bloque {String(selectedHourDetail.hour).padStart(2, '0')}:00 - {String(selectedHourDetail.hour).padStart(2, '0')}:59
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedHourDetail.total} {selectedHourDetail.total === 1 ? 'registro en este horario' : 'registros en este horario'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHourDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Información interactiva de qué es cada color */}
            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                ¿Qué representa cada color?
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                  selectedHourDetail.sueno > 0
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                  <div className="truncate">
                    <span className="block font-black">Morado</span>
                    <span className="text-[10px]">Sueño ({selectedHourDetail.sueno})</span>
                  </div>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                  selectedHourDetail.panal > 0
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
                  <div className="truncate">
                    <span className="block font-black">Celeste</span>
                    <span className="text-[10px]">Pañal ({selectedHourDetail.panal})</span>
                  </div>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                  selectedHourDetail.lactancia > 0
                    ? 'bg-pink-500/15 border-pink-500/30 text-pink-700 dark:text-pink-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-pink-500 shrink-0" />
                  <div className="truncate">
                    <span className="block font-black">Rosa</span>
                    <span className="text-[10px]">Lactancia ({selectedHourDetail.lactancia})</span>
                  </div>
                </div>

                <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                  selectedHourDetail.biberon > 0
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="block font-black">Ámbar</span>
                    <span className="text-[10px]">Biberón ({selectedHourDetail.biberon})</span>
                  </div>
                </div>
              </div>

              {selectedHourDetail.otros > 0 && (
                <div className="p-2 rounded-xl border bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 text-[11px]">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-black">Verde: </span>
                    <span>Otros eventos ({selectedHourDetail.otros})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Listado de eventos ocurridos en esta hora */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Historial de esta hora:
              </span>

              {selectedHourDetail.events.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400 italic">
                    Sin eventos registrados entre {selectedHourDetail.hour}:00 y {selectedHourDetail.hour}:59 en el período actual.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                  {selectedHourDetail.events.map((ev, idx) => {
                    const meta = W9_EVENTS[ev.type];
                    return (
                      <div
                        key={ev.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base select-none">{meta?.emoji || '✨'}</span>
                          <div className="truncate">
                            <span className="font-bold block truncate text-slate-800 dark:text-slate-100">
                              {ev.time || '--:--'} · {meta?.label || ev.type}
                            </span>
                            {ev.notes && (
                              <span className="text-[10px] text-slate-400 truncate block">
                                {ev.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                          {ev.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedHourDetail(null)}
              className="w-full mt-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 transition cursor-pointer clay-press"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
