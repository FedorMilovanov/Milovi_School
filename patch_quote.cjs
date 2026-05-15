const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardBento.tsx', 'utf8');

const quoteMemo = `  const quote = useMemo(() => {
    const stored = safeGetItem('quote-seed')
    const parsed = stored !== null ? Number(stored) : NaN
    // Guard against corrupted storage (NaN, Infinity, out-of-range) by generating a fresh seed
    const seed = Number.isInteger(parsed) && parsed >= 0 && parsed < QUOTES.length
      ? parsed
      : Math.floor(Math.random() * QUOTES.length)
    // Write back only when we generated a new seed (first visit or corruption recovery)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed >= QUOTES.length) {
      safeSetItem('quote-seed', String(seed))
    }
    // Advance one quote per calendar day so returning users see a fresh quote daily
    const dayOffset = Math.floor(Date.now() / 86400000)
    return QUOTES[(seed + dayOffset) % QUOTES.length]
  }, [])`;

const quoteEffect = `  const [quote, setQuote] = useState(QUOTES[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = safeGetItem('quote-seed')
    const parsed = stored !== null ? Number(stored) : NaN
    const seed = Number.isInteger(parsed) && parsed >= 0 && parsed < QUOTES.length
      ? parsed
      : Math.floor(Math.random() * QUOTES.length)
    if (!Number.isInteger(parsed) || parsed < 0 || parsed >= QUOTES.length) {
      safeSetItem('quote-seed', String(seed))
    }
    const dayOffset = Math.floor(Date.now() / 86400000)
    setQuote(QUOTES[(seed + dayOffset) % QUOTES.length])
    setMounted(true)
  }, [])`;

code = code.replace(quoteMemo, quoteEffect);
code = code.replace(
  'if (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0) return null',
  'if (!mounted || (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0)) return null'
);

fs.writeFileSync('src/components/DashboardBento.tsx', code);
