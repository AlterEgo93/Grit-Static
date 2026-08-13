import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../types';
import { haptics } from '../services/haptics';
import { ExerciseIllustration } from './ExerciseIllustration';
import {
  Play,
  Pause,
  RotateCcw,
  Footprints,
  Zap,
  CheckCircle2,
  SkipForward,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type SubPhase = 'warmup' | 'fast' | 'normal' | 'cooldown' | 'finished';

interface Props {
  settings: Settings;
  targetCycles?: number;
  fastBpm?: number;
  normalBpm?: number;
  intervalMinutes?: number;
  warmupMinutes?: number;
  cooldownMinutes?: number;
  onCompleteSession?: (stats: { totalDurationSec: number; completedCycles: number }) => void;
  onSaveToCalendar?: (stats: { totalDurationSec: number; completedCycles: number }) => void;
  isWorkoutMode?: boolean;
}

export const JapaneseWalkRunner: React.FC<Props> = ({
  settings,
  targetCycles = 3,
  fastBpm: initFastBpm = 130,
  normalBpm: initNormalBpm = 95,
  intervalMinutes: initIntervalMinutes = 3,
  warmupMinutes: initWarmupMinutes = 5,
  cooldownMinutes: initCooldownMinutes = 5,
  onCompleteSession,
  onSaveToCalendar,
  isWorkoutMode = false,
}) => {
  const [fastBpm, setFastBpm] = useState<number>(initFastBpm);
  const [normalBpm, setNormalBpm] = useState<number>(initNormalBpm);
  const [intervalMinutes, setIntervalMinutes] = useState<number>(initIntervalMinutes);
  const [warmupMinutes, setWarmupMinutes] = useState<number>(initWarmupMinutes);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(initCooldownMinutes);
  const [cycles, setCycles] = useState<number>(targetCycles);

  const [subPhase, setSubPhase] = useState<SubPhase>('warmup');
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const [isRunning, setIsRunning] = useState<boolean>(isWorkoutMode);
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(warmupMinutes * 60);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);

  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);

  const timerIntervalRef = useRef<any>(null);
  const metronomeIntervalRef = useRef<any>(null);

  useEffect(() => {
    setCycles(targetCycles);
  }, [targetCycles]);

  useEffect(() => {
    if (isRunning && subPhase !== 'finished') {
      haptics.unlockVibration();
      haptics.requestWakeLock();
    } else {
      haptics.releaseWakeLock();
    }
  }, [isRunning, subPhase]);

  // Metronome Ticker Loop (Only active during fast / normal phases)
  useEffect(() => {
    const isMetronomePhase = subPhase === 'fast' || subPhase === 'normal';

    if (isRunning && isMetronomePhase) {
      const currentBpm = subPhase === 'fast' ? fastBpm : normalBpm;
      const intervalMs = Math.round((60 / currentBpm) * 1000);

      metronomeIntervalRef.current = setInterval(() => {
        haptics.triggerMetronomeTick(subPhase === 'fast', settings.soundEnabled);
      }, intervalMs);
    } else {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isRunning, subPhase, fastBpm, normalBpm, settings.soundEnabled]);

  // Main Timer Countdown Loop
  useEffect(() => {
    if (isRunning && subPhase !== 'finished') {
      timerIntervalRef.current = setInterval(() => {
        setTotalSecondsElapsed((t) => t + 1);

        setPhaseSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Transition logic
            handlePhaseTransition();
            return 0; // Temporary before next phase sets state
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, subPhase, currentCycle, cycles, intervalMinutes, warmupMinutes, cooldownMinutes, settings.soundEnabled]);

  const handlePhaseTransition = () => {
    if (subPhase === 'warmup') {
      // Warmup finished -> Start Fast Phase of Cycle 1
      setSubPhase('fast');
      setPhaseSecondsRemaining(intervalMinutes * 60);
      haptics.triggerPhaseChangeAlert(true, settings.soundEnabled);
    } else if (subPhase === 'fast') {
      // Fast phase finished -> Start Normal Phase of current cycle
      setSubPhase('normal');
      setPhaseSecondsRemaining(intervalMinutes * 60);
      haptics.triggerPhaseChangeAlert(false, settings.soundEnabled);
    } else if (subPhase === 'normal') {
      // Normal phase finished -> Cycle complete!
      const newCompleted = completedCycles + 1;
      setCompletedCycles(newCompleted);

      if (currentCycle < cycles) {
        // Next cycle
        setCurrentCycle((c) => c + 1);
        setSubPhase('fast');
        setPhaseSecondsRemaining(intervalMinutes * 60);
        haptics.triggerPhaseChangeAlert(true, settings.soundEnabled);
      } else {
        // All cycles completed -> Start Cooldown
        setSubPhase('cooldown');
        setPhaseSecondsRemaining(cooldownMinutes * 60);
        haptics.triggerPhaseChangeAlert(false, settings.soundEnabled);
      }
    } else if (subPhase === 'cooldown') {
      // Session finished completely!
      setSubPhase('finished');
      setIsRunning(false);
      haptics.triggerWorkoutFinished(settings.soundEnabled);
      haptics.releaseWakeLock();

      if (onCompleteSession) {
        onCompleteSession({
          totalDurationSec: totalSecondsElapsed,
          completedCycles: completedCycles || cycles,
        });
      }
    }
  };

  const skipCurrentPhase = () => {
    handlePhaseTransition();
  };

  const toggleSession = () => {
    haptics.unlockVibration();
    if (!isRunning) {
      haptics.triggerGoSignal(settings.soundEnabled);
      if (settings.keepScreenOn) haptics.requestWakeLock();
    } else {
      haptics.releaseWakeLock();
    }
    setIsRunning(!isRunning);
  };

  const resetSession = () => {
    setIsRunning(false);
    setSubPhase('warmup');
    setCurrentCycle(1);
    setCompletedCycles(0);
    setPhaseSecondsRemaining(warmupMinutes * 60);
    setTotalSecondsElapsed(0);
    haptics.releaseWakeLock();
  };

  const handleManualSave = () => {
    if (onSaveToCalendar) {
      onSaveToCalendar({
        totalDurationSec: totalSecondsElapsed,
        completedCycles: completedCycles || 1,
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSubPhaseTitle = () => {
    switch (subPhase) {
      case 'warmup':
        return '🚶‍♂️ Вільна ходьба (Розминка)';
      case 'fast':
        return `⚡ Швидкий темп (Цикл ${currentCycle} з ${cycles})`;
      case 'normal':
        return `🍃 Звичайний темп (Цикл ${currentCycle} з ${cycles})`;
      case 'cooldown':
        return '🚶‍♂️ Вільна ходьба (Заминка)';
      case 'finished':
        return '🏆 Завершено!';
    }
  };

  const getSubPhaseBpm = () => {
    if (subPhase === 'fast') return `${fastBpm} BPM`;
    if (subPhase === 'normal') return `${normalBpm} BPM`;
    return 'Вільний темп';
  };

  return (
    <div className="space-y-6">
      {/* Save Notification Toast */}
      {showSavedToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Успішно збережено в Календар!</span>
        </div>
      )}

      {/* Main Dynamic Stage Canvas */}
      <div className="bg-black border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        {/* Stage Status Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-6">
          <div className="text-left">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-0.5">
              Поточна фаза вправи
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {getSubPhaseTitle()}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-blue-400">
              {getSubPhaseBpm()}
            </span>
            {subPhase !== 'warmup' && subPhase !== 'cooldown' && subPhase !== 'finished' && (
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                Цикл {currentCycle}/{cycles}
              </span>
            )}
          </div>
        </div>

        {/* Central Visual Ring & Indicator */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative flex items-center justify-center">
            <div
              className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 ${
                subPhase === 'fast'
                  ? 'border-blue-500 bg-blue-950/30 shadow-[0_0_40px_rgba(59,130,246,0.25)]'
                  : subPhase === 'normal'
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-[0_0_40px_rgba(16,185,129,0.25)]'
                  : subPhase === 'warmup' || subPhase === 'cooldown'
                  ? 'border-zinc-600 bg-zinc-900/50 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                  : 'border-amber-500 bg-amber-950/30'
              }`}
            >
              {isRunning && (subPhase === 'fast' || subPhase === 'normal') && (
                <div
                  className={`absolute inset-0 rounded-full border-2 animate-ping opacity-30 ${
                    subPhase === 'fast' ? 'border-blue-500' : 'border-emerald-500'
                  }`}
                />
              )}

              <ExerciseIllustration type="walking" className="w-12 h-12 text-white mb-1" />

              <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                {subPhase === 'warmup' && '🚶‍♂️ РОЗМИНКА (ВІЛЬНО)'}
                {subPhase === 'fast' && '⚡ ШВИДКИЙ ТЕМП'}
                {subPhase === 'normal' && '🍃 ЗВИЧАЙНИЙ ТЕМП'}
                {subPhase === 'cooldown' && '🚶‍♂️ ЗАМИНКА (ВІЛЬНО)'}
                {subPhase === 'finished' && '🏆 ТРЕНУВАННЯ ЗАВЕРШЕНО'}
              </span>

              <div className="text-4xl font-black font-mono text-white tracking-tight mt-1">
                {formatTime(phaseSecondsRemaining)}
              </div>
            </div>
          </div>

          {/* Timers & Cycles Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md text-center">
            <div className="bg-[#121216] border border-zinc-800 p-3 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                Загальний час
              </span>
              <strong className="text-xl font-black font-mono text-white">
                {formatTime(totalSecondsElapsed)}
              </strong>
            </div>

            <div className="bg-[#121216] border border-zinc-800 p-3 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                Пройдено циклів
              </span>
              <strong className="text-xl font-black font-mono text-amber-400">
                {completedCycles} з {cycles}
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#121216] border border-zinc-800 p-3 rounded-xl">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                Метроном
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  subPhase === 'fast' || subPhase === 'normal' ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                {subPhase === 'fast' || subPhase === 'normal' ? 'АКТИВНИЙ' : 'ВИМКНЕНО'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {subPhase !== 'finished' && (
              <button
                type="button"
                onClick={toggleSession}
                className={`px-8 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-900/30'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isRunning ? 'ПАУЗА' : 'СТАРТ ХОДЬБИ'}
              </button>
            )}

            {subPhase !== 'finished' && isRunning && (
              <button
                type="button"
                onClick={skipCurrentPhase}
                className="px-4 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                title="Пропустити поточну фазу"
              >
                <SkipForward className="w-4 h-4" />
                Далі
              </button>
            )}

            <button
              type="button"
              onClick={resetSession}
              className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              title="Скинути таймер"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {!isWorkoutMode && totalSecondsElapsed >= 30 && (
              <button
                type="button"
                onClick={handleManualSave}
                className="px-5 py-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Зберегти в Календар
              </button>
            )}

            {isWorkoutMode && (
              <button
                type="button"
                onClick={() => {
                  if (onCompleteSession) {
                    onCompleteSession({
                      totalDurationSec: totalSecondsElapsed,
                      completedCycles: completedCycles || 1,
                    });
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 text-black font-black uppercase text-xs tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 fill-black" />
                ЗАВЕРШИТИ ВПРАВУ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings / Config Accordion (if not in workout mode) */}
      {!isWorkoutMode && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
              Розминка (хв)
            </label>
            <input
              type="number"
              value={warmupMinutes}
              onChange={(e) => setWarmupMinutes(Math.max(1, Math.min(15, Number(e.target.value))))}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
              Швидкий BPM
            </label>
            <input
              type="number"
              value={fastBpm}
              onChange={(e) => setFastBpm(Math.max(100, Math.min(180, Number(e.target.value))))}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
              Звичайний BPM
            </label>
            <input
              type="number"
              value={normalBpm}
              onChange={(e) => setNormalBpm(Math.max(60, Math.min(120, Number(e.target.value))))}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
              Фаза (хв)
            </label>
            <input
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
              Циклів (підходів)
            </label>
            <input
              type="number"
              value={cycles}
              onChange={(e) => setCycles(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-white font-mono font-bold focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
