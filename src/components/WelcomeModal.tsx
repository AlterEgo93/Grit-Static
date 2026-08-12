import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Layers,
  Calendar,
  Footprints,
  TrendingUp,
  CheckCircle2,
  X,
  Zap,
  ShieldCheck,
  Play,
  HelpCircle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'features' | 'start'>('about');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D0D10] border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full my-auto space-y-6 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest block">
                Ласкаво просимо // Grit & Static
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ваш особистий тренувальний асистент
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            title="Закрити"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex bg-[#141419] p-1 rounded-2xl border border-zinc-800/80 gap-1 text-xs font-bold uppercase tracking-wider relative z-10">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Про систему</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'features'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Можливості</span>
          </button>
          <button
            onClick={() => setActiveTab('start')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'start'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>З чего почати</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="min-h-[280px] max-h-[50vh] overflow-y-auto pr-1 space-y-4 text-sm text-zinc-300 relative z-10">
          {activeTab === 'about' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  Що таке Grit & Static?
                </h3>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                  Це спеціалізований інструмент для **автоматизації лінійного прогресу** у стато-динамічних та кругових тренуваннях (планки, віджимання, присідання, виси та інтервальні сети).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="font-bold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    Авто-прогресія
                  </div>
                  <p className="text-zinc-400">
                    Додаток сам збільшує час планки (+5 сек) або кількість повторень (+1 раз) після кожної успішно завершеної сесії.
                  </p>
                </div>

                <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
                  <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Захист від виснаження
                  </div>
                  <p className="text-zinc-400">
                    Ви можете встановити **«Максимальну межу»** для будь-якої вправи (наприклад, не більше 180 сек), щоб не перевантажувати організм.
                  </p>
                </div>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/50 rounded-2xl p-3.5 text-xs text-blue-200">
                💡 **Філософія:** Головне — це не одноразовий рекорд, а щоденна стабільність. Додаток допомагає вам будувати безперервні дні тренувань поспіль!
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-3 text-xs sm:text-sm animate-in fade-in duration-150">
              <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">🏋️‍♂️ Кругові тренування з авто-таймером</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Запуск готових або власних кругових блоків. Асистент відраховує робочі інтервали, паузи між вправами, супроводжує звуковими сигналами та вібрацією.
                  </p>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">📅 Календар графіку та Ролбек</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Планування днів за схемою (напр., 3 дні тренувань / 1 відпочинку). Якщо у вас була тривала перерва (понад 7 днів), функція **«Ролбек»** відкотить навантаження для безпечного повернення.
                  </p>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">🧱 Конструктор вправ та блоків</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Створюйте свої статичні чи динамічні вправи, налаштовуйте початкові значення, крок (+), максимальну межу та збирайте їх у власні кругові комплекси.
                  </p>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">🚶‍♂️ Японська інтервальна ходьба</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Окремий таймер для оздоровчої інтервальної ходьби (чергування швидкої та помірної ходьби) з вбудованим звуковим метрономом.
                  </p>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">📊 Аналітика та бекап даних</h4>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Графіки вашого росту, історія виконаних підходів та можливість зберегти або відновити всі ваші дані у форматі JSON.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'start' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-white text-base">Як зробити перше тренування:</h3>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-white">Перейдіть на вкладку «Тренування»</strong>
                      <p className="text-zinc-400 text-xs">Там уже зібрані готові збалансовані кругові блоки.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-white">Оберіть блок і натисніть «Розпочати»</strong>
                      <p className="text-zinc-400 text-xs">Увімкніть звук або вібрацію, щоб чути підказки таймера.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-white">Виконуйте вправи та відпочивайте</strong>
                      <p className="text-zinc-400 text-xs">
                        Після завершення останнього кола додаток автоматично додасть +1 крок до ваших наступних показників!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#121217] border border-zinc-800 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-zinc-400">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Ви завжди можете відкрити цю інструкцію знову, натиснувши значок **«Довідка»** у верхньому меню застосунку.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Готово до використання</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab !== 'start' ? (
              <button
                onClick={() => {
                  if (activeTab === 'about') setActiveTab('features');
                  else if (activeTab === 'features') setActiveTab('start');
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Далі ➔
              </button>
            ) : null}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Зрозуміло, розпочати!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
