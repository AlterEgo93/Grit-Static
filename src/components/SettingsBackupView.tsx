import React, { useRef, useState } from 'react';
import { Settings } from '../types';
import { db } from '../services/db';
import { haptics } from '../services/haptics';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Vibrate,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Calendar,
  HelpCircle,
} from 'lucide-react';

interface Props {
  settings: Settings;
  onRefresh: () => void;
  onOpenHelp?: () => void;
}

export const SettingsBackupView: React.FC<Props> = ({ settings, onRefresh, onOpenHelp }) => {
  const [localSettings, setLocalSettings] = useState<Settings>({ ...settings });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showRollbackConfirmModal, setShowRollbackConfirmModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (updated: Settings) => {
    setLocalSettings(updated);
    db.saveSettings(updated);
    onRefresh();
  };

  const handleExportJSON = () => {
    const jsonString = db.exportBackupJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GritAndStatic_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Бекап даних успішно завантажено!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = db.importBackupJSON(content);
      if (res.success) {
        setStatusMessage(res.message);
        onRefresh();
      } else {
        setErrorMessage(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmManualRollback = () => {
    db.executeRollback(localSettings.rollbackSteps || 1);
    haptics.vibrate([100, 50, 100]);
    setShowRollbackConfirmModal(false);
    onRefresh();
    setStatusMessage('Ролбек навантаження успішно виконано.');
  };

  const handleConfirmResetAllData = () => {
    db.resetToDefaults();
    setShowResetModal(false);
    onRefresh();
    setStatusMessage('Базу даних успішно скинуто до початкових пресетів!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
              System Settings // Storage
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Параметри, Бекап та Ролбек
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Інструкція та довідка</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs text-zinc-300">
              <SettingsIcon className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">Offline-first storage</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline text-rose-300 hover:text-white"
            >
              Закрити
            </button>
          </div>
        )}

        {/* 1. Haptic & Screen Toggles */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
            <Vibrate className="w-4 h-4 text-blue-500" />
            Вібрація та Зворотний зв'язок
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Vibration Toggle & Test */}
            <div className="flex flex-col gap-2 bg-[#0c0c0e] p-3.5 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-white block font-semibold">Вібрація (Haptics)</strong>
                  <span className="text-zinc-500 text-[11px]">Сигнали таймерів та метронома</span>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.vibrationEnabled}
                  onChange={(e) =>
                    handleSaveSettings({ ...localSettings, vibrationEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
                />
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptics.unlockVibration();
                    const success = haptics.vibrate([150, 80, 150, 80, 250]);
                    if (success) {
                      setStatusMessage('Сигнал вібрації відправлено на пристрій.');
                    } else {
                      setErrorMessage('Браузер або ОС блокує вібрацію. Перевірте налаштування звуку пристрою.');
                    }
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Vibrate className="w-3.5 h-3.5 text-blue-400" />
                  Тест вібрації
                </button>
                <span className="text-[10px] text-zinc-500">
                  Потрібно увімкнути "Вібрацію дотику" в Android
                </span>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between bg-[#0c0c0e] p-3.5 rounded-xl border border-zinc-800">
              <div>
                <strong className="text-white block font-semibold">Аудіо-клік (Companion)</strong>
                <span className="text-zinc-500 text-[11px]">Звуковий супровід таймерів</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  handleSaveSettings({ ...localSettings, soundEnabled: e.target.checked })
                }
                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
              />
            </div>

            {/* Screen Wake Lock */}
            <div className="flex items-center justify-between bg-[#0c0c0e] p-3.5 rounded-xl border border-zinc-800 col-span-1 sm:col-span-2">
              <div>
                <strong className="text-white block font-semibold">Always On Display (Wake Lock)</strong>
                <span className="text-zinc-500 text-[11px]">Утримувати екран увімкненим під час активного тренування</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.keepScreenOn}
                onChange={(e) =>
                  handleSaveSettings({ ...localSettings, keepScreenOn: e.target.checked })
                }
                className="w-5 h-5 accent-blue-600 cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* Schedule Configuration Card */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
            <Calendar className="w-4 h-4 text-blue-500" />
            Схема графіку тренувань
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Оберіть бажаний ритм тренувань та днів відпочинку для розрахунку інтерактивного календаря:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { label: '3 через 1', on: 3, off: 1 },
              { label: '2 через 1', on: 2, off: 1 },
              { label: '1 через 1', on: 1, off: 1 },
              { label: '5 через 2', on: 5, off: 2 },
            ].map((preset) => {
              const isActive =
                (localSettings.workoutDaysOn ?? 3) === preset.on && (localSettings.workoutDaysOff ?? 1) === preset.off;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    handleSaveSettings({
                      ...localSettings,
                      workoutDaysOn: preset.on,
                      workoutDaysOff: preset.off,
                    })
                  }
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : 'bg-[#0c0c0e] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="flex items-center justify-between bg-[#0c0c0e] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-300 font-medium">Днів тренувань поспіль:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSettings({
                      ...localSettings,
                      workoutDaysOn: Math.max(1, (localSettings.workoutDaysOn || 3) - 1),
                    })
                  }
                  className="w-7 h-7 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-white text-sm">
                  {localSettings.workoutDaysOn || 3}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSettings({
                      ...localSettings,
                      workoutDaysOn: Math.min(14, (localSettings.workoutDaysOn || 3) + 1),
                    })
                  }
                  className="w-7 h-7 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#0c0c0e] p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-300 font-medium">Днів відпочинку:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSettings({
                      ...localSettings,
                      workoutDaysOff: Math.max(1, (localSettings.workoutDaysOff || 1) - 1),
                    })
                  }
                  className="w-7 h-7 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-white text-sm">
                  {localSettings.workoutDaysOff || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSaveSettings({
                      ...localSettings,
                      workoutDaysOff: Math.min(14, (localSettings.workoutDaysOff || 1) + 1),
                    })
                  }
                  className="w-7 h-7 rounded bg-zinc-800 text-white font-bold flex items-center justify-center hover:bg-zinc-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Inactivity Rollback Rule Configuration */}
        <div className="bg-black border border-amber-500/30 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2 tracking-tight">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Запобіжник тривалої перерви (Rollback)
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Якщо перерва між тренуваннями перевищує <strong>7 днів</strong>, застосунок пропонує зробити безпечний Rollback навантаження на 1-2 кроки назад, щоб запобігти травмам.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-zinc-400">
              Поріг перерви: <strong className="text-white font-mono">{localSettings.rollbackDaysThreshold} днів</strong>
            </div>

            <button
              type="button"
              onClick={() => setShowRollbackConfirmModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Виконати ручний Ролбек (-1 крок)
            </button>
          </div>
        </div>

        {/* 3. Manual Backup Export & Import */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
            <Download className="w-4 h-4 text-blue-500" />
            Автономний бекап бази даних (JSON)
          </h3>

          <p className="text-xs text-zinc-400">
            Збережіть повний знімок ваших вправ, блоків, налаштувань та історії в файл `.json` або відновіть його на іншому пристрої без інтернету.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Експорт бази даних (.json)
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              Імпорт / Відновлення з JSON
            </button>
          </div>
        </div>

        {/* 4. Danger Zone */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium">Повне скидання додатку</span>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/20 border border-rose-800/40 hover:bg-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Скинути до стандартних пресетів
          </button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Скинути всі дані?</h4>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Безповоротна дія</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Ви дійсно бажаєте скинути всю базу даних до початкових пресетів? Вся ваша історія тренувань та створені вправи будуть видалені!
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmResetAllData}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                Скинути
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLLBACK CONFIRMATION MODAL */}
      {showRollbackConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Підтвердження ролбеку</h4>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Безпечне зниження</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Виконати безпечний ролбек на 1 крок назад для всіх вправ (-5 сек / -2 повторення)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowRollbackConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmManualRollback}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/30 cursor-pointer"
              >
                Виконати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

