import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  UserPlus, 
  Check, 
  Users, 
  Calendar, 
  Baby, 
  Sparkles, 
  Save, 
  X, 
  Heart 
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { CommunityProfile, CommunityPost } from '../../types';
import { 
  getOrCreateCommunityProfile, 
  updateCommunityProfile, 
  toggleFollowUser, 
  checkIfFollowing 
} from './communityService';
import { CommunityPostCard } from './CommunityPostCard';

interface CommunityProfileViewProps {
  targetUid: string;
  myUid: string;
  myDisplayName: string;
  myAvatar?: string;
  isDark: boolean;
  onBack: () => void;
  onNavigateProfile: (uid: string) => void;
}

export const CommunityProfileView: React.FC<CommunityProfileViewProps> = ({
  targetUid,
  myUid,
  myDisplayName,
  myAvatar,
  isDark,
  onBack,
  onNavigateProfile
}) => {
  const isMyProfile = targetUid === myUid;
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBebeEdad, setEditBebeEdad] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Liquid Glass styling:
  const glassStyle: React.CSSProperties = {
    background: isDark ? 'rgba(35, 35, 42, 0.65)' : 'rgba(255, 250, 240, 0.75)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.7)',
    boxShadow: isDark ? '0 12px 36px 0 rgba(0, 0, 0, 0.35)' : '0 12px 36px 0 rgba(190, 150, 120, 0.14)',
  };

  // Load profile data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const docRef = doc(db, 'community_profiles', targetUid);
    const unsub = onSnapshot(docRef, async (snap) => {
      if (!isMounted) return;
      if (snap.exists()) {
        const data = snap.data();
        const prof: CommunityProfile = {
          uid: targetUid,
          displayName: data.displayName || 'Mamá en Baby Day',
          avatarUrl: data.avatarUrl || (isMyProfile ? myAvatar : ''),
          bio: data.bio || 'Compartiendo vivencias de mamá 💕',
          bebeEdad: data.bebeEdad || 'Bebé',
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
        };
        setProfile(prof);
        setFollowersCount(prof.followersCount);
        setFollowingCount(prof.followingCount);
        setEditName(prof.displayName);
        setEditBio(prof.bio || '');
        setEditBebeEdad(prof.bebeEdad || '');
      } else {
        // Create profile if missing
        const newProf = await getOrCreateCommunityProfile(
          targetUid, 
          isMyProfile ? myDisplayName : 'Mamá', 
          isMyProfile ? myAvatar : undefined
        );
        if (isMounted) {
          setProfile(newProf);
          setFollowersCount(newProf.followersCount);
          setFollowingCount(newProf.followingCount);
          setEditName(newProf.displayName);
          setEditBio(newProf.bio || '');
          setEditBebeEdad(newProf.bebeEdad || '');
        }
      }
      setLoading(false);
    }, (err) => {
      console.warn("Error listening to profile:", err);
      setLoading(false);
    });

    if (!isMyProfile) {
      checkIfFollowing(myUid, targetUid).then((fol) => {
        if (isMounted) setIsFollowing(fol);
      });
    }

    return () => {
      isMounted = false;
      unsub();
    };
  }, [targetUid, myUid, isMyProfile, myDisplayName, myAvatar]);

  // Load user's posts
  useEffect(() => {
    const qPosts = query(
      collection(db, 'community_posts'),
      where('uid', '==', targetUid)
    );

    const unsub = onSnapshot(qPosts, (snap) => {
      const list: CommunityPost[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
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
      // Sort in memory to avoid index requirements
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setPosts(list);
    });

    return () => unsub();
  }, [targetUid]);

  // Handle follow / unfollow
  const handleFollowToggle = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await toggleFollowUser(myUid, targetUid, isFollowing);
    } catch (e) {
      console.warn("Follow toggle failed:", e);
      setIsFollowing(!nextState);
      setFollowersCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  // Handle save edit profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingEdit(true);

    try {
      await updateCommunityProfile(targetUid, {
        displayName: editName.trim() || profile.displayName,
        bio: editBio.trim(),
        bebeEdad: editBebeEdad.trim()
      });
      setIsEditing(false);
    } catch (e) {
      console.warn("Failed saving profile:", e);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className={`p-2.5 rounded-2xl transition flex items-center gap-2 font-bold text-xs ${
            isDark ? 'text-white bg-white/5 hover:bg-white/10' : 'text-slate-800 bg-black/5 hover:bg-black/10'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Feed</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-3xl p-5 sm:p-6 mb-6 overflow-hidden relative" style={glassStyle}>
        {/* Decorative Cover Gradient */}
        <div className="h-28 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Profile Avatar & Actions row */}
        <div className="flex items-end justify-between -mt-16 mb-4 relative z-10">
          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-rose-200 border-4 border-white shadow-xl flex items-center justify-center">
            {profile?.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.displayName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-4xl">👩‍🍼</span>
            )}
          </div>

          <div>
            {isMyProfile ? (
              <button
                id="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                className="py-2 px-4 rounded-2xl font-bold text-xs flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Perfil</span>
              </button>
            ) : (
              <button
                id="follow-profile-btn"
                onClick={handleFollowToggle}
                className={`py-2 px-5 rounded-2xl font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg ${
                  isFollowing
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Siguiendo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Seguir a esta Mamá</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Name and baby details */}
        <div className="mb-3">
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {profile?.displayName || 'Mamá'}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-rose-500">
            <Baby className="w-3.5 h-3.5" />
            <span>{profile?.bebeEdad || 'Mamá en Baby Day'}</span>
          </div>
        </div>

        {/* Bio */}
        <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {profile?.bio || 'Mamá aprendiendo y disfrutando de la maternidad cada día 💕'}
        </p>

        {/* Counters (Followers, Following, Posts) */}
        <div className={`flex items-center gap-6 pt-3 border-t text-xs ${isDark ? 'border-white/10' : 'border-black/5'}`}>
          <div className="flex items-center gap-1.5 font-bold">
            <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {followersCount}
            </span>
            <span className="text-slate-400 font-medium">Seguidoras</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {followingCount}
            </span>
            <span className="text-slate-400 font-medium">Siguiendo</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {posts.length}
            </span>
            <span className="text-slate-400 font-medium">Posts</span>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <div>
        <h3 className={`font-bold text-sm mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Publicaciones ({posts.length})</span>
        </h3>

        {posts.length === 0 ? (
          <div className="rounded-3xl p-8 text-center" style={glassStyle}>
            <p className="text-xs text-slate-400">Esta mamá aún no ha compartido publicaciones.</p>
          </div>
        ) : (
          posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              currentUserId={myUid}
              currentUserName={myDisplayName}
              currentUserAvatar={myAvatar}
              isDark={isDark}
              onNavigateProfile={onNavigateProfile}
            />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md rounded-3xl p-5 shadow-2xl border animate-in zoom-in-95 duration-200"
            style={{
              background: isDark ? 'rgba(30,30,36,0.98)' : 'rgba(255,255,255,0.98)',
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Editar mi perfil de Comunidad
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre para mostrar</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Bebé y Edad (ej. Mathews - 7 meses)</label>
                <input
                  type="text"
                  value={editBebeEdad}
                  onChange={(e) => setEditBebeEdad(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Biografía o Presentación</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none resize-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
