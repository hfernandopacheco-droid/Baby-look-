import { LanguageCode, BabyEvent } from '../types';
import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';

export type ReminderType = 'panal' | 'sueno' | 'lactancia' | 'biberon';

export interface ReminderConfig {
  activo: boolean;
  intervaloDiaMin: number;
  intervaloNocheMin: number;
  auto: boolean;
  ultimoAviso?: any;
  siguienteAviso?: number;
  updatedAt?: any;
}

export type RemindersMap = Record<ReminderType, ReminderConfig>;

export const DEFAULT_REMINDERS: RemindersMap = {
  panal: {
    activo: false,
    intervaloDiaMin: 180, // 3h
    intervaloNocheMin: 240, // 4h
    auto: true
  },
  sueno: {
    activo: false,
    intervaloDiaMin: 120, // 2h
    intervaloNocheMin: 180, // 3h
    auto: true
  },
  lactancia: {
    activo: false,
    intervaloDiaMin: 150, // 2h 30m
    intervaloNocheMin: 210, // 3h 30m
    auto: true
  },
  biberon: {
    activo: false,
    intervaloDiaMin: 180, // 3h
    intervaloNocheMin: 240, // 4h
    auto: true
  }
};

export const RECORDATORIO_TEXTS: Record<string, Record<string, string>> = {
  es: {
    panelTitle: "¿Qué quieres que te recordemos?",
    tooltip: "Activa para que te avisemos. Analiza últimos 5 días, separa día 7am-7pm y noche 7pm-7am. Se actualiza solo cada 5 días.",
    teAvisare: "Te avisaré a las {time}",
    modalTitle: "¿A qué horas te aviso mamá?",
    saveBtn: "Guardar recordatorio",
    cancelBtn: "Cancelar",
    intervalDiaLabel: "Intervalo de día (7am - 7pm)",
    intervalNocheLabel: "Intervalo de noche (7pm - 7am)",
    minutesLabel: "Minutos entre avisos",
    autoCalculated: "✨ Calculado automáticamente con tus últimos 5 días",
    manualCustom: "✏️ Intervalo personalizado",
    todayHistory: "Historial de hoy",
    noEventsToday: "No hay registros de pañal, biberón, lactancia o sueño hoy.",
    eventsCount: "eventos hoy",
    tapToConfigure: "Toca para ajustar tiempo",
    panal: "Pañal",
    sueno: "Sueño",
    lactancia: "Lactancia",
    biberon: "Biberón",
    panalSubtitle: "Pañales",
    suenoSubtitle: "Sueño Total",
    lactanciaSubtitle: "Lactancia",
    biberonSubtitle: "Biberones",
    savedToast: "¡Recordatorio guardado con éxito! 💕"
  },
  en: {
    panelTitle: "What would you like us to remind you?",
    tooltip: "Enable to receive reminders. Analyzes last 5 days, separates day (7am-7pm) and night (7pm-7am). Auto-updates every 5 days.",
    teAvisare: "I'll remind you at {time}",
    modalTitle: "What time should I remind you, mama?",
    saveBtn: "Save reminder",
    cancelBtn: "Cancel",
    intervalDiaLabel: "Daytime interval (7am - 7pm)",
    intervalNocheLabel: "Nighttime interval (7pm - 7am)",
    minutesLabel: "Minutes between reminders",
    autoCalculated: "✨ Automatically calculated from your last 5 days",
    manualCustom: "✏️ Custom interval",
    todayHistory: "Today's history",
    noEventsToday: "No diaper, bottle, nursing, or sleep logs recorded today.",
    eventsCount: "events today",
    tapToConfigure: "Tap to adjust time",
    panal: "Diaper",
    sueno: "Sleep",
    lactancia: "Nursing",
    biberon: "Bottle",
    panalSubtitle: "Diapers",
    suenoSubtitle: "Total Sleep",
    lactanciaSubtitle: "Nursing",
    biberonSubtitle: "Bottles",
    savedToast: "Reminder saved successfully! 💕"
  },
  pt: {
    panelTitle: "O que você quer que a gente lembre?",
    tooltip: "Ative para ser avisada. Analisa os últimos 5 dias, separando dia 7h-19h e noite 19h-7h. Atualiza-se sozinho a cada 5 dias.",
    teAvisare: "Vou te avisar às {time}",
    modalTitle: "A que horas te aviso, mamãe?",
    saveBtn: "Salvar lembrete",
    cancelBtn: "Cancelar",
    intervalDiaLabel: "Intervalo diurno (7h - 19h)",
    intervalNocheLabel: "Intervalo noturno (19h - 7h)",
    minutesLabel: "Minutos entre avisos",
    autoCalculated: "✨ Calculado automaticamente com base nos seus últimos 5 dias",
    manualCustom: "✏️ Intervalo personalizado",
    todayHistory: "Histórico de hoje",
    noEventsToday: "Nenhum registro de fralda, mamadeira, amamentação ou sono hoje.",
    eventsCount: "eventos hoje",
    tapToConfigure: "Toque para ajustar tempo",
    panal: "Fralda",
    sueno: "Sono",
    lactancia: "Amamentação",
    biberon: "Mamadeira",
    panalSubtitle: "Fraldas",
    suenoSubtitle: "Sono Total",
    lactanciaSubtitle: "Amamentação",
    biberonSubtitle: "Mamadeiras",
    savedToast: "Lembrete salvo com sucesso! 💕"
  },
  fr: {
    panelTitle: "Que voulez-vous qu'on vous rappelle ?",
    tooltip: "Activez pour recevoir un rappel. Analyse les 5 derniers jours (jour 7h-19h, nuit 19h-7h). Mis à jour tous les 5 jours.",
    teAvisare: "Je vous préviendrai à {time}",
    modalTitle: "À quelle heure dois-je vous prévenir maman ?",
    saveBtn: "Enregistrer le rappel",
    cancelBtn: "Annuler",
    intervalDiaLabel: "Intervalle de jour (7h - 19h)",
    intervalNocheLabel: "Intervalle de nuit (19h - 7h)",
    minutesLabel: "Minutes entre chaque rappel",
    autoCalculated: "✨ Calculé automatiquement d'après vos 5 derniers jours",
    manualCustom: "✏️ Intervalle personnalisé",
    todayHistory: "Historique d'aujourd'hui",
    noEventsToday: "Aucune couche, biberon, tétée ou sommeil enregistré aujourd'hui.",
    eventsCount: "événements aujourd'hui",
    tapToConfigure: "Touchez pour régler l'heure",
    panal: "Couche",
    sueno: "Sommeil",
    lactancia: "Allaitement",
    biberon: "Biberon",
    panalSubtitle: "Couches",
    suenoSubtitle: "Sommeil Total",
    lactanciaSubtitle: "Allaitement",
    biberonSubtitle: "Biberons",
    savedToast: "Rappel enregistré avec succès ! 💕"
  },
  de: {
    panelTitle: "Woran möchtest du erinnert werden?",
    tooltip: "Aktivieren für Benachrichtigungen. Analysiert die letzten 5 Tage (Tag 7-19 Uhr, Nacht 19-7 Uhr). Aktualisiert sich alle 5 Tage.",
    teAvisare: "Ich erinnere dich um {time}",
    modalTitle: "Zu welcher Zeit soll ich dich erinnern, Mama?",
    saveBtn: "Erinnerung speichern",
    cancelBtn: "Abbrechen",
    intervalDiaLabel: "Tagesintervall (7 - 19 Uhr)",
    intervalNocheLabel: "Nachtintervall (19 - 7 Uhr)",
    minutesLabel: "Minuten zwischen Erinnerungen",
    autoCalculated: "✨ Automatisch anhand der letzten 5 Tage berechnet",
    manualCustom: "✏️ Benutzerdefiniertes Intervall",
    todayHistory: "Heutiger Verlauf",
    noEventsToday: "Heute keine Windel-, Fläschchen-, Still- oder Schlafeinträge.",
    eventsCount: "Ereignisse heute",
    tapToConfigure: "Tippen zum Anpassen",
    panal: "Windel",
    sueno: "Schlaf",
    lactancia: "Stillen",
    biberon: "Fläschchen",
    panalSubtitle: "Windeln",
    suenoSubtitle: "Schlaf Gesamt",
    lactanciaSubtitle: "Stillen",
    biberonSubtitle: "Fläschchen",
    savedToast: "Erinnerung erfolgreich gespeichert! 💕"
  }
};

export function getReminderText(key: string, lang: LanguageCode = 'es'): string {
  const dict = RECORDATORIO_TEXTS[lang] || RECORDATORIO_TEXTS.es;
  return dict[key] || RECORDATORIO_TEXTS.es[key] || key;
}

export function isCurrentlyDayTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19;
}

export function formatMinutesToHoursMins(mins: number): string {
  if (!mins || isNaN(mins) || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatNextReminderTime(targetTimestamp: number): string {
  const d = new Date(targetTimestamp);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const isPm = hours >= 12;
  const period = isPm ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr}${period}`;
}

export function getRecordatoriosLocal(uid: string): RemindersMap {
  try {
    const raw = localStorage.getItem(`bubblo_recordatorios_${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        panal: { ...DEFAULT_REMINDERS.panal, ...parsed.panal },
        sueno: { ...DEFAULT_REMINDERS.sueno, ...parsed.sueno },
        lactancia: { ...DEFAULT_REMINDERS.lactancia, ...parsed.lactancia },
        biberon: { ...DEFAULT_REMINDERS.biberon, ...parsed.biberon }
      };
    }
  } catch (e) {}
  return { ...DEFAULT_REMINDERS };
}

export function saveRecordatoriosLocal(uid: string, config: RemindersMap) {
  try {
    localStorage.setItem(`bubblo_recordatorios_${uid}`, JSON.stringify(config));
    localStorage.setItem('bubblo_recordatorios', JSON.stringify(config));
  } catch (e) {}
}

/**
 * 3. LOGICA AUTO 5 DIAS DIA/NOCHE:
 * func calcularPromedio(tipo):
 * Toma docs users/{uid}/{tipo} últimos 5 días. Separa día 7am-7pm y noche 7pm-7am.
 * Calcula promedio intervalo minutos para cada bloque.
 * Si promedio valido 30-360 min, muestra sugerencia.
 */
export async function calcularPromedio5Dias(
  uid: string,
  tipo: ReminderType
): Promise<{ diaMin: number; nocheMin: number; auto: boolean }> {
  const fallback = DEFAULT_REMINDERS[tipo];
  if (!uid) return { diaMin: fallback.intervaloDiaMin, nocheMin: fallback.intervaloNocheMin, auto: true };

  try {
    const fiveDaysAgoMs = Date.now() - (5 * 24 * 60 * 60 * 1000);
    const colRef = collection(db, "users", uid, tipo);
    const q = query(colRef, limit(100));
    const snap = await getDocs(q);

    const timestamps: number[] = [];
    snap.forEach(d => {
      const data = d.data();
      const ts = data.createdAt?.toDate ? data.createdAt.toDate().getTime()
        : (data.fecha?.toDate ? data.fecha.toDate().getTime()
        : (data.hora?.toDate ? data.hora.toDate().getTime()
        : (data.timestamp || (data.fechaISO ? new Date(data.fechaISO).getTime() : null))));
      if (ts && ts >= fiveDaysAgoMs) {
        timestamps.push(ts);
      }
    });

    timestamps.sort((a, b) => a - b);

    const diaIntervals: number[] = [];
    const nocheIntervals: number[] = [];

    for (let i = 1; i < timestamps.length; i++) {
      const prev = new Date(timestamps[i - 1]);
      const curr = new Date(timestamps[i]);
      const diffMin = (curr.getTime() - prev.getTime()) / (60 * 1000);

      // Solo intervalos razonables entre tomas / eventos sucesivos (20 min a 12 horas)
      if (diffMin >= 20 && diffMin <= 720) {
        const h = curr.getHours();
        // Día: 7am a 7pm (>= 7 y < 19)
        if (h >= 7 && h < 19) {
          diaIntervals.push(diffMin);
        } else {
          nocheIntervals.push(diffMin);
        }
      }
    }

    let diaMin = fallback.intervaloDiaMin;
    let nocheMin = fallback.intervaloNocheMin;

    if (diaIntervals.length > 0) {
      const avgDia = Math.round(diaIntervals.reduce((a, b) => a + b, 0) / diaIntervals.length);
      if (avgDia >= 30 && avgDia <= 360) {
        diaMin = avgDia;
      }
    }

    if (nocheIntervals.length > 0) {
      const avgNoche = Math.round(nocheIntervals.reduce((a, b) => a + b, 0) / nocheIntervals.length);
      if (avgNoche >= 30 && avgNoche <= 360) {
        nocheMin = avgNoche;
      }
    }

    return { diaMin, nocheMin, auto: true };
  } catch (err) {
    console.warn(`Error al calcular promedio 5 días para ${tipo}:`, err);
    return { diaMin: fallback.intervaloDiaMin, nocheMin: fallback.intervaloNocheMin, auto: true };
  }
}

/**
 * Recalcula el siguiente aviso dado un evento reciente o el momento actual
 */
export function calcularSiguienteAviso(
  config: ReminderConfig,
  lastEventTimestamp?: number
): number {
  const isDay = isCurrentlyDayTime();
  const intervalMin = isDay ? config.intervaloDiaMin : config.intervaloNocheMin;
  const intervalMs = intervalMin * 60 * 1000;
  const now = Date.now();

  if (lastEventTimestamp && lastEventTimestamp > 0) {
    const candidate = lastEventTimestamp + intervalMs;
    // Si la hora calculada aún está en el futuro, úsala; si ya pasó, sugiere ahora + intervalo
    if (candidate > now) {
      return candidate;
    }
  }

  return now + intervalMs;
}

/**
 * Guarda la configuración en Firestore (en users/{uid}/config/recordatorios/{tipo}) y localStorage
 */
export async function persistirRecordatorio(
  uid: string,
  tipo: ReminderType,
  itemConfig: ReminderConfig,
  currentEvents?: BabyEvent[],
  lang: LanguageCode = 'es'
): Promise<RemindersMap> {
  const current = getRecordatoriosLocal(uid);
  const updated: RemindersMap = {
    ...current,
    [tipo]: { ...itemConfig, updatedAt: Date.now() }
  };

  saveRecordatoriosLocal(uid, updated);

  if (uid && uid !== 'anonymous') {
    try {
      const dataToSave = {
        activo: itemConfig.activo,
        intervaloDiaMin: Number(itemConfig.intervaloDiaMin) || 180,
        intervaloNocheMin: Number(itemConfig.intervaloNocheMin) || 240,
        auto: Boolean(itemConfig.auto),
        siguienteAviso: itemConfig.siguienteAviso || null,
        ultimoAviso: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Guardar en paths compatibles en Firestore
      await setDoc(doc(db, "users", uid, "config_recordatorios", tipo), dataToSave, { merge: true });
      await setDoc(doc(db, "users", uid, "config", "recordatorios"), { [tipo]: dataToSave }, { merge: true });
    } catch (err) {
      console.warn("Firestore error persisting reminder config:", err);
    }
  }

  // Notificar al sistema y actualizar badge
  window.dispatchEvent(new CustomEvent('recordatorios_updated', { detail: { updated, tipo } }));
  actualizarBadge(uid, currentEvents, lang);

  return updated;
}

/**
 * 5. BADGE PWA + NOTIFICACION + ATAJOS SINCRONIZADO:
 * funcion actualizarBadge(): lee config/recordatorios y ultimos eventos.
 * Para cada activo, si horasDesdeUltimo > intervaloDia/Noche/60 entonces pendiente++.
 * Si 0 clearAppBadge() else si 1 setAppBadge(horas) else setAppBadge(pendientes).
 * Notificacion fija tag="baby-day" body="Pañal hace 3h · Sueño hace 1h" badge /icon-192.png
 */
export async function actualizarBadge(
  uid?: string | null,
  providedEvents?: BabyEvent[],
  lang: LanguageCode = 'es'
): Promise<{ pendientes: number; bodyText: string }> {
  try {
    const targetUid = uid || auth.currentUser?.uid || localStorage.getItem('bubblo_current_user') || 'anonymous';
    const config = getRecordatoriosLocal(targetUid);

    // Obtener eventos locales si no se suministran
    let events = providedEvents;
    if (!events || events.length === 0) {
      try {
        const raw = localStorage.getItem(`bubblo_events_${targetUid}`) || localStorage.getItem('bubblo_events');
        if (raw) events = JSON.parse(raw);
      } catch (e) {}
    }
    const safeEvents = events || [];

    const now = Date.now();
    const isDay = isCurrentlyDayTime();

    let pendientes = 0;
    let maxHoras = 0;
    const overdueList: string[] = [];

    const types: ReminderType[] = ['panal', 'sueno', 'lactancia', 'biberon'];

    types.forEach(tipo => {
      const cfg = config[tipo];
      if (!cfg || !cfg.activo) return;

      const intervaloMin = isDay ? cfg.intervaloDiaMin : cfg.intervaloNocheMin;
      const intervaloHoras = intervaloMin / 60;

      // Buscar último evento registrado de este tipo
      const evs = safeEvents.filter(e => e.type === tipo).sort((a, b) => b.timestamp - a.timestamp);
      const lastEvent = evs[0];

      if (lastEvent && lastEvent.timestamp) {
        const horasDesdeUltimo = (now - lastEvent.timestamp) / (1000 * 60 * 60);
        if (horasDesdeUltimo > intervaloHoras) {
          pendientes++;
          const hRound = Math.floor(horasDesdeUltimo);
          maxHoras = Math.max(maxHoras, hRound);
          const typeName = getReminderText(tipo, lang);
          overdueList.push(`${typeName} hace ${Math.max(1, hRound)}h`);
        }
      } else {
        // Sin evento previo pero recordatorio activo y con hora vencida
        if (cfg.siguienteAviso && now > cfg.siguienteAviso) {
          pendientes++;
          const typeName = getReminderText(tipo, lang);
          overdueList.push(`${typeName} pendiente`);
        }
      }
    });

    // PWA Badge: Si 0 clearAppBadge() else si 1 setAppBadge(horas) else setAppBadge(pendientes)
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      try {
        if (pendientes === 0) {
          await (navigator as any).clearAppBadge();
        } else if (pendientes === 1) {
          await (navigator as any).setAppBadge(Math.max(1, maxHoras || 1));
        } else {
          await (navigator as any).setAppBadge(pendientes);
        }
      } catch (e) {
        // AppBadge API unsupported on current platform or context
      }
    }

    // Notificación fija tag="baby-day"
    const bodyText = overdueList.join(' · ');
    if (pendientes > 0 && overdueList.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notifOptions: any = {
          body: bodyText,
          tag: 'baby-day',
          icon: '/icon-192.png?v=3',
          badge: '/icon-192.png?v=3'
        };

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('Baby Day', notifOptions).catch(() => {});
          }).catch(() => {
            try {
              new Notification('Baby Day', notifOptions);
            } catch (e) {}
          });
        } else {
          try {
            new Notification('Baby Day', notifOptions);
          } catch (e) {}
        }
      }
    }

    return { pendientes, bodyText };
  } catch (err) {
    console.warn("Error in actualizarBadge:", err);
    return { pendientes: 0, bodyText: '' };
  }
}

/**
 * Función de badge universal (Android + iOS) con soporte Notification Triggers API
 */
export async function actualizarBadgeUniversal(
  uid?: string | null,
  providedEvents?: BabyEvent[],
  lang: LanguageCode = 'es'
): Promise<number> {
  const result = await actualizarBadge(uid, providedEvents, lang);
  const pendientes = result.pendientes;

  // Android / PWA AppBadge API
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    try {
      if (pendientes > 0) {
        await (navigator as any).setAppBadge(pendientes);
      } else {
        await (navigator as any).clearAppBadge?.();
      }
    } catch (e) {}
  }

  // iOS detection
  const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)));
  if (isIOS) {
    localStorage.setItem('bubblo_ios_badge_count', String(pendientes));
    window.dispatchEvent(new CustomEvent('iosBadgeCountChanged', { detail: { pendientes, bodyText: result.bodyText } }));
    if (pendientes > 0 && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notifMsg = `Tienes ${pendientes} pendientes: ${result.bodyText}`;
        const notifOpts: any = {
          body: notifMsg,
          icon: '/icon-192.png?v=3',
          tag: 'baby-day-ios'
        };
        // Notification Trigger API if supported
        if ('TimestampTrigger' in window && (window as any).TimestampTrigger) {
          notifOpts.showTrigger = new (window as any).TimestampTrigger(Date.now());
        }
        new Notification('Baby Day', notifOpts);
      } catch (e) {}
    }
  }

  return pendientes;
}

/**
 * Reprograma el siguiente aviso tras registrar un nuevo evento
 */
export async function reprogramarAvisoTrasEvento(
  uid: string,
  tipo: ReminderType,
  eventTimestamp: number,
  eventsList?: BabyEvent[],
  lang: LanguageCode = 'es'
) {
  if (!uid) return;
  const config = getRecordatoriosLocal(uid);
  const cfg = config[tipo];
  if (!cfg) return;

  const siguienteAviso = calcularSiguienteAviso(cfg, eventTimestamp);
  const updatedCfg: ReminderConfig = {
    ...cfg,
    siguienteAviso,
    ultimoAviso: Date.now()
  };

  await persistirRecordatorio(uid, tipo, updatedCfg, eventsList, lang);
}

export async function dismissAllNotifications() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const notifications = await reg.getNotifications();
      notifications.forEach(n => n.close());
    } catch (e) {}
  }
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    try {
      await (navigator as any).clearAppBadge?.();
    } catch (e) {}
  }
}

