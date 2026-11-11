import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Radio, ShieldQuestion } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Panel } from '../../components/ui/Panel'
import { Stamp } from '../../components/ui/Stamp'
import { Typewriter } from '../../components/fx/Typewriter'
import { useToast } from '../../app/providers/ToastProvider'
import { haptic } from '../../services/telegram/telegram'

export function ChannelGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [hintOpen, setHintOpen] = useState(false)
  const { showToast } = useToast()

  const check = () => {
    const digits = value.replace(/\D/g, '')
    if (digits === '1996' || value.toLowerCase().includes('1996')) {
      haptic('success')
      showToast('Канал открыт. На связи кто-то очень уверенный в себе.', 'success')
      onUnlock()
      return
    }
    const next = attempts + 1
    setAttempts(next)
    setError(
      next === 1
        ? 'Частота не совпала. На том конце кто-то вздохнул.'
        : next === 2
          ? 'Канал молчит. Возможно, вы нажали не туда. Или не на того.'
          : 'Архив советует перечитать улику «Частота 1996». Там всё написано. Правда.',
    )
    haptic('error')
  }

  const acceptHelp = () => {
    haptic('success')
    showToast('Инспектор Пломбир ввёл код сам. Он утверждает, что это был план Б.', 'warning')
    onUnlock()
  }

  return (
    <div className="grid gap-4 md:grid-cols-[190px_1fr]">
      <Panel variant="dark" label="абонент" className="hidden overflow-hidden md:block">
        <div className="flex aspect-[140/160] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(199,161,92,0.12),transparent_65%)] p-4">
          <div className="grid size-20 place-items-center rounded-full border border-dashed border-[var(--gold)]/50 text-[var(--gold)]">
            <ShieldQuestion className="size-9" />
          </div>
          <p className="mt-4 font-display text-sm uppercase">Абонент скрыт</p>
          <p className="mt-1 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            личность не установлена
          </p>
        </div>
        <div className="border-t border-[var(--line)] p-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            канал: 1996 · статус: не подтверждён
          </p>
        </div>
      </Panel>

      <div className="min-w-0">
        <Panel variant="paper" className="relative overflow-hidden p-5">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #171410 0 1px, transparent 1px 5px)' }} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] opacity-50">закрытая линия · 1996</p>
                <h2 className="mt-2 font-display text-2xl uppercase leading-none">Вход по частоте</h2>
              </div>
              <Stamp tone="red" rotate={4}>
                шифр
              </Stamp>
            </div>

            <div className="mt-5 flex h-16 items-end gap-1 border-y border-[#171410]/15 py-3">
              {Array.from({ length: 34 }, (_, index) => (
                <motion.span
                  key={index}
                  className="flex-1 bg-[#171410]/50"
                  initial={{ height: 3 }}
                  animate={{ height: `${12 + ((index * 37) % 78)}%` }}
                  transition={{ duration: 0.8 + (index % 5) * 0.12, repeat: Infinity, repeatType: 'reverse' }}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] opacity-60">
              <Radio className="size-3.5" />
              <Typewriter text="> входящий вызов · требуется код доступа" speed={16} cursor={false} />
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] opacity-55">
                <KeyRound className="size-3.5" /> код канала
              </span>
              <Input
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') check()
                }}
                placeholder="Введите частоту…"
                inputMode="numeric"
                autoComplete="off"
                className="border-[#171410]/25 bg-white/25 text-center font-mono text-xl tracking-[0.28em] text-[#171410] placeholder:text-[#171410]/30 focus:border-[#171410]"
                aria-label="Код канала"
              />
            </label>

            {error ? (
              <motion.p
                key={attempts}
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: [0, -5, 5, -2, 0] }}
                className="mt-2 text-[11px] leading-relaxed text-[#9b3220]"
              >
                {error}
              </motion.p>
            ) : null}

            <Button type="button" full className="mt-4" onClick={check} icon={<Radio className="size-4" />}>
              Настроиться на канал
            </Button>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setHintOpen((open) => !open)}
                className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-50 underline decoration-current/30 underline-offset-4 hover:opacity-90"
              >
                {hintOpen ? 'скрыть подсказку' : 'нужна подсказка?'}
              </button>
              {attempts >= 3 ? (
                <button
                  type="button"
                  onClick={acceptHelp}
                  className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9b3220] underline decoration-current/30 underline-offset-4"
                >
                  пусть Пломбир введёт сам
                </button>
              ) : null}
            </div>

            {hintOpen ? (
              <div className="mt-2 border-l-2 border-[#9b3220]/40 pl-3 text-[11px] leading-relaxed opacity-65">
                В улике «Частота 1996» написано: «Расшифровка: КАНАЛ. Рядом на полях — частота 1996». Возможно,
                код — это просто число. Архив любит простые решения.
              </div>
            ) : null}
          </div>
        </Panel>

        <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/70">
          не пытайтесь угадать. архив всё видит. архив всё записывает.
        </p>
      </div>
    </div>
  )
}
