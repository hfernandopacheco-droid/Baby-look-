import React, { useState } from 'react';
import { BabyUser, LanguageCode } from '../types';
import { rE } from '../i18n';
import { zz } from '../utils';
import { Sun, Moon, Sparkles, LogOut, Database, MessageSquare, X, Heart, Globe, Bell } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageModal } from './LanguageModal';
import { dismissAllNotifications } from '../services/recordatoriosService';

interface HeaderProps {
  user: BabyUser;
  allUsers: BabyUser[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  lang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  useClay: boolean;
  onToggleClay: () => void;
  onOpenEditBaby: () => void;
  onOpenAvatarCreator?: () => void;
  onOpenBackup?: () => void;
  onOpenSupport?: () => void;
  onNavigateToCommunity?: () => void;
  iosBadgeCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  allUsers,
  onSwitchUser,
  onLogout,
  lang,
  onSelectLang,
  isDark,
  onToggleTheme,
  useClay,
  onToggleClay,
  onOpenEditBaby,
  onOpenAvatarCreator,
  onOpenBackup,
  onOpenSupport,
  onNavigateToCommunity,
  iosBadgeCount,
}) => {
  const t = rE[lang] || rE.es;
  const [menuOpen, setMenuOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const babyPhoto = user.photo || localStorage.getItem(`bubblo_photo_${user.id}`) || '';

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 z-50 text-white"
        style={{
          background: 'rgba(45,42,38,0.55)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 text-white hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center justify-center"
          title="Menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex items-center gap-2 ml-3">
          <h1 className="text-white font-bold text-xl tracking-tight">Baby Day</h1>
          {iosBadgeCount !== undefined && iosBadgeCount > 0 && (
            <button
              onClick={() => {
                setShowNotificationsModal(true);
                dismissAllNotifications();
              }}
              className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-md animate-pulse cursor-pointer hover:bg-rose-600 transition flex items-center gap-1"
              title="Ver notificaciones activas"
            >
              <Bell className="w-3 h-3" />
              <span>{iosBadgeCount}</span>
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <PWAInstallButton variant="button" />

          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-xs font-medium transition text-amber-400 hover:bg-slate-800"
            title={t.switchTheme}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotificationsModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl p-6 bg-[#202026] text-white border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="text-base font-bold text-amber-400">Notificaciones y Alertas AI</h3>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <span className="text-lg">🍼</span>
                <div>
                  <div className="font-bold text-amber-300">Recordatorio de Toma</div>
                  <div className="text-[11px] opacity-80">El cerebro AI Bubu ha detectado que se acerca la ventana estimada para la próxima toma o alimentación de {user.babyName}.</div>
                </div>
              </div>
              
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <span className="text-lg">🌙</span>
                <div>
                  <div className="font-bold text-indigo-300">Ventana de Sueño</div>
                  <div className="text-[11px] opacity-80">Ciclo de descanso monitoreado. Se recomienda preparar la siesta según la edad evolutiva ({user.babyName}).</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                <span className="text-lg">🧷</span>
                <div>
                  <div className="font-bold text-emerald-300">Control de Pañal</div>
                  <div className="text-[11px] opacity-80">Registro diario activo y sincronizado con el inventario predictivo.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition cursor-pointer shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Slide-out Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div 
            className="absolute inset-0 transition-opacity" 
            style={{
              background: 'rgba(0,0,0,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setMenuOpen(false)}
          />
          <div 
            className={`absolute top-0 left-0 w-[80%] max-w-sm h-full p-6 transform transition-transform duration-300 translate-x-0 flex flex-col overflow-y-auto ${
              isDark ? 'text-white' : 'text-[#2D2A26]'
            }`}
            style={{
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%), rgba(32,32,38,0.55)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%), rgba(255,248,235,0.65)',
              backdropFilter: isDark ? 'blur(32px) saturate(220%) brightness(1.15)' : 'blur(32px) saturate(220%) brightness(1.05)',
              WebkitBackdropFilter: isDark ? 'blur(32px) saturate(220%) brightness(1.15)' : 'blur(32px) saturate(220%) brightness(1.05)',
              borderRight: isDark ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.6)',
              boxShadow: isDark
                ? 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.5)'
                : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 20px 60px rgba(0,0,0,0.15)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Menú Principal</span>
              <button 
                onClick={() => setMenuOpen(false)} 
                className={`p-2 rounded-xl transition cursor-pointer hover:scale-105 ${
                  isDark ? 'text-white/80 hover:text-white bg-white/5 border border-white/10' : 'text-[#2D2A26]/80 hover:text-[#2D2A26] bg-black/5 border border-black/10'
                }`}
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Baby Info Card */}
            <div 
              onClick={() => {
                setMenuOpen(false);
                onOpenEditBaby();
              }}
              className="flex items-center gap-3 p-3.5 rounded-2xl mb-6 cursor-pointer transition hover:scale-[1.02]"
              style={{
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <div className="w-12 h-12 bg-orange-300 rounded-2xl flex items-center justify-center text-xl overflow-hidden shadow-inner border border-white/20">
                {babyPhoto ? (
                  <img src={babyPhoto} alt={user.babyName} className="w-full h-full object-cover" />
                ) : (
                  <span>👶</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-[#2D2A26]'}`}>{user.babyName}</p>
                <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-[#2D2A26]/70'}`}>{zz(user.birthDate)}</p>
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Editar</span>
            </div>

            {/* Menu Links */}
            <div className="space-y-2.5 flex-1">
              {/* Comunidad Mamás */}
              <button
                id="drawer-comunidad-mamas-btn"
                onClick={() => {
                  setMenuOpen(false);
                  if (onNavigateToCommunity) {
                    onNavigateToCommunity();
                  } else {
                    window.history.pushState(null, '', '/comunidad');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition text-left cursor-pointer hover:scale-[1.02] active:scale-98 ${
                  isDark ? 'text-white' : 'text-[#2D2A26]'
                }`}
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(244,63,94,0.22) 0%, rgba(236,72,153,0.14) 100%)' 
                    : 'linear-gradient(135deg, rgba(244,63,94,0.16) 0%, rgba(254,205,211,0.45) 100%)',
                  border: isDark ? '1px solid rgba(244,63,94,0.35)' : '1px solid rgba(244,63,94,0.3)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 18px rgba(244,63,94,0.18)'
                }}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30 shrink-0 text-lg">
                  <span>👩‍👧‍👦</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-rose-500 text-sm">Comunidad Mamas</span>
                    <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white shadow-sm">Nuevo</span>
                  </div>
                  <p className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Conectar, compartir y apoyarnos 💕
                  </p>
                </div>
              </button>



              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenEditBaby();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition text-left cursor-pointer hover:scale-[1.01] ${
                  isDark ? 'text-white' : 'text-[#2D2A26]'
                }`}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <span>👶</span>
                <span>Perfil del Bebé</span>
              </button>

              {onOpenSupport && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSupport();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition text-left cursor-pointer hover:scale-[1.01] ${
                    isDark ? 'text-white' : 'text-[#2D2A26]'
                  }`}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                  }}
                >
                  <MessageSquare className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                  <span>Ayuda y Soporte</span>
                </button>
              )}

              {onOpenBackup && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenBackup();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition text-left cursor-pointer hover:scale-[1.01] ${
                    isDark ? 'text-white' : 'text-[#2D2A26]'
                  }`}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                  }}
                >
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>Copia de seguridad (JSON)</span>
                </button>
              )}

              <button
                onClick={onToggleClay}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition text-left cursor-pointer hover:scale-[1.01] ${
                  isDark ? 'text-white' : 'text-[#2D2A26]'
                }`}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.3)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
              >
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <span>{useClay ? 'Modo Estándar' : 'Modo Clay'}</span>
              </button>
            </div>

            <div className={`border-t pt-4 mt-4 flex items-center gap-2 ${isDark ? 'border-white/10' : 'border-[#2D2A26]/10'}`}>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition text-left cursor-pointer hover:scale-[1.01] ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}
                style={{
                  background: isDark ? 'rgba(244,63,94,0.08)' : 'rgba(244,63,94,0.05)',
                  border: isDark ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(244,63,94,0.15)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
                title={t.logout || 'Cerrar Sesión'}
              >
                <LogOut className="w-4 h-4" />
                <span className="truncate">{t.logout || 'Cerrar Sesión'}</span>
              </button>

              {/* Botón Mundo 🌏 para selección de Idioma */}
              <button
                id="drawer-lang-selector-btn"
                onClick={() => setLangModalOpen(true)}
                className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 ${
                  isDark 
                    ? 'text-amber-400 bg-amber-400/10 border border-amber-400/25 hover:bg-amber-400/20' 
                    : 'text-amber-700 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20'
                }`}
                style={{
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)'
                }}
                title={t.languageName || 'Cambiar Idioma'}
              >
                <span className="text-xl leading-none select-none">🌏</span>
                <span className="text-xs font-black uppercase tracking-wider">{lang}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de idioma global */}
      <LanguageModal
        isOpen={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        currentLang={lang}
        onSelectLang={onSelectLang}
        isDark={isDark}
      />
    </>
  );
};
