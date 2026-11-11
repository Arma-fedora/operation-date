import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { QUIZ_RESULTS, READINESS_QUIZ } from '../../config/characters.config'
import { useGameStore } from '../../store/gameStore'
import { calculateQuizResult } from '../../utils/quiz'
import { haptic } from '../../services/telegram/telegram'
import { Button } from '../../components/ui/Button'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { Stamp } from '../../components/ui/Stamp'
import { Tag } from '../../components/ui/Tag'
import { cn } from '../../utils'

export function ReadinessQuiz() {
  const trials = useGameStore((state) => state.trials)
  const setTrialResult = useGameStore((state) => state.setTrialResult)
  const [answers, setAnswers] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [resultId, setResultId] = useState<string | undefined>(trials.quizResult)
  const [reviewing, setReviewing] = useState(false)
  const result = QUIZ_RESULTS.find((item) => item.id === resultId)

  const choose = (optionId: string) => {
    const next = [...answers, optionId]
    haptic('selection')
    if (step + 1 >= READINESS_QUIZ.length) {
      const calculated = calculateQuizResult(next)
      setAnswers(next)
      setResultId(calculated.id)
      setReviewing(false)
      setTrialResult({ quizDone: true, quizResult: calculated.id })
      haptic('success')
      return
    }
    setAnswers(next)
    setStep(step + 1)
  }

  const restart = () => {
    setAnswers([])
    setStep(0)
    setReviewing(true)
    haptic('light')
  }

  if (result && !reviewing) {
    return (
      <div>
        <div className="border border-[var(--accent)]/35 bg-[var(--accent)]/[0.04] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]">допуск выдан</p>
              <h3 className="mt-2 font-display text-2xl uppercase leading-[0.95]">{result.title}</h3>
            </div>
            <Stamp tone="acid" rotate={-5}>
              {result.stamp}
            </Stamp>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--fg-muted)]">{result.description}</p>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--line)] pt-3">
            <Sparkles className="size-3.5 text-[var(--gold)]" />
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
              Пломбир записал результат, но сделал вид, что не удивлён.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          full
          className="mt-4"
          onClick={restart}
          icon={<RotateCcw className="size-4" />}
        >
          Пройти заново
        </Button>
      </div>
    )
  }

  const question = READINESS_QUIZ[step]
  const progress = Math.round((step / READINESS_QUIZ.length) * 100)

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            вопрос {step + 1} из {READINESS_QUIZ.length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--fg-muted)]">Правильных ответов нет. Есть ваши.</p>
        </div>
        <ProgressRing value={progress} size={40} stroke={3} />
      </div>

      <div className="mt-3 h-px w-full bg-[var(--line)]">
        <div
          className="h-px bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.22 }}
        >
          <h3 className="mt-5 font-display text-lg uppercase leading-tight">{question.question}</h3>
          <div className="mt-4 space-y-2">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                className={cn(
                  'group flex w-full items-center gap-3 border border-[var(--line)] bg-[var(--bg-elev)]/70 px-3 py-3 text-left transition-colors hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/[0.04]',
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center border border-[var(--line)] font-mono text-[9px] text-[var(--fg-muted)] group-hover:border-[var(--accent)]/50 group-hover:text-[var(--accent)]">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-[12px] leading-relaxed">{option.text}</span>
                <ArrowRight className="size-3.5 shrink-0 text-[var(--fg-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag tone="acid">без правильных ответов</Tag>
        <Tag>пять вопросов</Tag>
        <Tag>результат не влияет на финал</Tag>
      </div>
    </div>
  )
}
