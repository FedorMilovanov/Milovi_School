#!/usr/bin/env python3
"""
Проверка смешения алфавитов внутри слова.

Зачем. Три реальных дефекта в корпусе были визуально неразличимы: «бавaруа»
(латинская «a» внутри кириллического слова), «energично» (латинское «energ»),
«крем пâтissière» (смешанное написание французского термина). Ни один
существующий гейт их не ловил: орфография не проверяется, ссылки целы, структура
валидна. Обнаружились они только побочной проверкой при другом проходе.

Правило. Внутри одного слова не должны соседствовать буквы кириллицы и латиницы.
Исключения обязаны быть точечными: нельзя исключать файл целиком ради одной
легитимной строки кода, иначе опечатки в остальных строках этого файла становятся
невидимыми.

Использование:
    python3 scripts/audit_mixed_script.py --selftest # проверка самого детектора
    python3 scripts/audit_mixed_script.py            # отчёт
    python3 scripts/audit_mixed_script.py --strict   # ненулевой код при находках
Exit code: 0 — всё чисто; 1 — самотест/strict нашли проблему; 2 — ошибка запуска
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

WORD_RE = re.compile(rf"[{CYR}{LAT}]+(?:['’\-][{CYR}{LAT}]+)*")

# Легитимное смешение в source-коде должно исключаться максимально узко.
# library.ts содержит regex-символьный класс с обоими алфавитами по назначению;
# исключается только строка объявления WORD_RE, а не весь файл.
CODE_LINE_EXEMPTIONS: dict[str, tuple[re.Pattern[str], ...]] = {
    "library.ts": (re.compile(r"^\s*const\s+WORD_RE\s*=\s*/"),),
}

# Заимствование с кириллическим окончанием. Апостроф здесь языковая граница,
# а не опечатка внутри корня.
ALLOWED = {"bestseller'ом"}


def parts(word: str) -> list[str]:
    """Дефис разделяет части: CAP-пэтисье не является смешанным словом."""
    return [part for part in re.split(r"[\-]", word) if part]


def is_mixed(word: str) -> bool:
    for part in parts(word):
        core = re.sub(r"['’]", "", part)
        if not core:
            continue
        has_cyr = bool(re.search(f"[{CYR}]", core))
        has_lat = bool(re.search(f"[{LAT}]", core))
        if has_cyr and has_lat:
            return True
    return False


def should_flag(word: str) -> bool:
    return word not in ALLOWED and is_mixed(word)


def source_line(text: str, offset: int) -> str:
    start = text.rfind("\n", 0, offset) + 1
    end = text.find("\n", offset)
    if end < 0:
        end = len(text)
    return text[start:end]


def line_is_exempt(path: Path, line: str) -> bool:
    return any(pattern.search(line) for pattern in CODE_LINE_EXEMPTIONS.get(path.name, ()))


def scan() -> list[dict[str, object]]:
    out: list[dict[str, object]] = []
    for file_path in sorted(SRC_DATA.rglob("*.ts")):
        text = file_path.read_text(encoding="utf-8")
        for match in WORD_RE.finditer(text):
            word = match.group(0)
            line_text = source_line(text, match.start())
            if line_is_exempt(file_path, line_text) or not should_flag(word):
                continue
            line = text[:match.start()].count("\n") + 1
            out.append({
                "file": str(file_path.relative_to(ROOT)),
                "line": line,
                "word": word,
                "context": text[max(0, match.start() - 60):match.end() + 60].replace("\n", " "),
            })
    return out


def run_selftest() -> int:
    positives = (
        "бавaруа",
        "energично",
        "пâтissière",
        "Прeальпато",
        "Macaronную",
    )
    negatives = (
        "crème",
        "pâtissière",
        "патон",
        "CAP-пэтисье",
        "Pierre-Hermé",
        "bestseller'ом",
    )

    failures: list[str] = []
    for word in positives:
        if not should_flag(word):
            failures.append(f"expected mixed-script hit: {word!r}")
    for word in negatives:
        if should_flag(word):
            failures.append(f"unexpected mixed-script hit: {word!r}")

    regex_line = "const WORD_RE = /[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+/g"
    prose_line = "const note = 'Прeальпато'"
    if not line_is_exempt(Path("library.ts"), regex_line):
        failures.append("library.ts WORD_RE declaration must be narrowly exempt")
    if line_is_exempt(Path("library.ts"), prose_line):
        failures.append("library.ts prose/content must not inherit the code-line exemption")
    if line_is_exempt(Path("articles.ts"), regex_line):
        failures.append("WORD_RE-style exemption must not apply to other files")

    if failures:
        print(f"mixed-script selftest: FAIL ({len(failures)} failures)", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    print(
        "mixed-script selftest: OK "
        f"({len(positives)} positive, {len(negatives)} negative, 3 exemption cases)"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--strict", action="store_true",
                        help="ненулевой код возврата при любой находке")
    parser.add_argument("--selftest", action="store_true",
                        help="проверить положительные/отрицательные фикстуры детектора")
    args = parser.parse_args()

    if args.selftest:
        return run_selftest()

    found = scan()
    if args.json:
        print(json.dumps({"mixedScriptWords": len(found), "hits": found},
                         ensure_ascii=False, indent=1))
    else:
        print(f"слов со смешением алфавитов: {len(found)}")
        for hit in found:
            print(f"\n[{hit['file']}:{hit['line']}] {hit['word']!r}")
            print("   ", hit["context"])
        if not found:
            print("смешений не найдено")
    return 1 if (args.strict and found) else 0


if __name__ == "__main__":
    sys.exit(main())
