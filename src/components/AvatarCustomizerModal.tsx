import React from 'react';
import { AvatarConfig, OUTFITS_CATALOG } from '../normativeTables';
import { X, Sparkles, Check } from 'lucide-react';

interface AvatarCustomizerModalProps {
  config: AvatarConfig;
  onUpdateConfig: (newConfig: AvatarConfig) => void;
  onClose: () => void;
  isDark: boolean;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
  isDark
}) => {
  const skinTones = ['#ffd1b3', '#fcd34d', '#f87171', '#fb923c', '#d8b4fe', '#93c5fd'];
  const eyeShapes: ('normal' | 'happy' | 'sleepy' | 'star')[] = ['normal', 'happy', 'sleepy', 'star'];

  const handleSelectOutfit = (outfitId: string) => {
    if (config.unlockedOutfits.includes(outfitId)) {
      onUpdateConfig({ ...config, clothes: outfitId });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-6 ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base font-heading">Personalizar Avatar Kawaii</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Skin Tone Selector */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider opacity-80">Tono de piel</label>
          <div className="flex items-center gap-3">
            {skinTones.map(color => (
              <button
                key={color}
                onClick={() => onUpdateConfig({ ...config, skinTone: color })}
                className={`w-10 h-10 rounded-full border-2 transition cursor-pointer ${
                  config.skinTone === color ? 'border-amber-500 scale-110 shadow-lg' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Outfits / Unlockable Rewards Catalog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider opacity-80">Ropa y Recompensas Desbloqueables</label>
            <span className="text-[10px] text-amber-500 font-bold">¡Desbloquea con hitos y registros!</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {OUTFITS_CATALOG.map(item => {
              const isUnlocked = config.unlockedOutfits.includes(item.id);
              const isSelected = config.clothes === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectOutfit(item.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500'
                      : isUnlocked
                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-400'
                      : 'bg-slate-100 dark:bg-slate-800/30 border-dashed border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="text-left">
                      <div className="text-xs font-bold">{item.name}</div>
                      <div className="text-[9px] text-slate-400">{item.requirement}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                  {!isUnlocked && <span className="text-[10px]">🔒</span>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition cursor-pointer"
        >
          Guardar Cambios del Avatar
        </button>
      </div>
    </div>
  );
};
