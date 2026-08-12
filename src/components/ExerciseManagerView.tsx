import React, { useState } from 'react';
import { Exercise, WorkoutBlock, ExerciseType, BlockExerciseRef } from '../types';
import { db } from '../services/db';
import { ExerciseIllustration } from './ExerciseIllustration';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  ChevronRight,
  Zap,
  ArrowUp,
  ArrowDown,
  Repeat,
  Timer,
  Clock,
  Sparkles,
  Settings2,
} from 'lucide-react';

interface Props {
  exercises: Exercise[];
  blocks: WorkoutBlock[];
  onRefresh: () => void;
}

export const ExerciseManagerView: React.FC<Props> = ({ exercises, blocks, onRefresh }) => {
  const [tab, setTab] = useState<'blocks' | 'exercises'>('blocks');

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'block' | 'exercise'; id: string; name: string } | null>(null);

  // Exercise modal state
  const [isEditingExercise, setIsEditingExercise] = useState<boolean>(false);
  const [exerciseForm, setExerciseForm] = useState<Partial<Exercise>>({
    name: '',
    type: 'static',
    description: '',
    targetMuscle: '',
    currentValue: 30, // Default 30 seconds
    roundsCount: 1, // Default 1 round
    progressionStep: 5,
    unit: 'sec',
    isPreset: false,
    restAfterSeconds: 30,
    svgIconType: 'custom',
  });

  // Block modal state
  const [isEditingBlock, setIsEditingBlock] = useState<boolean>(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockName, setBlockName] = useState<string>('');
  const [blockDescription, setBlockDescription] = useState<string>('');
  const [blockRoundsCount, setBlockRoundsCount] = useState<number>(3);
  const [autoVolumeInterval, setAutoVolumeInterval] = useState<number>(12);
  const [autoVolumeEnabled, setAutoVolumeEnabled] = useState<boolean>(true);
  const [blockExerciseRefs, setBlockExerciseRefs] = useState<BlockExerciseRef[]>([]);

  // Sub-modal for selecting exercise to add
  const [showAddExercisePicker, setShowAddExercisePicker] = useState<boolean>(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState<boolean>(false);
  const [quickExName, setQuickExName] = useState<string>('');
  const [quickExType, setQuickExType] = useState<ExerciseType>('static');
  const [quickExStartVal, setQuickExStartVal] = useState<number>(30); // 30 sec initial default
  const [quickExRounds, setQuickExRounds] = useState<number>(1); // 1 round initial default
  const [quickExStep, setQuickExStep] = useState<number>(5);
  const [quickExMaxVal, setQuickExMaxVal] = useState<number | undefined>(180);

  // --- Exercise CRUD ---
  const openNewExerciseForm = () => {
    setExerciseForm({
      id: 'custom_ex_' + Date.now(),
      name: '',
      type: 'static',
      description: '',
      targetMuscle: 'Прес / Кора',
      currentValue: 30, // Default starting duration: 30s
      roundsCount: 1, // Default starting rounds: 1
      progressionStep: 5,
      maxValue: 180, // Default cap: 180s
      unit: 'sec',
      isPreset: false,
      restAfterSeconds: 30,
      svgIconType: 'custom',
    });
    setIsEditingExercise(true);
  };

  const openEditExerciseForm = (ex: Exercise) => {
    setExerciseForm({ ...ex });
    setIsEditingExercise(true);
  };

  const saveExerciseForm = () => {
    if (!exerciseForm.name || exerciseForm.currentValue === undefined || exerciseForm.progressionStep === undefined) {
      alert('Будь ласка, заповніть назву, початкове значення та крок прогресії.');
      return;
    }

    const ex: Exercise = {
      id: exerciseForm.id || 'custom_ex_' + Date.now(),
      name: exerciseForm.name,
      type: exerciseForm.type || 'static',
      description: exerciseForm.description || '',
      targetMuscle: exerciseForm.targetMuscle || 'Тіло',
      currentValue: Number(exerciseForm.currentValue) || 30,
      roundsCount: Number(exerciseForm.roundsCount) || 1,
      progressionStep: Number(exerciseForm.progressionStep) || 5,
      maxValue: exerciseForm.maxValue !== undefined && exerciseForm.maxValue !== null && (exerciseForm.maxValue as any) !== ''
        ? Number(exerciseForm.maxValue)
        : undefined,
      unit: exerciseForm.unit || 'sec',
      isPreset: !!exerciseForm.isPreset,
      restAfterSeconds: Number(exerciseForm.restAfterSeconds) || 30,
      svgIconType: exerciseForm.svgIconType || 'custom',
      completedWorkoutsCount: exerciseForm.completedWorkoutsCount || 0,
    };

    db.saveExercise(ex);
    setIsEditingExercise(false);
    onRefresh();
  };

  const deleteExercise = (id: string) => {
    const ex = exercises.find((e) => e.id === id);
    setDeleteConfirmTarget({ type: 'exercise', id, name: ex?.name || 'вправу' });
  };

  const deleteBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    setDeleteConfirmTarget({ type: 'block', id, name: block?.name || 'блок тренувань' });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    if (deleteConfirmTarget.type === 'block') {
      db.deleteBlock(deleteConfirmTarget.id);
    } else {
      db.deleteExercise(deleteConfirmTarget.id);
    }
    setDeleteConfirmTarget(null);
    onRefresh();
  };
  const openEditBlockForm = (b: WorkoutBlock) => {
    setEditingBlockId(b.id);
    setBlockName(b.name);
    setBlockDescription(b.description);
    setBlockRoundsCount(b.roundsCount || 3);
    setAutoVolumeInterval(b.autoVolumeInterval || 12);
    setAutoVolumeEnabled(b.autoVolumeEnabled !== false);

    // Deep copy refs with explicit defaults (30s / 1 round) if missing
    const refs = (b.exercises || []).map((ref) => {
      const baseEx = exercises.find((e) => e.id === ref.exerciseId);
      return {
        ...ref,
        customStartValue: ref.customStartValue ?? baseEx?.currentValue ?? 30,
        customTargetRounds: ref.customTargetRounds ?? baseEx?.roundsCount ?? 1,
        customProgressionStep: ref.customProgressionStep ?? baseEx?.progressionStep ?? 5,
        customMaxValue: ref.customMaxValue ?? baseEx?.maxValue,
        customRestSeconds: ref.customRestSeconds ?? baseEx?.restAfterSeconds ?? 30,
      };
    });

    setBlockExerciseRefs(refs);
    setIsEditingBlock(true);
  };

  const openNewBlockForm = () => {
    setEditingBlockId('custom_block_' + Date.now());
    setBlockName('Нове кругове тренування');
    setBlockDescription('Опис нового комплексу');
    setBlockRoundsCount(3);
    setAutoVolumeInterval(12);
    setAutoVolumeEnabled(true);

    // Initial 2 exercises defaulted to 30s and 1 round
    const initialRefs = exercises.slice(0, 2).map((e) => ({
      exerciseId: e.id,
      customStartValue: e.currentValue || 30,
      customTargetRounds: e.roundsCount || 1,
      customProgressionStep: e.progressionStep || 5,
      customMaxValue: e.maxValue,
      customRestSeconds: e.restAfterSeconds || 30,
    }));

    setBlockExerciseRefs(initialRefs);
    setIsEditingBlock(true);
  };

  const saveBlockForm = () => {
    if (!blockName || blockExerciseRefs.length === 0) {
      alert('Заповніть назву блоку та додайте хоча б одну вправу.');
      return;
    }

    const existingBlock = blocks.find((b) => b.id === editingBlockId);

    const b: WorkoutBlock = {
      id: editingBlockId || 'custom_block_' + Date.now(),
      name: blockName,
      description: blockDescription,
      exercises: blockExerciseRefs,
      roundsCount: Number(blockRoundsCount) || 3,
      autoVolumeInterval: Number(autoVolumeInterval) || 12,
      autoVolumeEnabled,
      totalCompletedWorkouts: existingBlock?.totalCompletedWorkouts || 0,
    };

    db.saveBlock(b);
    setIsEditingBlock(false);
    onRefresh();
  };

  // Exercise refs manipulation inside Block Editor
  const updateRefField = (index: number, field: keyof BlockExerciseRef, value: number | undefined) => {
    const updated = [...blockExerciseRefs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setBlockExerciseRefs(updated);
  };

  const moveRefUp = (index: number) => {
    if (index === 0) return;
    const updated = [...blockExerciseRefs];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setBlockExerciseRefs(updated);
  };

  const moveRefDown = (index: number) => {
    if (index === blockExerciseRefs.length - 1) return;
    const updated = [...blockExerciseRefs];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setBlockExerciseRefs(updated);
  };

  const removeRef = (index: number) => {
    setBlockExerciseRefs(blockExerciseRefs.filter((_, i) => i !== index));
  };

  const addExerciseToBlock = (exId: string) => {
    const baseEx = exercises.find((e) => e.id === exId);
    const newRef: BlockExerciseRef = {
      exerciseId: exId,
      customStartValue: baseEx?.currentValue || 30, // Default 30s
      customTargetRounds: baseEx?.roundsCount || 1, // Default 1 round
      customProgressionStep: baseEx?.progressionStep || 5,
      customMaxValue: baseEx?.maxValue,
      customRestSeconds: baseEx?.restAfterSeconds || 30,
    };
    setBlockExerciseRefs([...blockExerciseRefs, newRef]);
    setShowAddExercisePicker(false);
  };

  const handleQuickCreateAndAdd = () => {
    if (!quickExName) {
      alert('Будь ласка, введіть назву вправи');
      return;
    }

    const newEx: Exercise = {
      id: 'custom_ex_' + Date.now(),
      name: quickExName,
      type: quickExType,
      description: 'Власна вправу додано до кругового тренування',
      targetMuscle: 'Кора / Тіло',
      currentValue: Number(quickExStartVal) || 30, // Prefilled 30s
      roundsCount: Number(quickExRounds) || 1, // Prefilled 1 round
      progressionStep: Number(quickExStep) || 5,
      maxValue: quickExMaxVal ? Number(quickExMaxVal) : undefined,
      unit: quickExType === 'static' ? 'sec' : 'reps',
      isPreset: false,
      restAfterSeconds: 30,
      svgIconType: 'custom',
      completedWorkoutsCount: 0,
    };

    // Save to global exercises DB
    db.saveExercise(newEx);

    // Add to current editing block
    const newRef: BlockExerciseRef = {
      exerciseId: newEx.id,
      customStartValue: newEx.currentValue,
      customTargetRounds: newEx.roundsCount,
      customProgressionStep: newEx.progressionStep,
      customMaxValue: newEx.maxValue,
      customRestSeconds: 30,
    };

    setBlockExerciseRefs([...blockExerciseRefs, newRef]);
    setShowQuickCreateModal(false);
    setQuickExName('');
    onRefresh();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Selector Header */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
              Circuit Manager // Programs & Exercises
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Конструктор кругових тренувань
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl">
            <button
              onClick={() => setTab('blocks')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                tab === 'blocks'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Кругові блоки ({blocks.length})
            </button>
            <button
              onClick={() => setTab('exercises')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                tab === 'exercises'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Бібліотека вправ ({exercises.length})
            </button>
          </div>
        </div>

        {/* BLOCKS TAB */}
        {tab === 'blocks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">
                Редагування вправ та параметрів блоків.
              </p>
              <button
                onClick={openNewBlockForm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                Створити новий блок
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="bg-black border border-zinc-800 rounded-2xl p-6 space-y-4 relative hover:border-zinc-700 transition-all shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white">{b.name}</h3>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                          Круговий комплекс
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{b.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openEditBlockForm(b)}
                        className="px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                      >
                        <Settings2 className="w-4 h-4" />
                        Редагувати вправи й параметри
                      </button>
                      <button
                        onClick={() => deleteBlock(b.id)}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 hover:border-rose-800/50 transition-all cursor-pointer"
                        title="Видалити блок"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of exercises inside this block with individual parameters */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                      Склад вправ у крузі ({b.exercises.length}):
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {b.exercises.map((ref, idx) => {
                        const ex = exercises.find((e) => e.id === ref.exerciseId);
                        if (!ex) return null;

                        const isWalk = ex.type === 'interval_walk';
                        const duration = ref.customStartValue ?? ex.currentValue ?? (isWalk ? 3 : 30);
                        const rounds = isWalk ? 1 : (ref.customTargetRounds ?? ex.roundsCount ?? 1);
                        const step = ref.customProgressionStep ?? ex.progressionStep ?? (isWalk ? 1 : 5);
                        const rest = ref.customRestSeconds ?? ex.restAfterSeconds ?? 30;
                        const maxCap = ref.customMaxValue ?? ex.maxValue ?? (isWalk ? 8 : undefined);

                        return (
                          <div
                            key={idx}
                            className="bg-[#0e0e11] border border-zinc-800/80 rounded-xl p-3.5 flex items-center gap-3.5 relative"
                          >
                            <ExerciseIllustration
                              type={ex.svgIconType}
                              customUrl={ex.imageUrl}
                              className="w-14 h-14 text-blue-500 shrink-0"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-bold text-white truncate">
                                  {idx + 1}. {ex.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-blue-400 font-mono border border-zinc-800">
                                  {rounds} {rounds === 1 ? (isWalk ? 'підхід' : 'коло') : 'кола'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs font-mono text-zinc-300 mt-1.5">
                                <span className="text-blue-400 font-bold">
                                  {isWalk
                                    ? `Старт: ${duration} ${duration === 1 ? 'цикл' : duration < 5 ? 'цикли' : 'циклів'} (${duration * 6} хв)`
                                    : `Старт: ${duration} ${ex.unit === 'sec' ? 'сек' : 'разів'}`}
                                </span>
                                <span className="text-emerald-400 font-bold">
                                  {isWalk ? '+1 цикл / 2 трен' : `Крок: +${step}`}
                                </span>
                              </div>

                              <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                                {maxCap && <span className="text-amber-400 font-bold">Макс: {maxCap} {isWalk ? 'циклів' : ex.unit === 'sec' ? 'сек' : 'разів'}</span>}
                                {maxCap && <span>•</span>}
                                <span>Відпочинок: {rest}с</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto volume rule preview */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs flex items-center justify-between text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Авто-прогресія об'єму: +1 коло кожні <strong>{b.autoVolumeInterval}</strong> тренувань
                      </span>
                    </div>
                    <span className="font-mono text-zinc-500">Виконано: {b.totalCompletedWorkouts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXERCISES LIBRARY TAB */}
        {tab === 'exercises' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Загальна база вправ для додавання в будь-які кругові комплекси.
              </p>
              <button
                onClick={openNewExerciseForm}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Створити вправу
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-black border border-zinc-800 rounded-xl p-4 flex items-start gap-4 relative hover:border-zinc-700 transition-all"
                >
                  <ExerciseIllustration
                    type={ex.svgIconType}
                    customUrl={ex.imageUrl}
                    className="w-16 h-16 text-blue-500 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-white truncate">{ex.name}</h3>
                      {ex.isPreset && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800 uppercase tracking-wider">
                          Пресет
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{ex.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold text-blue-400 mt-3 pt-2 border-t border-zinc-800/80">
                      <span>
                        {ex.type === 'interval_walk'
                          ? `Поточне: ${ex.currentValue} ${ex.currentValue === 1 ? 'цикл' : ex.currentValue < 5 ? 'цикли' : 'циклів'} (${ex.currentValue * 6} хв)`
                          : `Поточне: ${ex.currentValue} ${ex.unit === 'sec' ? 'сек' : 'разів'}`}
                      </span>
                      <span className="text-emerald-400">
                        {ex.type === 'interval_walk' ? '+1 цикл / 2 трен' : `Крок: +${ex.progressionStep}`}
                      </span>
                      {ex.maxValue && (
                        <span className="text-amber-400">
                          Макс: {ex.maxValue} {ex.type === 'interval_walk' ? 'циклів' : ex.unit === 'sec' ? 'сек' : 'разів'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => openEditExerciseForm(ex)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="Редагувати"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!ex.isPreset && (
                      <button
                        onClick={() => deleteExercise(ex.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800"
                        title="Видалити"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT BLOCK & EXERCISES IN CIRCUIT */}
      {isEditingBlock && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0A0A0C] border border-zinc-800 rounded-2xl p-4 sm:p-6 max-w-2xl w-full my-auto space-y-4 max-h-[92vh] overflow-y-auto overflow-x-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">
                  Block Customizer
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Налаштування кругового тренування
                </h3>
              </div>
              <button
                onClick={() => setIsEditingBlock(false)}
                className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-wider p-1"
              >
                Закрити
              </button>
            </div>

            {/* General Block Parameters */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Назва блоку</label>
                  <input
                    type="text"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    placeholder="Наприклад: Базове кругове тренування"
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Інтервал +1 кола (тренувань)</label>
                  <input
                    type="number"
                    value={autoVolumeInterval}
                    onChange={(e) => setAutoVolumeInterval(Number(e.target.value))}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Опис блоку</label>
                <input
                  type="text"
                  value={blockDescription}
                  onChange={(e) => setBlockDescription(e.target.value)}
                  placeholder="Опис тренувального комплексу"
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* SECTION: EXERCISES LIST IN CIRCUIT */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Вправи в цьому кругу</h4>
                    <p className="text-[11px] text-zinc-400">
                      Налаштуйте індивідуальні значення тривалості та кількість кол для кожної вправи.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExercisePicker(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Додати вправу
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickCreateModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black text-[11px] font-bold uppercase transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Створити нову
                    </button>
                  </div>
                </div>

                {blockExerciseRefs.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                    Немає вправ у цьому блоці. Натисніть "+ Додати вправу", щоб зібрати комплекс.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {blockExerciseRefs.map((ref, index) => {
                      const ex = exercises.find((e) => e.id === ref.exerciseId);
                      if (!ex) return null;

                      return (
                        <div
                          key={index}
                          className="bg-[#121216] border border-zinc-800 rounded-xl p-3 sm:p-4 space-y-3 relative hover:border-zinc-700 transition-all"
                        >
                          {/* Top bar of exercise ref */}
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <ExerciseIllustration
                                type={ex.svgIconType}
                                customUrl={ex.imageUrl}
                                className="w-9 h-9 sm:w-10 sm:h-10 text-blue-500 shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="font-bold text-white text-xs sm:text-sm truncate">{ex.name}</h5>
                                <span className="text-[10px] text-zinc-500 block truncate">{ex.targetMuscle}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveRefUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30"
                                title="Перемістити вгору"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveRefDown(index)}
                                disabled={index === blockExerciseRefs.length - 1}
                                className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30"
                                title="Перемістити вниз"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRef(index)}
                                className="p-1 rounded bg-zinc-900 text-zinc-500 hover:text-rose-400 ml-1"
                                title="Видалити з комплексу"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Individual Exercise Controls inside Block */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[11px]">
                            <div className="min-w-0">
                              <label className="text-zinc-400 font-bold block mb-1 truncate">
                                Стартове ({ex.unit === 'sec' ? 'сек' : 'разів'})
                              </label>
                              <input
                                type="number"
                                value={ref.customStartValue ?? ex.currentValue ?? 30}
                                onChange={(e) =>
                                  updateRefField(index, 'customStartValue', Number(e.target.value))
                                }
                                className="w-full bg-[#08080a] border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="text-zinc-400 font-bold block mb-1 truncate">
                                Кол для вправи
                              </label>
                              <input
                                type="number"
                                value={ref.customTargetRounds ?? ex.roundsCount ?? 1}
                                onChange={(e) =>
                                  updateRefField(index, 'customTargetRounds', Number(e.target.value))
                                }
                                className="w-full bg-[#08080a] border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="text-zinc-400 font-bold block mb-1 truncate">Крок (+)</label>
                              <input
                                type="number"
                                value={ref.customProgressionStep ?? ex.progressionStep ?? 5}
                                onChange={(e) =>
                                  updateRefField(index, 'customProgressionStep', Number(e.target.value))
                                }
                                className="w-full bg-[#08080a] border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="text-zinc-400 font-bold block mb-1 truncate">Макс. межа</label>
                              <input
                                type="number"
                                value={ref.customMaxValue ?? ex.maxValue ?? ''}
                                placeholder="Без межі"
                                onChange={(e) =>
                                  updateRefField(index, 'customMaxValue', e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="w-full bg-[#08080a] border border-zinc-800 rounded-lg px-2 py-1.5 text-amber-400 font-mono text-xs outline-none focus:border-amber-500"
                              />
                            </div>

                            <div className="min-w-0 col-span-2 sm:col-span-1">
                              <label className="text-zinc-400 font-bold block mb-1 truncate">Пауза (сек)</label>
                              <input
                                type="number"
                                value={ref.customRestSeconds ?? ex.restAfterSeconds ?? 30}
                                onChange={(e) =>
                                  updateRefField(index, 'customRestSeconds', Number(e.target.value))
                                }
                                className="w-full bg-[#08080a] border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-mono text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditingBlock(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={saveBlockForm}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30"
              >
                Зберегти круговий блок
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: PICK EXERCISE FROM LIBRARY */}
      {showAddExercisePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0C] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-bold text-white">Оберіть вправу для додавання</h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => addExerciseToBlock(ex.id)}
                  className="p-3 bg-[#121216] border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500 hover:bg-zinc-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ExerciseIllustration type={ex.svgIconType} customUrl={ex.imageUrl} className="w-10 h-10" />
                    <div>
                      <h5 className="text-xs font-bold text-white">{ex.name}</h5>
                      <span className="text-[10px] text-zinc-500">{ex.currentValue} {ex.unit === 'sec' ? 'сек' : 'разів'}</span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddExercisePicker(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: QUICK CREATE EXERCISE */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0C] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="text-base font-bold text-white">Створити вправу для цього блоку</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Назва вправи</label>
                <input
                  type="text"
                  value={quickExName}
                  onChange={(e) => setQuickExName(e.target.value)}
                  placeholder="Наприклад: Човник або Підйоми ніг"
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Тип вправи</label>
                  <select
                    value={quickExType}
                    onChange={(e) => setQuickExType(e.target.value as ExerciseType)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="static">Статика (Секунди)</option>
                    <option value="dynamic">Динаміка (Рази)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Початкова тривалість</label>
                  <input
                    type="number"
                    value={quickExStartVal}
                    onChange={(e) => setQuickExStartVal(Number(e.target.value))}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Кола (початково)</label>
                  <input
                    type="number"
                    value={quickExRounds}
                    onChange={(e) => setQuickExRounds(Number(e.target.value))}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Крок (+)</label>
                  <input
                    type="number"
                    value={quickExStep}
                    onChange={(e) => setQuickExStep(Number(e.target.value))}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Макс. межа</label>
                  <input
                    type="number"
                    value={quickExMaxVal ?? ''}
                    placeholder="Без межі"
                    onChange={(e) => setQuickExMaxVal(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowQuickCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleQuickCreateAndAdd}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Створити та додати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SINGLE EXERCISE FROM LIBRARY */}
      {isEditingExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0A0C] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-white">
              {exerciseForm.id ? 'Налаштування вправи' : 'Нова вправа'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Назва вправи</label>
                <input
                  type="text"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  placeholder="Наприклад: Бічні скручування"
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Тип вправи</label>
                  <select
                    value={exerciseForm.type}
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        type: e.target.value as ExerciseType,
                        unit: e.target.value === 'static' ? 'sec' : 'reps',
                      })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="static">Статика (Секунди)</option>
                    <option value="dynamic">Динаміка (Рази)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Цільові м'язи</label>
                  <input
                    type="text"
                    value={exerciseForm.targetMuscle}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, targetMuscle: e.target.value })}
                    placeholder="Кора / Спина"
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">
                    Початкове значення ({exerciseForm.type === 'static' ? 'сек' : 'разів'})
                  </label>
                  <input
                    type="number"
                    value={exerciseForm.currentValue}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, currentValue: Number(e.target.value) })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Кількість кол</label>
                  <input
                    type="number"
                    value={exerciseForm.roundsCount || 1}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, roundsCount: Number(e.target.value) })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Крок (+)</label>
                  <input
                    type="number"
                    value={exerciseForm.progressionStep ?? 5}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, progressionStep: Number(e.target.value) })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Макс. межа</label>
                  <input
                    type="number"
                    value={exerciseForm.maxValue ?? ''}
                    placeholder="Без межі"
                    onChange={(e) =>
                      setExerciseForm({
                        ...exerciseForm,
                        maxValue: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-amber-400 font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Пауза (сек)</label>
                  <input
                    type="number"
                    value={exerciseForm.restAfterSeconds ?? 30}
                    onChange={(e) =>
                      setExerciseForm({ ...exerciseForm, restAfterSeconds: Number(e.target.value) })
                    }
                    className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Опис / Техніка виконання</label>
                <textarea
                  value={exerciseForm.description}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#121216] border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsEditingExercise(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Скасувати
              </button>
              <button
                onClick={saveExerciseForm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-rose-500/40 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Підтвердження видалення</h4>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Безповоротна дія</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Ви дійсно бажаєте видалити <strong className="text-white">"{deleteConfirmTarget.name}"</strong>? Цю дію неможливо буде скасувати.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/30"
              >
                Так, видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
