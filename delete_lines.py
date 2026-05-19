import re

with open("src/components/HomeApp.tsx", "r") as f:
    content = f.read()

# Pattern to remove <Categories ... /> and <ArticlesGrid ... />
pattern = re.compile(r'<Categories[\s\S]*?/>\s*<ArticlesGrid[\s\S]*?/>', re.MULTILINE)
content = pattern.sub('', content)

with open("src/components/HomeApp.tsx", "w") as f:
    f.write(content)
