import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, FileText, FolderLock, Image as ImageIcon, Lock, Sparkles, Sticker } from 'lucide-react'
import { GALLERY_ITEMS } from '../config/gallery.config'
import { useToast } from '../app/providers/ToastProvider'
import { useSfx } from '../app/providers/AudioProvider'
import { useGameStore } from '../store/gameStore'
import { haptic } from '../services/telegram/telegram'
import { isUnlockMet, unlockLabel } from '../utils/conditionsGallery'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { Stamp } from '../components/ui/Stamp'
import { Dialog } from '../components/ui/Dialog'
import { Placeholder } from '../components/ui/Placeholder'
import { Reveal } from '../components/fx/Reveal'
import type { GalleryItem } from '../types/config'
import { cn } from '../utils'

type Filter = 'all' | GalleryItem['kind']

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'всё' },
  { id: 'photo', label: 'фото' },
  { id: 'meme', label: 'мемы' },
  { id: 'document', label: 'документы' },
  { id: 'secret', label: 'секреты' },
]

const kindIcons = { photo: ImageIcon, meme: Sticker, document: FileText, secret: Sparkles }

function ArchiveAsset({ item, compact = false }: { item: GalleryItem; compact?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (item.src && !failed) {
    return (
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover', compact ? '' : 'max-h-[55vh]')}
      />
    )
  }
  return <Placeholder seed={item.id} label={item.alt} note={item.note} aspect={item.aspect} compact={compact} />
}

export function ArchivePage() {
  const navigate = useNavigate()
  const state = useGameStore()
  const discoverSecret = useGameStore((store) => store.discoverSecret)
  const completeScreen = useGameStore((store) => store.completeScreen)
  const { showToast } = useToast()
  const sfx = useSfx()
  const [filter, setFilter] = useState<Filter>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [redOpen, setRedOpen] = useState(false)

  const items = useMemo(
    () =>
      GALLERY_ITEMS.filter((item) => filter === 'all' || item.kind === filter).sort((a, b) => a.order - b.order),
    [filter],
  )
  const unlocked = GALLERY_ITEMS.filter((item) => isUnlockMet(item.unlock, state))
  const active = GALLERY_ITEMS.find((item) => item.id === activeId)
  const redUnlocked = state.secrets.includes('red-folder')

  const openItem = (item: GalleryItem) => {
    if (!isUnlockMet(item.unlock, state)) {
      showToast(`Материал закрыт. ${unlockLabel(item.unlock)}.`, 'warning')
      return
    }
    haptic('selection')
    completeScreen('archive')
    setActiveId(item.id)
  }

  const openRedFolder = () => {
    if (!redUnlocked) {
      discoverSecret('red-folder')
      haptic('success')
      sfx('secret-unlock')
      showToast('Секрет: красная папка открыта. Внутри записка «Спасибо, что открыли».', 'secret')
      completeScreen('archive')
    }
    setRedOpen(true)
  }

  return (
    <div>
      <PageHeader
        chapter="07"
        eyebrow="личное дело · доступ ограничен"
        title="Секретный архив"
        description="Фотографии, мемы и документы, которые не вошли в основное дело. Часть из них открывается по мере расследования. Часть — по любопытству."
        right={<Stamp tone="gold" rotate={3}>{unlocked.length}/{GALLERY_ITEMS.length}</Stamp>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                'border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
                filter === item.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-[var(--line)] text-[var(--fg-muted)] hover:border-[var(--line-strong)]',
              )}
              aria-pressed={filter === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]/60">
          {GALLERY_ITEMS.filter((item) => item.kind === 'secret').length} секретных слотов
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, index) => {
          const open = isUnlockMet(item.unlock, state)
          const Icon = kindIcons[item.kind]
          return (
            <Reveal key={item.id} delay={index * 0.03}>
              <button
                type="button"
                onClick={() => openItem(item)}
                className={cn(
                  'group relative flex h-full w-full flex-col overflow-hidden border bg-[var(--bg-elev)]/70 text-left transition-colors',
                  open ? 'border-[var(--line)] hover:border-[var(--accent)]/60' : 'border-[var(--line)]/60',
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/30">
                  {open ? (
                    <ArchiveAsset item={item} compact />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.5)_0_2px,transparent_2px_6px)] opacity-30" />
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="grid size-8 place-items-center rounded-full border border-dashed border-[var(--line-strong)] text-[var(--fg-muted)]">
                          <Lock className="size-3.5" />
                        </span>
                      </div>
                    </>
                  )}
                  <span className="absolute left-2 top-2 grid size-5 place-items-center border border-white/10 bg-black/50 text-white/60">
                    <Icon className="size-2.5" />
                  </span>
                  {!open ? (
                    <span className="absolute inset-x-2 bottom-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--fg-muted)]">
                      {unlockLabel(item.unlock)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <p className={cn('text-[11px] leading-tight', open ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]')}>
                    {open ? item.title : 'материал закрыт'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-[var(--fg-muted)]/70">
                    {open ? item.caption : 'Откроется по мере расследования.'}
                  </p>
                </div>
              </button>
            </Reveal>
          )
        })}
      </div>

      <Panel variant="dark" className="mt-5 border-[var(--stamp)]/25 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--stamp)]/40 text-[var(--stamp)]">
              <FolderLock className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--stamp)]">служебный ящик</p>
              <p className="mt-1 max-w-md text-[11px] leading-relaxed text-[var(--fg-muted)]">
                В каталоге есть папка, которую архив просил не открывать. На ней написано «Не открывать». Архив
                умеет в иронию.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openRedFolder}
            className={cn(
              'group relative flex items-center gap-2 border border-[var(--stamp)]/40 bg-[#3b1611]/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--stamp)] transition-all',
              redUnlocked ? 'opacity-80' : 'hover:border-[var(--stamp)] hover:bg-[#3b1611]/70',
            )}
          >
            <span className="grid size-5 place-items-center border border-[var(--stamp)]/40">
              <FolderLock className="size-3" />
            </span>
            {redUnlocked ? 'папка открыта' : 'не открывать'}
          </button>
        </div>
      </Panel>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" full onClick={() => navigate('/radio')} icon={<ArrowRight className="size-4" />}>
          В радиорубку
        </Button>
        {state.completed.includes('planner') ? (
          <Button full onClick={() => navigate('/final')} icon={<ArrowRight className="size-4" />}>
            К конверту
          </Button>
        ) : (
          <Button variant="secondary" full onClick={() => navigate('/planner')} icon={<ArrowRight className="size-4" />}>
            К планированию
          </Button>
        )}
      </div>

      <Dialog open={Boolean(active)} onClose={() => setActiveId(null)} eyebrow={active?.kind} title={active?.title} wide>
        {active ? (
          <div>
            <div className="overflow-hidden border border-[var(--line)] bg-black/30">
              <ArchiveAsset item={active} />
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--fg-muted)]">{active.caption}</p>
            {active.note ? (
              <p className="mt-3 border-l border-[var(--line-strong)] pl-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-[var(--fg-muted)]/60">
                {active.note}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-2">
              <Check className="size-3.5 text-[var(--accent)]" />
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                материал доступен в архиве дела
              </p>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={redOpen}
        onClose={() => setRedOpen(false)}
        eyebrow="не открывать"
        title="Красная папка"
        wide
      >
        <div className="overflow-hidden border border-[var(--stamp)]/30 bg-[#2b100c]">
          <div className="flex aspect-[16/10] flex-col justify-between p-5 text-[#f0d8ce]">
            <div className="flex items-start justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#d7826e]">дело №0103 · личное</span>
              <FolderLock className="size-5 text-[#d7826e]" />
            </div>
            <div>
              <p className="font-display text-3xl uppercase leading-none">Не открывать</p>
              <p className="mt-3 max-w-md font-mono text-[10px] leading-relaxed tracking-[0.06em] text-[#e6b9a9]/80">
                Если вы это читаете, значит, открыли. Архив ценит последовательность.
              </p>
            </div>
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#e6b9a9]/50">
              внутри: одна записка · один секрет · никаких обязательств
            </p>
          </div>
        </div>
        <div className="mt-4 border-l-2 border-[var(--stamp)]/50 pl-3">
          <p className="text-[13px] leading-relaxed text-[var(--fg-muted)]">
            «Спасибо, что открыли. Иногда самое важное — это не улика, а любопытство, с которым вы дошли до конца.
            Комната 01:03 уже знает, что вы близко».
          </p>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--gold)]">
            секрет засчитан · красная папка в архиве
          </p>
        </div>
        <Button full className="mt-4" onClick={() => setRedOpen(false)}>
          Вернуть папку на место
        </Button>
      </Dialog>
    </div>
  )
}
