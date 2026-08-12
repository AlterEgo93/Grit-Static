import React from 'react';
import { formatDaysLabel } from '../utils/streak';
import {
  Dumbbell,
  Calendar,
  Layers,
  Footprints,
  TrendingUp,
  Settings,
  ShieldAlert,
  Sun,
  Vibrate,
  Flame,
  HelpCircle,
} from 'lucide-react';

interface Props {
  activeTab: 'workout' | 'calendar' | 'exercises' | 'japanese_walk' | 'analytics' | 'settings';
  setActiveTab: (tab: 'workout' | 'calendar' | 'exercises' | 'japanese_walk' | 'analytics' | 'settings') => void;
  streakCount: number;
  vibrationEnabled: boolean;
  isWakeLockActive: boolean;
  hasRollbackAlert?: boolean;
  onTriggerRollbackModal?: () => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  streakCount,
  vibrationEnabled,
  isWakeLockActive,
  hasRollbackAlert,
  onTriggerRollbackModal,
  onOpenHelp,
}) => {
  const navItems = [
    { id: 'workout', label: 'Тренування', icon: Dumbbell },
    { id: 'calendar', label: 'Календар', icon: Calendar },
    { id: 'exercises', label: 'Вправи', icon: Layers },
    { id: 'japanese_walk', label: 'Ходьба', icon: Footprints },
    { id: 'analytics', label: 'Графіки', icon: TrendingUp },
    { id: 'settings', label: 'Налаштування', icon: Settings },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-zinc-800">
      {/* Top Status Bar (Single row on mobile & desktop) */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between text-xs border-b border-zinc-900 gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Left: App Title & Streak */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-zinc-400 shrink-0">
          <span className="font-black tracking-tighter text-blue-500 uppercase text-[11px] sm:text-xs flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            GRIT & STATIC
          </span>

          <span className="text-zinc-800 font-mono text-[10px]">|</span>

          <span className="flex items-center gap-1 text-zinc-300 font-medium text-[11px] sm:text-xs shrink-0" title="Безперервна серія тренувань">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <strong className="text-amber-400 font-mono">{streakCount}</strong>
            <span className="text-zinc-300">{formatDaysLabel(streakCount)}</span>
          </span>
        </div>

        {/* Right: Technical Badges & Help */}
        <div className="flex items-center gap-1 sm:gap-2 text-zinc-400 shrink-0">
          {hasRollbackAlert && (
            <button
              onClick={onTriggerRollbackModal}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider animate-pulse hover:bg-amber-500/20 transition-colors shrink-0"
              title="Перерва більше 7 днів! Доступний Ролбек"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Ролбек</span>
            </button>
          )}

          {/* Screen Always On */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
              isWakeLockActive ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/50'
            }`}
            title={isWakeLockActive ? 'Екран завжди увімкнено (WakeLock)' : 'Стандартний режим екрану'}
          >
            <Sun className="w-3 h-3 shrink-0" />
            <span className="hidden md:inline">Always On</span>
          </div>

          {/* Vibration Status */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors ${
              vibrationEnabled ? 'bg-blue-950/60 text-blue-400 border border-blue-800/60' : 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/50'
            }`}
            title={vibrationEnabled ? 'Вібрація увімкнена' : 'Вібрація вимкнена'}
          >
            <Vibrate className="w-3 h-3 shrink-0" />
            <span className="hidden md:inline">{vibrationEnabled ? 'Vibro On' : 'Off'}</span>
          </div>

          {/* Help Button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors shrink-0"
              title="Інструкція та довідка про застосунок"
            >
              <HelpCircle className="w-3 h-3 shrink-0" />
              <span className="text-[10px]">Довідка</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-2">
        <nav className="flex space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
