import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, LockKeyhole, MessageSquare, Radio, RefreshCw, Sparkles } from 'lucide-react'
import { MIKHAYLYCH_SECRET, MIKHAYLYCH_TIPS } from '../config/characters.config'
import { useToast } from '../app/providers/ToastProvider'
import { useSfx } from '../app/providers/AudioProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Reveal } from '../components/fx/Reveal'
import { ChannelGate } from '../features/mikhaylych/ChannelGate'
import { SecureChat } from '../features/mikhaylych/SecureChat'

export function MikhaylychPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const setFlag = useGameStore((store) => store.setFlag)
  const completeScreen = useGameStore((store) => store.completeScreen)
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const { showToast } = useToast()
  const sfx = useSfx()
  const [replay, setReplay] = useState(false)

  const completed = state.completed.includes('mikhaylych')
  const channelUnlocked = Boolean(state.flags.channelUnlocked) || completed
  const secretFound = state.secrets.includes('mikhaylych-secret')

  const unlock = () => {
    haptic('success')
    setFlag('channelUnlocked', true)
  }

  const finish = () => {
    haptic('success')
    completeScreen('mikhaylych')
    navigate('/trials')
  }

  const openSecret = () => {
    if (!secretFound) {
      discoverSecret('mikhaylych-secret')
      haptic('success')
      sfx('secret-unlock')
      showToast('P.S. открыт: все улики ведут в комнату 01:03. Пломбиру не говорите.', 'secret')
    }
  }

  if (!channelUnlocked) {
    return (
      <div>
        <PageHeader
          chapter="04"
          eyebrow="закрытая линия · 1996"
          title="Канал 1996"
          description="После четвёртой улики на частоте появился шум. Шум представился Михалычем и попросил не паниковать."
          right={
            <Stamp tone="gold" rotate={4}>
              закрыто
            </Stamp>
          }
        />
        <ChannelGate onUnlock={unlock} />
        <p className="mt-4 border-l border-[var(--line-strong)] pl-3 text-[11px] leading-relaxed text-[var(--fg-muted)]">
          Код можно найти в материалах дела. Если совсем не хочется искать — инспектор Пломбир умеет вводить коды за
          других. Он не гордится этим, но умеет.
        </p>
      </div>
    )
  }

  if (completed && !replay) {
    const quizTitle = state.trials.quizResult
    return (
      <div>
        <PageHeader
          chapter="04"
          eyebrow="канал закрыт · связь осталась"
          title="Михалыч на связи"
          description="Связь завершена, но P.S. остался. Некоторые сообщения не исчезают после прочтения."
          right={
            <Stamp tone="gold" rotate={-4}>
              связь была
            </Stamp>
          }
        />

        <div className="grid gap-4">
          <Reveal>
            <Panel variant="paper" label="три правила Михалыча" className="p-5">
              <div className="space-y-4">
                {MIKHAYLYCH_TIPS.map((tip) => (
                  <div key={tip.id} className="flex gap-3 border-b border-[#171410]/10 pb-4 last:border-0 last:pb-0">
                    <span className="font-mono text-[11px] text-[#9b3220]">{tip.number}</span>
                    <div>
                      <p className="font-display text-sm uppercase leading-tight">{tip.title}</p>
                      <p className="mt-1 text-[12px] leading-relaxed opacity-65">{tip.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-[#171410]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.16em] opacity-50">
                записано со слов абонента · проверка не проводилась
              </p>
            </Panel>
          </Reveal>

          <Reveal delay={0.06}>
            <Panel variant="dark" className={secretFound ? 'border-[var(--gold)]/40 p-4' : 'p-4'}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={
                      secretFound
                        ? 'grid size-9 shrink-0 place-items-center rounded-full border border-[var(--gold)]/60 text-[var(--gold)]'
                        : 'grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-[var(--line-strong)] text-[var(--fg-muted)]'
                    }
                  >
                    {secretFound ? <Sparkles className="size-4" /> : <MessageSquare className="size-4" />}
                  </span>
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--gold)]">
                      {secretFound ? 'P.S. в архиве' : 'одно непрочитанное'}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--fg-muted)]">
                      {secretFound
                        ? 'Все улики ведут в комнату 01:03. Пломбир считает, что комнаты не существует.'
                        : 'В канале осталось сообщение, которое Михалыч просил не показывать Пломбиру.'}
                    </p>
                    {secretFound ? (
                      <p className="mt-3 border-l-2 border-[var(--gold)]/50 pl-3 font-mono text-[11px] leading-relaxed text-[var(--gold)]">
                        {MIKHAYLYCH_SECRET}
                      </p>
                    ) : null}
                  </div>
                </div>
                {!secretFound ? (
                  <Button variant="secondary" size="sm" onClick={openSecret}>
                    Открыть
                  </Button>
                ) : null}
              </div>
            </Panel>
          </Reveal>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button full onClick={() => navigate('/trials')} icon={<ArrowRight className="size-4" />}>
              К испытаниям
            </Button>
            <Button variant="secondary" full onClick={() => setReplay(true)} icon={<RefreshCw className="size-4" />}>
              Перечитать канал
            </Button>
          </div>

          <p className="text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
            {quizTitle ? 'Михалыч уже знает, что вы справитесь.' : 'Михалыч не сомневается. Это его работа.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        chapter="04"
        eyebrow="закрытая линия · 1996"
        title={replay ? 'Перечитать канал' : 'Канал 1996'}
        description="Михалыч не любит длинных вступлений. Он любит, когда всё работает и никто не трогает его настройки."
        right={
          <Stamp tone="acid" rotate={3}>
            <Radio className="mr-1 inline size-3" /> online
          </Stamp>
        }
      />

      {replay ? (
        <div className="mb-3 flex items-center justify-between gap-3 border border-[var(--line)] bg-[var(--bg-elev)]/60 px-3 py-2">
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            <LockKeyhole className="size-3.5" /> повторное прослушивание
          </span>
          <button
            type="button"
            onClick={() => setReplay(false)}
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)]"
          >
            к сводке
          </button>
        </div>
      ) : null}

      <SecureChat onComplete={finish} />

      {completed && replay ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="acid">
            <Check className="size-3" /> этап уже засчитан
          </Tag>
          <Tag>повторное прохождение не обязательно</Tag>
        </div>
      ) : null}
    </div>
  )
}
