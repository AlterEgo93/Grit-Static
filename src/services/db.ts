import {
  Exercise,
  WorkoutBlock,
  WorkoutSession,
  Settings,
  CalendarDayInfo,
  SetLog,
} from '../types';
import { INITIAL_PRESET_EXERCISES, INITIAL_DEFAULT_BLOCKS } from '../data/presets';

const STORAGE_KEYS = {
  EXERCISES: 'grit_static_exercises_v1',
  BLOCKS: 'grit_static_blocks_v1',
  SESSIONS: 'grit_static_sessions_v1',
  SETTINGS: 'grit_static_settings_v1',
  SCHEDULE_START_DATE: 'grit_static_schedule_start_v1',
};

export const DEFAULT_SETTINGS: Settings = {
  vibrationEnabled: true,
  vibrationIntensity: 'medium',
  soundEnabled: true,
  keepScreenOn: true,
  autoVolumeThreshold: 12,
  rollbackDaysThreshold: 7,
  rollbackSteps: 1,
  workoutDaysOn: 3,
  workoutDaysOff: 1,
};

class DatabaseService {
  private exercisesCache: Exercise[] | null = null;
  private blocksCache: WorkoutBlock[] | null = null;
  private sessionsCache: WorkoutSession[] | null = null;
  private settingsCache: Settings | null = null;

  // Initialize DB with presets if empty
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISES)) {
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(INITIAL_PRESET_EXERCISES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(INITIAL_DEFAULT_BLOCKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULE_START_DATE)) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.SCHEDULE_START_DATE, today);
    }
  }

  // --- Exercises ---
  public getExercises(): Exercise[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      return raw ? JSON.parse(raw) : INITIAL_PRESET_EXERCISES;
    } catch {
      return INITIAL_PRESET_EXERCISES;
    }
  }

  public saveExercises(exercises: Exercise[]): void {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    this.exercisesCache = exercises;
  }

  public saveExercise(exercise: Exercise): void {
    const list = this.getExercises();
    const index = list.findIndex((e) => e.id === exercise.id);
    if (index >= 0) {
      list[index] = exercise;
    } else {
      list.push(exercise);
    }
    this.saveExercises(list);
  }

  public deleteExercise(id: string): void {
    const list = this.getExercises().filter((e) => e.id !== id);
    this.saveExercises(list);
  }

  // --- Blocks ---
  public getBlocks(): WorkoutBlock[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BLOCKS);
      return raw ? JSON.parse(raw) : INITIAL_DEFAULT_BLOCKS;
    } catch {
      return INITIAL_DEFAULT_BLOCKS;
    }
  }

  public saveBlocks(blocks: WorkoutBlock[]): void {
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
    this.blocksCache = blocks;
  }

  public saveBlock(block: WorkoutBlock): void {
    const list = this.getBlocks();
    const idx = list.findIndex((b) => b.id === block.id);
    if (idx >= 0) {
      list[idx] = block;
    } else {
      list.push(block);
    }
    this.saveBlocks(list);
  }

  public deleteBlock(id: string): void {
    const list = this.getBlocks().filter((b) => b.id !== id);
    this.saveBlocks(list);
  }

  // --- Sessions History ---
  public getSessions(): WorkoutSession[] {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public saveSessions(sessions: WorkoutSession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this.sessionsCache = sessions;
  }

  public logSession(session: WorkoutSession): void {
    const list = this.getSessions();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    this.saveSessions(list);
  }

  // --- Settings ---
  public getSettings(): Settings {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.settingsCache = settings;
  }

  // --- Rollback Logic (Section 5 Rule: Long Break > 7 days) ---
  public checkForInactivityRollback(): {
    isEligibleForRollback: boolean;
    daysInactive: number;
    lastWorkoutDate: string | null;
  } {
    const sessions = this.getSessions().filter((s) => s.isCompleted);
    if (sessions.length === 0) {
      return { isEligibleForRollback: false, daysInactive: 0, lastWorkoutDate: null };
    }

    const lastSession = sessions[0]; // ordered desc
    const lastDate = new Date(lastSession.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const daysInactive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const settings = this.getSettings();

    return {
      isEligibleForRollback: daysInactive > settings.rollbackDaysThreshold,
      daysInactive,
      lastWorkoutDate: lastSession.date,
    };
  }

  public executeRollback(stepsCount: number = 1): void {
    const exercises = this.getExercises();
    const updated = exercises.map((ex) => {
      const step = ex.progressionStep;
      const reduction = step * stepsCount;
      const newValue = Math.max(ex.unit === 'sec' ? 10 : 3, ex.currentValue - reduction);
      return {
        ...ex,
        currentValue: newValue,
      };
    });
    this.saveExercises(updated);
  }

  // --- Schedule Calculation (2 on, 1 off cycle with dynamic shift) ---
  public getScheduleStartDate(): string {
    return localStorage.getItem(STORAGE_KEYS.SCHEDULE_START_DATE) || new Date().toISOString().split('T')[0];
  }

  public getCalendarDays(daysRange: number = 30): CalendarDayInfo[] {
    const sessions = this.getSessions();
    const completedDatesMap = new Map<string, WorkoutSession>();
    sessions.forEach((s) => {
      if (s.isCompleted) {
        completedDatesMap.set(s.date, s);
      }
    });

    const result: CalendarDayInfo[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate dates starting 14 days ago up to daysRange
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 14);

    const scheduleAnchor = new Date(this.getScheduleStartDate());
    scheduleAnchor.setHours(0, 0, 0, 0);

    const settings = this.getSettings();
    const daysOn = settings.workoutDaysOn || 3;
    const daysOff = settings.workoutDaysOff || 1;
    const cycleLen = Math.max(1, daysOn + daysOff);

    for (let i = 0; i < daysRange + 14; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      // Calculate configurable cycle position based on schedule anchor
      const diffDays = Math.floor((d.getTime() - scheduleAnchor.getTime()) / (1000 * 60 * 60 * 24));
      const cyclePos = ((diffDays % cycleLen) + cycleLen) % cycleLen;
      const isScheduledWorkout = cyclePos < daysOn;
      const isRestDay = !isScheduledWorkout;

      const session = completedDatesMap.get(dateStr);
      const isCompleted = !!session;
      const isPast = d < today;
      const isMissed = isPast && isScheduledWorkout && !isCompleted;

      result.push({
        date: dateStr,
        isScheduledWorkout,
        isRestDay,
        isCompleted,
        isMissed,
        session,
      });
    }

    return result;
  }

  // If a workout is missed today or previously, shift the schedule anchor forward so future schedule adjusts seamlessly
  public shiftScheduleForMissedWorkout(missedDateStr: string): void {
    const anchor = new Date(this.getScheduleStartDate());
    anchor.setDate(anchor.getDate() + 1);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_START_DATE, anchor.toISOString().split('T')[0]);
  }

  // --- Export / Import Backup (Section 8) ---
  public exportBackupJSON(): string {
    const data = {
      version: 1,
      appName: 'Grit & Static: Personal Trainer',
      exportedAt: new Date().toISOString(),
      exercises: this.getExercises(),
      blocks: this.getBlocks(),
      sessions: this.getSessions(),
      settings: this.getSettings(),
      scheduleStartDate: this.getScheduleStartDate(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.exercises || !parsed.blocks) {
        return { success: false, message: 'Невалідний формат бекапу. Відсутні обов’язкові блоки даних.' };
      }

      this.saveExercises(parsed.exercises);
      this.saveBlocks(parsed.blocks);
      if (parsed.sessions) this.saveSessions(parsed.sessions);
      if (parsed.settings) this.saveSettings(parsed.settings);
      if (parsed.scheduleStartDate) localStorage.setItem(STORAGE_KEYS.SCHEDULE_START_DATE, parsed.scheduleStartDate);

      return { success: true, message: 'Базу даних успішно відновлено!' };
    } catch (err: any) {
      return { success: false, message: 'Помилка під час читання JSON файлу: ' + err.message };
    }
  }

  public resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(INITIAL_PRESET_EXERCISES));
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(INITIAL_DEFAULT_BLOCKS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_START_DATE, new Date().toISOString().split('T')[0]);
  }
}

export const db = new DatabaseService();
