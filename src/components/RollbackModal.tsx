import React from 'react';
import { ShieldAlert, RotateCcw, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  daysInactive: number;
  onConfirmRollback: (steps: number) => void;
  onDismiss: () => void;
}

export const RollbackModal: React.FC<Props> = ({
  isOpen,
  daysInactive,
  onConfirmRollback,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0c0c0e] border border-amber-500/50 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] relative space-y-6">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest inline-block mb-1 border border-amber-500/20 font-mono">
              Inactivity Guard // Rollback
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Перерва {daysInactive} дн. (&gt;7 днів)
            </h2>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          За алгоритмом <strong>Grit & Static (The Brain)</strong>, тривала перерва знижує рівень адаптації м'язів. Щоб уникнути перевантаження та травм, пропонується зробити «Rollback» навантаження.
        </p>

        <div className="bg-black border border-zinc-800 p-4 rounded-xl text-xs space-y-2">
          <div className="font-bold text-amber-400 uppercase text-[10px] tracking-wider">Рекомендована дія:</div>
          <div className="text-zinc-200">
            Знизити робочу вагу/час на <strong>1 крок назад</strong> (наприклад: -5 сек / -2 повтори) для безпечного входу в ритм.
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onConfirmRollback(1)}
            className="w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            ЗРОБИТИ РОЛБЕК (РЕКОМЕНДОВАНО)
          </button>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-zinc-400 hover:text-white"
          >
            Продовжити без ролбеку
          </button>
        </div>
      </div>
    </div>
  );
};
