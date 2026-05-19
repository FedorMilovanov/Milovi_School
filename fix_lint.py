import re

with open("src/components/HomeApp.tsx", "r") as f:
    content = f.read()

# remove unused variables in HomeApp.tsx
content = re.sub(r"const nonEmptyCategories = useMemo\(\(\) => \{[\s\S]*?\}, \[articles\]\)", "", content)
content = re.sub(r"const \{ filteredArticles, matchMap \} = useMemo\(\(\) => \{[\s\S]*?\}, \[articles, selectedCategory, searchQuery, fuse\]\)", "", content)
content = re.sub(r"const handleSearchChange = useCallback\(\(query: string\) => \{[\s\S]*?\}, \[syncUrlQuery\]\)", "", content)
# goToChefs is used! wait, is goToChefs used? Let's check:
#   onGoCategories={() => scrollToSection('categories')} -> Yes, goToChefs is unused because I inline replaced it!
content = re.sub(r"const goToChefs = useCallback\(\(\) => \{[\s\S]*?\}, \[scrollToSection, syncUrlQuery\]\)", "", content)
content = re.sub(r"import Fuse, \{ type FuseResultMatch \} from 'fuse.js'", "import Fuse from 'fuse.js'", content)

with open("src/components/HomeApp.tsx", "w") as f:
    f.write(content)
