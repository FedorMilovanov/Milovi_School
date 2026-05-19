import re

with open("HomeApp_old.tsx", "r") as f:
    old_content = f.read()

with open("src/components/HomeApp.tsx", "r") as f:
    current_content = f.read()

# Restore imports
if "import ArticlesGrid from './ArticlesGrid'" not in current_content:
    current_content = current_content.replace("import Categories from './Categories'", "import Categories from './Categories'\nimport ArticlesGrid from './ArticlesGrid'")

if "import Fuse" not in current_content:
    current_content = current_content.replace("import { safeSetItem }", "import Fuse, { type FuseResultMatch } from 'fuse.js'\nimport { safeSetItem }")

if "ARTICLE_FUSE_OPTIONS" not in current_content:
    current_content = current_content.replace("import { navigateTo }", "import { ARTICLE_FUSE_OPTIONS } from '../utils/search'\nimport { navigateTo }")

# Restore state variables
use_memo_block = """
  const nonEmptyCategories = useMemo(() => {
    const articleCategoryIds = new Set(articles.map(a => a.category))
    return categories.filter(c => articleCategoryIds.has(c.id))
  }, [articles])
"""

if "nonEmptyCategories = useMemo" not in current_content:
    current_content = current_content.replace("const statsArticleCount =", use_memo_block + "\n  const statsArticleCount =")

fuse_block = """
  const fuse = useMemo(() => new Fuse(articles, ARTICLE_FUSE_OPTIONS), [articles])

  const { filteredArticles, matchMap } = useMemo(() => {
    const byCategory = selectedCategory
      ? selectedCategory === 'chefs'
        ? articles.filter(a => CHEF_IDS.has(a.category))
        : articles.filter(a => a.category === selectedCategory)
      : articles

    if (!searchQuery.trim()) {
      return { filteredArticles: byCategory, matchMap: new Map() }
    }

    const results = fuse.search(searchQuery.trim())
    const map = new Map(results.map(r => [r.item.id, r.matches ?? []]))

    const filtered = selectedCategory
      ? selectedCategory === 'chefs'
        ? results.filter(r => CHEF_IDS.has(r.item.category)).map(r => r.item)
        : results.filter(r => r.item.category === selectedCategory).map(r => r.item)
      : results.map(r => r.item)

    return { filteredArticles: filtered, matchMap: map }
  }, [articles, selectedCategory, searchQuery, fuse])
"""

if "const fuse = useMemo" not in current_content:
    # insert before handleSearchChange
    current_content = current_content.replace("const handleSearchChange = useCallback", fuse_block + "\n  const handleSearchChange = useCallback")

# Restore ArticlesGrid in JSX, but conditionally
grid_block = """
          {(searchQuery.trim() !== '' || selectedCategory !== null) && (
            <ArticlesGrid
              articles={filteredArticles}
              allArticles={articles}
              categories={nonEmptyCategories}
              onArticleClick={openArticle}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              searchQuery={searchQuery}
              matchMap={matchMap as Map<string, ReadonlyArray<FuseResultMatch>>}
            />
          )}
"""

if "<ArticlesGrid" not in current_content:
    current_content = current_content.replace("<DashboardBento", grid_block + "\n          <DashboardBento")

with open("src/components/HomeApp.tsx", "w") as f:
    f.write(current_content)
