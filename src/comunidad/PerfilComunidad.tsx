import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  Plus, 
  Edit3, 
  MoreHorizontal, 
  MapPin, 
  Home, 
  Calendar, 
  Heart, 
  Users, 
  Baby, 
  Sparkles, 
  Check, 
  UserPlus, 
  Clock, 
  MessageSquare, 
  Grid, 
  Image as ImageIcon, 
  Video, 
  X,
  Share2,
  ShieldCheck,
  Search
} from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { PostCard, PostData } from './PostCard';
import { YA } from '../utils';

interface PerfilComunidadProps {
  profileUid: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onBack: () => void;
  onNavigateProfile: (uid: string) => void;
  onOpenSearch?: () => void;
  onOpenCrearPost?: () => void;
}

export const PerfilComunidad: React.FC<PerfilComunidadProps> = ({
  profileUid,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onBack,
  onNavigateProfile,
  onOpenSearch,
  onOpenCrearPost
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [activeContentTab, setActiveContentTab] = useState<'todo' | 'fotos' | 'reels'>('todo');
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<{ url: string; caption?: string } | null>(null);
  const [photoFilter, setPhotoFilter] = useState<'todas' | 'bebe' | 'perfil'>('todas');
  
  // Amistad y conexiones
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [incomingReq, setIncomingReq] = useState<any>(null);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados de edición estilo Facebook
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editBabyName, setEditBabyName] = useState('');
  const [editBabyBirth, setEditBabyBirth] = useState('');
  const [editCiudad, setEditCiudad] = useState('');
  const [editLactancia, setEditLactancia] = useState('');
  const [editFamilia, setEditFamilia] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Pensamiento rápido / Nota
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  // Upload refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Mensaje directo privado
  const [isDirectMessageModalOpen, setIsDirectMessageModalOpen] = useState(false);
  const [directMessageText, setDirectMessageText] = useState('');
  const [isSendingDirectMessage, setIsSendingDirectMessage] = useState(false);

  const isMyProfile = currentUserId === profileUid;

  // Liquid glass styling
  const liquidGlassCard: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.75)' : 'rgba(255, 248, 235, 0.75)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.65)',
    boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.35)' : '0 12px 36px rgba(180, 140, 110, 0.12)'
  };

  // 1. Escuchar perfil de la comunidad
  useEffect(() => {
    if (!profileUid) return;
    const profRef = doc(db, 'community_profiles', profileUid);
    const unsub = onSnapshot(profRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setEditBio(data.bio || '');
        setEditBabyName(data.babyName || '');
        setEditBabyBirth(data.babyBirthDate || '2026-02-15');
        setEditCiudad(data.ciudad || 'Bogotá, Colombia');
        setEditLactancia(data.lactancia || 'Lactancia Materna Exclusiva');
        setEditFamilia(data.familia || 'Mamá, Papá y Bebé');
      } else {
        // Fallback profile
        const localBaby = JSON.parse(localStorage.getItem(`bubblo_baby_${profileUid}`) || '{}');
        const fallback = {
          uid: profileUid,
          displayName: isMyProfile ? currentUserName : 'Mamá Baby Day',
          babyName: localBaby.name || 'Mateo',
          babyBirthDate: localBaby.birthDate || '2026-02-15',
          avatarUrl: isMyProfile ? (currentUserAvatar || '') : '',
          coverUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&auto=format&fit=crop&q=80',
          bio: 'Mamá aprendiendo cada día con amor, paciencia y alegría 💕',
          ciudad: 'Bogotá, Colombia',
          lactancia: 'Lactancia Materna Exclusiva',
          familia: 'Mamá, Papá y Bebé',
          note: ''
        };
        setProfile(fallback);
        setEditBio(fallback.bio);
        setEditBabyName(fallback.babyName);
        setEditBabyBirth(fallback.babyBirthDate);
        setEditCiudad(fallback.ciudad);
        setEditLactancia(fallback.lactancia);
        setEditFamilia(fallback.familia);
      }
    }, (err) => console.warn("Error reading profile:", err));

    return () => unsub();
  }, [profileUid, isMyProfile, currentUserName, currentUserAvatar]);

  // 2. Escuchar publicaciones de este usuario
  useEffect(() => {
    if (!profileUid) return;
    const qPosts = query(
      collection(db, 'community_posts'),
      where('uid', '==', profileUid)
    );
    const unsub = onSnapshot(qPosts, (snap) => {
      const list: PostData[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as PostData);
      });
      list.sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return tB - tA;
      });
      setUserPosts(list);
    }, (err) => console.warn("Posts sync notice:", err));

    return () => unsub();
  }, [profileUid]);

  // 3. Estado de Amistad y Solicitudes
  useEffect(() => {
    if (!profileUid || !currentUserId || isMyProfile) return;

    // Verificar si son amigas
    const friendDocRef = doc(db, 'community_friends', `${currentUserId}_${profileUid}`);
    const unsubFriend = onSnapshot(friendDocRef, (snap) => {
      setIsFriend(snap.exists());
    }, () => {});

    // Solicitud enviada por mí
    const sentReqRef = doc(db, 'community_friend_requests', `${currentUserId}_${profileUid}`);
    const unsubSent = onSnapshot(sentReqRef, (snap) => {
      setIsRequestSent(snap.exists() && snap.data()?.status === 'pending');
    }, () => {});

    // Solicitud recibida desde ella
    const recvReqRef = doc(db, 'community_friend_requests', `${profileUid}_${currentUserId}`);
    const unsubRecv = onSnapshot(recvReqRef, (snap) => {
      if (snap.exists() && snap.data()?.status === 'pending') {
        setIncomingReq({ id: snap.id, ...snap.data() });
      } else {
        setIncomingReq(null);
      }
    }, () => {});

    return () => {
      unsubFriend();
      unsubSent();
      unsubRecv();
    };
  }, [profileUid, currentUserId, isMyProfile]);

  // 4. Contador de amigas
  useEffect(() => {
    if (!profileUid) return;
    const qF = query(
      collection(db, 'community_friends'),
      where('user1', '==', profileUid)
    );
    const unsub = onSnapshot(qF, (snap) => {
      setFriendsCount(snap.size || 0);
    }, () => {});
    return () => unsub();
  }, [profileUid]);

  // Manejar enviar solicitud de amistad
  const handleSendFriendRequest = async () => {
    if (!currentUserId || !profileUid) return;
    setActionLoading(true);
    try {
      const requestId = `${currentUserId}_${profileUid}`;
      await setDoc(doc(db, "community_friend_requests", requestId), {
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        toUid: profileUid,
        toName: profile?.displayName || 'Mamá Baby Day',
        toAvatar: profile?.avatarUrl || '',
        status: 'pending',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      const notifId = `notif_friend_${Date.now()}_${currentUserId}`;
      await setDoc(doc(db, "community_notifications", notifId), {
        toUid: profileUid,
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        type: 'friend_request',
        requestId,
        text: `${currentUserName} te envió una solicitud de amistad 👭`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      setIsRequestSent(true);
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Manejar aceptar solicitud de amistad
  const handleAcceptFriendRequest = async () => {
    if (!currentUserId || !profileUid) return;
    setActionLoading(true);
    try {
      const requestId = `${profileUid}_${currentUserId}`;
      await setDoc(doc(db, "community_friend_requests", requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, "community_friends", `${currentUserId}_${profileUid}`), {
        user1: currentUserId,
        user2: profileUid,
        friendUid: profileUid,
        friendName: profile?.displayName || 'Mamá Baby Day',
        friendAvatar: profile?.avatarUrl || '',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      await setDoc(doc(db, "community_friends", `${profileUid}_${currentUserId}`), {
        user1: profileUid,
        user2: currentUserId,
        friendUid: currentUserId,
        friendName: currentUserName,
        friendAvatar: currentUserAvatar || '',
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });

      setIsFriend(true);
      setIncomingReq(null);
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Subir / cambiar foto de portada o avatar con compresión instantánea
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file || !isMyProfile) return;
    setUploadingMedia(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        // Optimizar en canvas a tamaño balanceado
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = type === 'cover' ? 1200 : 400;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);

          const profRef = doc(db, 'community_profiles', currentUserId);
          if (type === 'cover') {
            await setDoc(profRef, { coverUrl: compressed, updatedAt: serverTimestamp() }, { merge: true });
            localStorage.setItem(`bubblo_cover_${currentUserId}`, compressed);
          } else {
            await setDoc(profRef, { avatarUrl: compressed, updatedAt: serverTimestamp() }, { merge: true });
            localStorage.setItem(`bubblo_photo_${currentUserId}`, compressed);
          }
          setUploadingMedia(false);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading profile media:", err);
      setUploadingMedia(false);
    }
  };

  // Guardar cambios en el perfil completo estilo Facebook
  const handleSaveFullProfile = async () => {
    if (!isMyProfile) return;
    setIsSavingEdit(true);

    try {
      const profRef = doc(db, 'community_profiles', currentUserId);
      const userRef = doc(db, 'users', currentUserId);

      const updateData = {
        displayName: currentUserName,
        babyName: editBabyName.trim() || profile?.babyName,
        babyBirthDate: editBabyBirth,
        bio: editBio.trim(),
        ciudad: editCiudad.trim(),
        lactancia: editLactancia.trim(),
        familia: editFamilia.trim(),
        updatedAt: serverTimestamp()
      };

      await setDoc(profRef, updateData, { merge: true });
      await setDoc(userRef, {
        babyName: editBabyName.trim(),
        fechaNacimiento: editBabyBirth,
        ciudad: editCiudad.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Guardar también en memoria local interna aislada del usuario
      localStorage.setItem(`bubblo_baby_${currentUserId}`, JSON.stringify({
        name: editBabyName.trim(),
        birthDate: editBabyBirth,
        height: 65,
        weight: 7.2
      }));

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error saving full profile:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Guardar estado / nota de mamá
  const handleSaveNote = async () => {
    if (!isMyProfile) return;
    try {
      const profRef = doc(db, 'community_profiles', currentUserId);
      await setDoc(profRef, { note: noteInput.trim(), noteTime: Date.now() }, { merge: true });
      setIsNoteModalOpen(false);
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  // Enviar mensaje privado directo
  const handleSendDirectMessage = async () => {
    if (!directMessageText.trim() || !profileUid) return;
    setIsSendingDirectMessage(true);
    try {
      const notifId = `notif_msg_${Date.now()}_${currentUserId}`;
      await setDoc(doc(db, "community_notifications", notifId), {
        toUid: profileUid,
        fromUid: currentUserId,
        fromName: currentUserName,
        fromAvatar: currentUserAvatar || '',
        type: 'direct_message',
        text: `Mensaje de ${currentUserName}: "${directMessageText.trim()}"`,
        read: false,
        timestamp: serverTimestamp(),
        createdAt: Date.now()
      });
      YA(`¡Mensaje enviado a ${profile?.displayName || 'esta mamá'}! 💕`);
      setDirectMessageText('');
      setIsDirectMessageModalOpen(false);
    } catch (e) {
      console.error("Error sending message:", e);
      YA("No se pudo enviar el mensaje");
    } finally {
      setIsSendingDirectMessage(false);
    }
  };

  const coverImage = profile?.coverUrl || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&auto=format&fit=crop&q=80';
  const avatarImage = profile?.avatarUrl || (isMyProfile ? currentUserAvatar : '') || '';

  // Listado consolidado de fotos de la mamá (publicaciones + perfil + portada)
  const profilePhotos = React.useMemo(() => {
    const list: { url: string; id: string; caption?: string; category: 'bebe' | 'perfil' | 'general' }[] = [];
    userPosts.forEach((post) => {
      if (post.mediaType !== 'video' && post.mediaUrls && post.mediaUrls.length > 0) {
        post.mediaUrls.forEach((url, i) => {
          list.push({
            url,
            id: `${post.id || 'p'}_${i}`,
            caption: post.texto || 'Momento con mi bebé 💕',
            category: 'bebe'
          });
        });
      }
    });
    if (avatarImage) {
      list.push({
        url: avatarImage,
        id: 'avatar_img',
        caption: `Foto de perfil de ${profile?.displayName || currentUserName}`,
        category: 'perfil'
      });
    }
    if (coverImage && !coverImage.includes('unsplash')) {
      list.push({
        url: coverImage,
        id: 'cover_img',
        caption: 'Foto de portada en Baby Day',
        category: 'perfil'
      });
    }
    return list;
  }, [userPosts, avatarImage, coverImage, profile?.displayName, currentUserName]);

  // Listado consolidado de videos / reels de la mamá
  const profileVideos = React.useMemo(() => {
    return userPosts.filter(p => 
      p.mediaType === 'video' || 
      (p.mediaUrls?.[0] && (
        p.mediaUrls[0].includes('.mp4') || 
        p.mediaUrls[0].includes('.webm') || 
        p.mediaUrls[0].startsWith('firestore-media://') ||
        p.mediaUrls[0].startsWith('data:video')
      ))
    );
  }, [userPosts]);

  // Filtro de fotos por categoría
  const displayedPhotos = React.useMemo(() => {
    if (photoFilter === 'todas') return profilePhotos;
    return profilePhotos.filter(p => p.category === photoFilter);
  }, [profilePhotos, photoFilter]);

  return (
    <div className="space-y-4 pb-16">
      {/* Hidden inputs for uploading photos */}
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={(e) => handleFileChange(e, 'cover')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleFileChange(e, 'avatar')} 
        accept="image/*" 
        className="hidden" 
      />

      {/* 1. Header Bar estilo Facebook */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2.5 rounded-2xl transition cursor-pointer border ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
            }`}
            title="Regresar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg leading-tight truncate max-w-[200px] sm:max-w-xs">
              {profile?.displayName || (isMyProfile ? currentUserName : 'Mamá Baby Day')}
            </h2>
            {isFriend && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                Amigas
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="Buscar amigas"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {isMyProfile && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="Editar perfil"
            >
              <Edit3 className="w-4 h-4 text-rose-500" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Hero Card estilo Facebook (Foto de portada + Avatar superpuesto + Datos) */}
      <div 
        className="rounded-3xl overflow-hidden shadow-xl"
        style={liquidGlassCard}
      >
        {/* Banner de Portada */}
        <div className="relative w-full h-44 sm:h-56 bg-slate-800 overflow-hidden">
          <img 
            src={coverImage} 
            alt="Portada" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

          {/* Botón de cámara para cambiar portada */}
          {isMyProfile && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white shadow-lg border border-white/20 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Editar portada</span>
            </button>
          )}
        </div>

        {/* Bloque de Información & Avatar superpuesto */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar circular con badge de cámara y globo de pensamiento */}
          <div className="relative -mt-16 sm:-mt-20 mb-3 flex flex-col items-start">
            {/* Globo de Pensamiento / Nota estilo Facebook */}
            <div 
              onClick={() => {
                if (isMyProfile) {
                  setNoteInput(profile?.note || '');
                  setIsNoteModalOpen(true);
                }
              }}
              className={`mb-2 px-3 py-1.5 rounded-2xl text-xs font-medium max-w-[240px] shadow-lg border transition-all cursor-pointer select-none flex items-center gap-1.5 animate-fadeIn ${
                isDark ? 'bg-slate-900/90 border-white/15 text-slate-200 hover:bg-slate-900' : 'bg-white/95 border-rose-200 text-slate-800 hover:bg-white'
              }`}
              title={isMyProfile ? "Haz clic para compartir un pensamiento de mamá" : undefined}
            >
              <span className="text-sm">💭</span>
              <span className="truncate">
                {profile?.note ? profile.note : (isMyProfile ? 'Compartir una nota...' : 'Pensamiento de mamá')}
              </span>
            </div>

            {/* Avatar circular */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-extrabold text-4xl">
                {avatarImage ? (
                  <img 
                    src={avatarImage} 
                    alt={profile?.displayName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile?.displayName?.charAt(0).toUpperCase() || 'M'}</span>
                )}
              </div>

              {/* Botón de cámara en el avatar */}
              {isMyProfile && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-900/80 text-white border-2 border-white dark:border-slate-900 shadow-md hover:bg-slate-900 transition cursor-pointer"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Nombre y subtítulo */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
              <span>{profile?.displayName || (isMyProfile ? currentUserName : 'Mamá Baby Day')}</span>
              <span className="text-emerald-500 text-base" title="Mamá verificada">✓</span>
            </h1>

            <p className="text-xs font-semibold text-rose-500 flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5" />
              <span>Mamá de {profile?.babyName || 'Bebé'}</span>
            </p>

            <p className="text-xs opacity-70 font-medium">
              <span className="font-bold text-foreground">{friendsCount}</span> amigas • <span className="font-bold text-foreground">{userPosts.length}</span> publicaciones
            </p>
          </div>

          {/* Amigas con cosas en común (Avatares superpuestos estilo Facebook) */}
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-rose-400 flex items-center justify-center text-[10px] text-white font-bold">🌸</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-amber-400 flex items-center justify-center text-[10px] text-white font-bold">🍼</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-teal-400 flex items-center justify-center text-[10px] text-white font-bold">💕</div>
            </div>
            <span className="text-xs opacity-75 font-medium">
              Amigas con cosas en común de maternidad
            </span>
          </div>

          {/* Botones de acción principales estilo Facebook */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {isMyProfile ? (
              <>
                {/* Botón 1: Agregar a historia / nota */}
                <button
                  type="button"
                  onClick={() => {
                    setNoteInput(profile?.note || '');
                    setIsNoteModalOpen(true);
                  }}
                  className="flex-1 min-w-[140px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Agregar a historia</span>
                </button>

                {/* Botón 2: Editar perfil */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className={`py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                    isDark 
                      ? 'bg-white/10 border-white/15 text-white hover:bg-white/20' 
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar perfil</span>
                </button>
              </>
            ) : (
              <>
                {/* Botón Amistad */}
                {isFriend ? (
                  <div className="py-2.5 px-4 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-emerald-500/20">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Amigas</span>
                  </div>
                ) : incomingReq ? (
                  <button
                    type="button"
                    onClick={handleAcceptFriendRequest}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{actionLoading ? 'Aceptando...' : 'Aceptar solicitud'}</span>
                  </button>
                ) : isRequestSent ? (
                  <div className="py-2.5 px-4 rounded-2xl bg-amber-500/15 text-amber-500 font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-amber-500/20">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Solicitud enviada</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendFriendRequest}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{actionLoading ? 'Enviando...' : 'Agregar a amigas'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDirectMessageModalOpen(true)}
                  className="py-2.5 px-4 rounded-2xl bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow cursor-pointer hover:bg-rose-600 transition active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Mensaje</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: profile?.displayName || 'Mamá Baby Day',
                    text: 'Mira este perfil de mamá en la Comunidad Baby Day 💕',
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  YA('Enlace copiado al portapapeles 📋');
                }
              }}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="Compartir perfil"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Pestañas de Contenido estilo Facebook: [Todo] [Fotos] [Reels / Videos] */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setActiveContentTab('todo')}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeContentTab === 'todo'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 scale-[1.01]'
              : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm')
          }`}
        >
          <span>Todo</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeContentTab === 'todo' ? 'bg-white/25 text-white' : 'bg-rose-500/10 text-rose-500'}`}>
            {userPosts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveContentTab('fotos')}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeContentTab === 'fotos'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 scale-[1.01]'
              : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm')
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Fotos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeContentTab === 'fotos' ? 'bg-white/25 text-white' : 'bg-rose-500/10 text-rose-500'}`}>
            {profilePhotos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveContentTab('reels')}
          className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeContentTab === 'reels'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25 scale-[1.01]'
              : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-100 shadow-sm')
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Reels / Videos</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeContentTab === 'reels' ? 'bg-white/25 text-white' : 'bg-rose-500/10 text-rose-500'}`}>
            {profileVideos.length}
          </span>
        </button>
      </div>

      {/* VISTA 1: [Todo] (Detalles de Mamá + Publicar en mi muro + Lista de publicaciones) */}
      {activeContentTab === 'todo' && (
        <div className="space-y-4 animate-fadeIn">
          {/* 4. Sección "Datos personales / Detalles de Mamá" estilo Facebook */}
          <div 
            className="rounded-3xl p-5 space-y-3.5"
            style={liquidGlassCard}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-base tracking-tight">Datos personales y de Mamá</h3>
              {isMyProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-rose-500 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {/* Ubicación */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="opacity-60 text-[11px] block">Ciudad / Residencia</span>
                  <span className="font-semibold">{profile?.ciudad || 'Bogotá, Colombia'}</span>
                </div>
              </div>

              {/* Bebé y Cumpleaños */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <span className="opacity-60 text-[11px] block">Información de su bebé</span>
                  <span className="font-semibold">
                    {profile?.babyName || 'Mateo'} • Nacimiento: {profile?.babyBirthDate || '15 de febrero de 2026'}
                  </span>
                </div>
              </div>

              {/* Lactancia / Crianza */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <span className="opacity-60 text-[11px] block">Alimentación & Crianza</span>
                  <span className="font-semibold">{profile?.lactancia || 'Lactancia Materna Exclusiva'}</span>
                </div>
              </div>

              {/* Familia */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="opacity-60 text-[11px] block">Familia</span>
                  <span className="font-semibold">{profile?.familia || 'Mamá, Papá y Bebé en Baby Day'}</span>
                </div>
              </div>
            </div>

            {/* Bio descriptiva */}
            {profile?.bio && (
              <div className="pt-3 border-t border-white/10 text-xs sm:text-sm leading-relaxed opacity-85 italic">
                "{profile.bio}"
              </div>
            )}

            {isMyProfile && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-500 font-bold text-xs transition cursor-pointer text-center"
              >
                Editar datos personales públicos
              </button>
            )}
          </div>

          {/* Barra de Publicar en el Muro (solo para el dueño del perfil) */}
          {isMyProfile && onOpenCrearPost && (
            <div 
              className="rounded-3xl p-4 transition cursor-pointer border hover:border-rose-400/50 shadow-sm"
              style={liquidGlassCard}
              onClick={onOpenCrearPost}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-rose-200 shrink-0 border border-white/30 flex items-center justify-center font-bold text-rose-800">
                  {avatarImage ? (
                    <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUserName?.charAt(0).toUpperCase() || 'M'
                  )}
                </div>
                <div className={`flex-1 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium border ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-600'
                }`}>
                  ¿Qué estás pensando hoy, Mamá? 💕
                </div>
                <button 
                  type="button" 
                  className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/30 shrink-0"
                  title="Subir foto o video"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Publicaciones del Perfil */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Grid className="w-4 h-4 text-rose-500" />
              <h4 className="font-bold text-sm">
                Publicaciones del muro ({userPosts.length})
              </h4>
            </div>

            {userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    isDark={isDark}
                    onNavigateProfile={onNavigateProfile}
                  />
                ))}
              </div>
            ) : (
              <div 
                className="rounded-3xl p-8 text-center space-y-3"
                style={liquidGlassCard}
              >
                <Sparkles className="w-9 h-9 text-rose-400 mx-auto opacity-80" />
                <div>
                  <p className="font-bold text-sm">
                    {isMyProfile ? 'Aún no has publicado en tu muro' : 'Esta mamá aún no tiene publicaciones en su muro.'}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    Comparte momentos de tu bebé, fotos familiares o dudas con la comunidad 💕
                  </p>
                </div>
                {isMyProfile && onOpenCrearPost && (
                  <button
                    type="button"
                    onClick={onOpenCrearPost}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-95 transition cursor-pointer"
                  >
                    + Crear mi primera publicación
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: [Fotos] Galería de Fotos estilo Facebook */}
      {activeContentTab === 'fotos' && (
        <div className="space-y-4 animate-fadeIn">
          <div 
            className="rounded-3xl p-5 space-y-4"
            style={liquidGlassCard}
          >
            {/* Header de Galería */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-500" />
                  <span>Fotos de Mamá y Bebé</span>
                </h3>
                <span className="text-xs opacity-65">{profilePhotos.length} fotos subidas</span>
              </div>
              {isMyProfile && onOpenCrearPost && (
                <button
                  type="button"
                  onClick={onOpenCrearPost}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir foto</span>
                </button>
              )}
            </div>

            {/* Filtros de Álbum */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setPhotoFilter('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  photoFilter === 'todas'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }`}
              >
                Todas las fotos ({profilePhotos.length})
              </button>
              <button
                type="button"
                onClick={() => setPhotoFilter('bebe')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  photoFilter === 'bebe'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }`}
              >
                👶 Recuerdos de mi bebé ({profilePhotos.filter(p => p.category === 'bebe').length})
              </button>
              <button
                type="button"
                onClick={() => setPhotoFilter('perfil')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  photoFilter === 'perfil'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : (isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }`}
              >
                🖼️ Perfil y Portada ({profilePhotos.filter(p => p.category === 'perfil').length})
              </button>
            </div>

            {/* Cuadrícula de Fotos estilo Facebook */}
            {displayedPhotos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {displayedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedLightboxPhoto(photo)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-black/5 border border-white/20 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
                  >
                    <img 
                      src={photo.url} 
                      alt={photo.caption || 'Foto'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                        {photo.caption}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                  <ImageIcon className="w-7 h-7 opacity-80" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Aún no hay fotos en este álbum</h4>
                  <p className="text-xs opacity-70 mt-1 max-w-xs mx-auto">
                    Comparte recuerdos de tu embarazo, los primeros meses de tu bebé o momentos tiernos en familia 💕
                  </p>
                </div>
                {isMyProfile && onOpenCrearPost && (
                  <button
                    type="button"
                    onClick={onOpenCrearPost}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-95 transition cursor-pointer"
                  >
                    + Subir mi primera foto
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 3: [Reels / Videos] Muro de Videos estilo Facebook */}
      {activeContentTab === 'reels' && (
        <div className="space-y-4 animate-fadeIn">
          <div 
            className="rounded-3xl p-5 space-y-4"
            style={liquidGlassCard}
          >
            {/* Header de Videos */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                  <Video className="w-4 h-4 text-rose-500" />
                  <span>Reels y Videos de Crianza</span>
                </h3>
                <span className="text-xs opacity-65">{profileVideos.length} videos publicados</span>
              </div>
              {isMyProfile && onOpenCrearPost && (
                <button
                  type="button"
                  onClick={onOpenCrearPost}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir video</span>
                </button>
              )}
            </div>

            {/* Lista o Cuadrícula de Videos */}
            {profileVideos.length > 0 ? (
              <div className="space-y-4">
                {profileVideos.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatar={currentUserAvatar}
                    isDark={isDark}
                    onNavigateProfile={onNavigateProfile}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                  <Video className="w-7 h-7 opacity-80" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Aún no hay videos o reels</h4>
                  <p className="text-xs opacity-70 mt-1 max-w-xs mx-auto">
                    Los primeros pasos, risas, trucos para dormir al bebé o consejos de mamá son ideales para compartir 👶
                  </p>
                </div>
                {isMyProfile && onOpenCrearPost && (
                  <button
                    type="button"
                    onClick={onOpenCrearPost}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-95 transition cursor-pointer"
                  >
                    + Subir mi primer video
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX: Ver Foto en Pantalla Completa estilo Facebook */}
      {selectedLightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedLightboxPhoto(null)}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <img 
              src={selectedLightboxPhoto.url} 
              alt={selectedLightboxPhoto.caption || "Foto de mamá"} 
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />

            {selectedLightboxPhoto.caption && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-white text-xs sm:text-sm font-medium text-center w-full max-w-lg border border-white/10">
                {selectedLightboxPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Editar Perfil Completo estilo Facebook */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-lg rounded-3xl p-5 overflow-y-auto max-h-[90vh] space-y-4"
            style={liquidGlassCard}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg">Editar perfil de Mamá</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold block mb-1">Nombre del Bebé</label>
                <input
                  type="text"
                  value={editBabyName}
                  onChange={(e) => setEditBabyName(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Nombre de tu bebé"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Fecha de Nacimiento del Bebé</label>
                <input
                  type="date"
                  value={editBabyBirth}
                  onChange={(e) => setEditBabyBirth(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Ciudad / Ubicación</label>
                <input
                  type="text"
                  value={editCiudad}
                  onChange={(e) => setEditCiudad(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Ej: Bogotá, Colombia"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Alimentación / Lactancia</label>
                <input
                  type="text"
                  value={editLactancia}
                  onChange={(e) => setEditLactancia(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Ej: Lactancia Materna Exclusiva, BLW, Fórmula"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Familia</label>
                <input
                  type="text"
                  value={editFamilia}
                  onChange={(e) => setEditFamilia(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Ej: Mamá, Papá y 1 hermano"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Biografía / Presentación</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className={`w-full p-3 rounded-xl border ${
                    isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Cuéntale a otras mamás sobre ti..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold opacity-70 hover:opacity-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFullProfile}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow hover:opacity-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Compartir pensamiento / nota rápida */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm rounded-3xl p-5 space-y-3"
            style={liquidGlassCard}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Pensamiento de Mamá 💭</h3>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs opacity-70">
              Aparecerá en un globo sobre tu foto de perfil para que tus amigas lo vean.
            </p>
            <input
              type="text"
              maxLength={60}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Ej: ¡Hoy Mateo durmió toda la noche! 🎉"
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border ${
                isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs opacity-70"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs shadow"
              >
                Compartir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Enviar mensaje directo privado */}
      {isDirectMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div 
            className="w-full max-w-sm rounded-3xl p-5 space-y-3"
            style={liquidGlassCard}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💌</span>
                <h3 className="font-black text-base">
                  Mensaje para {profile?.displayName || 'Mamá'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectMessageModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs opacity-70">
              Escríbele un mensaje privado con cariño. Le llegará directamente a sus notificaciones.
            </p>
            <textarea
              rows={3}
              value={directMessageText}
              onChange={(e) => setDirectMessageText(e.target.value)}
              placeholder="Hola, me encantó ver las fotos de tu bebé... ¿Cómo te va con la lactancia?"
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border resize-none focus:outline-none ${
                isDark ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDirectMessageModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs opacity-70 hover:opacity-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendDirectMessage}
                disabled={!directMessageText.trim() || isSendingDirectMessage}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-500/25 disabled:opacity-40 cursor-pointer hover:opacity-95"
              >
                {isSendingDirectMessage ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PerfilComunidad;
