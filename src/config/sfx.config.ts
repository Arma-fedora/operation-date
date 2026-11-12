import type { SfxDefinition, SfxId } from '../types/config'

const SOUNDS_DIR = '/assets/custom/sounds'

/**
 * Short one-shot sounds. Files live in `public/assets/custom/sounds/`.
 * A slot without a file simply stays silent, so the app never breaks
 * when a sound is missing.
 */
export const SFX: Record<SfxId, SfxDefinition> = {
  'ui-click': { id: 'ui-click', src: `${SOUNDS_DIR}/ui-click.mp3`, volume: 0.5 },
  'ui-page': { id: 'ui-page', src: `${SOUNDS_DIR}/ui-page.mp3`, volume: 0.6 },
  'puzzle-correct': { id: 'puzzle-correct', src: `${SOUNDS_DIR}/puzzle-correct.mp3`, volume: 0.8 },
  'puzzle-wrong': { id: 'puzzle-wrong', src: `${SOUNDS_DIR}/puzzle-wrong.mp3`, volume: 0.7 },
  'evidence-found': { id: 'evidence-found', src: `${SOUNDS_DIR}/evidence-found.mp3`, volume: 0.85 },
  'secret-unlock': { id: 'secret-unlock', src: `${SOUNDS_DIR}/secret-unlock.mp3`, volume: 0.9 },
  'envelope-open': { id: 'envelope-open', src: `${SOUNDS_DIR}/envelope-open.mp3`, volume: 1 },
  'stamp-press': { id: 'stamp-press', src: `${SOUNDS_DIR}/stamp-press.mp3`, volume: 0.8 },
  'pigeon-coo': { id: 'pigeon-coo', src: `${SOUNDS_DIR}/pigeon-coo.mp3`, volume: 0.8 },
  'radio-click': { id: 'radio-click', src: `${SOUNDS_DIR}/radio-click.mp3`, volume: 0.7 },
  'typewriter-tick': { id: 'typewriter-tick', src: `${SOUNDS_DIR}/typewriter-tick.mp3`, volume: 0.35 },
  'answer-sent': { id: 'answer-sent', src: `${SOUNDS_DIR}/answer-sent.mp3`, volume: 0.9 },
}

export const SFX_IDS = Object.keys(SFX) as SfxId[]
