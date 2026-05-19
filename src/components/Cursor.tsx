/**
 * Cursor — premium gold-spark cursor + interactive-text glow + luxury letter pass.
 *
 * Перенесён 1-в-1 из АРЕНА ИИ CODE source (drop @ 2026-05-19).
 * Хрупкий компонент: НЕ менять числовые коэффициенты / пороги без явного
 * запроса — они влияют на ощущение «премиальности» курсора.
 *
 * Что делает:
 *   1. Рисует overlay-canvas с золотыми частицами trail.
 *   2. Двигает aim-кольцо (<div #cursorAim>) к позиции мыши с easing 0.11.
 *   3. Для элементов `.interactive-text` (заголовки секций, about-h2) считает
 *      близость курсора и выставляет CSS-переменную `--wave-alpha` — это даёт
 *      аккуратный text-shadow glow вокруг текста (group-glow без обрезки букв).
 *   4. Для каждой `.luxury-color-text` группы перебирает дочерние
 *      `.luxury-letter`-ы и красит их inline-style градиентом base→active в
 *      зависимости от расстояния. Палитра по data-tone:
 *        - title       → ваниль  → насыщенное золото
 *        - section     → серый   → золото / бронза
 *        - platinum    → синий   → ярко-синий (Pâtisserie, эффект из дропа)
 *        - about-white → белый   → светлое золото
 *
 * Производительность:
 *   - rAF приостанавливается при document.hidden (батарея в фоне).
 *   - updateLuxuryLetters вызывается только когда мышь реально движется
 *     (speed > 0.08).
 *   - Path2D batching для частиц (1 draw call вместо 85).
 *   - ResizeObserver вместо window 'resize'.
 *
 * Отключено на mobile / touch (window.innerWidth < 820 || 'ontouchstart').
 */
import { useEffect, useRef } from 'react'

interface CursorProps {
  /** Текущая тема — нужна для палитры частиц и букв. */
  theme: 'light' | 'dark'
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

const mixColor = (from: string, to: string, amount: number) => {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const t = Math.max(0, Math.min(1, amount))
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)}, ${Math.round(a.g + (b.g - a.g) * t)}, ${Math.round(a.b + (b.b - a.b) * t)})`
}

export default function Cursor({ theme }: CursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aimRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 820 || 'ontouchstart' in window) return

    const canvas = canvasRef.current
    const aim = aimRef.current
    if (!canvas || !aim) return
    // КРИТИЧНО: alpha:true, иначе canvas-overlay закроет сайт чёрным.
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) return

    aim.classList.toggle('light-theme', !isDark)

    let ww = window.innerWidth
    let wh = window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    let isVisible = !document.hidden

    const resizeCanvas = () => {
      ww = window.innerWidth
      wh = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(ww * dpr)
      canvas.height = Math.round(wh * dpr)
      canvas.style.width = ww + 'px'
      canvas.style.height = wh + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isVisible) resizeCanvas()
    })
    resizeObserver.observe(document.body)
    resizeCanvas()

    let hasPointer = false
    const mouse = { x: -1000, y: -1000 }
    const cursor = { x: -1000, y: -1000 }
    const prevCursor = { x: -1000, y: -1000 }
    type Spark = { x: number; y: number; vx: number; vy: number; opacity: number; size: number; decay: number }
    let sparks: Spark[] = []
    const MAX_SPARKS = 85
    let isSelectingText = false

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasPointer) {
        hasPointer = true
        cursor.x = e.clientX
        cursor.y = e.clientY
        prevCursor.x = e.clientX
        prevCursor.y = e.clientY
      }
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const handleSelectionChange = () => {
      isSelectingText = Boolean(document.getSelection()?.toString())
    }
    const handleSelectionEnd = () => {
      window.setTimeout(() => {
        isSelectingText = Boolean(document.getSelection()?.toString())
      }, 0)
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    window.addEventListener('mouseup', handleSelectionEnd)

    let rafId = 0
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && rafId === 0) {
        rafId = requestAnimationFrame(draw)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const spawnTrail = (dx: number, dy: number, speed: number) => {
      if (!hasPointer || speed < 0.35) return
      const spawnCount = Math.min(6, Math.max(1, Math.round(speed / 4)))
      for (let i = 0; i < spawnCount; i++) {
        const t = i / spawnCount
        sparks.push({
          x: (cursor.x - dx * t) + (Math.random() - 0.5) * 2,
          y: (cursor.y - dy * t) + (Math.random() - 0.5) * 2,
          vx: -dx * 0.15 + (Math.random() - 0.5) * 1.5,
          vy: -dy * 0.15 + (Math.random() - 0.5) * 1.5,
          opacity: 1.0,
          size: 0.8 + Math.random() * 2.2,
          decay: 0.02 + Math.random() * 0.025,
        })
      }
      if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS)
    }

    // ── Interactive text setup ──────────────────────────────────────────────
    // hero-h1 управляется ТОЛЬКО luxury-letter системой — не добавляем сюда.
    const interactiveSelectors = [
      '#categories .section-title-lux',
      '#archive .section-title-lux',
      '#materials .section-title-lux',
      '.about-h2',
      '.about-h2 em',
    ]
    let interactiveElements: HTMLElement[] = []
    let luxuryLetterGroups: HTMLElement[] = []

    const refreshElements = () => {
      // Cleanup стейт на смене темы — иначе остаётся «застрявший» glow.
      document.querySelectorAll('.interactive-text').forEach((el) => {
        (el as HTMLElement).style.setProperty('--wave-alpha', '0')
        el.setAttribute('data-was-near', 'false')
      })
      interactiveElements = Array.from(document.querySelectorAll(interactiveSelectors.join(','))) as HTMLElement[]
      interactiveElements.forEach((el) => {
        el.classList.add('interactive-text')
        el.style.setProperty('--wave-alpha', '0')
        el.setAttribute('data-was-near', 'false')
      })
      luxuryLetterGroups = Array.from(document.querySelectorAll('.luxury-color-text')) as HTMLElement[]
    }
    const initTimer = window.setTimeout(refreshElements, 50)
    refreshElements()

    const checkTextHover = () => {
      for (const el of interactiveElements) {
        if (!hasPointer) {
          el.style.setProperty('--wave-alpha', '0')
          el.setAttribute('data-was-near', 'false')
          continue
        }
        const rect = el.getBoundingClientRect()
        const margin = 50
        const isNearBox = cursor.x > rect.left - margin && cursor.x < rect.right + margin
                       && cursor.y > rect.top  - margin && cursor.y < rect.bottom + margin

        let intensity = 0
        if (isNearBox) {
          const nearestX = Math.max(rect.left, Math.min(cursor.x, rect.right))
          const nearestY = Math.max(rect.top,  Math.min(cursor.y, rect.bottom))
          const dist = Math.hypot(cursor.x - nearestX, cursor.y - nearestY)
          const threshold = Math.max(40, rect.height * 1.5)
          if (dist < threshold) {
            intensity = Math.max(0, 1 - Math.pow(dist / threshold, 1.2))
          }
        }

        const wasNear = el.getAttribute('data-was-near') === 'true'
        if (intensity > 0.01 || wasNear) {
          const lx = cursor.x - rect.left
          const ly = cursor.y - rect.top
          const mxPct = (lx / rect.width) * 100
          const myPct = (ly / rect.height) * 100
          el.style.setProperty('--mx', `${Math.max(-20, Math.min(120, mxPct))}%`)
          el.style.setProperty('--my', `${Math.max(-20, Math.min(120, myPct))}%`)
          el.style.setProperty('--gx', `${Math.max(-20, Math.min(120, mxPct))}%`)
          el.style.setProperty('--wave-alpha', intensity.toFixed(3))
          if (intensity > 0.01) el.setAttribute('data-was-near', 'true')
          else el.setAttribute('data-was-near', 'false')
        }
      }
    }

    type Palette = { base: string; active: string; glow: string; highlight?: string }
    const palettes: Record<string, Palette> = {
      title:        { base: isDark ? '#f5efe5' : '#1a1510', active: '#d4a96a',                          glow: isDark ? '212,169,106' : '176,128,80' },
      gold:         { base: isDark ? '#d4a96a' : '#9a6b3a', active: isDark ? '#e2a85f' : '#c7843f',     highlight: isDark ? '#f0c27a' : '#d79a52', glow: isDark ? '226,168,95' : '199,132,63' },
      platinum:     { base: isDark ? '#d4b890' : '#9a6b3a', active: isDark ? '#1a7aef' : '#003ecf',     glow: isDark ? '26, 122, 239' : '0, 62, 207' },
      section:      { base: isDark ? '#d1d1d1' : '#0c0a09', active: isDark ? '#e8c98a' : '#b08050',     glow: isDark ? '232,201,138' : '176,128,80' },
      'about-white':{ base: '#ffffff',                        active: '#e8c98a',                          glow: '232,201,138' },
    }
    const glowMap: Record<string, string> = {
      title:        isDark ? '212 169 106' : '176 128 80',
      gold:         isDark ? '226 168 95'  : '199 132 63',
      platinum:     isDark ? '155 197 255' : '59 130 246',
      section:      isDark ? '232 201 138' : '176 128 80',
      'about-white':'232 201 138',
    }

    const updateLuxuryLetters = () => {
      for (let i = 0; i < luxuryLetterGroups.length; i++) {
        const group = luxuryLetterGroups[i]
        const tone = group.dataset.tone || 'title'
        const palette = palettes[tone] || palettes.title
        const letters = group.children

        const groupRect = group.getBoundingClientRect()
        const nearestX = Math.max(groupRect.left, Math.min(cursor.x, groupRect.right))
        const nearestY = Math.max(groupRect.top,  Math.min(cursor.y, groupRect.bottom))
        const groupDistSq = Math.pow(cursor.x - nearestX, 2) + Math.pow(cursor.y - nearestY, 2)
        const groupThreshold = Math.max(65, groupRect.height * 2.2)

        if (!hasPointer || groupDistSq > Math.pow(groupThreshold + 120, 2)) {
          group.style.setProperty('--group-glow-alpha', '0')
          if (group.dataset.wasActive === 'true') {
            for (let j = 0; j < letters.length; j++) {
              const letter = letters[j] as HTMLElement
              letter.style.color = palette.base
              letter.style.textShadow = 'none'
            }
            group.dataset.wasActive = 'false'
          }
          continue
        }

        group.dataset.wasActive = 'true'
        const groupIntensity = Math.max(0, 1 - Math.sqrt(groupDistSq) / groupThreshold)
        group.style.setProperty('--group-glow-alpha', (groupIntensity * groupIntensity * (3 - 2 * groupIntensity)).toFixed(3))
        group.style.setProperty('--group-glow-rgb', glowMap[tone] || glowMap.title)

        const letterThreshold = Math.max(45, groupRect.height * 1.2)
        for (let j = 0; j < letters.length; j++) {
          const letter = letters[j] as HTMLElement
          if (isSelectingText || !letter.textContent?.trim()) {
            letter.style.color = palette.base
            letter.style.textShadow = 'none'
            continue
          }
          const lRect = letter.getBoundingClientRect()
          const lDistSq = Math.pow(cursor.x - (lRect.left + lRect.width / 2), 2) + Math.pow(cursor.y - (lRect.top + lRect.height / 2), 2)
          if (lDistSq < Math.pow(letterThreshold, 2)) {
            const lRaw = 1 - Math.sqrt(lDistSq) / letterThreshold
            const lInt = lRaw * lRaw * (3 - 2 * lRaw)
            const colorMid = mixColor(palette.base, palette.active, lInt)
            letter.style.color = palette.highlight
              ? mixColor(colorMid, palette.highlight, Math.max(0, (lInt - 0.68) / 0.32) * 0.62)
              : colorMid
            const coreSize = 0.3 + 0.7 * lInt
            const haloSize = 1.3 + 2.0 * lInt
            letter.style.textShadow = `0 0 ${coreSize}px rgba(${palette.glow}, ${0.5 * lInt}), 0 0 ${haloSize}px rgba(${palette.glow}, ${0.2 * lInt})`
          } else {
            letter.style.color = palette.base
            letter.style.textShadow = 'none'
          }
        }
      }
    }

    const draw = () => {
      if (!isVisible) { rafId = 0; return }

      ctx.clearRect(0, 0, ww, wh)
      prevCursor.x = cursor.x
      prevCursor.y = cursor.y
      cursor.x += (mouse.x - cursor.x) * 0.11
      cursor.y += (mouse.y - cursor.y) * 0.11
      const dx = cursor.x - prevCursor.x
      const dy = cursor.y - prevCursor.y
      const speed = Math.hypot(dx, dy)
      spawnTrail(dx, dy, speed)

      const sparkColor = isDark ? '255, 220, 120' : '110, 78, 52'
      const sparkGlow = isDark ? 16 : 11
      const sparkPath = new Path2D()
      const validSparks: Spark[] = []
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.opacity -= s.decay
        s.x += s.vx; s.y += s.vy
        s.vx *= 0.975; s.vy *= 0.975
        if (s.opacity <= 0) continue
        validSparks.push(s)
        sparkPath.moveTo(s.x + s.size * s.opacity, s.y)
        sparkPath.arc(s.x, s.y, s.size * s.opacity, 0, Math.PI * 2)
      }
      sparks = validSparks
      if (validSparks.length > 0) {
        ctx.fillStyle = `rgba(${sparkColor}, ${validSparks[0]?.opacity || 0.5})`
        ctx.shadowBlur = sparkGlow * (validSparks[0]?.opacity || 0.5)
        ctx.shadowColor = `rgba(${sparkColor}, 0.92)`
        ctx.fill(sparkPath)
      }

      checkTextHover()
      if (speed > 0.08) updateLuxuryLetters()

      aim.style.left = cursor.x + 'px'
      aim.style.top  = cursor.y + 'px'
      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(initTimer)
      resizeObserver.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('selectionchange', handleSelectionChange)
      window.removeEventListener('mouseup', handleSelectionEnd)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // Сбросим все inline-style которые могли остаться на буквах/группах.
      document.querySelectorAll<HTMLElement>('.luxury-letter').forEach((l) => {
        l.style.color = ''
        l.style.textShadow = ''
      })
      document.querySelectorAll<HTMLElement>('.luxury-color-text').forEach((g) => {
        g.style.removeProperty('--group-glow-alpha')
        g.dataset.wasActive = 'false'
      })
      document.querySelectorAll<HTMLElement>('.interactive-text').forEach((el) => {
        el.style.setProperty('--wave-alpha', '0')
        el.setAttribute('data-was-near', 'false')
      })
    }
  }, [isDark])

  return (
    <>
      <canvas id="cursorCanvas" ref={canvasRef} aria-hidden="true" />
      <div id="cursorAim" ref={aimRef} aria-hidden="true" />
    </>
  )
}
