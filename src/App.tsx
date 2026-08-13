import React, { useState, useEffect, useCallback } from 'react';
import {
  Exercise,
  WorkoutBlock,
  WorkoutSession,
  Settings,
  CalendarDayInfo,
} from './types';
import { db } from './services/db';
import { notificationService } from './services/notifications';
import { Navbar } from './components/Navbar';
import { ActiveWorkoutView } from './components/ActiveWorkoutView';
import { CalendarView } from './components/CalendarView';
import { ExerciseManagerView } from './components/ExerciseManagerView';
import { JapaneseWalkView } from './components/JapaneseWalkView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { RollbackModal } from './components/RollbackModal';
import { WelcomeModal } from './components/WelcomeModal';
import { calculateConsecutiveStreak } from './utils/streak';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'workout' | 'calendar' | 'exercises' | 'japanese_walk' | 'analytics' | 'settings'
  >('workout');

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [settings, setSettings] = useState<Settings>(db.getSettings());
  const [calendarDays, setCalendarDays] = useState<CalendarDayInfo[]>([]);

  // Rollback Alert State
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
  const [inactivityDays, setInactivityDays] = useState<number>(0);

  // Welcome Guide Modal State
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  const reloadData = useCallback(() => {
    db.init();
    const exList = db.getExercises();
    const blList = db.getBlocks();
    const seList = db.getSessions();
    const stData = db.getSettings();
    const cdData = db.getCalendarDays(30);

    setExercises(exList);
    setBlocks(blList);
    setSessions(seList);
    setSettings(stData);
    setCalendarDays(cdData);

    // Check if new user (hasn't seen welcome modal)
    const hasSeenWelcome = localStorage.getItem('grit_static_has_seen_welcome_v1');
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
    }

    // Check for long break rollback rule
    const rollbackInfo = db.checkForInactivityRollback();
    if (rollbackInfo.isEligibleForRollback) {
      setInactivityDays(rollbackInfo.daysInactive);
      setShowRollbackModal(true);
    }
  }, []);

  const handleCloseWelcomeModal = () => {
    localStorage.setItem('grit_static_has_seen_welcome_v1', 'true');
    setShowWelcomeModal(false);
  };

  useEffect(() => {
    reloadData();
    notificationService.scheduleWorkoutReminders();
  }, [reloadData]);

  // Calculate consecutive active training days
  const consecutiveStreak = calculateConsecutiveStreak(sessions);

  const exercisesMap = new Map<string, Exercise>();
  exercises.forEach((ex) => exercisesMap.set(ex.id, ex));

  const handleConfirmRollback = (steps: number) => {
    db.executeRollback(steps);
    setShowRollbackModal(false);
    reloadData();
  };

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden w-full">
      {/* Top AMOLED Header & Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streakCount={consecutiveStreak}
        vibrationEnabled={settings.vibrationEnabled}
        isWakeLockActive={settings.keepScreenOn}
        hasRollbackAlert={inactivityDays > 0}
        onTriggerRollbackModal={() => setShowRollbackModal(true)}
        onOpenHelp={() => setShowWelcomeModal(true)}
      />

      {/* Main View Container */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 w-full min-w-0">
        {activeTab === 'workout' && (
          <ActiveWorkoutView
            blocks={blocks}
            exercisesMap={exercisesMap}
            settings={settings}
            onWorkoutComplete={reloadData}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView calendarDays={calendarDays} onRefresh={reloadData} />
        )}

        {activeTab === 'exercises' && (
          <ExerciseManagerView exercises={exercises} blocks={blocks} onRefresh={reloadData} />
        )}

        {activeTab === 'japanese_walk' && (
          <JapaneseWalkView settings={settings} onLoggedWorkout={reloadData} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView sessions={sessions} exercises={exercises} />
        )}

        {activeTab === 'settings' && (
          <SettingsBackupView
            settings={settings}
            onRefresh={reloadData}
            onOpenHelp={() => setShowWelcomeModal(true)}
          />
        )}
      </main>

      {/* Welcome Onboarding Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
      />

      {/* Inactivity Rollback Modal (Section 5) */}
      <RollbackModal
        isOpen={showRollbackModal}
        daysInactive={inactivityDays}
        onConfirmRollback={handleConfirmRollback}
        onDismiss={() => setShowRollbackModal(false)}
      />
    </div>
  );
}
