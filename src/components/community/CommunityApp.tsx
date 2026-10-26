import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, 
  Search, 
  Bell, 
  MessageSquare, 
  Home, 
  Users, 
  Plus, 
  User, 
  ArrowLeft, 
  Camera, 
  Sparkles, 
  X, 
  Check, 
  Flame, 
  RefreshCw 
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  getDocs, 
  QueryDocumentSnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { BabyUser, CommunityPost } from '../../types';
import { 
  getOrCreateCommunityProfile, 
  seedInitialCommunityPostsIfEmpty 
} from './communityService';
import { CommunityPostCard } from './CommunityPostCard';
import { CreatePostModal } from './CreatePostModal';
import { CommunityProfileView } from './CommunityProfileView';
import { CommunitySuggestions } from './CommunitySuggestions';
import { CommunityGroups } from './CommunityGroups';
import { CommunityChat } from './CommunityChat';

interface CommunityAppProps {
  user: BabyUser;
  isDark: boolean;
  onExitToBabyDay: () => void;
  initialSubPath?: string; // e.g. '' or 'perfil/uid'
}

type CommunityNavTab = 'inicio' | 'grupos' | 'crear' | 'chat' | 'perfil';

export const CommunityApp: React.FC<CommunityAppProps> = ({
  user,
  isDark,
  onExitToBabyDay,
  initialSubPath = ''
}) => {
  const [currentTab, setCurrentTab] = useState<CommunityNavTab>('inicio');
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals in header
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Liquid Glass base styling:
  const headerGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.75)' : 'rgba(255, 250, 240, 0.85)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  };

  const bottomNavGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.85)' : 'rgba(255, 250, 240, 0.9)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: '0 -4px 25px rgba(0,0,0,0.1)'
  };

  const userAvatar = user.photo || localStorage.getItem(`bubblo_photo_${user.id}`) || '';
  const userDisplayName = user.babyName ? `Mamá de ${user.babyName}` : (user.email ? user.email.split('@')[0] : 'Mamá');

  // Handle URL changes & sync with subpaths (/comunidad/perfil/{uid})
  useEffect(() => {
    if (initialSubPath.startsWith('perfil/')) {
      const uid = initialSubPath.replace('perfil/', '');
      if (uid) {
        setSelectedProfileUid(uid);
      }
    }
  }, [initialSubPath]);

  // Ensure community profile exists & seed initial posts if empty
  useEffect(() => {
    if (!user.id) return;
    getOrCreateCommunityProfile(
      user.id,
      userDisplayName,
      userAvatar,
      user.babyName,
      user.birthDate ? `Bebé (${user.babyName})` : 'Bebé'
    );
    seedInitialCommunityPostsIfEmpty(user.id);
  }, [user.id, userDisplayName, userAvatar, user.babyName, user.birthDate]);

  // Real-time onSnapshot query for community_posts with limit(15)
  // Only listens when inside /comunidad
  useEffect(() => {
    setLoadingPosts(true);
    const qPosts = query(
      collection(db, 'community_posts'),
      orderBy('timestamp', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      const fetched: CommunityPost[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        fetched.push({
          id: d.id,
          uid: data.uid,
          authorName: data.authorName || 'Mamá',
          authorAvatar: data.authorAvatar,
          texto: data.texto || '',
          mediaUrls: data.mediaUrls || [],
          mediaType: data.mediaType || 'ninguno',
          likesCount: data.likesCount || 0,
          comentariosCount: data.comentariosCount || 0,
          compartidosCount: data.compartidosCount || 0,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        });
      });

      setPosts(fetched);
      setLoadingPosts(false);

      if (snapshot.docs.length > 0) {
        setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMorePosts(snapshot.docs.length === 15);
      } else {
        setHasMorePosts(false);
      }
    }, (err) => {
      console.warn("Community posts onSnapshot warning:", err);
      setLoadingPosts(false);
    });

    return () => unsubscribe();
  }, []);

  // Load more posts with pagination
  const handleLoadMore = async () => {
    if (!lastVisibleDoc || loadingMore) return;
    setLoadingMore(true);

    try {
      const qMore = query(
        collection(db, 'community_posts'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisibleDoc),
        limit(15)
      );

      const snap = await getDocs(qMore);
      const morePosts: CommunityPost[] = [];
      snap.forEach((d) => {
        const data = d.data();
        morePosts.push({
          id: d.id,
          uid: data.uid,
          authorName: data.authorName || 'Mamá',
          authorAvatar: data.authorAvatar,
          texto: data.texto || '',
          mediaUrls: data.mediaUrls || [],
          mediaType: data.mediaType || 'ninguno',
          likesCount: data.likesCount || 0,
          comentariosCount: data.comentariosCount || 0,
          compartidosCount: data.compartidosCount || 0,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        });
      });

      setPosts((prev) => [...prev, ...morePosts]);
      if (snap.docs.length > 0) {
        setLastVisibleDoc(snap.docs[snap.docs.length - 1]);
        setHasMorePosts(snap.docs.length === 15);
      } else {
        setHasMorePosts(false);
      }
    } catch (e) {
      console.warn("Error loading more posts:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Profile navigation helper
  const handleNavigateToProfile = useCallback((uid: string) => {
    setSelectedProfileUid(uid);
    window.history.pushState(null, '', `/comunidad/perfil/${uid}`);
  }, []);

  const handleBackFromProfile = useCallback(() => {
    setSelectedProfileUid(null);
    window.history.pushState(null, '', '/comunidad');
  }, []);

  // Filter posts by search query or topic tag
  const filteredPosts = posts.filter(p => {
    if (filterTag && !p.texto.toLowerCase().includes(filterTag.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.texto.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#18181C] text-white' : 'bg-[#FFF8F0] text-slate-900'} relative`}>
      {/* 1. Internal Community Header */}
      <header 
        className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-3 sm:px-4 justify-between"
        style={headerGlassStyle}
      >
        {/* Left: Back to Baby Day & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onExitToBabyDay}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs ${
              isDark ? 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10' : 'text-slate-700 hover:text-slate-900 bg-black/5 hover:bg-black/10'
            }`}
            title="Volver a Baby Day"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Baby Day</span>
          </button>

          <div 
            onClick={() => {
              setSelectedProfileUid(null);
              setCurrentTab('inicio');
              setFilterTag(null);
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text text-transparent leading-none">
                Comunidad Mamás
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold leading-none">
                Baby Day
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls: Buscar, Notificaciones, Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Buscar */}
          <button
            id="community-search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            className={`p-2 rounded-xl transition ${searchOpen ? 'bg-rose-500/15 text-rose-500' : isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'}`}
            title="Buscar en Comunidad"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notificaciones */}
          <button
            id="community-notifications-btn"
            onClick={() => setNotificationsOpen(true)}
            className={`p-2 rounded-xl transition relative ${isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'}`}
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* Chat directo */}
          <button
            id="community-header-chat-btn"
            onClick={() => {
              setSelectedProfileUid(null);
              setCurrentTab('chat');
            }}
            className={`p-2 rounded-xl transition ${currentTab === 'chat' ? 'bg-rose-500/15 text-rose-500' : isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-black/5'}`}
            title="Chat de Mamás"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Optional Search Bar dropdown */}
      {searchOpen && (
        <div 
          className="fixed top-14 left-0 right-0 z-40 p-3 shadow-md animate-in slide-in-from-top-2 duration-200"
          style={headerGlassStyle}
        >
          <div className="max-w-xl mx-auto flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar temas, dudas o mamás..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 pl-9 pr-8 rounded-2xl text-xs sm:text-sm outline-none border ${
                  isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-black/10 text-slate-900'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setSearchOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto pt-20 px-3 sm:px-4 pb-28">
        {/* If viewing a user's profile (/comunidad/perfil/:uid) */}
        {selectedProfileUid ? (
          <CommunityProfileView
            targetUid={selectedProfileUid}
            myUid={user.id}
            myDisplayName={userDisplayName}
            myAvatar={userAvatar}
            isDark={isDark}
            onBack={handleBackFromProfile}
            onNavigateProfile={handleNavigateToProfile}
          />
        ) : currentTab === 'inicio' ? (
          <div className="space-y-4">
            {/* Input "¿Qué quieres compartir, Mamá?" with avatar and camera button */}
            <div 
              id="feed-composer-trigger"
              className="rounded-3xl p-4 transition-all duration-300 border shadow-lg cursor-pointer"
              style={{
                background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isDark ? '0 12px 36px 0 rgba(0, 0, 0, 0.3)' : '0 12px 36px 0 rgba(190, 150, 120, 0.12)'
              }}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center border-2 border-rose-300/40 shadow">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Mi perfil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">👩‍🍼</span>
                  )}
                </div>

                {/* Input placeholder bar */}
                <div 
                  className={`flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-medium transition ${
                    isDark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-white/70 text-slate-500 hover:bg-white'
                  }`}
                >
                  ¿Qué quieres compartir, Mamá?
                </div>

                {/* Camera icon button that triggers modal */}
                <button
                  id="feed-camera-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreateModalOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition flex items-center justify-center"
                  title="Subir foto o video del bebé"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sugerencias para seguir: "Mamás que quizás conozcas" */}
            <CommunitySuggestions
              myUid={user.id}
              isDark={isDark}
              onNavigateProfile={handleNavigateToProfile}
            />

            {/* Active Topic Filter Badge */}
            {filterTag && (
              <div className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-bold">
                <span>Filtrando por: {filterTag}</span>
                <button 
                  onClick={() => setFilterTag(null)}
                  className="hover:underline font-normal cursor-pointer"
                >
                  Ver todos
                </button>
              </div>
            )}

            {/* Posts Feed list */}
            {loadingPosts ? (
              <div className="space-y-4 py-8 text-center">
                <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400 font-medium">Cargando publicaciones de la comunidad...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div 
                className="rounded-3xl p-8 text-center"
                style={{
                  background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
                  backdropFilter: 'blur(24px)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)'
                }}
              >
                <span className="text-4xl mb-2 inline-block">🌸</span>
                <h4 className="font-black text-sm mb-1">Aún no hay publicaciones con este filtro</h4>
                <p className="text-xs text-slate-400 mb-4">¡Sé la primera mamá en compartir una historia o foto de tu bebé!</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="py-2.5 px-5 rounded-2xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-lg"
                >
                  Crear primera publicación
                </button>
              </div>
            ) : (
              <div>
                {filteredPosts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    currentUserName={userDisplayName}
                    currentUserAvatar={userAvatar}
                    isDark={isDark}
                    onNavigateProfile={handleNavigateToProfile}
                  />
                ))}

                {/* Pagination button */}
                {hasMorePosts && (
                  <div className="text-center pt-4 pb-2">
                    <button
                      id="load-more-posts-btn"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className={`py-2.5 px-6 rounded-2xl font-bold text-xs transition flex items-center gap-2 mx-auto ${
                        isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      }`}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Cargando más...</span>
                        </>
                      ) : (
                        <span>Cargar más publicaciones</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : currentTab === 'grupos' ? (
          <CommunityGroups
            isDark={isDark}
            onSelectGroupTopic={(tag) => {
              setFilterTag(tag);
              setCurrentTab('inicio');
            }}
          />
        ) : currentTab === 'chat' ? (
          <CommunityChat
            currentUserId={user.id}
            currentUserName={userDisplayName}
            currentUserAvatar={userAvatar}
            isDark={isDark}
            onNavigateProfile={handleNavigateToProfile}
          />
        ) : currentTab === 'perfil' ? (
          <CommunityProfileView
            targetUid={user.id}
            myUid={user.id}
            myDisplayName={userDisplayName}
            myAvatar={userAvatar}
            isDark={isDark}
            onBack={() => setCurrentTab('inicio')}
            onNavigateProfile={handleNavigateToProfile}
          />
        ) : null}
      </main>

      {/* 2. Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUserId={user.id}
        currentUserName={userDisplayName}
        currentUserAvatar={userAvatar}
        isDark={isDark}
      />

      {/* 3. Notifications Drawer / Modal */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm rounded-3xl p-5 shadow-2xl border"
            style={{
              background: isDark ? 'rgba(30,30,36,0.98)' : 'rgba(255,255,255,0.98)',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                <h4 className="font-bold text-base">Notificaciones</h4>
              </div>
              <button onClick={() => setNotificationsOpen(false)} className="p-1 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xl">❤️</span>
                <div>
                  <p className="font-semibold text-rose-500">A Dra. Sofía y otras 5 mamás les encantó tu bienvenida</p>
                  <span className="text-[10px] text-slate-400">hace 1 hora</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-black/5 dark:bg-white/5">
                <span className="text-xl">🤱</span>
                <div>
                  <p className="font-semibold">Nuevo debate en el grupo de Alimentación BLW</p>
                  <span className="text-[10px] text-slate-400">hace 3 horas</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setNotificationsOpen(false)}
              className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs bg-rose-500 text-white shadow"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 4. BottomNav with Inicio, Grupos, Crear Post, Chat, Perfil */}
      <nav 
        id="community-bottom-nav"
        className="fixed bottom-0 left-0 right-0 h-16 z-50 flex items-center justify-around px-2"
        style={bottomNavGlassStyle}
      >
        {/* Inicio */}
        <button
          id="nav-tab-inicio"
          onClick={() => {
            setSelectedProfileUid(null);
            setCurrentTab('inicio');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition px-3 py-1 cursor-pointer ${
            currentTab === 'inicio' && !selectedProfileUid ? 'text-rose-500 scale-105 font-bold' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Inicio</span>
        </button>

        {/* Grupos */}
        <button
          id="nav-tab-grupos"
          onClick={() => {
            setSelectedProfileUid(null);
            setCurrentTab('grupos');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition px-3 py-1 cursor-pointer ${
            currentTab === 'grupos' && !selectedProfileUid ? 'text-rose-500 scale-105 font-bold' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Grupos</span>
        </button>

        {/* Crear Post (Elevated + button in center) */}
        <button
          id="nav-tab-crear"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-6 group cursor-pointer"
          title="Crear Publicación"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/40 group-hover:scale-110 group-active:scale-95 transition-all duration-300 border-2 border-white/60">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-black text-rose-500 mt-1">Crear</span>
        </button>

        {/* Chat */}
        <button
          id="nav-tab-chat"
          onClick={() => {
            setSelectedProfileUid(null);
            setCurrentTab('chat');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition px-3 py-1 cursor-pointer ${
            currentTab === 'chat' && !selectedProfileUid ? 'text-rose-500 scale-105 font-bold' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Chat</span>
        </button>

        {/* Perfil */}
        <button
          id="nav-tab-perfil"
          onClick={() => {
            setSelectedProfileUid(null);
            setCurrentTab('perfil');
          }}
          className={`flex flex-col items-center justify-center gap-1 transition px-3 py-1 cursor-pointer ${
            currentTab === 'perfil' || (selectedProfileUid === user.id) ? 'text-rose-500 scale-105 font-bold' : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Perfil</span>
        </button>
      </nav>
    </div>
  );
};
