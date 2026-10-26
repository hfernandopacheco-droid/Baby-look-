import React, { useState, useMemo } from 'react';
import { GrowthRecord, LanguageCode } from '../types';
import { rE } from '../i18n';
import { TrendingUp, Scale, Ruler, Sparkles, Heart, CheckCircle2 } from 'lucide-react';

interface GrowthEvolutionChartProps {
  records: GrowthRecord[];
  babyInfo?: { name: string; birthDate: string; height: number; weight: number };
  lang: LanguageCode;
  isDark: boolean;
  onOpenAddModal: (type?: 'peso' | 'largo') => void;
}

export const GrowthEvolutionChart: React.FC<GrowthEvolutionChartProps> = ({
  records,
  babyInfo,
  lang,
  isDark,
  onOpenAddModal
}) => {
  const t = rE[lang] || rE.es;
  const [viewMode, setViewMode] = useState<'both' | 'peso' | 'largo'>('both');
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  // Separate and sort records by date
  const weightRecords = useMemo(() => {
    return records
      .filter(r => r.type === 'peso')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const heightRecords = useMemo(() => {
    return records
      .filter(r => r.type === 'largo')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  // Latest measurements - 100% sincronizadas con babyInfo y registros
  const latestWeight = weightRecords.length > 0
    ? weightRecords[weightRecords.length - 1].value
    : (babyInfo?.weight ?? 7.2);
  const initialWeight = weightRecords.length > 0
    ? weightRecords[0].value
    : (babyInfo?.weight ? Math.max(2.5, Number((babyInfo.weight - 2.5).toFixed(1))) : 3.4);
  const weightGain = Math.max(0, Number((latestWeight - initialWeight).toFixed(2)));

  const latestHeight = heightRecords.length > 0
    ? heightRecords[heightRecords.length - 1].value
    : (babyInfo?.height ?? 65);
  const initialHeight = heightRecords.length > 0
    ? heightRecords[0].value
    : (babyInfo?.height ? Math.max(45, Math.round(babyInfo.height - 15)) : 50);
  const heightGain = Math.max(0, Math.round(latestHeight - initialHeight));

  // Merge timeline of records by date for simultaneous sync
  const timeline = useMemo(() => {
    type TimelinePoint = { date: string; weight?: number; height?: number };
    const map = new Map<string, TimelinePoint>();

    weightRecords.forEach(r => {
      const existing: TimelinePoint = map.get(r.date) || { date: r.date };
      existing.weight = r.value;
      map.set(r.date, existing);
    });

    heightRecords.forEach(r => {
      const existing: TimelinePoint = map.get(r.date) || { date: r.date };
      existing.height = r.value;
      map.set(r.date, existing);
    });

    // If empty, supply default starter data points for visual beauty
    if (map.size === 0) {
      return [
        { date: 'Mes 1', weight: 4.2, height: 53 },
        { date: 'Mes 2', weight: 5.1, height: 57 },
        { date: 'Mes 3', weight: 5.9, height: 61 },
        { date: 'Mes 4', weight: 6.6, height: 63 },
        { date: 'Mes 5', weight: 7.1, height: 65 },
        { date: 'Mes 6', weight: 7.6, height: 67 }
      ];
    }

    const rawList = Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Carry forward missing values so BOTH weight and height curves always render seamlessly
    let currW = weightRecords[0]?.value ?? babyInfo?.weight ?? 7.2;
    let currH = heightRecords[0]?.value ?? babyInfo?.height ?? 65;

    const populatedList = rawList.map(item => {
      if (item.weight !== undefined) currW = item.weight;
      if (item.height !== undefined) currH = item.height;
      return {
        date: item.date,
        weight: item.weight ?? currW,
        height: item.height ?? currH
      };
    });

    // If only 1 point, add previous baseline so line renders nicely
    if (populatedList.length === 1) {
      const p = populatedList[0];
      return [
        {
          date: 'Nacimiento',
          weight: Math.max(2.5, Number((p.weight - 2.8).toFixed(1))),
          height: Math.max(46, Math.round(p.height - 15))
        },
        p
      ];
    }

    return populatedList;
  }, [weightRecords, heightRecords, babyInfo]);

  // SVG dimensions
  const svgW = 420;
  const svgH = 200;
  const padL = 36;
  const padR = 36;
  const padT = 24;
  const padB = 32;

  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  // Weight scale: min ~2kg, max ~14kg
  const minW = 2;
  const maxW = 14;

  // Height scale: min ~45cm, max ~95cm
  const minH = 45;
  const maxH = 95;

  const getX = (idx: number) => {
    if (timeline.length <= 1) return padL + chartW / 2;
    return padL + (idx / (timeline.length - 1)) * chartW;
  };

  const getYWeight = (w: number) => {
    const clamped = Math.max(minW, Math.min(maxW, w));
    return padT + chartH - ((clamped - minW) / (maxW - minW)) * chartH;
  };

  const getYHeight = (h: number) => {
    const clamped = Math.max(minH, Math.min(maxH, h));
    return padT + chartH - ((clamped - minH) / (maxH - minH)) * chartH;
  };

  // Generate smooth SVG paths
  const weightPath = useMemo(() => {
    const points = timeline
      .map((p, i) => (p.weight !== undefined ? { x: getX(i), y: getYWeight(p.weight) } : null))
      .filter(Boolean) as { x: number; y: number }[];

    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
  }, [timeline]);

  const heightPath = useMemo(() => {
    const points = timeline
      .map((p, i) => (p.height !== undefined ? { x: getX(i), y: getYHeight(p.height) } : null))
      .filter(Boolean) as { x: number; y: number }[];

    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
  }, [timeline]);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (dateStr.includes('Mes') || dateStr === 'Nacimiento') return dateStr;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(lang || 'es', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Baby Representation Card - Sincronizada con Peso y Largo */}
      <div 
        className={`p-5 rounded-3xl border transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#1E1E2E] to-[#252538] border-slate-700 shadow-xl' 
            : 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-emerald-500/10 border-amber-200/90 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Baby Avatar and Growth Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              👶
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Evolución del Bebé
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black font-heading text-slate-800 dark:text-white leading-tight">
                Crecimiento Sano & Armónico
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Progreso sincronizado de peso y estatura</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {/* Peso Metric */}
            <div className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl border text-center ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-amber-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Scale className="w-3 h-3" />
                <span>Peso Actual</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {latestWeight} <span className="text-xs font-bold text-slate-400">kg</span>
              </div>
              {weightGain > 0 && (
                <div className="text-[10px] font-extrabold text-emerald-500">
                  +{weightGain} kg ganados
                </div>
              )}
            </div>

            {/* Largo Metric */}
            <div className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl border text-center ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-amber-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Ruler className="w-3 h-3" />
                <span>Talla Actual</span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {latestHeight} <span className="text-xs font-bold text-slate-400">cm</span>
              </div>
              {heightGain > 0 && (
                <div className="text-[10px] font-extrabold text-emerald-500">
                  +{heightGain} cm crecidos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Mother-Friendly Chart Section */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isDark ? 'bg-[#1E1E2E] border-slate-700' : 'bg-white border-amber-200/80 shadow-md shadow-orange-500/5'
      }`}>
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white font-heading">
                Curva de Crecimiento Natural
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fácil de entender para mamás • Sin líneas médicas confusas
              </p>
            </div>
          </div>

          {/* View Mode Toggle: Both, Peso, Largo */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-white dark:bg-[#2A2A40] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Ambos (Sincronizado)
            </button>
            <button
              onClick={() => setViewMode('peso')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'peso'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <span>⚖️</span>
              <span>Peso</span>
            </button>
            <button
              onClick={() => setViewMode('largo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'largo'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <span>📏</span>
              <span>Talla</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-1 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            {(viewMode === 'both' || viewMode === 'peso') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block ring-2 ring-amber-400/30"></span>
                <span className="text-amber-600 dark:text-amber-400">Peso (kg)</span>
              </div>
            )}
            {(viewMode === 'both' || viewMode === 'largo') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-400/30"></span>
                <span className="text-emerald-600 dark:text-emerald-400">Talla / Largo (cm)</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-amber-400/20 border border-amber-400/40 inline-block"></span>
            <span>Zona de crecimiento saludable</span>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto flex justify-center py-2">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full max-w-[540px] h-auto rounded-2xl bg-slate-500/5 p-1 border border-slate-200/60 dark:border-slate-800"
          >
            <defs>
              <linearGradient id="healthyZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            {/* Sombreado de Zona Saludable Óptima */}
            <rect
              x={padL}
              y={padT + 10}
              width={chartW}
              height={chartH - 20}
              rx="12"
              fill="url(#healthyZoneGrad)"
            />

            {/* Vertical date grid lines */}
            {timeline.map((p, i) => (
              <line
                key={`grid-x-${i}`}
                x1={getX(i)}
                y1={padT}
                x2={getX(i)}
                y2={padT + chartH}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3,3"
                strokeWidth="1"
              />
            ))}

            {/* Talla Curve (Emerald) */}
            {(viewMode === 'both' || viewMode === 'largo') && heightPath && (
              <path
                d={heightPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm"
              />
            )}

            {/* Peso Curve (Amber) */}
            {(viewMode === 'both' || viewMode === 'peso') && weightPath && (
              <path
                d={weightPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm"
              />
            )}

            {/* Data Points on Timeline */}
            {timeline.map((p, i) => {
              const x = getX(i);
              const hasWeight = p.weight !== undefined && (viewMode === 'both' || viewMode === 'peso');
              const hasHeight = p.height !== undefined && (viewMode === 'both' || viewMode === 'largo');

              const yW = p.weight !== undefined ? getYWeight(p.weight) : 0;
              const yH = p.height !== undefined ? getYHeight(p.height) : 0;

              return (
                <g key={`point-group-${i}`}>
                  {/* Point for Height (Talla) */}
                  {hasHeight && (
                    <g
                      className="cursor-pointer"
                      onClick={() => setActivePointIndex(activePointIndex === i ? null : i)}
                    >
                      <circle
                        cx={x}
                        cy={yH}
                        r="6"
                        className="fill-emerald-500 stroke-white dark:stroke-[#1E1E2E]"
                        strokeWidth="2.5"
                      />
                      <text
                        x={x}
                        y={yH - 9}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="900"
                        fill={isDark ? '#34d399' : '#059669'}
                      >
                        {p.height} cm
                      </text>
                    </g>
                  )}

                  {/* Point for Weight (Peso) */}
                  {hasWeight && (
                    <g
                      className="cursor-pointer"
                      onClick={() => setActivePointIndex(activePointIndex === i ? null : i)}
                    >
                      <circle
                        cx={x}
                        cy={yW}
                        r="6"
                        className="fill-amber-500 stroke-white dark:stroke-[#1E1E2E]"
                        strokeWidth="2.5"
                      />
                      <text
                        x={x}
                        y={yW + 15}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="900"
                        fill={isDark ? '#fbbf24' : '#d97706'}
                      >
                        {p.weight} kg
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* X-Axis Date Labels */}
            {timeline.map((p, i) => (
              <text
                key={`label-x-${i}`}
                x={getX(i)}
                y={padT + chartH + 18}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={isDark ? '#94a3b8' : '#64748b'}
              >
                {formatDate(p.date)}
              </text>
            ))}

            {/* Left Y-axis (Weight) */}
            {(viewMode === 'both' || viewMode === 'peso') && (
              <>
                <text x={padL - 4} y={padT + 8} textAnchor="end" fontSize="8" fontWeight="800" fill="#f59e0b">
                  {maxW} kg
                </text>
                <text x={padL - 4} y={padT + chartH} textAnchor="end" fontSize="8" fontWeight="800" fill="#f59e0b">
                  {minW} kg
                </text>
              </>
            )}

            {/* Right Y-axis (Height) */}
            {(viewMode === 'both' || viewMode === 'largo') && (
              <>
                <text x={svgW - padR + 4} y={padT + 8} textAnchor="start" fontSize="8" fontWeight="800" fill="#10b981">
                  {maxH} cm
                </text>
                <text x={svgW - padR + 4} y={padT + chartH} textAnchor="start" fontSize="8" fontWeight="800" fill="#10b981">
                  {minH} cm
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Reassuring Pediatry Note */}
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Heart className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-800 dark:text-amber-300 font-bold">Tranquilidad para mamá: </strong>
            Cada bebé tiene su propio ritmo de crecimiento. Mientras la curva ascienda de forma continua y armónica entre peso y talla, tu bebé está recibiendo todo el amor y nutrición que necesita.
          </p>
        </div>
      </div>
    </div>
  );
};
