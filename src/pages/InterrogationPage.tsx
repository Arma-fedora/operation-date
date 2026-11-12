import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MessageSquareQuote, SkipForward } from 'lucide-react'
import { INTERROGATION } from '../config/characters.config'
import { useToast } from '../app/providers/ToastProvider'
import { useSfx } from '../app/providers/AudioProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Typewriter } from '../components/fx/Typewriter'
import { Reveal } from '../components/fx/Reveal'
import { InspectorPortrait } from '../features/interrogation/InspectorPortrait'
import { cn } from '../utils'
import type { DialogueChoice, DialogueNode } from '../types/config'

interface HistoryItem {
  id: string
  speaker: DialogueNode['speaker']
  text: string
  kind: 'line' | 'choice'
}

export function InterrogationPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const completeScreen = useGameStore((store) => store.completeScreen)
  const setFlag = useGameStore((store) => store.setFlag)
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const sfx = useSfx()

  const [active, setActive] = useState(!state.completed.includes('interrogation'))
  const [nodeId, setNodeId] = useState(INTERROGATION.start)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [skipTyping, setSkipTyping] = useState(false)
  const [finished, setFinished] = useState(false)

  const node: DialogueNode = INTERROGATION.nodes[nodeId]
  const choicesMade = history.filter((item) => item.kind === 'choice').length
  const questionNumber = Math.min(5, Math.max(1, choicesMade + 1))

  const toneSummary = useMemo(() => {
    const tone = state.flags.tone
    if (tone === 'chaos') return 'Протокол: непредсказуемо, но обаятельно.'
    if (tone === 'calm') return 'Протокол: спокойствие подозрительно, но приятно.'
    if (tone === 'curious') return 'Протокол: объект задаёт слишком хорошие вопросы.'
    return 'Протокол: объект сотрудничает. Пока.'
  }, [state.flags.tone])

  const applyChoice = (choice: DialogueChoice) => {
    haptic('selection')
    if (choice.effects) {
      Object.entries(choice.effects).forEach(([key, value]) => setFlag(key, value))
    }
    if (choice.secret) {
      discoverSecret(choice.secret)
      sfx('secret-unlock')
      showToast('Скрытая реплика: инспектор только что признался в чём-то лишнем.', 'secret')
    }
    setHistory((current) => [
      ...current,
      { id: `choice-${choice.id}-${current.length}`, speaker: 'alexandra', text: choice.text, kind: 'choice' },
    ])
    setNodeId(choice.next)
    setSkipTyping(false)
  }

  const advance = () => {
    haptic('light')
    if (node.next) {
      setHistory((current) => [
        ...current,
        { id: `line-${node.id}-${current.length}`, speaker: node.speaker, text: node.text, kind: 'line' },
      ])
      setNodeId(node.next)
      setSkipTyping(false)
      return
    }
    if (node.end) {
      setFinished(true)
    }
  }

  const complete = () => {
    haptic('success')
    completeScreen('interrogation')
    navigate('/evidence')
  }

  const restart = () => {
    setNodeId(INTERROGATION.start)
    setHistory([])
    setFinished(false)
    setSkipTyping(false)
    setActive(true)
  }

  if (!active) {
    return (
      <div>
        <PageHeader
          chapter="02"
          eyebrow="кабинет 13 · протокол"
          title="Допрос закрыт"
          description="Показания получены. Инспектор Пломбир сделал вид, что удовлетворён."
        />
        <Panel variant="paper" label="протокол допроса" className="p-5">
          <div className="flex items-start justify-between gap-4">
            <Stamp tone="red" rotate={-4}>
              подписано
            </Stamp>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-50">дело №0103</span>
          </div>
          <p className="mt-5 font-display text-xl uppercase leading-tight">{toneSummary}</p>
          <p className="mt-3 text-[13px] leading-relaxed opacity-70">
            Скрытых реплик найдено: {state.secrets.includes('inspector-wink') ? '1' : '0'}. Инспектор утверждает, что
            это не считается компроматом. Следствие утверждает, что считается.
          </p>
          <div className="mt-5 border-t border-[#171410]/15 pt-4 font-mono text-[9px] uppercase tracking-[0.16em] opacity-50">
            подпись: Пломбир · дата: 01:03
          </div>
        </Panel>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button full onClick={complete} icon={<ArrowRight className="size-4" />}>
            К доске улик
          </Button>
          <Button variant="secondary" full onClick={restart}>
            Перечитать допрос
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        chapter="02"
        eyebrow="кабинет 13 · допрос"
        title="Первый допрос"
        description="Отвечай как считаешь нужным. Инспектор всё запишет, но не всё поймёт."
        right={<Stamp tone="red" rotate={4}>допрос</Stamp>}
      />

      <div className="grid gap-4 md:grid-cols-[190px_1fr]">
        <Reveal className="hidden md:block">
          <Panel variant="dark" label="фигурант" className="overflow-hidden">
            <InspectorPortrait className="w-full" />
            <div className="border-t border-[var(--line)] p-3">
              <p className="font-display text-xs uppercase">Инспектор Пломбир</p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                стаж: 13 лет · температура: −4
              </p>
            </div>
          </Panel>
        </Reveal>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag tone="acid">вопрос {questionNumber}/5</Tag>
              {state.secrets.includes('inspector-wink') ? <Tag tone="gold">скрытая реплика</Tag> : null}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">стенограмма</span>
          </div>

          <div className="mb-3 max-h-[150px] space-y-2 overflow-y-auto border-l border-[var(--line)] pl-3 no-scrollbar">
            {history.slice(-4).map((item) => (
              <div
                key={item.id}
                className={cn(
                  'text-[11px] leading-relaxed',
                  item.kind === 'choice'
                    ? 'font-mono uppercase tracking-[0.04em] text-[var(--accent)]'
                    : 'text-[var(--fg-muted)]',
                )}
              >
                <span className="mr-2 font-mono text-[8px] uppercase opacity-50">
                  {item.speaker === 'alexandra' ? 'вы' : item.speaker === 'plombir' ? 'пломбир' : 'система'}
                </span>
                {item.text}
              </div>
            ))}
            {history.length === 0 ? (
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
                запись началась · 01:03
              </p>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              <Panel variant="paper" label="показания" corner={<MessageSquareQuote className="size-3.5 opacity-40" />} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[var(--stamp)]" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-55">Пломбир</span>
                </div>
                {skipTyping ? (
                  <p className="whitespace-pre-line text-[14px] leading-relaxed sm:text-[15px]">{node.text}</p>
                ) : (
                  <Typewriter
                    text={node.text}
                    speed={5}
                    className="text-[14px] leading-relaxed sm:text-[15px]"
                    onComplete={() => undefined}
                  />
                )}
                {!skipTyping ? (
                  <button
                    type="button"
                    onClick={() => setSkipTyping(true)}
                    className="mt-3 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] opacity-40 hover:opacity-80"
                  >
                    <SkipForward className="size-3" /> показать текст сразу
                  </button>
                ) : null}
              </Panel>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 space-y-2">
            {node.choices ? (
              node.choices.map((choice, index) => (
                <motion.button
                  key={choice.id}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + index * 0.05 }}
                  onClick={() => applyChoice(choice)}
                  className="group flex w-full items-center gap-3 border border-[var(--line)] bg-[var(--bg-elev)]/80 px-3 py-3 text-left transition-colors hover:border-[var(--accent)]/70 hover:bg-[var(--accent)]/[0.04]"
                >
                  <span className="grid size-6 shrink-0 place-items-center border border-[var(--line)] font-mono text-[9px] text-[var(--fg-muted)] group-hover:border-[var(--accent)]/50 group-hover:text-[var(--accent)]">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-[12px] leading-relaxed text-[var(--fg)]">{choice.text}</span>
                  <ArrowRight className="size-3.5 shrink-0 text-[var(--fg-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                </motion.button>
              ))
            ) : finished || node.end ? (
              <Button full size="lg" onClick={complete} icon={<ArrowRight className="size-4" />}>
                К материалам дела
              </Button>
            ) : (
              <Button full size="lg" onClick={advance} icon={<ArrowRight className="size-4" />}>
                Далее
              </Button>
            )}
          </div>

          {node.end ? (
            <p className="mt-3 text-center text-[10px] leading-relaxed text-[var(--fg-muted)]">
              Протокол можно перечитать позже. Инспектор будет делать вид, что не помнит.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
