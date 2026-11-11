import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Bird, Check, ChevronDown, LockKeyhole, MessageSquare, Send, Sparkles } from 'lucide-react'
import {
  MIKHAYLYCH_CHOICES,
  MIKHAYLYCH_MESSAGES,
  MIKHAYLYCH_OPENERS,
  MIKHAYLYCH_SECRET,
  MIKHAYLYCH_TIPS,
} from '../../config/characters.config'
import { useToast } from '../../app/providers/ToastProvider'
import { useGameStore } from '../../store/gameStore'
import { haptic } from '../../services/telegram/telegram'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { Tag } from '../../components/ui/Tag'
import { cn } from '../../utils'
import { MikhaylychPortrait } from './MikhaylychPortrait'

export function SecureChat({ onComplete }: { onComplete: () => void }) {
  const state = useGameStore()
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const [visible, setVisible] = useState(1)
  const [selected, setSelected] = useState<(typeof MIKHAYLYCH_CHOICES)[number] | null>(null)
  const [secretOpen, setSecretOpen] = useState(state.secrets.includes('mikhaylych-secret'))
  const [pigeonClicks, setPigeonClicks] = useState(0)
  const chatRef = useRef<HTMLDivElement | null>(null)

  const opener = MIKHAYLYCH_OPENERS[String(state.flags.tone)] ?? MIKHAYLYCH_OPENERS.default
  const messages = useMemo(() => [opener, ...MIKHAYLYCH_MESSAGES], [opener])
  const allVisible = visible >= messages.length
  const secretFound = state.secrets.includes('mikhaylych-secret')

  useEffect(() => {
    // Scroll only the message list. scrollIntoView would also move the page,
    // which hides the case header on small screens.
    const node = chatRef.current
    if (!node) return
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
  }, [visible, selected])

  const next = () => {
    if (visible < messages.length) {
      haptic('light')
      setVisible((value) => value + 1)
    }
  }

  const choose = (choice: (typeof MIKHAYLYCH_CHOICES)[number]) => {
    if (selected) return
    haptic('selection')
    setSelected(choice)
    setVisible(messages.length)
  }

  const openSecret = () => {
    setSecretOpen(true)
    if (!secretFound) {
      discoverSecret('mikhaylych-secret')
      haptic('success')
      showToast('Секрет: Михалыч оставил P.S. про комнату 01:03. Он просил не говорить Пломбиру.', 'secret')
    }
  }

  const clickPigeon = () => {
    const count = pigeonClicks + 1
    setPigeonClicks(count)
    if (count === 3 && !state.secrets.includes('pigeon')) {
      discoverSecret('pigeon')
      haptic('success')
      showToast('Секрет: голубь Палыч — не голубь, а внештатный сотрудник. Гонорар — крошки.', 'secret')
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[190px_1fr]">
      <Panel variant="dark" label="канал 1996" className="hidden overflow-hidden md:block">
        <div className="relative overflow-hidden">
          <MikhaylychPortrait className="w-full" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-8">
            <p className="font-display text-sm uppercase text-[var(--gold)]">Михалыч</p>
            <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
              на связи · где-то рядом
            </p>
            <Tag tone="gold" className="mt-2">
              сигнал стабилен
            </Tag>
          </div>
        </div>
        <div className="border-t border-[var(--line)] p-3">
          <button
            type="button"
            onClick={clickPigeon}
            className="flex w-full items-center gap-2 text-left font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)] transition-colors hover:text-[var(--gold)]"
            aria-label="Голубь Палыч"
          >
            <Bird className="size-3.5" />
            {state.secrets.includes('pigeon') ? 'Палыч на связи' : 'посторонний шум в канале'}
          </button>
        </div>
      </Panel>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag tone="gold">
              <LockKeyhole className="size-3" /> канал открыт
            </Tag>
            <Tag tone="acid">01:03</Tag>
          </div>
          <button
            type="button"
            onClick={clickPigeon}
            className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)] md:hidden"
            aria-label="Голубь Палыч"
          >
            <Bird className="size-3.5" /> {state.secrets.includes('pigeon') ? 'палыч' : 'шум'}
          </button>
        </div>

        <Panel variant="dark" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--accent)] animate-pulse-soft" />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                защищённая линия · сообщения не хранятся
              </span>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/50">1996</span>
          </div>

          <div ref={chatRef} className="max-h-[52vh] min-h-[280px] space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
            <div className="text-center font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--fg-muted)]/60">
              — связь установлена · 01:03 —
            </div>

            {messages.slice(0, visible).map((message, index) => (
              <motion.div
                key={`${index}-${message.slice(0, 12)}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[92%] border border-[var(--gold)]/25 bg-[var(--gold)]/[0.045] px-3 py-2.5"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--gold)]">Михалыч</span>
                  <span className="size-1 rounded-full bg-[var(--gold)]/60" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--fg-muted)]/60">
                    {index === 0 ? 'первое сообщение' : `реплика ${index}`}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--fg)]">{message}</p>
              </motion.div>
            ))}

            {visible < messages.length ? (
              <div className="flex items-center gap-2 px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                <span className="flex gap-1">
                  <span className="size-1 rounded-full bg-[var(--gold)] animate-pulse-soft" />
                  <span className="size-1 rounded-full bg-[var(--gold)] animate-pulse-soft [animation-delay:0.2s]" />
                  <span className="size-1 rounded-full bg-[var(--gold)] animate-pulse-soft [animation-delay:0.4s]" />
                </span>
                Михалыч печатает…
              </div>
            ) : null}

            {selected ? (
              <>
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-auto max-w-[88%] border border-[var(--accent)]/35 bg-[var(--accent)]/[0.06] px-3 py-2.5"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--accent)]">Вы</p>
                  <p className="mt-1 text-[12px] leading-relaxed">{selected.text}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="max-w-[92%] border border-[var(--gold)]/25 bg-[var(--gold)]/[0.045] px-3 py-2.5"
                >
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--gold)]">Михалыч</p>
                  <p className="mt-1 text-[12px] leading-relaxed">{selected.reply}</p>
                </motion.div>
              </>
            ) : null}

          </div>

          <div className="border-t border-[var(--line)] p-3">
            {!allVisible ? (
              <div className="flex gap-2">
                <Button full onClick={next} icon={<ChevronDown className="size-4" />}>
                  Следующее сообщение
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setVisible(messages.length)}>
                  всё
                </Button>
              </div>
            ) : !selected ? (
              <div className="space-y-2">
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  что ответить Михалычу?
                </p>
                {MIKHAYLYCH_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => choose(choice)}
                    className="flex w-full items-center gap-2 border border-[var(--line)] bg-[var(--bg)]/40 px-3 py-2.5 text-left text-[11px] leading-relaxed transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
                  >
                    <Send className="size-3 shrink-0 text-[var(--fg-muted)]" />
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]">
                <Check className="size-3.5" /> связь установлена. можно переходить к испытаниям.
              </p>
            )}
          </div>
        </Panel>

        <AnimatePresence>
          {selected ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
              <Panel variant="paper" label="три правила Михалыча" className="p-4">
                <div className="space-y-3">
                  {MIKHAYLYCH_TIPS.map((tip) => (
                    <div key={tip.id} className="flex gap-3 border-b border-[#171410]/10 pb-3 last:border-0 last:pb-0">
                      <span className="font-mono text-[10px] text-[#9b3220]">{tip.number}</span>
                      <div>
                        <p className="font-display text-xs uppercase">{tip.title}</p>
                        <p className="mt-1 text-[11px] leading-relaxed opacity-65">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel variant="dark" className={cn('p-4', secretFound && 'border-[var(--gold)]/40')}>
                <button
                  type="button"
                  onClick={openSecret}
                  className="flex w-full items-start gap-3 text-left"
                  aria-expanded={secretOpen}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border',
                      secretFound
                        ? 'border-[var(--gold)]/60 text-[var(--gold)]'
                        : 'border-dashed border-[var(--line-strong)] text-[var(--fg-muted)]',
                    )}
                  >
                    {secretFound ? <Sparkles className="size-4" /> : <MessageSquare className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--gold)]">
                      {secretFound ? 'P.S. найдено' : 'P.S. не отправлено'}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--fg-muted)]">
                      {secretOpen
                        ? 'Сообщение открыто. Михалыч делает вид, что не при чём.'
                        : 'В канале висит одно непрочитанное сообщение. Нажми, чтобы открыть.'}
                    </span>
                  </span>
                  <ChevronDown className={cn('size-4 shrink-0 text-[var(--fg-muted)] transition-transform', secretOpen && 'rotate-180')} />
                </button>
                {secretOpen ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 border-l-2 border-[var(--gold)]/50 pl-3 font-mono text-[11px] leading-relaxed text-[var(--gold)]"
                  >
                    {MIKHAYLYCH_SECRET}
                  </motion.p>
                ) : null}
              </Panel>

              <Button full size="lg" onClick={onComplete} icon={<ArrowRight className="size-4" />}>
                Завершить связь и перейти к испытаниям
              </Button>
              <p className="text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
                P.S. можно найти позже — но комната 01:03 без него не откроется
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
