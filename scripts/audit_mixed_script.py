#!/usr/bin/env python3
"""
Проверка смешения алфавитов внутри слова.

Зачем. Три реальных дефекта в корпусе были визуально неразличимы: «бавaруа»
(латинская «a» внутри кириллического слова), «energично» (латинское «energ»),
«крем пâтissière» (смешанное написание французского термина). Ни один
существующий гейт их не ловил: орфография не проверяется, ссылки целы, структура
валидна. Обнаружились они только побочной проверкой при другом проходе.

Правило. Внутри одного слова не должны соседствовать буквы кириллицы и латиницы.
Исключения — легитимные случаи, которые проверяются явно:
  * французские термины, написанные латиницей целиком (crème pâtissière), — в них
    смешения нет, поэтому они и не срабатывают;
  * дефисные пары вроде «CAP-пэтисье» — граница слова проходит по дефису;
  * числовые и символьные вставки.

Использование:
    python3 scripts/audit_mixed_script.py           # отчёт
    python3 scripts/audit_mixed_script.py --strict  # ненулевой код при находках
Exit code: 0 — смешений нет; 1 — найдены (--strict); 2 — ошибка запуска
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DATA = ROOT / "src" / "data"

CYR = "А-Яа-яЁё"
LAT = "A-Za-zÀ-ÿ"

# Слово = последовательность букв одного или другого алфавита, возможно
# перемежающихся. Смешением считается наличие обоих классов внутри одного слова.
WORD_RE = re.compile(rf"[{CYR}{LAT}]+(?:['’\-][{CYR}{LAT}]+)*")

MIXED_RE = re.compile(rf"(?=[{CYR}]*[{LAT}])(?=[{LAT}]*[{CYR}])")

# Легитимные смешения, которые смешениями не являются:
#   * файлы с регулярными выражениями — символьный класс [A-Za-zА-Яа-яЁё] обязан
#     содержать оба алфавита, это его назначение, а не опечатка;
#   * заимствование с кириллическим окончанием — «bestseller'ом», «l'эклер»;
#     апостроф здесь граница, а не часть слова.
CODE_FILES = {"library.ts"}
ALLOWED = {"bestseller'ом"}


# Дефис разделяет слова, поэтому «CAP-пэтисье» смешением не является: каждая
# часть проверяется отдельно.
def parts(word: str) -> list[str]:
    return [p for p in re.split(r"[\-]", word) if p]


def is_mixed(word: str) -> bool:
    for p in parts(word):
        core = re.sub(r"['’]", "", p)
        if not core:
            continue
        has_cyr = bool(re.search(f"[{CYR}]", core))
        has_lat = bool(re.search(f"[{LAT}]", core))
        if has_cyr and has_lat:
            return True
    return False


def scan() -> list[dict]:
    out = []
    for f in sorted(SRC_DATA.rglob("*.ts")):
        txt = f.read_text(encoding="utf-8")
        for m in WORD_RE.finditer(txt):
            w = m.group(0)
            if f.name in CODE_FILES or w in ALLOWED:
                continue
            if is_mixed(w):
                line = txt[:m.start()].count("\n") + 1
                out.append({
                    "file": str(f.relative_to(ROOT)),
                    "line": line,
                    "word": w,
                    "context": txt[max(0, m.start() - 60):m.end() + 60].replace("\n", " "),
                })
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="ненулевой код возврата при любой находке")
    a = ap.parse_args()

    found = scan()
    if a.json:
        print(json.dumps({"mixedScriptWords": len(found), "hits": found},
                         ensure_ascii=False, indent=1))
    else:
        print(f"слов со смешением алфавитов: {len(found)}")
        for h in found:
            print(f"\n[{h['file']}:{h['line']}] {h['word']!r}")
            print("   ", h["context"])
        if not found:
            print("смешений не найдено")
    return 1 if (a.strict and found) else 0


if __name__ == "__main__":
    sys.exit(main())
