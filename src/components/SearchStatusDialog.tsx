import { useRef } from 'react'
import { useModalFocus } from '../hooks/useModalFocus'

interface Props {
  failed?: boolean
  onClose: () => void
  onRetry?: () => void
}

/** The same keyboard contract while either the index or search module loads. */
export default function SearchStatusDialog({ failed = false, onClose, onRetry }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useModalFocus(ref, true)
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 px-4 py-[8vh]" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-search-loading-title"
        tabIndex={-1}
        onKeyDown={event => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }}
        className="mx-auto w-full max-w-lg rounded-xl border border-stone-700 bg-stone-950 p-6 text-stone-100 shadow-2xl"
      >
        <h2 id="article-search-loading-title" className="text-xl font-semibold">Поиск по библиотеке</h2>
        {failed ? (
          <div className="mt-4 space-y-3">
            <p role="alert">Не удалось загрузить поиск. Проверьте соединение и повторите попытку.</p>
            {onRetry && <button type="button" className="min-h-11 rounded-lg border border-stone-500 px-4 py-2" onClick={onRetry}>Повторить загрузку</button>}
            <a className="block py-2 underline" href="/materials/">Открыть галерею материалов</a>
          </div>
        ) : <p role="status" className="mt-4 text-stone-300">Загружаем каталог поиска…</p>}
        <button type="button" className="mt-5 min-h-11 rounded-lg border border-stone-600 px-4 py-2" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  )
}
