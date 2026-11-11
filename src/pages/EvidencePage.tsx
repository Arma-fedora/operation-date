import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Eye, FileText, Fingerprint, Paperclip, Search } from 'lucide-react'
import { PUZZLE_ORDER, PUZZLES } from '../config/puzzles.config'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Dialog } from '../components/ui/Dialog'
import { Reveal } from '../components/fx/Reveal'
import { ChronologyPuzzle } from '../features/evidence/puzzles/ChronologyPuzzle'
import { PhotoPuzzle } from '../features/evidence/puzzles/PhotoPuzzle'
import { CipherPuzzle } from '../features/evidence/puzzles/CipherPuzzle'
import { MenuPuzzle } from '../features/evidence/puzzles/MenuPuzzle'
import type { PuzzleId } from '../types/game'
import { cn } from '../utils'

function PuzzleBody({ id, onSolved }: { id: PuzzleId; onSolved: () => void }) {
  if (id === 'chronology') return <ChronologyPuzzle onSolved={onSolved} />
  if (id === 'photo') return <PhotoPuzzle onSolved={onSolved} />
  if (id === 'cipher') return <CipherPuzzle onSolved={onSolved} />
  return <MenuPuzzle onSolved={onSolved} />
}

const icons: Record<PuzzleId, typeof FileText> = {
  chronology: FileText,
  photo: Eye,
  cipher: Search,
  menu: Paperclip,
}

export function EvidencePage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const completeScreen = useGameStore((store) => store.completeScreen)
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const [active, setActive] = useState<PuzzleId | null>(null)
  const [justSolved, setJustSolved] = useState<string | null>(null)

  const solvedCount = PUZZLE_ORDER.filter((id) => state.puzzles[id].solved).length
  const allSolved = solvedCount === PUZZLE_ORDER.length

  useEffect(() => {
    if (allSolved && !state.completed.includes('evidence')) {
      completeScreen('evidence')
    }
  }, [allSolved, completeScreen, state.completed])

  const activeDefinition = active ? PUZZLES[active] : null

  const revealStamp = () => {
    if (state.secrets.includes('hidden-stamp')) {
      showToast('Печать 01:03 уже в архиве. Она никуда не делась.', 'info')
      return
    }
    discoverSecret('hidden-stamp')
    haptic('success')
    showToast('Секрет: служебная печать 01:03 найдена. Она понадобится в комнате 01:03.', 'secret')
  }

  const onSolved = (definitionTitle: string) => {
    setJustSolved(definitionTitle)
    haptic('success')
    showToast(`Улика приобщена: ${definitionTitle}.`, 'success')
    window.setTimeout(() => setJustSolved(null), 2400)
  }

  const clues = useMemo(
    () =>
      PUZZLE_ORDER.map((id) => ({
        id,
        definition: PUZZLES[id],
        progress: state.puzzles[id],
      })),
    [state.puzzles],
  )

  return (
    <div>
      <PageHeader
        chapter="03"
        eyebrow="материалы дела · доступ 3/13"
        title="Доска улик"
        description="Четыре странности. Четыре загадки. Одна лишняя печать, о которой архив предпочитает молчать."
        right={
          <div className="flex flex-col items-end gap-1">
            <Stamp tone={allSolved ? 'acid' : 'red'} rotate={3}>
              {allSolved ? 'собрано' : `${solvedCount}/4`}
            </Stamp>
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">улики</span>
          </div>
        }
      />

      <div
        className="relative overflow-hidden rounded-[3px] border border-[#4a3524]/80 bg-[#241a12] p-3 shadow-[inset_0_0_90px_rgba(0,0,0,0.55)] sm:p-5"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(120,80,45,0.22), transparent 34%), radial-gradient(circle at 80% 75%, rgba(80,50,25,0.22), transparent 38%), repeating-linear-gradient(25deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 7px)',
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
          <svg className="h-full w-full" viewBox="0 0 400 500" preserveAspectRatio="none">
            <path d="M48 88 C120 160, 170 120, 218 202 S300 260, 352 410" fill="none" stroke="#b74232" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M352 110 C290 150, 330 240, 245 292" fill="none" stroke="#b74232" strokeWidth="1.2" strokeDasharray="3 3" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#d9c9a8]/60">доска №0103</span>
          <Tag className="border-[#d9c9a8]/30 text-[#d9c9a8]/70">не для печати</Tag>
        </div>

        <div className="relative mt-3 grid gap-3 sm:grid-cols-2">
          {clues.map(({ id, definition, progress }, index) => {
            const Icon = icons[id]
            const solved = progress.solved
            return (
              <Reveal key={id} delay={index * 0.05}>
                <Panel
                  variant="paper"
                  className={cn(
                    'relative flex h-full flex-col p-4 transition-transform duration-300 hover:-translate-y-0.5',
                    solved ? 'rotate-[-0.4deg]' : 'rotate-[0.5deg]',
                  )}
                >
                  <span className="absolute left-1/2 top-0 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/20 bg-[var(--stamp)] shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 place-items-center border border-[#171410]/20 bg-[#171410]/5">
                      <Icon className="size-4 opacity-70" />
                    </span>
                    {solved ? (
                      <Stamp tone="red" rotate={-4} className="px-2 py-1 text-[8px]">
                        улика
                      </Stamp>
                    ) : (
                      <span className="border border-[#171410]/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] opacity-50">
                        не открыто
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 font-display text-lg uppercase leading-[0.95]">{definition.title}</h2>
                  <p className="mt-2 flex-1 text-[11px] leading-relaxed opacity-65">
                    {solved ? definition.evidenceNote : definition.description}
                  </p>

                  {solved ? (
                    <div className="mt-3 flex items-center gap-1.5 border-t border-[#171410]/15 pt-2 font-mono text-[8px] uppercase tracking-[0.12em] opacity-55">
                      <Check className="size-3" /> приобщено к делу
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        haptic('selection')
                        setActive(id)
                      }}
                      className="mt-3 flex items-center justify-between gap-2 border-t border-[#171410]/15 pt-2 text-left font-mono text-[9px] uppercase tracking-[0.14em] transition-opacity hover:opacity-60"
                    >
                      изучать материал <ArrowRight className="size-3.5" />
                    </button>
                  )}
                </Panel>
              </Reveal>
            )
          })}
        </div>

        <div className="relative mt-4 flex items-end justify-between gap-4 border-t border-white/10 pt-3">
          <p className="max-w-[70%] font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-[#d9c9a8]/45">
            на доске есть кое-что ещё. архив не подтверждает, но и не отрицает.
          </p>
          <button
            type="button"
            onClick={revealStamp}
            aria-label="Странная печать 01:03"
            className={cn(
              'group relative shrink-0 transition-opacity',
              state.secrets.includes('hidden-stamp') ? 'opacity-90' : 'opacity-20 hover:opacity-70',
            )}
          >
            <span className="grid size-16 place-items-center rounded-full border-2 border-dashed border-[#d9c9a8]/70 font-mono text-[10px] uppercase tracking-[0.12em] text-[#d9c9a8]">
              <Fingerprint className="absolute size-8 opacity-25" />
              01:03
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {allSolved ? (
          <Panel variant="dark" className="border-[var(--accent)]/40 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--accent)]/50 text-[var(--accent)]">
                <Check className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)]">материалы собраны</p>
                <h3 className="mt-1 font-display text-lg uppercase leading-none">Архив заговорил</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--fg-muted)]">
                  Теперь ясно, куда ведёт частота. Осталось выйти на связь и не поверить первому же голосу.
                </p>
              </div>
            </div>
            <Button full className="mt-4 justify-between" onClick={() => navigate('/mikhaylych')} icon={<ArrowRight className="size-4" />}>
              <span className="flex-1 text-left">Выйти на канал 1996</span>
              <span className="font-mono text-[9px] opacity-60">связь</span>
            </Button>
          </Panel>
        ) : (
          <Panel variant="glass" className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--fg-muted)]">
                <Search className="size-4" />
              </span>
              <p className="text-[11px] leading-relaxed text-[var(--fg-muted)]">
                Открыто {solvedCount} из 4 материалов. Неправильные ответы не блокируют прохождение — можно
                пользоваться подсказками или принять помощь инспектора.
              </p>
            </div>
          </Panel>
        )}
      </div>

      <AnimatePresence>
        {justSolved ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+28px)] z-[75] mx-auto max-w-sm border border-[var(--accent)]/50 bg-[var(--bg-elev)]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <Stamp tone="acid" rotate={-3}>
                улика
              </Stamp>
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--accent)]">приобщено к делу</p>
                <p className="mt-0.5 text-[11px] text-[var(--fg)]">{justSolved}</p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog
        open={Boolean(activeDefinition)}
        onClose={() => setActive(null)}
        eyebrow="материал дела"
        title={activeDefinition?.title}
        wide
      >
        {activeDefinition && active ? (
          <PuzzleBody id={active} onSolved={() => onSolved(activeDefinition.shortTitle)} />
        ) : null}
      </Dialog>
    </div>
  )
}
