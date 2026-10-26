import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Home, 
  Users, 
  Plus, 
  User as UserIcon, 
  ArrowLeft,
  X,
  Heart,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  MessageSquare
} from 'lucide-react';
import { BabyUser } from '../types';
import { Feed } from './Feed';
import { CrearPostModal } from './CrearPostModal';
import { PerfilComunidad } from './PerfilComunidad';
import { BuscarAmigasModal } from './BuscarAmigasModal';
import { NotificacionesModal } from './NotificacionesModal';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

interface ComunidadLayoutProps {
  user: BabyUser;
  isDark: boolean;
  onExitToBabyDay?: () => void;
  initialSubPath?: string;
}

type TabType = 'inicio' | 'grupos' | 'crear' | 'perfil';

export const ComunidadLayout: React.FC<ComunidadLayoutProps> = ({
  user,
  isDark,
  onExitToBabyDay,
  initialSubPath
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialSubPath === 'grupos') return 'grupos';
    if (initialSubPath === 'perfil') return 'perfil';
    return 'inicio';
  });

  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [isBuscarModalOpen, setIsBuscarModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);

  // Groups and active group chat inside Groups tab
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [groupChatInput, setGroupChatInput] = useState('');

  // Groups list
  const GROUPS = [
    { id: 'general', name: 'Mamás Baby Day Oficial', desc: 'Espacio libre para compartir experiencias, anécdotas y crianza', members: '1,420 mamás', icon: '🍼', color: 'from-pink-500 to-rose-500' },
    { id: 'lactancia', name: 'Lactancia & Banco de Leche', desc: 'Dudas sobre agarre, brotes de crecimiento y destete respetuoso', members: '890 mamás', icon: '🤱', color: 'from-rose-500 to-amber-500' },
    { id: 'solidos', name: 'Alimentación BLW & Papillas', desc: 'Recetas seguras, cortes blandos y primeros bocados de 6+ meses', members: '1,120 mamás', icon: '🍲', color: 'from-amber-500 to-emerald-500' },
    { id: 'sueno', name: 'Sueño Respetuoso & Siestas', desc: 'Consejos para noches tranquilas, ventanas de sueño y descanso', members: '940 mamás', icon: '🌙', color: 'from-indigo-500 to-purple-500' },
    { id: 'primerizas', name: 'Mamás Primerizas Baby Day', desc: 'Acompañamiento cariñoso, sin juicios y paso a paso', members: '1,830 mamás', icon: '💕', color: 'from-rose-400 to-pink-600' }
  ];

  // Current user identity
  const uid = user.id || user.email || 'anon_user';
  const authorName = user.babyName ? `Mamá de ${user.babyName}` : (user.email?.split('@')[0] || 'Mamá');
  const authorAvatar = user.photo || localStorage.getItem(`bubblo_photo_${user.id}`) || '';

  // Escuchar notificaciones no leídas
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "community_notifications"),
      where("toUid", "==", uid),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadNotifsCount(snap.size);
    }, () => {});
    return () => unsub();
  }, [uid]);

  // Escuchar mensajes si hay un grupo activo abierto
  useEffect(() => {
    if (!activeGroup) return;
    const q = query(
      collection(db, "community_chat", activeGroup, "mensajes"),
      orderBy("timestamp", "asc"),
      limit(40)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs: any[] = [];
      snap.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
      setGroupMessages(msgs);
    }, (err) => {
      console.warn("Group chat sync:", err);
    });
    return () => unsub();
  }, [activeGroup]);

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupChatInput.trim() || !activeGroup) return;
    const textToSend = groupChatInput.trim();
    setGroupChatInput('');
    try {
      await addDoc(collection(db, "community_chat", activeGroup, "mensajes"), {
        senderId: uid,
        senderName: authorName,
        senderAvatar: authorAvatar,
        texto: textToSend,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Group chat send error:", e);
    }
  };

  // Liquid Glass styling:
  // Modo oscuro: background rgba(28,28,35,0.75) backdrop-filter blur(28px)
  // Modo claro: background rgba(255,248,235,0.7) blur(28px)
  const liquidGlassHeader: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.75)' : 'rgba(255, 248, 235, 0.75)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(180, 140, 110, 0.1)'
  };

  const liquidGlassBottomNav: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.82)' : 'rgba(255, 248, 235, 0.85)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 -4px 24px rgba(0, 0, 0, 0.3)' : '0 -4px 24px rgba(180, 140, 110, 0.12)'
  };

  const liquidGlassCard: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.75)' : 'rgba(255, 248, 235, 0.75)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.35)' : '0 12px 36px rgba(180, 140, 110, 0.12)',
  };

  const handleNavigateProfile = (profileId: string) => {
    setViewingProfileUid(profileId);
    setActiveTab('perfil');
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#121217] text-white' : 'bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EB] to-[#FFF5E5] text-[#1D1A16]'
    }`}>
      {/* Top Header: Flecha salida + Título + Lupa Buscar + Campana Notificaciones */}
      <header 
        className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 max-w-xl mx-auto"
        style={liquidGlassHeader}
      >
        <div className="flex items-center gap-2.5">
          {onExitToBabyDay && (
            <button
              type="button"
              onClick={onExitToBabyDay}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
              title="Volver al panel de Baby Day"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div 
            onClick={() => {
              setViewingProfileUid(null);
              setActiveTab('inicio');
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
              <span className="text-base">👩‍👧‍👦</span>
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-none tracking-tight">Comunidad Mamás</h1>
              <p className="text-[10px] font-bold text-rose-500 tracking-wide mt-0.5">BABY DAY NETWORK</p>
            </div>
          </div>
        </div>

        {/* Header Right Actions: Lupa Buscar Amigas + Campana Solicitudes/Notificaciones */}
        <div className="flex items-center gap-2">
          {/* Lupa / Buscar amigas registradas en Baby Day */}
          <button
            type="button"
            onClick={() => setIsBuscarModalOpen(true)}
            className={`p-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-white text-slate-800 hover:bg-slate-50 shadow-sm border border-slate-200'
            }`}
            title="Buscar amigas registradas en Baby Day"
          >
            <Search className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold hidden sm:inline">Buscar amigas</span>
          </button>

          {/* Campana / Notificaciones & Solicitudes de amistad */}
          <button
            type="button"
            onClick={() => setIsNotifModalOpen(true)}
            className={`p-2.5 rounded-2xl transition cursor-pointer relative ${
              isDark ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-white text-slate-800 hover:bg-slate-50 shadow-sm border border-slate-200'
            }`}
            title="Ver solicitudes de amistad y notificaciones"
          >
            <Bell className="w-4 h-4 text-rose-500" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-28 px-4 max-w-xl mx-auto min-h-screen">
        {/* 1. Tab: Inicio (Feed) */}
        {activeTab === 'inicio' && !viewingProfileUid && (
          <Feed
            currentUserId={uid}
            currentUserName={authorName}
            currentUserAvatar={authorAvatar}
            isDark={isDark}
            onNavigateProfile={handleNavigateProfile}
            onOpenCrearPost={() => setIsCrearModalOpen(true)}
            onOpenCrearModal={() => setIsCrearModalOpen(true)}
          />
        )}

        {/* 2. Tab: Grupos de Mamás */}
        {activeTab === 'grupos' && !viewingProfileUid && (
          <div className="space-y-4 animate-fadeIn">
            {/* Si hay un grupo abierto con chat */}
            {activeGroup ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveGroup(null)}
                    className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a los Grupos</span>
                  </button>
                  <span className="text-xs font-bold opacity-75">
                    {GROUPS.find(g => g.id === activeGroup)?.name}
                  </span>
                </div>

                {/* Group Chat Container */}
                <div 
                  className="rounded-3xl p-4 flex flex-col h-[520px]"
                  style={liquidGlassCard}
                >
                  <div className="border-b border-white/10 pb-3 mb-3 flex items-center gap-3">
                    <span className="text-2xl">{GROUPS.find(g => g.id === activeGroup)?.icon}</span>
                    <div>
                      <h3 className="font-extrabold text-sm">{GROUPS.find(g => g.id === activeGroup)?.name}</h3>
                      <p className="text-[11px] opacity-70">{GROUPS.find(g => g.id === activeGroup)?.members}</p>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {groupMessages.length === 0 ? (
                      <div className="text-center py-16 opacity-60 text-xs">
                        <Sparkles className="w-6 h-6 mx-auto mb-1 text-rose-400" />
                        Sé la primera mamá en escribir en este grupo 💕
                      </div>
                    ) : (
                      groupMessages.map((msg) => {
                        const isMe = msg.senderId === uid;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            {!isMe && (
                              <span className="text-[10px] opacity-60 font-semibold mb-0.5 ml-1">
                                {msg.senderName}
                              </span>
                            )}
                            <div 
                              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                isMe 
                                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-tr-xs shadow' 
                                  : (isDark ? 'bg-white/10 text-white rounded-tl-xs' : 'bg-white text-slate-800 rounded-tl-xs shadow-sm border border-slate-100')
                              }`}
                            >
                              {msg.texto}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendGroupMessage} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={groupChatInput}
                      onChange={(e) => setGroupChatInput(e.target.value)}
                      placeholder="Escribe tu mensaje o pregunta..."
                      className={`flex-1 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none border ${
                        isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!groupChatInput.trim()}
                      className="p-2.5 rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Groups list */
              <>
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="font-extrabold text-lg leading-tight">Grupos de Mamás</h2>
                    <p className="text-xs opacity-70">Espacios temáticos según la etapa de tu bebé</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCrearModalOpen(true)}
                    className="py-1.5 px-3 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Compartir en grupo</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {GROUPS.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-3xl p-4 transition-all hover:scale-[1.01] cursor-pointer"
                      style={liquidGlassCard}
                      onClick={() => setActiveGroup(g.id)}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${g.color} flex items-center justify-center text-2xl shadow-md shrink-0 text-white`}>
                          {g.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-sm truncate">{g.name}</h3>
                          <p className="text-xs opacity-75 line-clamp-1 mt-0.5">{g.desc}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-rose-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {g.members}
                            </span>
                            <span>• Toca para entrar al chat</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. Tab: Perfil estilo Facebook */}
        {(activeTab === 'perfil' || viewingProfileUid) && (
          <PerfilComunidad
            profileUid={viewingProfileUid || uid}
            currentUserId={uid}
            currentUserName={authorName}
            currentUserAvatar={authorAvatar}
            isDark={isDark}
            onBack={() => {
              setViewingProfileUid(null);
              setActiveTab('inicio');
            }}
            onNavigateProfile={handleNavigateProfile}
            onOpenSearch={() => setIsBuscarModalOpen(true)}
            onOpenCrearPost={() => setIsCrearModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation Bar:
          EL BOTÓN DE CHAT FUE REMOVIDO COMO LO SOLICITÓ EL USUARIO.
          Ahora consta de 4 elementos equilibrados y limpios:
          1. Inicio
          2. Grupos
          3. Crear (+) [Destacado Liquid Glass]
          4. Perfil [Estilo Facebook]
      */}
      <nav 
        className="fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-4 max-w-xl mx-auto"
        style={liquidGlassBottomNav}
      >
        {/* 1. Inicio */}
        <button
          type="button"
          onClick={() => {
            setViewingProfileUid(null);
            setActiveTab('inicio');
          }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'inicio' && !viewingProfileUid
              ? 'text-rose-500 scale-105 font-bold' 
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'inicio' && !viewingProfileUid ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Inicio</span>
        </button>

        {/* 2. Grupos */}
        <button
          type="button"
          onClick={() => {
            setViewingProfileUid(null);
            setActiveTab('grupos');
          }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'grupos' && !viewingProfileUid
              ? 'text-rose-500 scale-105 font-bold' 
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'grupos' && !viewingProfileUid ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Grupos</span>
        </button>

        {/* 3. Crear (Botón flotante Liquid Glass destacado con +) */}
        <button
          type="button"
          onClick={() => setIsCrearModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Crear Publicación"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/40 border-2 border-white/40">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold text-rose-500 mt-1">Crear</span>
        </button>

        {/* 4. Perfil Estilo Facebook */}
        <button
          type="button"
          onClick={() => {
            setViewingProfileUid(uid);
            setActiveTab('perfil');
          }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'perfil' || viewingProfileUid === uid
              ? 'text-rose-500 scale-105 font-bold' 
              : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'perfil' || viewingProfileUid === uid ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">Perfil</span>
        </button>
      </nav>

      {/* Modal: Crear Post */}
      <CrearPostModal
        isOpen={isCrearModalOpen}
        onClose={() => setIsCrearModalOpen(false)}
        uid={uid}
        authorName={authorName}
        authorAvatar={authorAvatar}
        isDark={isDark}
      />

      {/* Modal: Buscar Amigas Registradas en Baby Day */}
      <BuscarAmigasModal
        isOpen={isBuscarModalOpen}
        onClose={() => setIsBuscarModalOpen(false)}
        currentUserId={uid}
        currentUserName={authorName}
        currentUserAvatar={authorAvatar}
        isDark={isDark}
        onSelectProfile={handleNavigateProfile}
      />

      {/* Modal: Notificaciones y Solicitudes de Amistad */}
      <NotificacionesModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        currentUserId={uid}
        currentUserName={authorName}
        currentUserAvatar={authorAvatar}
        isDark={isDark}
        onNavigateProfile={handleNavigateProfile}
      />
    </div>
  );
};
export default ComunidadLayout;
