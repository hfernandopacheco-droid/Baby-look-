import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Video, 
  X, 
  Sparkles, 
  Loader2, 
  Image as ImageIcon,
  Smile,
  Hash
} from 'lucide-react';
import { uploadCommunityMedia, createCommunityPost } from './communityService';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isDark: boolean;
  onPostCreated?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isDark,
  onPostCreated
}) => {
  const [texto, setTexto] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'foto' | 'video' | 'ninguno'>('ninguno');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isVideo: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setMediaType(isVideo || file.type.startsWith('video') ? 'video' : 'foto');

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType('ninguno');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleAddTag = (tag: string) => {
    setTexto(prev => prev ? `${prev} ${tag}` : tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() && !mediaFile) return;

    setLoading(true);
    setUploadProgress(true);

    try {
      let uploadedUrl: string | undefined = undefined;
      const tempPostId = `post_${Date.now()}`;

      if (mediaFile) {
        uploadedUrl = await uploadCommunityMedia(currentUserId, tempPostId, mediaFile);
      }

      await createCommunityPost({
        uid: currentUserId,
        authorName: currentUserName || 'Mamá',
        authorAvatar: currentUserAvatar,
        texto: texto.trim(),
        mediaUrls: uploadedUrl ? [uploadedUrl] : [],
        mediaType: uploadedUrl ? mediaType : 'ninguno'
      });

      setTexto('');
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType('ninguno');
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl p-5 shadow-2xl border relative flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          background: isDark ? 'rgba(32, 32, 38, 0.95)' : 'rgba(255, 250, 240, 0.96)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(180,140,110,0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Crear publicación
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-black/5'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-rose-200 shadow-md flex items-center justify-center">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt={currentUserName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👩‍🍼</span>
            )}
          </div>
          <div>
            <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {currentUserName || 'Mamá'}
            </p>
            <span className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
              Público para la Comunidad
            </span>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col space-y-3">
          <textarea
            id="post-content-textarea"
            rows={4}
            placeholder="¿Qué quieres compartir hoy, Mamá? Comparte una foto de tu bebé, una duda o un hermoso logro..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={`w-full p-3.5 rounded-2xl text-sm outline-none resize-none border transition ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-rose-400' 
                : 'bg-white/70 border-black/10 text-slate-900 placeholder:text-slate-400 focus:border-rose-400'
            }`}
          />

          {/* Quick topic tags */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 text-[11px] mr-1">Temas:</span>
            {['#Lactancia', '#BLW', '#Primerizos', '#SueñoInfantil', '#LogrosDelBebé'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className={`px-2 py-1 rounded-full text-[11px] font-bold transition ${
                  isDark ? 'bg-white/10 hover:bg-rose-500/20 text-rose-300' : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-md max-h-56 bg-black/10">
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition"
              >
                <X className="w-4 h-4" />
              </button>

              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="w-full max-h-52 object-contain" />
              ) : (
                <img src={mediaPreview} alt="Vista previa" className="w-full max-h-52 object-cover" />
              )}
            </div>
          )}

          {/* Hidden inputs */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, false)} 
          />
          <input 
            type="file" 
            ref={videoInputRef} 
            accept="video/*" 
            className="hidden" 
            onChange={(e) => handleFileChange(e, true)} 
          />

          {/* Attach media toolbar */}
          <div 
            className="p-3 rounded-2xl border flex items-center justify-between"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
            }}
          >
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Agregar a tu publicación:
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="add-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition flex items-center gap-1.5 font-semibold text-xs"
                title="Foto del bebé"
              >
                <Camera className="w-4 h-4" />
                <span>Foto</span>
              </button>

              <button
                type="button"
                id="add-video-btn"
                onClick={() => videoInputRef.current?.click()}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-1.5 font-semibold text-xs"
                title="Video del bebé"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          </div>

          {/* Action submit button */}
          <div className="pt-2">
            <button
              type="submit"
              id="submit-post-btn"
              disabled={loading || (!texto.trim() && !mediaFile)}
              className="w-full py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 shadow-xl hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress ? 'Subiendo foto a Storage...' : 'Publicando...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar en la Comunidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
