import re

with open('src/components/DashboardBento.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add mounted state
if 'const [mounted, setMounted] = useState(false)' not in content:
    content = content.replace('const [recentArticle, setRecentArticle] = useState<ArticleMeta | null>(null)',
                              'const [recentArticle, setRecentArticle] = useState<ArticleMeta | null>(null)\n  const [mounted, setMounted] = useState(false)')

# Add setMounted to useEffect
if 'setMounted(true)' not in content:
    content = content.replace('setStreak(s)\n  }, [articles])', 'setStreak(s)\n    setMounted(true)\n  }, [articles])')

# Replace the quote memo with a simple state
if 'const quote = useMemo' in content:
    content = re.sub(r'const quote = useMemo\(\(\) => \{[\s\S]*?\}, \[\]\)', 'const [quote, setQuote] = useState(QUOTES[0])', content)
    
    # Add quote logic inside useEffect
    quote_logic = """
    const storedQuote = safeGetItem('quote-seed')
    const parsedQuote = storedQuote !== null ? Number(storedQuote) : NaN
    const seed = Number.isInteger(parsedQuote) && parsedQuote >= 0 && parsedQuote < QUOTES.length
      ? parsedQuote
      : Math.floor(Math.random() * QUOTES.length)
    if (!Number.isInteger(parsedQuote) || parsedQuote < 0 || parsedQuote >= QUOTES.length) {
      safeSetItem('quote-seed', String(seed))
    }
    const dayOffset = Math.floor(Date.now() / 86400000)
    setQuote(QUOTES[(seed + dayOffset) % QUOTES.length])
"""
    content = content.replace('setMounted(true)\n  }, [articles])', quote_logic + '    setMounted(true)\n  }, [articles])')

# Fix the return null check
if 'if (!mounted ||' in content:
    content = content.replace('if (!mounted || (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0)) return null',
                              'if (!mounted || (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0)) return null')
else:
    content = content.replace('if (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0) return null',
                              'if (!mounted || (readCount === 0 && bookmarksCount === 0 && totalMinutes === 0 && streak === 0)) return null')


with open('src/components/DashboardBento.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
