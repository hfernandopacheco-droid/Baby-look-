import React, { useState } from 'react';
import { LanguageCode } from '../types';
import { rE } from '../i18n';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  onSelectDate: (dateStr: string | null) => void;
  recordedDates?: Set<string>;
  lang: LanguageCode;
  isDark: boolean;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  recordedDates = new Set(),
  lang,
  isDark
}) => {
  if (!isOpen) return null;

  const t = rE[lang] || rE.es;
  const todayStr = new Date().toISOString().split('T')[0];

  // Base view date: if a date is selected, view that month; otherwise view current month
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // Format month and year according to lang
  const monthYearLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(lang || 'es', {
    month: 'long',
    year: 'numeric'
  });

  // Weekdays localized (starting from Monday or Sunday based on locale)
  // Let's generate short weekday names using Intl
  const weekdays = React.useMemo(() => {
    const list: string[] = [];
    // Reference a known Monday (e.g. 2026-09-07 is a Monday)
    const baseMonday = new Date(2026, 8, 7); // September 7, 2026 is Monday
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      const name = d.toLocaleDateString(lang || 'es', { weekday: 'narrow' });
      list.push(name.toUpperCase());
    }
    return list;
  }, [lang]);

  // Days in current view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // First day of month (0 = Sunday, 1 = Monday...)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${viewYear}-${monthStr}-${dayStr}`;
    onSelectDate(fullDate);
    onClose();
  };

  const handleSelectToday = () => {
    onSelectDate(todayStr);
    onClose();
  };

  const handleClear = () => {
    onSelectDate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 border transition-all ${
          isDark 
            ? 'bg-[#1E1E2E] text-white border-slate-700' 
            : 'bg-white text-slate-800 border-amber-200/80 shadow-orange-500/10'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h3 className="font-extrabold text-base capitalize">
              {t.date || 'Seleccionar Fecha'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between py-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-black text-sm capitalize text-amber-600 dark:text-amber-400">
            {monthYearLabel}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {weekdays.map((wd, i) => (
            <div key={i} className="text-[10px] font-black text-slate-400 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty offset days */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="h-9" />
          ))}

          {/* Days in month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const monthStr = String(viewMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateKey = `${viewYear}-${monthStr}-${dayStr}`;

            const isSelected = selectedDate === dateKey;
            const isToday = todayStr === dateKey;
            const hasRecords = recordedDates.has(dateKey);

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                className={`h-9 rounded-xl text-xs font-bold relative flex flex-col items-center justify-center transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105 z-10'
                    : isToday
                    ? isDark
                      ? 'bg-slate-800 border border-amber-400 text-amber-400'
                      : 'bg-amber-50 border border-amber-500 text-amber-700'
                    : isDark
                    ? 'hover:bg-slate-800/80 text-slate-200'
                    : 'hover:bg-amber-100/60 text-slate-700'
                }`}
              >
                <span>{dayNum}</span>

                {/* Dot indicator if day has event records */}
                {hasRecords && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1 ${
                      isSelected ? 'bg-white' : 'bg-amber-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-200/60 dark:border-slate-800">
          <button
            onClick={handleSelectToday}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition cursor-pointer text-center"
          >
            {t.today || 'Hoy'}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer text-center"
          >
            {t.allHistory || 'Ver todos'}
          </button>
        </div>
      </div>
    </div>
  );
};
