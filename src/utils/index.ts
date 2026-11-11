import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function minDateISO(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return toISODate(date)
}

export function maxDateISO(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return toISODate(date)
}

export function formatRuDate(iso?: string): string {
  if (!iso) return 'дата не выбрана'
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day, 12, 0, 0))
}

export function formatRuDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(new Date(iso))
}

export function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6_371_000
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function totalRouteMeters(points: Array<[number, number]>): number {
  return points.slice(1).reduce((sum, point, index) => sum + haversineMeters(points[index], point), 0)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} м`
  return `${(meters / 1000).toFixed(1)} км`
}

export function safeInt(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
