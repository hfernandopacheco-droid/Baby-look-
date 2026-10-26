import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Flag, 
  Send, 
  ThumbsUp, 
  Smile, 
  Check, 
  Play, 
  AlertCircle 
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  CommunityPost, 
  CommunityComment, 
  CommunityReactionType 
} from '../../types';
import { 
  togglePostReaction, 
  addPostComment, 
  incrementPostShares, 
  reportPost 
} from './communityService';

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onNavigateProfile: (uid: string) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onNavigateProfile
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [userReaction, setUserReaction] = useState<CommunityReactionType | null>(null);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.comentariosCount || 0);
  const [sharesCount, setSharesCount] = useState(post.compartidosCount || 0);
  const [isLikingAnim, setIsLikingAnim] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Contenido inapropiado');
  const [reported, setReported] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea')) {
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      handleQuickLike();
      setShowDoubleTapHeart(true);
      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1000);
    }
    lastTapRef.current = now;
  };

  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Liquid Glass styling strictly as requested:
  // dark: rgba(35,35,42,0.65) blur 24px | light: rgba(255,250,240,0.75) blur 24px
  const glassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: isDark ? '0 12px 36px 0 rgba(0, 0, 0, 0.35)' : '0 12px 36px 0 rgba(190, 150, 120, 0.14)',
  };

  // Sync likes and comments count from props
  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    setCommentsCount(post.comentariosCount || 0);
    setSharesCount(post.compartidosCount || 0);
  }, [post.likesCount, post.comentariosCount, post.compartidosCount]);

  // Listen to user's reaction for this post
  useEffect(() => {
    if (!currentUserId || !post.id) return;
    const reactionRef = doc(db, 'community_posts', post.id, 'reacciones', currentUserId);
    const unsub = onSnapshot(reactionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserReaction((data.tipo as CommunityReactionType) || 'me_gusta');
      } else {
        setUserReaction(null);
      }
    }, () => {});
    return () => unsub();
  }, [post.id, currentUserId]);

  // Listen to comments if open
  useEffect(() => {
    if (!showComments || !post.id) return;
    const commentsQ = query(
      collection(db, 'community_posts', post.id, 'comentarios'),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(commentsQ, (snap) => {
      const list: CommunityComment[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          uid: data.uid,
          authorName: data.authorName || 'Mamá',
          authorAvatar: data.authorAvatar,
          texto: data.texto || '',
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        });
      });
      setComments(list);
      setCommentsCount(list.length);
    }, (err) => {
      console.warn("Comments listener warning:", err);
    });

    return () => unsub();
  }, [showComments, post.id]);

  // Handle reaction trigger
  const handleSelectReaction = async (type: CommunityReactionType) => {
    setShowReactionPicker(false);
    setIsLikingAnim(true);
    setTimeout(() => setIsLikingAnim(false), 600);

    const prevReaction = userReaction;
    if (prevReaction === type) {
      setUserReaction(null);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setUserReaction(type);
      if (!prevReaction) setLikesCount(prev => prev + 1);
    }

    try {
      await togglePostReaction(post.id, currentUserId, type, prevReaction);
    } catch (e) {
      console.warn("Reaction failed:", e);
    }
  };

  // Quick Like toggle
  const handleQuickLike = () => {
    if (userReaction) {
      handleSelectReaction(userReaction);
    } else {
      handleSelectReaction('me_encanta');
    }
  };

  // Handle submit comment
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    const textToSend = commentText.trim();
    setCommentText('');

    try {
      await addPostComment(
        post.id,
        {
          uid: currentUserId,
          name: currentUserName || 'Mamá',
          avatar: currentUserAvatar
        },
        textToSend
      );
      setCommentsCount(prev => prev + 1);
    } catch (err) {
      console.warn("Failed sending comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Share
  const handleShare = async () => {
    setSharesCount(prev => prev + 1);
    incrementPostShares(post.id);

    const shareData = {
      title: `Publicación de ${post.authorName} en Comunidad Mamás`,
      text: post.texto.slice(0, 120),
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch (e) {}
    }
  };

  // Handle Report
  const handleSendReport = async () => {
    try {
      await reportPost(post.id, currentUserId, reportReason);
      setReported(true);
      setReportModalOpen(false);
      setMenuOpen(false);
    } catch (e) {
      console.warn("Report failed:", e);
    }
  };

  // Format relative time (e.g. hace 2h)
  const formatRelativeTime = (ts: any): string => {
    if (!ts) return 'reciente';
    const millis = typeof ts === 'number' ? ts : (ts?.toMillis ? ts.toMillis() : Date.now());
    const diff = Math.floor((Date.now() - millis) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
    return new Date(millis).toLocaleDateString();
  };

  if (reported) {
    return (
      <div 
        className="rounded-3xl p-4 text-center text-xs opacity-75 border border-dashed my-3"
        style={glassStyle}
      >
        <span className="text-amber-500 font-semibold">Post reportado a moderación. Gracias por mantener segura la comunidad.</span>
      </div>
    );
  }

  return (
    <article 
      id={`post-${post.id}`}
      onClick={handleCardClick}
      onDoubleClick={() => {
        handleQuickLike();
        setShowDoubleTapHeart(true);
        setTimeout(() => setShowDoubleTapHeart(false), 1000);
      }}
      className="rounded-3xl p-4 sm:p-5 mb-4 transition-all duration-300 relative overflow-hidden cursor-pointer"
      style={glassStyle}
    >
      {/* Animated Double-Tap Heart Overlay (disappears after 1 second) */}
      {showDoubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scaleUp">
          <div className="w-24 h-24 rounded-full bg-rose-500/95 flex items-center justify-center shadow-2xl animate-bounce">
            <Heart className="w-14 h-14 text-white fill-white animate-pulse" />
          </div>
        </div>
      )}
      {/* Header: Author, Time, Menu */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div 
          onClick={() => onNavigateProfile(post.uid)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-rose-200 shadow-md flex items-center justify-center border-2 border-rose-300/40 group-hover:scale-105 transition">
              {post.authorAvatar ? (
                <img 
                  src={post.authorAvatar} 
                  alt={post.authorName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xl">👩‍🍼</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>

          <div>
            <h3 className={`font-bold text-sm sm:text-base leading-tight group-hover:text-rose-500 transition ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {post.authorName}
            </h3>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatRelativeTime(post.timestamp)}
            </span>
          </div>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative">
          <button
            id={`post-menu-btn-${post.id}`}
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-black/5'}`}
            title="Opciones"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 top-10 w-44 rounded-2xl p-1.5 z-20 shadow-xl border"
              style={{
                background: isDark ? 'rgba(30,30,36,0.95)' : 'rgba(255,255,255,0.98)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setReportModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition text-left"
              >
                <Flag className="w-4 h-4" />
                <span>Reportar post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Text */}
      <div className={`text-sm sm:text-base leading-relaxed mb-3 whitespace-pre-wrap font-normal ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
        {post.texto}
      </div>

      {/* Media (Photo / Video) */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mb-3 rounded-2xl overflow-hidden border border-white/20 shadow-inner max-h-[440px] bg-black/5">
          {post.mediaType === 'video' ? (
            <video 
              src={post.mediaUrls[0]} 
              controls 
              playsInline
              className="w-full max-h-[420px] object-contain rounded-2xl bg-black"
            />
          ) : (
            <img 
              src={post.mediaUrls[0]} 
              alt="Foto del bebé" 
              className="w-full max-h-[420px] object-cover rounded-2xl hover:scale-[1.01] transition duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Reactions / Stats Summary Bar */}
      <div className={`flex items-center justify-between text-xs py-2 px-1 border-b ${isDark ? 'border-white/10 text-slate-400' : 'border-black/5 text-slate-600'}`}>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="flex -space-x-1 items-center">
            <span className="inline-block w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center shadow">❤️</span>
            <span className="inline-block w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[11px] flex items-center justify-center shadow">😍</span>
          </span>
          <span>{likesCount} {likesCount === 1 ? 'reacción' : 'reacciones'}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="hover:underline cursor-pointer"
          >
            {commentsCount} {commentsCount === 1 ? 'comentario' : 'comentarios'}
          </button>
          <span>•</span>
          <span>{sharesCount} compartidos</span>
        </div>
      </div>

      {/* Action Buttons: Me gusta, Comentar, Compartir */}
      <div className="flex items-center justify-between pt-2 relative">
        {/* Floating Reaction Picker */}
        {showReactionPicker && (
          <div 
            onMouseLeave={() => setShowReactionPicker(false)}
            className="absolute -top-12 left-0 z-30 flex items-center gap-2 p-1.5 rounded-full shadow-2xl border animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              background: isDark ? 'rgba(25, 25, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
          >
            <button
              onClick={() => handleSelectReaction('me_gusta')}
              className="p-1.5 hover:scale-125 transition transform active:scale-95 text-lg"
              title="Me gusta"
            >
              👍
            </button>
            <button
              onClick={() => handleSelectReaction('me_encanta')}
              className="p-1.5 hover:scale-125 transition transform active:scale-95 text-lg"
              title="Me encanta"
            >
              ❤️
            </button>
            <button
              onClick={() => handleSelectReaction('me_divierte')}
              className="p-1.5 hover:scale-125 transition transform active:scale-95 text-lg"
              title="Me divierte"
            >
              😂
            </button>
          </div>
        )}

        {/* Me gusta button */}
        <button
          id={`post-like-btn-${post.id}`}
          onClick={handleQuickLike}
          onMouseEnter={() => {
            reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(true), 350);
          }}
          onMouseLeave={() => {
            if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
          }}
          className={`flex-1 py-2 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95 cursor-pointer ${
            userReaction === 'me_encanta'
              ? 'text-rose-500 bg-rose-500/10'
              : userReaction === 'me_gusta'
              ? 'text-blue-500 bg-blue-500/10'
              : userReaction === 'me_divierte'
              ? 'text-amber-500 bg-amber-500/10'
              : isDark
              ? 'text-slate-300 hover:bg-white/5'
              : 'text-slate-700 hover:bg-black/5'
          } ${isLikingAnim ? 'scale-110' : ''}`}
        >
          {userReaction === 'me_encanta' ? (
            <span className="text-base animate-bounce">❤️</span>
          ) : userReaction === 'me_divierte' ? (
            <span className="text-base animate-bounce">😂</span>
          ) : userReaction === 'me_gusta' ? (
            <span className="text-base animate-bounce">👍</span>
          ) : (
            <Heart className="w-4 h-4" />
          )}
          <span>{userReaction ? (userReaction === 'me_encanta' ? 'Me encanta' : userReaction === 'me_divierte' ? 'Me divierte' : 'Me gusta') : 'Me gusta'}</span>
        </button>

        {/* Comentar button */}
        <button
          id={`post-comment-btn-${post.id}`}
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 py-2 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95 cursor-pointer ${
            showComments ? 'text-rose-500 bg-rose-500/10' : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-black/5'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comentar</span>
        </button>

        {/* Compartir button */}
        <button
          id={`post-share-btn-${post.id}`}
          onClick={handleShare}
          className={`flex-1 py-2 px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95 cursor-pointer ${
            isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-black/5'
          }`}
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedLink ? '¡Copiado!' : 'Compartir'}</span>
        </button>
      </div>

      {/* Embedded Comments Section */}
      {showComments && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-black/5'} animate-in fade-in duration-200`}>
          {/* New Comment Input */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="Tú" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm">👩‍🍼</span>
              )}
            </div>
            <div className="flex-1 relative">
              <input
                id={`comment-input-${post.id}`}
                type="text"
                placeholder="Escribe un comentario cariñoso..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`w-full py-2 pl-3 pr-10 rounded-2xl text-xs sm:text-sm outline-none transition border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-rose-400' 
                    : 'bg-white/70 border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
                }`}
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-center py-2 text-slate-400">
                Sé la primera mamá en dejar un comentario 💕
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <div 
                    onClick={() => onNavigateProfile(c.uid)}
                    className="w-7 h-7 rounded-xl overflow-hidden bg-rose-200 shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    {c.authorAvatar ? (
                      <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">👶</span>
                    )}
                  </div>
                  <div 
                    className={`flex-1 p-2.5 rounded-2xl text-xs ${
                      isDark ? 'bg-white/5 text-slate-200' : 'bg-black/5 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span 
                        onClick={() => onNavigateProfile(c.uid)}
                        className="font-bold cursor-pointer hover:underline text-rose-500"
                      >
                        {c.authorName}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {formatRelativeTime(c.timestamp)}
                      </span>
                    </div>
                    <p className="leading-snug">{c.texto}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm rounded-3xl p-5 shadow-2xl border"
            style={{
              background: isDark ? 'rgba(30,30,36,0.98)' : 'rgba(255,255,255,0.98)',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-center gap-2.5 mb-3 text-rose-500">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-base">Reportar contenido</h4>
            </div>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Ayúdanos a mantener la Comunidad Mamás segura y respetuosa. ¿Por qué deseas reportar esta publicación?
            </p>

            <div className="space-y-2 mb-4">
              {[
                'Contenido inapropiado o violento',
                'Desinformación médica o de salud infantil',
                'Spam, ventas o publicidad no permitida',
                'Falta de respeto o acoso'
              ].map((reason) => (
                <label 
                  key={reason} 
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    reportReason === reason 
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold' 
                      : isDark ? 'border-white/10 text-slate-300' : 'border-black/10 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reportReason === reason}
                    onChange={() => setReportReason(reason)}
                    className="accent-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition"
              >
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
