import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BabyUser, LanguageCode, VaccineItem } from '../types';
import { rE } from '../i18n';
import { INITIAL_VACCINES } from '../vacunasData';
import {
  Syringe,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  ShieldCheck,
  Info,
  Check,
  X,
  Sparkles,
  Tag
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';

interface VaccinesTabProps {
  user: BabyUser;
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  vaccines?: VaccineItem[];
  onUpdateVaccines?: (vacs: VaccineItem[]) => void;
}

export const VaccinesTab: React.FC<VaccinesTabProps> = ({
  user,
  lang,
  isDark,
  vaccines: initialVaccinesProp,
  onUpdateVaccines,
}) => {
  const t = rE[lang] || rE.es;
  const uid = auth.currentUser?.uid || user?.id || (user as any)?.email;

  // Local state for full vaccine list (standard 15 + custom)
  const [vaccinesList, setVaccinesList] = useState<VaccineItem[]>(() => {
    if (initialVaccinesProp && initialVaccinesProp.length > 0) {
      return initialVaccinesProp;
    }
    if (uid) {
      try {
        const saved = localStorage.getItem(`bubblo_vaccines_${uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn("Could not read local vaccines:", e);
      }
    }
    return INITIAL_VACCINES;
  });

  // Filters & Search
  const [filterStatus, setFilterStatus] = useState<'todas' | 'pendientes' | 'aplicadas'>('todas');
  const [filterAge, setFilterAge] = useState<'todas' | '0-2' | '4-6' | '12+'>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Feedback
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToApply, setSelectedToApply] = useState<VaccineItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

  // Form states for "Registrar Vacuna"
  const [newNombre, setNewNombre] = useState('');
  const [newEdadMeses, setNewEdadMeses] = useState('0');
  const [newEdadLabel, setNewEdadLabel] = useState('0 meses');
  const [newDosis, setNewDosis] = useState('1ra Dosis');
  const [newEnfermedad, setNewEnfermedad] = useState('');
  const [newExplicacion, setNewExplicacion] = useState('');
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newIsApplied, setNewIsApplied] = useState(false);
  const [newLote, setNewLote] = useState('');
  const [newNotas, setNewNotas] = useState('');

  // Form states for "Marcar como Aplicada"
  const [applyDate, setApplyDate] = useState(new Date().toISOString().split('T')[0]);
  const [applyLote, setApplyLote] = useState('');
  const [applyNotas, setApplyNotas] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Synchronize with Firestore & local persistence
  useEffect(() => {
    if (!uid) return;

    try {
      const colRef = collection(db, "users", uid, "vacunas");
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        // If Firestore has documents, merge them with the 15 standard vaccines
        if (!snapshot.empty) {
          const remoteDocs = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as any[];

          // Create mapping of remote records by ID or name
          const remoteMap = new Map<string, any>();
          remoteDocs.forEach(d => {
            if (d.id) remoteMap.set(d.id.toLowerCase(), d);
            if (d.vaccineId) remoteMap.set(d.vaccineId.toLowerCase(), d);
            if (d.name) remoteMap.set(d.name.toLowerCase(), d);
            if (d.nombre) remoteMap.set(d.nombre.toLowerCase(), d);
          });

          // Overlay onto standard schedule
          const mergedStandard: VaccineItem[] = INITIAL_VACCINES.map(std => {
            const match = remoteMap.get(std.id.toLowerCase()) || remoteMap.get(std.name.toLowerCase());
            if (match) {
              return {
                ...std,
                applied: match.applied !== undefined ? match.applied : true,
                appliedDate: match.appliedDate || match.fecha || std.appliedDate,
                lote: match.lote || match.batch || std.lote,
                notas: match.notas || match.notes || std.notas
              };
            }
            return std;
          });

          // Include any custom vaccines added by user
          const customVaccines: VaccineItem[] = [];
          remoteDocs.forEach(d => {
            const isStandard = INITIAL_VACCINES.some(s => s.id.toLowerCase() === d.id.toLowerCase() || (d.vaccineId && s.id.toLowerCase() === d.vaccineId.toLowerCase()));
            if (!isStandard) {
              customVaccines.push({
                id: d.id,
                name: d.name || d.nombre || 'Vacuna',
                ageMonth: Number(d.ageMonth || d.edadMeses || 0),
                ageLabel: d.ageLabel || d.edadLabel || 'Registro especial',
                dose: d.dose || d.dosis || 'Única',
                disease: d.disease || d.enfermedad || 'Inmunización pediátrica',
                explain: d.explain || d.notas || 'Vacuna registrada por la familia',
                applied: d.applied !== undefined ? d.applied : true,
                appliedDate: d.appliedDate || d.fecha,
                lote: d.lote,
                notas: d.notas,
                isCustom: true
              });
            }
          });

          const finalList = [...mergedStandard, ...customVaccines];
          setVaccinesList(finalList);
          localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(finalList));
          if (onUpdateVaccines) onUpdateVaccines(finalList);
        } else {
          // If Firestore collection was empty, preserve any already applied vaccines from local cache or backups!
          let existingApplied = vaccinesList.filter(v => v.applied);
          if (existingApplied.length === 0) {
            // Check any local storage keys
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && (k.includes('vaccine') || k.includes('vacuna'))) {
                try {
                  const val = JSON.parse(localStorage.getItem(k) || '[]');
                  if (Array.isArray(val)) {
                    const found = val.filter((item: any) => item && (item.applied || item.appliedDate));
                    if (found.length > 0) {
                      existingApplied = found;
                      break;
                    }
                  }
                } catch {}
              }
            }
          }

          const appliedMap = new Map<string, any>();
          existingApplied.forEach(a => {
            if (a.id) appliedMap.set(a.id.toLowerCase(), a);
            if (a.name) appliedMap.set(a.name.toLowerCase(), a);
          });

          const seededList = INITIAL_VACCINES.map(vac => {
            const match = appliedMap.get(vac.id.toLowerCase()) || appliedMap.get(vac.name.toLowerCase());
            if (match) {
              return {
                ...vac,
                applied: true,
                appliedDate: match.appliedDate || match.fecha || new Date().toISOString().split('T')[0],
                lote: match.lote || '',
                notas: match.notas || ''
              };
            }
            return vac;
          });

          // Seed Firestore with preserved status
          seededList.forEach(async (vac) => {
            try {
              await setDoc(doc(db, "users", uid, "vacunas", vac.id), {
                id: vac.id,
                name: vac.name,
                ageMonth: vac.ageMonth,
                ageLabel: vac.ageLabel,
                dose: vac.dose,
                disease: vac.disease,
                explain: vac.explain,
                applied: vac.applied || false,
                appliedDate: vac.appliedDate || null,
                lote: vac.lote || null,
                notas: vac.notas || null,
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (err) {
              console.warn("Could not seed vaccine:", vac.id, err);
            }
          });

          setVaccinesList(seededList);
          localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(seededList));
          if (onUpdateVaccines) onUpdateVaccines(seededList);
        }
      }, (error) => {
        console.warn("Error listening to vaccines:", error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase listener exception:", e);
    }
  }, [uid, onUpdateVaccines]);

  // Deep recovery of any lost vaccine records across all localStorage keys and Firestore collections
  const handleRecoverVaccineRecords = async () => {
    setIsRecovering(true);
    try {
      const recoveredAppliedMap = new Map<string, any>();
      const recoveredCustom: VaccineItem[] = [];

      // 1. Scan ALL localStorage keys for any vaccine traces
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.includes('vaccine') || k.includes('vacuna') || k.includes('backup') || k.includes('event')) {
          try {
            const raw = localStorage.getItem(k);
            if (!raw) continue;
            const parsed = JSON.parse(raw);

            // If it's an array of vaccine objects
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                if (item && typeof item === 'object') {
                  if (item.applied || item.appliedDate) {
                    const key = (item.id || item.name || '').toLowerCase();
                    if (key) recoveredAppliedMap.set(key, item);
                  }
                  if (item.isCustom && item.name) {
                    if (!recoveredCustom.some(c => c.id === item.id || c.name === item.name)) {
                      recoveredCustom.push(item);
                    }
                  }
                }
              });
            } else if (parsed && typeof parsed === 'object' && parsed.data) {
              // Full backup object structure
              const innerData = parsed.data;
              Object.keys(innerData).forEach(subK => {
                if (subK.includes('vaccine') || subK.includes('vacuna')) {
                  try {
                    const subParsed = JSON.parse(innerData[subK]);
                    if (Array.isArray(subParsed)) {
                      subParsed.forEach((item: any) => {
                        if (item && (item.applied || item.appliedDate)) {
                          const key = (item.id || item.name || '').toLowerCase();
                          if (key) recoveredAppliedMap.set(key, item);
                        }
                      });
                    }
                  } catch {}
                }
              });
            }
          } catch {}
        }
      }

      // 2. Scan remote collections in Firestore (both 'vacunas' and legacy 'vaccines')
      if (uid) {
        try {
          const colVacunas = collection(db, "users", uid, "vacunas");
          const snapVacunas = await getDocs(colVacunas);
          snapVacunas.forEach(d => {
            const data = d.data();
            if (data.applied || data.appliedDate) {
              const key = (d.id || data.name || '').toLowerCase();
              recoveredAppliedMap.set(key, { ...data, id: d.id });
            }
            if (data.isCustom && data.name) {
              if (!recoveredCustom.some(c => c.id === d.id)) {
                recoveredCustom.push({ id: d.id, ...data } as VaccineItem);
              }
            }
          });
        } catch (e) {
          console.warn("Error scanning remote vacunas:", e);
        }

        try {
          const colVaccines = collection(db, "users", uid, "vaccines");
          const snapVaccines = await getDocs(colVaccines);
          snapVaccines.forEach(d => {
            const data = d.data();
            if (data.applied || data.appliedDate) {
              const key = (d.id || data.name || '').toLowerCase();
              recoveredAppliedMap.set(key, { ...data, id: d.id });
            }
          });
        } catch (e) {}
      }

      // 3. Merge recovered applied data with base vaccines
      let recoveredCount = 0;
      const mergedList: VaccineItem[] = INITIAL_VACCINES.map(base => {
        const found = recoveredAppliedMap.get(base.id.toLowerCase()) || 
                      recoveredAppliedMap.get(base.name.toLowerCase());
        if (found && (found.applied || found.appliedDate)) {
          recoveredCount++;
          return {
            ...base,
            applied: true,
            appliedDate: found.appliedDate || found.fecha || new Date().toISOString().split('T')[0],
            lote: found.lote || base.lote,
            notas: found.notas || base.notas
          };
        }
        return base;
      });

      const finalList = [...mergedList, ...recoveredCustom];
      setVaccinesList(finalList);

      if (uid) {
        localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(finalList));
        localStorage.setItem(`bubblo_vaccines_backup_${uid}`, JSON.stringify(finalList));
        // Persist recovered items to Firestore
        for (const vac of finalList) {
          if (vac.applied || vac.isCustom) {
            try {
              await setDoc(doc(db, "users", uid, "vacunas", vac.id), {
                ...vac,
                uid,
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (err) {}
          }
        }
      }

      if (onUpdateVaccines) onUpdateVaccines(finalList);

      if (recoveredCount > 0 || recoveredCustom.length > 0) {
        showToast(`🛡️ ¡Éxito! Se recuperaron ${recoveredCount} vacunas aplicadas${recoveredCustom.length > 0 ? ` y ${recoveredCustom.length} personalizadas` : ''}.`);
      } else {
        showToast("ℹ️ El esquema está sincronizado. No se encontraron registros anteriores perdidos.");
      }
    } catch (err) {
      console.error("Error en recuperación de vacunas:", err);
      showToast("Error al recuperar. Se mantuvieron los datos actuales.");
    } finally {
      setIsRecovering(false);
    }
  };

  // Restore the full 15 pediatric vaccines
  const handleRestoreFullSchedule = async () => {
    setIsRestoring(true);
    try {
      // Keep existing applied dates if any
      const existingMap = new Map<string, VaccineItem>();
      vaccinesList.forEach(v => existingMap.set(v.id, v));

      const restoredList: VaccineItem[] = INITIAL_VACCINES.map(base => {
        const prev = existingMap.get(base.id);
        if (prev && prev.applied) {
          return { ...base, applied: true, appliedDate: prev.appliedDate, lote: prev.lote, notas: prev.notas };
        }
        return base;
      });

      setVaccinesList(restoredList);
      if (uid) {
        localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(restoredList));
        // Batch write or set docs to Firestore
        for (const vac of restoredList) {
          try {
            await setDoc(doc(db, "users", uid, "vacunas", vac.id), {
              ...vac,
              uid,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (e) {
            console.warn("Restore doc error:", vac.id, e);
          }
        }
      }
      if (onUpdateVaccines) onUpdateVaccines(restoredList);
      showToast("💉 ¡Esquema oficial de 15 vacunas restaurado correctamente!");
    } catch (err) {
      console.error("Error restaurando vacunas:", err);
      showToast("Ocurrió un error al restaurar. Se cargaron los datos locales.");
    } finally {
      setIsRestoring(false);
    }
  };

  // Open modal to mark applied
  const handleOpenApplyModal = (vac: VaccineItem) => {
    setSelectedToApply(vac);
    setApplyDate(vac.appliedDate || new Date().toISOString().split('T')[0]);
    setApplyLote(vac.lote || '');
    setApplyNotas(vac.notas || '');
  };

  // Save applied status
  const handleSaveAppliedStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToApply) return;

    const updatedList = vaccinesList.map(v => {
      if (v.id === selectedToApply.id) {
        return {
          ...v,
          applied: true,
          appliedDate: applyDate,
          lote: applyLote.trim() || undefined,
          notas: applyNotas.trim() || undefined
        };
      }
      return v;
    });

    setVaccinesList(updatedList);
    if (uid) {
      localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(updatedList));
      try {
        await setDoc(doc(db, "users", uid, "vacunas", selectedToApply.id), {
          id: selectedToApply.id,
          name: selectedToApply.name,
          ageMonth: selectedToApply.ageMonth,
          ageLabel: selectedToApply.ageLabel,
          dose: selectedToApply.dose,
          disease: selectedToApply.disease,
          explain: selectedToApply.explain,
          applied: true,
          appliedDate: applyDate,
          lote: applyLote.trim() || '',
          notas: applyNotas.trim() || '',
          isCustom: !!selectedToApply.isCustom,
          uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error saving applied vaccine to Firestore:", err);
      }
    }

    if (onUpdateVaccines) onUpdateVaccines(updatedList);
    setSelectedToApply(null);
    showToast(`✅ Vacuna "${selectedToApply.name}" marcada como aplicada.`);
  };

  // Toggle directly to pending / unmark
  const handleUnmarkVaccine = async (vac: VaccineItem) => {
    const updatedList = vaccinesList.map(v => {
      if (v.id === vac.id) {
        return {
          ...v,
          applied: false,
          appliedDate: undefined,
          lote: undefined,
          notas: undefined
        };
      }
      return v;
    });

    setVaccinesList(updatedList);
    if (uid) {
      localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(updatedList));
      try {
        await setDoc(doc(db, "users", uid, "vacunas", vac.id), {
          applied: false,
          appliedDate: null,
          lote: '',
          notas: '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error unmarking vaccine:", err);
      }
    }
    if (onUpdateVaccines) onUpdateVaccines(updatedList);
    setSelectedToApply(null);
    showToast(`Vacuna "${vac.name}" marcada como pendiente.`);
  };

  // Delete custom vaccine
  const handleDeleteCustomVaccine = async (id: string, name: string) => {
    const updatedList = vaccinesList.filter(v => v.id !== id);
    setVaccinesList(updatedList);
    if (uid) {
      localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(updatedList));
      try {
        await deleteDoc(doc(db, "users", uid, "vacunas", id));
      } catch (err) {
        console.error("Error deleting custom vaccine:", err);
      }
    }
    if (onUpdateVaccines) onUpdateVaccines(updatedList);
    showToast(`Vacuna "${name}" eliminada.`);
  };

  // Add new custom vaccine
  const handleCreateCustomVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    const newId = 'custom_' + Date.now();
    const newVaccine: VaccineItem = {
      id: newId,
      name: newNombre.trim(),
      ageMonth: parseInt(newEdadMeses, 10) || 0,
      ageLabel: newEdadLabel.trim() || `${newEdadMeses} meses`,
      dose: newDosis.trim() || 'Dosis Única',
      disease: newEnfermedad.trim() || 'Inmunización pediátrica',
      explain: newExplicacion.trim() || 'Vacuna complementaria registrada',
      applied: newIsApplied,
      appliedDate: newIsApplied ? newFecha : undefined,
      lote: newLote.trim() || undefined,
      notas: newNotas.trim() || undefined,
      isCustom: true
    };

    const updatedList = [...vaccinesList, newVaccine];
    setVaccinesList(updatedList);

    if (uid) {
      localStorage.setItem(`bubblo_vaccines_${uid}`, JSON.stringify(updatedList));
      try {
        await setDoc(doc(db, "users", uid, "vacunas", newId), {
          ...newVaccine,
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error creating custom vaccine:", err);
      }
    }

    if (onUpdateVaccines) onUpdateVaccines(updatedList);

    // Reset form
    setNewNombre('');
    setNewEnfermedad('');
    setNewExplicacion('');
    setNewLote('');
    setNewNotas('');
    setNewIsApplied(false);
    setShowAddModal(false);
    showToast(`✅ Vacuna "${newVaccine.name}" registrada con éxito.`);
  };

  // Stats
  const totalCount = vaccinesList.length;
  const appliedCount = useMemo(() => vaccinesList.filter(v => v.applied).length, [vaccinesList]);
  const pendingCount = totalCount - appliedCount;
  const progressPercent = totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0;

  // Filtered vaccines
  const displayedVaccines = useMemo(() => {
    return vaccinesList.filter(vac => {
      // Status filter
      if (filterStatus === 'pendientes' && vac.applied) return false;
      if (filterStatus === 'aplicadas' && !vac.applied) return false;

      // Age filter
      if (filterAge === '0-2' && vac.ageMonth > 2) return false;
      if (filterAge === '4-6' && (vac.ageMonth < 4 || vac.ageMonth > 6)) return false;
      if (filterAge === '12+' && vac.ageMonth < 12) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = vac.name.toLowerCase().includes(query);
        const matchesDisease = vac.disease?.toLowerCase().includes(query);
        const matchesDose = vac.dose?.toLowerCase().includes(query);
        const matchesAge = vac.ageLabel?.toLowerCase().includes(query);
        if (!matchesName && !matchesDisease && !matchesDose && !matchesAge) {
          return false;
        }
      }

      return true;
    });
  }, [vaccinesList, filterStatus, filterAge, searchQuery]);

  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  return (
    <div className="space-y-5 pb-28 max-w-4xl mx-auto px-4 pt-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading flex items-center gap-2">
            <span>💉</span>
            <span>{t.vacunas || 'Vacunas'} y Registro de Inmunización</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Esquema oficial de vacunación pediátrica y registro en la nube para tu bebé
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleRecoverVaccineRecords}
            disabled={isRecovering}
            className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
            title="Escanear y recuperar registros de vacunas previas desde la memoria o nube"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-emerald-500 ${isRecovering ? 'animate-spin' : ''}`} />
            <span>{isRecovering ? 'Recuperando...' : 'Recuperar Registros'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreFullSchedule}
            disabled={isRestoring}
            className={`py-2.5 px-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Restaurar las 15 vacunas del esquema pediátrico"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-indigo-500 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>{isRestoring ? 'Restaurando...' : 'Restaurar Esquema'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/30 clay-press flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Vacuna</span>
          </button>
        </div>
      </div>

      {/* Progress & Summary Card */}
      <div className={`p-4 sm:p-5 rounded-3xl ${cardBase} border border-indigo-500/20 shadow-sm space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Estado de Inmunización</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {appliedCount} de {totalCount} vacunas aplicadas ({progressPercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              ✅ {appliedCount} Aplicadas
            </span>
            <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              ⏳ {pendingCount} Pendientes
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vacuna por nombre, enfermedad o dosis..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition ${
                isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter tabs */}
          <div className="flex rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setFilterStatus('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filterStatus === 'todas'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pendientes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filterStatus === 'pendientes'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('aplicadas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filterStatus === 'aplicadas'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Aplicadas ({appliedCount})
            </button>
          </div>
        </div>

        {/* Age filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">Edad:</span>
          {[
            { id: 'todas', label: 'Todas las edades' },
            { id: '0-2', label: '0 a 2 meses' },
            { id: '4-6', label: '4 a 6 meses' },
            { id: '12+', label: '12+ meses (1 año)' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterAge(f.id as any)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                filterAge === f.id
                  ? 'bg-indigo-500 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vaccines Grid / List */}
      {displayedVaccines.length === 0 ? (
        <div className={`p-10 rounded-3xl ${cardBase} text-center space-y-4 border border-dashed border-slate-300 dark:border-slate-700`}>
          <Syringe className="w-12 h-12 mx-auto text-indigo-400 opacity-60" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No se encontraron vacunas con los filtros seleccionados
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterStatus('todas');
                setFilterAge('todas');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:opacity-80 transition cursor-pointer"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={handleRestoreFullSchedule}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-600 transition cursor-pointer shadow-md"
            >
              Restaurar Esquema (15 vacunas)
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedVaccines.map((vac) => {
            const isApplied = !!vac.applied;

            return (
              <div
                key={vac.id}
                className={`p-4 rounded-3xl ${cardBase} shadow-md border transition-all flex flex-col justify-between gap-3 ${
                  isApplied
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-indigo-500/20'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top tags: Age badge + Dose badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        {vac.ageLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-300">
                        {vac.dose}
                      </span>
                      {vac.isCustom && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>Personalizada</span>
                        </span>
                      )}
                    </div>

                    {vac.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomVaccine(vac.id, vac.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Eliminar vacuna personalizada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title & Syringe Icon */}
                  <div className="flex items-start gap-2.5">
                    <span className={`p-2 rounded-2xl shrink-0 ${
                      isApplied
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <Syringe className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 leading-tight">
                        {vac.name}
                      </h3>
                      {vac.disease && (
                        <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 mt-0.5">
                          Protege contra: {vac.disease}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pediatric explanation */}
                  {vac.explain && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                      {vac.explain}
                    </p>
                  )}

                  {/* Applied details: Date, Lot, Notes */}
                  {isApplied && (
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Aplicada el: {vac.appliedDate || 'Fecha registrada'}</span>
                      </div>
                      {vac.lote && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pl-5">
                          Lote: {vac.lote}
                        </p>
                      )}
                      {vac.notas && (
                        <p className="text-[11px] italic text-emerald-700 dark:text-emerald-400 pl-5">
                          "{vac.notas}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom action button */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isApplied ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Completada</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenApplyModal(vac)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          Editar detalles
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnmarkVaccine(vac)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          Desmarcar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenApplyModal(vac)}
                        className="py-1.5 px-3 rounded-xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Marcar Aplicada</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Mark Applied / Edit Application Details */}
      {selectedToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 ${cardBase} border border-indigo-500/30`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">Registrar Aplicación</h3>
                  <p className="text-xs font-semibold text-slate-500">{selectedToApply.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedToApply(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppliedStatus} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Fecha en que se aplicó</span>
                </label>
                <input
                  type="date"
                  required
                  value={applyDate}
                  onChange={(e) => setApplyDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Número de Lote (opcional)
                </label>
                <input
                  type="text"
                  value={applyLote}
                  onChange={(e) => setApplyLote(e.target.value)}
                  placeholder="Ej: LOT-39281"
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notas u observaciones (opcional)
                </label>
                <textarea
                  value={applyNotas}
                  onChange={(e) => setApplyNotas(e.target.value)}
                  placeholder="Ej: Sin fiebre, pediatra Dr. Gómez..."
                  rows={2}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                {selectedToApply.applied && (
                  <button
                    type="button"
                    onClick={() => handleUnmarkVaccine(selectedToApply)}
                    className="py-2.5 px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    Desmarcar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedToApply(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-md cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Vaccine */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 ${cardBase} border border-indigo-500/30 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base flex items-center gap-2">
                <Syringe className="w-5 h-5 text-indigo-500" />
                <span>Registrar Vacuna Personalizada</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomVaccine} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nombre de la vacuna *
                </label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Fiebre Amarilla, Meningococo B..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Edad recomendada
                  </label>
                  <input
                    type="text"
                    value={newEdadLabel}
                    onChange={(e) => {
                      setNewEdadLabel(e.target.value);
                      const m = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      if (!isNaN(m)) setNewEdadMeses(String(m));
                    }}
                    placeholder="Ej: 9 meses, 1 año..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={newDosis}
                    onChange={(e) => setNewDosis(e.target.value)}
                    placeholder="Ej: Única, 1ra Dosis..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enfermedad que previene
                </label>
                <input
                  type="text"
                  value={newEnfermedad}
                  onChange={(e) => setNewEnfermedad(e.target.value)}
                  placeholder="Ej: Fiebre amarilla, Meningitis bacteriana..."
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsApplied}
                    onChange={(e) => setNewIsApplied(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ¿Ya fue aplicada al bebé?
                  </span>
                </label>

                {newIsApplied && (
                  <div className="pt-2 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Fecha de aplicación
                      </label>
                      <input
                        type="date"
                        value={newFecha}
                        onChange={(e) => setNewFecha(e.target.value)}
                        className={`w-full p-2 rounded-xl border text-xs font-bold outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Lote (opcional)
                      </label>
                      <input
                        type="text"
                        value={newLote}
                        onChange={(e) => setNewLote(e.target.value)}
                        placeholder="Ej: LOT-9481"
                        className={`w-full p-2 rounded-xl border text-xs font-bold outline-none ${
                          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notas u observaciones (opcional)
                </label>
                <textarea
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  placeholder="Reacciones o instrucciones del pediatra..."
                  rows={2}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
                >
                  Guardar vacuna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
