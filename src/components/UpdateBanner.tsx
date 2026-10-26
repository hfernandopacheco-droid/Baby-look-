import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, APP_VERSION } from '../firebase';
import { Sparkles, RefreshCw, CheckCircle2, Zap, X } from 'lucide-react';

export const UpdateBanner: React.FC = () => {
  const [remoteVersion, setRemoteVersion] = useState<string>('');
  const [remoteMessage, setRemoteMessage] = useState<string>('Nueva actualización');
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Target update trackers
  const targetBuildTimeRef = useRef<number>(0);
  const targetVersionNumRef = useRef<number>(0);

  // Read current build time baked into the compiled app by Vite
  const currentAppBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? Number(__APP_BUILD_TIME__) : 0;

  // 1. Check if we JUST updated and reloaded & clean up any legacy banner
  useEffect(() => {
    try {
      const legacy = document.getElementById("update-banner");
      if (legacy) legacy.remove();

      if (localStorage.getItem('babyday_just_updated') === 'true' || localStorage.getItem('bubblo_update_success') === 'true') {
        localStorage.removeItem('babyday_just_updated');
        localStorage.removeItem('bubblo_update_success');
        setShowSuccessToast(true);
        const timer = setTimeout(() => setShowSuccessToast(false), 3500);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, []);

  // 2. Check for real updates against version.json and Firestore
  useEffect(() => {
    // If the app just updated on this reload, suppress banner completely on first cycle
    if (showSuccessToast) return;

    // Check version.json
    const checkVersionJson = async () => {
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (!res.ok) return;

        const data = await res.json();
        const serverBuildTime = Number(data.buildTime || 0);
        const serverMsg = data.message || data.mensaje || 'Nueva actualización disponible';
        const serverVer = data.version || APP_VERSION;

        const appliedBuild = Number(localStorage.getItem('babyday_applied_build_time') || 0);
        const dismissedBuild = Number(localStorage.getItem('babyday_dismissed_build_time') || 0);

        // ONLY trigger if the server build is strictly newer than current app build
        // AND newer than whatever the user already applied or dismissed
        if (
          serverBuildTime > 0 &&
          serverBuildTime > currentAppBuildTime &&
          serverBuildTime > appliedBuild &&
          serverBuildTime > dismissedBuild
        ) {
          targetBuildTimeRef.current = serverBuildTime;
          setRemoteVersion(serverVer);
          setRemoteMessage(serverMsg);
          setShowBanner(true);
        }
      } catch (e) {
        // Offline or fetch failed, do nothing
      }
    };

    checkVersionJson();

    // Firestore listener for real-time publishing
    const versionRef = doc(db, 'app_config', 'version');
    const unsubscribe = onSnapshot(versionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const serverBuildTime = Number(data.buildTime || 0);
        const serverVersionNum = Number(data.versionNumber || 0);
        const serverMsg = data.mensaje || data.message || 'Nueva actualización disponible';
        const serverVer = data.version || (serverVersionNum ? `v${serverVersionNum}` : APP_VERSION);

        const appliedBuild = Number(localStorage.getItem('babyday_applied_build_time') || 0);
        const dismissedBuild = Number(localStorage.getItem('babyday_dismissed_build_time') || 0);
        const appliedVerNum = Number(localStorage.getItem('babyday_applied_version_num') || 0);
        const dismissedVerNum = Number(localStorage.getItem('babyday_dismissed_version_num') || 0);

        const isNewerByBuild =
          serverBuildTime > 0 &&
          serverBuildTime > currentAppBuildTime &&
          serverBuildTime > appliedBuild &&
          serverBuildTime > dismissedBuild;

        const isNewerByVerNum =
          serverVersionNum > 0 &&
          serverVersionNum > appliedVerNum &&
          serverVersionNum > dismissedVerNum;

        if (isNewerByBuild || isNewerByVerNum) {
          targetBuildTimeRef.current = serverBuildTime || Date.now();
          targetVersionNumRef.current = serverVersionNum;
          setRemoteVersion(serverVer);
          setRemoteMessage(serverMsg);
          setShowBanner(true);
        }
      }
    }, (err) => {
      console.warn('Firestore version listener error:', err);
    });

    // Check again when user returns from phone home screen
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersionJson();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentAppBuildTime, showSuccessToast]);

  // Dismiss button handler (user closes banner)
  const handleDismiss = () => {
    setShowBanner(false);
    const targetBuild = targetBuildTimeRef.current || Date.now();
    const targetVer = targetVersionNumRef.current || 1;
    localStorage.setItem('babyday_dismissed_build_time', String(targetBuild));
    localStorage.setItem('babyday_dismissed_version_num', String(targetVer));
    localStorage.setItem('bubblo_app_version', remoteVersion || '2.0');
  };

  // Perform update when user clicks "Actualizar ahora"
  const handlePerformUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setShowBanner(false); // Hide banner immediately!

    try {
      const targetBuild = targetBuildTimeRef.current || Date.now();
      const targetVer = targetVersionNumRef.current || 1;

      // Mark this build as successfully applied so it NEVER prompts again for this version
      localStorage.setItem('babyday_applied_build_time', String(targetBuild));
      localStorage.setItem('babyday_applied_version_num', String(targetVer));
      localStorage.setItem('babyday_dismissed_build_time', String(targetBuild));
      localStorage.setItem('babyday_dismissed_version_num', String(targetVer));
      localStorage.setItem('bubblo_app_version', remoteVersion || '2.0');
      localStorage.setItem('babyday_just_updated', 'true');

      // Clear Service Worker CacheStorage
      if (typeof caches !== 'undefined' && caches.keys) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Tell Service Worker to activate new version immediately
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (e) {
      console.warn('Error applying update:', e);
    }

    // Reload seamlessly in place inside the PWA container
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <>
      {/* Toast de confirmación tras actualizar exitosamente */}
      {showSuccessToast && (
        <div 
          id="update-success-toast"
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[110] px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-2xl flex items-center gap-2 border border-emerald-400/50 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span>¡Mini app actualizada con éxito a la última versión! ✨</span>
        </div>
      )}

      {/* Overlay de recarga cuando el usuario presiona Actualizar ahora */}
      {isUpdating && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-2xl mb-4">
            <RefreshCw className="w-7 h-7 text-white animate-spin" />
          </div>
          <p className="text-base font-black tracking-tight mb-1">Actualizando mini app...</p>
          <p className="text-xs text-orange-200 text-center">Aplicando novedades y limpiando caché. Listo en un momento.</p>
        </div>
      )}

      {/* Banner de Nueva Actualización (SOLO cuando hay una versión superior no aplicada) */}
      {showBanner && !isUpdating && (
        <>
          <div className="h-16 w-full shrink-0" />
          <aside 
            id="update-banner"
            aria-label="Notificación de actualización de la aplicación"
            className="fixed top-0 left-0 right-0 z-[100] px-3.5 py-2.5 text-white shadow-2xl flex items-center justify-between gap-2.5 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.96), rgba(234, 88, 12, 0.98))',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.35)',
            }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
              <div className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              </div>
              <div className="truncate flex-1">
                <p className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Nueva actualización 🚀</span>
                  {remoteVersion && (
                    <span className="text-[10px] bg-white/25 px-1.5 py-0.5 rounded-full font-bold">
                      {remoteVersion}
                    </span>
                  )}
                </p>
                <p className="text-[11px] sm:text-xs text-orange-50 truncate font-medium">
                  {remoteMessage || 'Hay mejoras listas para Baby Day.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="update-now-btn"
                onClick={handlePerformUpdate}
                className="px-3.5 py-1.5 bg-white hover:bg-orange-50 active:scale-95 text-orange-600 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>Actualizar ahora</span>
              </button>

              <button
                id="update-dismiss-btn"
                onClick={handleDismiss}
                aria-label="Cerrar notificación"
                className="p-1.5 hover:bg-white/20 active:scale-95 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};
