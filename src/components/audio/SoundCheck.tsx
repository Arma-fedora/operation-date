import { Activity } from 'lucide-react'
import { useAudio } from '../../app/providers/AudioProvider'
import { Button } from '../ui/Button'

const fileStateLabels: Record<string, string> = {
  none: 'файл не запрошен',
  loading: 'файл грузится',
  loaded: 'файл загружен',
  failed: 'файл не загрузился',
}

const contextLabels: Record<string, string> = {
  none: 'нет Web Audio',
  suspended: 'ждёт касания',
  running: 'играет',
  closed: 'закрыт',
}

/**
 * Shows what the audio engine is doing right now: context state, whether the
 * music file arrived and the measured output level. One tap plays a test tone.
 */
export function SoundCheck({ compact = false }: { compact?: boolean }) {
  const audio = useAudio()
  const { diagnostics } = audio
  const level = Number.isFinite(diagnostics.peakDb) ? `${diagnostics.peakDb.toFixed(1)} дБ` : 'тишина'

  return (
    <div className="border border-[var(--line)] bg-[var(--bg-elev)]/60 p-3">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--fg-muted)]/70">
        проверка звука
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[9px] text-[var(--fg-muted)]">
        <dt>состояние</dt>
        <dd className="text-right text-[var(--fg)]">
          {contextLabels[diagnostics.contextState] ?? diagnostics.contextState}
        </dd>
        <dt>трек</dt>
        <dd className="text-right text-[var(--fg)]">
          {diagnostics.currentTrackId || '—'}
          {diagnostics.fromFile ? ' · файл' : diagnostics.currentTrackId ? ' · синтез' : ''}
        </dd>
        <dt>музыка</dt>
        <dd className="text-right text-[var(--fg)]">
          {fileStateLabels[diagnostics.fileState] ?? diagnostics.fileState}
          {diagnostics.fileBytes ? ` · ${diagnostics.fileBytes.toLocaleString('ru')} Б` : ''}
        </dd>
        <dt>уровень</dt>
        <dd className="text-right text-[var(--fg)]">{level}</dd>
      </dl>
      {diagnostics.fileError ? (
        <p className="mt-1.5 font-mono text-[8px] leading-relaxed text-[var(--stamp)]">
          {diagnostics.fileError}
        </p>
      ) : null}
      {diagnostics.sfxError ? (
        <p className="mt-1 font-mono text-[8px] leading-relaxed text-[var(--fg-muted)]/70">
          эффекты: {diagnostics.sfxError}
        </p>
      ) : null}
      <Button
        variant="secondary"
        size="sm"
        className={compact ? 'mt-2' : 'mt-2.5'}
        onClick={audio.testSound}
        icon={<Activity className="size-3.5" />}
      >
        проверить звук
      </Button>
    </div>
  )
}
