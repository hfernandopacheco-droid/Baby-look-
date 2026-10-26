import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { collection, collectionGroup, onSnapshot, doc, updateDoc, setDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

interface AdminDashboardTotalProps {
  onExit?: () => void;
  setIsAdmin?: (val: boolean) => void;
  setL?: (val: string) => void;
}

type TabKey = 'stats' | 'users' | 'subs' | 'notifications' | 'logs' | 'support' | 'cms' | 'comunidad_admin' | 'config';

export function AdminDashboardTotal({ onExit, setIsAdmin, setL }: AdminDashboardTotalProps = {}) {
  const [tab, setTab] = useState<TabKey>('stats');

  // Search in users
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bubblo_users') || '[]');
    } catch {
      return [];
    }
  });
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // App & config settings
  const [appName, setAppName] = useState<string>(() => localStorage.getItem('bubblo_app_name') || 'Baby Day');
  const [price, setPrice] = useState<string>(() => localStorage.getItem('bubblo_price') || '4.99');

  // Notifications tab state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bubblo_announcements') || '[]');
    } catch {
      return [];
    }
  });

  // Logs tab state
  const [selectedLogUser, setSelectedLogUser] = useState<string | null>(null);
  const [selectedLogUserModal, setSelectedLogUserModal] = useState<any | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'lactancia' | 'panal' | 'sueno'>('all');
  const [logs, setLogs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('bubblo_events');
      if (stored) return JSON.parse(stored);
      // Scan other events if not set
      let all: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('bubblo_events_')) {
          const parsed = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(parsed)) all = [...all, ...parsed];
        }
      }
      return all;
    } catch {
      return [];
    }
  });

  // Support messages tab state { id, babyName, email, subject, message, date, status: "abierto"|"resuelto", adminReply: "" }
  const [supportMsgs, setSupportMsgs] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('bubblo_support');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => ({
            id: m.id || Date.now(),
            babyName: m.babyName || m.userName || 'Mathews',
            email: m.email || 'usuario@ejemplo.com',
            subject: m.subject || 'Consulta de soporte',
            message: m.message || '',
            date: m.date || new Date().toISOString(),
            status: m.status === 'resuelto' ? 'resuelto' : 'abierto',
            adminReply: m.adminReply || m.response || '',
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Support modals & reply state
  const [replyingTicket, setReplyingTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);
  const [newTicketBaby, setNewTicketBaby] = useState<string>('');
  const [newTicketEmail, setNewTicketEmail] = useState<string>('');
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');

  // OneSignal credentials state
  const [oneSignalAppId, setOneSignalAppId] = useState<string>(() => {
    return localStorage.getItem('bubblo_onesignal_app_id') || (import.meta as any).env?.VITE_ONESIGNAL_APP_ID || '';
  });
  const [oneSignalRestKey, setOneSignalRestKey] = useState<string>(() => {
    return localStorage.getItem('bubblo_onesignal_rest_key') || (import.meta as any).env?.VITE_ONESIGNAL_REST_KEY || '';
  });
  const [showOneSignalConfig, setShowOneSignalConfig] = useState<boolean>(false);

  // CMS tab state
  const [cmsBanner, setCmsBanner] = useState<string>(() => localStorage.getItem('bubblo_cms_banner') || '');
  const [cmsOnboarding, setCmsOnboarding] = useState<string>(
    () => localStorage.getItem('bubblo_cms_onboarding') || '¡Bienvenido a Baby Day! Tu asistente inteligente de crianza.'
  );
  const [cmsTerms, setCmsTerms] = useState<string>(
    () => localStorage.getItem('bubblo_cms_terms') || 'Términos y Condiciones de Uso del servicio Baby Day (2026).'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature flags tab state
  const [features, setFeatures] = useState<{ vacunas: boolean; nutricion: boolean; crecimiento: boolean }>(() => {
    try {
      const raw = localStorage.getItem('bubblo_features');
      if (raw) return JSON.parse(raw);
      return { vacunas: true, nutricion: true, crecimiento: true };
    } catch {
      return { vacunas: true, nutricion: true, crecimiento: true };
    }
  });
  const [maintenance, setMaintenance] = useState<boolean>(() => localStorage.getItem('bubblo_maintenance') === 'true');

  // Community admin state
  const [communityPosts, setCommunityPosts] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bubblo_community_posts') || '[]');
    } catch {
      return [];
    }
  });
  const [newCommTitle, setNewCommTitle] = useState('');
  const [newCommContent, setNewCommContent] = useState('');
  const [newCommCategory, setNewCommCategory] = useState('Consejo');
  const [selectedCommunityUser, setSelectedCommunityUser] = useState<any | null>(null);

  // Config security state
  const [adminPin, setAdminPin] = useState<string>(() => localStorage.getItem('bubblo_admin_pin') || '1234');
  const [currency, setCurrency] = useState<string>(() => localStorage.getItem('bubblo_currency') || 'USD ($)');

  const handleCreateCommunityPost = async () => {
    if (!newCommTitle.trim() || !newCommContent.trim()) {
      alert('Ingresa título y contenido para el post/botón de comunidad');
      return;
    }
    const newP = {
      id: 'comm_' + Date.now(),
      title: newCommTitle.trim(),
      content: newCommContent.trim(),
      category: newCommCategory,
      author: 'Administrador (Admin)',
      createdAt: Date.now(),
      likes: 0
    };
    const updated = [newP, ...communityPosts];
    setCommunityPosts(updated);
    localStorage.setItem('bubblo_community_posts', JSON.stringify(updated));
    setNewCommTitle('');
    setNewCommContent('');
    alert('Publicación/Botón agregado a la comunidad con éxito');
  };

  const handleDeleteCommunityPost = (id: string) => {
    if (window.confirm('¿Borrar esta publicación de la comunidad?')) {
      const updated = communityPosts.filter((p: any) => p.id !== id);
      setCommunityPosts(updated);
      localStorage.setItem('bubblo_community_posts', JSON.stringify(updated));
    }
  };

  const updateUserStatus = async (id: string, status: 'activo' | 'revisión' | 'bloqueado') => {
    const updated = users.map((u: any) => u.id === id ? { ...u, status } : u);
    setUsers(updated);
    localStorage.setItem('bubblo_users', JSON.stringify(updated));
    try {
      await updateDoc(doc(db, "users", id), { status });
    } catch (e) {}
    alert(`Estado del usuario actualizado a: ${status}`);
  };

  const deleteUserCompletely = async (id: string) => {
    if (window.confirm('⚠️ ¿Estás seguro de ELIMINAR por completo este usuario y todos sus datos? Esta acción es irreversible.')) {
      const filtered = users.filter((u: any) => u.id !== id);
      setUsers(filtered);
      localStorage.setItem('bubblo_users', JSON.stringify(filtered));
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (e) {}
      alert('Usuario eliminado por completo');
    }
  };

  // Sincronización en tiempo real desde Firestore para el Admin
  useEffect(() => {
    const qUsuarios = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubUsuarios = onSnapshot(qUsuarios, (snap) => {
      const lista = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          email: data.email || d.id,
          babyName: data.babyName || 'Bebé',
          birthDate: data.fechaNacimiento || data.birthDate || '',
          weight: data.peso || data.weight || 0,
          height: data.talla || data.height || 0,
          ...data
        };
      });
      setUsers(lista);
      localStorage.setItem('bubblo_users', JSON.stringify(lista));
    }, (err) => console.warn("Error users snapshot:", err));

    const qRegistros = query(collectionGroup(db, "logs"), orderBy("createdAt", "desc"), limit(100));
    const unsubRegistros = onSnapshot(qRegistros, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        const parentEmail = d.ref.parent?.parent?.id || data.email || 'usuario';
        const ev = (data.datos || {}) as any;
        return {
          id: d.id,
          userEmail: parentEmail,
          babyName: ev.babyName || parentEmail,
          type: data.tipo || ev.type || 'registro',
          detail: ev.notes || (ev.amount ? `${ev.amount}ml` : '') || (ev.duration ? `${ev.duration}m` : '') || (ev.value ? `${ev.value}` : ''),
          date: ev.date || (data.fecha?.toDate ? data.fecha.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          time: ev.time || '12:00',
          timestamp: data.fecha?.toDate ? data.fecha.toDate().getTime() : (ev.timestamp || Date.now())
        };
      });
      setLogs(list);
    }, (err) => console.warn("Error logs snapshot:", err));

    return () => {
      unsubUsuarios();
      unsubRegistros();
    };
  }, []);

  // 4. Notificaciones: collection(db,"announcements")
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "announcements"), (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setAnnouncements(list);
        localStorage.setItem('bubblo_announcements', JSON.stringify(list));
      }
    }, (err) => console.warn("Firestore announcements listener:", err));
    return () => unsub();
  }, []);

  // Sync events from local keys if bubblo_events is empty
  useEffect(() => {
    try {
      const evts = localStorage.getItem('bubblo_events');
      if (!evts) {
        let all: any[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('bubblo_events_')) {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            if (Array.isArray(parsed)) all = [...all, ...parsed];
          }
        }
        if (all.length > 0) {
          localStorage.setItem('bubblo_events', JSON.stringify(all));
          setLogs(all);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Exit Admin
  const handleExit = () => {
    if (setIsAdmin) setIsAdmin(false);
    if (setL) setL('inicio');
    localStorage.removeItem('bubblo_admin');
    window.location.hash = '';
    if (onExit) onExit();
  };

  // User tab actions
  const deleteUser = (id: string) => {
    if (window.confirm('¿Borrar este bebé?')) {
      const filtered = users.filter((u: any) => u.id !== id);
      localStorage.setItem('bubblo_users', JSON.stringify(filtered));
      setUsers(filtered);
    }
  };

  const togglePass = (id: string) => setShowPass((prev) => ({ ...prev, [id]: !prev[id] }));

  // Filtered users for search input
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter((u: any) => {
      const bName = (u.babyName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return bName.includes(q) || email.includes(q);
    });
  }, [users, search]);

  // Subscription tab actions
  const activatePremium = (id: string) => {
    localStorage.setItem('sub_' + id, 'Premium');
    localStorage.setItem('bubblo_premium', '1');
    alert('Premium activado para ' + id);
    setUsers([...users]);
  };

  const resetFree = (id: string) => {
    localStorage.setItem('sub_' + id, 'Gratis');
    localStorage.removeItem('bubblo_premium');
    alert('Pasado a Gratis');
    setUsers([...users]);
  };

  // Notifications tab actions
  // OneSignal push sender
  const sendPush = async (title: string, message: string) => {
    const appId = localStorage.getItem('bubblo_onesignal_app_id') || oneSignalAppId || (import.meta as any).env?.VITE_ONESIGNAL_APP_ID;
    const restKey = localStorage.getItem('bubblo_onesignal_rest_key') || oneSignalRestKey || (import.meta as any).env?.VITE_ONESIGNAL_REST_KEY;
    if (!appId || !restKey || appId === 'TU_APP_ID_AQUI' || appId.startsWith('%')) {
      console.log('OneSignal no configurado o sin claves en .env / admin');
      return;
    }
    try {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + restKey,
        },
        body: JSON.stringify({
          app_id: appId,
          included_segments: ['Subscribed Users'],
          headings: { en: title, es: title },
          contents: { en: message, es: message },
        }),
      });
    } catch (err) {
      console.error('Error enviando notificación OneSignal:', err);
    }
  };

  const handleSaveOneSignalKeys = () => {
    localStorage.setItem('bubblo_onesignal_app_id', oneSignalAppId.trim());
    localStorage.setItem('bubblo_onesignal_rest_key', oneSignalRestKey.trim());
    alert('Claves de OneSignal guardadas');
  };

  const handleSendNow = async () => {
    if (!notifTitle.trim() || !notifMsg.trim()) {
      alert('Por favor ingresa título y mensaje');
      return;
    }
    const newAnn = {
      id: Date.now(),
      title: notifTitle.trim(),
      message: notifMsg.trim(),
      date: new Date().toISOString(),
      opens: 0,
      active: true,
    };
    const list = JSON.parse(localStorage.getItem('bubblo_announcements') || '[]');
    list.push(newAnn);
    localStorage.setItem('bubblo_announcements', JSON.stringify(list));
    setAnnouncements(list);

    // Guardar en Firestore: collection(db, "announcements")
    try {
      await addDoc(collection(db, "announcements"), {
        title: notifTitle.trim(),
        message: notifMsg.trim(),
        date: new Date().toISOString(),
        opens: 0,
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (fsErr) {
      console.error("Error guardando anuncio en Firestore:", fsErr);
    }

    // Enviar push a iPhone y Android mediante OneSignal
    await sendPush(notifTitle.trim(), notifMsg.trim());

    setNotifTitle('');
    setNotifMsg('');
    alert('Enviado');
  };

  const handleScheduleTomorrow = async () => {
    if (!notifTitle.trim() || !notifMsg.trim()) {
      alert('Por favor ingresa título y mensaje');
      return;
    }
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const newAnn = {
      id: Date.now(),
      title: notifTitle.trim(),
      message: notifMsg.trim(),
      date: tomorrow,
      scheduled: true,
      opens: 0,
      active: true,
    };
    const list = JSON.parse(localStorage.getItem('bubblo_announcements') || '[]');
    list.push(newAnn);
    localStorage.setItem('bubblo_announcements', JSON.stringify(list));
    setAnnouncements(list);

    try {
      await addDoc(collection(db, "announcements"), {
        title: notifTitle.trim(),
        message: notifMsg.trim(),
        date: tomorrow,
        scheduled: true,
        opens: 0,
        active: true,
        createdAt: serverTimestamp()
      });
    } catch (fsErr) {
      console.error("Error programando anuncio en Firestore:", fsErr);
    }

    setNotifTitle('');
    setNotifMsg('');
    alert('Programado para mañana');
  };

  const deleteAnnouncement = (id: number) => {
    const list = announcements.filter((a) => a.id !== id);
    localStorage.setItem('bubblo_announcements', JSON.stringify(list));
    setAnnouncements(list);
    alert('Notificación borrada');
  };

  // Logs tab actions: agrupado por usuario + tipo
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (selectedLogUser) {
      result = result.filter((l: any) => {
        const b = l.babyName || (users[0]?.babyName) || 'Mathews';
        return b.toLowerCase() === selectedLogUser.toLowerCase();
      });
    }
    if (logFilter !== 'all') {
      result = result.filter((l: any) => l.type === logFilter);
    }
    return result;
  }, [logs, selectedLogUser, logFilter, users]);

  const formatLogTimeAgo = (ts?: number, dateStr?: string, timeStr?: string) => {
    let t = ts;
    if (!t && dateStr) {
      t = new Date(`${dateStr}T${timeStr || '12:00:00'}`).getTime();
    }
    if (!t || isNaN(t)) return 'recientemente';
    const diffSec = Math.floor((Date.now() - t) / 1000);
    if (diffSec < 60) return `hace ${Math.max(1, diffSec)} seg`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    return new Date(t).toLocaleDateString();
  };

  const clearLogs = () => {
    if (window.confirm('¿Borrar todos los logs de eventos?')) {
      localStorage.removeItem('bubblo_events');
      setLogs([]);
      alert('Logs eliminados');
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert('No hay eventos para exportar');
      return;
    }
    const headers = 'ID,Bebé,Tipo,Detalle,Fecha,Hora,Timestamp\n';
    const rows = logs
      .map((ev: any) => {
        const id = ev.id || '';
        const baby = ev.babyName || (users[0]?.babyName) || 'Mathews';
        const type = ev.type || '';
        const detail = (ev.detail || '').replace(/"/g, '""');
        const date = ev.date || '';
        const time = ev.time || '';
        const ts = ev.timestamp || '';
        return `"${id}","${baby}","${type}","${detail}","${date}","${time}","${ts}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bubblo_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('CSV exportado');
  };

  // Support tab actions funcionales bidireccionales
  const handleOpenReply = (ticket: any) => {
    setReplyingTicket(ticket);
    setReplyText(ticket.adminReply || '');
  };

  const handleSaveReply = async () => {
    if (!replyingTicket) return;
    if (!replyText.trim()) {
      alert('Por favor escribe una respuesta para el usuario');
      return;
    }
    const respuesta = replyText.trim();
    const list = JSON.parse(localStorage.getItem('bubblo_support') || '[]');
    const updated = list.map((t: any) => {
      if (t.id === replyingTicket.id || (t.docId && t.docId === replyingTicket.docId)) {
        return {
          ...t,
          adminReply: respuesta,
          status: 'resuelto' as const,
        };
      }
      return t;
    });
    localStorage.setItem('bubblo_support', JSON.stringify(updated));
    setSupportMsgs(updated);

    // Actualizar en Firestore si tiene docId o id tipo string
    try {
      const targetDocId = replyingTicket.docId || (typeof replyingTicket.id === 'string' ? replyingTicket.id : null);
      if (targetDocId) {
        await updateDoc(doc(db, "support", targetDocId), {
          adminReply: respuesta,
          status: 'resuelto'
        });
      }
    } catch (fsErr) {
      console.warn("Error actualizando ticket en Firestore:", fsErr);
    }

    const notifs = JSON.parse(localStorage.getItem('bubblo_user_notifs_' + replyingTicket.email) || '[]');
    notifs.push({
      id: Date.now(),
      title: 'Respuesta de Soporte',
      message: respuesta,
      date: new Date().toISOString(),
    });
    localStorage.setItem('bubblo_user_notifs_' + replyingTicket.email, JSON.stringify(notifs));

    setReplyingTicket(null);
    setReplyText('');
    alert('Respuesta enviada');
  };

  const handleMarkResolved = async (id: any) => {
    const list = JSON.parse(localStorage.getItem('bubblo_support') || '[]');
    let targetDocId: string | null = null;
    let newStatus: string = 'resuelto';

    const updated = list.map((t: any) => {
      if (t.id === id || (t.docId && t.docId === id)) {
        newStatus = t.status === 'resuelto' ? 'abierto' : 'resuelto';
        targetDocId = t.docId || (typeof t.id === 'string' ? t.id : null);
        return {
          ...t,
          status: newStatus as any,
        };
      }
      return t;
    });
    localStorage.setItem('bubblo_support', JSON.stringify(updated));
    setSupportMsgs(updated);

    if (targetDocId) {
      try {
        await updateDoc(doc(db, "support", targetDocId), { status: newStatus });
      } catch (e) {
        console.warn("Error toggling ticket status in Firestore:", e);
      }
    }
    alert('Estado del ticket actualizado');
  };

  const handleDeleteSupport = async (id: any) => {
    if (window.confirm('¿Borrar este mensaje de soporte?')) {
      const list = JSON.parse(localStorage.getItem('bubblo_support') || '[]');
      let targetDocId: string | null = null;
      const updated = list.filter((t: any) => {
        if (t.id === id || (t.docId && t.docId === id)) {
          targetDocId = t.docId || (typeof t.id === 'string' ? t.id : null);
          return false;
        }
        return true;
      });
      localStorage.setItem('bubblo_support', JSON.stringify(updated));
      setSupportMsgs(updated);

      if (targetDocId) {
        try {
          await deleteDoc(doc(db, "support", targetDocId));
        } catch (e) {
          console.warn("Error deleting support doc in Firestore:", e);
        }
      }
      alert('Mensaje borrado');
    }
  };

  const handleCreateNewTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      alert('Por favor ingresa asunto y mensaje para el ticket');
      return;
    }
    const list = JSON.parse(localStorage.getItem('bubblo_support') || '[]');
    const newT = {
      id: Date.now(),
      babyName: newTicketBaby.trim() || users[0]?.babyName || 'Mathews',
      email: newTicketEmail.trim() || users[0]?.email || 'usuario@ejemplo.com',
      subject: newTicketSubject.trim(),
      message: newTicketMessage.trim(),
      date: new Date().toISOString(),
      status: 'abierto',
      adminReply: '',
    };
    list.unshift(newT);
    localStorage.setItem('bubblo_support', JSON.stringify(list));
    setSupportMsgs(list);

    setNewTicketBaby('');
    setNewTicketEmail('');
    setNewTicketSubject('');
    setNewTicketMessage('');
    setShowNewTicketModal(false);
    alert('Ticket creado con éxito');
  };

  // CMS tab actions
  const saveCMS = () => {
    localStorage.setItem('bubblo_cms_banner', cmsBanner);
    localStorage.setItem('bubblo_cms_onboarding', cmsOnboarding);
    localStorage.setItem('bubblo_cms_terms', cmsTerms);
    alert('Contenidos CMS guardados exitosamente');
  };

  const handleUploadPromo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCmsBanner(base64);
        localStorage.setItem('bubblo_cms_banner', base64);
        alert('Promoción subida y guardada como banner');
      }
    };
    reader.readAsDataURL(file);
  };

  // Feature flags tab actions
  const toggleFeature = (feat: 'vacunas' | 'nutricion' | 'crecimiento') => {
    const updated = { ...features, [feat]: !features[feat] };
    setFeatures(updated);
    localStorage.setItem('bubblo_features', JSON.stringify(updated));
  };

  const toggleMaintenance = () => {
    const next = !maintenance;
    setMaintenance(next);
    localStorage.setItem('bubblo_maintenance', next ? 'true' : 'false');
    alert(
      next
        ? '⚠️ Modo mantenimiento ACTIVADO. La app mostrará pantalla de mantenimiento a todos los usuarios.'
        : '✅ Modo mantenimiento DESACTIVADO. La app vuelve a estar abierta.'
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header superior */}
      <div className="p-4 flex justify-between items-center bg-[#0F0F0F] border-b border-[#2A2A40]">
        <h1 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
          👑 ADMIN - CONTROL TOTAL
        </h1>
        <button
          onClick={handleExit}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm font-bold transition cursor-pointer"
        >
          Salir Admin
        </button>
      </div>

      {/* Tabs con scroll horizontal: 8 tabs exactamente */}
      <div className="flex gap-2 p-3 overflow-x-auto bg-[#1A1A1A] no-scrollbar">
        <button
          onClick={() => setTab('stats')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'stats' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          📊 Estadísticas
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'users' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          👥 Usuarios
        </button>
        <button
          onClick={() => setTab('subs')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'subs' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          💳 Suscripciones
        </button>
        <button
          onClick={() => setTab('notifications')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'notifications' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          🔔 Notificaciones
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'logs' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          📝 Logs
        </button>
        <button
          onClick={() => setTab('support')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'support' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          💬 Soporte
        </button>
        <button
          onClick={() => setTab('cms')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'cms' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          🎨 CMS
        </button>
        <button
          onClick={() => setTab('comunidad_admin')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'comunidad_admin' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          🌟 Comunidad Admin
        </button>
        <button
          onClick={() => setTab('config')}
          className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition cursor-pointer ${
            tab === 'config' ? 'bg-white text-black' : 'bg-[#2A2A40] text-white border border-[#3A3A55]'
          }`}
        >
          ⚙️ Config
        </button>
      </div>

      {/* TAB 1: ESTADÍSTICAS */}
      {tab === 'stats' && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Total Registros:</p>
            <p className="text-2xl font-black text-yellow-400">{users.length}</p>
            <p className="text-xs text-slate-400 mt-1">Usuarios en Firebase</p>
          </div>
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Total Eventos:</p>
            <p className="text-2xl font-black text-cyan-400">{logs.length}</p>
            <p className="text-xs text-slate-400 mt-1">lactancia, pañales, sueño</p>
          </div>
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Total Anuncios:</p>
            <p className="text-2xl font-black text-amber-400">{announcements.length}</p>
            <p className="text-xs text-slate-400 mt-1">Notificaciones en sistema</p>
          </div>
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
            <p className="text-xs text-gray-400">Tickets de Soporte:</p>
            <p className="text-2xl font-black text-emerald-400">{supportMsgs.length}</p>
            <p className="text-xs text-slate-400 mt-1">Mensajes recibidos</p>
          </div>
        </div>
      )}

      {/* TAB 2: USUARIOS (CON BUSCADOR FUNCIONAL QUE ARREGLA EL HUECO) */}
      {tab === 'users' && (
        <div className="p-4 max-w-4xl mx-auto">
          {/* BUSCADOR HABILITADO Y FUNCIONAL */}
          <input
            placeholder="🔍 Buscar por bebé o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-full bg-[#2A2A40] border border-[#3A3A55] text-white mb-4 outline-none focus:border-amber-400 placeholder-gray-400 text-sm px-4"
          />

          {filteredUsers.length === 0 ? (
            <div className="bg-[#2A2A40] border border-[#3A3A55] p-6 rounded-2xl text-center text-xs text-gray-400">
              {search ? 'No se encontraron usuarios para tu búsqueda' : 'No hay usuarios registrados'}
            </div>
          ) : (
            filteredUsers.map((u: any) => {
              const currentStatus = u.status || 'activo';
              return (
                <div key={u.id} className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-black text-yellow-400">👶 Bebé: {u.babyName}</p>
                      <p className="text-sm">📧 Email: {u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      currentStatus === 'bloqueado' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      currentStatus === 'revisión' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {currentStatus}
                    </span>
                  </div>

                  <p className="text-sm flex gap-2 items-center mb-1">
                    🔑 Contraseña: <span>{showPass[u.id] ? u.password : '••••'}</span>{' '}
                    <button
                      onClick={() => togglePass(u.id)}
                      className="bg-white text-black px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer"
                    >
                      👁 Ver
                    </button>
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    📅 Registro (Fecha y Hora): {u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'} • ⚖️ {u.weight || '-'}kg • 📏 {u.height || '-'}cm
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#3A3A55]">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-slate-200"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={() => updateUserStatus(u.id, 'revisión')}
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-amber-500/30"
                    >
                      Revisión
                    </button>
                    <button
                      onClick={() => updateUserStatus(u.id, currentStatus === 'bloqueado' ? 'activo' : 'bloqueado')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition ${
                        currentStatus === 'bloqueado'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}
                    >
                      {currentStatus === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      onClick={() => deleteUserCompletely(u.id)}
                      className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-red-500/30"
                    >
                      Eliminar cuenta por completo
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {selectedUser && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-2xl w-full max-w-sm">
                <h3 className="font-black mb-2 text-lg text-white">{selectedUser.babyName}</h3>
                <p className="text-xs text-slate-300">Email: {selectedUser.email}</p>
                <p className="text-xs text-slate-300">Nace: {selectedUser.birthDate || '-'}</p>
                <p className="text-xs text-slate-300">Género: {selectedUser.gender || '-'}</p>
                <p className="text-xs text-slate-300">Peso: {selectedUser.weight || '-'} kg</p>
                <p className="text-xs text-slate-300">Talla: {selectedUser.height || '-'} cm</p>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-full mt-4 bg-white text-black font-bold py-2 rounded-full cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUSCRIPCIONES */}
      {tab === 'subs' && (
        <div className="p-4 max-w-4xl mx-auto">
          {users.length === 0 ? (
            <div className="bg-[#2A2A40] border border-[#3A3A55] p-6 rounded-2xl text-center text-xs text-gray-400">
              No hay usuarios registrados
            </div>
          ) : (
            users.map((u: any) => (
              <div
                key={u.id}
                className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl mb-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{u.babyName}</p>
                  <p className="text-xs text-gray-400">{localStorage.getItem('sub_' + u.id) || 'Gratis'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => activatePremium(u.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer"
                  >
                    Activar Premium
                  </button>
                  <button
                    onClick={() => resetFree(u.id)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer"
                  >
                    Gratis
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: 🔔 NOTIFICACIONES */}
      {tab === 'notifications' && (
        <div className="p-4 max-w-4xl mx-auto">
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-black text-sm text-amber-400">🔔 Enviar anuncio a Inicio & Push Web</h2>
              <button
                onClick={() => setShowOneSignalConfig(!showOneSignalConfig)}
                className="text-[11px] text-gray-400 hover:text-amber-300 underline cursor-pointer"
              >
                {showOneSignalConfig ? 'Ocultar claves OneSignal' : '⚙️ Configurar OneSignal'}
              </button>
            </div>

            {showOneSignalConfig && (
              <div className="mb-3 p-3 bg-black/40 border border-[#3A3A55] rounded-xl space-y-2">
                <p className="text-[11px] text-gray-300 font-bold">Credenciales OneSignal (Web Push iOS / Android):</p>
                <input
                  value={oneSignalAppId}
                  onChange={(e) => setOneSignalAppId(e.target.value)}
                  placeholder="OneSignal App ID (ej: 8a6f3b4c-...)"
                  className="w-full p-2 rounded-xl bg-black border border-[#3A3A55] text-white text-xs px-3 outline-none focus:border-amber-400"
                />
                <input
                  type="password"
                  value={oneSignalRestKey}
                  onChange={(e) => setOneSignalRestKey(e.target.value)}
                  placeholder="OneSignal REST API Key (Basic key)"
                  className="w-full p-2 rounded-xl bg-black border border-[#3A3A55] text-white text-xs px-3 outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleSaveOneSignalKeys}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer"
                >
                  Guardar Claves OneSignal
                </button>
              </div>
            )}

            <div className="space-y-2">
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Título del anuncio..."
                className="w-full p-2.5 rounded-full bg-black border border-[#3A3A55] text-white text-sm px-4 outline-none focus:border-amber-400"
              />
              <textarea
                value={notifMsg}
                onChange={(e) => setNotifMsg(e.target.value)}
                placeholder="Mensaje de la notificación para los padres..."
                rows={3}
                className="w-full p-3 rounded-2xl bg-black border border-[#3A3A55] text-white text-sm outline-none focus:border-amber-400 resize-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSendNow}
                  className="flex-1 bg-white text-black font-bold py-2.5 rounded-full text-xs cursor-pointer hover:bg-slate-200 transition"
                >
                  🚀 Enviar ahora
                </button>
                <button
                  onClick={handleScheduleTomorrow}
                  className="flex-1 bg-[#1E1E2E] border border-[#3A3A55] text-white font-bold py-2.5 rounded-full text-xs cursor-pointer hover:bg-[#2A2A40] transition"
                >
                  📅 Programar para mañana
                </button>
              </div>
            </div>
          </div>

          <h3 className="font-black text-sm mb-2 text-slate-300">Historial de Notificaciones</h3>
          {announcements.length === 0 ? (
            <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl text-center text-xs text-gray-400">
              No hay notificaciones enviadas aún
            </div>
          ) : (
            announcements.map((a: any) => (
              <div
                key={a.id}
                className="bg-[#2A2A40] border border-[#3A3A55] p-3 rounded-2xl mb-2 flex justify-between items-start"
              >
                <div>
                  <p className="font-bold text-yellow-400 text-sm">{a.title}</p>
                  <p className="text-xs text-slate-200 mt-0.5">{a.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    📅 {new Date(a.date).toLocaleString()} • {a.scheduled ? '⏰ Programada' : '✅ Enviada'} • 👁️{' '}
                    {a.opens || 0} aperturas
                  </p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-red-500/30 ml-2"
                >
                  Borrar
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: 📝 LOGS AGRUPADO POR USUARIO */}
      {tab === 'logs' && (
        <div className="p-4 max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="font-black text-sm text-cyan-400">📝 Registro de Actividad por Usuario (Logs)</h2>
              <p className="text-xs text-gray-400">Selecciona un usuario para ver su bitácora detallada de eventos.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer transition"
              >
                📥 Exportar Todo (CSV)
              </button>
              <button
                onClick={clearLogs}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer transition"
              >
                🗑️ Borrar Todo
              </button>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="bg-[#2A2A40] border border-[#3A3A55] p-6 rounded-2xl text-center text-xs text-gray-400">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map((u: any) => {
                const userLogs = logs.filter((l: any) => {
                  const bName = l.babyName || 'Mathews';
                  return bName.toLowerCase() === (u.babyName || '').toLowerCase();
                });
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedLogUserModal(u)}
                    className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl hover:border-cyan-400 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-black text-yellow-400 text-sm">👶 Bebé: {u.babyName}</p>
                        <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                          {userLogs.length} eventos
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">📧 {u.email}</p>
                      <p className="text-[11px] text-gray-400">
                        📅 Registro: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#3A3A55] flex justify-between items-center text-xs text-cyan-300 font-bold">
                      <span>Ver bitácora detallada →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal de Logs Detallados por Usuario */}
          {selectedLogUserModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#3A3A55]">
                  <div>
                    <h3 className="font-black text-base text-yellow-400">
                      📝 Bitácora de Bebé: {selectedLogUserModal.babyName}
                    </h3>
                    <p className="text-xs text-gray-400">Email: {selectedLogUserModal.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLogUserModal(null)}
                    className="bg-white text-black font-bold px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-slate-200"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                {(() => {
                  const userLogsList = logs.filter((l: any) => {
                    const bName = l.babyName || 'Mathews';
                    return bName.toLowerCase() === (selectedLogUserModal.babyName || '').toLowerCase();
                  });

                  if (userLogsList.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-gray-400 bg-black/40 rounded-2xl">
                        Este usuario aún no tiene registros de actividad (lactancia, pañal, sueño).
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {userLogsList.map((item: any, idx: number) => {
                        const timeAgo = formatLogTimeAgo(item.timestamp, item.date, item.time);
                        const fullDate = item.timestamp
                          ? new Date(item.timestamp).toLocaleString()
                          : `${item.date || ''} ${item.time || ''}`;

                        return (
                          <div
                            key={item.id || idx}
                            className="bg-black/50 border border-[#3A3A55] p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">
                                <span className="text-cyan-400 uppercase font-black">{item.type}</span>{' '}
                                <span className="text-gray-400 font-normal">({timeAgo})</span>
                              </p>
                              <p className="text-[11px] text-slate-300 mt-0.5">{item.detail || 'Sin detalles'}</p>
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-3">{fullDate}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: 💬 SOPORTE BIDIRECCIONAL */}
      {tab === 'support' && (
        <div className="p-4 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-black text-sm text-slate-200">Bandeja de Mensajes de Soporte</h2>
              <p className="text-[11px] text-gray-400">Gestiona y responde tickets de usuarios en tiempo real</p>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="bg-white text-black font-bold px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-slate-200 transition"
            >
              + Nuevo Ticket
            </button>
          </div>

          {supportMsgs.length === 0 ? (
            <div className="bg-[#2A2A40] border border-[#3A3A55] p-6 rounded-2xl text-center text-xs text-gray-400">
              No hay tickets de soporte abiertos
            </div>
          ) : (
            <div className="space-y-3">
              {supportMsgs.map((m: any) => (
                <div key={m.id} className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white text-sm">
                        👶 {m.babyName}{' '}
                        <span className="text-xs text-gray-400 font-normal">({m.email})</span>
                      </p>
                      <p className="text-xs text-yellow-400 font-bold mt-0.5">{m.subject}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === 'resuelto'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {m.status === 'resuelto' ? '🟢 Resuelto' : '🟡 Abierto'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 bg-black/40 p-2.5 rounded-xl border border-[#3A3A55]/60 mb-2 leading-relaxed">
                    {m.message}
                  </p>

                  {m.adminReply && (
                    <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl mb-2">
                      <span className="font-bold">Respuesta del Admin:</span> {m.adminReply}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 mb-3">📅 {new Date(m.date).toLocaleString()}</p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenReply(m)}
                      className="bg-white text-black font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer hover:bg-slate-200"
                    >
                      💬 Responder
                    </button>
                    <button
                      onClick={() => handleMarkResolved(m.id)}
                      className={`font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer transition ${
                        m.status === 'resuelto'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {m.status === 'resuelto' ? 'Reabrir ticket' : '✓ Marcar Resuelto'}
                    </button>
                    <button
                      onClick={() => handleDeleteSupport(m.id)}
                      className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold px-3 py-1.5 rounded-full text-xs cursor-pointer"
                    >
                      Borrar mensaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Responder Ticket */}
          {replyingTicket && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl w-full max-w-md animate-in fade-in zoom-in-95">
                <h3 className="font-black text-sm text-white mb-1">
                  💬 Responder a {replyingTicket.babyName}
                </h3>
                <p className="text-xs text-gray-400 mb-3">Email: {replyingTicket.email}</p>

                <div className="bg-black/40 p-2.5 rounded-xl border border-[#3A3A55] mb-3 text-xs text-slate-300">
                  <p className="font-bold text-amber-400">{replyingTicket.subject}</p>
                  <p className="mt-1 text-slate-300">{replyingTicket.message}</p>
                </div>

                <label className="text-xs font-bold text-slate-300 block mb-1">Tu Respuesta como Administrador:</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe la solución detallada para el usuario..."
                  rows={4}
                  className="w-full p-3 rounded-2xl bg-black border border-[#3A3A55] text-white text-xs outline-none focus:border-amber-400 resize-none"
                />

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setReplyingTicket(null);
                      setReplyText('');
                    }}
                    className="flex-1 bg-[#1E1E2E] border border-[#3A3A55] text-white font-bold py-2 rounded-full text-xs cursor-pointer hover:bg-[#3A3A55]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveReply}
                    className="flex-1 bg-white text-black font-bold py-2 rounded-full text-xs cursor-pointer hover:bg-slate-200"
                  >
                    Guardar y Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Crear Nuevo Ticket */}
          {showNewTicketModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl w-full max-w-md animate-in fade-in zoom-in-95">
                <h3 className="font-black text-sm text-white mb-3">+ Crear Nuevo Ticket de Soporte</h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Nombre del Bebé / Usuario:</label>
                    <input
                      value={newTicketBaby}
                      onChange={(e) => setNewTicketBaby(e.target.value)}
                      placeholder="Ej: Mathews"
                      className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Correo Electrónico:</label>
                    <input
                      value={newTicketEmail}
                      onChange={(e) => setNewTicketEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Asunto:</label>
                    <input
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="Ej: Duda con vacunas"
                      className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Mensaje:</label>
                    <textarea
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      placeholder="Detalle de la consulta..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1 bg-[#1E1E2E] border border-[#3A3A55] text-white font-bold py-2 rounded-full text-xs cursor-pointer hover:bg-[#3A3A55]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewTicket}
                    className="flex-1 bg-white text-black font-bold py-2 rounded-full text-xs cursor-pointer hover:bg-slate-200"
                  >
                    Crear Ticket
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: 🎨 CMS */}
      {tab === 'cms' && (
        <div className="p-4 max-w-4xl mx-auto space-y-4">
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-4 rounded-2xl">
            <h2 className="font-black text-sm text-amber-400 mb-3">🎨 Personalización de Contenidos (CMS)</h2>

            {/* Banner Inicio URL */}
            <div className="mb-4">
              <label className="text-xs text-gray-300 block mb-1 font-bold">Banner Inicio URL imagen:</label>
              <div className="flex gap-2">
                <input
                  value={cmsBanner}
                  onChange={(e) => setCmsBanner(e.target.value)}
                  placeholder="https://ejemplo.com/banner.png"
                  className="flex-1 p-2.5 rounded-full bg-black border border-[#3A3A55] text-white text-sm px-4 outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#1E1E2E] border border-[#3A3A55] hover:bg-[#2A2A40] text-white font-bold px-3 py-2 rounded-full text-xs cursor-pointer whitespace-nowrap"
                >
                  📁 Subir imagen (base64)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPromo}
                  className="hidden"
                />
              </div>

              {cmsBanner && (
                <div className="mt-2 p-2 bg-black/40 rounded-xl border border-[#3A3A55]">
                  <p className="text-[10px] text-gray-400 mb-1">Previsualización Banner:</p>
                  <img src={cmsBanner} alt="Banner CMS" className="max-h-28 rounded-lg object-cover w-full" />
                </div>
              )}
            </div>

            {/* Texto Onboarding */}
            <div className="mb-4">
              <label className="text-xs text-gray-300 block mb-1 font-bold">Texto Onboarding Bienvenida:</label>
              <textarea
                value={cmsOnboarding}
                onChange={(e) => setCmsOnboarding(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-2xl bg-black border border-[#3A3A55] text-white text-sm outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Términos */}
            <div className="mb-4">
              <label className="text-xs text-gray-300 block mb-1 font-bold">Términos y Condiciones:</label>
              <textarea
                value={cmsTerms}
                onChange={(e) => setCmsTerms(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-2xl bg-black border border-[#3A3A55] text-white text-sm outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              onClick={saveCMS}
              className="w-full bg-white hover:bg-slate-200 text-black font-bold py-2.5 rounded-full text-sm cursor-pointer transition"
            >
              💾 Guardar Cambios CMS
            </button>
          </div>
        </div>
      )}

      {/* TAB: 🌟 COMUNIDAD ADMIN (FACEBOOK-STYLE FEED & USER INSPECTOR) */}
      {tab === 'comunidad_admin' && (
        <div className="p-4 max-w-4xl mx-auto space-y-6">
          {/* Creador de publicaciones */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl">
            <h2 className="font-black text-sm text-amber-400 mb-1">🌟 Comunidad de Mamás (Panel Estilo Facebook)</h2>
            <p className="text-xs text-gray-400 mb-4">Crea publicaciones oficiales, consejos o recursos interactivos para el muro de la comunidad.</p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Título de la publicación:</label>
                <input
                  value={newCommTitle}
                  onChange={(e) => setNewCommTitle(e.target.value)}
                  placeholder="Ej: Consejos clave para el sueño del bebé"
                  className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Categoría:</label>
                <select
                  value={newCommCategory}
                  onChange={(e) => setNewCommCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                >
                  <option value="Consejo">Consejo</option>
                  <option value="Nutrición">Nutrición</option>
                  <option value="Sueño">Sueño</option>
                  <option value="Anuncio Oficial">Anuncio Oficial</option>
                  <option value="Recurso Útil">Recurso Útil</option>
                </select>
              </div>
              <div>
                <label className="text-gray-300 font-bold block mb-1">Contenido de la publicación:</label>
                <textarea
                  value={newCommContent}
                  onChange={(e) => setNewCommContent(e.target.value)}
                  placeholder="Escribe el mensaje o guía para la comunidad..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>
              <button
                onClick={handleCreateCommunityPost}
                className="w-full bg-white hover:bg-slate-200 text-black font-bold py-2.5 rounded-full text-xs cursor-pointer transition"
              >
                + Publicar en la Comunidad
              </button>
            </div>
          </div>

          {/* Directorio de usuarias / mamás para inspeccionar */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl">
            <h3 className="font-black text-sm text-yellow-400 mb-2">👥 Usuarias / Mamás Registradas ({users.length})</h3>
            <p className="text-xs text-gray-400 mb-3">Toca cualquier usuaria para abrir su panel completo con todo lo que ha hecho, publicado y registrado.</p>

            {users.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 bg-black/40 rounded-2xl">
                No hay usuarias registradas aún
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u: any) => {
                  const userLogsCount = logs.filter((l: any) => (l.babyName || '').toLowerCase() === (u.babyName || '').toLowerCase()).length;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedCommunityUser(u)}
                      className="bg-black/50 border border-[#3A3A55] p-3.5 rounded-2xl hover:border-amber-400 transition cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-black text-yellow-400 text-xs">👶 Bebé: {u.babyName}</p>
                        <p className="text-[11px] text-gray-300">📧 {u.email}</p>
                        <p className="text-[10px] text-gray-400 mt-1">📊 {userLogsCount} eventos registrados</p>
                      </div>
                      <span className="bg-white text-black font-bold text-[10px] px-2.5 py-1 rounded-full">
                        Ver Panel →
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Muro / Feed de Publicaciones */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl">
            <h3 className="font-black text-sm text-slate-200 mb-3">📰 Muro de Publicaciones ({communityPosts.length})</h3>
            {communityPosts.length === 0 ? (
              <div className="bg-black/40 p-6 rounded-2xl text-center text-xs text-gray-400 border border-[#3A3A55]">
                No hay publicaciones en la comunidad
              </div>
            ) : (
              <div className="space-y-3">
                {communityPosts.map((p: any) => (
                  <div key={p.id} className="bg-black/60 border border-[#3A3A55] p-4 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-xs">
                          {p.author?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{p.author || 'Administrador'}</p>
                          <p className="text-[10px] text-gray-400">📅 {new Date(p.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        {p.category}
                      </span>
                    </div>

                    <p className="font-black text-sm text-amber-300">{p.title}</p>
                    <p className="text-slate-200 leading-relaxed">{p.content}</p>

                    <div className="flex justify-between items-center pt-2 border-t border-[#3A3A55]">
                      <span className="text-[11px] text-gray-400">❤️ {p.likes || 0} reacciones</span>
                      <button
                        onClick={() => handleDeleteCommunityPost(p.id)}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-red-500/30"
                      >
                        Eliminar post
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal de Panel Completo de Usuario / Mamá */}
          {selectedCommunityUser && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#2A2A40] border border-[#3A3A55] p-6 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-[#3A3A55]">
                  <div>
                    <h3 className="font-black text-lg text-yellow-400">👶 Panel Completo: {selectedCommunityUser.babyName}</h3>
                    <p className="text-xs text-gray-300">Email: {selectedCommunityUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCommunityUser(null)}
                    className="bg-white text-black font-bold px-3.5 py-1.5 rounded-full text-xs cursor-pointer hover:bg-slate-200"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-black/40 p-3 rounded-2xl border border-[#3A3A55]">
                    <p className="text-gray-400 text-[10px]">Fecha de Nace:</p>
                    <p className="font-bold text-white mt-0.5">{selectedCommunityUser.birthDate || '-'}</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-2xl border border-[#3A3A55]">
                    <p className="text-gray-400 text-[10px]">Peso actual:</p>
                    <p className="font-bold text-white mt-0.5">{selectedCommunityUser.weight || '-'} kg</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-2xl border border-[#3A3A55]">
                    <p className="text-gray-400 text-[10px]">Talla actual:</p>
                    <p className="font-bold text-white mt-0.5">{selectedCommunityUser.height || '-'} cm</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-xs text-cyan-400 mb-2">📜 Actividad y Logs Registrados:</h4>
                  {(() => {
                    const userLogs = logs.filter((l: any) => (l.babyName || '').toLowerCase() === (selectedCommunityUser.babyName || '').toLowerCase());
                    if (userLogs.length === 0) {
                      return <p className="text-xs text-gray-400 bg-black/30 p-3 rounded-xl">Sin eventos registrados aún.</p>;
                    }
                    return (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {userLogs.map((item: any, idx: number) => (
                          <div key={idx} className="bg-black/50 p-2.5 rounded-xl text-xs flex justify-between items-center border border-[#3A3A55]">
                            <div>
                              <span className="font-bold uppercase text-cyan-300">{item.type}</span>: {item.detail || 'Sin detalle'}
                            </div>
                            <span className="text-[10px] text-gray-400">{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: ⚙️ CONFIGURACIÓN Y PANEL ADMIN TOTALMENTE FUNCIONAL */}
      {tab === 'config' && (
        <div className="p-4 max-w-4xl mx-auto space-y-4">
          {/* IDENTIDAD Y PARÁMETROS DE LA APP */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl space-y-3">
            <h2 className="font-black text-sm text-yellow-400">⚙️ Configuración General de la Aplicación</h2>
            <p className="text-xs text-gray-400">Modifica los parámetros principales de la app en tiempo real.</p>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Nombre de la Aplicación:</label>
                <div className="flex gap-2">
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('bubblo_app_name', appName);
                      alert('Nombre guardado: ' + appName);
                    }}
                    className="bg-white text-black font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-200"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Precio Suscripción Premium ($):</label>
                <div className="flex gap-2">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('bubblo_price', price);
                      alert('Precio guardado: ' + price);
                    }}
                    className="bg-white text-black font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-200"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Moneda del Sistema:</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    localStorage.setItem('bubblo_currency', e.target.value);
                  }}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="MXN ($)">MXN ($)</option>
                  <option value="COP ($)">COP ($)</option>
                  <option value="ARS ($)">ARS ($)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">PIN / Contraseña de Administrador:</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-black border border-[#3A3A55] text-white outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('bubblo_admin_pin', adminPin);
                      alert('PIN de administrador actualizado con éxito');
                    }}
                    className="bg-amber-500 text-black font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-amber-600"
                  >
                    Actualizar PIN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE FLAGS */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl">
            <h3 className="font-black text-sm text-cyan-400 mb-3">🚩 Módulos y Feature Flags</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#3A3A55]">
                <div>
                  <p className="font-bold text-white">💉 Vacunas</p>
                  <p className="text-[10px] text-gray-400">Calendario y registro de dosis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.vacunas}
                    onChange={() => toggleFeature('vacunas')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#3A3A55]">
                <div>
                  <p className="font-bold text-white">🥣 Nutrición</p>
                  <p className="text-[10px] text-gray-400">Recetas AI y gestión de alimentos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.nutricion}
                    onChange={() => toggleFeature('nutricion')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-[#3A3A55]">
                <div>
                  <p className="font-bold text-white">📏 Crecimiento</p>
                  <p className="text-[10px] text-gray-400">Curvas y medidas de peso/talla</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.crecimiento}
                    onChange={() => toggleFeature('crecimiento')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>
            </div>
          </div>

          {/* MODO MANTENIMIENTO Y ACCIONES CLOUD */}
          <div className="bg-[#2A2A40] border border-[#3A3A55] p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A3A55]">
              <div>
                <h3 className="text-sm font-bold text-red-400">🛠️ Modo Mantenimiento</h3>
                <p className="text-xs text-gray-400">Bloquea la app mostrando pantalla de mantenimiento.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenance}
                  onChange={toggleMaintenance}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Deseas descargar un respaldo completo en formato JSON de todos los datos de la app?')) {
                  const backup = {
                    users,
                    logs,
                    communityPosts,
                    supportMsgs,
                    announcements,
                    date: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `baby_day_backup_${Date.now()}.json`;
                  a.click();
                }
              }}
              className="w-full bg-[#1E1E2E] border border-[#3A3A55] hover:bg-[#3A3A55] text-white font-bold py-3 rounded-full text-xs transition cursor-pointer"
            >
              📥 Exportar Base de Datos (JSON Backup)
            </button>

            <button
              onClick={() => {
                if (window.confirm('¿Resetear caché temporal y sincronizar con Firestore?')) {
                  const keep = ['bubblo_users', 'bubblo_currentUser', 'bubblo_baby', 'bubblo_events'];
                  const keysToRemove: string[] = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && !keep.includes(k)) {
                      keysToRemove.push(k);
                    }
                  }
                  keysToRemove.forEach((k) => localStorage.removeItem(k));
                  window.location.reload();
                }
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-xs transition cursor-pointer"
            >
              🔄 Limpiar caché y sincronizar con Firestore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
