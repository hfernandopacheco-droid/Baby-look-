import React, { useState, useMemo, useEffect } from 'react';
import { GrowthRecord, LanguageCode } from '../types';
import { rE } from '../i18n';
import { hE, QH, bA, YA } from '../utils';
import { Sprout, Plus, Trash2, Calendar, TrendingUp, X, Sparkles, LineChart } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { GrowthEvolutionChart } from './GrowthEvolutionChart';

interface GrowthTabProps {
  growth: GrowthRecord[];
  babyInfo?: { name: string; birthDate: string; height: number; weight: number };
  onAddMeasure: (type: 'peso' | 'largo' | 'cabeza', value: number, date: string) => void;
  onDeleteMeasure: (id: string) => void;
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
}

// OMS WHO Percentile curves for 0-6 months
// k7 = [0, 1, 2, 3, 4, 5, 6]
const OMS_DATA = {
  peso: {
    unit: 'kg',
    minY: 2.0,
    maxY: 10.5,
    p3:  [2.5, 3.4, 4.3, 5.0, 5.6, 6.0, 6.4],
    p15: [2.9, 3.9, 4.9, 5.6, 6.2, 6.7, 7.1],
    p50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9],
    p85: [3.9, 5.1, 6.3, 7.2, 7.8, 8.4, 8.8],
    p97: [4.3, 5.7, 7.0, 8.0, 8.7, 9.3, 9.8]
  },
  largo: {
    unit: 'cm',
    minY: 44,
    maxY: 75,
    p3:  [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3],
    p15: [47.5, 52.3, 56.0, 58.9, 61.3, 63.3, 65.0],
    p50: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6],
    p85: [52.0, 57.0, 60.8, 63.8, 66.3, 68.4, 70.1],
    p97: [53.7, 58.6, 62.5, 65.5, 68.0, 70.1, 71.9]
  },
  cabeza: {
    unit: 'cm',
    minY: 30,
    maxY: 48,
    p3:  [32.1, 35.1, 36.9, 38.3, 39.5, 40.5, 41.3],
    p15: [33.1, 36.1, 37.9, 39.3, 40.5, 41.5, 42.4],
    p50: [34.5, 37.3, 39.1, 40.5, 41.6, 42.6, 43.3],
    p85: [35.8, 38.6, 40.3, 41.7, 42.8, 43.7, 44.4],
    p97: [36.9, 39.7, 41.5, 42.8, 43.9, 44.8, 45.6]
  }
};

export const GrowthTab: React.FC<GrowthTabProps> = ({
  growth,
  babyInfo,
  onAddMeasure,
  onDeleteMeasure,
  lang,
  isDark,
  useClay,
}) => {
  const t = rE[lang] || rE.es;
  const [qg, setQg] = useState<'peso' | 'largo' | 'cabeza'>('peso');
  const [chartMode, setChartMode] = useState<'visual' | 'oms'>('visual');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'completo' | 'individual'>('completo');
  const [measureValue, setMeasureValue] = useState<string>('');
  const [measureWeight, setMeasureWeight] = useState<string>('');
  const [measureHeight, setMeasureHeight] = useState<string>('');
  const [measureDate, setMeasureDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cloudGrowth, setCloudGrowth] = useState<GrowthRecord[]>(growth);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const q = query(collection(db, "users", uid, "crecimiento"), orderBy("date", "desc"), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as GrowthRecord[];
        setCloudGrowth(list);
        setErrorMsg(null);
      }, (error) => {
        console.log(error);
        setErrorMsg("Cargando...");
      });
      return () => unsub();
    } catch (e) {
      console.log(e);
      setErrorMsg("Cargando...");
    }
  }, []);

  // Fusión reactiva entre cloudGrowth y props growth para actualización instantánea
  const activeGrowth = useMemo(() => {
    const map = new Map<string, GrowthRecord>();
    cloudGrowth.forEach(g => map.set(g.id || `${g.type}_${g.date}`, g));
    growth.forEach(g => map.set(g.id || `${g.type}_${g.date}`, g));
    return Array.from(map.values());
  }, [cloudGrowth, growth]);

  // Deduplicate using hE
  const cleanRecords = useMemo(() => hE(activeGrowth), [activeGrowth]);
  const latest = useMemo(() => QH(cleanRecords), [cleanRecords]);

  // Valores unificados y 100% sincronizados con el perfil del bebé y los registros
  const currentWeightVal = latest.weight?.value ?? babyInfo?.weight ?? 7.2;
  const currentWeightDate = latest.weight?.date ?? 'Estimado';
  const currentHeightVal = latest.height?.value ?? babyInfo?.height ?? 65;
  const currentHeightDate = latest.height?.date ?? 'Estimado';
  const currentHeadVal = latest.head?.value ?? 42;
  const currentHeadDate = latest.head?.date ?? 'Estimado';

  // Current selected category data
  const currentRecords = useMemo(() => {
    return cleanRecords.filter(r => r.type === qg);
  }, [cleanRecords, qg]);

  const oms = OMS_DATA[qg];
  const k7 = [0, 1, 2, 3, 4, 5, 6];

  // SVG dimensions: 340 x 210
  const svgW = 340;
  const svgH = 210;
  const padL = 38;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const getX = (month: number) => padL + (month / 6) * chartW;
  const getY = (val: number) => {
    const clamped = Math.max(oms.minY, Math.min(oms.maxY, val));
    const ratio = (clamped - oms.minY) / (oms.maxY - oms.minY);
    return padT + chartH - ratio * chartH;
  };

  // EA path M L generator
  const getLinePath = (values: number[]) => {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
  };

  // NA area path generator between two percentile curves
  const getAreaPath = (upper: number[], lower: number[]) => {
    const top = upper.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
    const bot = lower.slice().reverse().map((v, i) => `L ${getX(5 - i + 1).toFixed(1)},${getY(v).toFixed(1)}`).join(' ');
    return `${top} ${bot} Z`;
  };

  // QA bezier curve C generator for p50
  const getBezierPath = (values: number[]) => {
    if (values.length < 2) return '';
    let d = `M ${getX(0).toFixed(1)},${getY(values[0]).toFixed(1)}`;
    for (let i = 0; i < values.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(values[i]);
      const x1 = getX(i + 1);
      const y1 = getY(values[i + 1]);
      const mx = (x0 + x1) / 2;
      d += ` C ${mx.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    return d;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'completo') {
      const wVal = parseFloat(measureWeight);
      const hVal = parseFloat(measureHeight);
      let registeredCount = 0;
      if (!isNaN(wVal) && wVal > 0) {
        onAddMeasure('peso', wVal, measureDate);
        registeredCount++;
      }
      if (!isNaN(hVal) && hVal > 0) {
        onAddMeasure('largo', hVal, measureDate);
        registeredCount++;
      }
      if (registeredCount > 0) {
        bA(window.innerWidth / 2, window.innerHeight / 2);
        YA(`Medición sincronizada de ${registeredCount === 2 ? 'peso y talla' : 'crecimiento'}`);
        setMeasureWeight('');
        setMeasureHeight('');
        setShowAddModal(false);
      }
    } else {
      const val = parseFloat(measureValue);
      if (isNaN(val) || val <= 0) return;
      onAddMeasure(qg, val, measureDate);
      bA(window.innerWidth / 2, window.innerHeight / 2);
      YA(`${val} ${oms.unit} registrado`);
      setMeasureValue('');
      setShowAddModal(false);
    }
  };

  const cardBase = isDark ? 'bg-[#2A2A40] border-[#3A3A55] text-white' : 'clay bg-[#FFFBF7] border-amber-200/60 text-slate-800';

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black font-heading flex items-center gap-2">
            <span>🌱</span>
            <span>{t.crecimiento} y Desarrollo</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Curvas de percentiles oficiales OMS (p3 a p97) de 0 a 6 meses
          </p>
        </div>

        {/* Button A7 ($9 true) */}
        <button
          id="btn-add-measure-modal"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 clay-press transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Medida</span>
        </button>
      </div>

      {/* Metric Selector Tabs: qg("peso" | "largo" | "cabeza") */}
      <div className={`flex rounded-2xl p-1.5 gap-1.5 ${isDark ? 'bg-[#2A2A40] border border-[#3A3A55]' : 'bg-amber-100/60 border border-amber-200/60'}`}>
        {[
          { id: 'peso', label: '⚖️ Peso (kg)', unit: 'kg' },
          { id: 'largo', label: '📏 Talla / Largo (cm)', unit: 'cm' },
          { id: 'cabeza', label: '🧠 Perímetro Cefálico (cm)', unit: 'cm' },
        ].map(item => {
          const isActive = qg === item.id;
          const activeClass = isActive
            ? isDark
              ? 'bg-[#1E1E2E] text-white border border-[#3A3A55] font-bold shadow-md scale-[1.02]'
              : 'bg-white text-slate-900 border border-amber-300 font-bold shadow-md scale-[1.02]'
            : isDark
            ? 'text-slate-300 hover:text-white hover:bg-[#1E1E2E]/50'
            : 'text-slate-500 hover:text-slate-800';

          return (
            <button
              key={item.id}
              onClick={() => setQg(item.id as 'peso' | 'largo' | 'cabeza')}
              className={`flex-1 py-2 px-3 text-xs rounded-xl font-medium transition cursor-pointer text-center whitespace-nowrap clay-press ${activeClass}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Latest Stats Summary Cards - Sincronizadas y Unificadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Peso */}
        <div className={`p-4 rounded-2xl border transition-all ${!isDark ? 'bg-white border-[#E5E7EB] text-black shadow-sm' : 'bg-[#2A2A40] border-[#3A3A55] text-white shadow-md'}`}>
          <span className="text-xs font-bold block uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Último Peso
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#FBBF24] mt-1">
            {currentWeightVal} kg
          </div>
          <span className="text-[11px] font-medium text-gray-400 block mt-0.5">
            {currentWeightDate}
          </span>
        </div>

        {/* Card 2: Talla */}
        <div className={`p-4 rounded-2xl border transition-all ${!isDark ? 'bg-white border-[#E5E7EB] text-black shadow-sm' : 'bg-[#2A2A40] border-[#3A3A55] text-white shadow-md'}`}>
          <span className="text-xs font-bold block uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Última Talla
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#10B981] mt-1">
            {currentHeightVal} cm
          </div>
          <span className="text-[11px] font-medium text-gray-400 block mt-0.5">
            {currentHeightDate}
          </span>
        </div>

        {/* Card 3: Perímetro */}
        <div className={`p-4 rounded-2xl border transition-all ${!isDark ? 'bg-white border-[#E5E7EB] text-black shadow-sm' : 'bg-[#2A2A40] border-[#3A3A55] text-white shadow-md'}`}>
          <span className="text-xs font-bold block uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Perímetro Cefálico
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#FBBF24] mt-1">
            {currentHeadVal} cm
          </div>
          <span className="text-[11px] font-medium text-gray-400 block mt-0.5">
            {currentHeadDate}
          </span>
        </div>
      </div>

      {/* Selector de Tipo de Gráfica: Visual Familiar vs OMS Clínico */}
      <div className="flex items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <button
          onClick={() => setChartMode('visual')}
          className={`flex-1 py-2 px-3 text-xs rounded-xl font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            chartMode === 'visual'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Gráfico Visual para Mamás (Peso y Largo)</span>
        </button>
        <button
          onClick={() => setChartMode('oms')}
          className={`flex-1 py-2 px-3 text-xs rounded-xl font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            chartMode === 'oms'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Percentiles Médicos OMS</span>
        </button>
      </div>

      {/* Condicional: Gráfico Visual Rediseñado vs OMS */}
      {chartMode === 'visual' ? (
        <GrowthEvolutionChart
          records={cleanRecords}
          babyInfo={babyInfo}
          lang={lang}
          isDark={isDark}
          onOpenAddModal={(type) => {
            if (type) {
              setQg(type);
              setModalMode('individual');
            } else {
              setModalMode('completo');
            }
            setShowAddModal(true);
          }}
        />
      ) : (
        /* OMS Chart SVG 340x210 */
        <div className={`p-5 rounded-3xl ${cardBase} border space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black font-heading">
                Gráfica OMS — {qg === 'peso' ? 'Peso' : qg === 'largo' ? 'Longitud' : 'Perímetro Cefálico'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Bebé</span>
              <span className="inline-block w-3 h-0.5 bg-amber-500"></span>
              <span>p50 (Mediana)</span>
            </div>
          </div>

          {/* Chart wrapper */}
          <div className="w-full overflow-x-auto flex justify-center py-2">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full max-w-[500px] h-auto rounded-2xl bg-white/50 dark:bg-[#1E1E2E] p-1 border border-slate-200 dark:border-[#3A3A55]"
            >
              {/* Background Grid Lines */}
              {k7.map((m) => (
                <line
                  key={`grid-x-${m}`}
                  x1={getX(m)}
                  y1={padT}
                  x2={getX(m)}
                  y2={padT + chartH}
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  strokeDasharray="2,2"
                />
              ))}

              {/* Percentile Outer Area NA (p3 - p97) */}
              <path
                d={getAreaPath(oms.p97, oms.p3)}
                fill={isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.12)'}
              />

              {/* Percentile Inner Area (p15 - p85) */}
              <path
                d={getAreaPath(oms.p85, oms.p15)}
                fill={isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.22)'}
              />

              {/* p3 & p97 Lines */}
              <path d={getLinePath(oms.p3)} fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />
              <path d={getLinePath(oms.p97)} fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.6" />

              {/* p15 & p85 Lines */}
              <path d={getLinePath(oms.p15)} fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.75" />
              <path d={getLinePath(oms.p85)} fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.75" />

              {/* p50 Median Bezier QA Curve */}
              <path
                d={getBezierPath(oms.p50)}
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
              />

              {/* Baby's Actual Data Measurements XA */}
              {currentRecords.map((r, i) => {
                const mIndex = Math.min(6, i);
                const cx = getX(mIndex);
                const cy = getY(r.value);
                return (
                  <g key={r.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5"
                      className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                      strokeWidth="2"
                    />
                    <text
                      x={cx}
                      y={cy - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill={isDark ? '#34d399' : '#059669'}
                    >
                      {r.value}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis labels (0m - 6m) */}
              {k7.map((m) => (
                <text
                  key={`label-x-${m}`}
                  x={getX(m)}
                  y={padT + chartH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isDark ? '#94a3b8' : '#64748b'}
                  fontWeight="bold"
                >
                  {m}m
                </text>
              ))}

              {/* Y-Axis labels */}
              <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize="8" fill={isDark ? '#94a3b8' : '#64748b'}>
                {oms.maxY} {oms.unit}
              </text>
              <text x={padL - 4} y={padT + chartH} textAnchor="end" fontSize="8" fill={isDark ? '#94a3b8' : '#64748b'}>
                {oms.minY} {oms.unit}
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* History List */}
      <div className={`p-5 rounded-3xl ${cardBase} border space-y-3`}>
        <h3 className="text-sm font-bold font-heading">Historial de Registros ({qg})</h3>
        {currentRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Aún no hay mediciones registradas para {qg}. Toca "Añadir Medida" para comenzar.
          </p>
        ) : (
          <div className="space-y-2">
            {currentRecords.map(rec => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/10 border border-slate-500/15 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{qg === 'peso' ? '⚖️' : qg === 'largo' ? '📏' : '🧠'}</span>
                  <div>
                    <span className="font-bold text-sm block">
                      {rec.value} {oms.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">{rec.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteMeasure(rec.id)}
                  className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-500 transition cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal A7 for Adding Measurement */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAddModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <div className={`relative w-full max-w-sm rounded-3xl p-5 shadow-2xl z-10 border ${
            isDark ? 'bg-[#2A2A40] border-[#3A3A55] text-white' : 'bg-white border-[#E5E7EB] text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-sm font-heading">Registrar Medición</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Modo: Control Completo vs Medida Específica */}
            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800/80 mb-3 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalMode('completo')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition ${
                  modalMode === 'completo'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⚖️+📏 Peso y Talla
              </button>
              <button
                type="button"
                onClick={() => setModalMode('individual')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition ${
                  modalMode === 'individual'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Individual
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {modalMode === 'completo' ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                        ⚖️ Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={measureWeight}
                        onChange={(e) => setMeasureWeight(e.target.value)}
                        placeholder="Ej: 8.0"
                        className={`w-full p-2.5 rounded-xl border font-medium outline-none ${
                          isDark ? 'bg-[#1E1E2E] border-[#3A3A55] text-white' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                        required={!measureHeight}
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">
                        📏 Talla (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={measureHeight}
                        onChange={(e) => setMeasureHeight(e.target.value)}
                        placeholder="Ej: 65.0"
                        className={`w-full p-2.5 rounded-xl border font-medium outline-none ${
                          isDark ? 'bg-[#1E1E2E] border-[#3A3A55] text-white' : 'bg-white border-gray-300 text-slate-900'
                        }`}
                        required={!measureWeight}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    💡 Ambos registros se guardarán y sincronizarán simultáneamente en el perfil y la gráfica.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold mb-1">Tipo de Medida</label>
                    <select
                      value={qg}
                      onChange={(e) => setQg(e.target.value as any)}
                      className={`w-full p-2.5 rounded-xl border font-medium outline-none ${
                        isDark ? 'bg-[#1E1E2E] border-[#3A3A55] text-white' : 'bg-white border-gray-300 text-slate-900'
                      }`}
                    >
                      <option value="peso" className={isDark ? 'bg-[#1E1E2E] text-white' : 'text-slate-900'}>⚖️ Peso (kg)</option>
                      <option value="largo" className={isDark ? 'bg-[#1E1E2E] text-white' : 'text-slate-900'}>📏 Talla / Longitud (cm)</option>
                      <option value="cabeza" className={isDark ? 'bg-[#1E1E2E] text-white' : 'text-slate-900'}>🧠 Perímetro Cefálico (cm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">
                      Valor ({oms.unit})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={measureValue}
                      onChange={(e) => setMeasureValue(e.target.value)}
                      placeholder={qg === 'peso' ? 'Ej: 8.0' : 'Ej: 65.0'}
                      className={`w-full p-2.5 rounded-xl border font-medium outline-none ${
                        isDark ? 'bg-[#1E1E2E] border-[#3A3A55] text-white' : 'bg-white border-gray-300 text-slate-900'
                      }`}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-200">Fecha del Registro</label>
                <input
                  type="date"
                  value={measureDate}
                  onChange={(e) => setMeasureDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-medium outline-none ${
                    isDark ? 'bg-[#1E1E2E] border-[#3A3A55] text-white' : 'bg-white border-gray-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md hover:from-amber-600 hover:to-orange-600 clay-press transition cursor-pointer mt-2"
              >
                Guardar y Sincronizar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
