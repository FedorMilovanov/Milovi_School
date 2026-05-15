const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleView.tsx', 'utf8');

const oldTocBtn = `              <button
                type="button"
                onClick={() => setTocOpen(v => !v)}
                className="haptic-btn flex w-full select-none items-center justify-between px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-stone-950 dark:text-stone-100"
              >`;

const newTocBtn = `              <button
                type="button"
                onClick={() => setTocOpen(v => !v)}
                aria-expanded={tocOpen}
                aria-controls="mobile-toc-list"
                className="haptic-btn flex w-full select-none items-center justify-between px-5 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-stone-950 dark:text-stone-100"
              >`;

code = code.replace(oldTocBtn, newTocBtn);

const oldScroll = `                          onClick={() => {
                            setTocOpen(false)
                            requestAnimationFrame(() => {
                              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            })
                          }}`;

const newScroll = `                          onClick={() => {
                            setTocOpen(false)
                            setTimeout(() => {
                              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }, 280)
                          }}`;

code = code.replace(oldScroll, newScroll);
code = code.replace('<motion.ol', '<motion.ol id="mobile-toc-list"');

fs.writeFileSync('src/components/ArticleView.tsx', code);
