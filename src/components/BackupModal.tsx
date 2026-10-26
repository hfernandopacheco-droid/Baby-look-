import React, { useState, useRef } from 'react';
import { Download, Upload, X, Check, AlertCircle, FileText, Database, ShieldCheck } from 'lucide-react';
import { LanguageCode } from '../types';
import { rE } from '../i18n';
import { bA } from '../utils';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  babyName: string;
  lang: LanguageCode;
  isDark: boolean;
  onRestoreSuccess: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  babyName,
  lang,
  isDark,
  onRestoreSuccess,
}) => {
  const t = rE[lang] || rE.es;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importPreview, setImportPreview] = useState<{
    babyName?: string;
    eventsCount?: number;
    exportedAt?: string;
    keysCount?: number;
    rawContent?: Record<string, string>;
  } | null>(null);

  if (!isOpen) return null;

  // 1. Export Data to JSON
  const handleExport = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bubblo_') || key.startsWith('bubblo'))) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            backupData[key] = value;
          }
        }
      }

      const payload = {
        appName: 'Bubblo - El Universo de tu Bebé',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        currentUserId,
        babyName,
        totalKeys: Object.keys(backupData).length,
        data: backupData,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeName = (babyName || 'bebe').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `bubblo_backup_${safeName}_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      bA(window.innerWidth / 2, window.innerHeight / 2);
    } catch (err) {
      console.error('Export error:', err);
      setErrorMessage('Error al generar el archivo de exportación.');
      setImportStatus('error');
    }
  };

  // 2. Select & Parse JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('idle');
    setErrorMessage('');
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Check if format has .data or is direct key-value
        const dataObj = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        const keys = Object.keys(dataObj);

        if (keys.length === 0) {
          setErrorMessage('El archivo seleccionado no contiene datos válidos de Bubblo.');
          setImportStatus('error');
          return;
        }

        // Count events if available
        let eventsCount = 0;
        let detectedBabyName = parsed.babyName;
        for (const [k, v] of Object.entries(dataObj)) {
          if (k.includes('events')) {
            try {
              const evs = JSON.parse(v as string);
              if (Array.isArray(evs)) eventsCount += evs.length;
            } catch {
              // ignore
            }
          }
          if (k.includes('baby') && !detectedBabyName) {
            try {
              const b = JSON.parse(v as string);
              if (b?.name) detectedBabyName = b.name;
            } catch {
              // ignore
            }
          }
        }

        setImportPreview({
          babyName: detectedBabyName || 'Bebé',
          eventsCount,
          exportedAt: parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleDateString() : 'Desconocida',
          keysCount: keys.length,
          rawContent: dataObj,
        });
      } catch (err) {
        console.error('Parse error:', err);
        setErrorMessage('El archivo no tiene un formato JSON válido.');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm Restore to localStorage
  const handleConfirmRestore = () => {
    if (!importPreview?.rawContent) return;

    try {
      for (const [key, value] of Object.entries(importPreview.rawContent)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }

      setImportStatus('success');
      bA(window.innerWidth / 2, window.innerHeight / 2);

      setTimeout(() => {
        onRestoreSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Restore error:', err);
      setErrorMessage('Error al escribir los datos en el navegador.');
      setImportStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg p-6 rounded-3xl shadow-2xl border transition-all relative overflow-hidden ${
          isDark
            ? 'bg-[#1E1E2E] border-slate-700 text-slate-100'
            : 'bg-[#FDFBF7] border-amber-200/80 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-slate-900 dark:text-white">
                Copia de Seguridad
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exportar o restaurar todos tus registros y configuración
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-6">
          {/* Section 1: Exportar */}
          <div
            className={`p-4 rounded-2xl border transition ${
              isDark ? 'bg-[#2A2A40] border-slate-700/60' : 'bg-white border-amber-200/60 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Exportar Datos</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Descarga un archivo JSON con todos los eventos, medidas, vacunas, recetas y despensa de {babyName}.
                </p>
              </div>
              <button
                id="btn-export-json"
                type="button"
                onClick={handleExport}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 clay-press cursor-pointer shrink-0 transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar JSON</span>
              </button>
            </div>
          </div>

          {/* Section 2: Importar */}
          <div
            className={`p-4 rounded-2xl border transition ${
              isDark ? 'bg-[#2A2A40] border-slate-700/60' : 'bg-white border-amber-200/60 shadow-xs'
            }`}
          >
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Restaurar Copia de Seguridad</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecciona un archivo JSON generado previamente para recuperar todos tus datos.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            {!importPreview && (
              <button
                id="btn-import-select"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full mt-3 py-3 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'border-slate-700 hover:border-sky-500 text-slate-400 hover:text-sky-400 bg-slate-800/40'
                    : 'border-slate-300 hover:border-sky-500 text-slate-600 hover:text-sky-600 bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Seleccionar archivo .JSON</span>
              </button>
            )}

            {/* Preview of file selected */}
            {importPreview && (
              <div
                className={`mt-3 p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-sky-50/70 border-sky-200'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Copia válida detectada</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImportPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    Cambiar archivo
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70">
                    <div className="text-slate-400 text-[10px]">Bebé</div>
                    <div className="font-extrabold truncate text-slate-800 dark:text-white">
                      {importPreview.babyName}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70">
                    <div className="text-slate-400 text-[10px]">Eventos</div>
                    <div className="font-extrabold text-slate-800 dark:text-white">
                      {importPreview.eventsCount}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/70">
                    <div className="text-slate-400 text-[10px]">Fecha</div>
                    <div className="font-extrabold text-slate-800 dark:text-white">
                      {importPreview.exportedAt}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-confirm-restore"
                  type="button"
                  onClick={handleConfirmRestore}
                  className="w-full mt-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 clay-press cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Restaurar y Reemplazar Datos</span>
                </button>
              </div>
            )}

            {importStatus === 'success' && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span>¡Copia de seguridad restaurada con éxito! Actualizando...</span>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage || 'Error al procesar el archivo.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {t.cancel || 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
