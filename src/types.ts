/**
 * Grit & Static: Personal Trainer - Core Domain Types
 */

export type ExerciseType = 'static' | 'dynamic' | 'interval_walk';

export interface JapaneseWalkConfig {
  fastTempoBpm: number; // e.g. 130
  normalTempoBpm: number; // e.g. 95
  intervalMinutes: number; // e.g. 3
}

export interface Exercise {
  id: string;
  name: string; // e.g., "Планка"
  type: ExerciseType;
  description: string;
  targetMuscle: string; // e.g., "Прес / Кора"
  currentValue: number; // seconds or reps or cycles (default: 30)
  roundsCount?: number; // target rounds for this exercise (default: 1)
  progressionStep: number; // e.g., +5 seconds or +2 reps or +1 cycle
  maxValue?: number; // maximum progression cap/ceiling (e.g., 180s for plank, 50 reps for pushups, 8 cycles for walk)
  unit: 'sec' | 'reps';
  isPreset: boolean;
  restAfterSeconds: number; // e.g., 45
  japaneseWalkConfig?: JapaneseWalkConfig;
  svgIconType?: 'plank' | 'pushup' | 'walking' | 'wallsit' | 'superman' | 'static_pushup' | 'custom';
  completedWorkoutsCount?: number; // independent progress cycle counter
  imageUrl?: string; // realistic photo image url
}

export interface BlockExerciseRef {
  exerciseId: string;
  customRestSeconds?: number;
  customTargetRounds?: number; // individual target rounds count for this exercise in this block (default: 1)
  customStartValue?: number; // individual initial value for duration/reps (default: 30)
  customProgressionStep?: number; // individual linear step
  customMaxValue?: number; // individual maximum ceiling limit
  completedWorkoutsCount?: number; // exercise independent progress cycle counter in block
}

export interface WorkoutBlock {
  id: string;
  name: string; // e.g., "Основне кругове тренування"
  description: string;
  exercises: BlockExerciseRef[];
  roundsCount: number; // e.g., 3 rounds
  autoVolumeInterval: number; // e.g., 12 completed workouts -> +1 round
  autoVolumeEnabled: boolean;
  totalCompletedWorkouts: number; // counter for auto volume
}

export interface SetLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  roundIndex: number;
  type: ExerciseType;
  targetValue: number;
  actualValue: number;
  completedAt: string; // ISO string
}

export interface WorkoutSession {
  id: string;
  blockId: string;
  blockName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO
  endTime?: string; // ISO
  isCompleted: boolean;
  roundsCompleted: number;
  totalRoundsPlanned: number;
  durationSeconds: number;
  wasFreezeDay: boolean; // True if volume was increased +1 round today and exercise linear step was frozen
  completedSets: SetLog[];
}

export interface Settings {
  vibrationEnabled: boolean;
  vibrationIntensity: 'light' | 'medium' | 'strong';
  soundEnabled: boolean;
  keepScreenOn: boolean;
  autoVolumeThreshold: number; // Default 12
  rollbackDaysThreshold: number; // Default 7
  rollbackSteps: number; // 1 or 2 steps rollback
  workoutDaysOn: number; // e.g. 3
  workoutDaysOff: number; // e.g. 1
}

export interface CalendarDayInfo {
  date: string; // YYYY-MM-DD
  isScheduledWorkout: boolean;
  isRestDay: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  session?: WorkoutSession;
}
