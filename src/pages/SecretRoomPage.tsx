import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Heart,
  KeyRound,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  UnlockKeyhole,
} from 'lucide-react'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Reveal } from '../components/fx/Reveal'
import { cn } from '../utils'

const CODE = [0, 1, 0, 3]

const SECRET_OPTIONS = [
  {
    id: 'quiet',
    title: 'Спокойный вечер',
    text: 'Без спешки, без громких мест и без необходимости всё успевать. Просто вечер, в котором можно дышать.',
  },
  {
    id: 'adventure',
    title: 'Немного приключения',
    text: 'Странное место, неожиданный поворот и план Б, который притворяется планом А.',
  },
  {
    id: 'surprise',
    title: 'Сюрприз с планом Б',
    text: 'Пусть будет неожиданно, но с запасным выходом. Михалыч лично проверит запасной выход.',
  },
]

export function SecretRoomPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const setFlag = useGameStore((store) => store.setFlag)
  const completeScreen = useGameStore((store) => store.completeScreen)
  const setSecretChoice = useGameStore((store) => store.setSecretChoice)
  const { showToast } = useToast()
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0])
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [showHint, setShowHint] = useState(false)
  const opened = Boolean(state.flags.secretRoomOpen)

  const changeDigit = (index: number, delta: number) => {
    haptic('selection')
    setDigits((current) =>
      current.map((digit, position) =>
        position === index ? (digit + delta + 10) % 10 : digit,
      ),
    )
    setError('')
  }

  const tryOpen = () => {
    if (digits.every((digit, index) => digit === CODE[index])) {
      haptic('success')
      setFlag('secretRoomOpen', true)
      completeScreen('secret')
      setError('')
      return
    }
    const next = attempts + 1
    setAttempts(next)
    setError(
      next === 1
        ? 'Замок не поддался. Внутри кто-то тихо вздохнул.'
        : next === 2
          ? 'Почти. На печати ведь было написано время. То самое.'
          : 'Замок терпелив, но архив — нет. Подсказка открыта ниже.',
    )
    if (next >= 3) setShowHint(true)
    haptic('error')
  }

  const choose = (id: string) => {
    haptic('success')
    setSecretChoice(id)
    showToast('Выбор сохранён в личной папке. Его увидит только архив и один человек.', 'secret')
  }

  if (!opened) {
    return (
      <div>
        <PageHeader
          chapter="09"
          eyebrow="доступ подтверждён · комната 01:03"
          title="Комната 01:03"
          description="Вы собрали улики, нашли P.S. и печать. За одной из стен архива есть дверь, которой нет на плане. На двери — кодовый замок."
          right={<Stamp tone="gold" rotate={4}>секретно</Stamp>}
        />

        <div className="grid gap-4 md:grid-cols-[1fr_230px]">
          <Panel variant="dark" label="кодовый замок · 4 цифры" className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[var(--fg-muted)]">
                печать на доске или папка в архиве
                <br />
                <span className="text-[var(--accent)]">подсказка была на виду</span>
              </p>
              <LockKeyhole className="size-6 text-[var(--gold)]/60" />
            </div>

            <motion.div
              key={error}
              animate={error ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
              className="mt-5 grid grid-cols-4 gap-2"
            >
              {digits.map((digit, index) => (
                <div key={index} className="border border-[var(--line-strong)] bg-[var(--bg)]/60">
                  <button
                    type="button"
                    onClick={() => changeDigit(index, 1)}
                    className="flex w-full items-center justify-center border-b border-[var(--line)] py-2 text-[var(--fg-muted)] hover:text-[var(--accent)]"
                    aria-label={`Увеличить цифру ${index + 1}`}
                  >
                    <Plus className="size-4" />
                  </button>
                  <p className="py-3 text-center font-display text-2xl text-[var(--accent)]">{digit}</p>
                  <button
                    type="button"
                    onClick={() => changeDigit(index, -1)}
                    className="flex w-full items-center justify-center border-t border-[var(--line)] py-2 text-[var(--fg-muted)] hover:text-[var(--accent)]"
                    aria-label={`Уменьшить цифру ${index + 1}`}
                  >
                    <Minus className="size-4" />
                  </button>
                </div>
              ))}
            </motion.div>

            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--fg-muted)]">
              · · : · ·
            </p>

            {error ? (
              <p className="mt-3 border-l border-[var(--stamp)]/60 pl-2 text-[11px] leading-relaxed text-[var(--stamp)]">
                {error}
              </p>
            ) : null}

            <Button full className="mt-4" onClick={tryOpen} icon={<KeyRound className="size-4" />}>
              Проверить код
            </Button>

            {showHint ? (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="mt-3 w-full border border-dashed border-[var(--line-strong)] px-3 py-2 text-left font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[var(--gold)]"
              >
                подсказка: четыре цифры — это время. 00:00 не подходит. 01:03 — очень даже.
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="mt-3 w-full text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60 underline decoration-current/30 underline-offset-4"
              >
                нужна подсказка?
              </button>
            )}
          </Panel>

          <Panel variant="paper" label="на двери" className="p-5">
            <div className="flex flex-col items-center text-center">
              <span className="grid size-16 place-items-center rounded-full border-2 border-dashed border-[#171410]/30 text-[#171410]/60">
                <UnlockKeyhole className="size-7" />
              </span>
              <p className="mt-4 font-display text-lg uppercase leading-none">Не для протокола</p>
              <p className="mt-2 text-[11px] leading-relaxed opacity-65">
                Внутри нет улик. Внутри то, что не помещается в дело: личная записка, один выбор и немного тишины.
              </p>
              <Stamp tone="red" rotate={-4} className="mt-4">
                вход по печати
              </Stamp>
            </div>
          </Panel>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="gold">
            <Check className="size-3" /> улики собраны
          </Tag>
          <Tag tone="gold">
            <Sparkles className="size-3" /> P.S. найден
          </Tag>
          <Tag tone="gold">
            <ShieldCheck className="size-3" /> печать подтверждена
          </Tag>
        </div>
      </div>
    )
  }

  const choice = SECRET_OPTIONS.find((option) => option.id === state.secretChoice)

  return (
    <div>
      <PageHeader
        chapter="09"
        eyebrow="доступ подтверждён · дверь открыта"
        title="Комната 01:03"
        description="Здесь нет ничего официального. Только записка, один вопрос и выбор, который останется между вами и архивом."
        right={<Stamp tone="acid" rotate={-3}>открыто</Stamp>}
      />

      <div className="grid gap-4">
        <Reveal>
          <Panel variant="paper" label="личная записка" corner={<Stamp tone="red" rotate={3}>не в дело</Stamp>} className="p-5 sm:p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50">без номера · без подписи</p>
            <h2 className="mt-3 font-display text-2xl uppercase leading-[0.95]">Если ты дошла до сюда</h2>
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed">
              <p>
                Значит, тебе было не всё равно. Спасибо. Это не проверка на прочность и не игра на счёт. Просто
                расследование, которое я придумал, чтобы сказать одну простую вещь.
              </p>
              <p>
                Мне нравится твоё любопытство. Мне нравится, что ты открываешь чужие папки, задаёшь неудобные
                вопросы и не делаешь вид, что всё нормально, когда всё странно. Мне нравится, что ты здесь.
              </p>
              <p className="font-semibold">
                Дальше будет конверт. В нём — три ответа. Все три — нормальные. Ни один не расстроит архив и
                уж точно не обидит меня.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#171410]/15 pt-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-50">01:03 · конец записки</span>
              <Heart className="size-4 text-[#9b3220]" />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.06}>
          <Panel variant="dark" label="один выбор · необязательно" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg uppercase leading-none">Что для тебя важно?</h2>
                <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                  Это не тест и не обещание. Просто маяк для того, кто будет собирать вечер. Можно выбрать одно, можно
                  ничего — на финальный ответ это не влияет.
                </p>
              </div>
              {choice ? <Tag tone="gold">сохранено</Tag> : null}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {SECRET_OPTIONS.map((option) => {
                const active = state.secretChoice === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => choose(option.id)}
                    className={cn(
                      'border p-3 text-left transition-colors',
                      active
                        ? 'border-[var(--gold)] bg-[var(--gold)]/[0.07]'
                        : 'border-[var(--line)] hover:border-[var(--line-strong)]',
                    )}
                    aria-pressed={active}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm uppercase leading-tight">{option.title}</span>
                      {active ? <Check className="size-3.5 shrink-0 text-[var(--gold)]" /> : null}
                    </span>
                    <span className="mt-2 block text-[10px] leading-relaxed text-[var(--fg-muted)]">{option.text}</span>
                  </button>
                )
              })}
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] bg-[var(--bg-elev)]/60 p-3">
            <p className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-[var(--fg-muted)]">
              дверь останется открытой · выбор можно изменить до финального ответа
            </p>
            {state.completed.includes('planner') ? (
              <Button onClick={() => navigate('/final')} icon={<ArrowRight className="size-4" />}>
                К конверту
              </Button>
            ) : (
              <Button onClick={() => navigate('/planner')} icon={<ArrowRight className="size-4" />}>
                К планированию
              </Button>
            )}
          </div>
        </Reveal>

        <p className="border-l border-[var(--gold)]/40 pl-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[var(--gold)]/70">
          Михалыч: «Комнату нашла — молодец. Только не говори Пломбиру, что я знал, где она. У меня репутация
          консультанта, а не завхоза».
        </p>
      </div>
    </div>
  )
}
