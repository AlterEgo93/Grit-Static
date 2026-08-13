import React from 'react';
import { Settings } from '../types';
import { db } from '../services/db';
import { notificationService } from '../services/notifications';
import { JapaneseWalkRunner } from './JapaneseWalkRunner';
import { Footprints, Zap } from 'lucide-react';

interface Props {
  settings: Settings;
  onLoggedWorkout?: () => void;
}

export const JapaneseWalkView: React.FC<Props> = ({ settings, onLoggedWorkout }) => {
  const currentEx = db.getExercises().find((e) => e.id === 'preset_japanese_walk');
  const targetCycles = currentEx?.currentValue || 3;

  const handleSaveSession = (stats: { totalDurationSec: number; completedCycles: number }) => {
    if (stats.totalDurationSec < 15) return;

    const session = {
      id: 'session_walk_' + Date.now(),
      blockId: 'block_cardio_interval',
      blockName: 'Японська ходьба',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      isCompleted: true,
      roundsCompleted: stats.completedCycles || 3,
      totalRoundsPlanned: stats.completedCycles || 3,
      durationSeconds: stats.totalDurationSec,
      wasFreezeDay: false,
      completedSets: [
        {
          id: 'set_walk_' + Date.now(),
          exerciseId: 'preset_japanese_walk',
          exerciseName: 'Японська ходьба',
          roundIndex: 1,
          type: 'interval_walk' as const,
          targetValue: stats.totalDurationSec,
          actualValue: stats.totalDurationSec,
          completedAt: new Date().toISOString(),
        },
      ],
    };

    db.logSession(session);
    notificationService.scheduleWorkoutReminders();
    if (onLoggedWorkout) onLoggedWorkout();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-500">
              <Footprints className="w-8 h-8" />
            </div>
            <div>
              <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
                Special Mode // Cardio Interval
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Японська інтервальна ходьба
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs text-zinc-300">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Вібро-метроном + Цикли</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
          Науково обґрунтована методика: <strong>5 хвилин вільна ходьба (розминка)</strong> + <strong>{targetCycles} {targetCycles === 1 ? 'цикл' : targetCycles < 5 ? 'цикли' : 'циклів'} ({targetCycles * 6} хв)</strong> інтервалів (3 хв швидка <strong>130 BPM</strong> / 3 хв звичайна <strong>95 BPM</strong> з вібро-метрономом) + <strong>5 хвилин заминка</strong>.
        </p>

        <div className="mt-6">
          <JapaneseWalkRunner
            settings={settings}
            targetCycles={targetCycles}
            fastBpm={130}
            normalBpm={95}
            intervalMinutes={3}
            warmupMinutes={5}
            cooldownMinutes={5}
            onSaveToCalendar={handleSaveSession}
            onCompleteSession={handleSaveSession}
          />
        </div>
      </div>
    </div>
  );
};
