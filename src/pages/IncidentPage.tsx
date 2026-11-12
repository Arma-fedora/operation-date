import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, FileWarning, Lock, Radio, ScrollText } from 'lucide-react'
import { APP_CONFIG } from '../config/app.config'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Reveal } from '../components/fx/Reveal'
import { Typewriter } from '../components/fx/Typewriter'
import { cn } from '../utils'

const redacted = [
  'В 01:03 в архиве остановились часы. Все. Одновременно.',
  'Принтер напечатал одну строку: «ОН УЖЕ ЗДЕСЬ». Бумаги в лотке не было.',
  'На столе обнаружен конверт. Внутри — приглашение. Снаружи — сургуч.',
  'Подозреваемый утверждает, что просто хотел позвать друга на свидание. Следствие пока не верит.',
]

export function IncidentPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const completeScreen = useGameStore((store) => store.completeScreen)
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [stampClicks, setStampClicks] = useState(0)

  const reveal = (index: number) => {
    if (revealed.has(index)) return
    haptic('selection')
    setRevealed((current) => new Set(current).add(index))
  }

  const onStampClick = () => {
    const next = stampClicks + 1
    setStampClicks(next)
    if (next === 3 && !state.secrets.includes('incident-stamp')) {
      discoverSecret('incident-stamp')
      showToast('Секрет: на печати не хватает одной буквы. Это не ошибка, это подпись.', 'secret')
    }
  }

  const start = () => {
    haptic('success')
    completeScreen('incident')
    navigate('/interrogation')
  }

  return (
    <div>
      <PageHeader
        chapter="01"
        eyebrow="дело №0103 · срочно"
        title="Необъяснимое происшествие"
        description="В 01:03 архив подал сигнал. Сигнал был коротким, странным и очень настойчивым."
        right={
          <motion.button
            type="button"
            onClick={onStampClick}
            initial={{ rotate: -12, scale: 0.8, opacity: 0 }}
            animate={{ rotate: -6, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            className="focus-visible:outline-none"
            aria-label="Печать срочно"
          >
            <Stamp tone="red" rotate={0} className="border-[3px] px-4 py-3 text-[11px]">
              срочно
            </Stamp>
          </motion.button>
        }
      />

      <div className="grid gap-4">
        <Reveal>
          <Panel variant="paper" label="входящий документ" corner={<Tag tone="red">01:03</Tag>} className="p-5">
            <div className="flex items-start justify-between gap-4 border-b border-[#171410]/15 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] opacity-55">архив 13 · отдел странностей</p>
                <h2 className="mt-2 font-display text-2xl uppercase leading-[0.95]">Протокол №0103</h2>
              </div>
              <div className="shrink-0 border border-[#171410]/30 px-2 py-1 text-center">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] opacity-60">листов</p>
                <p className="font-display text-xl leading-none">13</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Tag className="border-[#171410]/25 text-[#171410]/70">объект: {APP_CONFIG.heroineName}</Tag>
              <Tag className="border-[#b73d29]/50 text-[#9b3220]">статус: не в курсе</Tag>
              <Tag className="border-[#3f5510]/50 text-[#3f5510]">приоритет: свидание</Tag>
            </div>

            <div className="mt-5 space-y-3">
              {redacted.map((line, index) => (
                <button
                  key={line}
                  type="button"
                  onClick={() => reveal(index)}
                  className={cn(
                    'group block w-full border-l-2 border-[#171410]/20 pl-3 text-left transition-colors',
                    revealed.has(index) ? 'border-[var(--stamp)]/60' : 'hover:border-[#171410]/50',
                  )}
                >
                  <span
                    className={cn(
                      'block text-[13px] leading-relaxed transition-all duration-300',
                      revealed.has(index)
                        ? 'text-[#171410]'
                        : 'select-none bg-[#171410] text-transparent shadow-[inset_0_0_0_1px_#171410]',
                    )}
                  >
                    {revealed.has(index) ? line : '████ ███████████ ██ ███ ████████ █████'}
                  </span>
                  {!revealed.has(index) ? (
                    <span className="mt-1 flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.14em] opacity-45">
                      <Eye className="size-3" /> нажмите, чтобы снять гриф
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[#171410]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.18em] opacity-55">
              <span>подпись: неразборчиво</span>
              <span>{APP_CONFIG.caseTime}</span>
            </div>
          </Panel>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.08}>
            <Panel variant="dark" label="что известно" className="h-full p-4">
              <div className="space-y-3">
                {[
                  ['01:03', 'Часы остановились во всём архиве.'],
                  ['01:07', 'Принтер напечатал строку без задания.'],
                  ['01:13', 'На столе появился конверт.'],
                ].map(([time, text]) => (
                  <div key={time} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-[10px] text-[var(--accent)]">{time}</span>
                    <span className="text-[12px] leading-relaxed text-[var(--fg-muted)]">{text}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.14}>
            <Panel variant="dark" label="дело ведёт" className="h-full p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                  <ScrollText className="size-5 text-[var(--accent)]" />
                </span>
                <div>
                  <p className="font-display text-sm uppercase">Инспектор Пломбир</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                    Холоден как мороженое. Устал как архив. Подозревает всех, включая собственную лампу.
                  </p>
                  <Tag tone="acid" className="mt-2">
                    на связи
                  </Tag>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <Panel variant="glass" className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--stamp)]/40 bg-[var(--stamp)]/10">
                <FileWarning className="size-4 text-[var(--stamp)]" />
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--stamp)]">системное уведомление</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--fg-muted)]">
                  Вы — единственный человек, который может помочь. По данным архива, вы также единственный человек,
                  который ещё не в курсе. Это, вероятно, связано.
                </p>
              </div>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.22}>
          <div className="border border-[var(--line)] bg-[var(--bg-elev)]/80 p-4">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
              <Radio className="size-3.5 text-[var(--accent)]" />
              <Typewriter text="> доступ к материалам: подтверждён наполовину" speed={20} cursor={false} />
            </div>
            <Button
              full
              size="lg"
              className="mt-4 justify-between"
              onClick={start}
              icon={<Lock className="size-4" />}
            >
              <span className="flex-1 text-left">Начать расследование</span>
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-2 text-center text-[10px] text-[var(--fg-muted)]">
              Дальше — допрос. Не волнуйся, это не уголовное дело. Пока.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
