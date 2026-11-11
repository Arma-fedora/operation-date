import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import { MapPinned } from 'lucide-react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { DATE_CONFIG } from '../../../config/date.config'
import { Button } from '../../../components/ui/Button'
import type { Venue } from '../../../types/config'

type Coords = [number, number]

const venuePoints = (venue: Venue): Coords | null => (venue.coords ? [venue.coords[0], venue.coords[1]] : null)

function FitRoute({ points }: { points: Coords[] }) {
  const map = useMap()
  const key = points.map((point) => point.join(',')).join(';')

  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.setView(points[0], 14)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [42, 42], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])

  return null
}

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

export function SchematicMap({
  venues,
  route,
  onSelect,
}: {
  venues: Venue[]
  route: string[]
  onSelect?: (id: string) => void
}) {
  const available = venues.filter((venue) => venue.coords)
  const routeVenues = route
    .map((id) => available.find((venue) => venue.id === id))
    .filter((venue): venue is Venue => Boolean(venue))
  const allPoints = available.map((venue) => venue.coords as Coords)

  if (!allPoints.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--stamp)]">нет координат</p>
        <p className="max-w-xs text-[11px] leading-relaxed text-[var(--fg-muted)]">
          Добавьте точки с координатами в `src/config/date.config.ts`, чтобы увидеть схему.
        </p>
      </div>
    )
  }

  const lats = allPoints.map((point) => point[0])
  const lons = allPoints.map((point) => point[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const padLat = Math.max((maxLat - minLat) * 0.22, 0.004)
  const padLon = Math.max((maxLon - minLon) * 0.22, 0.006)

  const project = (coords: Coords) => {
    const x = ((coords[1] - (minLon - padLon)) / (maxLon - minLon + padLon * 2)) * 88 + 6
    const y = (1 - (coords[0] - (minLat - padLat)) / (maxLat - minLat + padLat * 2)) * 82 + 7
    return { x, y }
  }

  const routePoints = routeVenues
    .map((venue) => project(venue.coords as Coords))
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0d0b]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(200,243,106,0.08), transparent 45%), repeating-linear-gradient(0deg, rgba(236,228,210,0.06) 0 1px, transparent 1px 30px), repeating-linear-gradient(90deg, rgba(236,228,210,0.06) 0 1px, transparent 1px 30px)',
        }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <path d="M0 64 Q22 52 34 68 T62 70 T100 46" fill="none" stroke="rgba(199,161,92,0.2)" strokeWidth="3" />
        <path d="M8 100 Q18 72 38 60 T70 30 T100 18" fill="none" stroke="rgba(236,228,210,0.08)" strokeWidth="2" />
        {routePoints ? (
          <polyline
            points={routePoints}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="0.7"
            strokeDasharray="2 1.6"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      {available.map((venue) => {
        const point = project(venue.coords as Coords)
        const index = route.indexOf(venue.id)
        const selected = index >= 0
        return (
          <button
            key={venue.id}
            type="button"
            onClick={() => onSelect?.(venue.id)}
            disabled={!onSelect}
            className="absolute -translate-x-1/2 -translate-y-1/2 disabled:cursor-default"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            aria-label={venue.title}
            title={venue.title}
          >
            <span
              className={
                selected
                  ? 'grid size-6 place-items-center border-2 border-[#0a0d0b] bg-[var(--accent)] font-mono text-[9px] font-bold text-[#0a0d0b] shadow-[0_0_0_1px_var(--accent)]'
                  : 'block size-2.5 rounded-full border border-[var(--fg-muted)]/50 bg-[var(--bg-elev)]'
              }
            >
              {selected ? index + 1 : ''}
            </span>
          </button>
        )
      })}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--fg-muted)]/60">
        <span>схема · не для навигации</span>
        <span>{DATE_CONFIG.venues.length} точек в базе</span>
      </div>
    </div>
  )
}

export function RouteMap({
  venues,
  route,
  onSelect,
  onSchematic,
}: {
  venues: Venue[]
  route: string[]
  onSelect?: (id: string) => void
  onSchematic?: () => void
}) {
  const allPoints = venues.map(venuePoints).filter((point): point is Coords => Boolean(point))
  const routeVenues = route
    .map((id) => venues.find((venue) => venue.id === id))
    .filter((venue): venue is Venue => Boolean(venue))
  const routePoints = routeVenues.map((venue) => venue.coords as Coords)
  const fitPoints = routePoints.length >= 2 ? routePoints : allPoints
  const valid = allPoints.length >= 2

  // OpenStreetMap tiles are a third-party dependency: if they cannot be
  // reached (corporate proxy, offline, blocked network) the map would stay a
  // blank canvas. Detect that early and offer the built-in schematic.
  const [tileFailed, setTileFailed] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const loadedRef = useRef(false)
  const failureTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (failureTimer.current) window.clearTimeout(failureTimer.current)
    },
    [],
  )

  const handleTileLoad = () => {
    loadedRef.current = true
    if (failureTimer.current) {
      window.clearTimeout(failureTimer.current)
      failureTimer.current = null
    }
    if (tileFailed) setTileFailed(false)
  }

  const handleTileError = () => {
    if (loadedRef.current || failureTimer.current) return
    failureTimer.current = window.setTimeout(() => {
      failureTimer.current = null
      if (!loadedRef.current) setTileFailed(true)
    }, 4000)
  }

  const retryTiles = () => {
    if (failureTimer.current) {
      window.clearTimeout(failureTimer.current)
      failureTimer.current = null
    }
    loadedRef.current = false
    setTileFailed(false)
    setMapKey((key) => key + 1)
  }

  if (!valid) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--stamp)]">нет координат</p>
        <p className="max-w-xs text-[11px] leading-relaxed text-[var(--fg-muted)]">
          Добавьте в `src/config/date.config.ts` хотя бы две точки с координатами `[широта, долгота]`. Пока архив
          показывает схему.
        </p>
      </div>
    )
  }

  return (
    <MapBoundary
      fallback={
        <div className="flex h-full w-full flex-col">
          <SchematicMap venues={venues} route={route} onSelect={onSelect} />
          <p className="border-t border-[var(--line)] bg-[var(--bg-elev)] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--gold)]">
            карта недоступна, включена схема маршрута
          </p>
        </div>
      }
    >
      <MapContainer
        key={mapKey}
        center={DATE_CONFIG.mapCenter}
        zoom={DATE_CONFIG.zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          eventHandlers={{ tileload: handleTileLoad, tileerror: handleTileError }}
        />
        <FitRoute points={fitPoints} />

        {venues.map((venue) => {
          const coords = venuePoints(venue)
          if (!coords) return null
          const index = route.indexOf(venue.id)
          const selected = index >= 0
          return (
            <CircleMarker
              key={venue.id}
              center={coords}
              radius={selected ? 10 : 5}
              pathOptions={{
                color: selected ? '#0a0d0b' : 'rgba(236,228,210,0.5)',
                weight: selected ? 2 : 1,
                fillColor: selected ? '#c8f36a' : '#5d665d',
                fillOpacity: selected ? 1 : 0.7,
              }}
              eventHandlers={{
                click: () => onSelect?.(venue.id),
              }}
            >
              {selected ? (
                <Tooltip permanent direction="top" offset={[0, -8]} opacity={1} className="route-tooltip">
                  {index + 1}
                </Tooltip>
              ) : (
                <Tooltip direction="top" offset={[0, -8]} opacity={1} className="route-tooltip route-tooltip--muted">
                  {venue.title}
                </Tooltip>
              )}
            </CircleMarker>
          )
        })}

        {routePoints.length >= 2 ? (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#c8f36a', weight: 2.5, opacity: 0.9, dashArray: '7 9' }}
            className="route-dash"
          />
        ) : null}
      </MapContainer>

      {tileFailed ? (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-[var(--bg)]/92 p-5 text-center backdrop-blur-sm">
          <span className="grid size-11 place-items-center rounded-full border border-dashed border-[var(--line-strong)] text-[var(--gold)]">
            <MapPinned className="size-5" />
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--stamp)]">карта не загрузилась</p>
            <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-[var(--fg-muted)]">
              Тайлы OpenStreetMap недоступны — возможно, нет сети или провайдер блокирует карты. Схема ниже работает
              без интернета.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {onSchematic ? (
              <Button size="sm" onClick={onSchematic}>
                Открыть схему
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" onClick={retryTiles}>
              Повторить
            </Button>
          </div>
        </div>
      ) : null}
    </MapBoundary>
  )
}
