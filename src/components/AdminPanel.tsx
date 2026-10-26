import React, { useState } from 'react';
import { BabyUser, BabyEvent, PantryItem } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
export { AdminDashboardTotal } from './AdminDashboardTotal';

interface AdminPanelProps {
  onExit: () => void;
  users: BabyUser[];
  events: BabyEvent[];
  pantry: PantryItem[];
  isDark?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onExit,
  users,
  events,
  pantry,
  isDark = false,
}) => {
  const [tab, setTab] = useState<'dashboard' | 'users' | 'subs' | 'inventory' | 'config'>('dashboard');

  const usersList: BabyUser[] = (() => {
    try {
      const raw = localStorage.getItem('bubblo_users');
      return raw ? JSON.parse(raw) : users;
    } catch {
      return users;
    }
  })();

  // First seen
  const firstSeenStr = localStorage.getItem('bubblo_first_seen');
  const firstSeenTime = firstSeenStr ? new Date(firstSeenStr).getTime() : Date.now();
  const daysActive = Math.max(0, Math.floor((Date.now() - firstSeenTime) / 86400000));

  // Pantry items
  const allPantry: PantryItem[] = (() => {
    try {
      const raw = localStorage.getItem('bubblo_despensa');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return pantry;
  })();

  // Events totals
  const totalDiapers = events.filter((e) => e.type === 'panal').length;
  const totalBottlesMl = events
    .filter((e) => e.type === 'biberon')
    .reduce((a, b) => a + (b.amount || 0), 0);

  // Subs info
  const hasPremium = localStorage.getItem('bubblo_premium') === '1';
  const subDate = localStorage.getItem('bubblo_sub_date') || 'Sin suscripción';
  const plan = localStorage.getItem('bubblo_plan') || 'Free';

  // Config helpers
  const handleClearInventory = () => {
    if (window.confirm('¿Borrar inventario?')) {
      localStorage.removeItem('bubblo_despensa');
      window.location.reload();
    }
  };

  const handleChangeAppName = () => {
    const nuevo = prompt('Nuevo nombre app:', localStorage.getItem('bubblo_app_name') || 'Bubblo Baby Day');
    if (nuevo) {
      localStorage.setItem('bubblo_app_name', nuevo);
      alert(`Nombre actualizado a: ${nuevo}`);
    }
  };

  const handleChangePrice = () => {
    const precio = prompt('Nuevo precio premium ($ USD):', localStorage.getItem('bubblo_price') || '4.99');
    if (precio) {
      localStorage.setItem('bubblo_price', precio);
      alert(`Precio actualizado a: ${precio}`);
    }
  };

  const handleAddBaseRecipe = () => {
    const receta = prompt('Agregar receta base (Nombre):');
    if (receta) {
      try {
        const raw = localStorage.getItem('bubblo_custom_recipes') || '[]';
        const list = JSON.parse(raw);
        list.push({ title: receta, addedAt: new Date().toISOString() });
        localStorage.setItem('bubblo_custom_recipes', JSON.stringify(list));
        alert(`Receta "${receta}" agregada a la base`);
      } catch {
        alert('Error al guardar la receta');
      }
    }
  };

  const handlePublishUpdate = async () => {
    const customMsg = prompt('Mensaje de actualización para los usuarios:', 'Nueva actualización');
    if (customMsg !== null) {
      try {
        const versionRef = doc(db, 'app_config', 'version');
        const snap = await getDoc(versionRef);
        let nextVer = 1;
        if (snap.exists()) {
          const prev = snap.data();
          nextVer = Number(prev.versionNumber || (typeof prev.version === 'string' ? prev.version.replace(/\D/g, '') : 0) || 0) + 1;
        }
        const msgText = customMsg.trim() || 'Nueva actualización';
        await setDoc(versionRef, {
          versionNumber: nextVer,
          version: `v${nextVer}`,
          message: msgText,
          mensaje: msgText,
          buildTime: Date.now(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        alert(`🚀 ¡Actualización v${nextVer} publicada exitosamente! Todos los usuarios recibirán el banner.`);
      } catch (err) {
        console.error('Error publishing update:', err);
        alert('Error al publicar la actualización');
      }
    }
  };

  const bgMain = isDark ? 'bg-[#1E1E2E] text-white' : 'bg-[#F5F5F5] text-slate-900';
  const cardBg = isDark ? 'bg-[#2A2A40] border-[#3A3A55] text-white' : 'bg-white border-gray-200 text-slate-900';
  const tabActive = isDark ? 'bg-white text-black font-black' : 'bg-black text-white font-black';
  const tabInactive = isDark ? 'bg-[#2A2A40] text-slate-200 border border-[#3A3A55]' : 'bg-white text-slate-700 border border-gray-200';

  return (
    <div className={`min-h-screen ${bgMain} p-4 md:p-6 transition-colors font-sans`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <span>👑</span>
            <span>Panel Administrador</span>
          </h1>
          <button
            id="admin-exit-btn"
            onClick={onExit}
            className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-black font-black text-xs sm:text-sm rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Salir
          </button>
        </div>

        {/* 5 Tabs Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
          <button
            id="admin-tab-dashboard"
            onClick={() => setTab('dashboard')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              tab === 'dashboard' ? tabActive : tabInactive
            }`}
          >
            📊 Dashboard
          </button>
          <button
            id="admin-tab-users"
            onClick={() => setTab('users')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              tab === 'users' ? tabActive : tabInactive
            }`}
          >
            👶 Usuarios
          </button>
          <button
            id="admin-tab-subs"
            onClick={() => setTab('subs')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              tab === 'subs' ? tabActive : tabInactive
            }`}
          >
            💳 Suscripciones
          </button>
          <button
            id="admin-tab-inventory"
            onClick={() => setTab('inventory')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              tab === 'inventory' ? tabActive : tabInactive
            }`}
          >
            🧺 Inventario
          </button>
          <button
            id="admin-tab-config"
            onClick={() => setTab('config')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm whitespace-nowrap cursor-pointer ${
              tab === 'config' ? tabActive : tabInactive
            }`}
          >
            ⚙️ Config App
          </button>
        </div>

        {/* Tab 1: Dashboard */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`clay p-5 rounded-2xl border ${cardBg}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                Usuarios Registrados
              </div>
              <div className="text-3xl font-black">{usersList.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Usuarios en Firebase
              </div>
            </div>

            <div className={`clay p-5 rounded-2xl border ${cardBg}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-500 mb-1">
                Eventos Registrados
              </div>
              <div className="text-3xl font-black">{events.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total eventos de actividad
              </div>
            </div>

            <div className={`clay p-5 rounded-2xl border ${cardBg}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">
                Días Activo
              </div>
              <div className="text-3xl font-black">{daysActive}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Desde la primera instalación
              </div>
            </div>

            <div className={`clay p-5 rounded-2xl border ${cardBg}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-1">
                Inventario Despensa
              </div>
              <div className="text-3xl font-black">{allPantry.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Productos e ingredientes disponibles
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Usuarios */}
        {tab === 'users' && (
          <div className={`clay p-5 rounded-2xl border ${cardBg} space-y-3`}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              <span>Bebé / Nombre</span>
              <span>Fecha Nac.</span>
              <span>Creado</span>
            </div>

            {usersList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No hay usuarios registrados</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {usersList.map((u) => {
                  const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
                  return (
                    <div key={u.id} className="py-3 flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>👶</span>
                        <span>{u.babyName}</span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {u.birthDate || 'Sin fecha'}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">
                        {createdDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Suscripciones */}
        {tab === 'subs' && (
          <div className={`clay p-5 rounded-2xl border ${cardBg} space-y-4`}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10">
              <span className="text-xs font-bold">Suscripciones activas:</span>
              <span className="text-sm font-black text-amber-500">
                {hasPremium ? '1 Premium' : '0 Gratis'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10">
              <span className="text-xs font-bold">Fecha suscripción:</span>
              <span className="text-xs font-mono">{subDate}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10">
              <span className="text-xs font-bold">Plan actual:</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {plan}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('bubblo_premium', '1');
                  localStorage.setItem('bubblo_sub_date', new Date().toLocaleDateString());
                  localStorage.setItem('bubblo_plan', 'Premium Pro');
                  alert('Suscripción activada como Premium');
                  window.location.reload();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Activar Premium
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('bubblo_premium');
                  localStorage.removeItem('bubblo_sub_date');
                  localStorage.setItem('bubblo_plan', 'Free');
                  alert('Suscripción reseteada a Free');
                  window.location.reload();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Restablecer a Free
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Inventario */}
        {tab === 'inventory' && (
          <div className={`clay p-5 rounded-2xl border ${cardBg} space-y-4 text-xs sm:text-sm`}>
            <div>
              <span className="font-bold block mb-1 text-slate-500 dark:text-slate-400 uppercase text-xs">
                Despensa actual:
              </span>
              <p className="p-3 rounded-xl bg-slate-500/10 font-medium leading-relaxed">
                {allPantry.length > 0
                  ? allPantry.map((i) => i.name).join(', ')
                  : 'Despensa vacía'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                  Pañales totales:
                </span>
                <span className="text-2xl font-black">{totalDiapers}</span>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="block text-xs font-bold text-sky-600 dark:text-sky-400">
                  Biberones totales ml:
                </span>
                <span className="text-2xl font-black">{totalBottlesMl} ml</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                id="admin-clear-inventory-btn"
                onClick={handleClearInventory}
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-black px-4 py-2.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer text-xs"
              >
                Vaciar inventario
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Config App */}
        {tab === 'config' && (
          <div className={`clay p-5 rounded-2xl border ${cardBg} space-y-3`}>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modificar app:
            </p>

            <button
              onClick={handleChangeAppName}
              className="w-full p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold text-left transition cursor-pointer text-xs sm:text-sm flex items-center justify-between"
            >
              <span>🏷️ Cambiar nombre app</span>
              <span className="text-xs text-slate-500">
                {localStorage.getItem('bubblo_app_name') || 'Bubblo Baby Day'}
              </span>
            </button>

            <button
              onClick={handleChangePrice}
              className="w-full p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold text-left transition cursor-pointer text-xs sm:text-sm flex items-center justify-between"
            >
              <span>💰 Cambiar precio premium</span>
              <span className="text-xs text-slate-500">
                ${localStorage.getItem('bubblo_price') || '4.99'} USD
              </span>
            </button>

            <button
              onClick={handleAddBaseRecipe}
              className="w-full p-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl font-bold text-left transition cursor-pointer text-xs sm:text-sm flex items-center justify-between"
            >
              <span>🍲 Agregar receta</span>
              <span className="text-xs text-slate-500">+ Nueva</span>
            </button>

            <button
              onClick={handlePublishUpdate}
              className="w-full p-3 bg-gradient-to-r from-sky-500 to-pink-500 hover:opacity-90 text-white rounded-xl font-black text-left transition cursor-pointer text-xs sm:text-sm flex items-center justify-between shadow-md"
            >
              <span>🚀 Publicar Actualización (Republicar)</span>
              <span className="bg-white/20 px-2 py-1 rounded-lg text-xs">+1 Versión</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
