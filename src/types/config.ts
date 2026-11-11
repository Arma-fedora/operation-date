import type { PuzzleId, ScreenId } from './game'

export type UnlockCondition =
  | { type: 'always' }
  | { type: 'screen'; screen: ScreenId }
  | { type: 'evidence'; id: string }
  | { type: 'secret'; id: string }
  | { type: 'all'; of: UnlockCondition[] }
  | { type: 'any'; of: UnlockCondition[] }

export interface ScreenMeta {
  id: ScreenId
  path: string
  chapter: string
  title: string
  menuTitle: string
  eyebrow: string
  hidden?: boolean
}

export interface GalleryItem {
  id: string
  title: string
  src?: string
  alt: string
  caption: string
  kind: 'photo' | 'meme' | 'document' | 'secret'
  unlock: UnlockCondition
  order: number
  aspect?: 'portrait' | 'landscape' | 'square'
  note?: string
}

export type AudioFallback = 'generated:hum' | 'generated:night' | 'generated:chase' | 'generated:seal' | 'generated:radio' | 'silence'

export interface MusicTrack {
  id: string
  title: string
  artist: string
  src?: string
  screens: ScreenId[] | 'global'
  volume: number
  loop: boolean
  fallback: AudioFallback
  mood: string
}

export interface PuzzleDefinition {
  id: PuzzleId
  title: string
  shortTitle: string
  description: string
  evidenceId: string
  evidenceTitle: string
  evidenceNote: string
  hints: [string, string, string]
  successText: string
  wrongTexts: string[]
}

export interface Venue {
  id: string
  title: string
  description: string
  address?: string
  coords?: [number, number]
  isDemo: boolean
  tags: string[]
  duration: string
}

export interface DateScenario {
  id: string
  title: string
  description: string
  stops: string[]
  vibe: 'classic' | 'adventure' | 'quiet'
}

export interface DateConfig {
  mapCenter: [number, number]
  zoom: number
  venues: Venue[]
  scenarios: DateScenario[]
  disclaimer: string
}

export interface DialogueChoice {
  id: string
  text: string
  next: string
  effects?: Record<string, string | number | boolean>
  secret?: string
}

export interface DialogueNode {
  id: string
  speaker: 'plombir' | 'mikhaylych' | 'system' | 'alexandra'
  text: string
  next?: string
  choices?: DialogueChoice[]
  effects?: Record<string, string | number | boolean>
  secret?: string
  end?: boolean
}

export interface DialogueGraph {
  start: string
  nodes: Record<string, DialogueNode>
}

export interface QuizOption {
  id: string
  text: string
  tag: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
}

export interface QuizResult {
  id: string
  title: string
  description: string
  stamp: string
}
