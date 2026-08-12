import React, { useState } from 'react';
import { CalendarDayInfo, WorkoutSession } from '../types';
import { db } from '../services/db';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Dumbbell, ShieldAlert, Zap } from 'lucide-react';

interface Props {
  calendarDays: CalendarDayInfo[];
  onRefresh: () => void;
}

export const CalendarView: React.FC<Props> = ({ calendarDays, onRefresh }) => {
  const [selectedDay, setSelectedDay] = useState<CalendarDayInfo | null>(null);

  const settings = db.getSettings();
  const daysOn = settings.workoutDaysOn || 3;
  const daysOff = settings.workoutDaysOff || 1;

  const handleShiftSchedule = (missedDateStr: string) => {
    db.shiftScheduleForMissedWorkout(missedDateStr);
    onRefresh();
    alert(`Графік тренувань ${daysOn} через ${daysOff} зсунуто вперед на +1 день.`);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Overview Banner */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20">
              Interactive Calendar // Progression Schedule
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Графік тренувань: {daysOn} {daysOn === 1 ? 'день' : daysOn < 5 ? 'дні' : 'днів'} тренувань / {daysOff} {daysOff === 1 ? 'день' : 'днів'} відпочинку
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs text-zinc-300">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">Автоматичний зсув при пропусках</span>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Заплановано
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Виконано
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            Відпочинок
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Пропущено (Зсув)
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {calendarDays.slice(0, 28).map((day) => {
            const isToday = day.date === todayStr;
            const isSelected = selectedDay?.date === day.date;

            let bgColor = 'bg-black border-zinc-800/80';
            let textColor = 'text-zinc-300';

            if (day.isCompleted) {
              bgColor = 'bg-emerald-950/20 border-emerald-500/40';
              textColor = 'text-emerald-400';
            } else if (day.isMissed) {
              bgColor = 'bg-amber-950/20 border-amber-500/40';
              textColor = 'text-amber-400';
            } else if (day.isScheduledWorkout) {
              bgColor = 'bg-blue-950/20 border-blue-500/40';
              textColor = 'text-blue-400';
            } else if (day.isRestDay) {
              bgColor = 'bg-zinc-950 border-zinc-900';
              textColor = 'text-zinc-500';
            }

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`cursor-pointer rounded-xl p-3 border transition-all duration-150 relative ${bgColor} ${
                  isToday ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''
                } ${isSelected ? 'scale-102 z-10 border-white' : 'hover:border-zinc-700'}`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-bold text-zinc-400">{day.date.slice(5)}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase font-mono">
                      Сьогодні
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold mt-2 flex items-center justify-between">
                  <span className={textColor}>
                    {day.isCompleted
                      ? 'Виконано'
                      : day.isMissed
                      ? 'Пропуск'
                      : day.isScheduledWorkout
                      ? 'Тренування'
                      : 'Відпочинок'}
                  </span>
                  {day.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>

                {day.session && (
                  <div className="text-[10px] text-zinc-400 mt-1 truncate font-mono">
                    {day.session.blockName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Modal / Drawer */}
      {selectedDay && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="bg-blue-600/10 text-blue-500 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest inline-block mb-1 border border-blue-500/20 font-mono">
                Деталі дати: {selectedDay.date}
              </span>
              <h3 className="text-lg font-bold text-white">
                {selectedDay.isCompleted
                  ? 'Успішно завершене тренування'
                  : selectedDay.isScheduledWorkout
                  ? 'Заплановане тренування'
                  : 'День відпочинку'}
              </h3>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs font-bold uppercase text-zinc-400 hover:text-white px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800"
            >
              Закрити
            </button>
          </div>

          {selectedDay.session ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Блок</span>
                  <strong className="text-white text-sm">{selectedDay.session.blockName}</strong>
                </div>

                <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Тривалість</span>
                  <strong className="text-blue-400 font-mono text-sm">
                    {Math.floor(selectedDay.session.durationSeconds / 60)} хв
                  </strong>
                </div>

                <div className="bg-black p-3.5 rounded-xl border border-zinc-800 col-span-2 sm:col-span-1">
                  <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider">Режим</span>
                  <strong className="text-amber-400 text-xs">
                    {selectedDay.session.wasFreezeDay ? 'Запобіжник (+1 коло)' : 'Звичайна прогресія'}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Зафіксовані підходи ({selectedDay.session.completedSets.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {selectedDay.session.completedSets.map((set, idx) => (
                    <div
                      key={set.id || idx}
                      className="bg-black border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="text-zinc-200 font-medium">
                        Коло {set.roundIndex}: {set.exerciseName}
                      </span>
                      <strong className="text-blue-400 font-mono">
                        {set.actualValue} {set.type === 'static' ? 'сек' : 'разів'}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedDay.isMissed ? (
            <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Пропущене тренування</span>
              </div>
              <p className="text-xs text-amber-200/80">
                За правилами Grit & Static, при пропуску навантаження НЕ збільшується.
                Ви можете зсунути графік 2 через 1 вперед, щоб зберегти ритм.
              </p>
              <button
                onClick={() => handleShiftSchedule(selectedDay.date)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                Зсунути графік на +1 день
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Для цієї дати немає зафіксованих записів.</p>
          )}
        </div>
      )}
    </div>
  );
};
