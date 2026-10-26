import React, { useRef, useState } from 'react';
import { AvatarConfig, OUTFITS_CATALOG } from '../normativeTables';
import { BabyUser, GrowthRecord } from '../types';
import { X, Share2, Download, Sparkles } from 'lucide-react';
import { YA } from '../utils';

interface GrowthTimeLapseModalProps {
  config: AvatarConfig;
  user: BabyUser;
  growth: GrowthRecord[];
  onClose: () => void;
  isDark: boolean;
}

export const GrowthTimeLapseModal: React.FC<GrowthTimeLapseModalProps> = ({
  config,
  user,
  growth,
  onClose,
  isDark
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  const birthDate = user.birthDate || '2026-02-15';
  const ageMonths = Math.max(0, Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

  const stages = [
    { label: 'Mes 0 (Nacimiento)', stage: '0-3m', emoji: '👶', outfit: 'basic_onesie' },
    { label: `Mes ${Math.min(3, ageMonths)}`, stage: '0-3m', emoji: '🍼', outfit: 'basic_onesie' },
    { label: `Mes ${Math.min(6, ageMonths)}`, stage: '4-6m', emoji: '🧸', outfit: config.unlockedOutfits.includes('dino_bib') ? 'dino_bib' : 'basic_onesie' },
    { label: `Mes ${Math.min(9, ageMonths)}`, stage: '6-9m', emoji: '🦖', outfit: config.unlockedOutfits.includes('bear_kneepads') ? 'bear_kneepads' : 'basic_onesie' },
    { label: `Mes ${ageMonths} (Actual)`, stage: ageMonths >= 9 ? '9-12m' : '6-9m', emoji: '👑', outfit: config.clothes }
  ];

  const handleDownloadTimeLapse = () => {
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setGenerating(false);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setGenerating(false);
      return;
    }

    // Draw a beautiful share card canvas
    canvas.width = 800;
    canvas.height = 500;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#fef3c7');
    grad.addColorStop(1, '#fed7aa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Header Title
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ Evolución de ${user.babyName || 'Mi Bebé'} • Baby Day ✨`, 400, 50);

    ctx.font = '600 14px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Crecimiento desde nacimiento hasta los ${ageMonths} meses`, 400, 75);

    // Draw 4 timeline stage boxes
    const boxWidth = 135;
    const boxHeight = 260;
    const startX = 60;
    const startY = 120;
    const gap = 20;

    stages.slice(0, 5).forEach((st, idx) => {
      const bx = startX + idx * (boxWidth + gap);
      const by = startY;

      // Box background
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxWidth, boxHeight, 16);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Stage label
      ctx.fillStyle = '#d97706';
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(st.label, bx + boxWidth / 2, by + 30);

      // Emoji / Avatar illustration
      ctx.font = '50px sans-serif';
      ctx.fillText(st.emoji, bx + boxWidth / 2, by + 110);

      // Outfit name
      const outfitName = OUTFITS_CATALOG.find(o => o.id === st.outfit)?.name || 'Pijama';
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 11px sans-serif';
      ctx.fillText(outfitName, bx + boxWidth / 2, by + 170);

      // Status badge
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(bx + 15, by + 200, boxWidth - 30, 30, 8);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.font = '700 10px sans-serif';
      ctx.fillText('Nivel Bond 100%', bx + boxWidth / 2, by + 219);
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px sans-serif';
    ctx.fillText('Generado con Baby Day PWA • babyday.app', 400, 440);

    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Evolucion_${user.babyName || 'Bebé'}.png`;
      link.href = dataUrl;
      link.click();
      setGenerating(false);
      YA('¡Time-lapse de crecimiento exportado con éxito! 📸');
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 text-center ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base font-heading">Time-Lapse de Crecimiento & Ropa</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/15 cursor-pointer">
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        <p className="text-xs opacity-80 leading-relaxed">
          Genera una tarjeta panorámica con la evolución de tu bebé, sus etapas de crecimiento y su guardarropa desbloqueado para compartir en redes.
        </p>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} className="hidden" />

        <div className="grid grid-cols-5 gap-2 py-3 bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
          {stages.map((st, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span className="text-2xl mb-1">{st.emoji}</span>
              <span className="text-[10px] font-black uppercase">{st.label.split(' ')[0]}</span>
              <span className="text-[9px] opacity-70">{OUTFITS_CATALOG.find(o => o.id === st.outfit)?.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDownloadTimeLapse}
            disabled={generating}
            className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Generando imagen...' : 'Descargar Time-Lapse PNG'}
          </button>
          <button
            onClick={() => {
              handleDownloadTimeLapse();
            }}
            className="py-3 px-4 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </div>
      </div>
    </div>
  );
};
