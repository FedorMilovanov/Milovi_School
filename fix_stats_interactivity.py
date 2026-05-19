import re

with open("src/components/StatsBar.tsx", "r") as f:
    content = f.read()

# Restore StatsBar to use interactive-text section-title-lux and id="stats"
section_pattern = re.compile(r'<section className="border-y border-\[var\(--border-subtle\)\] bg-\[var\(--bg-deep\)\]">')
content = section_pattern.sub('<section id="stats" className="border-y border-[var(--border-subtle)] bg-[var(--bg-deep)]">', content)

number_span_pattern = re.compile(r'<span\s+ref=\{ref\}\s+className="font-serif text-4xl font-semibold tracking-\[-0.04em\] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl luxury-color-text section-title-lux"\s+data-tone="section"\s*>\s*\{\(`\$\{prefix\}\$\{count\}\$\{suffix\}`\)\.split\(\'\'\)\.map\(\(char, i\) => \(\s*<span className="luxury-letter" key=\{`\$\{char\}-\$\{i\}`\} aria-hidden="true">\{char\}</span>\s*\)\)\}\s*</span>', re.DOTALL)

replacement = """<span
        ref={ref}
        className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl section-title-lux"
      >
        {prefix}{count}{suffix}
      </span>"""

content = number_span_pattern.sub(replacement, content)

with open("src/components/StatsBar.tsx", "w") as f:
    f.write(content)

with open("src/components/Cursor.tsx", "r") as f:
    cursor_content = f.read()

# Add #stats .section-title-lux to interactiveSelectors
sel_pattern = re.compile(r"'#categories .section-title-lux',\s*'#archive .section-title-lux',\s*'#materials .section-title-lux',")
cursor_content = sel_pattern.sub("'#categories .section-title-lux',\n      '#archive .section-title-lux',\n      '#materials .section-title-lux',\n      '#stats .section-title-lux',", cursor_content)

with open("src/components/Cursor.tsx", "w") as f:
    f.write(cursor_content)
