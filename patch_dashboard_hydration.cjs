const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBento.tsx', 'utf8');

const regex = /export default function DashboardBento\(\{ articles \}: \{ articles: ArticleMeta\[\] \}\) \{([\s\S]*?)return \(/;

const newTop = `export default function DashboardBento({ articles }: { articles: ArticleMeta[] }) {
  const [readCount, setReadCount] = useState(0)
  const [bookmarksCount, setBookmarksCount] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lastArticle, setLastArticle] = useState<ArticleMeta | null>(null)
  const [quote, setQuote] = useState(QUOTES[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let completed = 0
    let saved = 0
    let minutes = 0
    let lastA: ArticleMeta | null = null
    let maxTs = 0

    articles.forEach((a) => {
      const pct = Number(safeGetItem(\`article-progress-pct:\${a.id}\`) ?? 0)
      if (pct >= 95) completed++
      if (safeGetItem(\`article-saved:\${a.id}\`) === 'true') saved++
      minutes += (pct / 100) * a.readTime

      if (pct > 0) {
        const ts = Number(safeGetItem(\`article-last-read:\${a.id}\`) ?? 0)
        if (ts > maxTs) {
          maxTs = ts
          lastA = a
        }
      }
    })

    setReadCount(completed)
    setBookmarksCount(saved)
    setTotalMinutes(Math.round(minutes))
    setLastArticle(lastA)
    setStreak(getReadingStreak())

    let seed = Number(safeGetItem('quote-seed') ?? 0)
    if (!seed) {
      seed = Math.floor(Math.random() * 1000)
      safeSetItem('quote-seed', String(seed))
    }
    const dayOffset = Math.floor(Date.now() / 86400000)
    setQuote(QUOTES[(seed + dayOffset) % QUOTES.length])
    setMounted(true)
  }, [articles])

  if (!mounted) return null

  if (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0) return null

  return (`

code = code.replace(regex, newTop);

fs.writeFileSync('src/components/DashboardBento.tsx', code);
