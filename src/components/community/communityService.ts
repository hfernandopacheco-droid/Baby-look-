import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  increment, 
  deleteDoc,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { 
  CommunityProfile, 
  CommunityPost, 
  CommunityReactionType, 
  CommunityComment, 
  CommunityReport 
} from '../../types';

// Sincronizar y obtener perfil de comunidad
export async function getOrCreateCommunityProfile(
  uid: string, 
  defaultName: string = 'Mamá', 
  defaultAvatar?: string, 
  bebeNombre?: string,
  bebeEdad: string = 'Bebé'
): Promise<CommunityProfile> {
  const profileRef = doc(db, 'community_profiles', uid);
  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        displayName: data.displayName || defaultName,
        avatarUrl: data.avatarUrl || defaultAvatar,
        bio: data.bio || `Mamá de ${bebeNombre || 'bebé'} 💕 Compartiendo experiencias y amor.`,
        bebeEdad: data.bebeEdad || bebeEdad,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
      };
    }
  } catch (e) {
    console.warn("Could not fetch profile, will create:", e);
  }

  // Crear perfil nuevo
  const newProfile: CommunityProfile = {
    uid,
    displayName: defaultName || 'Mamá',
    avatarUrl: defaultAvatar || '',
    bio: `Mamá de ${bebeNombre || 'mi bebé'} 💕 Aprendiendo y creciendo cada día en Baby Day.`,
    bebeEdad: bebeEdad || 'Bebé',
    followersCount: 0,
    followingCount: 0,
    createdAt: Date.now()
  };

  try {
    await setDoc(profileRef, {
      ...newProfile,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn("Failed saving community profile to firestore:", e);
  }

  return newProfile;
}

// Actualizar perfil de comunidad
export async function updateCommunityProfile(
  uid: string, 
  updates: Partial<CommunityProfile>
): Promise<void> {
  const profileRef = doc(db, 'community_profiles', uid);
  await setDoc(profileRef, {
    ...updates,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Subir archivo a Storage o fallback a base64
export async function uploadCommunityMedia(
  uid: string, 
  postId: string, 
  file: File
): Promise<string> {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `community/${uid}/${postId}/${Date.now()}_${safeName}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (storageErr) {
    console.warn("Storage upload notice (using safe fallback):", storageErr);
    // Fallback garantizado a Base64 comprimido para no bloquear nunca al usuario en preview
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

// Crear un nuevo post
export async function createCommunityPost(postData: {
  uid: string;
  authorName: string;
  authorAvatar?: string;
  texto: string;
  mediaUrls?: string[];
  mediaType?: 'foto' | 'video' | 'ninguno';
}): Promise<string> {
  const postsCollection = collection(db, 'community_posts');
  const newPostDoc = doc(postsCollection);
  
  await setDoc(newPostDoc, {
    uid: postData.uid,
    authorName: postData.authorName,
    authorAvatar: postData.authorAvatar || '',
    texto: postData.texto,
    mediaUrls: postData.mediaUrls || [],
    mediaType: postData.mediaType || 'ninguno',
    likesCount: 0,
    comentariosCount: 0,
    compartidosCount: 0,
    timestamp: serverTimestamp()
  });

  return newPostDoc.id;
}

// Reaccionar a un post
export async function togglePostReaction(
  postId: string,
  uid: string,
  reactionType: CommunityReactionType = 'me_gusta',
  currentReaction?: CommunityReactionType | null
): Promise<void> {
  const reactionDocRef = doc(db, 'community_posts', postId, 'reacciones', uid);
  const postDocRef = doc(db, 'community_posts', postId);

  if (currentReaction === reactionType) {
    // Quitar reacción
    await deleteDoc(reactionDocRef);
    await updateDoc(postDocRef, {
      likesCount: increment(-1)
    }).catch(() => {});
  } else {
    // Establecer nueva reacción
    const isNew = !currentReaction;
    await setDoc(reactionDocRef, {
      tipo: reactionType,
      timestamp: serverTimestamp()
    });

    if (isNew) {
      await updateDoc(postDocRef, {
        likesCount: increment(1)
      }).catch(() => {});
    }
  }
}

// Agregar comentario
export async function addPostComment(
  postId: string,
  author: { uid: string; name: string; avatar?: string },
  texto: string
): Promise<void> {
  if (!texto.trim()) return;
  const commentsCol = collection(db, 'community_posts', postId, 'comentarios');
  const newCommentDoc = doc(commentsCol);

  await setDoc(newCommentDoc, {
    uid: author.uid,
    authorName: author.name,
    authorAvatar: author.avatar || '',
    texto: texto.trim(),
    timestamp: serverTimestamp()
  });

  await updateDoc(doc(db, 'community_posts', postId), {
    comentariosCount: increment(1)
  }).catch(() => {});
}

// Incrementar contador de compartidos
export async function incrementPostShares(postId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'community_posts', postId), {
      compartidosCount: increment(1)
    });
  } catch (e) {}
}

// Seguir / dejar de seguir
export async function toggleFollowUser(
  followerId: string,
  followingId: string,
  isFollowing: boolean
): Promise<void> {
  const followId = `${followerId}_${followingId}`;
  const followDocRef = doc(db, 'community_follows', followId);

  if (isFollowing) {
    // Dejar de seguir
    await deleteDoc(followDocRef);
    await updateDoc(doc(db, 'community_profiles', followerId), {
      followingCount: increment(-1)
    }).catch(() => {});
    await updateDoc(doc(db, 'community_profiles', followingId), {
      followersCount: increment(-1)
    }).catch(() => {});
  } else {
    // Seguir
    await setDoc(followDocRef, {
      followerId,
      followingId,
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'community_profiles', followerId), {
      followingCount: increment(1)
    }).catch(() => {});
    await updateDoc(doc(db, 'community_profiles', followingId), {
      followersCount: increment(1)
    }).catch(() => {});
  }
}

// Verificar si se sigue a un usuario
export async function checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
  const followId = `${followerId}_${followingId}`;
  try {
    const snap = await getDoc(doc(db, 'community_follows', followId));
    return snap.exists();
  } catch (e) {
    return false;
  }
}

// Obtener sugerencias de mamás para seguir (limit 5, uid != mi uid y no sigo)
export async function getSuggestedMothers(
  myUid: string, 
  limitCount: number = 5
): Promise<CommunityProfile[]> {
  try {
    const qProfiles = query(
      collection(db, 'community_profiles'), 
      limit(15)
    );
    const snap = await getDocs(qProfiles);
    const results: CommunityProfile[] = [];

    // Obtener a quiénes sigo
    const qFollows = query(
      collection(db, 'community_follows'),
      where('followerId', '==', myUid)
    );
    const followsSnap = await getDocs(qFollows);
    const followingIds = new Set<string>();
    followsSnap.forEach(d => {
      const data = d.data();
      if (data.followingId) followingIds.add(data.followingId);
    });

    for (const d of snap.docs) {
      if (d.id === myUid) continue;
      if (followingIds.has(d.id)) continue;
      const data = d.data();
      results.push({
        uid: d.id,
        displayName: data.displayName || 'Mamá en Baby Day',
        avatarUrl: data.avatarUrl,
        bio: data.bio || 'Compartiendo la aventura de la maternidad 💕',
        bebeEdad: data.bebeEdad || 'Bebé',
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()
      });
      if (results.length >= limitCount) break;
    }

    // Si aún hay menos de 2 sugerencias en la base de datos (comunidad nueva), proporcionar perfiles de bienvenida
    if (results.length < 2) {
      const defaultMoms: CommunityProfile[] = [
        {
          uid: 'sample_mom_1',
          displayName: 'Dra. Sofía (Pediatra)',
          avatarUrl: 'https://images.unsplash.com/photo-1594824813579-994c636f018e?w=150&auto=format&fit=crop&q=80',
          bio: 'Pediatra y mamá de gemelos 🩺 Consejos prácticos y con base médica.',
          bebeEdad: 'Gemelos (1 año)',
          followersCount: 142,
          followingCount: 18,
          createdAt: Date.now() - 86400000 * 30
        },
        {
          uid: 'sample_mom_2',
          displayName: 'Mariana & Thiago',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          bio: 'Mamá primeriza 🌸 Aprendiendo BLW y rutinas de sueño respetuoso.',
          bebeEdad: 'Thiago (7 meses)',
          followersCount: 88,
          followingCount: 35,
          createdAt: Date.now() - 86400000 * 15
        },
        {
          uid: 'sample_mom_3',
          displayName: 'Valentina (Asesora de Lactancia)',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          bio: 'IBCLC y mamá de 3 🤱 Apoyando a cada mamá sin juicios.',
          bebeEdad: 'Mateo (10 meses)',
          followersCount: 310,
          followingCount: 42,
          createdAt: Date.now() - 86400000 * 45
        }
      ];

      for (const mom of defaultMoms) {
        if (!followingIds.has(mom.uid) && mom.uid !== myUid) {
          results.push(mom);
          if (results.length >= limitCount) break;
        }
      }
    }

    return results;
  } catch (e) {
    console.warn("Error loading suggestions:", e);
    return [];
  }
}

// Reportar un post
export async function reportPost(
  postId: string,
  reporterUid: string,
  motivo: string
): Promise<void> {
  const reportsCol = collection(db, 'community_reportes');
  const reportDoc = doc(reportsCol);
  await setDoc(reportDoc, {
    postId,
    reporterUid,
    motivo,
    timestamp: serverTimestamp()
  });
}

// Sembrar posts iniciales de bienvenida si no hay ninguno en Firestore
export async function seedInitialCommunityPostsIfEmpty(currentUserId: string): Promise<void> {
  try {
    const qPosts = query(collection(db, 'community_posts'), limit(1));
    const snap = await getDocs(qPosts);
    if (!snap.empty) return; // Ya hay posts, no sembrar

    const starterPosts = [
      {
        uid: 'sample_mom_1',
        authorName: 'Dra. Sofía (Pediatra)',
        authorAvatar: 'https://images.unsplash.com/photo-1594824813579-994c636f018e?w=150&auto=format&fit=crop&q=80',
        texto: '¡Bienvenidas a la Comunidad Mamás de Baby Day! 👶✨ Un espacio seguro, cálido y lleno de apoyo para compartir anécdotas, dudas de crianza y celebrar los pequeños grandes logros de nuestros bebés. ¿Desde qué ciudad o país nos acompañas hoy?',
        mediaUrls: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80'],
        mediaType: 'foto' as const,
        likesCount: 24,
        comentariosCount: 8,
        compartidosCount: 5
      },
      {
        uid: 'sample_mom_2',
        authorName: 'Mariana & Thiago',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        texto: '¡Hoy Thiago probó aguacate por primera vez en su almuerzo BLW! 🥑 Terminó con más comida en la carita que en la pancita pero nos reímos muchísimo 😂 ¿Cuál fue el primer alimento favorito de sus bebés?',
        mediaUrls: ['https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80'],
        mediaType: 'foto' as const,
        likesCount: 19,
        comentariosCount: 6,
        compartidosCount: 2
      }
    ];

    for (const post of starterPosts) {
      const newDoc = doc(collection(db, 'community_posts'));
      await setDoc(newDoc, {
        ...post,
        timestamp: serverTimestamp()
      });

      // Sembrar un comentario de bienvenida
      const commentDoc = doc(collection(db, 'community_posts', newDoc.id, 'comentarios'));
      await setDoc(commentDoc, {
        uid: 'sample_mom_3',
        authorName: 'Valentina',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        texto: '¡Qué hermosa iniciativa! Un abrazo a todas las mamis de la comunidad 💕',
        timestamp: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn("Could not seed initial posts:", e);
  }
}
