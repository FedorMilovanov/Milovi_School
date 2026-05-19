import re

with open("src/components/StatsBar.tsx", "r") as f:
    content = f.read()

replacement = """      <span
        ref={ref}
        className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl luxury-color-text section-title-lux"
        data-tone="section"
      >
        {(`${prefix}${count}${suffix}`).split('').map((char, i) => (
          <span className="luxury-letter" key={`${char}-${i}`} aria-hidden="true">{char}</span>
        ))}
      </span>"""

content = re.sub(
    r'<span\s+ref={ref}\s+className="font-serif text-4xl font-semibold tracking-\[-0.04em\] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl"\s*>\s*\{prefix\}\{count\}\{suffix\}\s*</span>',
    replacement,
    content,
    flags=re.MULTILINE
)

with open("src/components/StatsBar.tsx", "w") as f:
    f.write(content)
