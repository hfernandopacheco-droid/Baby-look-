import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  User, 
  Users, 
  Heart, 
  Check, 
  Copy, 
  Sparkles, 
  Send, 
  Search,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PostData } from './PostCard';

interface CompartirModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostData | null;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onShareSuccess?: (msg: string) => void;
}

type ShareDestino = 'perfil' | 'grupos' | 'usuario';

const COMUNIDAD_GRUPOS = [
  { id: 'general', name: 'Mamás Baby Day', desc: 'Espacio general de la comunidad', icon: '🍼', members: '1,420 mamás' },
  { id: 'lactancia', name: 'Lactancia & Destete', desc: 'Dudas, posturas y banco de leche', icon: '🤱', members: '890 mamás' },
  { id: 'solidos', name: 'Alimentación BLW & Papillas', desc: 'Recetas y cortes seguros', icon: '🍲', members: '1,120 mamás' },
  { id: 'sueno', name: 'Sueño & Rutinas Nocturnas', desc: 'Consejos para siestas y noches', icon: '🌙', members: '940 mamás' },
  { id: 'primerizas', name: 'Mamás Primerizas', desc: 'Acompañamiento sin juicios', icon: '💕', members: '1,830 mamás' }
];

const DEFAULT_MAMAS = [
  { uid: 'sofia_m_user', name: 'Sofía M.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', bio: 'Mamá de Mateo (6 meses)' },
  { uid: 'valentina_c_user', name: 'Valentina C.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', bio: 'Mamá de Emma (1 año)' },
  { uid: 'camila_r_user', name: 'Camila R.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', bio: 'Mamá primeriza de Lucas' },
  { uid: 'elena_g_user', name: 'Elena G.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', bio: 'Crianza con amor y respeto' },
];

export const CompartirModal: React.FC<CompartirModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onShareSuccess
}) => {
  const [destino, setDestino] = useState<ShareDestino>('perfil');
  const [comentario, setComentario] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [communityUsers, setCommunityUsers] = useState<any[]>(DEFAULT_MAMAS);
  const [sharedTargets, setSharedTargets] = useState<Record<string, boolean>>({});

  // Cargar perfiles reales de Firestore si existen
  useEffect(() => {
    if (!isOpen) return;
    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, "community_profiles"), limit(10));
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.uid !== currentUserId) {
            list.push({
              uid: data.uid || d.id,
              name: data.displayName || 'Mamá Baby Day',
              avatar: data.avatarUrl || '',
              bio: data.bio || 'Miembro de la comunidad'
            });
          }
        });
        if (list.length > 0) {
          // Combinar con los defaults para tener variedad
          const existingIds = new Set(list.map(u => u.uid));
          const combined = [...list, ...DEFAULT_MAMAS.filter(u => !existingIds.has(u.uid))];
          setCommunityUsers(combined);
        }
      } catch (err) {
        console.warn("Notice fetching community profiles:", err);
      }
    };
    fetchProfiles();
  }, [isOpen, currentUserId]);

  if (!isOpen || !post) return null;

  // Liquid glass style
  const modalStyle: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.85)' : 'rgba(255, 248, 235, 0.82)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.75)',
    boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.5)' : '0 25px 60px rgba(180, 140, 110, 0.25)',
  };

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/comunidad?post=${post.id || ''}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
      if (onShareSuccess) onShareSuccess("¡Enlace copiado al portapapeles!");
    } catch {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2200);
    }
  };

  // 1. Compartir en mi perfil
  const handleShareToProfile = async () => {
    setIsSharing(true);
    try {
      const newPostPayload = {
        uid: currentUserId,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar || '',
        texto: comentario.trim() || `Compartió una publicación de ${post.authorName} 💕`,
        isShared: true,
        sharedPost: {
          id: post.id || '',
          uid: post.uid,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar || '',
          texto: post.texto || '',
          mediaUrls: post.mediaUrls || [],
          categoria: post.categoria || 'General'
        },
        likesCount: 0,
        comentariosCount: 0,
        compartidosCount: 0,
        categoria: post.categoria || 'General',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "community_posts"), newPostPayload);

      // Incrementar contador de compartidos en el post original si tiene id
      if (post.id && !post.id.startsWith('demo_')) {
        try {
          await updateDoc(doc(db, "community_posts", post.id), {
            compartidosCount: increment(1)
          });
        } catch {}
      }

      if (onShareSuccess) {
        onShareSuccess("¡Publicación compartida con éxito en tu perfil!");
      }
      onClose();
    } catch (err) {
      console.error("Error al compartir en perfil:", err);
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Compartir en grupo
  const handleShareToGroup = async (group: typeof COMUNIDAD_GRUPOS[0]) => {
    setSharedTargets(prev => ({ ...prev, [group.id]: true }));
    try {
      const textToGroup = comentario.trim() 
        ? `${comentario.trim()}\n\n📌 [Publicación de ${post.authorName}]: "${post.texto?.slice(0, 120)}..."`
        : `📌 ¡Miren esta publicación de ${post.authorName}!\n"${post.texto?.slice(0, 140)}..."`;

      await addDoc(collection(db, "community_chat", group.id, "mensajes"), {
        senderId: currentUserId,
        senderName: currentUserName,
        senderAvatar: currentUserAvatar || '',
        texto: textToGroup,
        sharedPostId: post.id || '',
        timestamp: serverTimestamp()
      });

      if (post.id && !post.id.startsWith('demo_')) {
        try {
          await updateDoc(doc(db, "community_posts", post.id), {
            compartidosCount: increment(1)
          });
        } catch {}
      }

      if (onShareSuccess) {
        onShareSuccess(`¡Compartido en el grupo "${group.name}"!`);
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error("Error al compartir en grupo:", err);
      setSharedTargets(prev => ({ ...prev, [group.id]: false }));
    }
  };

  // 3. Compartir a un perfil específico de la comunidad
  const handleShareToUser = async (targetUser: any) => {
    setSharedTargets(prev => ({ ...prev, [targetUser.uid]: true }));
    try {
      // Guardar mención / mensaje directo en la comunidad
      await addDoc(collection(db, "community_shares"), {
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        toUid: targetUser.uid,
        toName: targetUser.name,
        postId: post.id || '',
        postAuthor: post.authorName,
        postTexto: post.texto || '',
        mensaje: comentario.trim() || `Hola ${targetUser.name}, te comparto esta publicación de ${post.authorName} 💕`,
        timestamp: serverTimestamp()
      });

      if (post.id && !post.id.startsWith('demo_')) {
        try {
          await updateDoc(doc(db, "community_posts", post.id), {
            compartidosCount: increment(1)
          });
        } catch {}
      }

      if (onShareSuccess) {
        onShareSuccess(`¡Publicación compartida con ${targetUser.name}!`);
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      console.error("Error al compartir con usuario:", err);
      setSharedTargets(prev => ({ ...prev, [targetUser.uid]: false }));
    }
  };

  const filteredUsers = communityUsers.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.bio?.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-lg rounded-3xl p-5 sm:p-6 transition-all duration-300 max-h-[92vh] flex flex-col ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
        style={modalStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">Compartir Publicación</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-black/5 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de previsualización del post a compartir */}
        <div className={`p-3 rounded-2xl mb-4 border flex gap-3 items-center ${
          isDark ? 'bg-black/20 border-white/10' : 'bg-white/60 border-slate-200'
        }`}>
          {post.mediaUrls && post.mediaUrls.length > 0 ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/10 shrink-0">
              <img src={post.mediaUrls[0]} alt="Post" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 font-bold shrink-0">
              {post.authorName?.charAt(0) || 'M'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs truncate text-rose-500">
              {post.authorName} <span className="text-[10px] opacity-70 font-normal">• Mamá Baby Day</span>
            </p>
            <p className="text-xs line-clamp-2 mt-0.5 opacity-90 leading-snug">
              {post.texto || 'Momento compartido'}
            </p>
          </div>
        </div>

        {/* Selector de opciones para compartir */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 mb-4">
          <button
            type="button"
            onClick={() => setDestino('perfil')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              destino === 'perfil'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>En mi Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setDestino('grupos')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              destino === 'grupos'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>En Grupos</span>
          </button>

          <button
            type="button"
            onClick={() => setDestino('usuario')}
            className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              destino === 'usuario'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>A una Mamá</span>
          </button>
        </div>

        {/* CONTENIDO SEGÚN DESTINO */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
          {/* Opción 1: En mi perfil */}
          {destino === 'perfil' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-80">
                  ¿Quieres agregar un comentario personal? (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej. ¡Me encantó este consejo! Lo voy a probar hoy mismo con mi bebé 💕"
                  className={`w-full p-3 rounded-2xl border resize-none text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                    isDark 
                      ? 'bg-black/20 border-white/10 text-white placeholder-slate-400' 
                      : 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleShareToProfile}
                disabled={isSharing}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/30 hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compartiendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compartir ahora en mi perfil</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Opción 2: En Grupos */}
          {destino === 'grupos' && (
            <div className="space-y-2">
              <p className="text-xs opacity-75 mb-2 font-medium">
                Selecciona el grupo donde quieres compartir esta publicación:
              </p>
              {COMUNIDAD_GRUPOS.map((group) => (
                <div
                  key={group.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{group.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate">{group.name}</p>
                      <p className="text-[11px] opacity-70 truncate">{group.desc} • <span className="font-semibold text-rose-500">{group.members}</span></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShareToGroup(group)}
                    disabled={sharedTargets[group.id]}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                      sharedTargets[group.id]
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm hover:opacity-90'
                    }`}
                  >
                    {sharedTargets[group.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Compartido</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Compartir</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Opción 3: A una mamá / perfil de la comunidad */}
          {destino === 'usuario' && (
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Buscar mamá en la comunidad..."
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                    isDark ? 'bg-black/20 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <div
                      key={u.uid}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center font-bold text-xs text-rose-800">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{u.name}</p>
                          <p className="text-[10px] opacity-70 truncate">{u.bio || 'Mamá en Baby Day'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleShareToUser(u)}
                        disabled={sharedTargets[u.uid]}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                          sharedTargets[u.uid]
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm hover:opacity-90'
                        }`}
                      >
                        {sharedTargets[u.uid] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Enviado</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center py-4 opacity-70">
                    No se encontraron perfiles con esa búsqueda
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Copiar enlace rápido */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
              linkCopied
                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                : (isDark 
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm')
            }`}
          >
            {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{linkCopied ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
          </button>

          <span className="text-[11px] opacity-60">
            {post.compartidosCount || 0} veces compartido
          </span>
        </div>
      </div>
    </div>
  );
};
