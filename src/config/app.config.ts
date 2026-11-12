import type { ScreenMeta } from '../types/config'

const env = import.meta.env

export const APP_CONFIG = {
  title: 'Операция: Свидание',
  shortTitle: 'ОПЕРАЦИЯ «СВИДАНИЕ»',
  caseNumber: '0103',
  heroineName: 'Друг',
  /** Genitive-dative form used in the letter: «Кому: Другу». */
  heroineNameDative: 'Другу',
  caseTime: '01:03',
  timezone: 'Europe/Moscow',
  demoMode: env.VITE_DEMO_MODE === 'true' || !env.VITE_SUPABASE_URL,
  supabaseUrl: env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? '',
  /** Optional allowlist of Telegram IDs. Set in an edge function secret, not here. */
  version: '1.1.0',
} as const

export const SCREENS: ScreenMeta[] = [
  {
    id: 'boot',
    path: '/',
    chapter: '00',
    title: 'Сигнал 01:03',
    menuTitle: 'Вход в архив',
    eyebrow: 'входящий сигнал',
    hidden: true,
  },
  {
    id: 'incident',
    path: '/incident',
    chapter: '01',
    title: 'Необъяснимое происшествие',
    menuTitle: 'Происшествие',
    eyebrow: 'дело №0103',
  },
  {
    id: 'interrogation',
    path: '/interrogation',
    chapter: '02',
    title: 'Первый допрос',
    menuTitle: 'Допрос',
    eyebrow: 'кабинет 13',
  },
  {
    id: 'evidence',
    path: '/evidence',
    chapter: '03',
    title: 'Доска улик',
    menuTitle: 'Доска улик',
    eyebrow: 'материалы дела',
  },
  {
    id: 'mikhaylych',
    path: '/mikhaylych',
    chapter: '04',
    title: 'Канал 1996',
    menuTitle: 'Канал 1996',
    eyebrow: 'закрытая линия',
  },
  {
    id: 'trials',
    path: '/trials',
    chapter: '05',
    title: 'Испытания',
    menuTitle: 'Испытания',
    eyebrow: 'проверка допуска',
  },
  {
    id: 'planner',
    path: '/planner',
    chapter: '06',
    title: 'Планирование',
    menuTitle: 'Планирование',
    eyebrow: 'карта операции',
  },
  {
    id: 'archive',
    path: '/archive',
    chapter: '07',
    title: 'Секретный архив',
    menuTitle: 'Архив',
    eyebrow: 'личное дело',
  },
  {
    id: 'radio',
    path: '/radio',
    chapter: '08',
    title: 'Радиорубка',
    menuTitle: 'Радиорубка',
    eyebrow: 'частота 01:03',
  },
  {
    id: 'secret',
    path: '/secret',
    chapter: '09',
    title: 'Комната 01:03',
    menuTitle: 'Комната 01:03',
    eyebrow: 'доступ подтверждён',
  },
  {
    id: 'final',
    path: '/final',
    chapter: '10',
    title: 'Конверт',
    menuTitle: 'Конверт',
    eyebrow: 'вскрытие разрешено',
  },
  {
    id: 'epilogue',
    path: '/epilogue',
    chapter: '11',
    title: 'Дело закрыто',
    menuTitle: 'Итоги',
    eyebrow: 'архивная копия',
    hidden: true,
  },
]

export const SCREEN_BY_ID = Object.fromEntries(SCREENS.map((screen) => [screen.id, screen])) as Record<
  ScreenMeta['id'],
  ScreenMeta
>

export const CORE_SCREENS = SCREENS.filter(
  (screen) => !['boot', 'archive', 'radio', 'secret', 'epilogue'].includes(screen.id),
)
