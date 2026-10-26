import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Image as ImageIcon, 
  TrendingUp, 
  MessageCircle, 
  Heart,
  HelpCircle,
  RefreshCw,
  Search
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { PostCard, PostData } from './PostCard';

interface FeedProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onOpenCrearModal?: () => void;
  onOpenCrearPost?: () => void;
  onNavigateProfile: (uid: string) => void;
}

// Default initial posts matching user's capture: Sofía M., hace 2h, imagen bebe, reacciones 24
const DEMO_POSTS: PostData[] = [
  {
    id: 'demo_post_sofia',
    uid: 'sofia_m_user',
    authorName: 'Sofía M.',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    texto: '¡Hoy mi bebé cumplió 6 meses y probó su primera papilla de camote y zanahoria! 🥕👶 Le encantó la textura. ¿Algún consejo para introducir la palta esta semana?',
    mediaUrls: [
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80'
    ],
    likesCount: 24,
    comentariosCount: 7,
    categoria: 'Alimentación',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // hace 2 horas
  },
  {
    id: 'demo_post_valentina',
    uid: 'valentina_c_user',
    authorName: 'Valentina C.',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    texto: 'Logramos 5 horas seguidas de sueño anoche gracias a la rutina de ruido blanco y masajito en los pies 🌙✨ Ánimo a todas las mamás en el turno de noche, ¡lo estamos haciendo genial!',
    mediaUrls: [
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80'
    ],
    likesCount: 38,
    comentariosCount: 12,
    categoria: 'Sueño',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
  }
];

export const Feed: React.FC<FeedProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onOpenCrearModal,
  onOpenCrearPost,
  onNavigateProfile
}) => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('Todos');

  const handleOpenCreate = () => {
    if (onOpenCrearModal) {
      onOpenCrearModal();
    } else if (onOpenCrearPost) {
      onOpenCrearPost();
    }
  };

  // Liquid glass style matching specification
  const liquidGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.75)' : 'rgba(255, 248, 235, 0.7)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.35)' : '0 12px 36px rgba(180, 140, 110, 0.12)',
  };

  // onSnapshot(query(collection(db, "community_posts"), orderBy("timestamp","desc"), limit(15)))
  useEffect(() => {
    const q = query(
      collection(db, "community_posts"),
      orderBy("timestamp", "desc"),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: PostData[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as PostData);
      });

      if (fetched.length > 0) {
        // Include demo post if not already present so user's capture post is always visible
        const hasSofia = fetched.some(p => p.authorName === 'Sofía M.');
        if (!hasSofia) {
          setPosts([...fetched, ...DEMO_POSTS]);
        } else {
          setPosts(fetched);
        }
      } else {
        setPosts(DEMO_POSTS);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error listening to community_posts:", error);
      setPosts(DEMO_POSTS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const tags = ['Todos', 'Alimentación', 'Sueño', 'Lactancia', 'Hitos', 'Consejos'];

  const filteredPosts = selectedTag === 'Todos' 
    ? posts 
    : posts.filter(p => p.categoria?.toLowerCase() === selectedTag.toLowerCase() || p.texto.toLowerCase().includes(selectedTag.toLowerCase()));

  return (
    <div className="space-y-4 pb-20">
      {/* Top Quick Create Bar */}
      <div 
        className="rounded-3xl p-4 transition-all duration-200"
        style={liquidGlassStyle}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl overflow-hidden bg-rose-200 shrink-0 border border-white/30 flex items-center justify-center font-bold text-rose-800 cursor-pointer"
            onClick={() => onNavigateProfile(currentUserId)}
          >
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
            ) : (
              currentUserName?.charAt(0).toUpperCase() || 'M'
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className={`flex-1 text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition cursor-pointer border hover:scale-[1.005] active:scale-[0.99] flex items-center justify-between ${
              isDark 
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-rose-500/30' 
                : 'bg-white/80 border-slate-200/80 text-slate-600 hover:bg-white hover:border-rose-300 shadow-inner'
            }`}
          >
            <span>¿Qué quieres compartir hoy con otras mamás? 💕</span>
            <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-xl hidden sm:inline">
              Publicar
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0"
            title="Subir foto o video"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              selectedTag === tag
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                : (isDark 
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' 
                    : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white')
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id || `${post.uid}_${post.timestamp}`}
            post={post}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            isDark={isDark}
            onNavigateProfile={onNavigateProfile}
          />
        ))}

        {filteredPosts.length === 0 && !loading && (
          <div 
            className="rounded-3xl p-8 text-center"
            style={liquidGlassStyle}
          >
            <Sparkles className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm">No hay publicaciones en esta categoría todavía.</p>
            <p className="text-xs opacity-70 mt-1">Sé la primera en compartir tu experiencia 💕</p>
            <button
              type="button"
              onClick={onOpenCrearModal}
              className="mt-4 px-4 py-2 rounded-2xl bg-rose-500 text-white font-bold text-xs shadow-md"
            >
              Publicar ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
