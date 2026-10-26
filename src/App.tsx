/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BabyUser, BabyEvent, GrowthRecord, VaccineItem, PantryItem, LanguageCode, NavTab, EventType, PantryCategory, BreastSide } from './types';
import { VACUNAS_DATA } from './vacunasData';
import { RECIPES_DATA } from './recipesData';
import { Tf_BASE_PANTRY, JE, quitarBanners, corregirCamposBlancos, YA, getLocalDateString, isEventFromToday } from './utils';
import { rE } from './i18n';
import { Navbar } from './components/Navbar';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { HomeTab } from './components/HomeTab';
import { DailyTab } from './components/DailyTab';
import { StatsTab } from './components/StatsTab';
import { GrowthTab } from './components/GrowthTab';
import { VaccinesTab } from './components/VaccinesTab';
import { NutritionTab } from './components/NutritionTab';
import { RegistrationModal } from './components/RegistrationModal';
import { EditBabyModal } from './components/EditBabyModal';
import { BackupModal } from './components/BackupModal';
import { AvatarCreatorModal, DEFAULT_AVATAR_ELABORADO, AvatarElaboradoConfig } from './components/AvatarCreatorModal';
import { AdminDashboardTotal } from './components/AdminDashboardTotal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UpdateBanner } from './components/UpdateBanner';
import { ComunidadLayout } from './comunidad/ComunidadLayout';
import { getLocalizedCatalogRecipe } from './recipeTranslations';
import { db, auth } from './firebase';
import { doc, onSnapshot, collection, addDoc, deleteDoc, query, limit, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { actualizarBadgeUniversal, reprogramarAvisoTrasEvento, ReminderType } from './services/recordatoriosService';
import { QuickPublicRegistration } from './components/QuickPublicRegistration';

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('bubblo_lang');
    return (saved as LanguageCode) || 'es';
  });

  // Listen to languageChanged custom event
  useEffect(() => {
    const handleLanguageChanged = () => {
      const saved = localStorage.getItem('bubblo_lang') as LanguageCode;
      if (saved && saved !== lang) {
        setLang(saved);
      }
    };
    window.addEventListener('languageChanged', handleLanguageChanged);
    return () => window.removeEventListener('languageChanged', handleLanguageChanged);
  }, [lang]);

  const handleSelectLang = useCallback((newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem('bubblo_lang', newLang);
    document.documentElement.lang = newLang;
    window.dispatchEvent(new Event('languageChanged'));
  }, []);

  // Admin & Second App State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('bubblo_admin') === '1' || window.location.hash === '#admin';
  });
  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    if (localStorage.getItem('bubblo_admin') === '1' || window.location.hash === '#admin') return 'admin';
    if (window.location.pathname.startsWith('/comunidad') || window.location.hash.startsWith('#/comunidad') || window.location.hash === '#comunidad') return 'comunidad';
    return 'inicio';
  });

  // Comunidad Mamas Sub-App Route State
  const [isComunidad, setIsComunidad] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/comunidad') || 
           window.location.hash.startsWith('#/comunidad') || 
           window.location.hash === '#comunidad';
  });
  const [comunidadSubPath, setComunidadSubPath] = useState<string>(() => {
    if (window.location.pathname.startsWith('/comunidad')) {
      return window.location.pathname.replace('/comunidad', '').replace(/^\//, '');
    }
    if (window.location.hash.startsWith('#/comunidad')) {
      return window.location.hash.replace('#/comunidad', '').replace(/^\//, '');
    }
    return '';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdmin(true);
        setCurrentScreen('admin');
      }
      const isCom = window.location.pathname.startsWith('/comunidad') || 
                    window.location.hash.startsWith('#/comunidad') || 
                    window.location.hash === '#comunidad';
      setIsComunidad(isCom);
      if (isCom) {
        setCurrentScreen('comunidad');
        const sub = window.location.pathname.startsWith('/comunidad')
          ? window.location.pathname.replace('/comunidad', '').replace(/^\//, '')
          : window.location.hash.replace('#/comunidad', '').replace('#comunidad', '').replace(/^\//, '');
        setComunidadSubPath(sub);
      } else if (currentScreen === 'comunidad') {
        setCurrentScreen('inicio');
      }
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentScreen]);

  const handleEnterAdmin = useCallback(() => {
    setIsAdmin(true);
    setCurrentScreen('admin');
    localStorage.setItem('bubblo_admin', '1');
    window.location.hash = '#admin';
  }, []);

  const handleExitAdmin = useCallback(() => {
    setIsAdmin(false);
    setCurrentScreen('inicio');
    localStorage.removeItem('bubblo_admin');
    window.location.hash = '';
  }, []);

  const handleNavigateToCommunity = useCallback((subPath: string = '') => {
    setIsComunidad(true);
    setCurrentScreen('comunidad');
    setComunidadSubPath(subPath);
    const targetUrl = subPath ? `/comunidad/${subPath}` : '/comunidad';
    window.history.pushState(null, '', targetUrl);
  }, []);

  const handleExitCommunity = useCallback(() => {
    setIsComunidad(false);
    setCurrentScreen('inicio');
    setComunidadSubPath('');
    window.history.pushState(null, '', '/');
  }, []);

  // Auth loading state
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // 2. Users state (strictly isolated to current user)
  const [currentUserState, setCurrentUserState] = useState<BabyUser | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bubblo_currentUser") || "null");
      if (saved?.email || saved?.id) return saved;
    } catch {}
    return null;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bubblo_currentUser") || "null");
      if (saved?.id) return saved.id;
      if (saved?.email) return saved.email;
    } catch {}
    return null;
  });

  // Current active user
  const currentUser = currentUserState;
  const users = currentUser ? [currentUser] : [];

  // 3. User Data States (Inicialización instantánea con caché local para 0ms de espera al reabrir)
  const [events, setEvents] = useState<BabyEvent[]>(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("bubblo_currentUser") || "null");
      const uid = savedUser?.id || savedUser?.email || localStorage.getItem('bubblo_current_user') || 'anonymous';
      const saved = localStorage.getItem(`bubblo_events_${uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [growth, setGrowth] = useState<GrowthRecord[]>(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("bubblo_currentUser") || "null");
      const uid = savedUser?.id || savedUser?.email || localStorage.getItem('bubblo_current_user') || 'anonymous';
      const saved = localStorage.getItem(`bubblo_growth_${uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [vaccines, setVaccines] = useState<VaccineItem[]>(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("bubblo_currentUser") || "null");
      const uid = savedUser?.id || savedUser?.email || localStorage.getItem('bubblo_current_user') || 'anonymous';
      const saved = localStorage.getItem(`bubblo_vaccines_${uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [babyInfo, setBabyInfo] = useState<{ name: string; birthDate: string; height: number; weight: number }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bubblo_baby") || "null");
      if (saved && saved.name) return saved;
    } catch {}
    return {
      name: 'Mathews',
      birthDate: '2026-02-15',
      height: 65,
      weight: 7.2
    };
  });

  // 2.0 Auth State persistence listener (onAuthStateChanged)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setCurrentUserId(uid);
        localStorage.setItem('bubblo_current_user', uid);
      } else {
        const saved = localStorage.getItem("bubblo_currentUser");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.id) {
              setCurrentUserId(parsed.id);
              setCurrentUserState(parsed);
            }
          } catch (e) {}
        }
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 2.0.1 Escuchar el documento users/{currentUserId} en Firestore en tiempo real para cualquier usuario
  useEffect(() => {
    if (!currentUserId) return;

    let unsubUserDoc: (() => void) | null = null;
    try {
      unsubUserDoc = onSnapshot(doc(db, "users", currentUserId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const babyObj = {
            name: data.babyName || 'Mathews',
            birthDate: data.fechaNacimiento || data.birthDate || '2026-02-15',
            height: Number(data.talla) || Number(data.height) || 65,
            weight: Number(data.peso) || Number(data.weight) || 7.2,
            photo: data.photo || undefined
          };
          setBabyInfo(babyObj);
          const userObj: BabyUser = {
            id: currentUserId,
            email: data.email || (currentUserState?.email || ''),
            babyName: babyObj.name,
            birthDate: babyObj.birthDate,
            gender: data.genero || 'neutral',
            weight: babyObj.weight,
            height: babyObj.height,
            photo: babyObj.photo,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now()
          };
          setCurrentUserState(userObj);
          try {
            localStorage.setItem('bubblo_currentUser', JSON.stringify(userObj));
            localStorage.setItem('bubblo_baby', JSON.stringify(babyObj));
          } catch (e) {}
        }
      }, (err) => console.warn("Firestore user sync warning:", err));
    } catch (e) {
      console.warn("Could not listen to user doc:", e);
    }

    return () => {
      if (unsubUserDoc) unsubUserDoc();
    };
  }, [currentUserId]);

  // 2.1 Sincronización en tiempo real de eventos y crecimiento desde Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUserId;
    if (!uid) return;

    // Escuchar subcolecciones de eventos: panal, biberon, lactancia, sueno, diario
    const subCollections = ['panal', 'biberon', 'lactancia', 'sueno', 'diario'];
    const unsubs: (() => void)[] = [];
    const eventBucket: Record<string, BabyEvent[]> = {};

    // Pre-poblar con caché para no vaciar la UI mientras responden las subcolecciones individuales
    try {
      const cached = JSON.parse(localStorage.getItem(`bubblo_events_${uid}`) || '[]');
      if (Array.isArray(cached)) {
        cached.forEach((e: BabyEvent) => {
          const colKey = String(e.type);
          if (!eventBucket[colKey]) eventBucket[colKey] = [];
          eventBucket[colKey].push(e);
        });
      }
    } catch {}

    subCollections.forEach((col) => {
      try {
        const colRef = collection(db, "users", uid, col);
        const q = query(colRef, limit(60));
        const unsub = onSnapshot(q, (snap) => {
          const list: BabyEvent[] = snap.docs.map((d) => {
            const data = d.data();
            const timestamp = data.createdAt?.toDate ? data.createdAt.toDate().getTime()
              : (data.fecha?.toDate ? data.fecha.toDate().getTime()
              : (data.hora?.toDate ? data.hora.toDate().getTime()
              : (data.timestamp || (data.fechaISO ? new Date(data.fechaISO).getTime() : Date.now()))));

            return {
              id: d.id,
              type: (data.type || col) as EventType,
              date: data.date || (data.fechaISO ? data.fechaISO.split('T')[0] : getLocalDateString(new Date(timestamp))),
              time: data.time || (data.hora && typeof data.hora === 'string' ? data.hora : new Date(timestamp).toTimeString().slice(0, 5)),
              duration: data.duration,
              side: data.side,
              amount: data.amount !== undefined ? Number(data.amount) : (data.cantidad !== undefined ? Number(data.cantidad) : undefined),
              subType: data.subType || (data.tipo && !['panal', 'pañal', 'biberon', 'biberón'].includes(data.tipo.toLowerCase()) ? data.tipo : (col === 'panal' ? 'Mojado' : undefined)),
              notes: data.notes || (data.tipo && !['panal', 'pañal', 'biberon', 'biberón'].includes(data.tipo.toLowerCase()) && data.tipo !== col ? data.tipo : '') || data.name || '',
              temp: data.temp || data.temperatura,
              timestamp
            } as BabyEvent;
          });

          eventBucket[col] = list;
          const merged = Object.values(eventBucket).flat().sort((a, b) => b.timestamp - a.timestamp);
          setEvents(merged);
          try {
            localStorage.setItem(`bubblo_events_${uid}`, JSON.stringify(merged));
          } catch (e) {}
        }, (err) => {
          console.warn(`Error onSnapshot subcollection ${col}:`, err);
        });
        unsubs.push(unsub);
      } catch (err) {
        console.warn(`Failed listening to ${col}:`, err);
      }
    });

    // Escuchar subcolección de crecimiento
    try {
      const qGrowth = query(collection(db, "users", uid, "crecimiento"), limit(60));
      const unsubGrowth = onSnapshot(qGrowth, (snap) => {
        const gList = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as GrowthRecord[];
        gList.sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
        setGrowth(gList);
      }, (err) => console.warn("Error onSnapshot crecimiento:", err));
      unsubs.push(unsubGrowth);
    } catch (err) {
      console.warn("Failed listening to crecimiento:", err);
    }

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [currentUserId]);

  // 3. User specific settings: Theme and Clay
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (!currentUserId) return false;
    return localStorage.getItem(`bubblo_theme_${currentUserId}`) === 'dark';
  });

  const [useClay, setUseClay] = useState<boolean>(() => {
    if (!currentUserId) return true;
    const val = localStorage.getItem(`bubblo_useClay_${currentUserId}`);
    return val === null ? true : val === 'true';
  });

  // Sync dark/light class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (currentUserId) {
        localStorage.setItem(`bubblo_theme_${currentUserId}`, next ? 'dark' : 'light');
      }
      return next;
    });
  };

  const handleToggleClay = () => {
    setUseClay(prev => {
      const next = !prev;
      if (currentUserId) {
        localStorage.setItem(`bubblo_useClay_${currentUserId}`, next ? 'true' : 'false');
      }
      return next;
    });
  };

  // 4. Navigation Tab state
  const [currentTab, setCurrentTab] = useState<NavTab>('inicio');
  const [statsFilterEvent, setStatsFilterEvent] = useState<EventType | null>(null);

  const handleSelectEventHistory = (eventType: EventType) => {
    setStatsFilterEvent(eventType);
    setCurrentTab('stats');
  };

  // 6. Modal A9 state (Daily recording) and catalog trigger
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logModalPreset, setLogModalPreset] = useState<EventType | undefined>('panal');
  const [catalogTrigger, setCatalogTrigger] = useState<number>(0);
  const [editBabyModalOpen, setEditBabyModalOpen] = useState(false);
  const [editBabyModalTab, setEditBabyModalTab] = useState<'profile' | 'support'>('profile');
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [showAvatarCreatorModal, setShowAvatarCreatorModal] = useState(false);
  const [fullAvatarConfig, setFullAvatarConfig] = useState<AvatarElaboradoConfig>(() => {
    try {
      const saved = localStorage.getItem('bubblo_avatar_elaborado');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR_ELABORADO;
    } catch {
      return DEFAULT_AVATAR_ELABORADO;
    }
  });
  const [dataVersion, setDataVersion] = useState(0);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // OneSignal Push Subscription Setup
  useEffect(() => {
    if ((window as any).OneSignalDeferred) {
      (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          if (OneSignal?.Slidedown?.promptPush) {
            await OneSignal.Slidedown.promptPush();
          }
          const id = await OneSignal?.User?.PushSubscription?.id;
          if (id) {
            localStorage.setItem('bubblo_player_id', id);
          }
        } catch (err) {
          console.warn('OneSignal registration:', err);
        }
      });
    }
  }, [currentUserId]);

  // Verificar si hay notificaciones de respuesta de soporte para el usuario
  useEffect(() => {
    if (!currentUser?.email) return;
    try {
      const userNotifsKey = 'bubblo_user_notifs_' + currentUser.email;
      const notifs = JSON.parse(localStorage.getItem(userNotifsKey) || '[]');
      if (notifs.length > 0) {
        const last = notifs[notifs.length - 1];
        const lastSeen = localStorage.getItem('bubblo_seen_notif_' + currentUser.email);
        if (lastSeen !== String(last.id)) {
          showToast(`💬 ${last.title || 'Respuesta de Soporte'}: ${last.message.slice(0, 40)}...`);
          localStorage.setItem('bubblo_seen_notif_' + currentUser.email, String(last.id));
        }
      }
    } catch {
      // ignore
    }
  }, [currentUser, showToast]);

  // Atajos de PWA y Permiso de Notificaciones al montar
  useEffect(() => {
    // 1. Pedir Notification.permission al montar
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // 2. Procesar atajos de URL: /?action=panial, /?action=sueno, /?action=resumen
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action) {
        if (action === 'panial' || action === 'panal') {
          setCurrentTab('inicio');
          setLogModalPreset('panal');
          setLogModalOpen(true);
        } else if (action === 'sueno') {
          setCurrentTab('inicio');
          setLogModalPreset('sueno');
          setLogModalOpen(true);
        } else if (action === 'resumen') {
          setCurrentTab('inicio');
          setTimeout(() => {
            const el = document.getElementById('panel-recordatorios-resumen');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 350);
        }
        try {
          const newUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, '', newUrl);
        } catch (e) {}
      }
    }
  }, []);

  // iOS Badge state & MediaSession
  const [iosBadgeCount, setIosBadgeCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('bubblo_ios_badge_count') || 0);
    } catch (e) {
      return 0;
    }
  });

  useEffect(() => {
    const handleIosBadge = (e: any) => {
      if (e.detail?.pendientes !== undefined) {
        setIosBadgeCount(e.detail.pendientes);
      }
    };
    window.addEventListener('iosBadgeCountChanged', handleIosBadge as EventListener);
    return () => window.removeEventListener('iosBadgeCountChanged', handleIosBadge as EventListener);
  }, []);

  // MediaSession API with artwork for sleep and nursing timers
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Baby Day - Tracker de Maternidad',
        artist: 'Baby Day',
        album: 'Cuidados del Bebé',
        artwork: [
          { src: '/icon.png', sizes: '96x96', type: 'image/png' },
          { src: '/icon.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon.png', sizes: '512x512', type: 'image/png' }
        ]
      });
      navigator.mediaSession.setActionHandler('play', () => {});
      navigator.mediaSession.setActionHandler('pause', () => {});
    }
  }, []);

  // Sincronización periódica de PWA / iOS Badge cada 5 minutos
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || 'anonymous';
    actualizarBadgeUniversal(uid, events, lang);

    const intervalId = setInterval(() => {
      actualizarBadgeUniversal(uid, events, lang);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, currentUserId, events, lang]);

  const handleRestoreSuccess = () => {
    setDataVersion(v => v + 1);
    showToast('✅ ¡Copia de seguridad restaurada con éxito!');
  };

  // 7. Cronómetros Sincronizados (Lactancia y Sueño) con persistencia offline / background
  const [lactanciaRunning, setLactanciaRunning] = useState<boolean>(() => {
    return localStorage.getItem('bubblo_timer_lactancia_running') === 'true';
  });
  const [lactanciaStartTime, setLactanciaStartTime] = useState<number | null>(() => {
    const v = localStorage.getItem('bubblo_timer_lactancia_start');
    return v ? parseInt(v, 10) : null;
  });
  const [lactanciaAccumulated, setLactanciaAccumulated] = useState<number>(() => {
    const v = localStorage.getItem('bubblo_timer_lactancia_accumulated');
    return v ? parseInt(v, 10) : 0;
  });
  const [lactanciaElapsed, setLactanciaElapsed] = useState<number>(() => {
    const start = parseInt(localStorage.getItem('bubblo_timer_lactancia_start') || '0', 10);
    const acc = parseInt(localStorage.getItem('bubblo_timer_lactancia_accumulated') || '0', 10);
    const isRun = localStorage.getItem('bubblo_timer_lactancia_running') === 'true';
    if (isRun && start) {
      return acc + Math.floor((Date.now() - start) / 1000);
    }
    return acc;
  });
  const [lactanciaSide, setLactanciaSide] = useState<BreastSide>(() => {
    return (localStorage.getItem('bubblo_timer_lactancia_side') as BreastSide) || 'D';
  });

  const [suenoRunning, setSuenoRunning] = useState<boolean>(() => {
    return localStorage.getItem('bubblo_timer_sueno_running') === 'true';
  });
  const [suenoStartTime, setSuenoStartTime] = useState<number | null>(() => {
    const v = localStorage.getItem('bubblo_timer_sueno_start');
    return v ? parseInt(v, 10) : null;
  });
  const [suenoAccumulated, setSuenoAccumulated] = useState<number>(() => {
    const v = localStorage.getItem('bubblo_timer_sueno_accumulated');
    return v ? parseInt(v, 10) : 0;
  });
  const [suenoElapsed, setSuenoElapsed] = useState<number>(() => {
    const start = parseInt(localStorage.getItem('bubblo_timer_sueno_start') || '0', 10);
    const acc = parseInt(localStorage.getItem('bubblo_timer_sueno_accumulated') || '0', 10);
    const isRun = localStorage.getItem('bubblo_timer_sueno_running') === 'true';
    if (isRun && start) {
      return acc + Math.floor((Date.now() - start) / 1000);
    }
    return acc;
  });

  // Intervalo de sincronización en tiempo real (solo corre si hay cronómetro activo)
  useEffect(() => {
    if (!lactanciaRunning && !suenoRunning) return;
    const interval = setInterval(() => {
      if (lactanciaRunning && lactanciaStartTime) {
        const secs = lactanciaAccumulated + Math.floor((Date.now() - lactanciaStartTime) / 1000);
        setLactanciaElapsed(secs);
      }
      if (suenoRunning && suenoStartTime) {
        const secs = suenoAccumulated + Math.floor((Date.now() - suenoStartTime) / 1000);
        setSuenoElapsed(secs);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lactanciaRunning, lactanciaStartTime, lactanciaAccumulated, suenoRunning, suenoStartTime, suenoAccumulated]);

  // Actualización inmediata al volver a la app, desbloquear pantalla o restaurar de BFCache/segundo plano
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        if (lactanciaRunning && lactanciaStartTime) {
          const secs = lactanciaAccumulated + Math.floor((Date.now() - lactanciaStartTime) / 1000);
          setLactanciaElapsed(secs);
        }
        if (suenoRunning && suenoStartTime) {
          const secs = suenoAccumulated + Math.floor((Date.now() - suenoStartTime) / 1000);
          setSuenoElapsed(secs);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
    };
  }, [lactanciaRunning, lactanciaStartTime, lactanciaAccumulated, suenoRunning, suenoStartTime, suenoAccumulated]);

  // 8. Sistema de recordatorios simples (> 4 horas desde última toma de lactancia o de sueño)
  useEffect(() => {
    if (!currentUserId || events.length === 0) return;

    const checkOverdueReminders = () => {
      const now = Date.now();
      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
      const t = rE[lang] || rE.es;

      // Último evento de lactancia o biberón
      const nursingEvents = events
        .filter(e => e.type === 'lactancia' || e.type === 'biberon')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (nursingEvents.length > 0) {
        const lastNursingTime = new Date(nursingEvents[0].timestamp).getTime();
        const diff = now - lastNursingTime;
        const lastNotified = parseInt(sessionStorage.getItem(`bubblo_last_remind_nursing_${currentUserId}`) || '0', 10);

        if (diff >= FOUR_HOURS_MS && (now - lastNotified > 60 * 60 * 1000)) {
          sessionStorage.setItem(`bubblo_last_remind_nursing_${currentUserId}`, now.toString());
          const hours = Math.floor(diff / (60 * 60 * 1000));
          const msg = t.nursingReminder || `⏰ Han pasado ${hours} horas desde la última toma de lactancia`;
          showToast(msg);
          YA(msg, 3500);
          return; // Para no solapar ambos avisos
        }
      }

      // Último evento de sueño
      const sleepEvents = events
        .filter(e => e.type === 'sueno')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (sleepEvents.length > 0) {
        const lastSleepTime = new Date(sleepEvents[0].timestamp).getTime();
        const diff = now - lastSleepTime;
        const lastNotified = parseInt(sessionStorage.getItem(`bubblo_last_remind_sleep_${currentUserId}`) || '0', 10);

        if (diff >= FOUR_HOURS_MS && (now - lastNotified > 60 * 60 * 1000)) {
          sessionStorage.setItem(`bubblo_last_remind_sleep_${currentUserId}`, now.toString());
          const hours = Math.floor(diff / (60 * 60 * 1000));
          const msg = t.sleepReminder || `⏰ Han pasado ${hours} horas desde el último descanso / sueño`;
          showToast(msg);
          YA(msg, 3500);
        }
      }
    };

    // Revisar tras 3 segundos al cargar y luego periódicamente cada 3 minutos
    const timer = setTimeout(checkOverdueReminders, 3000);
    const interval = setInterval(checkOverdueReminders, 3 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [events, currentUserId, lang, showToast]);

  // Load user data whenever currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;

    // Theme
    const userTheme = localStorage.getItem(`bubblo_theme_${currentUserId}`);
    setIsDark(userTheme === 'dark');

    // Clay
    const userClay = localStorage.getItem(`bubblo_useClay_${currentUserId}`);
    setUseClay(userClay === null ? true : userClay === 'true');

    // Baby Info: bubblo_baby_{user} default Mathews
    try {
      const bRaw = localStorage.getItem(`bubblo_baby_${currentUserId}`);
      if (bRaw) {
        setBabyInfo(JSON.parse(bRaw));
      } else {
        const found = users.find(u => u.id === currentUserId);
        const defBaby = {
          name: found?.babyName || 'Mathews',
          birthDate: found?.birthDate || '2026-02-15',
          height: 65,
          weight: 7.2
        };
        setBabyInfo(defBaby);
        localStorage.setItem(`bubblo_baby_${currentUserId}`, JSON.stringify(defBaby));
      }
    } catch {
      // ignore
    }

    // Stock
    try {
      const sRaw = localStorage.getItem(`bubblo_stock_${currentUserId}`);
      setStock(sRaw ? JSON.parse(sRaw) : []);
    } catch {
      setStock([]);
    }

    // Events
    try {
      const evRaw = localStorage.getItem(`bubblo_events_${currentUserId}`);
      setEvents(evRaw ? JSON.parse(evRaw) : []);
    } catch {
      setEvents([]);
    }

    // Growth LA
    try {
      const gRaw = localStorage.getItem(`bubblo_growth_${currentUserId}`);
      setGrowth(gRaw ? JSON.parse(gRaw) : []);
    } catch {
      setGrowth([]);
    }

    // Vaccines with multi-key recovery fallback
    try {
      let vRaw = localStorage.getItem(`bubblo_vaccines_${currentUserId}`);
      if (!vRaw) {
        vRaw = localStorage.getItem(`bubblo_vaccines_backup_${currentUserId}`);
      }
      if (!vRaw && currentUser?.id) {
        vRaw = localStorage.getItem(`bubblo_vaccines_${currentUser.id}`);
      }
      if (!vRaw && currentUser?.email) {
        vRaw = localStorage.getItem(`bubblo_vaccines_${currentUser.email}`);
      }
      if (!vRaw) {
        // Search any key containing vaccines that might have applied records
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('bubblo_vaccines_')) {
            const candidate = localStorage.getItem(k);
            if (candidate && candidate.includes('"applied":true')) {
              vRaw = candidate;
              break;
            }
          }
        }
      }

      if (vRaw) {
        setVaccines(JSON.parse(vRaw));
      } else {
        // Seed default 15 vaccines
        setVaccines(VACUNAS_DATA);
        localStorage.setItem(`bubblo_vaccines_${currentUserId}`, JSON.stringify(VACUNAS_DATA));
      }
    } catch {
      setVaccines(VACUNAS_DATA);
    }

    // Pantry
    try {
      const pRaw = localStorage.getItem(`bubblo_pantry_${currentUserId}`);
      if (pRaw) {
        setPantry(JSON.parse(pRaw));
      } else {
        // Seed base pantry Tf
        const initialPantry: PantryItem[] = Tf_BASE_PANTRY.map((name, idx) => ({
          id: 'p_' + idx + '_' + Date.now(),
          name,
          category: JE(name),
          addedAt: new Date().toISOString()
        }));
        setPantry(initialPantry);
        localStorage.setItem(`bubblo_pantry_${currentUserId}`, JSON.stringify(initialPantry));
      }
    } catch {
      setPantry([]);
    }

    // Favorite Recipes
    try {
      const favRaw = localStorage.getItem(`bubblo_favRecipes_${currentUserId}`);
      setFavorites(favRaw ? JSON.parse(favRaw) : []);
    } catch {
      setFavorites([]);
    }

    // Cooked History AB
    try {
      const histRaw = localStorage.getItem(`bubblo_recipes_history_${currentUserId}`);
      setHistory(histRaw ? JSON.parse(histRaw) : []);
    } catch {
      setHistory([]);
    }
  }, [currentUserId, dataVersion]);

  // 8. Recordatorios automáticos (> 4 horas sin lactancia o sueño)
  const lastReminderLactanciaRef = useRef<number>(0);
  const lastReminderSuenoRef = useRef<number>(0);

  useEffect(() => {
    if (!currentUserId || events.length === 0) return;

    const checkReminders = () => {
      const now = Date.now();
      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
      const COOLDOWN_MS = 45 * 60 * 1000; // 45 min cooldown

      // Última toma de lactancia o biberón
      const latestFeeding = events.find(e => e.type === 'lactancia' || e.type === 'biberon');
      if (latestFeeding && !lactanciaRunning) {
        const timeSinceFeeding = now - latestFeeding.timestamp;
        if (timeSinceFeeding > FOUR_HOURS_MS && now - lastReminderLactanciaRef.current > COOLDOWN_MS) {
          const hoursAgo = Math.floor(timeSinceFeeding / (60 * 60 * 1000));
          showToast(`⏰ Han pasado más de ${hoursAgo}h desde la última toma de ${babyInfo.name || 'lactancia'}`);
          lastReminderLactanciaRef.current = now;
          return;
        }
      }

      // Último sueño / descanso
      const latestSleep = events.find(e => e.type === 'sueno');
      if (latestSleep && !suenoRunning) {
        const timeSinceSleep = now - latestSleep.timestamp;
        if (timeSinceSleep > FOUR_HOURS_MS && now - lastReminderSuenoRef.current > COOLDOWN_MS) {
          const hoursAgo = Math.floor(timeSinceSleep / (60 * 60 * 1000));
          showToast(`😴 Han pasado más de ${hoursAgo}h desde el último sueño de ${babyInfo.name || 'bebé'}`);
          lastReminderSuenoRef.current = now;
        }
      }
    };

    const initialTimer = setTimeout(checkReminders, 2500);
    const interval = setInterval(checkReminders, 2 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [events, currentUserId, lactanciaRunning, suenoRunning, babyInfo.name, showToast]);

  // Auth actions
  const handleLoginSuccess = (userId: string, userObj?: BabyUser) => {
    setCurrentUserId(userId);
    localStorage.setItem('bubblo_current_user', userId);
    const resolvedUser = userObj || { id: userId, babyName: 'Bebé', createdAt: Date.now() };
    setCurrentUserState(resolvedUser);
    localStorage.setItem('bubblo_currentUser', JSON.stringify(resolvedUser));

    // Rehidratar inmediatamente desde la memoria interna del usuario
    try {
      const bRaw = localStorage.getItem(`bubblo_baby_${userId}`) || localStorage.getItem('bubblo_baby');
      if (bRaw) setBabyInfo(JSON.parse(bRaw));
      const evRaw = localStorage.getItem(`bubblo_events_${userId}`);
      if (evRaw) setEvents(JSON.parse(evRaw));
      const gRaw = localStorage.getItem(`bubblo_growth_${userId}`);
      if (gRaw) setGrowth(JSON.parse(gRaw));
      const vRaw = localStorage.getItem(`bubblo_vaccines_${userId}`);
      if (vRaw) setVaccines(JSON.parse(vRaw));
      const pRaw = localStorage.getItem(`bubblo_pantry_${userId}`);
      if (pRaw) setPantry(JSON.parse(pRaw));
      const fRaw = localStorage.getItem(`bubblo_favRecipes_${userId}`);
      if (fRaw) setFavorites(JSON.parse(fRaw));
      const hRaw = localStorage.getItem(`bubblo_recipes_history_${userId}`);
      if (hRaw) setHistory(JSON.parse(hRaw));
    } catch (e) {
      console.warn("Error rehydrating user memory:", e);
    }
    setDataVersion(v => v + 1);
  };

  const handleCreateUserSuccess = (newUser: BabyUser) => {
    handleLoginSuccess(newUser.id, newUser);
  };

  const handleSwitchUser = (userId: string) => {
    // Single user mode - no switching between other accounts
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
    // Conservar datos y memoria interna de los usuarios registrados intactos
    setCurrentUserId(null);
    setCurrentUserState(null);
    setEvents([]);
    setGrowth([]);
    setBabyInfo({
      name: 'Mathews',
      birthDate: '2026-02-15',
      height: 65,
      weight: 7.2
    });
    localStorage.removeItem('bubblo_currentUser');
    localStorage.removeItem('bubblo_current_user');
  };

  // Events management
  const handleSaveEvent = useCallback(async (eventData: Omit<BabyEvent, 'id' | 'timestamp'>) => {
    // Volver de inmediato a la pantalla principal de inicio
    setCurrentTab('inicio');
    setLogModalOpen(false);

    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;

    const nowMs = Date.now();
    const localDate = eventData.date || getLocalDateString(new Date(nowMs));
    const localTime = eventData.time || new Date(nowMs).toTimeString().slice(0, 5);

    // Optimistic local state update para respuesta instantánea en UI
    const optimisticEvent: BabyEvent = {
      id: 'local_' + nowMs + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: nowMs,
      ...eventData,
      date: localDate,
      time: localTime,
      amount: eventData.amount !== undefined ? Number(eventData.amount) : undefined,
      subType: eventData.subType || (eventData.type === 'panal' ? 'Mojado' : undefined)
    };

    setEvents(prev => {
      const updated = [optimisticEvent, ...prev.filter(e => e.id !== optimisticEvent.id)];
      try {
        localStorage.setItem(`bubblo_events_${uid}`, JSON.stringify(updated));
        localStorage.setItem('bubblo_events', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    let subCol: string = eventData.type;
    if (!['sueno', 'lactancia', 'panal', 'biberon', 'diario'].includes(subCol)) {
      subCol = 'diario';
    }

    if (subCol === 'panal') {
      const tipo = eventData.subType || 'Mojado';
      await addDoc(collection(db, "users", uid, "panal"), {
        tipo,
        subType: tipo,
        type: 'panal',
        hora: serverTimestamp(),
        fecha: new Date(nowMs),
        fechaISO: new Date(nowMs).toISOString(),
        date: localDate,
        time: localTime,
        timestamp: nowMs,
        notes: eventData.notes || '',
        uid
      });

      // Sincronizar con inventario predictivo de suministros (restar 1 pañal)
      let updatedPanalesStock: number | null = null;
      try {
        const rawStock = localStorage.getItem('inventory_stock');
        if (rawStock) {
          const parsed = JSON.parse(rawStock);
          const currentStock = Number(parsed.panalesStock);
          if (!isNaN(currentStock) && currentStock > 0) {
            updatedPanalesStock = currentStock - 1;
            parsed.panalesStock = updatedPanalesStock;
            localStorage.setItem('inventory_stock', JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.warn("Error updating local inventory stock:", err);
      }

      try {
        const stockRef = doc(db, "users", uid, "inventario", "panales");
        await setDoc(stockRef, { stock: increment(-1), ultimaActualizacion: serverTimestamp() }, { merge: true });
        const mainStockRef = doc(db, "users", uid, "inventory", "main");
        if (updatedPanalesStock !== null) {
          await setDoc(mainStockRef, { panalesStock: updatedPanalesStock, ultimaActualizacion: serverTimestamp() }, { merge: true });
        } else {
          await setDoc(mainStockRef, { panalesStock: increment(-1), ultimaActualizacion: serverTimestamp() }, { merge: true });
        }
      } catch (err) {
        console.warn("Error updating Firestore inventory:", err);
      }

      // Notificar a InventarioPredictivo en tiempo real
      window.dispatchEvent(new CustomEvent('inventory_stock_updated', {
        detail: { panalesStock: updatedPanalesStock }
      }));
    } else if (subCol === 'biberon') {
      const cantidad = eventData.amount !== undefined ? Number(eventData.amount) : 0;
      await addDoc(collection(db, "users", uid, "biberon"), {
        cantidad,
        amount: cantidad,
        type: 'biberon',
        hora: serverTimestamp(),
        fecha: new Date(nowMs),
        fechaISO: new Date(nowMs).toISOString(),
        date: localDate,
        time: localTime,
        timestamp: nowMs,
        notes: eventData.notes || '',
        uid
      });
    } else {
      const payload = {
        ...eventData,
        date: localDate,
        time: localTime,
        tipo: eventData.subType || eventData.type,
        hora: serverTimestamp(),
        fecha: new Date(nowMs),
        fechaISO: new Date(nowMs).toISOString(),
        createdAt: serverTimestamp(),
        timestamp: nowMs,
        uid
      };
      await addDoc(collection(db, "users", uid, subCol), payload);
    }

    // Reprogramar siguiente aviso y actualizar badge en PWA
    if (['panal', 'biberon', 'lactancia', 'sueno'].includes(subCol)) {
      reprogramarAvisoTrasEvento(uid, subCol as ReminderType, nowMs, [optimisticEvent, ...events], lang);
    } else {
      actualizarBadgeUniversal(uid, [optimisticEvent, ...events], lang);
    }
  }, [currentUserId, currentUser, events, lang]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;

    // Borrado permanente en Firestore en las subcolecciones correspondientes
    const collectionsToCheck = ['panal', 'biberon', 'lactancia', 'sueno', 'diario'];
    for (const col of collectionsToCheck) {
      try {
        await deleteDoc(doc(db, "users", uid, col, id));
      } catch (e) {}
    }

    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem(`bubblo_events_${uid}`, JSON.stringify(next));
      } catch (e) {}
      actualizarBadgeUniversal(uid, next, lang);
      return next;
    });
  }, [currentUserId, currentUser, lang]);

  // Toggle Lactancia (Dz)
  const handleToggleLactancia = useCallback(() => {
    if (!lactanciaRunning) {
      // Iniciar manualmente
      const now = Date.now();
      setLactanciaStartTime(now);
      setLactanciaRunning(true);
      localStorage.setItem('bubblo_timer_lactancia_running', 'true');
      localStorage.setItem('bubblo_timer_lactancia_start', now.toString());
      localStorage.setItem('bubblo_timer_start', now.toString());
      localStorage.setItem('bubblo_timer_type', 'lactancia');
      localStorage.setItem('bubblo_timer_running', 'true');
      setLogModalOpen(false);
      setCurrentTab('inicio');
      showToast('🤱 Lactancia en curso • cronómetro en Inicio');
    } else {
      // Pausar
      let currentElapsed = lactanciaAccumulated;
      if (lactanciaStartTime) {
        currentElapsed += Math.floor((Date.now() - lactanciaStartTime) / 1000);
        setLactanciaAccumulated(currentElapsed);
        setLactanciaElapsed(currentElapsed);
        localStorage.setItem('bubblo_timer_lactancia_accumulated', currentElapsed.toString());
      }
      setLactanciaStartTime(null);
      setLactanciaRunning(false);
      localStorage.setItem('bubblo_timer_lactancia_running', 'false');
      localStorage.removeItem('bubblo_timer_lactancia_start');
      localStorage.setItem('bubblo_timer_running', 'false');
    }
  }, [lactanciaRunning, lactanciaStartTime, lactanciaAccumulated, showToast]);

  // Guardar toma de Lactancia (uz)
  const handleSaveLactancia = useCallback(() => {
    const totalSecs = lactanciaRunning && lactanciaStartTime
      ? lactanciaAccumulated + Math.floor((Date.now() - lactanciaStartTime) / 1000)
      : (lactanciaAccumulated || lactanciaElapsed);

    const durationSecs = Math.max(1, totalSecs);
    const durationMins = Math.round(durationSecs / 60);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const date = now.toISOString().split('T')[0];

    handleSaveEvent({
      type: 'lactancia',
      time: `${hh}:${mm}`,
      date,
      duration: durationSecs,
      side: lactanciaSide,
      notes: `Duración: ${durationMins} min (${lactanciaSide === 'I' ? 'Izquierdo' : lactanciaSide === 'D' ? 'Derecho' : 'Ambos'})`
    });

    // Reset
    setLactanciaRunning(false);
    setLactanciaStartTime(null);
    setLactanciaAccumulated(0);
    setLactanciaElapsed(0);
    localStorage.removeItem('bubblo_timer_lactancia_running');
    localStorage.removeItem('bubblo_timer_lactancia_start');
    localStorage.removeItem('bubblo_timer_lactancia_accumulated');
    if (localStorage.getItem('bubblo_timer_type') === 'lactancia') {
      localStorage.removeItem('bubblo_timer_running');
      localStorage.removeItem('bubblo_timer_start');
      localStorage.removeItem('bubblo_timer_type');
    }
    setLogModalOpen(false);
    showToast('✅ Toma de lactancia guardada en el Diario');
  }, [lactanciaRunning, lactanciaStartTime, lactanciaAccumulated, lactanciaElapsed, lactanciaSide, handleSaveEvent, showToast]);

  const handleResetLactancia = useCallback(() => {
    setLactanciaRunning(false);
    setLactanciaStartTime(null);
    setLactanciaAccumulated(0);
    setLactanciaElapsed(0);
    localStorage.removeItem('bubblo_timer_lactancia_running');
    localStorage.removeItem('bubblo_timer_lactancia_start');
    localStorage.removeItem('bubblo_timer_lactancia_accumulated');
    if (localStorage.getItem('bubblo_timer_type') === 'lactancia') {
      localStorage.removeItem('bubblo_timer_running');
      localStorage.removeItem('bubblo_timer_start');
      localStorage.removeItem('bubblo_timer_type');
    }
  }, []);

  // Toggle Sueño (Mz)
  const handleToggleSueno = useCallback(() => {
    if (!suenoRunning) {
      // Iniciar manualmente
      const now = Date.now();
      setSuenoStartTime(now);
      setSuenoRunning(true);
      localStorage.setItem('bubblo_timer_sueno_running', 'true');
      localStorage.setItem('bubblo_timer_sueno_start', now.toString());
      localStorage.setItem('bubblo_timer_start', now.toString());
      localStorage.setItem('bubblo_timer_type', 'sueno');
      localStorage.setItem('bubblo_timer_running', 'true');
      setLogModalOpen(false);
      setCurrentTab('inicio');
      showToast('🌙 Sueño en curso • cronómetro en Inicio');
    } else {
      // Pausar
      let currentElapsed = suenoAccumulated;
      if (suenoStartTime) {
        currentElapsed += Math.floor((Date.now() - suenoStartTime) / 1000);
        setSuenoAccumulated(currentElapsed);
        setSuenoElapsed(currentElapsed);
        localStorage.setItem('bubblo_timer_sueno_accumulated', currentElapsed.toString());
      }
      setSuenoStartTime(null);
      setSuenoRunning(false);
      localStorage.setItem('bubblo_timer_sueno_running', 'false');
      localStorage.removeItem('bubblo_timer_sueno_start');
      localStorage.setItem('bubblo_timer_running', 'false');
    }
  }, [suenoRunning, suenoStartTime, suenoAccumulated, showToast]);

  // Despertar y guardar Sueño (Oz)
  const handleSaveSueno = useCallback(() => {
    const totalSecs = suenoRunning && suenoStartTime
      ? suenoAccumulated + Math.floor((Date.now() - suenoStartTime) / 1000)
      : (suenoAccumulated || suenoElapsed);

    const durationSecs = Math.max(1, totalSecs);
    const durationMins = Math.round(durationSecs / 60);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const date = now.toISOString().split('T')[0];

    handleSaveEvent({
      type: 'sueno',
      time: `${hh}:${mm}`,
      date,
      duration: durationSecs,
      notes: `Duración de sueño: ${durationMins} min`
    });

    // Reset
    setSuenoRunning(false);
    setSuenoStartTime(null);
    setSuenoAccumulated(0);
    setSuenoElapsed(0);
    localStorage.removeItem('bubblo_timer_sueno_running');
    localStorage.removeItem('bubblo_timer_sueno_start');
    localStorage.removeItem('bubblo_timer_sueno_accumulated');
    if (localStorage.getItem('bubblo_timer_type') === 'sueno') {
      localStorage.removeItem('bubblo_timer_running');
      localStorage.removeItem('bubblo_timer_start');
      localStorage.removeItem('bubblo_timer_type');
    }
    setLogModalOpen(false);
    showToast('☀️ Registro de sueño guardado en el Diario');
  }, [suenoRunning, suenoStartTime, suenoAccumulated, suenoElapsed, handleSaveEvent, showToast]);

  const handleResetSueno = useCallback(() => {
    setSuenoRunning(false);
    setSuenoStartTime(null);
    setSuenoAccumulated(0);
    setSuenoElapsed(0);
    localStorage.removeItem('bubblo_timer_sueno_running');
    localStorage.removeItem('bubblo_timer_sueno_start');
    localStorage.removeItem('bubblo_timer_sueno_accumulated');
    if (localStorage.getItem('bubblo_timer_type') === 'sueno') {
      localStorage.removeItem('bubblo_timer_running');
      localStorage.removeItem('bubblo_timer_start');
      localStorage.removeItem('bubblo_timer_type');
    }
  }, []);

  // Growth management LA - Sincronización instantánea de peso y talla
  const handleAddMeasure = useCallback(async (type: 'peso' | 'largo' | 'cabeza', value: number, date: string) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;

    const timestamp = date ? new Date(date).getTime() : Date.now();
    const tempId = 'growth_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newRecord: GrowthRecord = {
      id: tempId,
      type,
      value,
      date,
      timestamp
    };

    // 1. Actualización inmediata en estado local de crecimiento
    setGrowth(prev => {
      const next = [newRecord, ...prev.filter(r => !(r.type === type && r.date === date))];
      next.sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
      try {
        localStorage.setItem(`bubblo_growth_${uid}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 2. Sincronización inmediata en el perfil del bebé (babyInfo)
    if (type === 'peso' || type === 'largo') {
      setBabyInfo(prev => {
        const updated = {
          ...prev,
          ...(type === 'peso' ? { weight: value } : { height: value })
        };
        try {
          localStorage.setItem('bubblo_baby', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    // 3. Persistencia en Firestore
    try {
      await addDoc(collection(db, "users", uid, "crecimiento"), {
        type,
        value,
        date,
        timestamp,
        createdAt: serverTimestamp(),
        uid
      });

      // Actualizar perfil del usuario en Firestore para persistencia total
      await updateDoc(doc(db, "users", uid), {
        ...(type === 'peso' ? { weight: value } : {}),
        ...(type === 'largo' ? { height: value } : {})
      }).catch(() => {});
    } catch (err) {
      console.warn("Error guardando medida en Firestore:", err);
    }
  }, [currentUserId, currentUser]);

  const handleDeleteMeasure = useCallback(async (id: string) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;
    try {
      await deleteDoc(doc(db, "users", uid, "crecimiento", id));
    } catch (e) {
      console.warn("Error borrando medida de Firestore:", e);
    }
    setGrowth(prev => {
      const next = prev.filter(g => g.id !== id);
      try {
        localStorage.setItem(`bubblo_growth_${uid}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, [currentUserId, currentUser]);

  // Baby profile edit and sync
  const handleSaveBabyProfile = useCallback(async (data: { name: string; birthDate: string; height: number; weight: number; photo?: string }) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId;
    if (!uid) return;

    const updatedBaby = {
      name: data.name,
      birthDate: data.birthDate,
      height: data.height,
      weight: data.weight,
      photo: data.photo
    };
    setBabyInfo(updatedBaby);
    try {
      localStorage.setItem('bubblo_baby', JSON.stringify(updatedBaby));
      localStorage.setItem(`bubblo_baby_${uid}`, JSON.stringify(updatedBaby));
    } catch (e) {}

    if (currentUserState) {
      const updatedUser = {
        ...currentUserState,
        babyName: data.name,
        birthDate: data.birthDate,
        height: data.height,
        weight: data.weight,
        photo: data.photo || currentUserState.photo
      };
      setCurrentUserState(updatedUser);
      try {
        localStorage.setItem('bubblo_currentUser', JSON.stringify(updatedUser));
      } catch (e) {}
    }

    // Guardar permanentemente en Firestore en users/{uid}
    try {
      await setDoc(doc(db, "users", uid), {
        uid,
        babyName: data.name,
        peso: data.weight,
        talla: data.height,
        fechaNacimiento: data.birthDate,
        photo: data.photo || null,
        ownerId: uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const userEmail = currentUser?.email || (typeof currentUserId === 'string' && currentUserId.includes('@') ? currentUserId : null);
      if (userEmail && userEmail !== uid) {
        await setDoc(doc(db, "users", userEmail), {
          babyName: data.name,
          peso: data.weight,
          talla: data.height,
          fechaNacimiento: data.birthDate,
          photo: data.photo || null,
          ownerId: uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.error("Error actualizando perfil en Firestore:", err);
    }

    const today = new Date().toISOString().split('T')[0];
    handleAddMeasure('peso', data.weight, today);
    handleAddMeasure('largo', data.height, today);
  }, [currentUserId, currentUser, currentUserState, handleAddMeasure]);

  // Vaccine management
  const handleToggleVaccine = useCallback(async (vaccineId: string, applied: boolean, appliedDate?: string) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;
    const dateStr = appliedDate || new Date().toISOString().split('T')[0];

    setVaccines(prev => {
      const next = prev.map(v => v.id === vaccineId ? { ...v, applied, appliedDate: applied ? dateStr : undefined } : v);
      if (currentUserId) {
        localStorage.setItem(`bubblo_vaccines_${currentUserId}`, JSON.stringify(next));
      }
      return next;
    });

    try {
      await setDoc(doc(db, "users", uid, "vacunas", vaccineId), {
        applied,
        appliedDate: applied ? dateStr : null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Error updating vaccine in Firestore:", err);
    }
  }, [currentUserId, currentUser]);

  // Nutrition management
  const handleToggleFavorite = useCallback((recipeId: string) => {
    if (!currentUserId) return;
    setFavorites(prev => {
      const next = prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId];
      localStorage.setItem(`bubblo_favRecipes_${currentUserId}`, JSON.stringify(next));
      return next;
    });
  }, [currentUserId]);

  const handleAddPantryItem = useCallback(async (name: string, category: PantryCategory) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid) return;
    await addDoc(collection(db, "users", uid, "mi_despensa"), {
      name,
      category,
      addedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      uid
    });
  }, [currentUserId, currentUser]);

  const handleAddMultiplePantryItems = useCallback(async (newItems: { name: string; category: PantryCategory }[]) => {
    const uid = auth.currentUser?.uid || currentUser?.id || currentUserId || (currentUser?.email as string);
    if (!uid || newItems.length === 0) return;
    for (const item of newItems) {
      await addDoc(collection(db, "users", uid, "mi_despensa"), {
        name: item.name,
        category: item.category,
        addedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        uid
      });
    }
  }, [currentUserId, currentUser]);

  const handleUpdatePantryCategory = useCallback((id: string, category: PantryCategory) => {
    if (!currentUserId) return;
    setPantry(prev => {
      const next = prev.map(p => p.id === id ? { ...p, category } : p);
      localStorage.setItem(`bubblo_pantry_${currentUserId}`, JSON.stringify(next));
      return next;
    });
  }, [currentUserId]);

  const handleRemovePantryItem = useCallback((id: string) => {
    if (!currentUserId) return;
    setPantry(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem(`bubblo_pantry_${currentUserId}`, JSON.stringify(next));
      return next;
    });
  }, [currentUserId]);

  const handleLogRecipeCooked = useCallback((recipeId: string) => {
    if (!currentUserId) return;
    setHistory(prev => {
      const next = [recipeId, ...prev.filter(id => id !== recipeId)].slice(0, 30);
      localStorage.setItem(`bubblo_recipes_history_${currentUserId}`, JSON.stringify(next));
      return next;
    });
  }, [currentUserId]);

  // Global UI cleanup and banner removal
  useEffect(() => {
    quitarBanners();
    corregirCamposBlancos();
    const interval = setInterval(() => {
      quitarBanners();
      corregirCamposBlancos();
    }, 2000);
    return () => clearInterval(interval);
  }, [isDark, useClay, currentTab]);

  // Quick Open Modal: If typePreset provided, pre-selects; if undefined, shows type selector
  const handleOpenLogModal = (typePreset?: EventType) => {
    setLogModalPreset(typePreset || null);
    setLogModalOpen(true);
  };

  const L = currentScreen;
  const setL = setCurrentScreen;

  // Ruta pública de registro rápido /baby/:id/quick sin login
  const isQuickRoute = typeof window !== 'undefined' && (window.location.pathname.includes('/quick') || window.location.hash.includes('quick') || window.location.search.includes('quick=1'));
  if (isQuickRoute) {
    const match = window.location.pathname.match(/\/baby\/([^/]+)\/quick/);
    const babyId = match ? match[1] : (currentUserId || 'mathews');
    return <QuickPublicRegistration babyId={babyId} />;
  }

  // Y en tu return principal:
  if ((L === "admin" && isAdmin) || isAdmin || currentScreen === 'admin' || window.location.hash === '#admin') {
    return <AdminDashboardTotal onExit={handleExitAdmin} setIsAdmin={setIsAdmin} setL={setL} />;
  }

  // Modo Mantenimiento activado por el Admin en bubblo_maintenance
  const isMaintenanceMode = typeof window !== 'undefined' && localStorage.getItem('bubblo_maintenance') === 'true';
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 animate-bounce select-none">🛠️</div>
        <h1 className="text-2xl font-black mb-2 tracking-tight">Baby Day en Mantenimiento</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          Estamos realizando actualizaciones y tareas de mantenimiento del sistema para darte el mejor servicio. Volveremos a estar disponibles en unos momentos.
        </p>
        <button
          onClick={() => {
            setIsAdmin(true);
            setCurrentScreen('admin');
            window.location.hash = '#admin';
          }}
          className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer transition"
        >
          Acceso Administrador
        </button>
      </div>
    );
  }

  // Auth loading state screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-lg">👶 Cargando Baby Day...</p>
        <p className="text-xs text-gray-400 mt-1">Sincronizando sesión en Firestore...</p>
      </div>
    );
  }

  // If no user is active, render the Auth view
  if (!currentUser) {
    return (
      <>
        <UpdateBanner />
        <AuthModal
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onCreateUserSuccess={handleCreateUserSuccess}
          lang={lang}
          isDark={isDark}
          onEnterAdmin={handleEnterAdmin}
          onSelectLang={handleSelectLang}
        />
      </>
    );
  }

  // If viewing Comunidad Mamas route (/comunidad)
  if (isComunidad || currentScreen === 'comunidad') {
    return (
      <>
        <UpdateBanner />
        <ComunidadLayout
          user={{
            ...currentUser,
            babyName: babyInfo.name || currentUser.babyName,
            photo: (babyInfo as any).photo || currentUser.photo
          }}
          isDark={isDark}
          initialSubPath={comunidadSubPath}
          onExitToBabyDay={handleExitCommunity}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'dark bg-[#1E1E2E] text-white' : 'light bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-100/40 text-[#111827]'
    }`}>
      {/* Update notification banner */}
      <UpdateBanner />

      {/* App Header */}
      <Header
        user={{
          ...currentUser,
          babyName: babyInfo.name || currentUser.babyName,
          birthDate: babyInfo.birthDate || currentUser.birthDate,
          height: babyInfo.height,
          weight: babyInfo.weight,
          photo: (babyInfo as any).photo || currentUser.photo
        }}
        allUsers={users}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        lang={lang}
        onSelectLang={handleSelectLang}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        useClay={useClay}
        onToggleClay={handleToggleClay}
        onOpenEditBaby={() => {
          setEditBabyModalTab('profile');
          setEditBabyModalOpen(true);
        }}
        onOpenSupport={() => {
          setEditBabyModalTab('support');
          setEditBabyModalOpen(true);
        }}
        onOpenBackup={() => setBackupModalOpen(true)}
        onOpenAvatarCreator={() => setShowAvatarCreatorModal(true)}
        onNavigateToCommunity={() => handleNavigateToCommunity()}
        iosBadgeCount={iosBadgeCount}
      />

      {/* Main Viewport */}
      <main className="transition-all duration-300 pt-14 pb-20">
        {currentTab === 'inicio' && (
          <HomeTab
            user={{
              ...currentUser,
              babyName: babyInfo.name,
              birthDate: babyInfo.birthDate,
              height: babyInfo.height,
              weight: babyInfo.weight
            }}
            events={events}
            growth={growth}
            vaccines={vaccines}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
            onOpenLogModal={handleOpenLogModal}
            onNavigateTab={(tab) => {
              if (tab === 'stats') setStatsFilterEvent(null);
              setCurrentTab(tab);
            }}
            onSelectEventHistory={handleSelectEventHistory}
            openCatalogTrigger={catalogTrigger}
            tA={lactanciaRunning}
            mA={lactanciaElapsed}
            v9={lactanciaSide}
            Dz={handleToggleLactancia}
            uz={handleSaveLactancia}
            GA={suenoRunning}
            _A={suenoElapsed}
            Mz={handleToggleSueno}
            Oz={handleSaveSueno}
            onSaveEvent={handleSaveEvent}
          />
        )}

        {currentTab === 'diario' && (
          <DailyTab
            events={events}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
            onOpenModal={handleOpenLogModal}
          />
        )}

        {currentTab === 'stats' && (
          <StatsTab
            events={events}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
            filterEventType={statsFilterEvent}
            onClearFilter={() => setStatsFilterEvent(null)}
            onSelectFilterEvent={setStatsFilterEvent}
          />
        )}

        {currentTab === 'crecimiento' && (
          <GrowthTab
            growth={growth}
            babyInfo={babyInfo}
            onAddMeasure={handleAddMeasure}
            onDeleteMeasure={handleDeleteMeasure}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
          />
        )}

        {currentTab === 'vacunas' && (
          <VaccinesTab
            user={currentUser}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
            vaccines={vaccines}
            onUpdateVaccines={setVaccines}
          />
        )}

        {currentTab === 'nutricion' && (
          <NutritionTab
            recipes={RECIPES_DATA.map(r => getLocalizedCatalogRecipe(r, lang))}
            pantry={pantry}
            favorites={favorites}
            history={history}
            onToggleFavorite={handleToggleFavorite}
            onAddPantryItem={handleAddPantryItem}
            onAddMultiplePantryItems={handleAddMultiplePantryItems}
            onUpdatePantryCategory={handleUpdatePantryCategory}
            onRemovePantryItem={handleRemovePantryItem}
            onLogRecipeCooked={handleLogRecipeCooked}
            lang={lang}
            isDark={isDark}
            useClay={useClay}
            babyName={babyInfo.name || currentUser.babyName}
            babyBirthDate={babyInfo.birthDate || currentUser.birthDate}
          />
        )}
      </main>

      {/* Bottom Glass/Clay Navigation with Floating + FAB */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'stats') {
            setStatsFilterEvent(null);
          }
          setCurrentTab(tab);
        }}
        lang={lang}
        isDark={isDark}
        useClay={useClay}
        onOpenQuickLog={() => {
          if (currentTab !== 'inicio') {
            setCurrentTab('inicio');
          }
          setCatalogTrigger(Date.now());
        }}
      />

      {/* Ventana de Registro A9 (Modal 3D Smart Timer + Diaper kE + Confetti bA) */}
      <RegistrationModal
        isOpen={logModalOpen}
        initialType={logModalPreset || undefined}
        onClose={() => setLogModalOpen(false)}
        onSave={handleSaveEvent}
        lang={lang}
        onSelectLang={(newLang) => {
          setLang(newLang);
          localStorage.setItem('bubblo_lang', newLang);
        }}
        onEnterAdmin={handleEnterAdmin}
        isDark={isDark}
        useClay={useClay}
        tA={lactanciaRunning}
        mA={lactanciaElapsed}
        v9={lactanciaSide}
        setV9={setLactanciaSide}
        Dz={handleToggleLactancia}
        uz={handleSaveLactancia}
        resetLactancia={handleResetLactancia}
        GA={suenoRunning}
        _A={suenoElapsed}
        Mz={handleToggleSueno}
        Oz={handleSaveSueno}
        resetSueno={handleResetSueno}
        onNavigateToHome={() => setCurrentTab('inicio')}
      />

      {/* Toast Notificación flotante */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold text-xs shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce select-none">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal de Edición de Perfil del Bebé */}
      {currentUser && (
        <EditBabyModal
          isOpen={editBabyModalOpen}
          onClose={() => setEditBabyModalOpen(false)}
          user={{
            ...currentUser,
            babyName: babyInfo.name || currentUser.babyName,
            birthDate: babyInfo.birthDate || currentUser.birthDate,
            height: babyInfo.height,
            weight: babyInfo.weight,
            photo: (babyInfo as any).photo || currentUser.photo
          }}
          onSave={handleSaveBabyProfile}
          lang={lang}
          isDark={isDark}
          useClay={useClay}
          onOpenBackup={() => setBackupModalOpen(true)}
          initialTab={editBabyModalTab}
        />
      )}

      {/* Modal de Copia de Seguridad (Exportar / Importar) */}
      {currentUser && (
        <BackupModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          currentUserId={currentUserId!}
          babyName={babyInfo.name || currentUser.babyName || 'Bebé'}
          lang={lang}
          isDark={isDark}
          onRestoreSuccess={handleRestoreSuccess}
        />
      )}

      {/* Modal Creador Avatar Tamagotchi */}
      <AvatarCreatorModal
        isOpen={showAvatarCreatorModal}
        onClose={() => setShowAvatarCreatorModal(false)}
        config={fullAvatarConfig}
        onSave={(newCfg) => {
          setFullAvatarConfig(newCfg);
          setDataVersion(v => v + 1);
        }}
      />


      {/* PWA Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
