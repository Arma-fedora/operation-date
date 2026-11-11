import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  Clock,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  Route,
  Trash2,
} from 'lucide-react'
import { DATE_CONFIG } from '../config/date.config'
import { useToast } from '../app/providers/ToastProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { formatDistance, totalRouteMeters } from '../utils'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Tag } from '../components/ui/Tag'
import { Reveal } from '../components/fx/Reveal'
import { RouteMap, SchematicMap } from '../features/planner/map/RouteMap'
import { cn } from '../utils'

const MAX_STOPS = 4

export function PlannerPage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const setPlanner = useGameStore((store) => store.setPlanner)
  const completeScreen = useGameStore((store) => store.completeScreen)
  const { showToast } = useToast()
  const [view, setView] = useState<'map' | 'schematic'>('map')

  const planner = state.planner
  const ordered = planner.orderedStops.filter((id) => DATE_CONFIG.venues.some((venue) => venue.id === id))
  const scenario = DATE_CONFIG.scenarios.find((item) => item.id === planner.scenario)
  const selectedVenues = ordered
    .map((id) => DATE_CONFIG.venues.find((venue) => venue.id === id))
    .filter((venue): venue is (typeof DATE_CONFIG.venues)[number] => Boolean(venue))
  const available = DATE_CONFIG.venues.filter((venue) => !ordered.includes(venue.id))
  const coords = selectedVenues.map((venue) => venue.coords).filter((point): point is [number, number] => Boolean(point))
  const distance = coords.length >= 2 ? totalRouteMeters(coords) : 0
  const walkMinutes = distance > 0 ? Math.max(1, Math.round(distance / 75)) : 0
  const canBuild = Boolean(scenario) && ordered.length >= 2
  const hasDemo = selectedVenues.some((venue) => venue.isDemo)
  const isComplete = state.completed.includes('planner')

  const persist = (next: string[], scenarioId = planner.scenario) => {
    setPlanner({
      selectedStops: next,
      orderedStops: next,
      scenario: scenarioId,
      routeBuilt: false,
    })
  }

  const chooseScenario = (id: string) => {
    const nextScenario = DATE_CONFIG.scenarios.find((item) => item.id === id)
    if (!nextScenario) return
    haptic('selection')
    const next = nextScenario.stops.filter((stop) => DATE_CONFIG.venues.some((venue) => venue.id === stop))
    setPlanner({
      selectedStops: next,
      orderedStops: next,
      scenario: id,
      routeBuilt: false,
    })
    showToast(`Сценарий «${nextScenario.title}» добавлен в дело. Точки можно менять местами.`, 'success')
  }

  const addStop = (id: string) => {
    if (ordered.includes(id)) return
    if (ordered.length >= MAX_STOPS) {
      showToast(`В маршруте уже ${MAX_STOPS} точки. Архив советует не превращать свидание в поход.`, 'warning')
      return
    }
    haptic('selection')
    persist([...ordered, id])
  }

  const removeStop = (id: string) => {
    haptic('light')
    persist(ordered.filter((stop) => stop !== id))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]
    haptic('light')
    persist(next)
  }

  const build = () => {
    if (!canBuild) return
    haptic('success')
    setPlanner({
      selectedStops: ordered,
      orderedStops: ordered,
      scenario: planner.scenario,
      routeBuilt: true,
    })
    completeScreen('planner')
    showToast('Маршрут утверждён. Дата и время уточняются в конверте.', 'success')
  }

  const openEnvelope = () => {
    haptic('success')
    navigate('/final')
  }

  return (
    <div>
      <PageHeader
        chapter="06"
        eyebrow="карта операции · маршрут"
        title="Планирование"
        description="Соберите вечер из двух-четырёх точек. Порядок можно менять, лишнее — убирать. Всё сохраняется на устройстве и уходит в архив вместе с финальным ответом."
        right={
          <Stamp tone={planner.routeBuilt ? 'acid' : 'red'} rotate={3}>
            {planner.routeBuilt ? 'маршрут' : ordered.length ? `${ordered.length}/4` : 'план'}
          </Stamp>
        }
      />

      <div className="grid gap-4">
        <Reveal>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
                1 · выберите сценарий
              </h2>
              {scenario ? <Tag tone="acid">{scenario.vibe}</Tag> : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {DATE_CONFIG.scenarios.map((item) => {
                const active = planner.scenario === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseScenario(item.id)}
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
                    <p className="font-display text-sm uppercase leading-tight">{item.title}</p>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--fg-muted)]">{item.description}</p>
                    <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
                      {item.stops.length} точки · {item.vibe}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
                2 · маршрут на карте
              </h2>
              <div className="flex items-center gap-1 border border-[var(--line)] p-0.5">
                <button
                  type="button"
                  onClick={() => setView('map')}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em]',
                    view === 'map' ? 'bg-[var(--accent)] text-[#0a0d0b]' : 'text-[var(--fg-muted)]',
                  )}
                  aria-pressed={view === 'map'}
                >
                  <MapIcon className="size-3" /> карта
                </button>
                <button
                  type="button"
                  onClick={() => setView('schematic')}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em]',
                    view === 'schematic' ? 'bg-[var(--accent)] text-[#0a0d0b]' : 'text-[var(--fg-muted)]',
                  )}
                  aria-pressed={view === 'schematic'}
                >
                  <Route className="size-3" /> схема
                </button>
              </div>
            </div>

            <div className="relative z-0 h-[320px] overflow-hidden border border-[var(--line-strong)] sm:h-[380px]">
              {view === 'map' ? (
                <RouteMap
                  venues={DATE_CONFIG.venues}
                  route={ordered}
                  onSelect={addStop}
                  onSchematic={() => setView('schematic')}
                />
              ) : (
                <SchematicMap venues={DATE_CONFIG.venues} route={ordered} onSelect={addStop} />
              )}
              <div className="pointer-events-none absolute left-3 top-3 z-[400] border border-[var(--line)] bg-[var(--bg)]/85 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)] backdrop-blur">
                {coords.length >= 2 ? `${formatDistance(distance)} · ~${walkMinutes} мин пешком` : 'маршрут не собран'}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[8px] uppercase leading-relaxed tracking-[0.12em] text-[var(--fg-muted)]/70">
                нажмите на точку на карте, чтобы добавить её в маршрут · максимум {MAX_STOPS}
              </p>
              {hasDemo ? <Tag tone="gold">есть демо-точки</Tag> : <Tag tone="acid">свои точки</Tag>}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel variant="dark" label="порядок остановок" corner={<Tag>{ordered.length}/4</Tag>} className="p-3">
              {selectedVenues.length ? (
                <div className="space-y-2">
                  {selectedVenues.map((venue, index) => (
                    <div key={venue.id} className="border border-[var(--line)] bg-[var(--bg)]/40 p-2.5">
                      <div className="flex items-start gap-2">
                        <span className="grid size-6 shrink-0 place-items-center bg-[var(--accent)] font-mono text-[10px] font-bold text-[#0a0d0b]">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium leading-tight text-[var(--fg)]">{venue.title}</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--fg-muted)]">
                            {venue.duration} · {venue.tags.join(' · ')}
                          </p>
                          {venue.isDemo ? (
                            <span className="mt-1 inline-block font-mono text-[7px] uppercase tracking-[0.14em] text-[var(--gold)]">
                              демо-точка
                            </span>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Поднять «${venue.title}»`}
                            disabled={index === 0}
                            onClick={() => move(index, -1)}
                            className="grid size-7 place-items-center border border-[var(--line)] text-[var(--fg-muted)] disabled:opacity-25"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Опустить «${venue.title}»`}
                            disabled={index === selectedVenues.length - 1}
                            onClick={() => move(index, 1)}
                            className="grid size-7 place-items-center border border-[var(--line)] text-[var(--fg-muted)] disabled:opacity-25"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Убрать «${venue.title}»`}
                            onClick={() => removeStop(venue.id)}
                            className="grid size-7 place-items-center border border-[var(--line)] text-[var(--stamp)]/70 hover:border-[var(--stamp)] hover:text-[var(--stamp)]"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <MapPin className="size-6 text-[var(--fg-muted)]/40" />
                  <p className="max-w-[220px] text-[11px] leading-relaxed text-[var(--fg-muted)]">
                    Выберите сценарий или добавьте точки вручную. Минимум две — иначе это не маршрут, а выход в магазин.
                  </p>
                </div>
              )}
            </Panel>

            <Panel variant="dark" label="добавить точки" className="p-3">
              {available.length ? (
                <div className="space-y-2">
                  {available.map((venue) => (
                    <button
                      key={venue.id}
                      type="button"
                      onClick={() => addStop(venue.id)}
                      className="group flex w-full items-center gap-2 border border-[var(--line)]/70 bg-[var(--bg)]/30 p-2.5 text-left transition-colors hover:border-[var(--accent)]/50"
                    >
                      <span className="grid size-6 shrink-0 place-items-center border border-[var(--line)] text-[var(--fg-muted)] group-hover:border-[var(--accent)]/50 group-hover:text-[var(--accent)]">
                        <Plus className="size-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] text-[var(--fg)]">{venue.title}</span>
                        <span className="mt-0.5 block truncate text-[9px] text-[var(--fg-muted)]">
                          {venue.tags.join(' · ')} · {venue.duration}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-[11px] text-[var(--fg-muted)]">
                  Все доступные точки уже в маршруте. Архив впечатлён.
                </p>
              )}
            </Panel>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <Panel variant="glass" className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] text-[var(--fg-muted)]">
                <Navigation className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">статус маршрута</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--fg-muted)]">
                  {planner.routeBuilt
                    ? 'Маршрут утверждён. Если передумаете — измените точки и утвердите заново.'
                    : canBuild
                      ? 'Похоже на план. Осталось утвердить его официально.'
                      : 'Нужен сценарий и минимум две точки. Остальное — детали, которые украшают вечер.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Tag tone={scenario ? 'acid' : 'default'}>
                    {scenario ? `сценарий: ${scenario.title}` : 'сценарий не выбран'}
                  </Tag>
                  <Tag>
                    <Clock className="size-3" /> {ordered.length ? `${ordered.length} остановки` : 'остановок нет'}
                  </Tag>
                  {planner.routeBuilt ? <Tag tone="gold">утверждено</Tag> : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {!planner.routeBuilt ? (
                <Button full onClick={build} disabled={!canBuild} icon={<Check className="size-4" />}>
                  {canBuild ? 'Утвердить маршрут' : 'Нужны сценарий и 2 точки'}
                </Button>
              ) : (
                <Button full onClick={openEnvelope} icon={<ArrowRight className="size-4" />}>
                  К конверту
                </Button>
              )}
              <Button
                variant="secondary"
                full
                onClick={() => navigate('/trials')}
                icon={<ArrowRight className="size-4" />}
              >
                Вернуться к испытаниям
              </Button>
            </div>

            {isComplete && !planner.routeBuilt ? (
              <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--gold)]">
                этап уже засчитан в деле, но маршрут изменён — утвердите новую версию
              </p>
            ) : null}
          </Panel>
        </Reveal>

        <p className="border-l border-[var(--line-strong)] pl-3 text-[10px] leading-relaxed text-[var(--fg-muted)]">
          {DATE_CONFIG.disclaimer}
        </p>
      </div>
    </div>
  )
}
