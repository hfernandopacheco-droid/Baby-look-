import React, { useState, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Loader2, 
  Smile, 
  Tag, 
  Camera, 
  AlertCircle,
  Heart,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  optimizeImage, 
  getVideoThumbnail, 
  ensureFirebaseAuth 
} from '../utils/mediaOptimizer';
import { uploadMediaResilient } from '../utils/mediaStorage';

interface CrearPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  authorName: string;
  authorAvatar?: string;
  isDark: boolean;
  onPostCreated?: () => void;
}

export const CrearPostModal: React.FC<CrearPostModalProps> = ({
  isOpen,
  onClose,
  uid,
  authorName,
  authorAvatar,
  isDark,
  onPostCreated
}) => {
  const [texto, setTexto] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string>('General');
  const [optimizationInfo, setOptimizationInfo] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación preventiva de tamaño
    if (file.size > 45 * 1024 * 1024) {
      setErrorMsg("El archivo es muy pesado (máx. 40MB). Intenta con un video o foto más ligero.");
      return;
    }

    setErrorMsg(null);
    setOptimizationInfo(null);

    if (file.type.startsWith('video/')) {
      setMediaType('video');
      setSelectedFile(file);

      // Crear URL de vista previa inmediata
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generar miniatura rápida del video
      try {
        const { duration } = await getVideoThumbnail(file);
        const durationSec = Math.round(duration);
        setOptimizationInfo(
          `Video listo (${(file.size / (1024 * 1024)).toFixed(1)} MB${durationSec > 0 ? ` • ${durationSec}s` : ''}) ⚡`
        );
      } catch {
        setOptimizationInfo(`Video listo (${(file.size / (1024 * 1024)).toFixed(1)} MB) ⚡`);
      }
    } else {
      // Es una imagen: comprimir al instante en canvas (reduce 5MB a ~150KB)
      setMediaType('image');
      setIsOptimizing(true);
      setOptimizationInfo("Optimizando imagen para subida ultra rápida...");

      try {
        const result = await optimizeImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.82
        });

        setSelectedFile(result.file);
        setPreviewUrl(result.dataUrl);

        const originalKb = Math.round(result.originalSize / 1024);
        const newKb = Math.round(result.optimizedSize / 1024);
        setOptimizationInfo(`Foto optimizada: ${newKb} KB (${Math.round((1 - newKb / (originalKb || 1)) * 100)}% más ligera) ⚡`);
      } catch (optErr) {
        console.warn("Optimización fallback:", optErr);
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setIsOptimizing(false);
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMediaType(null);
    setOptimizationInfo(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() && !selectedFile) {
      setErrorMsg("Escribe algo o adjunta una foto/video para publicar.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setUploadProgress(0);
    setUploadStatus("Iniciando subida...");

    try {
      const mediaUrls: string[] = [];
      let postThumbnailUrl = '';

      // 1. Subida rápida, resiliente y garantizada para cualquier foto o video
      if (selectedFile) {
        setUploadStatus(mediaType === 'video' ? "Procesando video de mamá..." : "Optimizando foto...");
        
        const uploadResult = await uploadMediaResilient(
          selectedFile,
          mediaType || 'image',
          uid,
          previewUrl,
          (pct, status) => {
            setUploadProgress(pct);
            setUploadStatus(status);
          }
        );

        if (uploadResult.url) {
          mediaUrls.push(uploadResult.url);
        }
        if (uploadResult.thumbnailUrl) {
          postThumbnailUrl = uploadResult.thumbnailUrl;
        }
      }

      setUploadStatus("Guardando publicación en la comunidad...");

      // 2. Crear o actualizar perfil en community_profiles/{uid} si no existe
      try {
        const profileRef = doc(db, "community_profiles", uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            uid,
            displayName: authorName || 'Mamá Baby Day',
            avatarUrl: authorAvatar || '',
            bio: 'Mamá en Baby Day compartiendo amor y crianza 💕',
            followersCount: 0,
            followingCount: 0,
            postsCount: 1,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (profErr) {
        console.warn("Profile sync notice:", profErr);
      }

      // 3. Crear documento en community_posts
      const newPostPayload = {
        uid,
        authorName: authorName || 'Mamá Baby Day',
        authorAvatar: authorAvatar || '',
        texto: texto.trim(),
        mediaUrls: mediaUrls,
        mediaType: mediaType || 'image',
        thumbnailUrl: postThumbnailUrl || '',
        likesCount: 0,
        comentariosCount: 0,
        compartidosCount: 0,
        categoria: categoria,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "community_posts"), newPostPayload);

      // Limpiar formulario y cerrar con éxito
      setTexto('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setMediaType(null);
      setOptimizationInfo(null);
      setUploadProgress(null);
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err: any) {
      console.error("Error creating community post:", err);
      setErrorMsg(err?.message || "Ocurrió un inconveniente al publicar. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Liquid Glass styling
  const liquidGlassModalStyle: React.CSSProperties = {
    background: isDark ? 'rgba(28, 28, 35, 0.85)' : 'rgba(255, 248, 235, 0.82)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.75)',
    boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.5)' : '0 25px 60px rgba(180, 140, 110, 0.25)',
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-lg rounded-3xl p-5 sm:p-6 transition-all duration-300 max-h-[92vh] flex flex-col ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
        style={liquidGlassModalStyle}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">Crear Publicación</h3>
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

        {/* User preview header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-rose-200 shrink-0 border border-white/30 flex items-center justify-center font-bold text-rose-800">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase() || 'M'
            )}
          </div>
          <div>
            <p className="font-bold text-sm leading-none">{authorName || 'Mamá Baby Day'}</p>
            <span className="text-[11px] opacity-70">Visible para toda la comunidad de mamás</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          {/* Textarea: exact copy "¿Que quieres compartir, Mama?" */}
          <div className="flex-1 mb-3">
            <textarea
              rows={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="¿Que quieres compartir, Mama?"
              className={`w-full p-3 rounded-2xl border resize-none text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all ${
                isDark 
                  ? 'bg-black/20 border-white/10 text-white placeholder-slate-400' 
                  : 'bg-white/70 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Media Preview if attached */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden mb-3 border border-white/20 max-h-52 bg-black/10 flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={previewUrl} controls className="w-full max-h-52 object-contain" />
              ) : (
                <img src={previewUrl} alt="Vista previa" className="w-full max-h-52 object-contain" />
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Indicador de optimización rápida */}
          {optimizationInfo && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 font-semibold mb-2 px-1">
              <Zap className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span>{optimizationInfo}</span>
            </div>
          )}

          {/* Barra de progreso de subida rápida */}
          {isSubmitting && (
            <div className="mb-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center justify-between text-xs font-bold text-rose-500 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  {uploadStatus || "Subiendo a la comunidad..."}
                </span>
                <span>{uploadProgress !== null ? `${uploadProgress}%` : ''}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${uploadProgress !== null ? Math.max(5, uploadProgress) : 60}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Attachments toolbar & submit */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="community-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || isOptimizing}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>Foto / Video</span>
              </button>

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={isSubmitting}
                className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="General">🍼 General</option>
                <option value="Lactancia">🤱 Lactancia</option>
                <option value="Alimentación">🍲 Comida</option>
                <option value="Sueño">🌙 Sueño</option>
                <option value="Desarrollo">🧸 Hitos</option>
                <option value="Apoyo">💕 Apoyo</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isOptimizing || (!texto.trim() && !selectedFile)}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/30 hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
