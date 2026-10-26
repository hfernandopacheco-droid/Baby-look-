import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, PantryItem, PantryCategory, LanguageCode, RecipeHistoryItem } from '../types';
import { rE } from '../i18n';
import { JE, generarRecetasIA_qE, YA, bA } from '../utils';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, addDoc, collection, deleteDoc } from 'firebase/firestore';
import {
  Heart,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  X,
  Copy,
  ChefHat,
  ChevronRight,
  Info,
  ArrowLeft,
  History,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface NutritionTabProps {
  recipes: Recipe[];
  pantry: PantryItem[];
  favorites: string[];
  history: string[];
  onToggleFavorite: (recipeId: string) => void;
  onAddPantryItem: (name: string, category: PantryCategory) => void;
  onAddMultiplePantryItems?: (items: { name: string; category: PantryCategory }[]) => void;
  onUpdatePantryCategory?: (id: string, category: PantryCategory) => void;
  onRemovePantryItem: (id: string) => void;
  onLogRecipeCooked: (recipeId: string) => void;
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  babyName?: string;
  babyBirthDate?: string;
}

// 10 categorías nada más
const RECIPE_CATEGORIES: { id: string; label: string; emoji: string }[] = [
  { id: 'desayunos', label: 'Desayunos', emoji: '🥞' },
  { id: 'almuerzos', label: 'Almuerzos', emoji: '🍲' },
  { id: 'blw', label: 'BLW', emoji: '🥕' },
  { id: 'untables', label: 'Untables', emoji: '🥑' },
  { id: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { id: 'postres', label: 'Postres', emoji: '🍓' },
  { id: 'unicos', label: 'Platos Únicos', emoji: '🍛' },
  { id: 'frios', label: 'Frescos y Fríos', emoji: '🥗' },
  { id: 'sopas', label: 'Sopas', emoji: '🥣' },
  { id: 'colaciones', label: 'Colaciones', emoji: '🍪' },
];

// Categorías de despensa con sus iconos
const PANTRY_CATEGORIES: { id: PantryCategory; label: string; icon: string; color: string }[] = [
  { id: 'Frutas', label: 'Frutas', icon: '🍎', color: 'from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800' },
  { id: 'Verduras', label: 'Verduras', icon: '🥕', color: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' },
  { id: 'Proteína', label: 'Proteína', icon: '🍗', color: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800' },
  { id: 'Cereales', label: 'Cereales', icon: '🌾', color: 'from-yellow-500/15 to-yellow-500/5 text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800' },
  { id: 'Lácteos', label: 'Lácteos', icon: '🥛', color: 'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800' },
  { id: 'Pasta', label: 'Pasta', icon: '🍝', color: 'from-orange-500/15 to-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800' },
  { id: 'Otros', label: 'Otros', icon: '🥫', color: 'from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800' },
];

export const NutritionTab: React.FC<NutritionTabProps> = ({
  recipes,
  pantry,
  favorites,
  onToggleFavorite,
  onAddPantryItem,
  onAddMultiplePantryItems,
  onUpdatePantryCategory,
  onRemovePantryItem,
  lang,
  isDark,
  babyName = 'Mathews',
  babyBirthDate,
}) => {
  const t = rE[lang] || rE.es;

  // Localized category labels translating Pasta, Lácteos, Otros with t.pasta, t.dairy, t.others
  const getCategoryLabel = (catId: string): string => {
    if (catId === 'Pasta') return t.pasta || 'Pasta';
    if (catId === 'Lácteos') return t.dairy || 'Lácteos';
    if (catId === 'Otros') return t.others || 'Otros';
    if (catId === 'Frutas') return t.fruits || 'Frutas';
    if (catId === 'Verduras') return t.vegetables || 'Verduras';
    if (catId === 'Proteína') return t.protein || 'Proteína';
    if (catId === 'Cereales') return t.cereals || 'Cereales';
    return t.pantryCats?.[catId] || catId;
  };

  const [firestoreBirthDate, setFirestoreBirthDate] = useState<string>('');
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.fechaNacimiento || data.birthDate) {
          setFirestoreBirthDate(data.fechaNacimiento || data.birthDate);
        }
      }
    }, (err) => console.warn("Error reading user birthDate:", err));
    return () => unsub();
  }, []);

  // Edad en meses w = Math.floor((Date.now()-new Date(o.birthDate))/2629800000)
  const effectiveBirthDate = firestoreBirthDate || babyBirthDate || '2026-02-15';
  const babyAgeMonths = useMemo(() => {
    const birth = new Date(effectiveBirthDate).getTime();
    if (isNaN(birth)) return 6;
    const months = Math.floor((Date.now() - birth) / 2629800000);
    return Math.max(0, Math.min(36, months));
  }, [effectiveBirthDate]);

  // SOLO 3 OPCIONES: 'despensa' | 'tipos' | 'favoritos'
  const [activeTab, setActiveTab] = useState<'despensa' | 'tipos' | 'favoritos'>('tipos');

  // Info interna Despensa: input + split coma
  const [pantryInput, setPantryInput] = useState('');

  // Info interna Tipos de Recetas: 10 categorías (solo muestra las 10 recetas de la categoría elegida)
  const [selectedCategory, setSelectedCategory] = useState<string>('desayunos');

  // Modal para ver receta en detalle
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  // Generador IA: Modal o panel desplegable
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [genMode, setGenMode] = useState<'normal' | 'free'>('normal');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Input cantidad de recetas a generar N_recetas_input con botones + y - o slider (1 a 10, default 3)
  const [recipeCount, setRecipeCount] = useState<number>(3);

  // Recetas IA generadas
  const [generatedAiRecipes, setGeneratedAiRecipes] = useState<Recipe[]>(() => {
    try {
      const raw = localStorage.getItem('bubblo_ai_recipes_saved');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const cardBase = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';

  const despensaIdActual = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [localPantry, setLocalPantry] = useState<PantryItem[]>([]);
  const [aiRecipesInPanel, setAiRecipesInPanel] = useState<Recipe[]>([]);
  const [isGeneratingInPanel, setIsGeneratingInPanel] = useState<boolean>(false);

  const [modalCategory, setModalCategory] = useState<{ id: string; label: string; emoji: string } | null>(null);
  const [modalRecipeCount, setModalRecipeCount] = useState<string>('3');
  const [isGeneratingModal, setIsGeneratingModal] = useState<boolean>(false);
  const [categoryRecipesList, setCategoryRecipesList] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryRecipesList([]);
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const colRef = collection(db, "users", uid, `nutricion_${selectedCategory}`);
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Recipe));
      setCategoryRecipesList(list);
    }, (err) => console.warn("Error reading category recipes list:", err));
    return () => unsub();
  }, [selectedCategory]);

  // Estados para Favoritos completos y Memoria Historial
  const [savedFavoriteRecipes, setSavedFavoriteRecipes] = useState<Recipe[]>(() => {
    try {
      const raw = localStorage.getItem('bubblo_favorite_recipes_full');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [historyRecipes, setHistoryRecipes] = useState<RecipeHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('bubblo_recipes_history_full');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [favSubTab, setFavSubTab] = useState<'favoritas' | 'historial'>('favoritas');
  const [selectedFavDetail, setSelectedFavDetail] = useState<Recipe | null>(null);

  // Sincronización en tiempo real de Recetas Favoritas y Memoria Historial con Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('bubblo_current_user_id') : null);
    if (!uid) return;

    const favsCol = collection(db, "users", uid, "recetas_favoritas");
    const unsubFavs = onSnapshot(favsCol, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Recipe));
      if (list.length > 0) {
        setSavedFavoriteRecipes(list);
        try {
          localStorage.setItem('bubblo_favorite_recipes_full', JSON.stringify(list));
          localStorage.setItem(`bubblo_favorite_recipes_full_${uid}`, JSON.stringify(list));
        } catch {}
      }
    }, (err) => console.warn("Error listening to recetas_favoritas:", err));

    const histCol = collection(db, "users", uid, "recetas_historial");
    const unsubHist = onSnapshot(histCol, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as RecipeHistoryItem))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      if (list.length > 0) {
        setHistoryRecipes(list);
        try {
          localStorage.setItem('bubblo_recipes_history_full', JSON.stringify(list));
        } catch {}
      }
    }, (err) => console.warn("Error listening to recetas_historial:", err));

    return () => {
      unsubFavs();
      unsubHist();
    };
  }, []);

  const isRecipeFavorited = (recipeId?: string): boolean => {
    if (!recipeId) return false;
    return favorites.includes(recipeId) || savedFavoriteRecipes.some(r => r.id === recipeId);
  };

  const addRecipeToHistory = async (recipe: Recipe, action: 'preparada' | 'guardada' | 'generada' = 'preparada', notes?: string) => {
    const now = Date.now();
    const dateStr = new Date().toLocaleDateString(lang || 'es', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    const historyItem: RecipeHistoryItem = {
      id: 'hist_' + now + '_' + Math.random().toString(36).substring(2, 6),
      recipe,
      action,
      timestamp: now,
      dateStr,
      notes
    };

    setHistoryRecipes(prev => {
      const updated = [historyItem, ...prev.filter(h => !(h.recipe.id === recipe.id && h.action === action))];
      try {
        localStorage.setItem('bubblo_recipes_history_full', JSON.stringify(updated.slice(0, 100)));
      } catch {}
      return updated;
    });

    const uid = auth.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('bubblo_current_user_id') : null);
    if (uid) {
      try {
        await setDoc(doc(db, "users", uid, "recetas_historial", historyItem.id), {
          ...historyItem,
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("Error saving history item:", e);
      }
    }
  };

  const handleSaveRecipeToFavorites = async (recipe: Recipe) => {
    const isCurrentlyFav = isRecipeFavorited(recipe.id);
    const uid = auth.currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('bubblo_current_user_id') : null);

    if (isCurrentlyFav) {
      const updated = savedFavoriteRecipes.filter(r => r.id !== recipe.id);
      setSavedFavoriteRecipes(updated);
      onToggleFavorite(recipe.id);
      try {
        localStorage.setItem('bubblo_favorite_recipes_full', JSON.stringify(updated));
        if (uid) {
          localStorage.setItem(`bubblo_favorite_recipes_full_${uid}`, JSON.stringify(updated));
          await deleteDoc(doc(db, "users", uid, "recetas_favoritas", recipe.id));
        }
      } catch (err) {
        console.warn("Error removing favorite recipe:", err);
      }
      if (selectedFavDetail?.id === recipe.id) {
        setSelectedFavDetail(null);
      }
      YA('🗑️ Receta quitada de Favoritas');
    } else {
      const recipeToSave: Recipe = {
        ...recipe,
        id: recipe.id || 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
      };
      const updated = [recipeToSave, ...savedFavoriteRecipes.filter(r => r.id !== recipeToSave.id)];
      setSavedFavoriteRecipes(updated);
      onToggleFavorite(recipeToSave.id);
      addRecipeToHistory(recipeToSave, 'guardada');

      try {
        localStorage.setItem('bubblo_favorite_recipes_full', JSON.stringify(updated));
        if (uid) {
          localStorage.setItem(`bubblo_favorite_recipes_full_${uid}`, JSON.stringify(updated));
          await setDoc(doc(db, "users", uid, "recetas_favoritas", recipeToSave.id), {
            ...recipeToSave,
            savedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Error saving favorite recipe:", err);
      }

      bA(window.innerWidth / 2, window.innerHeight / 2);
      YA('❤️ ¡Receta guardada en Favoritas!');
    }
  };

  const handleGenerarRecetas = async () => {
    if (!modalCategory) return;
    const cat = modalCategory;
    setModalCategory(null);
    setIsGeneratingModal(true);
    try {
      const uid = auth.currentUser?.uid;
      let edadEnMeses = babyAgeMonths || 8;
      if (uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          const userData = userDoc.data();
          const fechaNacData = userData?.fechaNacimiento;
          if (fechaNacData) {
            const fechaNac = fechaNacData?.toDate ? fechaNacData.toDate() : new Date(fechaNacData);
            const calculated = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24 * 30));
            if (!isNaN(calculated) && calculated > 0) {
              edadEnMeses = calculated;
            }
          }
        } catch (e) {
          console.warn("Could not fetch user birthdate, using babyAgeMonths:", e);
        }
      }

      const idioma = localStorage.getItem("lang") || (window as any).__APP_LANG__ || "es";
      const targetCount = Math.max(1, Math.min(5, parseInt(modalRecipeCount, 10) || 3));
      const result = generarRecetasIA_qE(pantry, [], 'normal', babyName || 'tu bebé', edadEnMeses, targetCount, idioma as any);
      
      const recetas = result.recipes.map(r => ({
        ...r,
        category: cat.id,
        edadBebeMeses: edadEnMeses,
        aptaParaEdad: `${edadEnMeses} meses`
      }));

      if (uid) {
        for (const recipe of recetas) {
          await addDoc(collection(db, "users", uid, `nutricion_${cat.id}`), {
            ...recipe,
            createdAt: serverTimestamp(),
            uid
          });
        }
      }

      setSelectedCategory(cat.id);
      setCategoryRecipesList(recetas);
      YA('¡Recetas generadas con éxito!');
      bA(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err) {
      console.error("Error in handleGenerarRecetas:", err);
      YA('Error al generar recetas');
    } finally {
      setIsGeneratingModal(false);
    }
  };

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docRef = doc(db, `users/${uid}/despensa/${despensaIdActual}`);
    getDoc(docRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.items)) {
          setLocalPantry(data.items);
        } else {
          setLocalPantry([]);
        }
      } else {
        setLocalPantry([]);
      }
    }).catch(err => console.error("Error loading despensa:", err));
  }, [despensaIdActual]);

  // 1. Manejo de Despensa: input "Ej: manzana, zanahoria, pollo" + + Add que hace split por coma
  const handleAddPantry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pantryInput.trim()) return;

    // Split por coma
    const rawItems = pantryInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (rawItems.length === 0) return;

    const newEntries: PantryItem[] = rawItems.map((name, idx) => ({
      id: 'p_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 5),
      name,
      category: JE(name) as PantryCategory,
      addedAt: new Date().toISOString()
    }));

    const updated = [...localPantry, ...newEntries];
    setLocalPantry(updated);
    setPantryInput('');

    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const docRef = doc(db, `users/${uid}/despensa/${despensaIdActual}`);
        await setDoc(docRef, {
          despensaId: despensaIdActual,
          items: updated,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error saving despensa:", err);
      }
    }

    bA(window.innerWidth / 2, window.innerHeight / 2);
    YA(`🧺 ${newEntries.length} ingrediente${newEntries.length > 1 ? 's añadidos' : ' añadido'}`);
  };

  const handleRemoveLocalItem = async (id: string) => {
    const updated = localPantry.filter(p => p.id !== id);
    setLocalPantry(updated);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const docRef = doc(db, `users/${uid}/despensa/${despensaIdActual}`);
        await setDoc(docRef, {
          despensaId: despensaIdActual,
          items: updated,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error updating despensa:", err);
      }
    }
  };

  const handleUpdateLocalCategory = async (id: string, category: PantryCategory) => {
    const updated = localPantry.map(p => p.id === id ? { ...p, category } : p);
    setLocalPantry(updated);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try {
        const docRef = doc(db, `users/${uid}/despensa/${despensaIdActual}`);
        await setDoc(docRef, {
          despensaId: despensaIdActual,
          items: updated,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Error updating despensa category:", err);
      }
    }
  };

  const handleGenerateRecipesInPanel = () => {
    if (localPantry.length === 0) return;
    setIsGeneratingInPanel(true);
    setTimeout(() => {
      let historyTitles: string[] = [];
      try {
        const raw = localStorage.getItem('bubblo_recipes_history');
        if (raw) historyTitles = JSON.parse(raw);
      } catch {}

      const res = generarRecetasIA_qE(
        localPantry,
        historyTitles,
        'normal',
        babyName,
        babyAgeMonths,
        3,
        lang
      );

      setAiRecipesInPanel(res.recipes);
      try {
        localStorage.setItem('bubblo_ai_recipes_saved', JSON.stringify(res.recipes));
        localStorage.setItem('bubblo_recipes_history', JSON.stringify(res.newHistoryTitles));
      } catch {}

      setIsGeneratingInPanel(false);
      bA(window.innerWidth / 2, window.innerHeight / 2);
      YA(`✨ ${res.recipes.length} recetas caseras generadas`);
    }, 600);
  };

  // Formateador de fecha simple
  const formatPantryDate = (dateStr?: string) => {
    if (!dateStr) return 'Hoy';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang || 'es', { day: 'numeric', month: 'short' });
    } catch {
      return 'Hoy';
    }
  };

  // 2. Manejo de Generación IA IB() qE:
  // modo normal usa despensa yA + H y modo libre, shuffle, evita duplicados AB, crea N recetas con Tf paso inicial, guarda en gA
  const handleGenerateIA = (customMode?: 'normal' | 'free') => {
    const mode = customMode || genMode;
    setIsGenerating(true);
    setTimeout(() => {
      let historyTitles: string[] = [];
      try {
        const raw = localStorage.getItem('bubblo_recipes_history');
        if (raw) historyTitles = JSON.parse(raw);
      } catch {
        // ignore
      }

      const res = generarRecetasIA_qE(
        pantry,
        historyTitles,
        mode,
        babyName,
        babyAgeMonths,
        recipeCount,
        lang
      );

      setGeneratedAiRecipes(res.recipes);
      try {
        localStorage.setItem('bubblo_ai_recipes_saved', JSON.stringify(res.recipes));
        localStorage.setItem('bubblo_recipes_history', JSON.stringify(res.newHistoryTitles));
      } catch {
        // ignore
      }

      setIsGenerating(false);
      setShowAiModal(false);
      bA(window.innerWidth / 2, window.innerHeight / 2);
      YA(`👩🍳 ¡${res.recipes.length} ${t.recipes || 'Recetas'} creadas!`);
    }, 500);
  };

  // Recetas filtradas por la categoría elegida (EXACTAMENTE las 10 de esa categoría)
  const categoryRecipes = useMemo(() => {
    return recipes.filter((r) => r.category === selectedCategory);
  }, [recipes, selectedCategory]);

  // Lista de Favoritos: unifica recetas guardadas completas de Despensa y Tipos + catálogo
  const effectiveFavoriteRecipes = useMemo(() => {
    const map = new Map<string, Recipe>();

    // 1. Recetas completas guardadas en Firestore / LocalStorage
    savedFavoriteRecipes.forEach(r => {
      if (r && r.id) map.set(r.id, r);
    });

    // 2. Si hay IDs en favorites que corresponden al catálogo u otras listas
    const allKnown = [...recipes, ...generatedAiRecipes, ...categoryRecipesList, ...aiRecipesInPanel];
    const favSet = new Set(favorites);

    allKnown.forEach(r => {
      if (r && r.id && favSet.has(r.id) && !map.has(r.id)) {
        map.set(r.id, r);
      }
    });

    return Array.from(map.values());
  }, [savedFavoriteRecipes, recipes, generatedAiRecipes, categoryRecipesList, aiRecipesInPanel, favorites]);

  const favoriteRecipes = effectiveFavoriteRecipes;

  // Reemplazar {baby} por babyName en pasos
  const renderStepsWithBaby = (steps: string[]) => {
    return steps.map((s) => s.replace(/\{baby\}/g, babyName));
  };

  // Copiar receta al portapapeles
  const handleCopyRecipe = (r: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    const ingText = r.ingredients.map((i) => `• ${i.name} (${i.grams ? `${i.grams}g` : i.amount || ''})`).join('\n');
    const stepsText = renderStepsWithBaby(r.steps).map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    const full = `🍽️ ${r.title}\n👶 ${r.ageLabel} | ⏱️ ${(r.prepMin || 5) + (r.cookMin || 5)} min\n\nIngredientes:\n${ingText}\n\nPreparación:\n${stepsText}\n\n💡 Tip: ${r.tips || ''}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(full);
      YA(t.copiedRecipe || '📋 Receta copiada al portapapeles');
    }
  };

  // Generador de recetas dentro de Mi Despensa
  const renderRecipeGeneratorBox = () => (
    <div className={`mt-4 p-4 rounded-[24px] border shadow-sm ${!isDark ? "bg-[#F5F1EB] border-amber-200/70 text-[#111827]" : "bg-[#2A2A40] border-slate-700/60 text-white"}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">👶</span>
        <span className={`font-extrabold text-sm sm:text-base ${!isDark ? 'text-[#111827]' : 'text-white'}`}>
          {t.generateRecipes || 'Generar recetas'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-black text-[10px] font-bold">
          +{babyAgeMonths} {t.months || 'meses'}
        </span>
      </div>
      <p className={`text-[11px] mt-1 ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>
        Recetas adaptadas a la edad de {babyName} (+{babyAgeMonths}m) con corte seguro BLW y valor nutricional.
      </p>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            genMode === 'normal' ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setGenMode('normal')}
        >
          🧺 {t.genModeNormal || 'Despensa'} ({pantry.length})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            genMode === 'free' ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setGenMode('free')}
        >
          ✨ {t.genModeFree || 'Modo Libre'}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className={`text-xs font-bold ${!isDark ? 'text-[#111827]' : 'text-white'}`}>
          {t.recipeCountLabel || 'Cantidad de recetas'}:
        </span>
        <button
          type="button"
          onClick={() => setRecipeCount((e) => Math.max(1, e - 1))}
          className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-black dark:text-white font-black text-sm flex items-center justify-center transition cursor-pointer"
        >
          -
        </button>
        <span className={`w-12 text-center py-1 font-black text-sm rounded-xl border clay ${!isDark ? 'bg-white text-[#111827] border-amber-300' : 'bg-white text-black border-slate-300'}`}>
          {recipeCount}
        </span>
        <button
          type="button"
          onClick={() => setRecipeCount((e) => Math.min(10, e + 1))}
          className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-black dark:text-white font-black text-sm flex items-center justify-center transition cursor-pointer"
        >
          +
        </button>
      </div>
      <button
        id="btn-generar-recetas"
        type="button"
        disabled={isGenerating}
        onClick={() => handleGenerateIA(genMode)}
        className="w-full mt-3 py-3 rounded-[18px] bg-[#FF8A00] hover:bg-[#e67c00] text-white font-extrabold text-sm shadow-md transition clay-press flex items-center justify-center gap-2 cursor-pointer"
      >
        {isGenerating ? (
          <span>Generando recetas...</span>
        ) : (
          <span>✨ {t.generateRecipes || 'Generar recetas'}</span>
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-4">
      {/* ========================================================================= */}
      {/* 3 BOTONES ARRIBA NADA MÁS: Despensa 🧺, Tipos de Recetas 👩🍳, Favoritos ❤️ */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-3xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md max-w-md mx-auto shadow-inner border border-slate-300/40 dark:border-slate-700/50">
        <button
          id="btn-nav-despensa"
          type="button"
          onClick={() => setActiveTab('despensa')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer clay-press ${
            activeTab === 'despensa'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🧺</span>
          <span>{t.pantry || 'Despensa'}</span>
        </button>

        <button
          id="btn-nav-tipos-recetas"
          type="button"
          onClick={() => setActiveTab('tipos')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer clay-press ${
            activeTab === 'tipos'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>👩🍳</span>
          <span>{t.recipeTypes || 'Tipos de Recetas'}</span>
        </button>

        <button
          id="btn-nav-favoritos"
          type="button"
          onClick={() => setActiveTab('favoritos')}
          className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer clay-press ${
            activeTab === 'favoritos'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>❤️</span>
          <span>{t.favorites || 'Favoritos'}</span>
          {favorites.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'favoritos' ? 'bg-white/25 text-white' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}>
              {favorites.length}
            </span>
          )}
        </button>
      </div>

      {babyAgeMonths < 6 ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-300/60 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <span className="text-xl">🍼</span>
          <span>Bebé menor de 6 meses ({babyAgeMonths} meses): Se recomienda lactancia exclusiva (materna o fórmula). Las recetas de sólidos se introducen a partir de los 6 meses.</span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-500/15 backdrop-blur-md border border-emerald-300/40 dark:border-emerald-700/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>✨ Esta receta / catálogo está adaptado para tu bebé de {babyAgeMonths} meses</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DESPENSA 🧺 - INFO INTERNA */}
      {/* ========================================================================= */}
      {activeTab === 'despensa' && (
        <div className="space-y-6">
          {/* Header & Input with + Add split por coma */}
          <div className={`p-5 rounded-3xl shadow-sm border space-y-3 ${
            isDark ? 'bg-[#2A2A40] border-slate-700/60 text-white' : 'bg-[#F5F1EB] border-amber-200/60 text-[#111827]'
          }`}>
            <div>
              <h3 className="text-base font-extrabold font-heading flex items-center gap-2 text-[#111827] dark:text-white">
                <span>🧺</span>
                <span>Mi Despensa Infantil</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Escribe ingredientes separados por coma. La app los clasificará automáticamente con JE().
              </p>
            </div>

            <form onSubmit={handleAddPantry} className="flex gap-2">
              <input
                id="input-pantry-add"
                type="text"
                value={pantryInput}
                onChange={(e) => setPantryInput(e.target.value)}
                placeholder="Ej: manzana, zanahoria, pollo"
                className={`flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium outline-none border transition ${
                  isDark
                    ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500 focus:border-amber-400'
                    : 'bg-[#FAF8F5] border-amber-200 text-[#111827] placeholder-slate-500 focus:border-amber-500'
                }`}
              />
              <button
                id="btn-pantry-add"
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-500/25 clay-press cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add</span>
              </button>
            </form>
          </div>

          {/* Grid por categoría con icono 🍎🥕🍗 */}
          {(() => {
            const categoriasConProductos = PANTRY_CATEGORIES.filter(cat => localPantry.filter(i => i.category === cat.id).length > 0);
            if (categoriasConProductos.length === 0) {
              return (
                <div className="text-center py-10 px-4 rounded-3xl border border-dashed border-amber-300/60 dark:border-slate-700 my-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    Tu despensa está vacía - agrega manzana, zanahoria, pollo arriba para empezar
                  </p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoriasConProductos.map((cat) => {
                  const items = localPantry.filter((p) => p.category === cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-3xl shadow-sm border space-y-3 ${
                        isDark ? 'bg-[#2A2A40] border-slate-700/60 text-white' : 'bg-[#F5F1EB] border-amber-200/60 text-[#111827]'
                      }`}
                    >
                      <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-700' : 'border-amber-200/60'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl select-none">{cat.icon}</span>
                          <span className="font-extrabold text-sm font-heading text-[#111827] dark:text-white">
                            {getCategoryLabel(cat.id)}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-amber-100 text-[#111827]'
                        }`}>
                          {items.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-2xl ${
                              isDark ? 'bg-slate-800/80 text-white border-slate-700/60' : 'bg-[#FAF8F5] text-[#111827] border-amber-200/50'
                            } border shadow-xs flex items-center justify-between gap-2`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs truncate text-[#111827] dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>📅 {formatPantryDate(item.addedAt)}</span>
                              </div>
                            </div>

                            {/* Select categoría para reclasificar */}
                            <select
                              value={item.category}
                              onChange={(e) => {
                                handleUpdateLocalCategory(item.id, e.target.value as PantryCategory);
                              }}
                              className={`text-[10px] font-semibold px-2 py-1 rounded-xl outline-none border cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                                  : 'bg-[#F5F1EB] border-amber-200 text-[#111827]'
                              }`}
                            >
                              {PANTRY_CATEGORIES.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.icon} {c.label}
                                </option>
                              ))}
                            </select>

                            {/* ✕ para borrar */}
                            <button
                              type="button"
                              onClick={() => handleRemoveLocalItem(item.id)}
                              className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              title="Eliminar ingrediente"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 3. GENERAR RECETAS AHÍ MISMO, EN EL MISMO PANEL */}
          <div id="recetas-generadas" className={`p-5 rounded-3xl shadow-sm border space-y-4 ${
            isDark ? 'bg-[#2A2A40] border-slate-700/60 text-white' : 'bg-[#F5F1EB] border-amber-200/60 text-[#111827]'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-base font-heading flex items-center gap-2">
                  <span>👩‍🍳</span>
                  <span>Generar Recetas con tu Despensa Actual</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Crea recetas personalizadas de inmediato con los ingredientes registrados hoy.
                </p>
              </div>
              <button
                type="button"
                disabled={localPantry.length === 0 || isGeneratingInPanel}
                onClick={handleGenerateRecipesInPanel}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 clay-press cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingInPanel ? 'Generando...' : 'Generar Recetas'}</span>
              </button>
            </div>

            {localPantry.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                Agrega al menos un ingrediente arriba para poder generar recetas.
              </p>
            )}

            {aiRecipesInPanel.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {aiRecipesInPanel.map((recipe) => {
                  const isFav = isRecipeFavorited(recipe.id);
                  return (
                    <div
                      key={recipe.id}
                      className={`p-4 rounded-3xl border shadow-sm space-y-2 ${
                        isDark ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white border-amber-200 text-slate-800'
                      }`}
                    >
                      <div className="p-2.5 rounded-2xl bg-emerald-500/15 backdrop-blur-md border border-emerald-300/40 dark:border-emerald-700/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Esta receta está adaptada para tu bebé de {recipe.edadBebeMeses || babyAgeMonths} meses</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">{recipe.emoji || '🍽️'}</span>
                          <h5 className="font-extrabold text-sm">{recipe.title}</h5>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRecipeToFavorites(recipe);
                          }}
                          className={`p-2 rounded-full transition cursor-pointer shrink-0 clay-press ${
                            isFav ? 'text-rose-500 bg-rose-500/15' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'
                          }`}
                          title={isFav ? 'Quitar de Favoritas' : 'Guardar en Favoritas'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>
                      <p className="text-xs opacity-80 line-clamp-2">{recipe.description}</p>
                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="text-[11px] opacity-70">⏱️ {recipe.prepTime || '15 min'}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleSaveRecipeToFavorites(recipe);
                              setActiveTab('favoritos');
                              setSelectedFavDetail(recipe);
                            }}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                            <span>{isFav ? 'Ver en Favoritas' : 'Guardar en Favoritas'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveRecipe(recipe)}
                            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>Ver receta</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIPOS DE RECETAS 👩🍳 - 10 CATEGORÍAS NADA MÁS */}
      {/* ========================================================================= */}
      {activeTab === 'tipos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-black font-heading flex items-center gap-2">
                <span>👩🍳</span>
                <span>Catálogo Pediátrico por Tipos</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona una de las 10 categorías para generar recetas personalizadas con IA para {babyName}.
              </p>
            </div>
          </div>

          {/* 10 Categorías */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {RECIPE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setModalCategory(cat)}
                  className={`p-4 rounded-3xl border text-center transition-all cursor-pointer clay-press flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? isDark
                        ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/30 scale-[1.02]'
                        : 'bg-amber-100 border-amber-400 text-amber-900 shadow-md ring-2 ring-amber-400/30 scale-[1.02]'
                      : isDark
                      ? 'bg-slate-900/80 border-slate-800 text-slate-100 hover:border-amber-400 hover:bg-slate-800'
                      : 'bg-white/90 border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
                >
                  <span className="text-3xl select-none">{cat.emoji}</span>
                  <span className="text-xs font-bold font-heading line-clamp-1">{t.recipeCats?.[cat.id] || cat.label}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10">
                    Toca para generar ✨
                  </span>
                </button>
              );
            })}
          </div>

          {/* Recetas generadas de la categoría seleccionada debajo del grid */}
          {isGeneratingModal && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold animate-pulse py-2">
              Generando recetas para tu bebé de {babyAgeMonths} meses...
            </p>
          )}

          {selectedCategory && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black font-heading text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{RECIPE_CATEGORIES.find(c => c.id === selectedCategory)?.emoji}</span>
                  <span>Recetas de {RECIPE_CATEGORIES.find(c => c.id === selectedCategory)?.label} ({categoryRecipesList.length})</span>
                </h4>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  Adaptadas para {babyAgeMonths} meses
                </span>
              </div>

              {categoryRecipesList.length === 0 ? (
                <div className={`p-8 rounded-3xl ${cardBase} text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No hay recetas en esta categoría todavía. Toca el icono de la categoría arriba para abrir el asistente y generar recetas.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryRecipesList.map((recipe) => {
                    const isFav = isRecipeFavorited(recipe.id);
                    return (
                      <div
                        key={recipe.id}
                        onClick={() => setActiveRecipe(recipe)}
                        className={`p-4 rounded-2xl ${cardBase} shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between gap-3 transition hover:shadow-md cursor-pointer hover:border-amber-300 dark:hover:border-amber-600`}
                      >
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-2xl bg-emerald-500/15 backdrop-blur-md border border-emerald-300/40 dark:border-emerald-700/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>✨ Adaptada para tu bebé de {recipe.edadBebeMeses || babyAgeMonths} meses</span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl select-none">{recipe.emoji || '🥣'}</span>
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                                {recipe.title}
                              </h5>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRecipeToFavorites(recipe);
                              }}
                              className={`p-2 rounded-full transition cursor-pointer shrink-0 clay-press ${
                                isFav ? 'text-rose-500 bg-rose-500/15' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'
                              }`}
                              title={isFav ? 'Quitar de Favoritas' : 'Guardar en Favoritas'}
                            >
                              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                            </button>
                          </div>

                          <p className="text-xs opacity-80 line-clamp-2">{recipe.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Prep: {recipe.prepMin || 15}m</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRecipeToFavorites(recipe);
                                setActiveTab('favoritos');
                                setSelectedFavDetail(recipe);
                              }}
                              className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline cursor-pointer text-xs"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                              <span>{isFav ? 'En Favoritas' : 'Guardar'}</span>
                            </button>
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 text-xs">
                              Ver receta <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FAVORITOS ❤️ & MEMORIA HISTORIAL 📜 */}
      {/* ========================================================================= */}
      {activeTab === 'favoritos' && (
        <div className="space-y-4">
          {/* Sub-navegación: Recetas Favoritas vs Memoria Historial */}
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  setFavSubTab('favoritas');
                  setSelectedFavDetail(null);
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer clay-press ${
                  favSubTab === 'favoritas'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>❤️</span>
                <span>Recetas Favoritas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  favSubTab === 'favoritas' ? 'bg-white/25 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {effectiveFavoriteRecipes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFavSubTab('historial');
                  setSelectedFavDetail(null);
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer clay-press ${
                  favSubTab === 'historial'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Memoria Historial</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  favSubTab === 'historial' ? 'bg-white/25 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {historyRecipes.length}
                </span>
              </button>
            </div>
          </div>

          {/* Si se está viendo el detalle de una receta desde Favoritas o Historial, se abre EN ESTE MISMO PANEL */}
          {selectedFavDetail ? (
            <div className={`p-5 sm:p-6 rounded-3xl ${cardBase} border border-amber-200/60 dark:border-slate-700 shadow-md space-y-4`}>
              {/* Barra superior de navegación */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedFavDetail(null)}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer clay-press"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a {favSubTab === 'historial' ? 'Memoria Historial' : 'Favoritas'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleCopyRecipe(selectedFavDetail, e)}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Copiar receta"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveRecipeToFavorites(selectedFavDetail)}
                    className={`p-2.5 rounded-2xl transition cursor-pointer ${
                      isRecipeFavorited(selectedFavDetail.id)
                        ? 'text-rose-500 bg-rose-500/15'
                        : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-rose-500'
                    }`}
                    title={isRecipeFavorited(selectedFavDetail.id) ? 'Quitar de Favoritas' : 'Guardar en Favoritas'}
                  >
                    <Heart className={`w-4 h-4 ${isRecipeFavorited(selectedFavDetail.id) ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Encabezado de la Receta */}
              <div className="flex items-start gap-3">
                <span className="text-4xl select-none shrink-0">{selectedFavDetail.emoji || '🍽️'}</span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {selectedFavDetail.ageLabel || `+${babyAgeMonths} meses`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      ⏱️ {(selectedFavDetail.prepMin || 5) + (selectedFavDetail.cookMin || 5)} min
                    </span>
                    {selectedFavDetail.difficulty && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        {selectedFavDetail.difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white">
                    {selectedFavDetail.title}
                  </h3>
                  {selectedFavDetail.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {selectedFavDetail.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Botón de acción: Marcar como preparada (Guarda en Memoria Historial) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    addRecipeToHistory(selectedFavDetail, 'preparada');
                    bA(window.innerWidth / 2, window.innerHeight / 2);
                    YA('👨‍🍳 ¡Receta registrada como preparada en tu Memoria Historial!');
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 clay-press cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar como Preparada hoy</span>
                </button>
                {isRecipeFavorited(selectedFavDetail.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveRecipeToFavorites(selectedFavDetail);
                      setSelectedFavDetail(null);
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 clay-press cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar de Favoritas</span>
                  </button>
                )}
              </div>

              {/* Ingredientes Necesarios */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>🥣</span>
                  <span>Ingredientes Necesarios</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFavDetail.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">• {ing.name}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {ing.grams ? `${ing.grams}g` : ing.amount || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paso a paso */}
              <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>📝</span>
                  <span>Paso a Paso para {babyName}</span>
                </h4>
                <div className="space-y-2">
                  {renderStepsWithBaby(selectedFavDetail.steps).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <p className="pt-0.5 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consejos Pediátricos & Textura BLW */}
              {(selectedFavDetail.tips || selectedFavDetail.pediatricTip || selectedFavDetail.blwCut || selectedFavDetail.nutrition) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Consejos Pediátricos & Textura</span>
                  </div>
                  {selectedFavDetail.blwCut && (
                    <p className="text-amber-800 dark:text-amber-300">
                      <strong>Corte Seguro BLW:</strong> {selectedFavDetail.blwCut}
                    </p>
                  )}
                  {selectedFavDetail.tips && (
                    <p className="text-amber-800 dark:text-amber-300">{selectedFavDetail.tips}</p>
                  )}
                  {selectedFavDetail.nutrition && (
                    <p className="text-slate-600 dark:text-slate-400 italic pt-1 border-t border-amber-200/40 dark:border-amber-900/40">
                      Nutrición: {selectedFavDetail.nutrition}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : favSubTab === 'favoritas' ? (
            /* Lista de Favoritas */
            effectiveFavoriteRecipes.length === 0 ? (
              <div className={`p-10 rounded-3xl ${cardBase} text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700`}>
                <span className="text-4xl block">💔</span>
                <h4 className="font-bold text-base text-slate-700 dark:text-slate-200">
                  No tienes recetas favoritas aún
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Guarda recetas desde "Despensa" o "Tipos de Recetas" tocando el corazón ❤️ o "Guardar en Favoritas".
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('tipos')}
                  className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/25 clay-press cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Explorar Recetas 👩🍳</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {effectiveFavoriteRecipes.map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => setSelectedFavDetail(fav)}
                    className={`p-4 rounded-2xl ${cardBase} shadow-sm border border-slate-200/70 dark:border-slate-800 flex items-start justify-between gap-3 transition hover:shadow-md cursor-pointer hover:border-rose-300`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-3xl select-none shrink-0">{fav.emoji || '🥣'}</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300">
                          {fav.ageLabel || `+${babyAgeMonths}m`}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate mt-1">
                          {fav.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          ⏱️ {(fav.prepMin || 5) + (fav.cookMin || 5)} min • {fav.ingredients?.length || 0} ingredientes
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                          Ver detalles en este panel →
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveRecipeToFavorites(fav);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer shrink-0 clay-press"
                      title="Quitar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Memoria Historial */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro de recetas preparadas y guardadas para {babyName}.
                </p>
                {historyRecipes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Deseas limpiar la memoria historial?')) {
                        setHistoryRecipes([]);
                        localStorage.removeItem('bubblo_recipes_history_full');
                        YA('Memoria historial limpiada');
                      }
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    Limpiar historial
                  </button>
                )}
              </div>

              {historyRecipes.length === 0 ? (
                <div className={`p-10 rounded-3xl ${cardBase} text-center space-y-3 border border-dashed border-slate-300 dark:border-slate-700`}>
                  <span className="text-4xl block">📜</span>
                  <h4 className="font-bold text-base text-slate-700 dark:text-slate-200">
                    Aún no tienes historial de recetas
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Cuando marques una receta como "Preparada" o la guardes en Favoritas, se registrará en esta memoria histórica para consultarla cuando quieras.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyRecipes.map((item) => {
                    const isFav = isRecipeFavorited(item.recipe.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedFavDetail(item.recipe)}
                        className={`p-3.5 rounded-2xl ${cardBase} border border-slate-200/70 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition cursor-pointer`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-3xl select-none shrink-0">{item.recipe.emoji || '🍽️'}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                item.action === 'preparada'
                                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              }`}>
                                {item.action === 'preparada' ? '👨‍🍳 Preparada' : '❤️ Guardada'}
                              </span>
                              <span className="text-[11px] text-slate-400">{item.dateStr}</span>
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate mt-0.5">
                              {item.recipe.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {item.recipe.ingredients?.length || 0} ingredientes • {(item.recipe.prepMin || 5) + (item.recipe.cookMin || 5)} min
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveRecipeToFavorites(item.recipe);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                              isFav ? 'text-rose-500 bg-rose-500/15' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                            <span>{isFav ? 'Favorita' : 'Guardar'}</span>
                          </button>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            Ver detalles <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE RECETA: ingredients[{name,grams}], steps[] con {baby}, etc */}
      {/* ========================================================================= */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => setActiveRecipe(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[20px] backdrop-saturate-[180%]"
          />

          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl transition-all duration-200 z-10 border ${
              isDark
                ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
                : 'bg-white/95 border-amber-200/80 text-slate-800 shadow-[0_20px_60px_rgba(245,158,11,0.25)]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">{activeRecipe.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {activeRecipe.ageLabel}
                    </span>
                    {activeRecipe.difficulty && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        {activeRecipe.difficulty}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">
                      ⏱️ {(activeRecipe.prepMin || 5) + (activeRecipe.cookMin || 5)} min
                    </span>
                  </div>
                  <h3 className="text-base font-black font-heading mt-1">
                    {activeRecipe.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyRecipe(activeRecipe, e)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={t.copyRecipe || 'Copiar receta'}
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleFavorite(activeRecipe.id);
                    bA(window.innerWidth / 2, window.innerHeight / 2);
                  }}
                  className={`p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer ${
                    favorites.includes(activeRecipe.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                  }`}
                  title={t.favorites || 'Favorito'}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(activeRecipe.id) ? 'fill-rose-500' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRecipe(null)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-500/15 backdrop-blur-md border border-emerald-300/40 dark:border-emerald-700/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Esta receta está adaptada para tu bebé de {activeRecipe.edadBebeMeses || babyAgeMonths} meses</span>
              </div>
              {/* BLW Safe Cut Advice */}
              {activeRecipe.blwCut && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[11px]">
                    <span>🥕</span>
                    <span>{t.blwCutSafe || 'Corte Seguro BLW'} (+{activeRecipe.minAgeMonths || babyAgeMonths} {t.months || 'meses'}):</span>
                  </div>
                  <p className="leading-relaxed font-medium text-xs">
                    {activeRecipe.blwCut}
                  </p>
                </div>
              )}

              {/* Ingredients con name y grams */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {t.ingredientsTitle || 'Ingredientes'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeRecipe.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="text-xs flex items-center justify-between p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">{ing.name}</span>
                      <span className="font-black text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                        {ing.grams ? `${ing.grams}g` : ing.amount || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps con {baby} reemplazado por babyName */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.prepStepTitle || 'Preparación paso a paso'} {babyName ? `(${babyName})` : ''}
                </h4>
                <div className="space-y-2">
                  {renderStepsWithBaby(activeRecipe.steps).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 flex-1 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition, Storage, Tips */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                {activeRecipe.nutrition && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold block mb-0.5">🥗 {t.nutritionTitle || 'Aporte Nutricional'}:</span>
                    <span>{activeRecipe.nutrition.replace(/\{baby\}/g, babyName)}</span>
                  </div>
                )}
                {activeRecipe.storage && (
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300">
                    <span className="font-bold block mb-0.5">❄️ {t.storageTitle || 'Conservación'}:</span>
                    <span>{activeRecipe.storage}</span>
                  </div>
                )}
                {activeRecipe.tips && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300">
                    <span className="font-bold block mb-0.5">💡 {t.pediatricTipTitle || 'Consejo Pediátrico'}:</span>
                    <span>{activeRecipe.tips.replace(/\{baby\}/g, babyName)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL GENERADOR IA: IB() qE con modo normal usa despensa yA + H y modo libre */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => !isGenerating && setShowAiModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[20px] backdrop-saturate-[180%]"
          />

          <div
            className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl transition-all duration-200 z-10 border ${
              isDark
                ? 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
                : 'bg-white/95 border-amber-200/80 text-slate-800 shadow-[0_20px_60px_rgba(245,158,11,0.25)]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👩🍳</span>
                <div>
                  <h3 className="text-base font-black font-heading">
                    {t.generateRecipes || 'Generador de Recetas IA'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recetas exclusivas para {babyName} (+{babyAgeMonths} {t.months || 'meses'})
                  </p>
                </div>
              </div>
              {!isGenerating && (
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Selector de modo: Modo normal vs Modo libre */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Modo de Generación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenMode('normal')}
                    className={`p-3 rounded-2xl border text-left transition clay-press cursor-pointer ${
                      genMode === 'normal'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/30'
                        : isDark
                        ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>🧺</span>
                      <span>{t.genModeNormal || 'Despensa'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Prioriza ingredientes de tu despensa ({pantry.length} disp.)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenMode('free')}
                    className={`p-3 rounded-2xl border text-left transition clay-press cursor-pointer ${
                      genMode === 'free'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-400/30'
                        : isDark
                        ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>✨</span>
                      <span>{t.genModeFree || 'Modo Libre'}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Explora combinaciones nutritivas y variadas
                    </p>
                  </button>
                </div>
              </div>

              {/* Selector de cantidad N_recetas_input */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t.recipeCountLabel || 'Cantidad de recetas'}:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRecipeCount((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-amber-400 hover:text-slate-900 font-black text-xs flex items-center justify-center transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      id="N_recetas_input_modal"
                      type="number"
                      min="1"
                      max="10"
                      value={recipeCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setRecipeCount(Math.max(1, Math.min(10, val)));
                      }}
                      className={`w-10 h-7 text-center rounded-lg border text-xs font-black outline-none ${
                        isDark ? 'bg-white border-slate-300 text-black' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setRecipeCount((prev) => Math.min(10, prev + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-amber-400 hover:text-slate-900 font-black text-xs flex items-center justify-center transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={recipeCount}
                  onChange={(e) => setRecipeCount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Resumen info */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Especificaciones de nutrición:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pl-5">
                  • {recipeCount} recetas adaptadas a +{babyAgeMonths} {t.months || 'meses'}<br />
                  • Corte seguro BLW según edad de {babyName}<br />
                  • Aporte nutricional y conservación garantizada
                </p>
              </div>

              {/* Botón de acción */}
              <button
                id="btn-confirm-generate-ai"
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerateIA()}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg transition clay-press flex items-center justify-center gap-2 cursor-pointer ${
                  isGenerating
                    ? 'bg-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/30'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Creando recetas...' : `👩🍳 ${t.generateRecipes || 'Generar recetas'} (${recipeCount})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoria Estilo Glass */}
      {modalCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            onClick={() => !isGeneratingModal && setModalCategory(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[20px] backdrop-saturate-[180%]"
          />

          <div
            style={{
              background: isDark ? 'rgba(30,30,35,0.90)' : 'rgba(245,238,225,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark ? '1px solid rgba(255,184,106,0.2)' : '1px solid rgba(255,184,106,0.3)'
            }}
            className="relative w-full max-w-lg rounded-3xl p-6 shadow-2xl transition-all duration-200 z-10 max-h-[90vh] overflow-y-auto text-black dark:text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="text-3xl select-none">{modalCategory.emoji}</span>
                <div>
                  <h3 className="text-base font-black font-heading text-black dark:text-slate-100">
                    {modalCategory.label}
                  </h3>
                  <p className="text-xs text-black dark:text-slate-100 font-bold">
                    Recetas para tu bebé de {babyAgeMonths} meses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCategory(null)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/15 backdrop-blur-md border border-amber-300/40 dark:border-amber-700/50 flex items-center gap-2 text-black dark:text-slate-100 text-xs font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Recetas para tu bebé de {babyAgeMonths} meses (Categoría: {modalCategory.label})</span>
              </div>

              {/* Number input - Free field for 1 to 5 */}
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-recipe-count-input" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                    ¿Cuántas recetas quieres? 1 a 5
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Libre: escribe del 1 al 5
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="modal-recipe-count-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[1-5]*"
                    maxLength={1}
                    value={modalRecipeCount}
                    placeholder="1 a 5"
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow clearing completely or typing any digit
                      if (val === '' || /^[1-5]$/.test(val)) {
                        setModalRecipeCount(val);
                      }
                    }}
                    onBlur={() => {
                      // If left blank on blur, default back to 3
                      if (!modalRecipeCount || modalRecipeCount.trim() === '') {
                        setModalRecipeCount('3');
                      }
                    }}
                    className={`flex-1 p-2.5 rounded-xl border text-sm font-black outline-none transition-all focus:ring-2 focus:ring-orange-400 text-center ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />

                  {/* Botones directos del 1 al 5 para comodidad */}
                  <div className="flex items-center gap-1">
                    {['1', '2', '3', '4', '5'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setModalRecipeCount(num)}
                        className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          modalRecipeCount === num
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105'
                            : isDark
                            ? 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Campo libre: puedes borrar y teclear el número del 1 al 5 que desees, o tocar el botón directo.
                </p>
              </div>

              <button
                type="button"
                disabled={isGeneratingModal}
                onClick={handleGenerarRecetas}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30 clay-press flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingModal ? 'animate-spin' : ''}`} />
                <span>{isGeneratingModal ? `Generando recetas para tu bebé de ${babyAgeMonths} meses...` : 'Generar recetas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
