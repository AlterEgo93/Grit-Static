import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from './db';
import { WorkoutBlock, WorkoutSession } from '../types';

const LAST_OPENED_KEY = 'grit_static_last_app_opened_v1';
const TIMER_NOTIFICATION_ID = 9999;
const WORKOUT_COMPLETE_NOTIFICATION_ID = 9998;

export class NotificationService {
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // Track last app opening time
    if (!localStorage.getItem(LAST_OPENED_KEY)) {
      localStorage.setItem(LAST_OPENED_KEY, new Date().toISOString());
    } else {
      localStorage.setItem(LAST_OPENED_KEY, new Date().toISOString());
    }

    if (Capacitor.isNativePlatform() || 'Notification' in window) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        // Create Android Notification Channel with sound & vibration enabled
        if (Capacitor.getPlatform() === 'android') {
          await LocalNotifications.createChannel({
            id: 'workout_alerts',
            name: 'Тренування та Таймери',
            description: 'Повідомлення про закінчення відпочинку та нагадування про тренування',
            importance: 5, // High importance for vibration & sound
            visibility: 1,
            vibration: true,
            lightColor: '#3B82F6',
          });
        }
      } catch (e) {
        console.warn('LocalNotifications permission or channel creation error:', e);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Schedule immediate or timed local notification for workout/timer events (fires vibration in background)
   */
  public async scheduleTimerAlert(title: string, body: string, delaySeconds: number = 0): Promise<void> {
    try {
      await this.init();

      // Cancel previous pending timer notification if any
      await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] }).catch(() => {});

      if (delaySeconds <= 0) {
        // Immediate alert
        await LocalNotifications.schedule({
          notifications: [
            {
              id: TIMER_NOTIFICATION_ID,
              title,
              body,
              channelId: 'workout_alerts',
              schedule: { at: new Date(Date.now() + 100) },
            },
          ],
        });
      } else {
        // Delayed alert (e.g. rest timer finishing while screen is off/app minimized)
        await LocalNotifications.schedule({
          notifications: [
            {
              id: TIMER_NOTIFICATION_ID,
              title,
              body,
              channelId: 'workout_alerts',
              schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
            },
          ],
        });
      }
    } catch (e) {
      console.warn('Failed to schedule timer alert:', e);
    }
  }

  public async cancelTimerAlert(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: TIMER_NOTIFICATION_ID }] });
    } catch {
      // ignore
    }
  }

  /**
   * Schedule soft reminder notifications according to strict user specification:
   * 1. 23 hours after last workout (or 23 hours after last app open if no workouts yet)
   * 2. Skip rest days according to user's schedule (if rest day, add 24 hours)
   * 3. 3 consecutive days after reminder if still no workout (+24h, +24h, +24h)
   * 4. Then weekly reminders (1 week, 2 weeks, 3 weeks)
   * 5. Separate soft reminder for each workout block if user has > 1 block
   */
  public async scheduleWorkoutReminders(): Promise<void> {
    try {
      await this.init();

      // Cancel all existing pending reminder notifications
      const pending = await LocalNotifications.getPending();
      const reminderIds = pending.notifications
        .map((n) => n.id)
        .filter((id) => id !== TIMER_NOTIFICATION_ID && id !== WORKOUT_COMPLETE_NOTIFICATION_ID);

      if (reminderIds.length > 0) {
        await LocalNotifications.cancel({ notifications: reminderIds.map((id) => ({ id })) });
      }

      const blocks = db.getBlocks();
      if (!blocks || blocks.length === 0) return;

      const sessions = db.getSessions().filter((s) => s.isCompleted);
      const settings = db.getSettings();

      // Determine baseline timestamp: last completed workout or last app open time
      let baseTime: number;
      if (sessions.length > 0) {
        const lastSessionDate = new Date(sessions[0].date);
        baseTime = lastSessionDate.getTime();
      } else {
        const lastOpened = localStorage.getItem(LAST_OPENED_KEY);
        baseTime = lastOpened ? new Date(lastOpened).getTime() : Date.now();
      }

      // Initial target time: 23 hours after baseline
      const initialReminderTime = new Date(baseTime + 23 * 60 * 60 * 1000);

      // Helper function to check if a given date is a scheduled rest day
      const isRestDayForDate = (targetDate: Date): boolean => {
        const scheduleAnchorStr = db.getScheduleStartDate();
        const scheduleAnchor = new Date(scheduleAnchorStr);
        scheduleAnchor.setHours(0, 0, 0, 0);

        const checkDate = new Date(targetDate);
        checkDate.setHours(0, 0, 0, 0);

        const daysOn = settings.workoutDaysOn || 3;
        const daysOff = settings.workoutDaysOff || 1;
        const cycleLen = Math.max(1, daysOn + daysOff);

        const diffDays = Math.floor((checkDate.getTime() - scheduleAnchor.getTime()) / (1000 * 60 * 60 * 24));
        const cyclePos = ((diffDays % cycleLen) + cycleLen) % cycleLen;

        return cyclePos >= daysOn; // If cyclePos >= daysOn, it's a rest day!
      };

      // Adjust date if it falls on a rest day: "якщо день відпочинку, до 23 годин додаємо ще добу"
      const adjustForRestDays = (startDate: Date): Date => {
        const result = new Date(startDate);
        while (isRestDayForDate(result)) {
          result.setDate(result.getDate() + 1);
        }
        return result;
      };

      // Gentle phrasing options for soft reminders
      const softTitles = [
        'Час відновити силу ✨',
        'Коротке м’яке нагадування 🌿',
        'Твоє тренування чекає 💪',
        'Хвилинка для здоров’я 🧘‍♂️',
      ];

      const notificationsToSchedule: ScheduleOptions['notifications'] = [];
      let nextNotificationId = 1000;

      // Calculate reminder intervals:
      // Day 1 (after 23h adjusted), Day 2 (+24h), Day 3 (+24h), then Day 10 (+7d), Day 17 (+7d), Day 24 (+7d)
      const dayOffsetsInHours = [0, 24, 48, 24 + 48 + 168, 24 + 48 + 336, 24 + 48 + 504];

      const firstScheduledDate = adjustForRestDays(initialReminderTime);

      // Schedule separate soft reminder for each workout block if user has multiple blocks, or single reminder if 1 block
      blocks.forEach((block: WorkoutBlock, blockIndex: number) => {
        dayOffsetsInHours.forEach((offsetHours, stepIndex) => {
          const reminderDate = new Date(firstScheduledDate.getTime() + offsetHours * 60 * 60 * 1000);
          
          // Adjust each offset for rest days as well
          const finalDate = adjustForRestDays(reminderDate);

          // Skip scheduling if the calculated date is in the past
          if (finalDate.getTime() <= Date.now()) return;

          const title = softTitles[stepIndex % softTitles.length];
          const body = blocks.length > 1
            ? `Плавне нагадування: час для блоку «${block.name}». Зроби кілька підходів у своєму темпі!`
            : `Плавне нагадування: час для тренування. Зроби декілька підходів у зручному темпі!`;

          // Add a slight stagger (e.g. 15 minutes) between different blocks so notifications don't overlap simultaneously
          const staggeredTime = new Date(finalDate.getTime() + blockIndex * 15 * 60 * 1000);

          notificationsToSchedule.push({
            id: nextNotificationId++,
            title,
            body,
            channelId: 'workout_alerts',
            schedule: { at: staggeredTime },
          });
        });
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule,
        });
      }
    } catch (e) {
      console.warn('Failed to schedule workout reminders:', e);
    }
  }
}

export const notificationService = new NotificationService();
