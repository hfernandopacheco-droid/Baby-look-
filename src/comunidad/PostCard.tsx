import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Send, 
  Check, 
  Sparkles, 
  Bookmark, 
  UserPlus,
  Repeat,
  X
} from 'lucide-react';
import { doc, updateDoc, increment, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CompartirModal } from './CompartirModal';
import { resolveMediaUrl } from '../utils/mediaStorage';

export interface PostData {
  id?: string;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  texto: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
  likesCount?: number;
  comentariosCount?: number;
  compartidosCount?: number;
  timestamp?: any;
  categoria?: string;
  isShared?: boolean;
  sharedPost?: {
    id?: string;
    uid?: string;
    authorName: string;
    authorAvatar?: string;
    texto: string;
    mediaUrls?: string[];
    categoria?: string;
  };
}

interface PostCardProps {
  post: PostData;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onNavigateProfile?: (uid: string) => void;
  onSharePost?: (post: PostData) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onNavigateProfile,
  onSharePost
}) => {
  const [likes, setLikes] = useState<number>(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>(post.mediaUrls?.[0] || '');
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);

  // Resolver URLs dinámicas (por ejemplo fragmentos de video firestore-media:// o URLs en la nube)
  useEffect(() => {
    const rawUrl = post.mediaUrls?.[0];
    if (!rawUrl) {
      setResolvedMediaUrl('');
      return;
    }
    if (rawUrl.startsWith('firestore-media://')) {
      setMediaLoading(true);
      resolveMediaUrl(rawUrl)
        .then((res) => {
          setResolvedMediaUrl(res);
        })
        .catch((err) => {
          console.warn("Notice resolving media URL:", err);
        })
        .finally(() => {
          setMediaLoading(false);
        });
    } else {
      setResolvedMediaUrl(rawUrl);
    }
  }, [post.mediaUrls]);

  // Sync likes count
  useEffect(() => {
    setLikes(post.likesCount || 0);
  }, [post.likesCount]);

  // Check if current user liked this post
  useEffect(() => {
    if (!post.id || !currentUserId) return;
    const likeRef = doc(db, 'community_posts', post.id, 'likes', currentUserId);
    const unsub = onSnapshot(likeRef, (snap) => {
      setHasLiked(snap.exists());
    }, () => {});
    return () => unsub();
  }, [post.id, currentUserId]);

  // Check follow status of post author
  useEffect(() => {
    if (!currentUserId || !post.uid || currentUserId === post.uid) return;
    const followRef = doc(db, 'community_follows', `${currentUserId}_${post.uid}`);
    const unsub = onSnapshot(followRef, (snap) => {
      setIsFollowing(snap.exists());
    }, () => {});
    return () => unsub();
  }, [currentUserId, post.uid]);

  // Listen to comments if comments section is opened
  useEffect(() => {
    if (!post.id || !showComments) return;
    const commentsQ = query(
      collection(db, 'community_posts', post.id, 'comentarios'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(commentsQ, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setComments(list);
    }, () => {});
    return () => unsub();
  }, [post.id, showComments]);

  // Liquid glass styling:
  const liquidGlassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.75)' : 'rgba(255, 248, 235, 0.7)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.35)' : '0 12px 36px rgba(180, 140, 110, 0.12)',
  };

  const handleToggleLike = async () => {
    if (!post.id) return;
    const postRef = doc(db, 'community_posts', post.id);
    const likeRef = doc(db, 'community_posts', post.id, 'likes', currentUserId);

    try {
      if (hasLiked) {
        setLikes(prev => Math.max(0, prev - 1));
        setHasLiked(false);
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        setLikes(prev => prev + 1);
        setHasLiked(true);
        await setDoc(likeRef, {
          uid: currentUserId,
          tipo: 'me_gusta',
          timestamp: serverTimestamp()
        });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.warn("Like update notice:", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post.id) return;

    setSubmittingComment(true);
    const textToSend = newComment.trim();

    try {
      const commentsCol = collection(db, 'community_posts', post.id, 'comentarios');
      await addDoc(commentsCol, {
        uid: currentUserId,
        authorName: currentUserName,
        authorAvatar: currentUserAvatar || '',
        texto: textToSend,
        timestamp: serverTimestamp()
      });

      const postRef = doc(db, 'community_posts', post.id);
      await updateDoc(postRef, { comentariosCount: increment(1) });

      setNewComment('');
    } catch (err) {
      console.error("Error commenting:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShareClick = () => {
    if (onSharePost) {
      onSharePost(post);
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleShareSuccess = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => {
      setShareToast(null);
    }, 3500);
  };

  const handleToggleFollow = async () => {
    if (!currentUserId || !post.uid || currentUserId === post.uid) return;
    const followId = `${currentUserId}_${post.uid}`;
    const followRef = doc(db, 'community_follows', followId);
    try {
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
      } else {
        await setDoc(followRef, {
          followerId: currentUserId,
          followingId: post.uid,
          timestamp: serverTimestamp()
        });
        setIsFollowing(true);
      }
    } catch (e) {
      console.warn("Follow error:", e);
    }
  };

  // Human readable time
  const getTimeString = () => {
    if (!post.timestamp) return 'hace 2h';
    try {
      const d = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'ahora';
      if (diffMins < 60) return `hace ${diffMins}m`;
      if (diffHours < 24) return `hace ${diffHours}h`;
      return `hace ${diffDays}d`;
    } catch {
      return 'reciente';
    }
  };

  return (
    <>
      <article 
        className="rounded-3xl p-4 sm:p-5 transition-all duration-200 overflow-hidden"
        style={liquidGlassStyle}
      >
        {/* Toast de confirmación de compartido */}
        {shareToast && (
          <div className="mb-3 p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {shareToast}
            </span>
            <button type="button" onClick={() => setShareToast(null)} className="p-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Header: Avatar, Name, Time, Follow Button */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigateProfile && onNavigateProfile(post.uid)}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-200 shadow-sm border border-white/40 flex items-center justify-center font-bold text-rose-800 text-base">
                {post.authorAvatar ? (
                  <img 
                    src={post.authorAvatar} 
                    alt={post.authorName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  post.authorName.charAt(0).toUpperCase() || 'M'
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
            </div>

            {/* Author info */}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm sm:text-base leading-tight group-hover:text-rose-500 transition-colors">
                  {post.authorName}
                </h4>
                {post.categoria && (
                  <span className="text-[10px] py-0.5 px-2 rounded-full font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {post.categoria}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs opacity-70 mt-0.5">
                <span>{getTimeString()}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-rose-500 font-medium">
                  Mamá Baby Day 💕
                </span>
              </div>
            </div>
          </div>

          {/* Follow / Action */}
          <div className="flex items-center gap-1">
            {currentUserId && post.uid && currentUserId !== post.uid && (
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`py-1 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isFollowing
                    ? 'bg-white/10 text-slate-400 border border-white/10'
                    : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Siguiendo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Seguir</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Post Text */}
        {post.texto && (
          <p className={`text-sm sm:text-[15px] leading-relaxed mb-3 whitespace-pre-wrap ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            {post.texto}
          </p>
        )}

        {/* Publicación Compartida si aplica */}
        {post.isShared && post.sharedPost && (
          <div className={`p-3 rounded-2xl mb-3.5 border ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-white/80 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center font-bold text-xs text-rose-800">
                {post.sharedPost.authorAvatar ? (
                  <img src={post.sharedPost.authorAvatar} alt={post.sharedPost.authorName} className="w-full h-full object-cover" />
                ) : (
                  post.sharedPost.authorName?.charAt(0) || 'M'
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-rose-500 leading-none">
                  {post.sharedPost.authorName}
                </p>
                <span className="text-[10px] opacity-60">Publicación original en Baby Day</span>
              </div>
            </div>

            {post.sharedPost.texto && (
              <p className="text-xs sm:text-sm leading-relaxed mb-2 opacity-90">
                {post.sharedPost.texto}
              </p>
            )}

            {post.sharedPost.mediaUrls && post.sharedPost.mediaUrls.length > 0 && (
              <div className="rounded-xl overflow-hidden max-h-56 bg-black/10">
                <img 
                  src={post.sharedPost.mediaUrls[0]} 
                  alt="Adjunto original" 
                  className="w-full h-full object-cover" 
                />
              </div>
            )}
          </div>
        )}

        {/* Media: imagen bebe / video */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-3.5 border border-white/20 shadow-sm bg-black/10 flex items-center justify-center relative min-h-[160px]">
            {mediaLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-xs font-semibold text-rose-500 gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Cargando contenido de mamá...</span>
              </div>
            ) : (post.mediaType === 'video' || (resolvedMediaUrl && (resolvedMediaUrl.includes('.mp4') || resolvedMediaUrl.includes('.webm') || resolvedMediaUrl.startsWith('data:video') || resolvedMediaUrl.startsWith('blob:')))) ? (
              <div className="w-full relative bg-black flex items-center justify-center">
                <video 
                  src={resolvedMediaUrl || post.mediaUrls[0]} 
                  poster={post.thumbnailUrl || undefined}
                  controls 
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[440px] object-contain rounded-2xl bg-black"
                />
              </div>
            ) : (
              <img 
                src={resolvedMediaUrl || post.mediaUrls[0]} 
                alt="Momento con mi bebé" 
                className="w-full max-h-[440px] object-cover rounded-2xl hover:scale-[1.01] transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  // Fallback para imágenes si fallara una URL
                  const target = e.currentTarget;
                  if (!target.src.includes('unsplash')) {
                    target.src = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80';
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Reacciones summary: ej. reacciones 24 */}
        <div className={`flex items-center justify-between text-xs py-2 border-b mb-1 ${
          isDark ? 'border-white/10 text-slate-400' : 'border-slate-200/70 text-slate-500'
        }`}>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-1">
              <span className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white shadow">
                ❤️
              </span>
              <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-white shadow">
                👶
              </span>
            </div>
            <span className="font-semibold text-xs">
              {likes} {likes === 1 ? 'reacción' : 'reacciones'}
            </span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <span 
              className="cursor-pointer hover:underline"
              onClick={() => setShowComments(!showComments)}
            >
              {comments.length || post.comentariosCount || 0} comentarios
            </span>
            <span>•</span>
            <span 
              className="cursor-pointer hover:underline text-rose-500 font-semibold"
              onClick={handleShareClick}
            >
              {post.compartidosCount ? `${post.compartidosCount} compartidos` : 'Compartir'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Me gusta / Comentar / Compartir */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            type="button"
            onClick={handleToggleLike}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              hasLiked
                ? 'text-rose-500 bg-rose-500/10'
                : (isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100/70')
            }`}
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500 animate-bounce' : ''}`} />
            <span>Me gusta</span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              showComments
                ? 'text-amber-600 bg-amber-500/10'
                : (isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100/70')
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comentar</span>
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className={`py-2 px-1 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100/70'
            }`}
          >
            <Share2 className="w-4 h-4 text-rose-500" />
            <span>Compartir</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200/70'} space-y-3`}>
            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="flex gap-2 items-center">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-rose-200 shrink-0 border border-white/20 flex items-center justify-center font-bold text-xs text-rose-800">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="Tú" className="w-full h-full object-cover" />
                ) : (
                  currentUserName.charAt(0) || 'M'
                )}
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario cariñoso..."
                className={`flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                  isDark 
                    ? 'bg-black/20 border-white/10 text-white placeholder-slate-400' 
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white disabled:opacity-40 transition cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 text-xs sm:text-sm items-start">
                    <div className="w-7 h-7 rounded-xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center font-bold text-[11px] text-rose-800">
                      {c.authorAvatar ? (
                        <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                      ) : (
                        c.authorName?.charAt(0) || 'M'
                      )}
                    </div>
                    <div className={`flex-1 p-2.5 rounded-2xl ${
                      isDark ? 'bg-white/5 border border-white/5' : 'bg-white/80 border border-slate-200/60'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-rose-500">{c.authorName}</span>
                        <span className="text-[10px] opacity-60">
                          {c.timestamp?.toDate ? new Date(c.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'reciente'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm leading-relaxed">{c.texto}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-2 text-xs opacity-60 italic">
                  Sé la primera mamá en dejar un comentario con amor 💕
                </p>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Modal de compartir en la comunidad */}
      <CompartirModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={post}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        isDark={isDark}
        onShareSuccess={handleShareSuccess}
      />
    </>
  );
};
