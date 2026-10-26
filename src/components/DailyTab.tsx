import React, { useState, useEffect } from 'react';
import { BabyEvent, EventType, LanguageCode } from '../types';
import { rE } from '../i18n';
import { g9, W9_EVENTS } from '../utils';
import { Trash2, Clock, AlertCircle, Calendar as CalendarIcon, X, Filter } from 'lucide-react';
import { DiaperIcon } from './DiaperIcon';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { CalendarModal } from './CalendarModal';

interface DailyTabProps {
  events: BabyEvent[];
  onSaveEvent?: (event: Omit<BabyEvent, 'id' | 'timestamp'>) => void;
  onDeleteEvent: (id: string) => void;
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  onOpenModal?: (type?: EventType) => void;
}

export const DailyTab: React.FC<DailyTabProps> = ({
  events,
  onDeleteEvent,
  lang,
  isDark
}) => {
  const t = rE[lang] || rE.es;
  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';
  const [cloudEvents, setCloudEvents] = useState<BabyEvent[]>(events);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const subCols = ['sueno', 'lactancia', 'panal', 'biberon', 'diario'];
    const unsubs: (() => void)[] = [];
    const eventsMap: Record<string, BabyEvent[]> = {};

    try {
      subCols.forEach(col => {
        const q = query(collection(db, "users", uid, col), orderBy("timestamp", "desc"), limit(30));
        const unsub = onSnapshot(q, (snap) => {
          const list = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type || col,
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || '12:00',
              duration: data.duration,
              side: data.side,
              amount: data.amount,
              subType: data.subType,
              notes: data.notes || data.name || '',
              timestamp: data.createdAt?.toDate ? data.createdAt.toDate().getTime() : (data.timestamp || Date.now())
            } as BabyEvent;
          });
          eventsMap[col] = list;
          const combined = Object.values(eventsMap).flat().sort((a, b) => b.timestamp - a.timestamp);
          setCloudEvents(combined);
          setErrorMsg(null);
        }, (error) => {
          console.log(error);
          setErrorMsg("Cargando...");
        });
        unsubs.push(unsub);
      });
      return () => {
        unsubs.forEach(fn => fn());
      };
    } catch (e) {
      console.log(e);
      setErrorMsg("Cargando...");
    }
  }, []);

  const activeEvents = cloudEvents.length > 0 ? cloudEvents : events;

  // Set of all recorded dates to show dots in the calendar
  const recordedDates = React.useMemo(() => {
    const set = new Set<string>();
    activeEvents.forEach((ev) => {
      const dKey = ev.date || new Date(ev.timestamp).toISOString().slice(0, 10);
      if (dKey) set.add(dKey);
    });
    return set;
  }, [activeEvents]);

  // Filter events by selected date if set
  const filteredEvents = React.useMemo(() => {
    if (!selectedDate) return activeEvents;
    return activeEvents.filter((ev) => {
      const dKey = ev.date || new Date(ev.timestamp).toISOString().slice(0, 10);
      return dKey === selectedDate;
    });
  }, [activeEvents, selectedDate]);

  // Group filtered events by date: toISOString().slice(0, 10)
  const groupedEvents = React.useMemo(() => {
    const map = new Map<string, BabyEvent[]>();
    // Sort descending by timestamp
    const sorted = [...filteredEvents].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach((ev) => {
      const dateKey = ev.date || new Date(ev.timestamp).toISOString().slice(0, 10);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(ev);
    });

    return Array.from(map.entries());
  }, [filteredEvents]);

  // Format date header: weekday long, day numeric, month short
  const formatDateHeader = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(lang || 'es', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = (type: EventType) => {
    const meta = W9_EVENTS[type] || { emoji: '✨', label: type, color: 'amber', hex: '#FEF08A' };
    return {
      emoji: meta.emoji,
      label: meta.label,
      color: `bg-${meta.color}-500/15 text-${meta.color}-600 dark:text-${meta.color}-400 border-${meta.color}-400/30`
    };
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold font-heading flex items-center gap-2">
            <span>📖</span>
            <span>{t.diario}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historial de eventos de tu bebé
          </p>
        </div>
        <div className="text-xs font-bold text-slate-400">
          {activeEvents.length} {activeEvents.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      {/* Date Filter Bar - Free selection by calendar 📅 */}
      <div className={`p-3.5 rounded-3xl ${cardBase} border border-slate-200/80 dark:border-slate-800 space-y-2.5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Calendar Picker Button */}
          <button
            id="daily-tab-calendar-btn"
            onClick={() => setCalendarOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition cursor-pointer border shadow-sm ${
              selectedDate
                ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/30'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-amber-50/80 text-slate-800 border-amber-200/80'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span className="capitalize">
              {selectedDate ? formatDateHeader(selectedDate) : (t.date || 'Seleccionar fecha')}
            </span>
            <span className="text-xs opacity-75">📅</span>
          </button>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              {t.today || 'Hoy'}
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              Ayer
            </button>
            <button
              onClick={() => setSelectedDate(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedDate === null
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.allHistory || 'Todos'}
            </button>
          </div>
        </div>

        {/* Filter badge if active */}
        {selectedDate && (
          <div className="flex items-center justify-between text-xs px-2 pt-1 border-t border-slate-200/40 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Mostrando {filteredEvents.length} {filteredEvents.length === 1 ? 'registro' : 'registros'} del día
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver todos</span>
            </button>
          </div>
        )}
      </div>

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={(d) => setSelectedDate(d)}
        recordedDates={recordedDates}
        lang={lang}
        isDark={isDark}
      />

      {/* If no events in general */}
      {activeEvents.length === 0 ? (
        <div className={`p-8 rounded-3xl ${cardBase} text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700`}>
          <span className="text-4xl block">✨</span>
          <h3 className="font-bold text-base text-slate-700 dark:text-slate-200">
            {t.noEventsYet || 'No hay eventos registrados'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Toca cualquier evento en el carrusel de Inicio para agregar tu primer registro.
          </p>
        </div>
      ) : filteredEvents.length === 0 && selectedDate ? (
        /* If no events on selected date */
        <div className={`p-8 rounded-3xl ${cardBase} text-center space-y-3 border border-slate-200/60 dark:border-slate-800`}>
          <span className="text-3xl block">📅</span>
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
            No hay eventos registrados para el {formatDateHeader(selectedDate)}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Puedes seleccionar otra fecha en el calendario o ver todo el historial.
          </p>
          <button
            onClick={() => setSelectedDate(null)}
            className="px-4 py-2 rounded-2xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
          >
            {t.allHistory || 'Ver todos los registros'}
          </button>
        </div>
      ) : (
        /* Grouped by date: weekday long, day numeric, month short */
        <div className="space-y-6">
          {groupedEvents.map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 capitalize font-heading">
                  {formatDateHeader(dateKey)}
                </span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                <span className="text-[11px] font-semibold text-slate-400">
                  {dayEvents.length}
                </span>
              </div>

              <div className="space-y-2">
                {dayEvents.map((ev) => {
                  const info = getTypeIcon(ev.type);
                  const detailText = ev.subType || (ev.side ? `Pecho: ${ev.side}` : null) || (ev.amount ? `${ev.amount} ml` : null) || (ev.duration && ev.duration > 0 ? (ev.duration > 60 ? g9(ev.duration) : `${ev.duration}min`) : null) || (ev.temp ? `${ev.temp} °C` : null);
                  return (
                    <div
                      key={ev.id}
                      className={`relative p-3 rounded-2xl ${cardBase} shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 transition hover:shadow-md`}
                    >
                      {detailText && (
                        <span className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                          !isDark ? 'bg-slate-700 text-white shadow-md' : 'bg-white text-black shadow-md'
                        }`}>
                          {detailText}
                        </span>
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        {/* Zf 36px icon */}
                        <div
                          className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-xl shrink-0 border ${info.color}`}
                        >
                          <span className="select-none leading-none">
                            {ev.type === 'panal' ? <DiaperIcon className="w-5 h-5" /> : info.emoji}
                          </span>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-[#111827] dark:text-slate-100">
                              {info.label}
                            </span>
                            <span className={`${!isDark ? 'text-[#111827] font-bold' : 'text-slate-400'} text-xs font-medium`}>
                              {ev.time}
                            </span>
                          </div>

                          {ev.notes && (
                            <p className="text-xs text-[#111827] dark:text-slate-300 truncate font-semibold">
                              "{ev.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
