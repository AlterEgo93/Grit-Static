import { Exercise, WorkoutBlock } from '../types';

export const INITIAL_PRESET_EXERCISES: Exercise[] = [
  {
    id: 'preset_plank',
    name: 'Планка',
    type: 'static',
    description: 'Утримуйте пряму лінію тіла від голови до п’ят. Напружуйте прес, сідниці та не прогинайте поперек.',
    targetMuscle: 'Кора / Прес',
    currentValue: 30, // Default starting duration: 30 seconds
    roundsCount: 1, // Default starting rounds: 1
    progressionStep: 5,
    maxValue: 180, // Maximum cap: 3 minutes (180s)
    unit: 'sec',
    isPreset: true,
    restAfterSeconds: 30,
    svgIconType: 'plank',
    completedWorkoutsCount: 0,
  },
  {
    id: 'preset_pushups',
    name: 'Віджимання',
    type: 'dynamic',
    description: 'Класичні віджимання від підлоги з повною амплітудою. Лікті під кутом ~45 градусів до тулуба.',
    targetMuscle: 'Груди / Трицепс',
    currentValue: 15,
    roundsCount: 1, // Default starting rounds: 1
    progressionStep: 2,
    maxValue: 50, // Maximum cap: 50 reps
    unit: 'reps',
    isPreset: true,
    restAfterSeconds: 45,
    svgIconType: 'pushup',
    completedWorkoutsCount: 0,
  },
  {
    id: 'preset_japanese_walk',
    name: 'Японська ходьба',
    type: 'interval_walk',
    description: 'Інтервальна ходьба: 5 хв розминка + цикли (3 хв швидка 130 BPM / 3 хв звичайна 95 BPM з метрономом) + 5 хв заминка.',
    targetMuscle: 'Серце / Ноги / Витривалість',
    currentValue: 3, // Initial target: 3 cycles (18 minutes of intervals + 10 min warmup/cooldown = 28 min)
    roundsCount: 1, // ALWAYS 1 set/round per workout
    progressionStep: 1, // +1 cycle every 2 completed workouts
    maxValue: 8, // Maximum cap: 8 cycles (48 min intervals + 10 min = 58 min)
    unit: 'sec',
    isPreset: true,
    restAfterSeconds: 60,
    svgIconType: 'walking',
    japaneseWalkConfig: {
      fastTempoBpm: 130,
      normalTempoBpm: 95,
      intervalMinutes: 3,
    },
    completedWorkoutsCount: 0,
  },
  {
    id: 'preset_wallsit',
    name: 'Присід у стіни',
    type: 'static',
    description: 'Спина щільно притиснута до стіни, стегна паралельні підлозі (кут 90 градусів у колінах).',
    targetMuscle: 'Квадрицепси / Сідниці',
    currentValue: 30, // Default starting duration: 30 seconds
    roundsCount: 1,
    progressionStep: 5,
    maxValue: 180, // Maximum cap: 3 minutes (180s)
    unit: 'sec',
    isPreset: true,
    restAfterSeconds: 30,
    svgIconType: 'wallsit',
    completedWorkoutsCount: 0,
  },
  {
    id: 'preset_superman',
    name: 'Поза супермена',
    type: 'static',
    description: 'Лежачи на животі, одночасно підніміть прямі руки та ноги. Утримуйте статичну напругу в спині.',
    targetMuscle: 'Спина / Поперек / Сідниці',
    currentValue: 30, // Default starting duration: 30 seconds
    roundsCount: 1,
    progressionStep: 5,
    maxValue: 120, // Maximum cap: 2 minutes (120s)
    unit: 'sec',
    isPreset: true,
    restAfterSeconds: 30,
    svgIconType: 'superman',
    completedWorkoutsCount: 0,
  },
  {
    id: 'preset_static_pushup',
    name: 'Статичне віджимання',
    type: 'static',
    description: 'Зафіксуйте нижнє положення віджимання (груди в 5 см від підлоги, лікті зігнуті під 90°).',
    targetMuscle: 'Груди / Плечі / Трицепс',
    currentValue: 20,
    roundsCount: 1,
    progressionStep: 3,
    maxValue: 90, // Maximum cap: 90 seconds
    unit: 'sec',
    isPreset: true,
    restAfterSeconds: 30,
    svgIconType: 'static_pushup',
    completedWorkoutsCount: 0,
  },
];

export const INITIAL_DEFAULT_BLOCKS: WorkoutBlock[] = [
  {
    id: 'block_full_body_circuit',
    name: 'Базове кругове тренування',
    description: 'Комплексний блок: статика + динаміка для всього тіла з індивідуальною прогресією для кожної вправи.',
    exercises: [
      { exerciseId: 'preset_plank', customStartValue: 30, customTargetRounds: 1, customProgressionStep: 5, customMaxValue: 180, customRestSeconds: 30 },
      { exerciseId: 'preset_pushups', customStartValue: 15, customTargetRounds: 1, customProgressionStep: 2, customMaxValue: 50, customRestSeconds: 45 },
      { exerciseId: 'preset_wallsit', customStartValue: 30, customTargetRounds: 1, customProgressionStep: 5, customMaxValue: 180, customRestSeconds: 30 },
      { exerciseId: 'preset_superman', customStartValue: 30, customTargetRounds: 1, customProgressionStep: 5, customMaxValue: 120, customRestSeconds: 30 },
      { exerciseId: 'preset_static_pushup', customStartValue: 20, customTargetRounds: 1, customProgressionStep: 3, customMaxValue: 90, customRestSeconds: 30 },
    ],
    roundsCount: 3,
    autoVolumeInterval: 12,
    autoVolumeEnabled: true,
    totalCompletedWorkouts: 0,
  },
  {
    id: 'block_cardio_interval',
    name: 'Японська ходьба + Кора',
    description: 'Інтервальне кардіо з метрономом + статична витривалість пресу.',
    exercises: [
      { exerciseId: 'preset_japanese_walk', customStartValue: 3, customTargetRounds: 1, customProgressionStep: 1, customMaxValue: 8 },
      { exerciseId: 'preset_plank', customStartValue: 30, customTargetRounds: 1, customProgressionStep: 5, customMaxValue: 180 },
      { exerciseId: 'preset_wallsit', customStartValue: 30, customTargetRounds: 1, customProgressionStep: 5, customMaxValue: 180 },
    ],
    roundsCount: 2,
    autoVolumeInterval: 12,
    autoVolumeEnabled: true,
    totalCompletedWorkouts: 0,
  },
];
