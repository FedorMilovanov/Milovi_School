import re

with open("src/components/StatsBar.tsx", "r") as f:
    content = f.read()

content = content.replace('className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl section-title-lux"', 
                          'className="font-serif text-4xl font-semibold tracking-[-0.04em] text-stone-950 dark:text-stone-100 sm:text-5xl lg:text-6xl section-title-lux transition-transform duration-500 group-hover:scale-[1.15]"')

with open("src/components/StatsBar.tsx", "w") as f:
    f.write(content)
