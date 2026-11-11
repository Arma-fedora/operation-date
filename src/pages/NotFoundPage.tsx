import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { Stamp } from '../components/ui/Stamp'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-[65dvh] items-center justify-center py-8">
      <Panel variant="dark" className="w-full max-w-md p-6">
        <Stamp tone="red" rotate={4}>
          страница не найдена
        </Stamp>
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          ошибка архива 404
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none">Этой папки нет</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          Возможно, документ изъяли, сожгли или он ушёл на свидание без предупреждения.
        </p>
        <Button className="mt-6" full onClick={() => navigate('/incident')}>
          Вернуться к делу
        </Button>
      </Panel>
    </div>
  )
}
