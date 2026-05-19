import re

with open("src/styles/global.css", "r") as f:
    content = f.read()

# I will replace the entire .cat-img-card-lux section with standard scale and brightness.
# The user wants "stylish black and showing the card title" which is handled by the gradient in JSX and the brightness here.

pattern = re.compile(r'\.cat-img-card-lux \.cat-card-img-wrap-lux \{.*?\/\* На touch не нужен fade — оставляем картинку видимой\. \*\/\s*@media \(hover: none\) and \(pointer: coarse\) \{\s*\.cat-img-card-lux:active \{ transform: scale\(0\.98\); \}\s*\}', re.DOTALL)

replacement = """
.cat-img-card-lux .cat-card-img-wrap-lux {
  position: relative;
  overflow: hidden;
  background: var(--bg-deep);
}
.cat-img-card-lux .cat-card-img-lux {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.65s cubic-bezier(0.23, 1, 0.32, 1),
              filter 0.65s ease;
  position: relative;
  z-index: 1;
}
@media (prefers-reduced-motion: no-preference) and (hover: hover) {
  .cat-img-card-lux:hover .cat-card-img-lux {
    transform: scale(1.04);
    /* No blur or opacity fade, just standard brightness like original */
  }
}
@media (hover: none) and (pointer: coarse) {
  .cat-img-card-lux:active { transform: scale(0.98); }
}
"""

content = pattern.sub(replacement.strip(), content)

with open("src/styles/global.css", "w") as f:
    f.write(content)
