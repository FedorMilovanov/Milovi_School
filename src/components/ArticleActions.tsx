import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Article } from '../data/types'
import { safeGetItem, safeSetItem } from '../utils/storage'
import { showToast } from './Toast'

interface ArticleActionsProps {
  article: Article
  /** Lift saved state up to parent to keep in sync with mobile reading bar */
  saved?: boolean
  onToggleSave?: (next: boolean) => void
}

export default function ArticleActions({ article, saved: savedProp, onToggleSave }: ArticleActionsProps) {
  // If parent passes saved/onToggleSave, use those; otherwise manage locally
  const [savedLocal, setSavedLocal] = useState(false)
  const saved = savedProp !== undefined ? savedProp : savedLocal
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const copiedTimeoutRef = useRef<number | null>(null)
  const shareTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (savedProp === undefined) {
      setSavedLocal(safeGetItem(`article-saved:${article.id}`) === 'true')
    }
  }, [article.id, savedProp])

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) window.clearTimeout(copiedTimeoutRef.current)
      if (shareTimeoutRef.current !== null) window.clearTimeout(shareTimeoutRef.current)
    }
  }, [])

  const toggleSave = () => {
    const newSaved = !saved
    if (onToggleSave) {
      onToggleSave(newSaved)
    } else {
      setSavedLocal(newSaved)
      safeSetItem(`article-saved:${article.id}`, String(newSaved))
    }
    showToast('save', newSaved ? 'Добавлено в закладки' : 'Убрано из закладок')
  }

  const copyLink = async (): Promise<boolean> => {
    try {
      const url = `${window.location.origin}/articles/${encodeURIComponent(article.id)}/`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast('copy', 'Ссылка скопирована')
      if (copiedTimeoutRef.current !== null) window.clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
      return true
    } catch (e) {
      console.error('Failed to copy:', e)
      return false
    }
  }

  const shareArticle = async () => {
    const url = `${window.location.origin}/articles/${encodeURIComponent(article.id)}/`
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url,
        })
        // F-19: show toast on successful native share
        showToast('share', 'Поделились статьёй')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') console.error(e)
      }
    } else {
      // No native share API — fall back to clipboard copy
      // Only flip shareCopied if the copy actually succeeded
      copyLink().then((ok) => {
        if (!ok) return
        setShareCopied(true)
        if (shareTimeoutRef.current !== null) window.clearTimeout(shareTimeoutRef.current)
        shareTimeoutRef.current = window.setTimeout(() => setShareCopied(false), 2000)
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleSave}
        className={`inline-flex items-center gap-1.5 border px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] transition ${saved ? 'border-stone-950 bg-stone-950 text-amber-50 dark:border-amber-100 dark:bg-amber-100 dark:text-stone-950' : 'border-[var(--border-subtle)] text-stone-700 hover:border-stone-400 hover:text-stone-950 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-amber-100 dark:hover:text-stone-950'}`}
        aria-label={saved ? 'Убрать из закладок' : 'Добавить в закладки'}
        aria-pressed={saved}
      >
        {saved ? (
          <motion.svg initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </motion.svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
        <span className="hidden sm:inline">{saved ? 'В закладках' : 'В закладки'}</span>
      </button>

      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 border border-[var(--border-subtle)] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] text-stone-700 transition hover:border-stone-400 hover:text-stone-950 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-amber-100 dark:hover:text-stone-950"
        aria-label="Скопировать ссылку"
      >
        {copied ? (
          <motion.svg initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )}
        <span className="hidden sm:inline">{copied ? 'Скопировано' : 'Ссылка'}</span>
      </button>

      <button
        type="button"
        onClick={shareArticle}
        className="inline-flex items-center gap-1.5 border border-[var(--border-subtle)] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.22em] text-stone-700 transition hover:border-stone-400 hover:text-stone-950 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-amber-100 dark:hover:text-stone-950"
        aria-label="Поделиться"
      >
        {shareCopied ? (
          <motion.svg initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
        <span className="hidden sm:inline">{shareCopied ? 'Отправлено' : 'Поделиться'}</span>
      </button>
    </div>
  )
}
