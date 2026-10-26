import React from 'react';
import { LanguageCode } from '../types';
import { X, Check, Globe } from 'lucide-react';
import { rE } from '../i18n';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  isDark: boolean;
}

export const SUPPORTED_LANGUAGES: {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}[] = [
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'Inglés', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Portugués', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Francés', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Alemán', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Ruso', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'pl', name: 'Polaco', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'zh', name: 'Chino', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Árabe', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectLang,
  isDark
}) => {
  if (!isOpen) return null;

  const t = rE[currentLang] || rE.es;

  const handleSelect = (code: LanguageCode) => {
    onSelectLang(code);
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
        className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 border transition-all ${
          isDark 
            ? 'bg-[#1E1E2E] text-white border-slate-700' 
            : 'bg-white text-slate-800 border-amber-200/80 shadow-orange-500/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌏</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {t.languageName || 'Idioma de la App'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona tu idioma preferido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {SUPPORTED_LANGUAGES.map((langItem) => {
            const isSelected = currentLang === langItem.code;
            return (
              <button
                key={langItem.code}
                onClick={() => handleSelect(langItem.code)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer clay-press ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold ring-2 ring-amber-500/30'
                      : 'bg-amber-50 border-amber-400 text-amber-900 font-bold ring-2 ring-amber-400/30'
                    : isDark
                    ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-[#FAF8F5] border-slate-200/80 text-slate-700 hover:bg-white hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none">{langItem.flag}</span>
                  <div>
                    <div className="text-sm font-bold leading-tight">{langItem.nativeName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{langItem.name}</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
          >
            {t.close || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
