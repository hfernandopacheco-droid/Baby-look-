import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import { DiaperIcon } from './DiaperIcon';

function getDiasRestantesMes() {
  const hoy = new Date();
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return ultimo - hoy.getDate() + 1;
}

export function InventarioPredictivo({ isDark, userId }: { isDark: boolean; userId?: string }) {
  const [panalesStock, setPanalesStock] = useState<number | ''>(() => {
    try {
      const saved = localStorage.getItem('inventory_stock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.panalesStock !== undefined && parsed.panalesStock !== '') return Number(parsed.panalesStock);
      }
    } catch {}
    return 0;
  });

  const [botesFormulaStock, setBotesFormulaStock] = useState<number | ''>(() => {
    try {
      const saved = localStorage.getItem('inventory_stock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.botesFormulaStock !== undefined && parsed.botesFormulaStock !== '') return Number(parsed.botesFormulaStock);
      }
    } catch {}
    return 0;
  });

  // Manual / Editables with automatic fallback
  const [promedioPanalesManual, setPromedioPanalesManual] = useState<number | ''>(() => {
    try {
      const saved = localStorage.getItem('inventory_stock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.promedioPanalesManual !== undefined) return parsed.promedioPanalesManual;
      }
    } catch {}
    return '';
  });

  const [promedioBiberonesManual, setPromedioBiberonesManual] = useState<number | ''>(() => {
    try {
      const saved = localStorage.getItem('inventory_stock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.promedioBiberonesManual !== undefined) return parsed.promedioBiberonesManual;
      }
    } catch {}
    return '';
  });

  const [rendimientoPorBote, setRendimientoPorBote] = useState<number | ''>(() => {
    try {
      const saved = localStorage.getItem('inventory_stock');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rendimientoPorBote !== undefined) return parsed.rendimientoPorBote;
      }
    } catch {}
    return '';
  });

  const [autoPanales, setAutoPanales] = useState<number>(5);
  const [autoBiberones, setAutoBiberones] = useState<number>(6);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [diasRestantes, setDiasRestantes] = useState<number>(getDiasRestantesMes());

  // Actualizar días restantes diariamente o cada minuto
  useEffect(() => {
    setDiasRestantes(getDiasRestantesMes());
    const interval = setInterval(() => {
      setDiasRestantes(getDiasRestantesMes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar desde Firestore con respaldo en localStorage y eventos de actualización en tiempo real
  useEffect(() => {
    const handleStockEvent = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.panalesStock !== undefined && custom.detail.panalesStock !== null) {
        setPanalesStock(custom.detail.panalesStock);
      } else {
        try {
          const saved = localStorage.getItem('inventory_stock');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.panalesStock !== undefined && parsed.panalesStock !== '') {
              setPanalesStock(Number(parsed.panalesStock));
            }
          }
        } catch {}
      }
    };

    window.addEventListener('inventory_stock_updated', handleStockEvent);
    window.addEventListener('storage', handleStockEvent);

    const uid = auth.currentUser?.uid || userId || (typeof window !== 'undefined' ? localStorage.getItem('bubblo_current_user_id') : null);
    if (!uid) {
      return () => {
        window.removeEventListener('inventory_stock_updated', handleStockEvent);
        window.removeEventListener('storage', handleStockEvent);
      };
    }

    const inventoryRef = doc(db, `users/${uid}/inventory/main`);
    const panalesStockRef = doc(db, `users/${uid}/inventario/panales`);
    const logsRef = collection(db, `users/${uid}/logs`);

    const unsubscribeInventory = onSnapshot(inventoryRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.panalesStock !== undefined) setPanalesStock(data.panalesStock);
        if (data.botesFormulaStock !== undefined) setBotesFormulaStock(data.botesFormulaStock);
        if (data.promedioPanalesManual !== undefined && data.promedioPanalesManual !== '') {
          setPromedioPanalesManual(data.promedioPanalesManual);
        }
        if (data.promedioBiberonesManual !== undefined && data.promedioBiberonesManual !== '') {
          setPromedioBiberonesManual(data.promedioBiberonesManual);
        }
        if (data.rendimientoPorBote !== undefined) setRendimientoPorBote(data.rendimientoPorBote);
      }
    }, err => console.warn("Error onSnapshot inventory:", err));

    const unsubscribePanales = onSnapshot(panalesStockRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.stock !== undefined) {
          setPanalesStock(data.stock);
        }
      }
    }, err => console.warn("Error onSnapshot inventario panales:", err));

    // Escuchar logs reales para promedios automáticos de 7 días
    let unsubscribeLogs = () => {};
    try {
      unsubscribeLogs = onSnapshot(logsRef, (snap) => {
        try {
          const ultimos7Dias = new Date();
          ultimos7Dias.setDate(ultimos7Dias.getDate() - 7);

          let panalesCount = 0;
          let biberonesCount = 0;

          snap.docs.forEach(d => {
            const data = d.data();
            const timestamp = data.createdAt?.toDate ? data.createdAt.toDate() : (data.fecha?.toDate ? data.fecha.toDate() : new Date(data.timestamp || Date.now()));
            const type = data.type || data.tipo || (data.datos && data.datos.type);

            if (timestamp >= ultimos7Dias) {
              if (type === 'panal') panalesCount++;
              if (type === 'biberon') biberonesCount++;
            }
          });

          setAutoPanales(Math.max(1, Math.round(panalesCount / 7)) || 5);
          setAutoBiberones(Math.max(1, Math.round(biberonesCount / 7)) || 6);
        } catch (innerErr) {
          console.warn("Error processing logs snapshot:", innerErr);
        }
      }, err => {
        console.warn("Error onSnapshot logs:", err);
      });
    } catch (e) {
      console.warn("Failed to subscribe to logs:", e);
    }

    return () => {
      unsubscribeLogs();
      unsubscribeInventory();
      unsubscribePanales();
    };
  }, []);

  // Valores finales efectivos (si no hay manual editado, usa el automático)
  const efectivoPanales = promedioPanalesManual !== '' && !isNaN(Number(promedioPanalesManual)) ? Number(promedioPanalesManual) : autoPanales;
  const efectivoBiberones = promedioBiberonesManual !== '' && !isNaN(Number(promedioBiberonesManual)) ? Number(promedioBiberonesManual) : autoBiberones;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    
    const payload = {
      panalesStock: panalesStock === '' ? '' : panalesStock,
      botesFormulaStock: botesFormulaStock === '' ? '' : botesFormulaStock,
      promedioPanalesManual: promedioPanalesManual === '' ? '' : promedioPanalesManual,
      promedioBiberonesManual: promedioBiberonesManual === '' ? '' : promedioBiberonesManual,
      rendimientoPorBote: rendimientoPorBote === '' ? '' : rendimientoPorBote,
      updatedAt: serverTimestamp()
    };

    try {
      localStorage.setItem('inventory_stock', JSON.stringify(payload));
    } catch {}

    if (!uid) {
      setShowModal(false);
      return;
    }

    try {
      setSaving(true);
      const inventoryRef = doc(db, `users/${uid}/inventory/main`);
      await setDoc(inventoryRef, payload, { merge: true });

      if (panalesStock !== '' && !isNaN(Number(panalesStock))) {
        const panalesRef = doc(db, "users", uid, "inventario", "panales");
        await setDoc(panalesRef, {
          stock: Number(panalesStock),
          ultimaActualizacion: serverTimestamp()
        }, { merge: true });
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving inventory:", err);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const stockNum = panalesStock !== '' ? Number(panalesStock) : 0;
  const botesNum = botesFormulaStock !== '' ? Number(botesFormulaStock) : 0;
  const rendimientoNum = rendimientoPorBote !== '' ? Number(rendimientoPorBote) : 20;

  const stats = useMemo(() => {
    if (stockNum <= 0) {
      return {
        necesarios: 0,
        faltantes: 0,
        porcentaje: 0,
        diasQueAlcanza: 0,
        diasQueAlcanzaFormula: 0,
        noAlcanza: false,
        sinStock: true
      };
    }
    const necesarios = efectivoPanales * diasRestantes;
    const faltantes = Math.max(0, necesarios - stockNum);
    const porcentaje = Math.min(100, Math.max(0, Math.round((stockNum / necesarios) * 100)));
    const diasQueAlcanza = Math.floor(stockNum / efectivoPanales);
    const diasQueAlcanzaFormula = botesNum > 0 ? Math.floor((botesNum * rendimientoNum) / efectivoBiberones) : 0;
    const noAlcanza = stockNum < necesarios;

    return {
      necesarios,
      faltantes,
      porcentaje,
      diasQueAlcanza,
      diasQueAlcanzaFormula,
      noAlcanza,
      sinStock: false
    };
  }, [stockNum, botesNum, efectivoPanales, efectivoBiberones, rendimientoNum, diasRestantes]);

  return (
    <div className={`w-full ${isDark ? 'bg-[#2A2139] text-white border-purple-900/40' : 'bg-[#FFF7F0] text-slate-900 border-amber-200/50'} p-4 rounded-3xl shadow-lg border mt-4 font-sans`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-extrabold text-[15px] sm:text-[16px] flex gap-2 items-center font-heading">
          📦 Inventario Predictivo de Suministros
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-full shadow transition cursor-pointer"
        >
          Gestionar Stock
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card Pañales */}
        <div className={`${isDark ? 'bg-[#352948] border-purple-800/50' : 'bg-[#FFF8DB] border-amber-300/60'} rounded-[20px] p-4 shadow-sm border space-y-2`}>
          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base">
            <DiaperIcon className="w-5 h-5 inline-block shrink-0" />
            <span>Pañales en Stock: {panalesStock !== '' ? `${panalesStock} pañales` : 'Sin stock registrado'}</span>
          </div>
          {stats.sinStock ? (
            <p className="text-xs sm:text-sm font-bold opacity-80 italic py-2">
              Sin stock registrado - Configura tu inventario en Gestionar Stock
            </p>
          ) : (
            <>
              <p className="text-xs sm:text-sm font-bold opacity-90">
                Promedio: {efectivoPanales}/d - Te alcanzan para {stats.diasQueAlcanza} días de {diasRestantes} restantes de este mes
              </p>
              {stats.noAlcanza && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400 font-bold">
                  ⚠️ No alcanza, faltan {stats.faltantes} pañales • {stats.porcentaje}% — compra más
                </p>
              )}
              <div className="mt-2 h-2.5 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${stats.porcentaje}%` }} />
              </div>
              <div className="flex justify-between text-[10px] opacity-80 pt-1">
                <span>{stockNum}/{stats.necesarios} necesarios</span>
                <span>{stats.diasQueAlcanza} de {diasRestantes} días</span>
              </div>
            </>
          )}
        </div>

        {/* Card Fórmula */}
        <div className={`${isDark ? 'bg-[#293248] border-sky-800/50' : 'bg-[#DBEAFE] border-sky-300/60'} rounded-[20px] p-3.5 shadow-sm border`}>
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center font-extrabold text-xs">🍼 Fórmula / Leche</div>
            <span className={`text-[10px] ${isDark ? 'text-sky-300' : 'text-gray-500'}`}>Promedio: {efectivoBiberones}/d</span>
          </div>
          <p className="mt-2.5 font-bold text-[13px] sm:text-[14px] leading-snug">
            {botesFormulaStock !== '' ? `Stock: ${botesFormulaStock} botes • alcanza ${stats.diasQueAlcanzaFormula} días aprox` : 'Sin stock de fórmula registrado'}
          </p>
          <p className={`text-[11px] mt-1 opacity-80 ${isDark ? 'text-sky-200' : 'text-sky-900'}`}>
            Biberones diarios estimados: {efectivoBiberones}
          </p>
          <div className="mt-3 h-2.5 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-sky-400 transition-all" style={{ width: `${Math.min(100, botesNum * 25)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] opacity-80">
            <span>{botesFormulaStock !== '' ? `${botesFormulaStock} botes en stock` : '0 botes'}</span>
            <span>Rendimiento: {rendimientoPorBote !== '' ? rendimientoPorBote : 20} bib/bote</span>
          </div>
        </div>
      </div>

      {/* Modal Organizado en 2 Secciones */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className={`${isDark ? 'bg-[#2A2139] text-white border border-purple-800' : 'bg-white text-slate-900'} w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[24px] p-5 shadow-2xl`} onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-base mb-4 flex items-center gap-2">📦 Gestionar Stock Predictivo</h3>
            
            <form onSubmit={handleSave}>
              {/* Sección 1 - Pañales */}
              <div className={`mb-4 p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'}`}>
                <h4 className="font-black text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <span>📦</span> <span>Pañales</span>
                </h4>

                <label className="text-xs font-bold block mb-1">Pañales en stock (editable)</label>
                <input
                  type="number"
                  placeholder="Ej: 50"
                  value={panalesStock}
                  onChange={e => setPanalesStock(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl p-2.5 mb-3 text-sm font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />

                <label className="text-xs font-bold block mb-1">Promedio real de pañales / día (editable)</label>
                <input
                  type="number"
                  placeholder="Ej: 5"
                  value={promedioPanalesManual}
                  onChange={e => setPromedioPanalesManual(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl p-2.5 mb-3 text-sm font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
                <p className="text-[10px] opacity-70 mb-2">Automático (últimos 7 días): {autoPanales} pañales/día</p>

                <label className="text-xs font-bold block mb-1">Días restantes del mes (solo lectura)</label>
                <input
                  type="text"
                  readOnly
                  value={`${diasRestantes} días`}
                  className={`w-full border rounded-xl p-2.5 text-xs font-bold opacity-80 cursor-not-allowed ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
                />
              </div>

              {/* Sección 2 - Fórmula / Leche */}
              <div className={`mb-5 p-3.5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-sky-500/30' : 'bg-sky-50/70 border-sky-200'}`}>
                <h4 className="font-black text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-3 flex items-center gap-1.5">
                  <span>🍼</span> <span>Fórmula / Leche</span>
                </h4>

                <label className="text-xs font-bold block mb-1">Botes de Fórmula (editable)</label>
                <input
                  type="number"
                  placeholder="Ej: 2"
                  value={botesFormulaStock}
                  onChange={e => setBotesFormulaStock(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl p-2.5 mb-3 text-sm font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />

                <label className="text-xs font-bold block mb-1">Biberones diarios estimados (editable)</label>
                <input
                  type="number"
                  placeholder="Ej: 6"
                  value={promedioBiberonesManual}
                  onChange={e => setPromedioBiberonesManual(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl p-2.5 mb-3 text-sm font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
                <p className="text-[10px] opacity-70 mb-2">Automático (últimos 7 días): {autoBiberones} biberones/día</p>

                <label className="text-xs font-bold block mb-1">Rendimiento por bote (editable)</label>
                <input
                  type="number"
                  placeholder="Ej: 20"
                  value={rendimientoPorBote}
                  onChange={e => setRendimientoPorBote(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-xl p-2.5 text-sm font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 rounded-full py-3 font-bold text-xs ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full py-3 font-black text-xs shadow transition cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
