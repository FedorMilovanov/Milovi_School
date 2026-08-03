#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

count=0
failures=0

pass() { count=$((count + 1)); printf '✓ [%02d] %s\n' "$count" "$1"; }
fail() { count=$((count + 1)); failures=$((failures + 1)); printf '✗ [%02d] %s\n' "$count" "$1" >&2; }
check() { local name="$1"; shift; if "$@"; then pass "$name"; else fail "$name"; fi; }
contains() { local pattern="$1"; shift; grep -REq -- "$pattern" "$@"; }
not_contains() { local pattern="$1"; shift; ! grep -REn -- "$pattern" "$@" >/dev/null; }

no_tracked_path() {
  local forbidden="$1"
  python3 - "$forbidden" <<'PYTRACK'
from pathlib import PurePosixPath
import subprocess
import sys

forbidden = sys.argv[1]
tracked = subprocess.check_output(['git', 'ls-files', '-z']).decode('utf-8').split('\0')
bad = [path for path in tracked if path and forbidden in PurePosixPath(path).parts]
if bad:
    print(f'Tracked {forbidden} paths:', ', '.join(bad))
    raise SystemExit(1)
PYTRACK
}

same_react_major() {
  node -e "const p=require('./package.json'); const m=v=>String(v).match(/(\\d+)/)?.[1]; process.exit(m(p.dependencies.react)===m(p.dependencies['react-dom'])?0:1)"
}

no_nul_sources() {
  python3 - <<'PY'
from pathlib import Path
bad=[]
text_suffixes={'.ts','.tsx','.astro','.js','.mjs','.cjs','.css','.json','.md','.txt','.xml','.svg','.html','.yml','.yaml','.sh','.py','.ps1'}
for root in map(Path, ('src','public','scripts','.github')):
    for path in root.rglob('*'):
        if path.is_file() and path.suffix.lower() in text_suffixes and b'\0' in path.read_bytes():
            bad.append(path.as_posix())
if bad:
    print('NUL bytes:', ', '.join(bad))
    raise SystemExit(1)
PY
}

safe_blank_links() {
  python3 - <<'PY'
from pathlib import Path
import re
bad=[]
for path in Path('src').rglob('*'):
    if path.suffix not in {'.astro','.tsx','.ts','.html'}:
        continue
    text=path.read_text('utf-8')
    for match in re.finditer(r'<a\b[^>]*target=["\']_blank["\'][^>]*>', text, re.I):
        tag=match.group(0)
        if not re.search(r'rel=["\'][^"\']*noopener[^"\']*noreferrer[^"\']*["\']', tag, re.I):
            bad.append(f'{path}:{text.count(chr(10),0,match.start())+1}')
if bad:
    print('Unsafe blank links:', ', '.join(bad))
    raise SystemExit(1)
PY
}

one_executable_sw_placeholder() {
  python3 - <<'PY'
from pathlib import Path
text=Path('public/sw.js').read_text('utf-8')
code='\n'.join(line for line in text.splitlines() if not line.lstrip().startswith('*'))
raise SystemExit(0 if code.count('__BUILD_HASH__') == 1 else 1)
PY
}

switch_delay_is_shorter() {
  python3 - <<'PY'
from pathlib import Path
import re
text=Path('src/components/gallery/GalleryApp.tsx').read_text('utf-8')
initial=int(re.search(r'INITIAL_HOVER_DELAY = (\d+)', text).group(1))
switch=int(re.search(r'SWITCH_HOVER_DELAY = (\d+)', text).group(1))
raise SystemExit(0 if 0 < switch < initial else 1)
PY
}

all_actions_pinned() {
  python3 - <<'PY'
from pathlib import Path
import re
bad=[]
for path in Path('.github/workflows').glob('*.yml'):
    for number,line in enumerate(path.read_text('utf-8').splitlines(),1):
        match=re.search(r'^\s*uses:\s*([^#\s]+)', line)
        if not match or match.group(1).startswith('./'):
            continue
        ref=match.group(1).rsplit('@',1)[-1]
        if not re.fullmatch(r'[0-9a-f]{40}', ref, re.I):
            bad.append(f'{path}:{number}:{match.group(1)}')
if bad:
    print('Unpinned actions:', ', '.join(bad))
    raise SystemExit(1)
PY
}

all_shell_scripts_parse() {
  local file
  for file in scripts/*.sh; do bash -n "$file"; done
}

all_checkout_pins_current() {
  local line count=0
  while IFS= read -r line; do
    count=$((count + 1))
    [[ "$line" == *'de0fac2e4500dabe0009e67214ff5f5447ce83dd'* ]] || return 1
  done < <(grep -RHE 'actions/checkout@' .github/workflows)
  (( count > 0 ))
}

all_setup_node_pins_current() {
  local line count=0
  while IFS= read -r line; do
    count=$((count + 1))
    [[ "$line" == *'48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e'* ]] || return 1
  done < <(grep -RHE 'actions/setup-node@' .github/workflows)
  (( count > 0 ))
}

lockfile_matches_manifest() {
  node -e "const p=require('./package.json'),l=require('./package-lock.json'); process.exit(l.name===p.name&&l.version===p.version?0:1)"
}

check 'Gallery source exists' test -f src/components/gallery/GalleryApp.tsx
check 'Gallery stylesheet exists' test -f src/styles/global.css
check 'Astro configuration exists' test -f astro.config.mjs
check 'Package manifest exists' test -f package.json
check 'Lockfile exists' test -f package-lock.json
check 'Raw build audit exists' test -f scripts/audit_raw_build.mjs
check 'Generated gallery audit exists' test -f scripts/audit_gallery_generated.mjs
check 'Duplicate generated-gallery audit has been removed' test ! -e scripts/audit_generated_gallery_html.mjs
check 'Playwright interaction audit exists' test -f scripts/audit_gallery_preview.mjs
check 'Post-build HTML mutator has been removed' test ! -e scripts/fix_generated_html.mjs
check 'No production code or workflow references the removed mutator' not_contains 'fix_generated_html' package.json .github README.md AGENTS.md
check 'Production build is a direct Astro build' node -e "const p=require('./package.json'); process.exit(p.scripts.build==='astro build'?0:1)"
check 'Validation includes the raw build audit' node -e "const p=require('./package.json'); process.exit(p.scripts.validate.includes('audit:build')?0:1)"
check 'React SSR uses Astro non-streaming compatibility mode' contains 'experimentalDisableStreaming: true' astro.config.mjs
check 'React and React DOM stay on the same major range' same_react_major
check 'Project metadata matches Astro 7' node -e "const p=require('./package.json'); process.exit(String(p.devDependencies.astro).startsWith('7.')?0:1)"
check 'No tracked source file contains NUL bytes' no_nul_sources
check 'Generated output is not committed' no_tracked_path dist
check 'Dependencies are not committed' no_tracked_path node_modules
check 'Astro cache is not committed' no_tracked_path .astro
check 'Deep article bodies stay out of client components' not_contains "deepContents|from ['\"].*/data/(articles|library)['\"]" src/components
check 'Astro ClientRouter remains disabled' not_contains "from ['\"]astro:transitions|<ClientRouter" src
check 'No dynamic code execution is used in shipped code' not_contains '\beval\s*\(|new Function' src public
check 'External blank-target links carry noopener and noreferrer' safe_blank_links
check 'Service worker keeps exactly one executable build placeholder' one_executable_sw_placeholder
check 'Gallery starts from the brand dark theme' contains "useState<'light' \| 'dark'>\('dark'\)" src/components/gallery/GalleryApp.tsx
check 'Materials header action is functional rather than a no-op' contains 'onGoArticles=\{goMaterials\}' src/components/gallery/GalleryApp.tsx
check 'No empty materials header callback remains' not_contains 'onGoArticles=\{\(\) => \{\}\}' src/components/gallery/GalleryApp.tsx
check 'Initial preview delay is explicit' contains 'INITIAL_HOVER_DELAY = 320' src/components/gallery/GalleryApp.tsx
check 'Card replacement delay is shorter than initial delay' switch_delay_is_shorter
check 'Hover dwell timer is keyed by card and not reset on every move' contains 'hoverTimerIndexRef.current === index' src/components/gallery/GalleryApp.tsx
check 'Preview capability requires fine hover pointer and desktop width' contains '\(hover: hover\) and \(pointer: fine\) and \(min-width: 1024px\)' src/components/gallery/GalleryApp.tsx
check 'Preview does not open from focus' not_contains 'onFocus=.*openPreview|onFocus=.*commitPreview|keyboardNavigationRef' src/components/gallery/GalleryApp.tsx
check 'Preview closes on actual document scroll' contains "addEventListener\('scroll', handleScroll" src/components/gallery/GalleryApp.tsx
check 'Synthetic wheel movement does not close preview' not_contains "addEventListener\('wheel'|onWheel" src/components/gallery/GalleryApp.tsx
check 'Preview closes on Escape' contains "event.key === 'Escape'" src/components/gallery/GalleryApp.tsx
check 'Preview closes when the window loses focus' contains "addEventListener\('blur', handleWindowBlur" src/components/gallery/GalleryApp.tsx
check 'Preview closes when the document becomes hidden' contains "addEventListener\('visibilitychange', handleVisibilityChange" src/components/gallery/GalleryApp.tsx
check 'Clicking a gallery gap is treated as outside click' contains "target.closest\('\[data-gallery-index\]'\)" src/components/gallery/GalleryApp.tsx
check 'Explicit close suppresses the current card' contains 'suppressedCardRef.current = activeCardRef.current \?\? previewIndexRef.current' src/components/gallery/GalleryApp.tsx
check 'Suppression is released when the pointer leaves that card' contains 'suppressedCardRef.current === index.*suppressedCardRef.current = null' src/components/gallery/GalleryApp.tsx
check 'Suppression is released after real pointer movement outside the card' contains 'releaseSuppressionOutsideCard' src/components/gallery/GalleryApp.tsx
check 'No arbitrary post-close time lock remains' not_contains 'hoverLockUntil|performance.now\(\) \+ 450' src/components/gallery/GalleryApp.tsx
check 'Arrow and button navigation preserve panel dock' contains 'openPreview\(next\)' src/components/gallery/GalleryApp.tsx
check 'Direct card hover supplies an anchor for dock calculation' contains 'schedulePreview\(index, event.currentTarget\)' src/components/gallery/GalleryApp.tsx
check 'Transient hover preview does not misuse disclosure ARIA' not_contains 'aria-expanded|aria-controls' src/components/gallery/GalleryApp.tsx
check 'Preview region references its visible heading' contains 'aria-labelledby=\{`gallery-preview-title-\$\{previewArticle.id\}`\}' src/components/gallery/GalleryApp.tsx
check 'Preview heading provides the referenced id' contains 'id=\{`gallery-preview-title-\$\{previewArticle.id\}`\}' src/components/gallery/GalleryApp.tsx
check 'Preview does not announce the whole panel as a live region' not_contains 'aria-live|aria-atomic' src/components/gallery/GalleryApp.tsx
check 'Read action is a real article link' contains 'className="gallery-preview-read"' src/components/gallery/GalleryApp.tsx
check 'Normal cards retain real article hrefs' contains 'href=\{`/articles/\$\{article.id\}/`\}' src/components/gallery/GalleryApp.tsx
check 'Card navigation is not intercepted with preventDefault' not_contains 'preventDefault\(\).*openArticle\(article\)' src/components/gallery/GalleryApp.tsx
check 'Decorative card arrow is hidden from assistive technology' contains 'aria-hidden="true" className="flex h-6 w-6' src/components/gallery/GalleryApp.tsx
check 'Reduced motion disables preview animation' contains '\.gallery-preview-image \{ animation: none; \}' src/styles/global.css
check 'Gallery images do not emit sizes without srcset' not_contains '\bsizes=' src/components/gallery/GalleryApp.tsx
check 'All third-party workflow actions are pinned to full SHAs' all_actions_pinned
check 'Checkout action is pinned to current v6.0.2 commit' all_checkout_pins_current
check 'Setup Node action is pinned to current v6.4.0 commit' all_setup_node_pins_current
check 'Pages artifact action is pinned to current Node 24 v5 commit' contains 'actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9' .github/workflows/deploy.yml
check 'Pages deploy action is pinned to current Node 24 v5.0.0 commit' contains 'actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128' .github/workflows/deploy.yml
check 'Gallery quality gate runs on pull requests' contains '^  pull_request:' .github/workflows/gallery-quality.yml
check 'External live audit is restricted to deployed main pushes' contains "if: github.event_name == 'push' && github.ref == 'refs/heads/main'" .github/workflows/gallery-quality.yml
check 'Core validation workflows do not request contents write' not_contains 'contents:[[:space:]]*write' .github/workflows/ci.yml .github/workflows/gallery-quality.yml .github/workflows/deep-polish-audit.yml .github/workflows/repository-hygiene.yml
check 'All shell audit files parse successfully' all_shell_scripts_parse
check 'Package JSON is valid' node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
check 'Lockfile metadata matches package name and version' lockfile_matches_manifest

printf '\nRepository and gallery contract audit: %d checks, %d failure(s).\n' "$count" "$failures"
(( failures == 0 ))
