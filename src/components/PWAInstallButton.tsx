import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'button' | 'dropdown-item';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success && onInstalled) {
        onInstalled();
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS, don't show unless prompt is available
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'dropdown-item' ? (
        <button
          id="pwa-install-menu-btn"
          onClick={handleInstallClick}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition font-bold"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-500" />
          <span>Instalar App (PWA)</span>
        </button>
      ) : (
        <button
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
          title="Instalar Baby Day en tu dispositivo"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <h3 className="text-base font-bold">Instalar en iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700">
                <Share2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700">
                <PlusSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  2. Desliza hacia abajo y pulsa <strong>"Añadir a pantalla de inicio"</strong>.
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                ¡Y listo! Podrás usar Baby Day a pantalla completa sin barras de navegador.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-bold text-white shadow transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
