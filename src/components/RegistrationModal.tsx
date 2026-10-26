import React, { useState, useEffect, useRef } from 'react';
import { EventType, BreastSide, DiaperSubType, LanguageCode } from '../types';
import { rE } from '../i18n';
import {
  B7,
  g9,
  kE,
  bA,
  YA,
  crono,
  corregirCamposBlancos,
  lapizMovible,
  autoScrollFabPlus,
  W9_EVENTS,
  getLocalDateString
} from '../utils';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Moon
} from 'lucide-react';
import { DiaperIcon } from './DiaperIcon';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: {
    type: EventType;
    time: string;
    date: string;
    duration?: number;
    amount?: number;
    side?: BreastSide;
    subType?: string;
    notes?: string;
    temp?: number;
  }) => Promise<void> | void;
  initialType?: EventType;
  lang: LanguageCode;
  onSelectLang?: (lang: LanguageCode) => void;
  onEnterAdmin?: () => void;
  isDark: boolean;
  useClay?: boolean;
  // Sincronización cronómetro
  tA?: boolean;
  mA?: number;
  v9?: BreastSide;
  setV9?: (side: BreastSide) => void;
  Dz?: () => void;
  uz?: () => void;
  resetLactancia?: () => void;
  GA?: boolean;
  _A?: number;
  Mz?: () => void;
  Oz?: () => void;
  resetSueno?: () => void;
  onNavigateToHome?: () => void;
}

const AVAILABLE_LANGUAGES: { code: LanguageCode; name: string; flag: string }[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'panal',
  lang,
  onSelectLang,
  onEnterAdmin,
  isDark,
  tA,
  mA,
  v9,
  setV9,
  Dz,
  uz,
  resetLactancia,
  GA,
  _A,
  Mz,
  Oz,
  resetSueno,
  onNavigateToHome
}) => {
  const t = rE[lang] || rE.es;

  // Puerta secreta 110305
  const [doorTaps, setDoorTaps] = useState<number>(0);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [adminCode, setAdminCode] = useState<string>('');

  const handleDoorTap = () => {
    const newTaps = doorTaps + 1;
    setDoorTaps(newTaps);
    setTimeout(() => setDoorTaps(0), 3000);
    if (newTaps >= 5) {
      setShowCodeModal(true);
      setDoorTaps(0);
    }
  };

  const handleAdminLogin = () => {
    if (adminCode === '110305') {
      localStorage.setItem('bubblo_admin', '1');
      setShowCodeModal(false);
      setAdminCode('');
      setDoorTaps(0);
      window.location.hash = '#admin';
      onClose();
      if (onEnterAdmin) {
        onEnterAdmin();
      }
    } else {
      alert('Código incorrecto');
      setAdminCode('');
    }
  };

  // Selected event is STRICTLY the one triggered (no multi-event selector inside modal)
  const selectedType: EventType = (initialType ?? 'panal') as EventType;

  // Form State
  const [eventTime, setEventTime] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [side, setSide] = useState<BreastSide>(v9 || 'D');
  const [subType, setSubType] = useState<string>('Mojado');
  const [notes, setNotes] = useState<string>('');
  const [temp, setTemp] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Local fallback timer state if not provided
  const [localTimerSeconds, setLocalTimerSeconds] = useState<number>(0);
  const [localTimerRunning, setLocalTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const isTimerEvent = selectedType === 'sueno' || selectedType === 'lactancia';
  const isLact = selectedType === 'lactancia';
  const isSue = selectedType === 'sueno';

  const timerRunning = isLact ? (tA ?? false) : isSue ? (GA ?? false) : localTimerRunning;
  const timerSeconds = isLact ? (mA ?? 0) : isSue ? (_A ?? 0) : localTimerSeconds;

  const currentSide = isLact ? (v9 || side) : side;

  const handleToggleTimer = () => {
    if (isLact && Dz) {
      Dz();
      return;
    }
    if (isSue && Mz) {
      Mz();
      return;
    }
    setLocalTimerRunning(prev => !prev);
  };

  const handleResetTimer = () => {
    if (isLact && resetLactancia) {
      resetLactancia();
      return;
    }
    if (isSue && resetSueno) {
      resetSueno();
      return;
    }
    setLocalTimerRunning(false);
    setLocalTimerSeconds(0);
  };

  // Initialize form fields when opening
  // NO auto-start: el usuario le da a Iniciar manualmente
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setEventTime(`${hh}:${mm}`);
      setEventDate(getLocalDateString(now));

      setAmount('');
      setSide(v9 || 'D');
      setSubType('Mojado');
      setNotes('');
      setTemp('');
      setSuccessMsg('');

      setTimeout(() => {
        corregirCamposBlancos();
        crono();
      }, 50);
    }
  }, [isOpen, initialType, v9]);

  // Stopwatch timer interval for local fallback only
  useEffect(() => {
    if (!isLact && !isSue && localTimerRunning && isTimerEvent) {
      timerRef.current = setInterval(() => {
        setLocalTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [localTimerRunning, isTimerEvent, isLact, isSue]);

  // Run crono() on timer changes
  useEffect(() => {
    if (isTimerEvent) {
      crono();
    }
  }, [timerSeconds, timerRunning, isTimerEvent]);

  if (!isOpen) return null;

  // Auto diaper subType detection kE() when typing in notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (selectedType === 'panal') {
      const detected = kE(val);
      if (detected) {
        setSubType(detected);
      }
    }
  };

  // Despertar y guardar para sueño
  const handleDespertar = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (Oz) {
      Oz();
    } else {
      handleSubmit(e as any);
    }
    onClose();
    if (onNavigateToHome) onNavigateToHome();
  };

  // Guardar toma para lactancia
  const handleSaveLactanciaClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (uz) {
      uz();
    } else {
      handleSubmit(e as any);
    }
    onClose();
    if (onNavigateToHome) onNavigateToHome();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedType === 'sueno' && Oz) {
      Oz();
      onClose();
      if (onNavigateToHome) onNavigateToHome();
      return;
    }
    if (selectedType === 'lactancia' && uz) {
      uz();
      onClose();
      if (onNavigateToHome) onNavigateToHome();
      return;
    }

    const recordData: {
      type: EventType;
      time: string;
      date: string;
      duration?: number;
      amount?: number;
      side?: BreastSide;
      subType?: string;
      notes?: string;
      temp?: number;
    } = {
      type: selectedType,
      time: eventTime || new Date().toTimeString().slice(0, 5),
      date: eventDate || getLocalDateString(),
      notes: notes.trim() ? notes.trim() : undefined
    };

    // Duration only for timer events
    if (isTimerEvent && timerSeconds > 0) {
      recordData.duration = timerSeconds;
    }

    // Side for lactancia / bombeo
    if (selectedType === 'lactancia' || selectedType === 'bombeo') {
      recordData.side = side;
    }

    // Diaper condition
    if (selectedType === 'panal') {
      recordData.subType = subType;
    }

    // Amounts
    if (selectedType === 'biberon' || selectedType === 'bombeo' || selectedType === 'solidos') {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        recordData.amount = parsedAmount;
      }
    }

    // Temperature
    if (selectedType === 'temperatura') {
      const parsedTemp = parseFloat(temp);
      if (!isNaN(parsedTemp) && parsedTemp > 0) {
        recordData.temp = parsedTemp;
      }
    }

    await onSave(recordData);
    bA(window.innerWidth / 2, window.innerHeight / 2);
    YA(`✓ ${W9_EVENTS[selectedType]?.label || selectedType} registrado`);
    onClose();
    if (onNavigateToHome) {
      onNavigateToHome();
    }
  };

  const meta = W9_EVENTS[selectedType] || {
    label: selectedType,
    emoji: '✨',
    color: 'amber',
    hex: '#FEF08A'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop with blur - modal sobre Inicio */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[20px] backdrop-saturate-[180%] transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl transition-all duration-200 z-10 border ${
          isDark
            ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white/95 border-amber-200/80 text-slate-800 shadow-[0_20px_60px_rgba(245,158,11,0.25)]'
        }`}
      >
        {/* Header - ONLY THIS EVENT */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none flex items-center justify-center">
              {selectedType === 'panal' ? <DiaperIcon className="w-8 h-8" /> : meta.emoji}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black font-heading tracking-tight">
                {meta.label}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Nuevo registro de {meta.label.toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language dropdown selector */}
            <select
              id="registration-lang-select"
              value={lang}
              onChange={(e) => {
                const newLang = e.target.value as LanguageCode;
                if (onSelectLang) {
                  onSelectLang(newLang);
                }
                localStorage.setItem('bubblo_lang', newLang);
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
              }}
              className={`text-xs font-bold px-2 py-1 rounded-xl border outline-none cursor-pointer transition ${
                isDark
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-amber-50 text-slate-700 border-amber-200'
              }`}
            >
              {AVAILABLE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            {/* Secret door icon (5 taps in 3s triggers code 110305) */}
            <button
              type="button"
              id="door-secret-btn-registration"
              onClick={handleDoorTap}
              className="opacity-20 hover:opacity-100 transition-opacity p-1 cursor-pointer select-none text-sm"
              title="Bubblo"
            >
              🚪
            </button>

            <button
              id="close-registration-modal-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer clay-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success message banner */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORMULARIO DE ESE EVENTO ÚNICAMENTE (SIN TABS DE OTROS EVENTOS) */}
        {/* ========================================================================= */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. CASO SUEÑO: solo DURACIÓN / EN CURSO 00:00:00 + Fecha, Hora, Observaciones, Guardar con cronómetro B7() */}
          {selectedType === 'sueno' && (
            <div className="space-y-4">
              {/* Cronómetro Actividad en curso */}
              <div className={`mt-3 p-4 rounded-[20px] border-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                !isDark
                  ? "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#FDBA74]"
                  : "bg-gradient-to-br from-[#2D2A3A] to-[#3A2E4A] border-[#6B4A7A]"
              } text-center space-y-3`}>
                <div className={`flex items-center justify-between text-[11px] font-bold uppercase tracking-widest px-1 ${
                  !isDark ? "text-amber-800/80" : "text-purple-300"
                }`}>
                  <span>DURACIÓN / EN CURSO</span>
                  {timerRunning && (
                    <span className="animate-pulse text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>EN CURSO</span>
                    </span>
                  )}
                </div>

                {/* Digits with stroke crono-bn in dark mode, clean black in light mode */}
                <div className="py-2">
                  <div
                    className={`select-none tracking-wider font-mono text-[32px] font-black ${
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
                    {B7(timerSeconds)}
                  </div>
                  <div className={`text-[11px] font-semibold mt-1 ${
                    !isDark ? "text-amber-900/80" : "text-indigo-300"
                  }`}>
                    {t.duration}: {g9(timerSeconds)}
                  </div>
                </div>

                {/* Botones Iniciar/Pausar/Reanudar/Despertar y guardar */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {!timerRunning ? (
                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{timerSeconds > 0 ? (t.resume || 'Reanudar') : (t.start || 'Iniciar')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>{t.pause || 'Pausar'}</span>
                    </button>
                  )}

                  {/* Despertar y guardar */}
                  <button
                    type="button"
                    onClick={handleDespertar}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Despertar y guardar ☀️</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 clay-press active:scale-[0.97] transition cursor-pointer"
                    title={t.reset || 'Reiniciar'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. CASO LACTANCIA: solo LADO I/D/Ambos + cronómetro + Fecha, Hora, Observaciones */}
          {selectedType === 'lactancia' && (
            <div className="space-y-4">
              {/* Selector LADO I/D/Ambos */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                  {t.breastSide}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['I', 'D', 'Ambos'] as BreastSide[]).map((s) => {
                    const isActive = currentSide === s;
                    const activeClass = isActive
                      ? 'bg-rose-500 text-white font-black shadow-md border-rose-600 scale-[1.02]'
                      : isDark
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700'
                      : 'bg-white text-slate-700 border-rose-200';

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSide(s);
                          if (setV9) setV9(s);
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition clay-press cursor-pointer ${activeClass}`}
                      >
                        {s === 'I' ? 'Izquierdo (I)' : s === 'D' ? 'Derecho (D)' : 'Ambos'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cronómetro para Lactancia */}
              <div className={`mt-3 p-4 rounded-[20px] border-[2px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                !isDark
                  ? "bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-[#FDBA74]"
                  : "bg-gradient-to-br from-[#2D2A3A] to-[#3A2E4A] border-[#6B4A7A]"
              } text-center space-y-3`}>
                <div className={`flex items-center justify-between text-[11px] font-bold uppercase tracking-widest px-1 ${
                  !isDark ? "text-amber-800/80" : "text-rose-300"
                }`}>
                  <span>DURACIÓN / EN CURSO</span>
                  {timerRunning && (
                    <span className="animate-pulse text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>EN CURSO</span>
                    </span>
                  )}
                </div>

                <div className="py-2">
                  <div
                    className={`select-none tracking-wider font-mono text-[32px] font-black ${
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
                    {B7(timerSeconds)}
                  </div>
                  <div className={`text-[11px] font-semibold mt-1 ${
                    !isDark ? "text-amber-900/80" : "text-rose-300"
                  }`}>
                    {t.duration}: {g9(timerSeconds)}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {!timerRunning ? (
                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{timerSeconds > 0 ? (t.resume || 'Reanudar') : (t.start || 'Iniciar')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 fill-white" />
                      <span>{t.pause || 'Pausar'}</span>
                    </button>
                  )}

                  {/* Guardar toma de lactancia */}
                  <button
                    type="button"
                    onClick={handleSaveLactanciaClick}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/30 clay-press active:scale-[0.97] transition cursor-pointer"
                  >
                    <span>{t.saveLact || 'Guardar toma'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 clay-press active:scale-[0.97] transition cursor-pointer"
                    title={t.reset || 'Reiniciar'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. CASO PAÑAL: solo TIPO DE PAÑAL Mojado/Sucio/Mixto + Fecha, Hora, Notas - SIN cronómetro */}
          {selectedType === 'panal' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                {t.diaperCondition}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Mojado', 'Sucio', 'Mixto', 'Limpio'] as DiaperSubType[]).map((cond) => {
                  const isActive = subType === cond;
                  const activeClass = isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md border-amber-500 scale-[1.02]'
                    : isDark
                    ? 'bg-slate-800/90 text-slate-300 border-slate-700'
                    : 'bg-white text-slate-700 border-amber-200';

                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setSubType(cond)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition clay-press cursor-pointer ${activeClass}`}
                    >
                      {cond === 'Mojado' ? '💧 Mojado' : cond === 'Sucio' ? '💩 Sucio' : cond === 'Mixto' ? '🌟 Mixto' : '✨ Limpio'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. CASO BIBERÓN: solo Cantidad ml + Fecha, Hora - SIN cronómetro ni tabs de otros */}
          {selectedType === 'biberon' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Cantidad (ml)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej. 120"
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {/* 5. CASO SÓLIDOS: Cantidad (g o porción) - SIN cronómetro */}
          {selectedType === 'solidos' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Cantidad (gramos o porción)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej. 60"
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {/* 6. CASO BOMBEO: Lado I/D/Ambos + Cantidad ml - SIN cronómetro */}
          {selectedType === 'bombeo' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                  {t.breastSide}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['I', 'D', 'Ambos'] as BreastSide[]).map((s) => {
                    const isActive = side === s;
                    const activeClass = isActive
                      ? 'bg-rose-500 text-white font-black shadow-md border-rose-600 scale-[1.02]'
                      : isDark
                      ? 'bg-slate-800/90 text-slate-300 border-slate-700'
                      : 'bg-white text-slate-700 border-rose-200';

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSide(s)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border transition clay-press cursor-pointer ${activeClass}`}
                      >
                        {s === 'I' ? 'Izquierdo (I)' : s === 'D' ? 'Derecho (D)' : 'Ambos'}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Cantidad extraída (ml)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ej. 90"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* 7. CASO TEMPERATURA */}
          {selectedType === 'temperatura' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                {t.temperature} (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="34"
                max="42"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="Ej. 36.8"
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          )}

          {/* Campos comunes para TODOS los eventos: Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-amber-200 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Hora (HH:mm)
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-amber-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Observaciones / Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Observaciones / Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={t.notesPlaceholder}
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium outline-none border resize-none transition ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-amber-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Submit Save Button */}
          <button
            id="modal-save-record-btn"
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30 clay-press active:scale-[0.97] transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.saveRecord}</span>
          </button>
        </form>
      </div>

      {/* Ventana modal secreta para código 110305 */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1A1A24] border border-[#3A3A55] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="text-3xl">🔐</div>
            <h3 className="text-base font-black text-white">Acceso Administrador</h3>
            <p className="text-xs text-slate-400">Ingresa el código secreto para ingresar al panel total</p>
            <input
              id="input-secret-admin-code"
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdminLogin();
              }}
              placeholder="Código..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-center tracking-widest font-mono text-base outline-none focus:border-amber-400"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCodeModal(false);
                  setAdminCode('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-submit-secret-admin-code"
                onClick={handleAdminLogin}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
