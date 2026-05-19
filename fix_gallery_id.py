import re

with open("src/components/gallery/GalleryApp.tsx", "r") as f:
    content = f.read()

content = content.replace('<main className="py-24 transition-colors bg-[var(--bg-deep)]">', '<main id="materials" className="py-24 transition-colors bg-[var(--bg-deep)]">')

with open("src/components/gallery/GalleryApp.tsx", "w") as f:
    f.write(content)
