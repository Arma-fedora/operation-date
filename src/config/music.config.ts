import type { MusicTrack } from '../types/config'
import { mediaUrl } from './media.config'

/**
 * Screen music.
 *
 * `src` points to a file in `public/assets/custom/music/`. Tracks without a
 * file fall back to the built-in Web Audio synthesis, so the app always has
 * sound and nothing breaks while files are being added.
 */
export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'meme-dynasty',
    title: 'Династия',
    artist: 'Групповой чат',
    src: mediaUrl('music/meme-dynasty.mp3'),
    altSrc: '/assets/custom/music/meme-dynasty.mp3',
    screens: ['boot'],
    volume: 0.85,
    loop: true,
    fallback: 'generated:radio',
    mood: 'тот самый мем из чата, включается на входе',
  },
  {
    id: 'archive-hum',
    title: 'Архивный гул',
    artist: 'Дом культуры 01:03',
    screens: 'global',
    volume: 0.28,
    loop: true,
    fallback: 'generated:hum',
    mood: 'низкий гул, пыль и лампы дневного света',
  },
  {
    id: 'night-moscow',
    title: 'Ночная Москва',
    artist: 'Дом культуры 01:03',
    screens: ['planner', 'archive'],
    volume: 0.3,
    loop: true,
    fallback: 'generated:night',
    mood: 'прохладный синт, огни за окном',
  },
  {
    id: 'pigeon-chase',
    title: 'Погоня за голубем',
    artist: 'Дом культуры 01:03',
    screens: ['trials', 'evidence', 'mikhaylych'],
    volume: 0.24,
    loop: true,
    fallback: 'generated:chase',
    mood: 'нервный ритм, перья, подозрение',
  },
  {
    id: 'seal-wax',
    title: 'Печать и сургуч',
    artist: 'Дом культуры 01:03',
    screens: ['final', 'secret', 'epilogue'],
    volume: 0.3,
    loop: true,
    fallback: 'generated:seal',
    mood: 'тёплый финал, бумага и воск',
  },
  {
    id: 'radio-0103',
    title: 'Радиорубка 01:03',
    artist: 'Дом культуры 01:03',
    screens: ['radio', 'incident', 'interrogation'],
    volume: 0.26,
    loop: true,
    fallback: 'generated:radio',
    mood: 'помехи, дальняя волна, чужой эфир',
  },
]

export const TRACK_IDS = MUSIC_TRACKS.map((track) => track.id)

export function trackForScreen(screen: string): MusicTrack {
  const specific = MUSIC_TRACKS.find(
    (track) => track.screens !== 'global' && track.screens.includes(screen as never),
  )
  if (specific) return specific
  const global = MUSIC_TRACKS.find((track) => track.screens === 'global')
  return global ?? MUSIC_TRACKS[0]
}
