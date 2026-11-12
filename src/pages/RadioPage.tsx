import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowLeft, ArrowRight, Disc3, Pause, Play, Radio, Volume1, Volume2, VolumeX } from 'lucide-react'
import { MUSIC_TRACKS } from '../config/music.config'
import { SCREEN_BY_ID } from '../config/app.config'
import { useAudio } from '../app/providers/AudioProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { Tag } from '../components/ui/Tag'
import { Reveal } from '../components/fx/Reveal'
import { cn } from '../utils'

const screenLabel = (screen: string) => SCREEN_BY_ID[screen as keyof typeof SCREEN_BY_ID]?.menuTitle ?? screen

export function RadioPage() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const audio = useAudio()
  const { diagnostics } = audio
  const completeScreen = useGameStore((store) => store.completeScreen)
  const complete = useGameStore((store) => store.completed.includes('radio'))
  const activeIndex = MUSIC_TRACKS.findIndex((track) => track.id === audio.currentTrack.id)
  const activeTrack = MUSIC_TRACKS[activeIndex] ?? MUSIC_TRACKS[0]

  const nextTrack = () => {
    const next = MUSIC_TRACKS[(activeIndex + 1) % MUSIC_TRACKS.length]
    haptic('selection')
    audio.sfx('radio-click')
    audio.selectTrack(next.id)
  }

  const prevTrack = () => {
    const prev = MUSIC_TRACKS[(activeIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length]
    haptic('selection')
    audio.sfx('radio-click')
    audio.selectTrack(prev.id)
  }

  const play = (id: string) => {
    haptic('selection')
    audio.sfx('radio-click')
    audio.selectTrack(id)
    if (!complete) completeScreen('radio')
  }

  const bars = useMemo(() => Array.from({ length: 18 }, (_, index) => 10 + ((index * 37) % 70)), [])

  return (
    <div>
      <PageHeader
        chapter="08"
        eyebrow="частота 01:03 · архивофон"
        title="Радиорубка"
        description="Пять каналов архива. Пока вы слушаете, кто-то в соседней комнате делает вид, что не подслушивает."
        right={<Tag tone={audio.enabled && !audio.muted ? 'acid' : 'default'}>эфир</Tag>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <Panel variant="dark" label="сейчас в эфире" className="overflow-hidden">
            <div className="relative p-5">
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 20%, rgba(200,243,106,0.2), transparent 45%), repeating-linear-gradient(0deg, rgba(236,228,210,0.05) 0 1px, transparent 1px 24px)',
                }}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    {audio.enabled && !audio.muted ? 'воспроизведение' : 'пауза'}
                  </p>
                  <h2 className="mt-2 font-display text-2xl uppercase leading-none">{activeTrack.title}</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    {activeTrack.artist}
                  </p>
                </div>
                <span
                  className={cn(
                    'grid size-14 shrink-0 place-items-center rounded-full border text-[var(--accent)]',
                    audio.enabled && !audio.muted
                      ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10'
                      : 'border-[var(--line)] text-[var(--fg-muted)]',
                  )}
                >
                  <Disc3 className={cn('size-7', audio.enabled && !audio.muted && !reduced && 'animate-spin [animation-duration:3.5s]')} />
                </span>
              </div>

              <div className="relative mt-5 flex h-20 items-end gap-1.5 border-y border-[var(--line)] py-3" aria-hidden="true">
                {bars.map((height, index) => (
                  <motion.span
                    key={index}
                    className="flex-1 origin-bottom rounded-t-[1px] bg-[var(--accent)]/50"
                    style={{ height: `${height}%` }}
                    animate={
                      audio.enabled && !audio.muted && !reduced
                        ? { scaleY: [0.35, 1, 0.55, 0.85, 0.35], opacity: [0.35, 0.8, 0.45, 0.7, 0.35] }
                        : { scaleY: 0.35, opacity: 0.2 }
                    }
                    transition={
                      audio.enabled && !audio.muted && !reduced
                        ? { duration: 1.4 + (index % 5) * 0.2, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.3 }
                    }
                  />
                ))}
              </div>

              <p className="relative mt-3 text-[12px] leading-relaxed text-[var(--fg-muted)]">{activeTrack.mood}</p>

              <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={prevTrack}
                  aria-label="Предыдущий трек"
                  icon={<ArrowLeft className="size-3.5" />}
                >
                  назад
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    haptic('selection')
                    audio.toggle()
                  }}
                  icon={audio.enabled && !audio.muted ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                >
                  {audio.enabled && !audio.muted ? 'Пауза' : 'Слушать'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={nextTrack}
                  aria-label="Следующий трек"
                  icon={<ArrowRight className="size-3.5" />}
                >
                  вперёд
                </Button>
                <button
                  type="button"
                  onClick={() => audio.setMuted(!audio.muted)}
                  className="ml-auto flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)] hover:text-[var(--accent)]"
                  aria-label={audio.muted ? 'Включить звук' : 'Выключить звук'}
                >
                  {audio.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  {audio.muted ? 'включить звук' : 'без звука'}
                </button>
              </div>

              <div className="relative mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3">
                <Volume1 className="size-3.5 shrink-0 text-[var(--fg-muted)]" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={audio.volume}
                  onChange={(event) => audio.setVolume(Number(event.target.value))}
                  className="range-acid h-1 w-full"
                  aria-label="Громкость"
                />
                <span className="w-7 text-right font-mono text-[9px] text-[var(--fg-muted)]">
                  {Math.round(audio.volume * 100)}
                </span>
              </div>

              <div className="mt-1 border-t border-[var(--line)] pt-1">
                <Toggle
                  checked={audio.sfxEnabled}
                  onChange={audio.setSfxEnabled}
                  label="эффекты"
                  hint="клики, улики, секреты, вскрытие конверта"
                />
              </div>

              <div className="mt-2 border-t border-[var(--line)] pt-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]/70">
                  диагностика звука
                </p>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[9px] text-[var(--fg-muted)]">
                  <dt>контекст</dt>
                  <dd className="text-right text-[var(--fg)]">{diagnostics.contextState}</dd>
                  <dt>трек</dt>
                  <dd className="text-right text-[var(--fg)]">
                    {diagnostics.currentTrackId || '—'}
                    {diagnostics.fromFile ? ' (файл)' : ' (синтез)'}
                  </dd>
                  <dt>файл</dt>
                  <dd className="text-right text-[var(--fg)]">{diagnostics.fileState}</dd>
                  <dt>байт</dt>
                  <dd className="text-right text-[var(--fg)]">
                    {diagnostics.fileBytes ? diagnostics.fileBytes.toLocaleString('ru') : '—'}
                  </dd>
                  <dt>уровень</dt>
                  <dd className="text-right text-[var(--fg)]">
                    {Number.isFinite(diagnostics.peakDb)
                      ? `${diagnostics.peakDb.toFixed(1)} дБ`
                      : 'тишина'}
                  </dd>
                </dl>
                {diagnostics.fileError ? (
                  <p className="mt-1 font-mono text-[8px] leading-relaxed text-[var(--stamp)]">
                    ошибка загрузки: {diagnostics.fileError}
                  </p>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={audio.testSound}
                  icon={<Activity className="size-3.5" />}
                >
                  проверить звук
                </Button>
              </div>
            </div>
            <div className="border-t border-[var(--line)] px-4 py-2.5 font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-[var(--fg-muted)]/60">
              {activeTrack.src
                ? `файл: ${activeTrack.src.split('/').pop()} · если файла нет — синтезированный трек`
                : 'демо-трек синтезирован в браузере · свой файл добавляется в src/config/music.config.ts'}
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.06}>
          <Panel variant="dark" label="архив каналов" className="p-2">
            <div className="divide-y divide-[var(--line)]">
              {MUSIC_TRACKS.map((track) => {
                const active = track.id === audio.currentTrack.id
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => play(track.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-2 py-3 text-left transition-colors',
                      active ? 'bg-[var(--accent)]/[0.05]' : 'hover:bg-[var(--bg)]/50',
                    )}
                    aria-pressed={active}
                  >
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center border font-mono text-[8px]',
                        active
                          ? 'border-[var(--accent)]/50 text-[var(--accent)]'
                          : 'border-[var(--line)] text-[var(--fg-muted)]',
                      )}
                    >
                      {track.id === 'archive-hum' ? <Radio className="size-3" /> : active ? <Volume2 className="size-3" /> : <Disc3 className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[12px]', active ? 'text-[var(--accent)]' : 'text-[var(--fg)]')}>
                        {track.title}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">
                        {track.screens === 'global'
                          ? 'везде'
                          : track.screens.map((screen) => screenLabel(screen)).join(' · ')}
                      </span>
                    </span>
                    {active ? <span className="size-1.5 shrink-0 rounded-full bg-[var(--accent)] animate-pulse-soft" /> : null}
                  </button>
                )
              })}
            </div>
            <p className="border-t border-[var(--line)] px-3 py-3 text-[10px] leading-relaxed text-[var(--fg-muted)]">
              Музыка включена по умолчанию только после первого нажатия — браузеры не любят самозванцев. Громкость
              и выбор трека запоминаются.
            </p>
          </Panel>
        </Reveal>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" full onClick={() => navigate(-1)} icon={<ArrowLeft className="size-4" />}>
          Назад
        </Button>
        <Button full onClick={() => navigate('/archive')} icon={<ArrowRight className="size-4" />}>
          В секретный архив
        </Button>
      </div>

      <p className="mt-4 border-l border-[var(--line-strong)] pl-3 font-mono text-[8px] uppercase leading-relaxed tracking-[0.14em] text-[var(--fg-muted)]/60">
        частота 01:03 · помехи являются частью художественного замысла
      </p>
    </div>
  )
}
