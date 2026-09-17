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

# Граница элемента списка. В разделе ИСТОЧНИКИ каждая строка устроена как
# «Автор — «Название»», и окно атрибуции после цитаты захватывало автора
# СЛЕДУЮЩЕГО пункта: так заголовок материала Университета Льежа
# «Le blanc-manger, une histoire entre goût et médecine» был приписан Julie
# Andrieu, которая на самом деле автор соседней строки. Атрибуция обязана
# оставаться в пределах своего элемента списка или абзаца; markdown-цитирование
# «\n> Подпись» при этом разрешено — это законная подпись под цитатой.
LIST_BREAK_RE = re.compile(r"\n\s*(?:[-*•]|\n)")


def trim_window(text: str, allow_blockquote: bool = True) -> str:
    """Обрезает окно по границе элемента списка или абзаца."""
    out = []
    i = 0
    while i < len(text):
        m = LIST_BREAK_RE.match(text, i)
        if m:
            rest = text[m.end():m.end() + 2]
            if allow_blockquote and rest.startswith(">"):
                i = m.end()
                continue
            break
        out.append(text[i])
        i += 1
    return "".join(out)


# Атрибуция, стоящая ПЕРЕД цитатой. Русская конструкция «сам Эрме называет свой
# принцип просто: «…»» первым прогоном не находилась вовсе: сканер смотрел только
# в окно после закрывающей кавычки. Это отдельный класс пропуска, а не редкость.
# Порядок «глагол + имя»: «говорит Эрме: «…»»
PRE_ATTR_RE = re.compile(
    r"(?:говорит|называет|пишет|отмечает|формулирует|объясняет|признаётся|заявляет|"
    r"подчёркивает|утверждает|рассказывает|по словам|как сказал[аи]?)\s+"
    r"([A-ZА-ЯЁ][\w'’\-À-ÿ]{2,}(?:\s+[A-ZА-ЯЁ][\w'’\-À-ÿ]{2,})?)\s*[^«»]{0,60}?$",
    re.I,
)

# Порядок «имя + глагол»: «сам Пьер Эрме называет свой принцип просто: «…»».
# Без этой ветки сканер пропускал ровно ту конструкцию, которая стояла в корпусе
# (статья herme-biography), — и её нашли только чтением текста вручную.
# Самопроверочный тест зафиксировал пропуск, что и было его назначением.
VERBS = (r"говорит|называет|пишет|отмечает|формулирует|объясняет|признаётся|заявляет|"
         r"подчёркивает|утверждает|рассказывает|сказал[аи]?|добавля[ею]т|счита[ею]т")
PRE_ATTR_NAME_FIRST_RE = re.compile(
    r"(?:сам[аи]?\s+)?([A-ZА-ЯЁ][\w'’\-À-ÿ]{2,}(?:\s+[A-ZА-ЯЁ][\w'’\-À-ÿ]{2,})?)"
    r"\s+(?:" + VERBS + r")\b[^«»]{0,80}?$",
    re.I,
)

# Маркеры, означающие, что утверждение уже атрибутировано посреднику и потому
# fail-closed: проект не выдаёт это за собственный факт.
HEDGE_RE = re.compile(
    r"по данным|согласно|по словам|как писал|как пишет|в интервью|в книге|в своей книге|"
    # Письменная ссылка на конкретный документ принципиально отличается от устной
    # речи: «Lebovitz пишет, что …» и «Le Petit Journal пишет: …» указывают на
    # проверяемый текст, тогда как «Эрме говорит: …» не указывает ни на что.
    # Первая версия списка содержала только «как пишет», из-за чего оба случая с
    # письменной атрибуцией попадали в at-risk наравне с выдуманными цитатами.
    r"(?:\w+)\s+пиш[ее]т[,\s:]|пиш[ее]т[,\s:]+\s*(?:что|это)?|в\s+(?:колонке|блоге|статье\s+для)|"
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
# Важно брать основы с произвольным продолжением, а не перечислять словоформы:
# два прогона подряд занижали класс цитаты. Первый пропустил «вкус моего детства»
# (в списке было только «мой»), второй — ту же фразу, потому что класс
# «мо[йяёе][ехмю]?» не содержит «г» и «\b» не срабатывал на «моего».
FIRST_PERSON_RE = re.compile(
    r"\b(я|мн[ее][а-яё]*|мен[яю][а-яё]*|мо[йяёе][а-яё]*|мн[ою][а-яё]*|мы|на[сш][а-яё]*|"
    r"себ[ея][а-яё]*|сво[йяёеи][а-яё]*|"
    r"счита[юе][а-яё]*|дума[юе][а-яё]*|хоч[уе][а-яё]*|любл[юе][а-яё]*|трач[уи][а-яё]*|"
    r"дела[юе][а-яё]*|иск[ао][а-яё]*|наш[а-яё]*|придума[а-яё]*|"
    r"попробуйт[ее][а-яё]*|возьмит[ее][а-яё]*|"
    r"je|j'[a-zé]+|nous|notre|nos|mon|ma|mes|moi|chez\s+moi)\b",
    re.I,
)

# Регрессионный самопроверочный тест. Три прогона подряд инструмент занижал
# реальное число цитат, и каждый раз это находилось только ручным просмотром.
# Тест фиксирует и то, что ОБЯЗАНО распознаваться, и то, что распознаваться не
# должно, -- чтобы следующая правка регулярки не сломала классификацию молча.
SELFTEST_POSITIVE = [
    "Ревень — вкус моего детства",
    "Я не делаю высокую кулинарию",
    "Я хочу сделать его удобным",
    "Моё главное правило",
    "Мы должны задавать себе вопрос",
    "Это наша ответственность",
    "Считаю, что продукт важнее техники",
    "Попробуйте две ложки пралине",
    "Je ne cherche pas la nouveauté",
    "Mon goût d'enfance",
    "Своим жиром миндаль его обволакивает",
    "Придумал я это в 2011 году",
]
# Отрицательные примеры для ПАРИНГА атрибуции, а не только для первого лица:
# заголовок материала не должен наследовать автора следующей строки списка.
SELFTEST_PAIR_NEGATIVE = [
    "- Université de Liège (Culture) — «Le blanc-manger, une histoire entre goût et "
    "médecine: от средневековой диеты до миндального крема в современной кондитерской»\n"
    "- Julie Andrieu — «Blanc-manger aux amandes de Jeanne»\n"
    "- Ptitchef — «Blanc-manger au lait d'amande et coulis de fruits rouges»",
]
# Фикстуры обязаны быть не короче MIN_QUOTE, иначе проверяется не паринг
# атрибуции, а порог длины. Первая версия этого теста была написана короткими
# строками и провалилась 0/3 именно по этой причине — тест проверял не то.
SELFTEST_PAIR_POSITIVE = [
    "«Ревень — вкус моего детства. Здесь он идёт мармеладом, припущенным и сырым», "
    "— говорит Эйцлер.",
    "«Опера — это не просто торт, это геометрия вкуса. Толщина бисквита выверена "
    "до миллиметра.»\n> Дом Dalloyau (Париж)",
    "сам Пьер Эрме называет свой главный принцип просто: «Работай так, как будто тебя "
    "никто не смотрит. Только тогда ты честен с продуктом».",
]

SELFTEST_NEGATIVE = [
    "Мороженое готовят из желтков и молока",
    "Момент охлаждения критичен",
    "Молоко доводят до 80 градусов",
    "Можно использовать любой пралине",
    "Нагрев разрушает аромат",
    "Масло должно быть холодным",
]


def selftest() -> tuple[list, list, list, list]:
    """Провалы на положительных и отрицательных примерах обоих детекторов."""
    bad_pos = [s for s in SELFTEST_POSITIVE if not FIRST_PERSON_RE.search(s)]
    bad_neg = [s for s in SELFTEST_NEGATIVE if FIRST_PERSON_RE.search(s)]
    bad_pair_pos = [s for s in SELFTEST_PAIR_POSITIVE if not find_attributed(s)]
    bad_pair_neg = [s for s in SELFTEST_PAIR_NEGATIVE
                    if any(q["person"].lower().startswith("julie") for q in find_attributed(s))]
    return bad_pos, bad_neg, bad_pair_pos, bad_pair_neg


def looks_like_heading(name: str) -> bool:
    """Отсеивает подписи, которые на деле — заголовки разделов в капслоке.

    Единственный содержательный признак — доля заглавных букв: «ЛИЧИ», «БРЮЛЕ»,
    «DÉTREMPE» набраны капслоком, а «Пьер Эрме» и «Эрме» — нет. Первая версия
    функции содержала две дополнительные ветки «на всякий случай», и одна из них
    браковала любое имя из двух слов, потому что пробелы из строки к тому моменту
    уже были удалены. Лишние условия в фильтре не повышают точность, а ломают её.
    """
    core = re.sub(r"[^\wÀ-ÿА-ЯЁа-яё'’\-]", "", name)
    letters = [c for c in core if c.isalpha()]
    if not letters:
        return True
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters) > 0.8


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
        after = trim_window(text[end:end + ATTR_WINDOW])
        # для окна ПЕРЕД цитатой граница ищется в обратном порядке: берём последний
        # элемент списка/абзац перед открывающей кавычкой
        raw_before = text[max(0, m.start() - ATTR_WINDOW):m.start()]
        cuts = [mm.end() for mm in re.finditer(r"(?:\n\s*[-*•]\s*|\n\n)", raw_before)]
        before = raw_before[cuts[-1]:] if cuts else raw_before

        who = None
        pre = PRE_ATTR_RE.search(before) or PRE_ATTR_NAME_FIRST_RE.search(before)
        if pre:
            cand = pre.group(1).strip().rstrip(",.:;")
            if cand and not NON_PERSON_RE.match(cand) and len(cand) > 2:
                who = cand
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
    ap.add_argument("--selftest", action="store_true",
                    help="проверить распознавание первого лица на эталонных строках")
    a = ap.parse_args()

    if a.selftest:
        bad_pos, bad_neg, bad_pair_pos, bad_pair_neg = selftest()
        for s in bad_pos:
            print(f"НЕ распознано как 1-е лицо: {s[:70]}")
        for s in bad_neg:
            print(f"ложно распознано как 1-е лицо: {s[:70]}")
        for s in bad_pair_pos:
            print(f"НЕ найдена атрибуция: {s[:70]}")
        for s in bad_pair_neg:
            print(f"атрибуция перескочила на следующий пункт списка: {s[:70]}")
        ok1 = len(SELFTEST_POSITIVE) - len(bad_pos)
        ok2 = len(SELFTEST_NEGATIVE) - len(bad_neg)
        ok3 = len(SELFTEST_PAIR_POSITIVE) - len(bad_pair_pos)
        ok4 = len(SELFTEST_PAIR_NEGATIVE) - len(bad_pair_neg)
        print(f"самопроверка: 1-е лицо {ok1}/{len(SELFTEST_POSITIVE)} + "
              f"{ok2}/{len(SELFTEST_NEGATIVE)}; "
              f"атрибуция {ok3}/{len(SELFTEST_PAIR_POSITIVE)} + "
              f"{ok4}/{len(SELFTEST_PAIR_NEGATIVE)}")
        return 1 if (bad_pos or bad_neg or bad_pair_pos or bad_pair_neg) else 0

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
