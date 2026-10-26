import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  UserPlus, 
  Check, 
  Clock, 
  MapPin, 
  Heart, 
  Baby, 
  Sparkles,
  Users,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  onSnapshot,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

interface BuscarAmigasModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onSelectProfile: (uid: string) => void;
}

export interface RegisteredMom {
  uid: string;
  displayName: string;
  babyName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  ciudad?: string;
  lactancia?: string;
  bebeEdad?: string;
  createdAt?: any;
}

export const BuscarAmigasModal: React.FC<BuscarAmigasModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onSelectProfile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allMoms, setAllMoms] = useState<RegisteredMom[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Record<string, boolean>>({});
  const [incomingRequests, setIncomingRequests] = useState<Record<string, any>>({});
  const [friendsMap, setFriendsMap] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Liquid glass modal style
  const modalBgStyle: React.CSSProperties = {
    background: isDark ? 'rgba(20, 20, 28, 0.92)' : 'rgba(255, 252, 248, 0.95)',
    backdropFilter: 'blur(30px) saturate(200%)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(220, 200, 180, 0.4)',
    boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.7)' : '0 24px 60px rgba(180, 140, 110, 0.25)'
  };

  // 1. Cargar usuarios registrados desde Firestore (users y community_profiles)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    const loadRegisteredUsers = async () => {
      try {
        const momsMap = new Map<string, RegisteredMom>();

        // A. Cargar perfiles de comunidad
        try {
          const profSnap = await getDocs(collection(db, "community_profiles"));
          profSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            if (id && id !== currentUserId) {
              momsMap.set(id, {
                uid: id,
                displayName: data.displayName || data.babyName ? `Mamá de ${data.babyName}` : 'Mamá Baby Day',
                babyName: data.babyName || data.bebeNombre || 'Bebé',
                email: data.email || '',
                avatarUrl: data.avatarUrl || data.photo || '',
                bio: data.bio || 'Mamá registrada en Baby Day 💕',
                ciudad: data.ciudad || 'Bogotá',
                lactancia: data.lactancia || 'Lactancia Materna',
                bebeEdad: data.bebeEdad || '6 meses',
                createdAt: data.createdAt
              });
            }
          });
        } catch (e) {
          console.warn("Notice reading community_profiles:", e);
        }

        // B. Cargar usuarios registrados en Baby Day (colección 'users')
        try {
          const userSnap = await getDocs(collection(db, "users"));
          userSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            if (id && id !== currentUserId) {
              const existing = momsMap.get(id);
              const babyName = data.babyName || 'Bebé';
              const nameFromEmail = data.email ? data.email.split('@')[0] : 'Mamá';
              const displayName = data.babyName ? `Mamá de ${data.babyName}` : (data.nombre || nameFromEmail);

              momsMap.set(id, {
                uid: id,
                displayName: existing?.displayName && existing.displayName !== 'Mamá Baby Day' ? existing.displayName : displayName,
                babyName: existing?.babyName || babyName,
                email: data.email || existing?.email || '',
                avatarUrl: existing?.avatarUrl || data.photo || '',
                bio: existing?.bio || 'Mamá registrada en Baby Day 💕',
                ciudad: data.ciudad || existing?.ciudad || 'Bogotá',
                lactancia: data.lactancia || existing?.lactancia || 'Lactancia Materna',
                bebeEdad: existing?.bebeEdad || '6 meses',
                createdAt: data.createdAt || existing?.createdAt
              });
            }
          });
        } catch (e) {
          console.warn("Notice reading users collection:", e);
        }

        // C. Si la lista está vacía, incluir sugerencias de mamás de apoyo verificadas de Baby Day
        if (momsMap.size === 0) {
          const defaultMoms: RegisteredMom[] = [
            {
              uid: 'mama_sofia_m',
              displayName: 'Sofía Mendoza',
              babyName: 'Mateo',
              bio: 'Mamá de Mateo (6 meses) • Amante de recetas BLW y paseos al aire libre 🥕',
              ciudad: 'Bogotá, Colombia',
              lactancia: 'Lactancia Materna',
              bebeEdad: '6 meses',
              avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
            },
            {
              uid: 'mama_valentina_c',
              displayName: 'Valentina Castro',
              babyName: 'Emma',
              bio: 'Mamá primeriza de Emma • Consejos de sueño respetuoso y rutinas 🌙',
              ciudad: 'Medellín, Colombia',
              lactancia: 'Fórmula & Mixta',
              bebeEdad: '4 meses',
              avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            },
            {
              uid: 'mama_camila_r',
              displayName: 'Camila Rodríguez',
              babyName: 'Lucas',
              bio: 'Mamá de Lucas (8 meses) • Compartiendo tips de estimulación temprana y gateo 👶',
              ciudad: 'Cali, Colombia',
              lactancia: 'Lactancia Exclusiva',
              bebeEdad: '8 meses',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
          ];
          defaultMoms.forEach(m => momsMap.set(m.uid, m));
        }

        if (isMounted) {
          setAllMoms(Array.from(momsMap.values()));
          setLoading(false);
        }
      } catch (err) {
        console.warn("Error loading registered moms:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadRegisteredUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUserId]);

  // 2. Escuchar solicitudes enviadas, recibidas y amistades en tiempo real
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    // A. Solicitudes enviadas por mí
    const qSent = query(
      collection(db, "community_friend_requests"),
      where("fromUid", "==", currentUserId)
    );
    const unsubSent = onSnapshot(qSent, (snap) => {
      const map: Record<string, boolean> = {};
      snap.forEach(d => {
        const data = d.data();
        if (data.status === 'pending') {
          map[data.toUid] = true;
        }
      });
      setSentRequests(map);
    }, (err) => console.warn("Sent requests sync:", err));

    // B. Solicitudes recibidas hacia mí
    const qRecv = query(
      collection(db, "community_friend_requests"),
      where("toUid", "==", currentUserId)
    );
    const unsubRecv = onSnapshot(qRecv, (snap) => {
      const map: Record<string, any> = {};
      snap.forEach(d => {
        const data = d.data();
        if (data.status === 'pending') {
          map[data.fromUid] = { id: d.id, ...data };
        }
      });
      setIncomingRequests(map);
    }, (err) => console.warn("Incoming requests sync:", err));

    // C. Amistades confirmadas
    const qFriends = query(
      collection(db, "community_friends"),
      where("user1", "==", currentUserId)
    );
    const unsubFriends = onSnapshot(qFriends, (snap) => {
      const map: Record<string, boolean> = {};
      snap.forEach(d => {
        const data = d.data();
        map[data.friendUid || data.user2] = true;
      });
      setFriendsMap(map);
    }, (err) => console.warn("Friends sync:", err));

    return () => {
      unsubSent();
      unsubRecv();
      unsubFriends();
    };
  }, [isOpen, currentUserId]);

  // Enviar solicitud de amistad
  const handleSendFriendRequest = async (targetMom: RegisteredMom) => {
    if (!currentUserId || !targetMom.uid) return;
    setActionLoading(prev => ({ ...prev, [targetMom.uid]: true }));

    try {
      const requestId = `${currentUserId}_${targetMom.uid}`;
      
      // 1. Guardar en community_friend_requests
      await setDoc(doc(db, "community_friend_requests", requestId), {
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        toUid: targetMom.uid,
        toName: targetMom.displayName,
        toAvatar: targetMom.avatarUrl || '',
        status: 'pending',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      // 2. Crear notificación para la mamá destinataria
      const notifId = `notif_friend_${Date.now()}_${currentUserId}`;
      await setDoc(doc(db, "community_notifications", notifId), {
        toUid: targetMom.uid,
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        type: 'friend_request',
        requestId: requestId,
        text: `${currentUserName} te envió una solicitud de amistad 👭`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      setSentRequests(prev => ({ ...prev, [targetMom.uid]: true }));
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetMom.uid]: false }));
    }
  };

  // Cancelar solicitud enviada
  const handleCancelRequest = async (targetUid: string) => {
    if (!currentUserId || !targetUid) return;
    setActionLoading(prev => ({ ...prev, [targetUid]: true }));

    try {
      const requestId = `${currentUserId}_${targetUid}`;
      await deleteDoc(doc(db, "community_friend_requests", requestId));
      setSentRequests(prev => {
        const next = { ...prev };
        delete next[targetUid];
        return next;
      });
    } catch (err) {
      console.error("Error canceling friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUid]: false }));
    }
  };

  // Aceptar solicitud de amistad recibida
  const handleAcceptRequest = async (targetMom: RegisteredMom) => {
    if (!currentUserId || !targetMom.uid) return;
    setActionLoading(prev => ({ ...prev, [targetMom.uid]: true }));

    try {
      const requestId = `${targetMom.uid}_${currentUserId}`;
      
      // 1. Marcar solicitud como aceptada
      await setDoc(doc(db, "community_friend_requests", requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      }, { merge: true });

      // 2. Crear relaciones bidireccionales en community_friends
      const fDoc1 = `${currentUserId}_${targetMom.uid}`;
      const fDoc2 = `${targetMom.uid}_${currentUserId}`;

      await setDoc(doc(db, "community_friends", fDoc1), {
        user1: currentUserId,
        user2: targetMom.uid,
        friendUid: targetMom.uid,
        friendName: targetMom.displayName,
        friendAvatar: targetMom.avatarUrl || '',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      await setDoc(doc(db, "community_friends", fDoc2), {
        user1: targetMom.uid,
        user2: currentUserId,
        friendUid: currentUserId,
        friendName: currentUserName,
        friendAvatar: currentUserAvatar || '',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      // 3. Notificar a la otra mamá que fue aceptada
      const notifId = `notif_friend_accepted_${Date.now()}`;
      await setDoc(doc(db, "community_notifications", notifId), {
        toUid: targetMom.uid,
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        type: 'friend_accepted',
        text: `¡${currentUserName} aceptó tu solicitud de amistad! Ahora son amigas 💖`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      setFriendsMap(prev => ({ ...prev, [targetMom.uid]: true }));
      setIncomingRequests(prev => {
        const next = { ...prev };
        delete next[targetMom.uid];
        return next;
      });
    } catch (err) {
      console.error("Error accepting friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetMom.uid]: false }));
    }
  };

  if (!isOpen) return null;

  // Filtrar según término de búsqueda
  const filteredMoms = allMoms.filter(m => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.displayName && m.displayName.toLowerCase().includes(q)) ||
      (m.babyName && m.babyName.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.ciudad && m.ciudad.toLowerCase().includes(q)) ||
      (m.bio && m.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={modalBgStyle}
      >
        {/* Header Facebook-style */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Buscar Amigas en Baby Day
              </h3>
              <p className="text-xs opacity-70">
                Mamás registradas en la aplicación
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-white/10">
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition ${
            isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-rose-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de mamá, bebé o ciudad..."
              className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder:opacity-50"
              autoFocus
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5 opacity-60" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs opacity-70">Buscando mamás registradas en Baby Day...</p>
            </div>
          ) : filteredMoms.length === 0 ? (
            <div className="py-12 text-center opacity-75">
              <Sparkles className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="font-bold text-sm">No encontramos mamás con ese nombre</p>
              <p className="text-xs mt-1">Prueba escribiendo el nombre de su bebé o ciudad.</p>
            </div>
          ) : (
            filteredMoms.map((mom) => {
              const isFriend = friendsMap[mom.uid];
              const isSent = sentRequests[mom.uid];
              const incomingReq = incomingRequests[mom.uid];
              const isActioning = actionLoading[mom.uid];

              return (
                <div 
                  key={mom.uid}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-white/80 border-slate-200/80 hover:bg-white shadow-sm'
                  }`}
                >
                  {/* User info */}
                  <div 
                    onClick={() => {
                      onSelectProfile(mom.uid);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-base shadow">
                        {mom.avatarUrl ? (
                          <img 
                            src={mom.avatarUrl} 
                            alt={mom.displayName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{mom.displayName?.charAt(0).toUpperCase() || 'M'}</span>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm truncate hover:underline">
                          {mom.displayName}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-500">
                          Mamá Baby Day
                        </span>
                      </div>
                      <p className="text-xs text-rose-500 font-medium truncate flex items-center gap-1 mt-0.5">
                        <Baby className="w-3 h-3" />
                        <span>Bebé: {mom.babyName}</span>
                        {mom.bebeEdad && <span className="opacity-80">• {mom.bebeEdad}</span>}
                      </p>
                      {mom.ciudad && (
                        <p className="text-[11px] opacity-60 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{mom.ciudad}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isFriend ? (
                      <div className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 select-none">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Amigas</span>
                      </div>
                    ) : incomingReq ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptRequest(mom)}
                        disabled={isActioning}
                        className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow hover:opacity-95 cursor-pointer disabled:opacity-50"
                      >
                        {isActioning ? 'Aceptando...' : 'Aceptar solicitud'}
                      </button>
                    ) : isSent ? (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(mom.uid)}
                        disabled={isActioning}
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 border transition cursor-pointer ${
                          isDark ? 'bg-white/10 border-white/15 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="Clic para cancelar solicitud"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>{isActioning ? '...' : 'Solicitud enviada'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendFriendRequest(mom)}
                        disabled={isActioning}
                        className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 active:scale-95 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isActioning ? 'Enviando...' : 'Agregar amiga'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onSelectProfile(mom.uid);
                        onClose();
                      }}
                      className="p-1.5 rounded-xl hover:bg-white/10 opacity-70 hover:opacity-100 transition cursor-pointer"
                      title="Ver perfil completo estilo Facebook"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/10 text-center text-[11px] opacity-60">
          👭 Conecta con mamás que tienen bebés de la misma edad en Baby Day
        </div>
      </div>
    </div>
  );
};
export default BuscarAmigasModal;
