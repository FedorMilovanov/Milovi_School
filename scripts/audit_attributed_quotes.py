#!/usr/bin/env python3
"""
Аудит приписанных цитат.

Зачем. Дефект, найденный в §7.15 журнала (статья recipe-eclairs-adam): текст в
кавычках-ёлочках, подписанный реальным живым человеком, которого в открытых
источниках нет. Гейт живости ссылок его не видит в принципе — при цитате нет
URL, проверять нечего. Это единственный класс фактологических утверждений в
корпусе, который ничем не контролировался.

Что делает. Находит прямую речь (фрагмент в «ёлочках» длиной не короче порога),
за которой в пределах небольшого окна идёт атрибуция персоналии — через тире,
маркер цитирования `>` или запятую с должностью. Для каждой такой пары
проверяется, есть ли рядом источник:

  1. URL в том же окне после цитаты (цитата, подкреплённая ссылкой);
  2. явная атрибуция посреднику в самой цитате или рядом («по данным …»,
     «как писал …», «в интервью …») — тогда утверждение уже fail-closed;
  3. отсутствие и того, и другого — голые слова в устах человека. Это и есть
     дефект: либо цитата настоящая и нужен источник, либо её быть не должно.

Отчёт сортируется по риску: чем длиннее цитата и чем конкретнее назван человек,
тем выше приоритет проверки.

Использование:
    python3 scripts/audit_attributed_quotes.py            # отчёт по всему корпусу
    python3 scripts/audit_attributed_quotes.py --json     # машиночитаемый вывод
    python3 scripts/audit_attributed_quotes.py --id X     # только статья X
    python3 scripts/audit_attributed_quotes.py --strict   # ненулевой код, если
                                                          # есть цитаты без источника
Exit code: 0 — все приписанные цитаты подкреплены или захежированы
           1 — найдены цитаты, приписанные персоналии без источника (--strict)
           2 — ошибка запуска
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DATA = ROOT / "src" / "data"

# Минимальная длина цитаты: короткие вкрапления («oui», «M.O.F.») не несут
# самостоятельного утверждения и дают только шум.
MIN_QUOTE = 45

# Окно после закрывающей кавычки, в котором ищется атрибуция.
ATTR_WINDOW = 160

# Окно вокруг цитаты, в котором ищется источник.
SOURCE_WINDOW = 700

# Кавычки-ёлочки. Вложенные кавычки внутри считаем частью цитаты.
QUOTE_RE = re.compile(r"«([^«»]{%d,}?)»" % MIN_QUOTE, re.S)

# Атрибуция персоналии после цитаты.
ATTR_RES = (
    # «— Имя Фамилия» / «– Имя»
    re.compile(r"\s*[—–-]\s*([A-ZА-ЯЁ][\w'’\-\.À-ÿ]{1,40}(?:\s+[A-ZА-ЯЁ][\w'’\-\.À-ÿ]{1,40}){0,3})"),
    # «> Имя Фамилия» — markdown-цитирование
    re.compile(r"\n?>\s*([A-ZА-ЯЁ][\w'’\-\.À-ÿ]{1,40}(?:\s+[A-ZА-ЯЁ][\w'’\-\.À-ÿ]{1,40}){0,3})"),
    # «говорит Имя», «отмечает Имя», «по словам Имени»
    re.compile(r"(?:говорит|отмечает|заявил|признаётся|по словам|пишет)\s+([A-ZА-ЯЁ][\w'’\-\.À-ÿ]{1,40})"),
)

URL_RE = re.compile(r"https?://[^\s\)\"'`\]]+")

# Маркеры, означающие, что утверждение уже атрибутировано посреднику и потому
# fail-closed: проект не выдаёт это за собственный факт.
HEDGE_RE = re.compile(
    r"по данным|согласно|по словам|как писал|как пишет|в интервью|в книге|в своей книге|"
    r"по версии|по легенде|легенда гласит|утверждает|заявляет|подчёркивает|отмечает|"
    r"рассказал|рассказывает|цитиру|пересказ|изда(ние|тельств)о сообщает|"
    r"selon|d'après|explique|raconte|affirme|déclare",
    re.I,
)

# Служебные подписи, которые выглядят как атрибуция, но ею не являются:
# это названия учреждений, изданий и документов, а не речь человека.
NON_PERSON_RE = re.compile(
    r"^(Larousse|Le\s|La\s|Les\s|Institut|Académie|Ministère|Relais|Union|Fédération|"
    r"Michelin|Gault|Vanity|Vogue|Wikipedia|Chef\s|Le\sMonde|Figaro|Sud\sOuest|"
    r"Éditions|Actes|Flammarion|Hachette|La\sMartinière|Journal\sOfficiel|INSEE|"
    r"CAP|MOF|UIBC|50\sBest|World|Guide)\b",
    re.I,
)

# Учреждения и дома: атрибуция им — тоже утверждение, но риск ниже, чем слова,
# вложенные в уста конкретного живого человека.
INSTITUTION_RE = re.compile(
    r"\b(дом|maison|Дом|Maison|отель|Hôtel|ресторан|бутик|школа|институт|издательство|"
    r"компани|бренд|марка|сайт|газета|журнал)\b",
    re.I,
)

# Первая личность в цитате: «я», «мы», повелительное наклонение. Это прямая речь,
# и если она приписана человеку без источника — тот самый дефект §7.15.
FIRST_PERSON_RE = re.compile(
    r"\b(я|мне|меня|мой|моя|моё|мое|мы|нас|наш|наша|наше|считаю|думаю|хочу|люблю|"
    r"трачу|делаю|искал|нашёл|попробуйте|возьмите|не\s+делайте|je|j'|nous|mon|ma|mes)\b",
    re.I,
)


def looks_like_heading(name: str) -> bool:
    """Отсеивает подписи, которые на деле — заголовки разделов в капслоке."""
    core = re.sub(r"[^\wÀ-ÿА-ЯЁа-яё'’\-]", "", name)
    if not core:
        return True
    upper = sum(1 for c in core if c.isupper())
    letters = sum(1 for c in core if c.isalpha())
    if letters and upper / letters > 0.8:          # ЛИЧИ, БРЮЛЕ, DÉTREMPE
        return True
    if " " not in core and not any(c.islower() for c in core[:1]):
        return False
    # одно слово с заглавной буквы без фамилии — скорее заголовок, чем персона
    if " " not in core.strip() and len(core) < 12 and not core[0].isupper():
        return True
    return False


def article_ids() -> list[str]:
    txt = (SRC_DATA / "articles.ts").read_text(encoding="utf-8")
    return re.findall(r"id:\s*'([a-z0-9\-]+)'", txt)


# Слова, которые структурно похожи на подпись, но именами не являются: названия
# изданий, документов и типов изделий. Отдельный список не нужен — они отсекаются
# словарём персоналий, собранным из самого корпуса.
PERSON_VOCAB: set[str] | None = None


def person_vocab() -> set[str]:
    """Словарь персоналий, собранный из корпуса.

    Берутся три источника, все внутренние, поэтому список не устаревает сам:
      * поля author: в articles.ts — латинские написания (Christophe Adam,
        Pierre Hermé);
      * заголовки статей — русские написания тех же людей (Кристоф Адам,
        Пьер Эрме);
      * id статей — латинские фамилии (herme-, conticini-, couvreur-).
    Токен засчитывается, если начинается с заглавной и длиннее двух букв.
    """
    global PERSON_VOCAB
    if PERSON_VOCAB is not None:
        return PERSON_VOCAB
    txt = (SRC_DATA / "articles.ts").read_text(encoding="utf-8")
    vocab: set[str] = set()
    for field in ("author", "title"):
        for raw in re.findall(field + r":\s*'((?:[^'\\]|\\.)*)'", txt):
            for w in re.findall(r"[A-ZÀ-ŸА-ЯЁ][\w'’\-À-ÿ]{2,}", raw.replace("\\'", "'")):
                vocab.add(w)
    for aid in re.findall(r"id:\s*'([a-z0-9\-]+)'", txt):
        for part in aid.split("-"):
            if len(part) > 2:
                vocab.add(part.capitalize())
    PERSON_VOCAB = vocab
    return vocab


def is_known_person(name: str) -> bool:
    """Одиночное слово — фамилия только если оно известно корпусу.

    Без этого правила подписью считается любое слово после тире: «Минимально»,
    «Пюре», «Détrempe», «Брест» — это заголовки разделов, попавшие в окно
    атрибуции. Многословные подписи («Филипп Контисини», «Дом Dalloyau»)
    пропускаются по структуре, одиночные — только через словарь.
    """
    vocab = person_vocab()
    tokens = [w for w in re.split(r"[\s\.\,]+", name) if w]
    if not tokens:
        return False
    if len(tokens) >= 2:
        return True
    w = tokens[0]
    return w in vocab or w.lower() in {v.lower() for v in vocab}


def load_blocks() -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for f in [SRC_DATA / "deepContents.ts", *sorted((SRC_DATA / "articleExpansionParts").glob("part*.ts"))]:
        txt = f.read_text(encoding="utf-8")
        for m in re.finditer(r"(?m)^\s*'([a-z0-9\-]+)'\s*:\s*`", txt):
            i = s = m.end()
            while i < len(txt):
                if txt[i] == "\\":
                    i += 2
                    continue
                if txt[i] == "`":
                    break
                i += 1
            out.setdefault(m.group(1), {})[f.name] = txt[s:i]
    return out


def find_attributed(text: str) -> list[dict]:
    res = []
    for m in QUOTE_RE.finditer(text):
        quote, end = m.group(1), m.end()
        after = text[end:end + ATTR_WINDOW]

        who = None
        for rx in ATTR_RES:
            a = rx.match(after) or rx.search(after[:120])
            if a:
                cand = a.group(1).strip().rstrip(",.:;")
                if cand and not NON_PERSON_RE.match(cand) and len(cand) > 2:
                    who = cand
                    break
        if who is None:
            continue
        if looks_like_heading(who) or not is_known_person(who):
            continue

        around = text[max(0, m.start() - SOURCE_WINDOW):end + SOURCE_WINDOW]
        urls = URL_RE.findall(around)
        hedged = bool(HEDGE_RE.search(around))
        speech = bool(FIRST_PERSON_RE.search(quote))
        institution = bool(INSTITUTION_RE.search(who))

        # Риск: нет ни источника, ни хеджа. Прямая речь от первого лица,
        # приписанная человеку, — наивысший приоритет.
        at_risk = not urls and not hedged
        if at_risk and speech and not institution:
            severity = "speech"
        elif at_risk:
            severity = "claim"
        else:
            severity = "ok"

        res.append({
            "person": who,
            "quote": quote.strip(),
            "chars": len(quote.strip()),
            "has_source": bool(urls),
            "urls": urls[:3],
            "hedged": hedged,
            "first_person": speech,
            "institution": institution,
            "severity": severity,
            "at_risk": at_risk,
        })
    return res


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", action="store_true", help="машиночитаемый вывод")
    ap.add_argument("--id", metavar="ARTICLE", help="только эта статья")
    ap.add_argument("--strict", action="store_true",
                    help="ненулевой код возврата при цитатах без источника")
    a = ap.parse_args()

    ids = set(article_ids())
    if a.id:
        if a.id not in ids:
            print(f"Статья не найдена: {a.id}", file=sys.stderr)
            return 2
        ids = {a.id}
    blocks = load_blocks()

    found, at_risk, hedged_only, sourced, speech = [], 0, 0, 0, 0
    for aid in sorted(ids):
        for layer, text in blocks.get(aid, {}).items():
            for q in find_attributed(text):
                q.update({"articleId": aid, "layer": layer})
                found.append(q)
                if q["severity"] == "speech":
                    speech += 1
                if q["at_risk"]:
                    at_risk += 1
                elif q["hedged"]:
                    hedged_only += 1
                else:
                    sourced += 1

    if a.json:
        print(json.dumps({
            "attributedQuotes": len(found),
            "withSource": sourced,
            "hedgedNoSource": hedged_only,
            "atRisk": at_risk,
            "atRiskFirstPersonSpeech": speech,
            "quotes": sorted(found, key=lambda x: (x["severity"] != "speech",
                                                  not x["at_risk"], -x["chars"])),
        }, ensure_ascii=False, indent=1))
    else:
        print(f"приписанных цитат: {len(found)}")
        print(f"  с источником рядом:        {sourced}")
        print(f"  захежированы, без ссылки:  {hedged_only}")
        print(f"  БЕЗ источника и без хеджа: {at_risk}")
        print(f"    из них прямая речь от 1-го лица: {speech}")
        risky = sorted((q for q in found if q["at_risk"]), key=lambda x: -x["chars"])
        for q in risky:
            print(f"\n[{q['articleId']} · {q['layer']}] приписано: {q['person']} ({q['chars']} зн.)")
            print("   ", q["quote"][:300].replace("\n", " "))
        if not risky:
            print("\nприписанных цитат без источника не найдено")

    return 1 if (a.strict and at_risk) else 0


if __name__ == "__main__":
    sys.exit(main())
