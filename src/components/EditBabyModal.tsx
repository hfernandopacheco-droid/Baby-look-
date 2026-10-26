import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Calendar, Ruler, Weight, User as UserIcon, Database, MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import { BabyUser, LanguageCode } from '../types';
import { rE } from '../i18n';
import { bA } from '../utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface EditBabyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: BabyUser;
  onSave: (data: { name: string; birthDate: string; height: number; weight: number; photo?: string }) => void;
  lang: LanguageCode;
  isDark: boolean;
  useClay: boolean;
  onOpenBackup?: () => void;
  initialTab?: 'profile' | 'support';
}

export const EditBabyModal: React.FC<EditBabyModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  lang,
  isDark,
  useClay,
  onOpenBackup,
  initialTab = 'profile',
}) => {
  const t = rE[lang] || rE.es;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'support'>(initialTab);

  const [name, setName] = useState(user.babyName || '');
  const [birthDate, setBirthDate] = useState(user.birthDate || '2026-02-15');
  const [height, setHeight] = useState<string>(String(user.height || 65));
  const [weight, setWeight] = useState<string>(String(user.weight || 7.2));
  const [photo, setPhoto] = useState<string>('');

  // Support section state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [myTickets, setMyTickets] = useState<any[]>([]);

  const loadMyTickets = () => {
    try {
      const raw = localStorage.getItem('bubblo_support');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const userEmail = (user.email || '').toLowerCase();
          const userName = (user.babyName || '').toLowerCase();
          const filtered = parsed.filter(
            (item: any) =>
              (item.email && item.email.toLowerCase() === userEmail) ||
              (item.babyName && item.babyName.toLowerCase() === userName)
          );
          setMyTickets(filtered);
          return;
        }
      }
      setMyTickets([]);
    } catch {
      setMyTickets([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setName(user.babyName || '');
      setBirthDate(user.birthDate || '2026-02-15');
      setHeight(String(user.height || 65));
      setWeight(String(user.weight || 7.2));
      const savedPhoto = localStorage.getItem(`bubblo_photo_${user.id}`) || user.photo || '';
      setPhoto(savedPhoto);
      loadMyTickets();
    }
  }, [isOpen, user, initialTab]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Por favor elige una menor a 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHeight = parseFloat(height) || 65;
    const finalWeight = parseFloat(weight) || 7.2;

    if (photo) {
      localStorage.setItem(`bubblo_photo_${user.id}`, photo);
    }

    onSave({
      name: name.trim() || user.babyName || 'Bebé',
      birthDate: birthDate || '2026-02-15',
      height: finalHeight,
      weight: finalWeight,
      photo: photo || undefined,
    });

    bA(window.innerWidth / 2, window.innerHeight / 2);
    onClose();
  };

  const handleSendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      alert('Por favor completa el asunto y tu mensaje.');
      return;
    }

    const ticketEmail = user.email || 'usuario@ejemplo.com';
    const ticketMsg = supportMessage.trim();
    const ticketSubj = supportSubject.trim();
    const ticketBaby = user.babyName || name || 'Mathews';

    const list = JSON.parse(localStorage.getItem('bubblo_support') || '[]');
    const newTicket = {
      id: Date.now(),
      babyName: ticketBaby,
      email: ticketEmail,
      subject: ticketSubj,
      message: ticketMsg,
      date: new Date().toISOString(),
      status: 'abierto',
      adminReply: '',
    };
    list.unshift(newTicket);
    localStorage.setItem('bubblo_support', JSON.stringify(list));

    // Guardar en Firestore: addDoc(collection(db,"support"), {email, mensaje, fecha})
    try {
      await addDoc(collection(db, "support"), {
        email: ticketEmail,
        mensaje: ticketMsg,
        message: ticketMsg,
        subject: ticketSubj,
        babyName: ticketBaby,
        status: 'abierto',
        adminReply: '',
        date: new Date().toISOString(),
        fecha: serverTimestamp()
      });
    } catch (fsErr) {
      console.error("Error guardando ticket en Firestore:", fsErr);
    }

    setSupportSubject('');
    setSupportMessage('');
    loadMyTickets();
    alert('Ticket enviado con éxito. Te responderemos pronto');
  };

  const modalBg = isDark ? 'clay-dark text-slate-100' : 'clay text-slate-800';
  const inputBg = isDark
    ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500'
    : 'bg-white/95 border-amber-200/80 text-slate-800 placeholder-slate-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg p-6 rounded-3xl ${modalBg} shadow-2xl border border-amber-200/40 dark:border-slate-700/60 relative overflow-hidden max-h-[90vh] flex flex-col`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex bg-black/10 dark:bg-black/40 p-1 rounded-2xl mb-4 self-center w-full max-w-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-black dark:bg-amber-400 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>👶</span>
            <span>Perfil del Bebé</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('support');
              loadMyTickets();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'support'
                ? 'bg-white text-black dark:bg-amber-400 dark:text-slate-900 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>💬 Ayuda y Soporte</span>
          </button>
        </div>

        {/* TAB 1: PERFIL DEL BEBE */}
        {activeTab === 'profile' && (
          <div className="overflow-y-auto pr-1">
            <div className="text-center mb-4">
              <h3 className="text-lg font-black font-heading text-slate-900 dark:text-white">
                {t.editBaby || 'Editar datos del bebé'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.bubbloSub || 'El Universo de tu Bebé'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo upload avatar */}
              <div className="flex flex-col items-center justify-center gap-2 mb-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-amber-400/80 shadow-md bg-amber-100 dark:bg-slate-800 flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl select-none">👶</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-black text-white hover:bg-amber-500 transition shadow-lg cursor-pointer"
                    title={t.addPhoto || 'Foto del bebé'}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {t.addPhoto || 'Foto del bebé'}
                </span>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.babyNameLabel || 'Nombre del bebé'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2 rounded-2xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
                    placeholder="Ej. Lucas"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  {t.birthDateLabel || 'Fecha de nacimiento'}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full px-4 py-2 rounded-2xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Height and Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.heightCmLabel || 'Estatura (cm)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="150"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className={`w-full px-3 py-2 rounded-2xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
                      placeholder="65"
                    />
                    <Ruler className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {t.weightKgLabel || 'Peso (kg)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="35"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className={`w-full px-3 py-2 rounded-2xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
                      placeholder="7.2"
                    />
                    <Weight className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full mt-3 py-2.5 rounded-2xl bg-black text-white dark:bg-amber-400 dark:text-slate-900 font-extrabold text-sm hover:opacity-90 active:scale-98 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t.save || 'Guardar'}</span>
              </button>

              {/* Backup Button */}
              {onOpenBackup && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBackup();
                    }}
                    className="w-full py-2 px-3 rounded-2xl border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-sky-500" />
                    <span>{t.exportImportData || 'Exportar / Importar copia de seguridad (JSON)'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 2: 💬 AYUDA Y SOPORTE */}
        {activeTab === 'support' && (
          <div className="overflow-y-auto pr-1 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>💬</span> <span>Ayuda y Soporte</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Envía una consulta directa al equipo de soporte. Te responderemos aquí mismo.
              </p>
            </div>

            {/* Formulario nuevo ticket */}
            <form onSubmit={handleSendTicket} className="space-y-3 bg-black/5 dark:bg-black/30 p-3.5 rounded-2xl border border-amber-200/40 dark:border-slate-700/50">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  required
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="Ej: Duda sobre registros o lactancia"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Escribe tu consulta o sugerencia detallada..."
                  className={`w-full p-3 rounded-xl border text-xs font-medium outline-none focus:ring-2 focus:ring-amber-400 resize-none ${inputBg}`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Ticket</span>
              </button>
            </form>

            {/* Mis Tickets */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Mis Tickets ({myTickets.length})
              </h4>

              {myTickets.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/20 text-center text-xs text-slate-500 dark:text-slate-400">
                  No tienes tickets de soporte registrados aún.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          {ticket.subject}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            ticket.status === 'resuelto'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ticket.status === 'resuelto' ? '🟢 Resuelto' : '🟡 Abierto'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-black/5 dark:bg-black/30 p-2.5 rounded-xl">
                        {ticket.message}
                      </p>

                      {ticket.adminReply ? (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs">
                          <p className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>💬 Respuesta del Administrador:</span>
                          </p>
                          <p className="leading-relaxed whitespace-pre-line">{ticket.adminReply}</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Esperando respuesta del soporte...</span>
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400 mt-2">
                        📅 {new Date(ticket.date).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
