import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Bird, Check, ClipboardCheck, Dices, LockKeyhole, Sparkles } from 'lucide-react'
import { QUIZ_RESULTS } from '../config/characters.config'
import { TRIAL_CARDS, WHEEL_OPTIONS } from '../config/trials.config'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { useSfx } from '../app/providers/AudioProvider'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Dialog } from '../components/ui/Dialog'
import { Reveal } from '../components/fx/Reveal'
import { ReactionGame } from '../features/trials/ReactionGame'
import { ReadinessQuiz } from '../features/trials/ReadinessQuiz'
import { WheelOfLeisure } from '../features/trials/WheelOfLeisure'
import { cn } from '../utils'

type TrialId = (typeof TRIAL_CARDS)[number]['id']

const icons = {
  reaction: Bird,
  quiz: ClipboardCheck,
  wheel: Dices,
}

export function TrialsPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const completeScreen = useGameStore((store) => store.completeScreen)
  const [active, setActive] = useState<TrialId | null>(null)
  const sfx = useSfx()

  const done = {
    reaction: state.trials.reactionDone,
    quiz: state.trials.quizDone,
    wheel: state.trials.wheelDone,
  }
  const doneCount = Object.values(done).filter(Boolean).length
  const allDone = doneCount === 3
  const quizResult = QUIZ_RESULTS.find((item) => item.id === state.trials.quizResult)
  const wheelResult = WHEEL_OPTIONS.find((item) => item.id === state.trials.wheelResult)

  const finish = () => {
    haptic('success')
    completeScreen('trials')
    navigate('/planner')
  }

  return (
    <div>
      <PageHeader
        chapter="05"
        eyebrow="проверка допуска · 3 этапа"
        title="Испытания"
        description="Ничего сложного. Голубь, несколько вопросов и колесо, которое не обязано быть мудрым. После этого архив выдаст допуск."
        right={
          <Stamp tone={allDone ? 'acid' : 'red'} rotate={3}>
            {allDone ? 'допуск' : `${doneCount}/3`}
          </Stamp>
        }
      />

      <div className="grid gap-4">
        {TRIAL_CARDS.map((trial, index) => {
          const Icon = icons[trial.id]
          const isDone = done[trial.id]
          return (
            <Reveal key={trial.id} delay={index * 0.05}>
              <Panel
                variant="dark"
                label={`испытание ${trial.chapter}`}
                corner={isDone ? <Tag tone="acid">засчитано</Tag> : <Tag>ожидает</Tag>}
                className={cn('p-4', isDone && 'border-[var(--accent)]/35')}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center border',
                      isDone
                        ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                        : 'border-[var(--line)] text-[var(--fg-muted)]',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg uppercase leading-none">{trial.title}</h2>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--fg-muted)]">{trial.description}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {trial.id === 'reaction' && state.trials.reactionBest > 0 ? (
                        <Tag tone="acid">лучший результат: {state.trials.reactionBest} мс</Tag>
                      ) : null}
                      {trial.id === 'reaction' && state.trials.reactionRuns > 0 ? (
                        <Tag>попыток: {state.trials.reactionRuns}</Tag>
                      ) : null}
                      {trial.id === 'quiz' && quizResult ? <Tag tone="gold">{quizResult.title}</Tag> : null}
                      {trial.id === 'wheel' && wheelResult ? <Tag tone="gold">{wheelResult.label}</Tag> : null}
                      {isDone ? (
                        <Tag tone="acid">
                          <Check className="size-3" /> {trial.doneLabel}
                        </Tag>
                      ) : null}
                    </div>

                    <Button
                      variant={isDone ? 'secondary' : 'primary'}
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        haptic('selection')
                        if (trial.id === 'reaction') sfx('pigeon-coo')
                        setActive(trial.id)
                      }}
                      icon={isDone ? <Sparkles className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                    >
                      {isDone ? 'Пройти ещё раз' : 'Начать испытание'}
                    </Button>
                  </div>
                </div>
              </Panel>
            </Reveal>
          )
        })}

        <Panel variant={allDone ? 'dark' : 'glass'} className={cn('p-4', allDone && 'border-[var(--accent)]/40')}>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-full border',
                allDone
                  ? 'border-[var(--accent)]/50 text-[var(--accent)]'
                  : 'border-[var(--line)] text-[var(--fg-muted)]',
              )}
            >
              {allDone ? <Check className="size-5" /> : <LockKeyhole className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">допуск к планированию</p>
              <h3 className="mt-1 font-display text-lg uppercase leading-none">
                {allDone ? 'Все три этапа пройдены' : `Пройдено ${doneCount} из 3`}
              </h3>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                {allDone
                  ? 'Михалыч подтвердил допуск. Инспектор Пломбир подтвердил нехотя. Карта ждёт.'
                  : 'Каждое испытание можно перепройти. Засчитывается факт прохождения, а не идеальный результат.'}
              </p>
            </div>
            {allDone ? <Stamp tone="acid" rotate={-4}>допуск</Stamp> : null}
          </div>
          <Button full size="lg" className="mt-4" disabled={!allDone} onClick={finish} icon={<ArrowRight className="size-4" />}>
            {allDone ? 'Перейти к планированию' : 'Сначала пройдите три испытания'}
          </Button>
        </Panel>
      </div>

      <Dialog
        open={active !== null}
        onClose={() => setActive(null)}
        eyebrow="испытание"
        title={TRIAL_CARDS.find((trial) => trial.id === active)?.title}
        wide
      >
        {active === 'reaction' ? <ReactionGame /> : null}
        {active === 'quiz' ? <ReadinessQuiz /> : null}
        {active === 'wheel' ? <WheelOfLeisure /> : null}
      </Dialog>
    </div>
  )
}
