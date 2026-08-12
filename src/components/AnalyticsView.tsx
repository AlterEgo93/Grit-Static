import React, { useState } from 'react';
import { WorkoutSession, Exercise } from '../types';
import { TrendingUp, Activity, Flame, Clock, Dumbbell } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface Props {
  sessions: WorkoutSession[];
  exercises: Exercise[];
}

export const AnalyticsView: React.FC<Props> = ({ sessions, exercises }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(exercises[0]?.id || '');

  const completedSessions = sessions.filter((s) => s.isCompleted);

  // Prepare Intensity Progression Data for Selected Exercise
  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  const progressionChartData = completedSessions
    .slice()
    .reverse()
    .map((s) => {
      // Find logs for this exercise in session
      const matchingSets = s.completedSets.filter((set) => set.exerciseId === selectedExerciseId);
      const val = matchingSets.length > 0 ? matchingSets[0].actualValue : null;

      return {
        date: s.date.slice(5), // MM-DD
        value: val,
        rounds: s.roundsCompleted,
      };
    })
    .filter((item) => item.value !== null);

  // Prepare Overall Session Volume Chart Data
  const volumeChartData = completedSessions
    .slice()
    .reverse()
    .slice(-10) // last 10 workouts
    .map((s) => ({
      date: s.date.slice(5),
      durationMin: Math.round(s.durationSeconds / 60),
      setsCount: s.completedSets.length,
    }));

  const totalVolumeSets = completedSessions.reduce((acc, s) => acc + s.completedSets.length, 0);
  const totalMinutesTrained = Math.round(
    completedSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
              Analytics & Metrics // Progress
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Графіки прогресії навантаження
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs text-zinc-300">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Лінійний ріст</span>
          </div>
        </div>

        {/* High Level Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-black border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              Завершено тренувань
            </span>
            <strong className="text-2xl font-black font-mono text-blue-400">
              {completedSessions.length}
            </strong>
          </div>

          <div className="bg-black border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              Всього підходів
            </span>
            <strong className="text-2xl font-black font-mono text-emerald-400">
              {totalVolumeSets}
            </strong>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-black border border-zinc-800 p-4 rounded-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              Загальний час
            </span>
            <strong className="text-2xl font-black font-mono text-amber-400">
              {totalMinutesTrained} хв
            </strong>
          </div>
        </div>

        {/* Chart 1: Exercise Progression Line Curve */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Крива росту інтенсивності вправи</h3>
              <p className="text-xs text-zinc-400">Динаміка збільшення секунд/повторів за тренування</p>
            </div>

            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-blue-400 rounded-xl px-3 py-1.5 text-xs font-bold outline-none font-mono"
            >
              {exercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.unit === 'sec' ? 'сек' : 'разів'})
                </option>
              ))}
            </select>
          </div>

          <div className="h-64 w-full pt-4">
            {progressionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0c0e',
                      borderColor: '#3b82f6',
                      borderRadius: '12px',
                      color: '#FFF',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6, fill: '#10B981' }}
                    name={selectedExercise?.unit === 'sec' ? 'Секунди' : 'Повтори'}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Немає зафіксованих даних для цієї вправи.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Total Session Duration & Sets Volume Bar Chart */}
        <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4 mt-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Тривалість тренувань (хвилини)</h3>
            <p className="text-xs text-zinc-400">Останні 10 сеансів</p>
          </div>

          <div className="h-56 w-full pt-4">
            {volumeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0c0e',
                      borderColor: '#10B981',
                      borderRadius: '12px',
                      color: '#FFF',
                    }}
                  />
                  <Bar dataKey="durationMin" fill="#10B981" radius={[6, 6, 0, 0]} name="Хвилини" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Завершіть тренування, щоб побачити графік.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
