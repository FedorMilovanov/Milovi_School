import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <main className="min-h-screen bg-[var(--bg-main)] dark:bg-stone-950 px-6 py-20 text-stone-950 dark:text-stone-100"><div className="mx-auto max-w-3xl border-y border-stone-950/20 dark:border-stone-800 py-12"><p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-800 dark:text-amber-500">Системное сообщение</p><h1 className="mt-4 font-serif text-5xl font-semibold tracking-[-0.06em]">Раздел не загрузился</h1><p className="mt-5 text-lg leading-8 text-stone-600 dark:text-stone-400">Обновите страницу. Если ошибка повторится, откройте библиотеку заново.</p><button type="button" onClick={() => window.location.reload()} className="mt-8 border border-stone-950 dark:border-stone-400 px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] transition hover:bg-stone-950 hover:text-amber-100 dark:hover:bg-stone-100 dark:hover:text-stone-950">Обновить</button></div></main>
    return this.props.children
  }
}