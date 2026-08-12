import { WorkoutSession } from '../types';

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSessionDateString(s: WorkoutSession): string {
  if (s.startTime) {
    const d = new Date(s.startTime);
    if (!isNaN(d.getTime())) {
      return getLocalDateString(d);
    }
  }
  if (s.date) {
    if (s.date.includes('T')) {
      return s.date.split('T')[0];
    }
    return s.date;
  }
  return '';
}

/**
 * Calculates consecutive active training days (streak).
 * Multiple completed workout blocks on the same calendar day count as 1 active day.
 */
export function calculateConsecutiveStreak(sessions: WorkoutSession[]): number {
  const completedSessions = sessions.filter((s) => s.isCompleted);
  if (completedSessions.length === 0) return 0;

  const completedDates = new Set<string>();
  completedSessions.forEach((s) => {
    const dStr = getSessionDateString(s);
    if (dStr) {
      completedDates.add(dStr);
    }
  });

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let currentCheckDate: Date | null = null;

  if (completedDates.has(todayStr)) {
    currentCheckDate = today;
  } else if (completedDates.has(yesterdayStr)) {
    currentCheckDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  const checkDate = new Date(currentCheckDate);

  while (true) {
    const dStr = getLocalDateString(checkDate);
    if (completedDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Formats the plural form for "день поспіль" in Ukrainian
 */
export function formatDaysLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return 'днів поспіль';
  }
  if (mod10 === 1) {
    return 'день поспіль';
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return 'дні поспіль';
  }
  return 'днів поспіль';
}
