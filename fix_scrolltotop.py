with open('src/components/ScrollToTop.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the visibility delay issue
content = content.replace(
"""  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(document.documentElement.scrollTop > 600)
  }, [progress])""",
"""  const visible = progress > 5"""
)

# Fix the bottom offset for desktop (VIS-H-1)
content = content.replace(
"          className=\"fixed right-4 z-40 flex h-12 w-12 items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-overlay-95)] text-stone-600 shadow-lg backdrop-blur-sm transition hover:border-stone-400 hover:text-stone-950 active:scale-95 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-amber-100\"\n          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}",
"          className=\"fixed right-4 max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 z-40 flex h-12 w-12 items-center justify-center border border-[var(--border-subtle)] bg-[var(--bg-overlay-95)] text-stone-600 shadow-lg backdrop-blur-sm transition hover:border-stone-400 hover:text-stone-950 active:scale-95 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:text-amber-100\""
)

with open('src/components/ScrollToTop.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
