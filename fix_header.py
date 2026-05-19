import re

with open("src/components/Header.tsx", "r") as f:
    content = f.read()

# Replace href="/#articles" with href="/materials/" and remove preventDefault() so it actually navigates if we are on HomeApp
# Actually, the easiest way is to let onGoArticles handle it, but in HomeApp, onGoArticles is passed as: onGoArticles={() => scrollToSection('articles')}
# But 'articles' id is removed from HomeApp! So clicking it will do nothing.
# Let's change onGoArticles in HomeApp to navigate to /materials/, and remove 'articles' section from HomeApp.

with open("src/components/Header.tsx", "w") as f:
    f.write(content)
