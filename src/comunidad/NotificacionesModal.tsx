import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  UserPlus, 
  Heart, 
  MessageSquare, 
  Sparkles,
  Share2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface NotificacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onNavigateProfile: (uid: string) => void;
}

export const NotificacionesModal: React.FC<NotificacionesModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onNavigateProfile
}) => {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const modalBgStyle: React.CSSProperties = {
    background: isDark ? 'rgba(20, 20, 28, 0.94)' : 'rgba(255, 252, 248, 0.96)',
    backdropFilter: 'blur(30px) saturate(200%)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(220, 200, 180, 0.4)',
    boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.7)' : '0 24px 60px rgba(180, 140, 110, 0.25)'
  };

  // Escuchar notificaciones del usuario actual en tiempo real
  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    setLoading(true);

    const q = query(
      collection(db, "community_notifications"),
      where("toUid", "==", currentUserId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });

      list.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || a.timestamp || 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || b.timestamp || 0);
        return tB - tA;
      });

      setNotifs(list);
      setLoading(false);
    }, (err) => {
      console.warn("Notifications sync notice:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, currentUserId]);

  // Aceptar solicitud de amistad desde notificaciones
  const handleAcceptFriendRequest = async (notif: any) => {
    if (!currentUserId || !notif.fromUid) return;
    setProcessingId(notif.id);

    try {
      const targetUid = notif.fromUid;
      const targetName = notif.fromName || 'Mamá Baby Day';
      const targetAvatar = notif.fromAvatar || '';

      // 1. Marcar solicitud en community_friend_requests como aceptada
      const requestId = notif.requestId || `${targetUid}_${currentUserId}`;
      await setDoc(doc(db, "community_friend_requests", requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      }, { merge: true });

      // 2. Crear relaciones bidireccionales en community_friends
      await setDoc(doc(db, "community_friends", `${currentUserId}_${targetUid}`), {
        user1: currentUserId,
        user2: targetUid,
        friendUid: targetUid,
        friendName: targetName,
        friendAvatar: targetAvatar,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      await setDoc(doc(db, "community_friends", `${targetUid}_${currentUserId}`), {
        user1: targetUid,
        user2: currentUserId,
        friendUid: currentUserId,
        friendName: currentUserName,
        friendAvatar: currentUserAvatar || '',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      // 3. Notificar a la otra mamá
      const notifId = `notif_friend_accepted_${Date.now()}`;
      await setDoc(doc(db, "community_notifications", notifId), {
        toUid: targetUid,
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        type: 'friend_accepted',
        text: `¡${currentUserName} aceptó tu solicitud de amistad! Ahora son amigas 💖`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      // 4. Actualizar notificación actual
      await updateDoc(doc(db, "community_notifications", notif.id), {
        actionDone: 'accepted',
        read: true
      });
    } catch (err) {
      console.error("Error accepting request in notifications:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Rechazar / eliminar solicitud
  const handleRejectFriendRequest = async (notif: any) => {
    if (!currentUserId) return;
    setProcessingId(notif.id);

    try {
      const requestId = notif.requestId || `${notif.fromUid}_${currentUserId}`;
      await deleteDoc(doc(db, "community_friend_requests", requestId));
      await deleteDoc(doc(db, "community_notifications", notif.id));
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Eliminar notificación normal
  const handleDeleteNotif = async (notifId: string) => {
    try {
      await deleteDoc(doc(db, "community_notifications", notifId));
    } catch (err) {
      console.error("Error deleting notif:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        style={modalBgStyle}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Notificaciones y Solicitudes
              </h3>
              <p className="text-xs opacity-70">
                Amistades e interacciones de mamás
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

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs opacity-70">Cargando notificaciones...</p>
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-12 text-center opacity-75">
              <Sparkles className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="font-bold text-sm">No tienes notificaciones pendientes</p>
              <p className="text-xs mt-1">Aquí verás las solicitudes de amistad y reacciones de otras mamás 💕</p>
            </div>
          ) : (
            notifs.map((n) => {
              const isFriendReq = n.type === 'friend_request';
              const isAccepted = n.actionDone === 'accepted';
              const isProcessing = processingId === n.id;

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div 
                      onClick={() => {
                        if (n.fromUid) {
                          onNavigateProfile(n.fromUid);
                          onClose();
                        }
                      }}
                      className="relative shrink-0 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-500 text-white font-bold flex items-center justify-center">
                        {n.fromAvatar ? (
                          <img src={n.fromAvatar} alt={n.fromName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{n.fromName?.charAt(0).toUpperCase() || 'M'}</span>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] bg-rose-500 text-white">
                        {isFriendReq ? '👭' : n.type === 'like' ? '❤️' : '💬'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm leading-snug">
                        <span 
                          onClick={() => {
                            if (n.fromUid) {
                              onNavigateProfile(n.fromUid);
                              onClose();
                            }
                          }}
                          className="font-bold hover:underline cursor-pointer mr-1"
                        >
                          {n.fromName || 'Una mamá'}
                        </span>
                        <span>{n.text || 'interactuó contigo'}</span>
                      </p>
                      <span className="text-[10px] opacity-50 block mt-1">
                        hace unos momentos
                      </span>

                      {/* Friend request buttons */}
                      {isFriendReq && (
                        <div className="mt-3 flex items-center gap-2">
                          {isAccepted ? (
                            <div className="py-1 px-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 border border-emerald-500/20">
                              <Check className="w-3.5 h-3.5" />
                              <span>Amiga agregada</span>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptFriendRequest(n)}
                                disabled={isProcessing}
                                className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? 'Aceptando...' : 'Confirmar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectFriendRequest(n)}
                                disabled={isProcessing}
                                className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-white/20 transition cursor-pointer"
                              >
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Delete single notification */}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotif(n.id)}
                      className="p-1 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-500 transition cursor-pointer shrink-0"
                      title="Borrar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default NotificacionesModal;
