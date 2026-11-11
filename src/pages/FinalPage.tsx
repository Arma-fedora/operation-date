import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  FileCheck2,
  Heart,
  Info,
  MailOpen,
  MessageSquare,
  Pencil,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { APP_CONFIG } from '../config/app.config'
import { DATE_CONFIG } from '../config/date.config'
import { FINAL_CONFIG } from '../config/final.config'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { submitFinalResponse } from '../services/api/gameApi'
import { haptic } from '../services/telegram/telegram'
import { formatRuDate, maxDateISO, minDateISO } from '../utils'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { FieldShell, Input, Textarea } from '../components/ui/Field'
import { Reveal } from '../components/fx/Reveal'
import type { FinalResponseType } from '../types/game'
import { cn } from '../utils'

const deliveryLabels = {
  telegram: 'ответ доставлен в telegram',
  demo: 'ответ сохранён на устройстве',
  pending: 'ответ сохранён · уведомление в пути',
} as const

export function FinalPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const setFinalResponse = useGameStore((store) => store.setFinalResponse)
  const { showToast } = useToast()
  const existing = state.finalResponse
  const [opened, setOpened] = useState(Boolean(existing))
  const [editing, setEditing] = useState(!existing)
  const [type, setType] = useState<FinalResponseType | null>(existing?.type ?? null)
  const [date, setDate] = useState(existing?.preferredDate ?? '')
  const [time, setTime] = useState(existing?.preferredTime ?? '')
  const [message, setMessage] = useState(existing?.message ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const scenario = DATE_CONFIG.scenarios.find((item) => item.id === state.planner.scenario)
  const orderedStops = state.planner.orderedStops
  const chosenResult = existing ? FINAL_CONFIG.results[existing.type] : null
  const chosenOption = existing ? FINAL_CONFIG.options.find((option) => option.type === existing.type) : null
  const trimmed = message.trim()
  const needsDate = type === 'other_date'
  const needsMessage = type === 'discuss'
  const canSubmit =
    Boolean(type) &&
    (!needsDate || Boolean(date)) &&
    (!needsMessage || trimmed.length >= 3) &&
    trimmed.length <= 1000 &&
    !submitting

  const openEnvelope = () => {
    haptic('success')
    setOpened(true)
  }

  const selectType = (next: FinalResponseType) => {
    haptic('selection')
    setType(next)
    setError('')
  }

  const submit = async () => {
    if (!type || !canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const result = await submitFinalResponse(
        {
          type,
          preferredDate: date || undefined,
          preferredTime: time || undefined,
          message: trimmed || undefined,
          scenario: state.planner.scenario,
        },
        useGameStore.getState(),
      )
      setFinalResponse({
        type,
        preferredDate: date || undefined,
        preferredTime: time || undefined,
        message: trimmed || undefined,
        submittedAt: new Date().toISOString(),
        delivery: result.delivery,
        scenario: state.planner.scenario,
      })
      setEditing(false)
      haptic('success')
      showToast(
        result.delivery === 'telegram'
          ? 'Ответ доставлен. Архив закрывает дело.'
          : 'Ответ сохранён. Дело можно закрывать.',
        'success',
      )
    } catch (cause) {
      haptic('error')
      setError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось отправить ответ. Ответ не потерян — попробуйте ещё раз.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startEditing = () => {
    haptic('light')
    setEditing(true)
    setError('')
  }

  if (!opened) {
    return (
      <div>
        <PageHeader
          chapter="10"
          eyebrow="вскрытие разрешено · без протокола"
          title="Конверт"
          description="Он лежал здесь с самого начала. Сургучная печать, номер 0103 и очень настойчивое молчание."
          right={<Stamp tone="red" rotate={4}>лично</Stamp>}
        />

        <div className="flex min-h-[48dvh] items-center justify-center py-4">
          <motion.div
            initial={{ opacity: 0, y: 16, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: -0.5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="paper-texture relative border border-[#171410]/25 p-6 text-[var(--paper-ink)] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-[#171410]/20" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] opacity-50">{FINAL_CONFIG.letterNumber}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] opacity-60">
                    {FINAL_CONFIG.recipient}
                  </p>
                </div>
                <span className="border border-[#171410]/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] opacity-60">
                  не вскрыто
                </span>
              </div>

              <div className="mt-8 flex flex-col items-center text-center">
                <motion.button
                  type="button"
                  onClick={openEnvelope}
                  whileTap={{ scale: 0.96 }}
                  className="group relative grid size-24 place-items-center rounded-full border-2 border-[#7d2a1d]/70 bg-[#8f2f20] text-[#f2d7cc] shadow-[0_18px_40px_-18px_rgba(80,20,10,0.9)] transition-transform hover:rotate-3"
                  aria-label="Вскрыть конверт"
                >
                  <span className="absolute inset-1.5 rounded-full border border-dashed border-[#f2d7cc]/30" />
                  <span className="font-display text-lg leading-none">01:03</span>
                  <span className="absolute -bottom-2 bg-[#e7deca] px-2 font-mono text-[7px] uppercase tracking-[0.18em] text-[#7d2a1d]">
                    печать
                  </span>
                </motion.button>

                <h2 className="mt-7 font-display text-[clamp(1.7rem,7vw,2.5rem)] uppercase leading-[0.92]">
                  {FINAL_CONFIG.title}
                </h2>
                <p className="mt-3 max-w-sm text-[12px] leading-relaxed opacity-65">{FINAL_CONFIG.envelopeHint}</p>

                <button
                  type="button"
                  onClick={openEnvelope}
                  className="mt-6 flex items-center gap-2 border border-[#171410] bg-[#171410] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ece4d2] transition-opacity hover:opacity-85"
                >
                  <MailOpen className="size-4" /> {FINAL_CONFIG.envelopeLabel}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-[#171410]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.16em] opacity-50">
                <span>{FINAL_CONFIG.sender}</span>
                <span>без обратного адреса</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mx-auto mt-2 flex max-w-lg items-start gap-2 text-[10px] leading-relaxed text-[var(--fg-muted)]">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
          Внутри нет обязательств. Три ответа — все нормальные. Если передумаешь, ответ можно изменить до закрытия
          дела.
        </div>
      </div>
    )
  }

  if (existing && !editing && chosenResult) {
    return (
      <div>
        <PageHeader
          chapter="10"
          eyebrow="ответ зафиксирован · дело закрыто"
          title={chosenResult.title}
          description="Конверт вскрыт, ответ получен. Никаких повторных допросов и скорбной музыки."
          right={<Stamp tone="acid" rotate={3}>{chosenResult.stamp}</Stamp>}
        />

        <div className="grid gap-4">
          <Reveal>
            <Panel variant="paper" label="вложенный ответ" className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50">дело №0103 · решение</p>
                  <h2 className="mt-2 font-display text-2xl uppercase leading-[0.95]">{chosenOption?.label}</h2>
                </div>
                <Stamp tone="red" rotate={-4}>
                  {chosenOption?.stamp ?? 'ответ'}
                </Stamp>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed opacity-75">{chosenResult.text}</p>

              <div className="mt-5 grid gap-2 border-t border-[#171410]/15 pt-4 sm:grid-cols-2">
                <div className="border border-[#171410]/15 p-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] opacity-50">дата</p>
                  <p className="mt-1 font-display text-sm uppercase">
                    {existing.preferredDate ? formatRuDate(existing.preferredDate) : 'уточним в переписке'}
                  </p>
                </div>
                <div className="border border-[#171410]/15 p-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] opacity-50">время</p>
                  <p className="mt-1 font-display text-sm uppercase">{existing.preferredTime || 'без спешки'}</p>
                </div>
              </div>

              {existing.message ? (
                <div className="mt-3 border-l-2 border-[#9b3220]/50 pl-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] opacity-50">сообщение</p>
                  <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed opacity-75">{existing.message}</p>
                </div>
              ) : null}

              {scenario ? (
                <div className="mt-3 flex items-start gap-2 border-t border-[#171410]/15 pt-3">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#9b3220]" />
                  <p className="text-[11px] leading-relaxed opacity-65">
                    Сценарий: {scenario.title}. Точек в маршруте: {orderedStops.length}. Детали уточним, когда
                    будешь готова.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between border-t border-[#171410]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">
                <span>{deliveryLabels[existing.delivery]}</span>
                <span>{APP_CONFIG.caseTime}</span>
              </div>
            </Panel>
          </Reveal>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button full onClick={() => navigate('/epilogue')} icon={<ArrowRight className="size-4" />}>
              Открыть эпилог
            </Button>
            <Button variant="secondary" full onClick={startEditing} icon={<Pencil className="size-4" />}>
              Изменить ответ
            </Button>
          </div>

          <div className="flex items-start gap-2 border border-[var(--line)] bg-[var(--bg-elev)]/60 p-3">
            <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--gold)]" />
            <p className="text-[10px] leading-relaxed text-[var(--fg-muted)]">
              {existing.delivery === 'telegram'
                ? 'Ответ сохранён в архиве и отправлен владельцу через Telegram-бота. Никакие другие данные не передавались.'
                : existing.delivery === 'pending'
                  ? 'Ответ сохранён в архиве. Уведомление владельцу задерживается — это не влияет на сам ответ.'
                  : FINAL_CONFIG.demoNotice}
            </p>
          </div>

          <p className="text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
            {FINAL_CONFIG.privacyNote}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        chapter="10"
        eyebrow="конверт вскрыт · ответ не отправлен"
        title={existing ? 'Изменить ответ' : 'Приглашение без протокола'}
        description={
          existing
            ? 'Новый ответ заменит предыдущий в архиве. Передумать — нормально. Это не экзамен.'
            : 'Прочитай. Выбери то, что подходит именно тебе. Любой ответ будет принят без обид и повторных попыток.'
        }
        right={<Stamp tone="gold" rotate={-3}>без давления</Stamp>}
      />

      <div className="grid gap-4">
        <Reveal>
          <Panel variant="paper" label={FINAL_CONFIG.letterNumber} className="relative overflow-hidden p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full border border-[#171410]/10" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50">{FINAL_CONFIG.recipient}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] opacity-40">{FINAL_CONFIG.sender}</p>
              </div>
              <span className="shrink-0 border border-[#171410]/25 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] opacity-55">
                01:03
              </span>
            </div>

            <h2 className="mt-5 font-display text-[clamp(1.5rem,6vw,2.1rem)] uppercase leading-[0.94]">
              {FINAL_CONFIG.title}
            </h2>
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed sm:text-[14px]">
              {FINAL_CONFIG.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-[#171410]/15 pt-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-50">{FINAL_CONFIG.signature}</p>
              <Heart className="size-4 text-[#9b3220]" />
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.06}>
          <div>
            <h2 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
              выберите один ответ
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {FINAL_CONFIG.options.map((option) => {
                const active = type === option.type
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => selectType(option.type)}
                    className={cn(
                      'relative border p-3 text-left transition-colors',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)]/[0.06]'
                        : 'border-[var(--line)] bg-[var(--bg-elev)]/70 hover:border-[var(--line-strong)]',
                    )}
                    aria-pressed={active}
                  >
                    {active ? (
                      <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[#0a0d0b]">
                        <Check className="size-2.5" />
                      </span>
                    ) : null}
                    <p className="font-display text-sm uppercase leading-tight">{option.label}</p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--fg-muted)]">{option.hint}</p>
                    <span className="mt-2 inline-block font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
                      {option.stamp}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {type ? (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
            >
              <Panel variant="dark" label="детали ответа · необязательно" className="p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldShell
                    label={needsDate ? 'дата · обязательна' : 'дата · если уже знаешь'}
                    hint={
                      needsDate
                        ? 'Выбери день, который тебе удобен. Время можно уточнить позже.'
                        : FINAL_CONFIG.dateHint
                    }
                  >
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--fg-muted)]" />
                      <Input
                        type="date"
                        value={date}
                        min={minDateISO()}
                        max={maxDateISO()}
                        onChange={(event) => {
                          setDate(event.target.value)
                          setError('')
                        }}
                        className="pl-9"
                      />
                    </div>
                  </FieldShell>

                  <FieldShell label="время · если удобно" hint={FINAL_CONFIG.timeHint}>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--fg-muted)]" />
                      <Input
                        type="time"
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </FieldShell>
                </div>

                <div className="mt-3">
                  <FieldShell
                    label={needsMessage ? 'сообщение · обязательно' : 'сообщение · необязательно'}
                    counter={`${trimmed.length}/1000`}
                    error={needsMessage && trimmed.length > 0 && trimmed.length < 3 ? 'Напиши хотя бы пару слов.' : undefined}
                  >
                    <Textarea
                      value={message}
                      maxLength={1000}
                      onChange={(event) => {
                        setMessage(event.target.value)
                        setError('')
                      }}
                      placeholder={FINAL_CONFIG.messagePlaceholder}
                      rows={4}
                    />
                  </FieldShell>
                </div>

                <div className="mt-3 flex items-start gap-2 border border-[var(--line)] bg-[var(--bg)]/40 p-3">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" />
                  <p className="text-[10px] leading-relaxed text-[var(--fg-muted)]">{FINAL_CONFIG.privacyNote}</p>
                </div>

                {error ? (
                  <div className="mt-3 border border-[var(--stamp)]/40 bg-[var(--stamp)]/5 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--stamp)]">ответ не ушёл</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--fg-muted)]">{error}</p>
                  </div>
                ) : null}

                <Button
                  full
                  size="lg"
                  className="mt-4"
                  disabled={!canSubmit}
                  loading={submitting}
                  onClick={submit}
                  icon={submitting ? undefined : <Send className="size-4" />}
                >
                  {submitting ? FINAL_CONFIG.submittingLabel : FINAL_CONFIG.submitLabel}
                </Button>

                <p className="mt-2 text-center font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-[var(--fg-muted)]/60">
                  {existing ? 'новый ответ заменит предыдущий' : 'никаких обязательств · можно передумать'}
                </p>
              </Panel>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-dashed border-[var(--line-strong)] p-4 text-center"
            >
              <FileCheck2 className="mx-auto size-5 text-[var(--fg-muted)]/50" />
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                Выбери один из трёх вариантов. Если ни один не подходит — это тоже ответ, и его можно обсудить.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" full onClick={() => navigate('/planner')} icon={<ArrowRight className="size-4" />}>
            Вернуться к маршруту
          </Button>
          {existing ? (
            <Button variant="ghost" full onClick={() => setEditing(false)}>
              Оставить прежний ответ
            </Button>
          ) : (
            <Button variant="ghost" full onClick={() => navigate('/archive')} icon={<MailOpen className="size-4" />}>
              Перечитать архив
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Tag tone="acid">
            <MessageSquare className="size-3" /> ответ без давления
          </Tag>
          <Tag>любой вариант нормальный</Tag>
          <Tag tone="gold">{APP_CONFIG.demoMode ? 'демо-отправка' : 'защищённый канал'}</Tag>
        </div>
      </div>
    </div>
  )
}
