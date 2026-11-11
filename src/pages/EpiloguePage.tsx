import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArrowRight, Bird, Check, Dices, FileText, Heart, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { DATE_CONFIG } from '../config/date.config'
import { FINAL_CONFIG } from '../config/final.config'
import { QUIZ_RESULTS } from '../config/characters.config'
import { WHEEL_OPTIONS } from '../config/trials.config'
import { useGameStore } from '../store/gameStore'
import { formatRuDate } from '../utils'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Dialog } from '../components/ui/Dialog'
import { Reveal } from '../components/fx/Reveal'
import { ConfettiPaper } from '../components/fx/ConfettiPaper'

const deliveryText = {
  telegram: 'ответ доставлен через Telegram-бота',
  demo: 'ответ сохранён на этом устройстве (демо-режим)',
  pending: 'ответ сохранён в архиве, уведомление задерживается',
} as const

export function EpiloguePage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const resetGame = useGameStore((store) => store.resetGame)
  const [confirmReset, setConfirmReset] = useState(false)
  const [celebrate, setCelebrate] = useState(true)
  const response = state.finalResponse

  useEffect(() => {
    const timer = window.setTimeout(() => setCelebrate(false), 6500)
    return () => window.clearTimeout(timer)
  }, [])

  if (!response) return null

  const result = FINAL_CONFIG.results[response.type]
  const option = FINAL_CONFIG.options.find((item) => item.type === response.type)
  const scenario = DATE_CONFIG.scenarios.find((item) => item.id === state.planner.scenario)
  const stops = state.planner.orderedStops
    .map((id) => DATE_CONFIG.venues.find((venue) => venue.id === id)?.title)
    .filter((title): title is string => Boolean(title))
  const quiz = QUIZ_RESULTS.find((item) => item.id === state.trials.quizResult)
  const wheel = WHEEL_OPTIONS.find((item) => item.id === state.trials.wheelResult)
  const secretChoice = state.secretChoice

  const reset = () => {
    resetGame()
    setConfirmReset(false)
    navigate('/incident')
  }

  return (
    <div>
      <ConfettiPaper active={celebrate} pieces={32} />
      <PageHeader
        chapter="11"
        eyebrow="архивная копия · дело закрыто"
        title={result.title}
        description="Операция «Свидание» завершена. Ниже — короткая выжимка для истории. Без протоколов, явок и обязательств."
        right={<Stamp tone="acid" rotate={-4}>{result.stamp}</Stamp>}
      />

      <div className="grid gap-4">
        <Reveal>
          <Panel variant="paper" label="итоговый лист" className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50">дело №0103 · финал</p>
                <h2 className="mt-2 font-display text-2xl uppercase leading-[0.94]">
                  {option?.label ?? 'Ответ получен'}
                </h2>
              </div>
              <Heart className="size-6 shrink-0 text-[#9b3220]" />
            </div>

            <p className="mt-4 text-[13px] leading-relaxed opacity-75">{result.text}</p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['улики', `${state.evidence.length}/4`],
                ['секреты', String(state.secrets.length)],
                ['реакция', state.trials.reactionBest ? `${state.trials.reactionBest} мс` : '—'],
                ['этапы', `${state.completed.length}`],
              ].map(([label, value]) => (
                <div key={label} className="border border-[#171410]/15 p-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">{label}</p>
                  <p className="mt-1 font-display text-lg uppercase leading-none">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 border-t border-[#171410]/15 pt-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">дата</p>
                <p className="mt-1 text-[12px] leading-relaxed">
                  {response.preferredDate ? formatRuDate(response.preferredDate) : 'уточним в переписке'}
                </p>
              </div>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">время</p>
                <p className="mt-1 text-[12px] leading-relaxed">{response.preferredTime || 'без спешки'}</p>
              </div>
            </div>

            {response.message ? (
              <div className="mt-3 border-l-2 border-[#9b3220]/50 pl-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">сообщение</p>
                <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed opacity-75">{response.message}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#171410]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">
              <span className="flex items-center gap-1.5">
                <Check className="size-3" /> {deliveryText[response.delivery]}
              </span>
              <span>01:03 · конец дела</span>
            </div>
          </Panel>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.06}>
            <Panel variant="dark" label="маршрут, если пригодится" className="h-full p-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[var(--accent)]" />
                <p className="font-display text-sm uppercase">{scenario?.title ?? 'Сценарий не выбран'}</p>
              </div>
              {stops.length ? (
                <ol className="mt-3 space-y-2">
                  {stops.map((stop, index) => (
                    <li key={stop} className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center bg-[var(--accent)] font-mono text-[8px] font-bold text-[#0a0d0b]">
                        {index + 1}
                      </span>
                      {stop}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                  Маршрут остался в стадии идеи. Идеи тоже считаются.
                </p>
              )}
              {secretChoice ? (
                <p className="mt-3 border-t border-[var(--line)] pt-3 font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-[var(--gold)]">
                  личный маяк: {secretChoice === 'quiet' ? 'спокойный вечер' : secretChoice === 'adventure' ? 'немного приключения' : 'сюрприз с планом Б'}
                </p>
              ) : null}
            </Panel>
          </Reveal>

          <Reveal delay={0.1}>
            <Panel variant="dark" label="проверки и знаки" className="h-full p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Bird className="mt-0.5 size-4 shrink-0 text-[var(--gold)]" />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">реакция</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--fg)]">
                      {state.trials.reactionBest ? `${state.trials.reactionBest} мс · Палыч впечатлён` : 'Палыч уклончив'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">готовность</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--fg)]">
                      {quiz?.title ?? 'не проверялась'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Dices className="mt-0.5 size-4 shrink-0 text-[var(--gold)]" />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">колесо досуга</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--fg)]">
                      {wheel?.label ?? 'осталось в покое'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                <Tag tone="acid">
                  <Archive className="size-3" /> {state.secrets.length} секретов
                </Tag>
                <Tag>{state.evidence.length} улик</Tag>
              </div>
            </Panel>
          </Reveal>
        </div>

        <Reveal delay={0.14}>
          <div className="border border-[var(--gold)]/30 bg-[var(--gold)]/[0.04] p-4">
            <p className="border-l-2 border-[var(--gold)]/50 pl-3 font-mono text-[11px] leading-relaxed text-[var(--gold)]">
              {FINAL_CONFIG.postCredit}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button full onClick={() => navigate('/archive')} icon={<Archive className="size-4" />}>
            Заглянуть в архив
          </Button>
          <Button variant="secondary" full onClick={() => navigate('/radio')} icon={<ArrowRight className="size-4" />}>
            Оставить радио включённым
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="mx-auto flex items-center gap-1.5 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60 transition-colors hover:text-[var(--stamp)]"
        >
          <RotateCcw className="size-3" /> пройти заново
        </button>

        <p className="text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-[var(--fg-muted)]/50">
          спасибо, что дошла до конца. дело №0103 закрыто. но не навсегда.
        </p>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        eyebrow="служебное действие"
        title="Начать заново?"
        footer={
          <div className="flex gap-2">
            <Button variant="danger" full onClick={reset} icon={<RotateCcw className="size-4" />}>
              Сбросить прогресс
            </Button>
            <Button variant="secondary" full onClick={() => setConfirmReset(false)}>
              Оставить как есть
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-[var(--stamp)]" />
          <p className="text-[12px] leading-relaxed text-[var(--fg-muted)]">
            Локальный прогресс, выбор и финальный ответ на этом устройстве будут очищены. Копия ответа, уже
            сохранённая на сервере или отправленная в Telegram, останется в архиве.
          </p>
        </div>
      </Dialog>
    </div>
  )
}
