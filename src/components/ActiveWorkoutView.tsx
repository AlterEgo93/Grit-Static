import React, { useState, useEffect, useRef } from 'react';
import {
  WorkoutBlock,
  Exercise,
  WorkoutSession,
  SetLog,
  Settings,
} from '../types';
import { db } from '../services/db';
import { haptics } from '../services/haptics';
import { ExerciseIllustration } from './ExerciseIllustration';
import { JapaneseWalkRunner } from './JapaneseWalkRunner';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Undo2,
  ChevronRight,
  Sparkles,
  Timer,
  Award,
  Zap,
  Info,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  blocks: WorkoutBlock[];
  exercisesMap: Map<string, Exercise>;
  settings: Settings;
  onWorkoutComplete: () => void;
}

interface QueueStep {
  roundNum: number;
  exerciseRefIndex: number;
  exerciseId: string;
  setNumberForExercise: number;
  totalTargetRoundsForExercise: number;
}

export const ActiveWorkoutView: React.FC<Props> = ({
  blocks,
  exercisesMap,
  settings,
  onWorkoutComplete,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<WorkoutBlock | null>(blocks[0] || null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Layered execution queue state
  const [workoutQueue, setWorkoutQueue] = useState<QueueStep[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [phase, setPhase] = useState<'idle' | 'ready' | 'work' | 'rest' | 'finished'>('idle');

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completedSetsList, setCompletedSetsList] = useState<SetLog[]>([]);

  // Check if today is an auto volume freeze day
  const [isFreezeDay, setIsFreezeDay] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (blocks.length > 0 && !selectedBlock) {
      setSelectedBlock(blocks[0]);
    }
  }, [blocks, selectedBlock]);

  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      haptics.releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Main Timer Loop
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          // Countdown vibrations at 3, 2, 1
          if (phase === 'rest' && next >= 1 && next <= 3) {
            haptics.triggerCountdownTick(settings.soundEnabled);
          }
          if (next === 0) {
            handleTimerComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeRemaining, phase]);

  const startWorkout = () => {
    if (!selectedBlock) return;

    // Build layered queue based on individual target rounds for each exercise
    const refs = selectedBlock.exercises;
    const maxRounds = Math.max(
      ...refs.map((r) => {
        const baseEx = exercisesMap.get(r.exerciseId);
        if (baseEx?.type === 'interval_walk') return 1; // Walk is ALWAYS 1 set
        return r.customTargetRounds ?? baseEx?.roundsCount ?? 1;
      }),
      1
    );

    const queue: QueueStep[] = [];
    for (let r = 1; r <= maxRounds; r++) {
      refs.forEach((ref, refIdx) => {
        const baseEx = exercisesMap.get(ref.exerciseId);
        const isWalk = baseEx?.type === 'interval_walk';
        const targetR = isWalk ? 1 : (ref.customTargetRounds ?? baseEx?.roundsCount ?? 1);
        if (targetR >= r) {
          queue.push({
            roundNum: r,
            exerciseRefIndex: refIdx,
            exerciseId: ref.exerciseId,
            setNumberForExercise: r,
            totalTargetRoundsForExercise: targetR,
          });
        }
      });
    }

    // Check if any exercise will trigger auto volume increment (+1 round)
    const willIncreaseVolume = refs.some((ref) => {
      const newCount = (ref.completedWorkoutsCount || 0) + 1;
      return (
        selectedBlock.autoVolumeEnabled &&
        selectedBlock.autoVolumeInterval > 0 &&
        newCount % selectedBlock.autoVolumeInterval === 0
      );
    });

    setIsFreezeDay(willIncreaseVolume);

    const session: WorkoutSession = {
      id: 'session_' + Date.now(),
      blockId: selectedBlock.id,
      blockName: selectedBlock.name,
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      isCompleted: false,
      roundsCompleted: 0,
      totalRoundsPlanned: maxRounds,
      durationSeconds: 0,
      wasFreezeDay: willIncreaseVolume,
      completedSets: [],
    };

    setActiveSession(session);
    setWorkoutQueue(queue);
    setQueueIndex(0);
    setCompletedSetsList([]);
    setPhase('ready');

    if (settings.keepScreenOn) {
      haptics.requestWakeLock();
    }
  };

  const getCurrentStep = (): QueueStep | null => {
    return workoutQueue[queueIndex] || null;
  };

  const getCurrentExercise = (): Exercise | null => {
    if (!selectedBlock || queueIndex >= workoutQueue.length) return null;
    const step = workoutQueue[queueIndex];
    const ref = selectedBlock.exercises[step.exerciseRefIndex];
    if (!ref) return null;
    const baseEx = exercisesMap.get(ref.exerciseId);
    if (!baseEx) return null;

    const isWalk = baseEx.type === 'interval_walk';

    return {
      ...baseEx,
      currentValue: ref.customStartValue ?? baseEx.currentValue ?? (isWalk ? 3 : 30),
      roundsCount: isWalk ? 1 : step.totalTargetRoundsForExercise,
      progressionStep: ref.customProgressionStep ?? baseEx.progressionStep ?? (isWalk ? 1 : 5),
      maxValue: ref.customMaxValue ?? baseEx.maxValue ?? (isWalk ? 8 : undefined),
    };
  };

  const startExerciseSet = () => {
    const ex = getCurrentExercise();
    if (!ex) return;

    haptics.triggerGoSignal(settings.soundEnabled);

    if (ex.type === 'static') {
      setTimeRemaining(ex.currentValue);
      setIsTimerRunning(true);
      setPhase('work');
    } else if (ex.type === 'interval_walk') {
      // Do NOT run outer countdown timer for interval_walk!
      // JapaneseWalkRunner manages its own timer and calls finishCurrentSet on completion
      setIsTimerRunning(false);
      setTimeRemaining(0);
      setPhase('work');
    } else {
      setIsTimerRunning(false);
      setPhase('work');
    }
  };

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    if (phase === 'work') {
      finishCurrentSet();
    } else if (phase === 'rest') {
      advanceToNextSet();
    }
  };

  const finishCurrentSet = () => {
    const ex = getCurrentExercise();
    const currentStep = getCurrentStep();
    if (!ex || !selectedBlock || !activeSession || !currentStep) return;

    setIsTimerRunning(false);
    haptics.triggerSetComplete(settings.soundEnabled);

    const setLog: SetLog = {
      id: 'set_' + Date.now(),
      exerciseId: ex.id,
      exerciseName: ex.name,
      roundIndex: currentStep.roundNum,
      type: ex.type,
      targetValue: ex.currentValue,
      actualValue: ex.currentValue,
      completedAt: new Date().toISOString(),
    };

    const newSets = [...completedSetsList, setLog];
    setCompletedSetsList(newSets);

    const updatedSession = {
      ...activeSession,
      completedSets: newSets,
      roundsCompleted: currentStep.roundNum,
    };
    setActiveSession(updatedSession);
    db.logSession(updatedSession);

    // Check if entire queue is complete
    if (queueIndex === workoutQueue.length - 1) {
      completeWorkoutSession(updatedSession);
    } else {
      // Start Rest Phase
      const customRest = selectedBlock.exercises[currentStep.exerciseRefIndex]?.customRestSeconds;
      const restTime = customRest || ex.restAfterSeconds || 45;
      setTimeRemaining(restTime);
      setIsTimerRunning(true);
      setPhase('rest');
    }
  };

  const advanceToNextSet = () => {
    if (queueIndex < workoutQueue.length - 1) {
      setIsTimerRunning(false);
      setQueueIndex((i) => i + 1);
      setPhase('ready');
    }
  };

  const skipRest = () => {
    setIsTimerRunning(false);
    advanceToNextSet();
  };

  const undoLastStep = () => {
    if (completedSetsList.length === 0 || !selectedBlock || !activeSession) return;

    const newSets = [...completedSetsList];
    newSets.pop();
    setCompletedSetsList(newSets);

    setIsTimerRunning(false);
    setQueueIndex((i) => Math.max(0, i - 1));
    setPhase('ready');

    const updatedSession = { ...activeSession, completedSets: newSets };
    setActiveSession(updatedSession);
    db.logSession(updatedSession);

    haptics.vibrate([80, 40, 80]);
  };

  const completeWorkoutSession = (finalSession: WorkoutSession) => {
    if (!selectedBlock) return;

    haptics.triggerWorkoutFinished(settings.soundEnabled);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#10B981', '#3B82F6', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    const endTime = new Date().toISOString();
    const durationSec = Math.round(
      (new Date(endTime).getTime() - new Date(finalSession.startTime).getTime()) / 1000
    );

    const completedSession: WorkoutSession = {
      ...finalSession,
      endTime,
      durationSeconds: durationSec,
      isCompleted: true,
      roundsCompleted: finalSession.totalRoundsPlanned,
    };

    db.logSession(completedSession);

    // Update Block Statistics & Linear Progression Algorithms per exercise
    const updatedBlock = { ...selectedBlock };
    const newTotalCompleted = updatedBlock.totalCompletedWorkouts + 1;
    updatedBlock.totalCompletedWorkouts = newTotalCompleted;

    const exercisesList = db.getExercises();

    // Update individual block exercise refs
    updatedBlock.exercises = updatedBlock.exercises.map((ref) => {
      const baseEx = exercisesList.find((e) => e.id === ref.exerciseId);
      const isWalk = baseEx?.type === 'interval_walk';
      const newCount = (ref.completedWorkoutsCount || 0) + 1;
      const step = ref.customProgressionStep ?? baseEx?.progressionStep ?? (isWalk ? 1 : 5);
      const maxCap = ref.customMaxValue ?? baseEx?.maxValue;
      let newStartVal = ref.customStartValue ?? baseEx?.currentValue ?? (isWalk ? 3 : 30);
      let newRounds = isWalk ? 1 : (ref.customTargetRounds ?? 1);

      if (isWalk) {
        // Japanese Walk Progression: +1 cycle every 2 completed workouts, capped at maxCap (default 8)
        const cap = maxCap || 8;
        if (newCount % 2 === 0) {
          newStartVal = Math.min(cap, newStartVal + 1);
        }
      } else {
        const isExerciseAutoVolumeDay =
          selectedBlock.autoVolumeEnabled &&
          selectedBlock.autoVolumeInterval > 0 &&
          newCount % selectedBlock.autoVolumeInterval === 0;

        if (isExerciseAutoVolumeDay) {
          // Auto-volume +1 round on freeze day for this exercise (keep start value frozen)
          newRounds += 1;
        } else {
          // Linear progression step capped at maxCap
          newStartVal += step;
          if (maxCap !== undefined) {
            newStartVal = Math.min(maxCap, newStartVal);
          }
        }
      }

      return {
        ...ref,
        customStartValue: newStartVal,
        customTargetRounds: newRounds,
        completedWorkoutsCount: newCount,
      };
    });

    // Sync global exercise library counters
    const updatedExercises = exercisesList.map((ex) => {
      const refInBlock = selectedBlock.exercises.find((e) => e.exerciseId === ex.id);
      if (refInBlock) {
        const isWalk = ex.type === 'interval_walk';
        const newCount = (ex.completedWorkoutsCount || 0) + 1;
        const step = refInBlock.customProgressionStep ?? ex.progressionStep ?? (isWalk ? 1 : 5);
        const maxCap = refInBlock.customMaxValue ?? ex.maxValue;
        let newValue = ex.currentValue;
        let newRounds = isWalk ? 1 : (ex.roundsCount || 1);

        if (isWalk) {
          const cap = maxCap || 8;
          if (newCount % 2 === 0) {
            newValue = Math.min(cap, newValue + 1);
          }
        } else {
          const isAutoVolumeDay =
            selectedBlock.autoVolumeEnabled &&
            selectedBlock.autoVolumeInterval > 0 &&
            newCount % selectedBlock.autoVolumeInterval === 0;

          if (isAutoVolumeDay) {
            newRounds += 1;
          } else {
            newValue += step;
            if (maxCap !== undefined) {
              newValue = Math.min(maxCap, newValue);
            }
          }
        }

        return {
          ...ex,
          currentValue: newValue,
          roundsCount: newRounds,
          completedWorkoutsCount: newCount,
        };
      }
      return ex;
    });

    db.saveExercises(updatedExercises);
    db.saveBlock(updatedBlock);

    setActiveSession(completedSession);
    setPhase('finished');
    haptics.releaseWakeLock();
    onWorkoutComplete();
  };

  const currentExercise = getCurrentExercise();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Idle View: Block Selector */}
      {phase === 'idle' && (
        <div className="space-y-6">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-2 border border-blue-500/20">
                  Active Workout // Selection
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
                  Оберіть блок для сьогодні
                </h1>
              </div>

              <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs text-zinc-300">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">Цикл 2 через 1</span>
              </div>
            </div>

            {/* Block Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blocks.map((block) => {
                const isSelected = selectedBlock?.id === block.id;
                const maxRounds = Math.max(
                  ...block.exercises.map(
                    (r) => r.customTargetRounds ?? exercisesMap.get(r.exerciseId)?.roundsCount ?? 1
                  ),
                  1
                );
                const totalSets = block.exercises.reduce(
                  (sum, r) =>
                    sum + (r.customTargetRounds ?? exercisesMap.get(r.exerciseId)?.roundsCount ?? 1),
                  0
                );

                const exercisesSummary = block.exercises
                  .map((ref) => {
                    const ex = exercisesMap.get(ref.exerciseId);
                    if (!ex) return null;
                    const r = ref.customTargetRounds ?? ex.roundsCount ?? 1;
                    return `${ex.name} (${r} ${r === 1 ? 'коло' : r < 5 ? 'кола' : 'кол'})`;
                  })
                  .filter(Boolean);

                const willTriggerFreeze =
                  block.autoVolumeEnabled &&
                  block.autoVolumeInterval > 0 &&
                  (block.totalCompletedWorkouts + 1) % block.autoVolumeInterval === 0;

                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    className={`cursor-pointer rounded-xl p-5 transition-all duration-200 border relative ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">{block.name}</h3>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-zinc-900 border border-zinc-700 text-blue-400 font-mono">
                        До {maxRounds} кол • {totalSets} підходів
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{block.description}</p>

                    <div className="text-xs text-zinc-500 mb-4 space-y-1">
                      <p className="font-semibold text-zinc-400 uppercase text-[10px] tracking-wider">
                        Склад вправ ({exercisesSummary.length}):
                      </p>
                      <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                        {exercisesSummary.join(' • ')}
                      </p>
                    </div>

                    {willTriggerFreeze && (
                      <div className="mb-4 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Наступне тренування: +1 коло для вправ за розкладом 12 тренувань</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-800/80">
                      <span>Завершено тренувань: {block.totalCompletedWorkouts}</span>
                      <span className="text-blue-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        Обрати <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Start Button */}
            {selectedBlock && (() => {
              const maxR = Math.max(
                ...selectedBlock.exercises.map(
                  (r) => r.customTargetRounds ?? exercisesMap.get(r.exerciseId)?.roundsCount ?? 1
                ),
                1
              );
              const totalS = selectedBlock.exercises.reduce(
                (sum, r) => sum + (r.customTargetRounds ?? exercisesMap.get(r.exerciseId)?.roundsCount ?? 1),
                0
              );
              return (
                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-zinc-400">
                    Готово до запуску: <strong className="text-white">{selectedBlock.name}</strong> ({totalS} підходів у {maxR} пошарових колах)
                  </div>

                  <button
                    onClick={startWorkout}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold uppercase text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    РОЗПОЧАТИ ТРЕНУВАННЯ
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. Active Session Display ("Always On" AMOLED) */}
      {(phase === 'ready' || phase === 'work' || phase === 'rest') && activeSession && selectedBlock && currentExercise && (() => {
        const currentStep = getCurrentStep();
        if (!currentStep) return null;

        const maxRounds = Math.max(
          ...selectedBlock.exercises.map(
            (r) => r.customTargetRounds ?? exercisesMap.get(r.exerciseId)?.roundsCount ?? 1
          ),
          1
        );
        const roundSteps = workoutQueue.filter((s) => s.roundNum === currentStep.roundNum);
        const currentRoundStepIndex = roundSteps.findIndex((s) => s === currentStep) + 1;
        const nextStep = workoutQueue[queueIndex + 1];

        return (
          <div className="space-y-6">
            {/* Top Status Banner */}
            <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {isFreezeDay && (
                <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-amber-200">Авто-об'єм активний!</strong>
                    <p className="text-amber-300/90 text-[11px] mt-0.5">
                      Додано +1 коло до вправ за циклом 12 тренувань. Лінійна секунди/рази заморожена для цієї вправи, щоб уникнути перевтоми.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-6">
                <div>
                  <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
                    {selectedBlock.name}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    Коло {currentStep.roundNum} з {maxRounds}
                  </h2>
                </div>

                {/* Progress Pill */}
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-zinc-400">
                    Вправа {currentRoundStepIndex} з {roundSteps.length} у колі
                  </span>
                  <div className="w-full sm:w-36 bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-800">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{
                        width: `${((queueIndex + 1) / workoutQueue.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Exercise Details Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-black border border-zinc-800 rounded-2xl relative">
                  <ExerciseIllustration
                    type={currentExercise.svgIconType}
                    className="w-28 h-28 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                  />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-3">
                    {currentExercise.targetMuscle}
                  </span>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Підхід {currentStep.setNumberForExercise} з {currentStep.totalTargetRoundsForExercise}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">{currentExercise.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md">{currentExercise.description}</p>
                    </div>

                    {/* Delta indicator */}
                    {currentExercise.type === 'interval_walk' ? (
                      <div className="bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                          Ціль і дельта
                        </span>
                        <strong className="text-base font-black text-blue-500 font-mono">
                          {currentExercise.currentValue} {currentExercise.currentValue === 1 ? 'цикл' : currentExercise.currentValue < 5 ? 'цикли' : 'циклів'} ({currentExercise.currentValue * 6} хв)
                        </strong>
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          +1 цикл / 2 трен (макс. {currentExercise.maxValue || 8})
                        </span>
                      </div>
                    ) : (
                      <div className="bg-zinc-900/80 border border-zinc-800 px-3.5 py-2 rounded-xl text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                          Ціль і дельта
                        </span>
                        <strong className="text-base font-black text-blue-500 font-mono">
                          {currentExercise.currentValue} {currentExercise.unit === 'sec' ? 'сек' : 'разів'}
                        </strong>
                        <span className="text-xs font-bold text-emerald-400 font-mono ml-1.5">
                          (+{currentExercise.progressionStep}{currentExercise.maxValue ? `, макс. ${currentExercise.maxValue}` : ''})
                        </span>
                      </div>
                    )}
                  </div>

                {/* Central Massive AMOLED Timer / Counter */}
                <div className="bg-black border border-zinc-800 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden">
                  {phase === 'ready' && (
                    currentExercise.type === 'interval_walk' ? (
                      <div className="space-y-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                          Японська інтервальна ходьба
                        </span>
                        <div className="text-3xl sm:text-5xl font-black font-mono text-blue-500 tracking-tight drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                          {currentExercise.currentValue} {currentExercise.currentValue === 1 ? 'цикл' : currentExercise.currentValue < 5 ? 'цикли' : 'циклів'}
                          <span className="text-base font-bold text-zinc-400 ml-2 block sm:inline">
                            ({currentExercise.currentValue * 6} хв + 10 хв вільна ходьба)
                          </span>
                        </div>
                        <button
                          onClick={startExerciseSet}
                          className="px-12 py-4 rounded-xl font-bold uppercase text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-white" />
                          РОЗПОЧАТИ ХОДЬБУ
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                          Наступна вправа
                        </span>
                        <div className="text-6xl sm:text-7xl font-black font-mono text-blue-500 tracking-tight drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                          {currentExercise.currentValue}
                          <span className="text-2xl font-bold text-zinc-500 ml-2">
                            {currentExercise.unit === 'sec' ? 'СЕК' : 'РАЗІВ'}
                          </span>
                        </div>
                        <button
                          onClick={startExerciseSet}
                          className="px-12 py-4 rounded-xl font-bold uppercase text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-white" />
                          РОЗПОЧАТИ ПІДХІД
                        </button>
                      </div>
                    )
                  )}

                  {phase === 'work' && (
                    <div className="space-y-4 py-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 animate-pulse flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        ВИКОНАННЯ
                      </span>

                      {currentExercise.type === 'interval_walk' ? (
                        <div className="pt-2 text-left">
                          <JapaneseWalkRunner
                            settings={settings}
                            targetCycles={currentExercise.currentValue || 3}
                            fastBpm={currentExercise.japaneseWalkConfig?.fastTempoBpm || 130}
                            normalBpm={currentExercise.japaneseWalkConfig?.normalTempoBpm || 95}
                            intervalMinutes={currentExercise.japaneseWalkConfig?.intervalMinutes || 3}
                            warmupMinutes={5}
                            cooldownMinutes={5}
                            isWorkoutMode={true}
                            onCompleteSession={() => finishCurrentSet()}
                          />
                        </div>
                      ) : (
                        <>
                          {currentExercise.type === 'static' ? (
                            <div className="text-7xl sm:text-8xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                              {timeRemaining}
                              <span className="text-2xl font-bold text-zinc-500 ml-2">СЕК</span>
                            </div>
                          ) : (
                            <div className="text-7xl sm:text-8xl font-black font-mono text-blue-500 tracking-tight drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                              {currentExercise.currentValue}
                              <span className="text-2xl font-bold text-zinc-500 ml-2">РАЗІВ</span>
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-3">
                            {currentExercise.type === 'static' && (
                              <button
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-xs font-bold uppercase text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                              >
                                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {isTimerRunning ? 'Пауза' : 'Продовжити'}
                              </button>
                            )}

                            <button
                              onClick={finishCurrentSet}
                              className="px-10 py-4 rounded-xl font-bold uppercase text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-900/30 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-5 h-5 fill-black text-emerald-500" />
                              ЗАВЕРШИТИ ПІДХІД
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {phase === 'rest' && (
                    <div className="space-y-3 py-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                        <Timer className="w-4 h-4 text-amber-400 animate-spin" />
                        ВІДПОЧИНОК
                      </span>

                      <div className="text-7xl sm:text-8xl font-black font-mono text-amber-400 tracking-tight drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        {timeRemaining}
                        <span className="text-2xl font-bold text-zinc-500 ml-2">СЕК</span>
                      </div>

                      <button
                        onClick={skipRest}
                        className="px-8 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-4 h-4" />
                        Пропустити відпочинок
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Secondary Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={undoLastStep}
                    disabled={completedSetsList.length === 0}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
                    title="Скасувати останній підхід"
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    Undo Step
                  </button>

                  <div className="text-xs text-zinc-500 font-mono">
                    Підходів: <strong className="text-zinc-300">{completedSetsList.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* 3. Workout Completion Screen */}
      {phase === 'finished' && activeSession && selectedBlock && (
        <div className="bg-[#0c0c0e] border border-blue-500/40 rounded-2xl p-8 text-center space-y-6 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl" />

          <div className="inline-flex p-4 rounded-full bg-blue-600/10 border border-blue-500/40 text-blue-500">
            <Award className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tight">ТРЕНУВАННЯ УСПІШНО ЗАВЕРШЕНО!</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Всі {activeSession.totalRoundsPlanned} кіл виконано. Автоматично оновлено показники прогресії для наступного сеансу.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto py-2">
            <div className="bg-black border border-zinc-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Час</span>
              <strong className="text-xl font-bold font-mono text-blue-400">
                {Math.floor(activeSession.durationSeconds / 60)} хв {activeSession.durationSeconds % 60} с
              </strong>
            </div>

            <div className="bg-black border border-zinc-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Підходів</span>
              <strong className="text-xl font-bold font-mono text-emerald-400">
                {activeSession.completedSets.length}
              </strong>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-black border border-zinc-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Режим</span>
              <strong className="text-sm font-bold text-amber-400">
                {isFreezeDay ? 'Запобіжник (+1 коло)' : 'Лінійна прогресія'}
              </strong>
            </div>
          </div>

          <button
            onClick={() => {
              setPhase('idle');
              setActiveSession(null);
            }}
            className="px-10 py-4 rounded-xl font-bold uppercase text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 inline-flex items-center gap-2"
          >
            ПОВЕРНУТИСЯ ДО МЕНЮ
          </button>
        </div>
      )}
    </div>
  );
};
