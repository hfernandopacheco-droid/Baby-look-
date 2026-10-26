import React, { useState } from 'react';
import { BabyEvent, EventType } from '../types';

interface QuickPublicRegistrationProps {
  babyId?: string;
}

export const QuickPublicRegistration: React.FC<QuickPublicRegistrationProps> = ({ babyId = 'mathews' }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickSave = (type: EventType, subType?: string, amount?: number, duration?: number) => {
    setLoading(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().split('T')[0];
    
    const newEvent: BabyEvent = {
      id: 'quick_' + Date.now(),
      type,
      subType,
      amount,
      duration,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      notes: 'Registro rápido (Modo Invitado / QR)'
    };

    try {
      const storageKey = `bubblo_events_${babyId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([newEvent, ...existing]));
      
      // Also save generic events list
      const generic = JSON.parse(localStorage.getItem('bubblo_events_anonymous') || '[]');
      localStorage.setItem('bubblo_events_anonymous', JSON.stringify([newEvent, ...generic]));

      setSuccessMsg(`¡Registro guardado con éxito! (${type.toUpperCase()}${subType ? ' - ' + subType : ''})`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl mx-auto flex items-center justify-center text-3xl font-bold shadow-inner">
            🍼
          </div>
          <h1 className="text-xl font-black font-heading tracking-tight">Baby Day • Registro Rápido</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registra eventos para el bebé de forma instantánea sin necesidad de iniciar sesión.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl animate-fadeIn">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Pañal Mojado */}
          <button
            onClick={() => handleQuickSave('panal', 'Mojado')}
            disabled={loading}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">💧</span>
            <span className="text-xs font-black uppercase">Pañal Mojado</span>
          </button>

          {/* Pañal Sucio */}
          <button
            onClick={() => handleQuickSave('panal', 'Sucio')}
            disabled={loading}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">💩</span>
            <span className="text-xs font-black uppercase">Pañal Sucio</span>
          </button>

          {/* Pañal Limpio */}
          <button
            onClick={() => handleQuickSave('panal', 'Limpio')}
            disabled={loading}
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">✨</span>
            <span className="text-xs font-black uppercase">Pañal Limpio</span>
          </button>

          {/* Biberón 120ml */}
          <button
            onClick={() => handleQuickSave('biberon', undefined, 120)}
            disabled={loading}
            className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">🍼</span>
            <span className="text-xs font-black uppercase">Biberón 120ml</span>
          </button>

          {/* Lactancia 10 min */}
          <button
            onClick={() => handleQuickSave('lactancia', undefined, undefined, 600)}
            disabled={loading}
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">🤱</span>
            <span className="text-xs font-black uppercase">Teta 10 min</span>
          </button>

          {/* Sueño / Siesta */}
          <button
            onClick={() => handleQuickSave('sueno', undefined, undefined, 1800)}
            disabled={loading}
            className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 hover:scale-105 transition active:scale-95 flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-3xl">💤</span>
            <span className="text-xs font-black uppercase">Siesta / Sueño</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href="/"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            ← Volver a la aplicación principal Baby Day
          </a>
        </div>
      </div>
    </div>
  );
};
