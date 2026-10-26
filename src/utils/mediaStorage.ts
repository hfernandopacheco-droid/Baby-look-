import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { ensureFirebaseAuth, getVideoThumbnail, optimizeImage } from './mediaOptimizer';

// IndexedDB Helper para caché local ultrarrápido de videos y multimedia
const DB_NAME = 'BubbloMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_cache';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB no soportado"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheMediaBlob(key: string, blob: Blob): Promise<void> {
  try {
    const database = await getDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
  } catch (err) {
    console.warn("IndexedDB cache save notice:", err);
  }
}

export async function getCachedMediaBlob(key: string): Promise<Blob | null> {
  try {
    const database = await getDB();
    return new Promise((resolve) => {
      const tx = database.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Convierte un File/Blob en base64 de forma asíncrona y segura.
 */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sube un video en fragmentos a Cloud Firestore cuando Firebase Storage no esté disponible o bloquee CORS.
 */
async function uploadVideoChunksToFirestore(
  file: File,
  mediaId: string,
  uid: string,
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  const chunkSize = 450 * 1024; // 450KB por fragmento (muy por debajo del límite de 1MB de Firestore)
  const totalChunks = Math.ceil(file.size / chunkSize);
  const mimeType = file.type || 'video/mp4';

  onProgress?.(10, `Preparando video (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

  // Guardar metadata en community_media/{mediaId}
  await setDoc(doc(db, "community_media", mediaId), {
    mediaId,
    uid,
    fileName: file.name,
    fileSize: file.size,
    mimeType,
    totalChunks,
    createdAt: serverTimestamp()
  }, { merge: true });

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const slice = file.slice(start, end);
    const base64Chunk = await fileToBase64(slice);

    await setDoc(doc(db, "community_media", mediaId, "chunks", String(i)), {
      index: i,
      data: base64Chunk,
      timestamp: Date.now()
    });

    const percent = Math.round(15 + ((i + 1) / totalChunks) * 80);
    onProgress?.(percent, `Subiendo video: ${percent}%`);
  }

  // Guardar en la caché local del navegador para reproducción inmediata
  await cacheMediaBlob(mediaId, file);

  onProgress?.(100, "¡Video listo para publicar!");
  return `firestore-media://${mediaId}`;
}

/**
 * Resuelve y reensambla multimedia alojada en Firestore o en la nube para reproducción en video / imagen.
 */
export async function resolveMediaUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('firestore-media://')) {
    const mediaId = url.replace('firestore-media://', '');

    // 1. Revisar caché local inmediata
    const cachedBlob = await getCachedMediaBlob(mediaId);
    if (cachedBlob) {
      return URL.createObjectURL(cachedBlob);
    }

    // 2. Descargar fragmentos desde Firestore
    try {
      const chunksSnap = await getDocs(collection(db, "community_media", mediaId, "chunks"));
      if (chunksSnap.empty) return '';

      const chunksData: { index: number; data: string }[] = [];
      chunksSnap.forEach((d) => {
        const item = d.data();
        chunksData.push({ index: item.index, data: item.data });
      });

      chunksData.sort((a, b) => a.index - b.index);

      // Reensamblar blobs
      const byteArrays: Uint8Array[] = [];
      for (const c of chunksData) {
        const base64Clean = c.data.split(',')[1] || c.data;
        const binaryString = window.atob(base64Clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        byteArrays.push(bytes);
      }

      const combinedBlob = new Blob(byteArrays, { type: 'video/mp4' });
      await cacheMediaBlob(mediaId, combinedBlob);
      return URL.createObjectURL(combinedBlob);
    } catch (err) {
      console.warn("Error reassembling video chunks:", err);
      return '';
    }
  }

  return url;
}

/**
 * MOTOR RESILIENTE MULTINIVEL DE SUBIDA DE FOTOS Y VIDEOS
 * Garantiza que CUALQUIER foto o video subido desde teléfono o computador se publique
 * con éxito y se muestre en el feed de la comunidad, idéntico a Facebook.
 */
export async function uploadMediaResilient(
  file: File,
  mediaType: 'image' | 'video',
  uid: string,
  previewOrDataUrl?: string | null,
  onProgress?: (percent: number, status: string) => void
): Promise<{ url: string; thumbnailUrl?: string }> {
  const timestamp = Date.now();
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const mediaId = `med_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
  const storagePath = `community/${uid}/${timestamp}_${cleanFileName}`;

  // 1. Manejo para FOTOS
  if (mediaType === 'image') {
    onProgress?.(15, "Optimizando foto en alta definición...");

    let finalDataUrl = previewOrDataUrl;
    let fileToUpload = file;

    // Si aún no se comprimió, optimizar ahora
    if (!finalDataUrl || finalDataUrl.length > 500000) {
      try {
        const opt = await optimizeImage(file, { maxWidth: 1080, maxHeight: 1080, quality: 0.78 });
        finalDataUrl = opt.dataUrl;
        fileToUpload = opt.file;
      } catch {
        finalDataUrl = await fileToBase64(file);
      }
    }

    // Intentar primero Firebase Storage con timeout seguro
    try {
      await ensureFirebaseAuth();
      onProgress?.(35, "Subiendo foto a la nube...");

      const fileRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(fileRef, fileToUpload, {
        contentType: fileToUpload.type || 'image/jpeg'
      });

      const storageUrl = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          uploadTask.cancel();
          reject(new Error("Storage timeout"));
        }, 8000);

        uploadTask.on(
          'state_changed',
          (snap) => {
            if (snap.totalBytes > 0) {
              const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 60) + 35;
              onProgress?.(Math.min(95, p), `Subiendo: ${p}%`);
            }
          },
          (err) => {
            clearTimeout(timeout);
            reject(err);
          },
          async () => {
            clearTimeout(timeout);
            try {
              const dlUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(dlUrl);
            } catch (uErr) {
              reject(uErr);
            }
          }
        );
      });

      onProgress?.(100, "¡Foto subida con éxito!");
      return { url: storageUrl };
    } catch (storageErr) {
      console.warn("Firebase Storage fallback para foto:", storageErr);

      // Fallback seguro: Usar dataUrl optimizada directamente (tamaño ~100KB-180KB, 100% compatible con Firestore)
      onProgress?.(85, "Guardando en la bóveda de la comunidad...");
      
      // Guardar también en community_media para resguardo
      try {
        await setDoc(doc(db, "community_media", mediaId), {
          mediaId,
          uid,
          dataUrl: finalDataUrl,
          mimeType: file.type || 'image/jpeg',
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (fErr) {
        console.warn("Firestore media save notice:", fErr);
      }

      onProgress?.(100, "¡Foto procesada y lista!");
      return { url: finalDataUrl || '' };
    }
  }

  // 2. Manejo para VIDEOS
  onProgress?.(10, "Procesando video y generando miniatura...");
  let thumbUrl = '';
  try {
    const { thumbnailDataUrl } = await getVideoThumbnail(file);
    thumbUrl = thumbnailDataUrl;
  } catch {
    thumbUrl = '';
  }

  // Intentar primero Firebase Storage
  try {
    await ensureFirebaseAuth();
    onProgress?.(25, "Subiendo video a la nube...");

    const fileRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType: file.type || 'video/mp4'
    });

    const storageUrl = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        uploadTask.cancel();
        reject(new Error("Storage timeout"));
      }, 15000);

      uploadTask.on(
        'state_changed',
        (snap) => {
          if (snap.totalBytes > 0) {
            const p = Math.round((snap.bytesTransferred / snap.totalBytes) * 70) + 25;
            onProgress?.(Math.min(95, p), `Subiendo video: ${p}%`);
          }
        },
        (err) => {
          clearTimeout(timeout);
          reject(err);
        },
        async () => {
          clearTimeout(timeout);
          try {
            const dlUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(dlUrl);
          } catch (uErr) {
            reject(uErr);
          }
        }
      );
    });

    onProgress?.(100, "¡Video subido con éxito!");
    return { url: storageUrl, thumbnailUrl: thumbUrl };
  } catch (storageErr) {
    console.warn("Firebase Storage fallback para video:", storageErr);

    // Fallback seguro: fragmentación y almacenamiento en Firestore + caché IndexedDB
    const firestoreMediaUrl = await uploadVideoChunksToFirestore(file, mediaId, uid, onProgress);
    return { url: firestoreMediaUrl, thumbnailUrl: thumbUrl };
  }
}
