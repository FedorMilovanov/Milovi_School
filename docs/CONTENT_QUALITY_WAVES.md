# Качество контента и французская источниковая база — тотальная проверка и волны работ

**Дата:** 2026-09-15
**Ветка:** `arena/01a0a6df-milovi-school` (от `aa82176`)
**Причина открытия:** запрос владельца на тотальную проверку правил проекта и наполненности статей, с прицелом на качественный материал на базе топовых французских источников.
**Статус Wave 0:** выполнен, `npm run validate` зелёный.
**Статус Wave 2:** выполнен частично — рэтчет `MAX_WEAK_CITATIONS` снижен 73 → 65, не до 0.
**Статус внепланового прохода точности:** выполнен (см. §7).

Этот документ — постоянный короткий authority по качеству контента. Он не заменяет
[`AGENTS.md`](../AGENTS.md) и [`PRODUCTION_SECTION_PLAYBOOK.md`](./PRODUCTION_SECTION_PLAYBOOK.md),
а конкретизирует их для редакционного корпуса статей.

---

## 1. Что именно проверено

Проверка шла по двум независимым осям: **соблюдение правил проекта** и **реальная
наполненность статей**, а не только формальное прохождение гейтов.

| Слой | Инструмент | Результат на входе | Результат после Wave 0 |
|---|---|---|---|
| Типы | `tsc --noEmit` | 0 ошибок | 0 ошибок |
| Линт | `eslint .` | 0 ошибок | 0 ошибок |
| Целостность корпуса | `audit_content.py` | 155/155 уникальных тел | 155/155 |
| Глубина статей | `audit_article_depth.py` | 155 ok, 0 ниже цели | 155 ok |
| Редакционное качество | `audit_editorial_quality.py` | 0 issues, 59 trusted-доменов | 0 issues, 58 |
| Canon-досье | `audit_canon_articles.py` | 15/15 ≥1000 слов, ≥5 разделов | 15/15 |
| Canon media/research/gateway | `audit_canon_*.py` | PASS | PASS |
| Сборка | `astro build` | 167 страниц, 157 article routes | 167 / 157 |
| Raw build | `audit_raw_build.mjs` | 169 HTML, strict UTF-8 | 169 HTML, 43 185 523 байта |
| Сайт целиком | `audit_site.py` | 0 errors, 415 JSON-LD, 197 изображений | 0 errors |
| SEO | `audit_seo.py` | 3477 проверок, 166 индексируемых | 3477 / 166 |
| Privacy | `privacy_contract.mjs` | OK, 169 документов | OK |
| **Зависимости** | `npm audit --audit-level=high` | **RED: 1 critical + 3 high** | **GREEN: 0 уязвимостей** |
| **Живость источников** | *гейта не существовало* | **не проверялось** | **новый постоянный гейт** |

### Ключевой вывод проверки

Технические гейты были зелёными почти везде, но **два класса дефектов они в
принципе не могли поймать**:

1. **Мёртвые и закрытые источники.** Ни один гейт не проверял, открывается ли
   цитируемый французский URL. Проверка вживую показала: из 218 уникальных
   цитат корпуса как минимум **54 ссылались на 404, на страницу авторизации или
   на испорченный URL**. Для проекта, где `AGENTS.md` §4 требует source trail,
   а §0.11 запрещает fake claims, это прямой редакционный дефект: читатель не
   может проверить утверждение по ссылке.
2. **Наполненность «впритык к гейту».** Все статьи формально проходят целевые
   пороги, но часть корпуса написана ровно до границы: запас в 3–4 слова.
   Зелёный гейт здесь означал «не ниже минимума», а не «достаточно глубоко».

Оба вывода совпадают с анти-паттерном, уже зафиксированным в
`CORRECTIVE_WAVE_2026-08-10.md`: *green technical QA не является доказательством
принятого качества без проверки самого артефакта*.

---

## 2. Wave 0 — выполнено в этой проверке

### 2.1 Закрыт красный security-гейт

`npm run validate` на входе **падал** на шаге `audit:security`:

- `astro <=7.2.7` — **critical**: RCE через оптимизацию AVIF
  (GHSA-26w7-cxv4-gfx2) и обход авторизации на границе path-segment при
  срезании `base` (GHSA-376h-93r7-7g6f);
- `js-yaml`, `sharp`, `svgo` — 3 high.

Действие: `astro` 7.1.5 → **7.3.2** (точный пин сохранён), остальные три закрыты
`npm audit fix`. Сейчас `npm audit` = **0 уязвимостей**, гейт зелёный, полная
сборка и все аудиты проходят без регрессий.

Обоснование по `AGENTS.md` §0.2: смена версии зависимостей выполнена не «для
удобства», а как устранение critical RCE, которое держало собственный
validation-гейт проекта в красном состоянии. Изменение точечное и проверенное
полным прогоном `npm run validate`.

### 2.2 Заменены 54 проблемные цитаты на проверенные живые документы

Каждая замена сначала проверялась открытием целевой страницы, и только потом
вносилась в корпус.

| Было | Дефект | Цитат | Стало (проверено вживую) |
|---|---|---|---|
| `eduscol.education.fr/referentiels-professionnels/cap_patissier.html` | 404 | 20 | `referentiels-professionnels.eduscol.education.fr/cap_patis.html` — живой референтиал CAP Pâtissier со ссылкой на Arrêté du 6 mars 2019 |
| `cacao-barry.com/fr-FR/pastry-alphabet` | «Vous n'êtes pas autorisé» (логин-стена во всех локалях, `/en/` и `/en-US/pastry-alphabet` тоже закрыты) | 13 | `cacao-barry.com/en-US/alphabet-series` — публичная страница, описывающая The Pastry Alphabet и The Cacao Alphabet; якорь приведён к честному «Cacao Barry — The Alphabet Series (The Pastry Alphabet)» |
| `academiedugout.fr/recettes/pate-a-choux_1764_2` | soft-404 «cette page est introuvable» | 8 | `academiedugout.fr/recettes/la-pate-a-choux_5263_2` — живая база Alain Ducasse с историей (Popelini / Екатерина Медичи, XVI в.; Avice, XVIII в.) и техникой déshydratation → réhydratation |
| `essentials.valrhona.com/` | голая корневая страница вместо документа | 13 | контекстные разделы L'École Valrhona: `/category/1` Biscuits & Bases (39), `/category/2` Creamy Textures (17), `/category/4` Mousse Textures (19), `/category/6` Fruit (45), `/category/8` Chocolate (10), `/category/9` Finishing Touches (24) |

Разделы Valrhona подобраны по предмету статьи, а не механически: `tech-mousse-stability`
и `tech-entremets-assembly` → Mousse Textures, `tech-tempering-chocolate` и
`recipe-mousse-au-chocolat` → Chocolate, `grolet-lemon-yuzu` и `grolet-fruits-full`
→ Fruit, `chiffres-anatomie-gateau` и `recipe-dacquoise` → Biscuits & Bases,
`recipe-profiteroles` → Creamy Textures, `metayer-secrets` → Finishing Touches.

### 2.3 Исправлен испорченный URL, который уходил в SEO

`https://www.latartetropezienne.fr/fr/?m=aboutus%3Fm%3Daboutus` — двойное
кодирование query. Встречался в трёх местах, включая `sourceUrl` в
`articles.ts` и `articleOverrides.ts`, то есть попадал в метаданные, OG и
structured data. Заменён на
`https://www.latartetropezienne.fr/fr/content/10-notre-histoire` — официальную
страницу истории дома с документированной хронологией: 1955 Alexandre Micka
открывает boulangerie-pâtisserie в Saint-Tropez; в том же году на съёмках
«Et Dieu créa la femme» (Roger Vadim) Brigitte Bardot предлагает название
La Tarte Tropézienne®; 1973 — dépôt de la marque et de la recette; 1985 —
Albert Dufrêne; 2013 — бутик в Saint-Germain-des-Prés; 2015 — 60 лет.

Это одновременно и исправление дефекта, и усиление материала: вместо битой
ссылки на главную статья получила первичный официальный источник с датами.

### 2.4 Добавлен постоянный гейт живости источников

По `AGENTS.md` §8 критические правила должны жить в коде, а не только в
Markdown. Новый `scripts/audit_source_links.py`:

- собирает **все** цитаты корпуса: expansion-слой, Canon-досье, Canon-приложения
  и `sourceUrl` из метаданных (554 цитаты, 249 уникальных URL);
- проверяет каждую: HTTP-статус, редиректы, и **soft-404 по видимому title**
  (`introuvable`, `not authorized`, `access denied`, `page not found` и т. п.) —
  именно так ломались Académie du Goût и Cacao Barry при формальном HTTP 200;
- два уровня строгости:
  - `dead` — жёсткий отказ: 4xx/5xx, DNS/TLS, soft-404;
  - `weak` — **ratchet**: цитаты на корень сайта, индекс или страницу поиска.
    Бюджет заморожен на измеренном значении `MAX_WEAK_CITATIONS = 73` и может
    только снижаться. Молча поднять его нельзя;
- сеть: контрольный зонд решает, есть ли egress. Без сети гейт честно печатает
  `SKIPPED` и выходит 0, чтобы офлайн-`validate` оставался осмысленным.
  В CI отдельный шаг идёт с `--require-network`, поэтому **тихий пропуск не
  может сойти за зелёный**.

Подключено: `npm run audit:source-links`, `npm run audit:source-links:strict`,
встроено в `audit:content`, отдельный шаг «Verify every cited French source is
reachable» в `.github/workflows/ci.yml`.

### 2.5 Гигиена репозитория

- `.gitignore`: добавлены `artifacts/` (отчёты аудитов генерируются скриптами и
  не должны попадать в коммит) и `.venv/`;
- **задокументировано, но не изменено односторонне:** `audit/` внесен в
  `.gitignore`, при этом `audit/site-audit-report.md` отслеживается git и
  перезаписывается `scripts/audit_site.py` при каждом запуске. То есть
  сгенерированный артефакт лежит в индексе, а каталог объявлен игнорируемым —
  прямое противоречие. Любой локальный прогон аудитов пачкает working tree.
  Решение требует выбора владельца (см. Wave 1, п. 1.4).

### Итог Wave 0

`npm run validate` — **зелёный полностью**, включая ранее красный
`audit:security`. Цитат в корпусе стало 554, уникальных URL 249, доменов 63.
Слабых цитат 73 (было 84), поисковых 41 (было 42), мёртвых/закрытых **0**.

---

## 3. Системные проблемы, которые остались

### 3.1 Наполненность написана «впритык к порогу»

Целевые пороги по типам (`target_for` в `audit_article_depth.py`):
recipe 650, technique 700, data 750, editorial 850, history-biography 950 слов.

Фактический минимальный запас до порога:

| Тип | n | Минимальный запас | Пример | Средний запас |
|---|---:|---:|---|---:|
| editorial | 48 | **+3** | `cuisine-galette` 853/850 | +127 |
| history-biography | 26 | **+4** | `couvreur-canal-biography`, `histoire-tartes-francaises`, `laduree-1862`, `millefeuille-histoire` 954/950 | +68 |
| data | 5 | +37 | 787/750 | +95 |
| technique | 15 | +64 | 764/700 | +225 |
| recipe | 61 | +117 | 767/650 | +495 |

Общая картина: 155 статей, min 764 / median 1017 / mean 1041 / max 1738 слов,
добор французского слоя дал 29 671 слово (в среднем ~190 слов на статью).

Запас в 3–4 слова означает, что материал писался под гейт, а не под редакционную
глубину. Для `history-biography` средний запас всего +68 слов — то есть половина
типа сидит в пределах 10 % от минимума.

### 3.2 Фрагментация вместо связного текста

20 статей имеют меньше 55 слов на раздел. Худшие:

| Статья | Слов на раздел | Слов | Разделов |
|---|---:|---:|---:|
| `tech-glossary-cap` | 24.6 | 1082 | 44 |
| `tech-feuilletage` | 33.6 | 1043 | 31 |
| `mercotte-macarons` | 37.5 | 990 | 28 |
| `tech-macaronage` | 39.6 | 990 | 25 |
| `recipe-canele` | 39.6 | 872 | 22 |
| `tech-creme-pat` | 39.8 | 835 | 21 |
| `tech-choux` | 41.3 | 1073 | 26 |
| `tech-mirror-glaze` | 42.5 | 807 | 19 |

Причина в том, что `metrics()` засчитывает как «раздел» и настоящие заголовки,
и любой `**жирный лид**` / `<strong>`. Корпус этим пользуется: много коротких
жирных подзаголовков формально дают разделы, а связного текста мало. Гейт
измеряет количество разделов, но не их содержательность — ровно тот же
анти-паттерн «проверялось наличие, а не сохранность», что и в Canon-волне.

### 3.3 Источниковый слой: слабые и шаблонные цитаты

- **73 слабые цитаты** (13,2 % от 554): голые корни и страницы поиска.
- **41 цитата — страницы поисковой выдачи**, почти все
  `academiedugout.fr/recherche?q=...` (`q=cannelé`, `q=tarte tatin`,
  `q=quatre-quarts`, `q=bûche de Noël` и т. д.). Выдача поиска меняется и не
  является документируемым источником.
- Частые голые корни: `jacquesgenin.fr/univers` ×5, `christophemichalak.com/` ×3,
  `inao.gouv.fr/` ×3, `christophe-felder.com/` ×2, `cinqsensparis.com/` ×2,
  `visit.alsace/` ×2, `dominiqueansel.com/` ×2.
- **Зависимость от одного источника:** книга Pâtisserie FERRANDI Paris
  цитируется в **61 из 155 статей (39 %)** с идентичным якорем. Источник
  отличный и живой, но концентрация такая, что любая его перестановка
  обесценивает почти треть корпусa.
- Якоря шаблонны: «Pâtisserie FERRANDI Paris» ×58, «Référentiel CAP Pâtissier» ×20,
  «The Pastry Alphabet» ×12, «Les essentiels Valrhona» ×12.

### 3.4 Отсутствие топового французского материала по 45 темам

Поиск по всему корпусу (deepContents + 20 expansion-частей + Canon-досье)
показал 45 тем, которых нет вообще или почти нет. Это и есть главный
редакционный резерв роста.

---

## 4. Волны работ

### Wave 1 — Устойчивость гейтов и честная глубина (инженерная, без нового контента)

Цель: сделать так, чтобы «зелёный» означал «глубоко», а не «не ниже минимума».

1. **Поднять целевые пороги** в `target_for()`: editorial 850 → 1000,
   history-biography 950 → 1150, data 750 → 900, technique 700 → 850,
   recipe 650 → 750. Поднимать **поэтапно**, волна за волной, чтобы не
   получить одномоментно 100 красных статей.
2. **Добавить гейт содержательности разделов:** минимум слов на раздел
   (стартово 45) и запрет засчитывать как раздел одиночный `**жирный лид**`
   короче N символов без последующего абзаца. Это закрывает §3.2 в коде.
3. **Добавить гейт концентрации источников:** ни один домен не встречается более
   чем в X % статей (стартово 30 %), и минимум 3 различных домена на статью.
   Закрывает зависимость от Ferrandi.
4. **Решить противоречие `audit/`** (нужен выбор владельца):
   либо `audit/site-audit-report.md` перестаёт быть отслеживаемым и уходит в
   `artifacts/`, либо архивный `professional-fix-audit-2026-05-17.md` переезжает
   в `docs/` как постоянный документ, а `audit/` убирается из `.gitignore`.
   Текущее состояние нарушает `AGENTS.md` §10 (сгенерированный артефакт в индексе).
   Противоречие подтверждено измерением: отслеживаемая копия **устарела** —
   в ней 181 изображение, 155 article pages и 159 sitemap URL, тогда как реальная
   сборка даёт 197, 157 и 166. То есть в репозитории лежит снимок, который
   misreports текущее состояние сайта. В этой волне файл сознательно не
   пересохранялся, чтобы не коммитить генерируемый вывод.
5. **Пересчитать `readTime`** после доборов; сейчас расхождений ≥2 мин нет,
   гейт это контролирует — не ломать.

**Definition of Done Wave 1:** новые гейты в коде и в CI; `npm run validate`
зелёный; пороги подняты хотя бы на один шаг; ни одна статья не проходит
гейт с запасом менее 40 слов.

### Wave 2 — Полная замена слабых цитат конкретными документами

Цель: довести ratchet `MAX_WEAK_CITATIONS` с 73 до 0.

1. **41 поисковая страница → конкретные рецепты/статьи.** Для Académie du Goût
   рабочие глубокие URL уже подтверждены: `/recettes/paris-brest-2009_77_2`
   (Philippe Conticini, жив, с ингредиентами praliné / craquelin / pâte à choux),
   `/recettes/la-pate-a-choux_5263_2` (Alain Ducasse, жив),
   страницы шефов `/chefs/alain-ducasse_4`, `/chefs/philippe-conticini_14`,
   `/chefs/pierre-herme_12`, `/chefs/jacques-genin_204374`.
   Каждую замену проверять открытием до коммита — гейт это зафиксирует.
2. **Голые корни maison-сайтов → предметные страницы:** `jacquesgenin.fr/univers` ×5,
   `christophemichalak.com/` ×3, `inao.gouv.fr/` ×3 (→ конкретные cahiers des
   charges AOP/IGP), `christophe-felder.com/` ×2, `dominiqueansel.com/` ×2,
   `cinqsensparis.com/` ×2, `visit.alsace/` ×2, `ferrandi-paris.com/fr`.
3. **Развести концентрацию Ferrandi:** для 61 статьи добавить второй
   независимый профессиональный источник, чтобы книга не была единственной опорой.
4. **Сделать якоря содержательными:** вместо 58 одинаковых
   «Pâtisserie FERRANDI Paris» — указание, что именно подтверждает ссылка
   (раздел, техника, издание, дата). Без keyword stuffing (`AGENTS.md` §5).
5. После каждого пакета замен **снижать `MAX_WEAK_CITATIONS`** до нового
   измеренного значения.

**Definition of Done Wave 2:** `MAX_WEAK_CITATIONS = 0`; гейт живости зелёный в
CI с `--require-network`; ни одна статья не опирается на один домен.

### Wave 3 — Добор топового французского материала: региональная классика

Крупнейший содержательный пробел. Отсутствуют полностью (0 упоминаний):

- **Региональные каноны:** biscuit rose de Reims, pain d'épices de Dijon,
  fiadone (Корсика), macaron de Nancy, bêtises de Cambrai, teurgoule (Нормандия),
  gâteau nantais, pastis gascon, moka, succès, caramel au beurre salé;
- **Забытая парижская классика:** pithiviers, conversation;
- почти не представлены (1–2 упоминания, материала нет): pralines roses /
  tarte aux pralines lyonnaise, navettes de Marseille, treize desserts de
  Provence, salambo, chouquette, puits d'amour, bredele.

Порядок работы по `AGENTS.md` §7: сначала модель и source trail, потом маршруты,
потом UI. Для каждой новой статьи обязательны: реальный ID, живой французский
источник ≥2, media identity, structured data, permanent gate.

**Definition of Done Wave 3:** каждая новая статья проходит все гейты Wave 1–2
с запасом, а не впритык; добавлены в `library.ts`, `deepContents.ts`,
expansion-слой и image map; sitemap и lastmod честные.

### Wave 4 — Добор топового французского материала: шефы и институты

**Шефы, которых в корпусе нет вообще** (проверено поиском по корпусу):
Jean-Paul Hévin, Arnaud Larher, Philippe Urraca, Nicolas Bernardé,
Vincent Guerlais, Carl Marletti, Pascal Hainigue, Christelle Brua,
Yannick Alléno, Pierre Marcolini, Patrick Roger, Jean-Charles Rochoux,
Christophe Renou, Jessica Préalpato, Frédéric Bau, Guy Krenzer,
Jeffrey Cagnes, Jimmy Mornet, Maxime Frédéric, Yves Thuriès.
Единичные упоминания без материала: Angelo Musa, Yann Brys, Joseph Viola,
Benoît Couvrand.

Это в том числе действующие и прошлые **MOF** и шефы дворцовых домов
(Plaza Athénée, Le Bristol, Cheval Blanc Paris, Crillon, Ritz), то есть ровно
тот «топовый французский материал», которого запрос касается напрямую.

**Институты, которых нет или почти нет:** École Ducasse (0), Le Cordon Bleu (1),
Club des Croqueurs de Chocolat (0), Académie Culinaire de France (0),
Relais Desserts (2).

**Профессиональное образование и гигиена:** BTM (0), Brevet Professionnel (0),
Bac Pro (0), CAP Chocolatier (0), HACCP (0). При этом CAP Pâtissier и
`tech-glossary-cap` уже есть — логичное продолжение линии.

**Definition of Done Wave 4:** у каждой персоны — не пересказ легенд, а
документированная линия (дом, даты, награды, техника) с fail-closed формулировками
по `AGENTS.md` §4: легенда остаётся легендой, transmission ≠ ORIGIN.

### Wave 5 — Усиление первичной источниковой базы

Что уже подтверждено как живое и сильное, и что стоит использовать глубже:

- **Gallica / BnF** (сейчас 27 + 18 + 6 цитат): `ark:/12148/bpt6k940508c` —
  Pierre Lacam, *Le mémorial historique et géographique de la pâtisserie*,
  5e éd., 856 стр., коллекция «Patrimoine gourmand», с OCR-текстом. Рядом
  лежат Apicius (*De re culinaria*, `bpt6k87022226`), Brillat-Savarin
  *Physiologie du goût* (`bpt6k91306800`), подборки по Carême
  (1783–1833) и Escoffier (1846–1935). Это слой настоящих первичных
  документов, а не пересказов.
- **INSEE**: `fr/statistiques/7929127` — Fiche secteur 1071C
  Boulangerie et boulangerie-pâtisserie, Ésane, парution 11/03/2024,
  реальные данные (28 525 предприятий, CA HT 12 962,9 млн € за 2021,
  151 492 ETP). Рядом `7929129`. Прямое усиление категории `chiffres-*`,
  которая сейчас самая тонкая (mean 843, min 787).
- **Éduscol**: `referentiels-professionnels.eduscol.education.fr/cap_patis.html`
  со ссылкой на Arrêté du 6 mars 2019 (изменение от 3 октября 2022) и PDF
  приложений — опора для образовательной линии Wave 4.
- **Valrhona Les essentiels**: подтверждены глубокие карточки вида
  `/essential/56` (Whipped ganache), `/essential/50` (Pâte à bombe),
  с данными по хранению («Preserving: 3 Days — 2-4 °C», «Freezable»).
  Это готовый материал для технических статей вместо корневой ссылки.
- **Légifrance** (сейчас 2), **INA** `catalogue.ina.fr` (1),
  **INAO** (3, все — голый корень), **Agreste** (3),
  **meilleursouvriersdefrance.info** (1, `/annuaire-mof.aspx`) —
  недозагруженные официальные источники.
- **Académie du Goût**: страница Paris-Brest Conticini показывает, что живые
  карточки рецептов содержат полный состав и технику; их нужно использовать
  вместо поисковых выдач.

Отдельно: для `chiffres-*` уже действует жёсткий контракт
`REQUIRED_DATA_SOURCES` в `audit_editorial_quality.py`. Расширять его на новые
data-статьи, а не ослаблять.

**Definition of Done Wave 5:** доля первичных источников (Gallica/BnF/Wikisource/
Légifrance/INSEE/Agreste/INAO/INA/Éduscol) в корпусе измеримо выросла; каждая
цифра в `chiffres-*` имеет официальный источник с датой парution.

### Wave 6 — Редакционная вычитка связности

Не увеличивать объём, а улучшать качество уже написанного:

- переписать 20 фрагментированных статей из §3.2 как связный текст с настоящими
  H2/H3, а не как список жирных лидов;
- убрать шаблонные переходы между expansion-блоками (гейт
  `near_duplicate_expansions` с Jaccard ≥ 0.25 на 5-граммах уже сторожит
  откровенные повторы — держать);
- проверить, что каждый expansion-блок добавляет факт или технику, а не
  переформулирует базовое тело.

**Definition of Done Wave 6:** медиана слов на раздел ≥ 70; ни одна статья ниже
45; повторных шаблонных фраз нет; `audit_editorial_quality.py` по-прежнему 0 issues.

### Wave 7 — Релиз и свидетельство

По `AGENTS.md` §7 и §9:

1. полный `npm run validate` на финальном SHA;
2. browser/visual workflows (`canon-gateway-visual`, `gallery-quality`,
   `deep-polish-audit`) — для статей как минимум mobile/desktop/keyboard/
   reduced-motion и отсутствие horizontal overflow;
3. immutable exact-head release candidate;
4. merge + deploy;
5. **live exact-SHA witness** на `https://french.milovicake.ru` — не только
   зелёный CI;
6. IndexNow только после подтверждения live-deploy (`scripts/notify_indexnow.mjs`);
7. `lastmod` в sitemap — только для реально изменённых статей, не для всех 157.

---

## 5. Что не считается долгом

По `AGENTS.md` §3 и §11, чтобы волна не расползалась:

- Atlas, дополнительные визуальные эффекты, исторические факсимиле и массовые
  image derivatives — по-прежнему отдельные будущие волны, не долг Canon;
- не нужно «дополировывать» закрытый Le Canon Sucré: он проходит все свои гейты;
- FAQ-разметка не добавляется ради SEO (`PLAYBOOK` §5);
- отдельные AEO/GEO/AI-schema не изобретаются (`AGENTS.md` §6);
- этот документ — постоянный короткий authority, не `_TEMP_*` и не второй
  changelog. История решений остаётся в Git/PR.

---

## 6. Сводка для владельца

| Вопрос | Ответ |
|---|---|
| Правила проекта соблюдены? | Да, кроме двух мест: был красный `audit:security` (исправлено) и противоречие `audit/` в `.gitignore` против отслеживаемого сгенерированного отчёта (нужно решение, Wave 1 п. 1.4) |
| Наполненность статей? | 155 статей, все выше целевых порогов; но editorial и history-biography сидят с запасом +3…+4 слова, то есть «впритык» |
| Французский источниковый слой? | Сильный по составу (Académie du Goût, Ferrandi, Gallica/BnF, Valrhona, Cacao Barry, Éduscol, INSEE, Légifrance, maison-сайты шефов) и, как проверено вживую, в основе своей настоящий. Но 54 цитаты были мёртвы или закрыты (исправлено), 73 остаются слабыми, 41 — поисковые выдачи |
| Что даёт наибольший прирост качества? | Wave 2 (чистые источники) и Wave 3–4 (45 отсутствующих топовых тем и 20+ непокрытых шефов/MOF) |
| `npm run validate` | Зелёный полностью на текущем SHA |

## 7. Журнал фактически выполненных работ

План в §4 описывает волны как они были задуманы. Ниже — что реально сделано,
с коммитами, чтобы план и состояние репозитория не расходились.

### 7.1 Wave 2 (частично) + исследовательская коррекция calisson — `2068029`

**Исследовательская коррекция (AGENTS.md §4, fail-closed).** Статья
`recipe-calisson` утверждала, что calisson d'Aix «защищён IGP с 2002 года».
Проверка по INAO, UFCA (`aixcalisson.fr/projet-igp`), сенатскому вопросу
№ 1572S, отчёту INAO RA2021 (статус «lancement d'instruction»), Le Figaro,
Les Échos и Made in Marseille показала: европейской регистрации нет. 2002 год —
первое досье, не завершённое после возражений части ремесленников. В корпус
внесена документированная хронология; расхождение дат регистрации марки
(1990 по La Provence / 1991 по англоязычной Wikipedia) опубликовано как
расхождение, а не сглажено.

**Исправлен mistranslation.** «Запрет на пыльцу» — искажение: проект cahier des
charges UFCA запрещает `poudre d'amande` (миндальный порошок), а не пыльцу;
цукаты дыни — 40 процентов фруктовой части.

**Добавлен метод проверки статуса.** Раздел «Как отличить проект защиты от
состоявшейся регистрации» построен на первичных документах: статья 2 arrêté
прямо указывает, что права возникают только с вступлением в силу
исполнительного регламента Комиссии, опубликованного в JOUE. Проверенная
цепочка для Nougat de Montélimar: comité national 23–24.05.2023 → письмо INAO
11.07.2023 → arrêté 17.08.2023 (NOR AGRT2320415A, JORF n° 0194, texte n° 14) →
règlement d'exécution (UE) 2024/2921, JO L 2024/2921 от 26.11.2024.

**Замены цитат (все live-проверены):** Gallica SRU → `ark:/12148/bpt6k6209316c`;
голые корни `inao.gouv.fr` → `igp-indication-geographique-protegee`,
`igp-nougat-de-montelimar`, `produit/nougat-de-montelimar-4392`,
`rechercher-un-produit`; добавлены Légifrance, UFCA, Sénat.

**Инженерная правка гейта.** `library.ts`: `resolveUpdatedAt` — собственная дата
исправления статьи теперь побеждает волновые константы, иначе политика
`/corrections/` («содержательная правка → обновить дату») была невыполнима.

### 7.2 Внеплановый проход точности (зона Wave 6) — `bf110b6`

Выявлен и закрыт класс дефекта, которого не было в плане: **относительные
длительности в статическом тексте** — формулировки, истинные в момент написания
и тихо становящиеся ложными.

| Статья | Было | Стало |
|---|---|---|
| `herme-fetish-flavors` | «Испахан существует с 1997 года — 27 лет в неизменном виде» | конфликт 1997/2001 опубликован; цепочка Paradis → Ladurée → Ispahan по интервью самого Эрме (SoSoir, 19.09.2024) |
| `stohrer-1730` | «Почти 300 лет на одном месте» | прямая цитата дома: «la plus ancienne pâtisserie de Paris, fondée en 1730» |
| `recipe-merveilleux` | «уже около ста лет живёт в булочных» | документированный якорь: Maison Mouille / PRUM, Азбрук, 1934 |
| `conticini-praline` | «старше формулы Контисини почти на четыре века» | арифметика убрана, обе даты сохранены |

**Недокументируемые рейтинги.** `genin-autodidact` утверждал inclusion в Le Fooding
«с 2012 года», «лучшую карамель в мире» по The Guardian и «топ кондитерских
Европы» по Bon Appétit. Проверяется только Bon Appétit (живая карточка
парижского гида). Непроверяемые утверждения названы непроверяемыми, а раздел про
карамель, перечислявший Le Fooding и Condé Nast Traveller как подтверждённые,
приведён в соответствие — статья больше не противоречит сама себе.

**Юридическая точность.** `canele-bordeaux-histoire`: коллективный знак «canelé»
(конфрерия от 24.03.1985, депонирование в INPI, возрождение 2014) — это **не**
географическое указание; он не запрещает другим печь канеле, и две «n» на
упаковке — вариант написания, а не подделка. Цифры «4,5 млн к 1992» и
«800/600 производителей» помечены как гуляющие без первичного подсчёта.

**Мёртвая цитата, невидимая гейту.** `stohrer.fr/pages/notre-histoire` отдаёт 302
на главную: HTTP 200, заголовок не soft-404, путь не generic — гейт такое
пропускает. Заменён на `/notre-maison/`, где и находится цитируемое утверждение.
Это отдельный класс: **редирект на главную как форма мёртвой ссылки**; требует
сравнения `finalUrl` с цитируемым URL, а не только кода ответа.

**Отказ от пейвольных источников.** `lavoixdunord.fr/843422` (история мервейё,
Азбрук 1934) и ADG `meringue-francaise_4470_2` живы, но закрыты подпиской —
по §4 не цитируются. Взамен взят ADG `meringues_11465_2` с пометкой
«recette offerte» и Gallica `ark:/12148/bpt6k940508c`.

**Итог по рэтчету:** `MAX_WEAK_CITATIONS` 73 → 68 → 65. Слабых цитат в корпусе
осталось 65 из 559.

### 7.3 Что осталось из плана

- **Wave 2 (остаток):** 65 слабых цитат, цель 0. Крупнейшие пачки — голые корни
  maison-сайтов (`jacquesgenin.fr/univers` ×5, `christophemichalak.com` ×3,
  `christophe-felder.com` ×3) и поисковые выдачи ADG.
- **Новый класс для гейта:** редирект на главную (§7.2). Стоит добавить в
  `audit_source_links.py` сравнение `finalUrl` с цитируемым URL — сейчас
  `generic_path()` проверяет только исходную строку.
- **Очередь статусных утверждений:** 53 находки сканера
  `artifacts/scan_status_claims.py`, из них закрыты calisson, canelé, Stohrer,
  Genin, Hermé, Conticini.
- **Wave 3–5 плана (добор французского материала)** не начинались.

### 7.4 Wave 4 — замена поисковых выдач конкретными документами — `6c54e54`, `800ab55`

Рэтчет `MAX_WEAK_CITATIONS`: **65 → 58 → 53** (из 559 цитат).

**Batch 1 (7 замен).** Голый корень `ferrandi-paris.com/fr` в `cuisine-sauces`
заменён на первоисточник, который он подменял: `Le guide culinaire` Огюста
Эскофье (1903), глава I «Sauces», на Wikisource со статусом 100%-й выверенности
текста. Пять поисковых выдач ADG заменены на именные страницы рецептов:
`pate-a-crepes_5386_2` (Поль Бокюз, Best of Bocuse), `chantilly-vanille_4467_2`
(Кристоф Мишалак), `tarte-tatin-aux-deux-prunes_12842_2` (с пометкой «recette
offerte» — то есть метод открыт без подписки), `creme-brulee_1019_2` (Ален
Дюкасс, Grand Livre de Cuisine Bistrot), `saint-honore-a-la-vanille-jimmy-mornet_16398_2`
(Джимми Морне, Le Paris des pâtisseries), `baba-au-rhum-vanille-bourbon-et-truffe-noire_12293_2`
(Джессика Преолато).

**Batch 2 (5 замен) — осознанный выбор Meilleur du Chef вместо ADG.** MdC уже
входит в `TRUSTED_DOMAINS`, не закрыт подпиской и публикует полные «phases
techniques»; значительная часть ADG — Premium, то есть такая цитата стала бы
логин-стеной по §4. Замены: `canneles-bordelais-facile.html` (включая culottage
медных форм и правила ухода — ровно то, о чём спорит статья), `kouglof.html`
(изюм Коринфа от 1 часа, порядок закладки, замес крюком 15–20 минут, расстойка
не выше 28 °C), `financier-chocolat.html` (база финансье), `tuiles-dentelles.html`
(pâte à tuiles на рубленом миндале с полной пропорцией), `pain-perdu-caramel-beurre-sale.html`.

**Правило датировки, применённое здесь впервые явно.** Замена ссылки, не
меняющая ни одного утверждения в теле статьи, — редакционная, а не содержательная
правка, поэтому `lastmod` не двигается. Политика `/corrections/` запрещает
выдавать мелкую правку за содержательное обновление; это работает в обе стороны.
Содержательные правки (Wave 2 calisson, Wave 3 шесть статей) дату получили.

### 7.4.1 Wave 4, batch 3–4 — `b88f236`, `f1eaeae`

Рэтчет: **53 → 47 → 43** (из 560 цитат).

**Batch 3 (6 замен), все — Meilleur du Chef с полной техникой:**
`quatre-quarts.html` (канонические четыре равные части: 250 г яиц / сахара /
размягчённого масла / муки T55 — название десерта и есть рецепт);
`mouler-brioche.html` (формовка, а не ещё одно тесто: деление на четыре части с
пропорцией 1/4–3/4 для brioche à tête, расстойка около 27 °C, дорюр без осаживания
теста, 180 °C); `creme-renversee-caramel.html` (crème renversée — французское имя
крем-карамели: 130 г сахара на 5 cl воды и прямое предупреждение, что тёмная
карамель даёт горечь); `pate-gaufres.html` (профессиональная пропорция с
флёрдоранжем, гофрьер 180 °C); `beignet-sucre-dessert.html` (farine de Gruau T45,
свежие дрожжи, молоко строго не выше 40 °C, выпечка без фритюра);
`comme-mont-blanc-chocolat-marron.html` — в подписи честно помечен как авторская
версия, чтобы реинтерпретация не выдавалась за классику.

**Batch 4 (4 замены):** `pate-feuilletee-inverse.html` — не приблизительная замена, а буквально
feuilletage inversé (détrempe, tour double, затем tour simple, раскатка 1 см,
отдых 30 минут); в пару дана `croute-bouchee-carree.html` с полной пропорцией,
которой нет на первой странице: 300 г муки T45, 150 г воды, 5 г соли, 300 г масла,
100 г муки — то есть масло и мука в равном весе, что и делает тесто обратным.
Далее `tarte-normande.html` (400 г слоёного теста, 1 kg Royal Gala, 10 cl
crème fraîche épaisse, белки serrés 80 г сахара, желтки в тёплый компот —
нормандский порядок сборки), `tartelette-pommes.html` (полная пропорция
feuilletée, компот из Golden, nappage blond) и `sables.html` (масло с сахаром на
насадке feuille, tant pour tant, отдых от часа до суток, 170 °C).

Принцип отбора во всех батчах один: замена обязана нести тот параметр, вокруг
которого построено тело статьи, а не просто совпадать с названием блюда.

### 7.5 Очередь Wave 4 (не закрыто)

Осталось **43 слабые цитаты** при цели 0:

- **~16 поисковых выдач ADG**: fantastik, caramel tendre, soufflé chocolat,
  madeleine, charlotte aux fraises, bourdaloue, gâteau basque, croquembouche,
  œufs à la neige, dacquoise, crêpes Suzette
  (закрыта), bûche de Noël, blanc-manger, marrons glacés, fondant au chocolat,
  tarte au sucre. Уже закрыты в batch 1–4: tarte tatin, crème brûlée,
  saint-honoré, baba au rhum, chantilly, crêpes, cannelé, kouglof, financier,
  tuiles, pain perdu, brioche, quatre-quarts, gaufres, beignets, crème caramel,
  mont-blanc, feuilletage inversé, tarte normande, tarte aux pommes, sablés.
  Рабочий метод уже отлажен: `site:meilleurduchef.com/fr/recette <блюдо>`
  отдаёт прямой URL с полным текстом техники.
- **1 поисковая выдача Mercotte** — `mercotte.fr/?s=charlotte` в
  `recipe-charlotte-fraises` (в той же статье вторая слабая цитата).
- **~22 голых корня maison-сайтов** — крупнейшие пачки:
  `jacquesgenin.fr/univers` ×5 (страница содержательная, но гейт считает
  `/univers` generic — нужны более глубокие URL), `christophemichalak.com` ×3,
  `christophe-felder.com` ×2, `cinqsensparis.com` ×2, `visit.alsace` ×2,
  `dominiqueansel.com` ×2, затем по одному: `cedric-grolet.com`,
  `delicatisserie.com`, `lapatisseriecyrillignac.com`, `leclairdegenie.com`,
  `baillardran.com`, `legateaubasque.com`, `calisson.com`, `clementfaugier.fr`,
  `nicolaspaciello.com`.
- **Рэтчет редиректов на главную** (§7.2) всё ещё в режиме наблюдения:
  `MAX_ROOT_REDIRECTS = None`. Нужно снять базовое число из CI-прогона и
  зафиксировать его как бюджет.

Из 53 находок сканера статусных утверждений закрыты 6 (calisson, canelé, Stohrer,
Genin, Hermé, Conticini); остальные требуют такой же проверки по первоисточникам.

### 7.6 Wave 4, batch 5–7 + офлайн-реестр мёртвых URL — `b57956f`, `1b65f92`, batch 7

**Результат по рэтчету:** 43 → 37 → 33 → **29** слабых цитат. Совокупно с начала
Wave 2: 73 → 29. Цитат в корпусе стало **562** (batch 7 добавил чистый документ).
Поисковых выдач осталось **3** из 12, с которых начиналась Wave 4.

**Batch 5 (`b57956f`)** — 5 статей. Ключевой случай: `recipe-charlotte-fraises`
держала сразу две слабые цитаты (поисковая выдача ADG и `mercotte.fr/?s=charlotte`);
закрыты **разными** документами, а не одним продублированным — `charlotte-fraise`
и `charlotte-tutti-frutti`. Скрипт замен ради этого переработан: статья теперь
сопоставляется с упорядоченным списком цитат, а не с одной строкой.

**Batch 6 (`1b65f92`)** — 4 статьи с полными пропорциями: tarte au sucre,
tarte citron meringuée, île flottante, croquembouche. Для croquembouche ссылка не
заменена, а **добавлена вторая**: первая страница даёт сборку (panade, сушка декора,
погружение шу на 3/4 в карамель, изомальтовая dentelle), и только
`croquembouche-chiffre-nougatine` раскрывает состав склеивающей карамели
(glucose + fondant blanc) и тест консистенции по следу лопатки. У статьи 4 источника.

**Batch 7** — 4 статьи: blanc-manger aux amandes, fondant au chocolat,
gâteau basque (две версии — с cerises noires и à la crème) и tarte bourdaloue.
Каждый документ проверен прямым fetch'ем либо поисковой выдачей, отдавшей полный
текст страницы с пропорциями.

#### Найденный дефект и устранение дыры в гейте

При верификации bourdaloue выяснилось, что `recipe-tarte-bourdaloue` цитировала
`meilleurduchef.com/fr/recette/tarte-bourdaloue.html` — страница возвращает
soft-404 («Nous n'avons pas trouvé cette page»). Существеннее сама находка:
**гейт живости не способен увидеть это без сети.** `main()` возвращает 0 до
этапа зондирования, когда `network_available()` ложна, поэтому мёртвые цитаты
ловятся только в CI под `--require-network` и невидимы локально и на ревью.

В `scripts/audit_source_links.py` добавлен `KNOWN_DEAD_URLS` — реестр URL, чья
смерть доказана прямым fetch'ем. Проверка стоит **до** сетевой ветки, поэтому
вердикт действует в любом окружении: вернуть мёртвую цитату не получится ни
локально, ни в CI. Механизм проверен негативным тестом: временная вставка того
же URL роняет гейт с `exit=1` и точным указанием статьи, после отката — снова 0.
Реестр растёт по мере верификации; запись удаляется только после живой
перепроверки.

#### Что осталось

- **3 поисковые выдачи**: `fantastik` (создание Мишалака — на Meilleur du Chef
  прямой техники нет, нужен первоисточник другого рода), `caramel tendre`
  (Женин), `marrons glacés` (техники конфисажа на MdC нет — тему не подменять).
- **26 голых корней** — теперь это основной объём. Крупнейшие пачки:
  `jacquesgenin.fr/univers` ×5, `christophemichalak.com` ×3,
  `christophe-felder.com` ×2 (+1 `/recettes/`), `cinqsensparis.com` ×2,
  `visit.alsace` ×2, `dominiqueansel.com` ×2 и десять одиночных. Каждая замена
  требует открытия конкретной страницы: угадывание slug недопустимо — batch 7
  это подтвердил эмпирически (два угаданных slug дали 404, причём один из них
  уже стоял в корпусе).
- **`MAX_ROOT_REDIRECTS`** по-прежнему в режиме наблюдения: базовое число
  снимается только с сетевого прогона CI.
- **Проверка статусных утверждений**: закрыты 6 из 53 находок сканера.

#### Статус проверки batch 7

Прогнаны и зелёные: `audit_source_links` (включая новую офлайн-ветку),
`audit_editorial_quality` (155 статей, 499 ссылок расширения, минимум 2,
замечаний 0), `audit_content`, `audit_article_depth`; независимый подсчёт слабых
определением самого гейта (`generic_path`) — ровно 29 при бюджете 29; негативный
тест `KNOWN_DEAD_URLS`; ноль вставок `${}`; баланс кавычек и backtick во всех
изменённых template literal.

Не прогнано: `npm run validate` целиком. npm-реестр из песочницы недоступен
(`ECONNRESET`), `node_modules` и `dist/` не переживают смену хода, а прямого
сетевого доступа из bash нет (HTTP 000) — значит `tsc`, сборка Astro и
dist-гейты SEO/sitemap/Canon локально невыполнимы. Полный validate подтвердит CI.

Отдельно зафиксировано: окружение дважды пере-клонировало репозиторий на базовом
коммите `aa82176`, из-за чего локальный HEAD терял историю волн. Оба раза
восстановлено через `git fetch origin` + `git reset --mixed <remote-tip>`,
который переставляет HEAD и индекс, не трогая рабочее дерево; force-push не
потребовался, гранулярная история коммитов сохранена.

### 7.7 Wave 4, batch 8 — голые корни maison-сайтов → глубокие документы — batch 8

**Рэтчет: 29 → 23** слабых цитат при 562 цитатах. Поисковых выдач осталось **2**
(из 12 на старте Wave 4): `caramel tendre` и `marrons glacés`. Совокупно с начала
Wave 2: 73 → 23.

Заменено 6 голых корней на документы с собственных сайтов домов. Каждый проверен
выдачей, вернувшей полное тело страницы (ингредиенты и метод), а не только заголовок:

- **`michalak-fantastik`** закрыл сразу две слабые цитаты разными документами:
  `content/lhistoire-dun-chef` — это собственное определение Fantastik домом
  (mi-entremets / mi-tarte, круглый торт 3 см высотой, сезонные продукты,
  **без заморозки**, рецептура менялась ежедневно, более 700 уникальных созданий
  за два года, Take-away и линия Kosmik/Koonie/Klassik), и
  `recettes/visitandine-framboise-litchi` — полный рецепт в его стандартной
  конструкции с точными весами (visitandine: beurre noisette 180 г, сахарная
  пудра 140 г, poudre d'amande brute 70 г, кокос 70 г, сырые белки 20 г,
  190 °C 25 мин; crémeux framboise до 83 °C с 4 г желатина и 85 г холодного
  масла). Статья о торте высотой 3 см теперь цитирует страницу, где эти 3 см
  названы самим автором.
- **`felder-alsace`** — две замены: `recettes/index.php?id=120` (Kougelhopf sucré
  aux raisins целиком: levain 10 г свежих дрожжей / 35 г воды / 50 г T45 под
  слоем муки 30 минут; тесто 225 г T45, 1 яйцо, 125 г молока, 40 г сахара,
  1 ч. ложка соли, 65 г мягкого масла; крюк ~10 минут; 50 г изюма в тёмном роме;
  расстойки 1 ч 30 мин и 2 ч; по одному миндалю на ребро формы; 170 °C конвекция
  20–25 мин; выход 2 × 12 см / 600 г теста) и `index.php?id=118` (Kouglof
  Chocolat façon cake с темперированием, погружением основания и трафаретной
  пудрой, включая предупреждение автора, что темперированный шоколад должен
  застыть естественно, без избыточного холода). Статья про эльзасскую линию
  больше не ссылается на корень регионального портала.
- **`felder-fundamentals`** — `rech.php?...fiche=49` (Brioche полностью:
  250 г муки, 25 г сахара, 3 яйца, 10 г дрожжей, 8 г соли, 150 г масла; вымес до
  отлипания, подъём 1 час, обязательная обминка для удаления CO₂, 2 часа в холоде,
  12 шаров, 180 °C).
- **`genin-caramel-philosophy`** — `product/mosaique-500`: декларация состава от
  самого дома, где карамель названа прямо — сахар, масло, сливки, глюкоза,
  fleur de sel, а по ассортименту каштановый мёд, ваниль Таити, кофе, фёва тонка,
  лакрица; рядом pâte de fruits и нуга (каштановый мёд, миндаль Marcona,
  фисташка Bronte, белок, безглютеновая азимная облатка), всё без ароматизаторов
  и консервантов.

**Принцип отбора, зафиксированный намеренно:** заменялись только те корни, где
найденный документ действительно поддерживает тему статьи. Остальные голые корни
оставлены как есть — неподходящая цитата хуже слабой. Именно поэтому в этом батче
6 замен, а не 16.

**Оговорка об URL Felder:** его рецепты отдаются по `http://` (не `https://`) и по
номерным адресам `index.php?id=…` / `rech.php?…fiche=…`. В корпус записаны ровно
те формы URL, которые подтверждены живыми; приведение к `https` без перепроверки
создало бы риск новой мёртвой ссылки — этого batch 7 уже показал цену.

**Проверка batch 8:** `audit_source_links` (включая офлайн-ветку `KNOWN_DEAD_URLS`),
`audit_editorial_quality` (155 статей, 499 ссылок расширения, минимум 2,
замечаний 0), `audit_content`, `audit_article_depth` — зелёные; слабых цитат
определением самого гейта (`generic_path`) ровно 23 при бюджете 23; негативный
тест `KNOWN_DEAD_URLS` повторён после правки рэтчета и даёт `exit=1` с указанием
статьи, после отката `exit=0`; ноль вставок `${}`; баланс кавычек и backtick
сохранён. Полный `npm run validate` по-прежнему невыполним локально (npm-реестр
недоступен, `node_modules`/`dist/` не переживают смену хода, прямого egress из
bash нет — HTTP 000) и подтверждается в CI.

### 7.8 Wave 4, batch 9 — ещё четыре корня, и два фрезье вместо индекса рецептов — batch 9

**Рэтчет: 23 → 19** слабых цитат при **563** цитатах. Поисковых выдач по-прежнему 2.
Совокупно с начала Wave 2: 73 → 19. Слой расширения: 500 ссылок, минимум 2,
среднее 3.23, замечаний 0.

- **`recipe-kouglof`** больше не ссылается на корень регионального портала
  `visit.alsace` — вместо него полная рецептура кугопфа самого Фельдера
  (`index.php?id=120`). Статья и раньше держала живую страницу MdC `kouglof.html`
  (изюм Коринфа от 1 часа, дрожжи в тёплом молоке, замес крюком 15–20 минут,
  расстойка не выше 28 °C, 180 °C 30–35 минут), так что теперь у неё три источника
  и два из них — полные пропорции.
- **`felder-fraisier`** — самая содержательная замена батча. Общий индекс
  `christophe-felder.com/recettes/` заменён **двумя** документами MdC:
  `mon-fraisier.html` даёт механику сборки, которую статья и требует довести до
  автоматизма (crème mousseline vanille на 500 г молока, 120 г сахара, 2 стручка
  ванили, 100 г желтков, 50 г poudre à crème; масло в два приёма — 40 г в горячий
  крем и 80 г при взбивании; половинки клубники плоской стороной наружу и строго
  вертикально; крем шнуром в контакт с ягодами и вжатый мини-лопаткой, чтобы не
  осталось пузырей воздуха; диск Joconde с фисташкой под кольцо Ø 20 см; минимум
  1 час холода, лучше 3–4 часа до подачи; лента PVC для распалубки), а
  `fraisier-sans-gluten.html` — точную пропорцию крема (420 г молока, 105 г сахара,
  120 г желтков, 22 г рисовой муки, 22 г Maïzena, 2 стручка, 300 г beurre pommade)
  и решающее правило против «зерна»: масло и остывший крем патисьер должны быть
  **одинаковой комнатной температуры**, а если масло всё же свернулось, стенки дежи
  слегка прогревают горелкой. На той же странице — историческая ремарка, прямо
  относящаяся к версии Фельдера: раньше crème mousseline для fraisier
  ароматизировали киршем, сегодня оставляют на ванили. У фельдеровского фрезье
  как раз киршевый сироп для пропитки, поэтому документ подтверждает тему статьи,
  а не просто соседствует с ней.
- **`genin-ganache-craft`** — вместо секционной страницы `/univers` декларация
  состава от самого дома (`product/ecrin-ganaches-pralines-36`): 36 штук, 240 г,
  две трети чёрных и треть молочных; ганаш на чёрном минимум 64 % какао или
  молочном минимум 33 % со сливками; пралине на карамелизованных орехах с маслом
  (миндаль, фундук, фисташка Bronte, пекан, какао-бобы, жасмин, розмарин,
  feuilletine, fleur de sel, шафран, цедры); всё натуральное, без ароматизаторов и
  консервантов; хранение в сухом месте **14–20 °C** и употребление **в течение двух
  недель**. Для статьи о ганаше как о продукте терруара это первичный документ.
- **`genin-autodidact`** — `product/barres-fines`: собственная формулировка его
  метода (чёрный 64 %, тонко хрустящий, в паре с пралине из фундука с кофе, а рядом
  пралине с каперсами с острова Пантеллерия, «чтобы отважиться на неизведанное»).

**Не заменено намеренно.** `genin-millefeuille` и `genin-tarte-au-citron-canon`
оставлены на `jacquesgenin.fr/univers`: верифицированной глубокой страницы про
мильфей или лимонный тарт на сайте дома нет, а подстановка нерелевантного продукта
исказила бы источник. Тот же принцип держит остальные 15 корней (Michalak ×2,
Genin ×2, CinqSens ×2, Ansel ×2, Grolet, Metayer, Lignac, Adam, Baillardran,
calisson, Clément Faugier, Paciello).

**Проверка batch 9:** `audit_source_links` (включая офлайн-ветку
`KNOWN_DEAD_URLS`), `audit_editorial_quality`, `audit_content`,
`audit_article_depth` — зелёные; слабых цитат определением самого гейта
(`generic_path`) ровно 19 при бюджете 19; ноль вставок `${}`; баланс кавычек и
backtick сохранён; двухстрочная замена в `felder-fraisier` проверена выводом
итогового блока целиком. Полный `npm run validate` по-прежнему подтверждает CI
(реестр npm из песочницы недоступен, `node_modules`/`dist/` не переживают смену
хода, прямого egress из bash нет).

### 7.9 Wave 4, batch 10 — Ансель и Пачелло: корни заменены первоисточниками — batch 10

**Рэтчет: 19 → 15** слабых цитат при 563 цитатах. Совокупно с начала Wave 2:
73 → 15. Осталось 2 поисковые выдачи и 13 голых корней.

- **Обе статьи об Анселе** (`ansel-cronut-origin`, `ansel-cronut`) ушли с корня
  сайта на `dominiqueansel.com/chef/` — это первоисточник происхождения Cronut в
  словах самого автора: лауреат James Beard Award; Cronut в списке «25 лучших
  изобретений 2013 года» журнала TIME; запуск в мае 2013 года в его пекарне в
  Нью-Йорке, первая в мире «вирусная» выпечка; на доводку — два месяца и более
  десяти рецептур; это **не просто обжаренное круассанное тесто**: ламинированное
  тесто напоминает круассан, но сделано по собственной рецептуре, сначала
  расстаивается, затем обжаривается в виноградном масле при конкретной
  температуре; после жарки каждый Cronut обваливают в сахаре, наполняют кремом и
  покрывают глазурью, и весь цикл занимает **три дня**; продажа только в
  Dominique Ansel Bakery (Нью-Йорк, Лондон, Лос-Анджелес), вкус меняется ежемесячно
  и никогда не повторяется. Та же страница закрывает и вторую статью — про период
  после Cronut: DKA (Dominique's Kouign Amann), madeleines по заказу и Dominique
  Ansel Workshop, открытый в июле 2021 года как круассанная стойка внутри его
  кухонь в Flatiron.
- **Обе статьи о Пачелло** (`paciello-praline-art`, `paciello-cinqsens`) ушли с
  `nicolaspaciello.com` и с корня CinqSens на продуктовую страницу собственного
  Paris-Brest магазина: pâte à choux, нежный крем на фундучном пралине, текучее
  сердце из домашнего praliné noisette и кусочки обжаренного фундука. Для статьи о
  пралине как о художественном жесте это ровно та конструкция, о которой она
  говорит — база, крем, текучее сердце, хруст; страница несёт собственную
  продуктовую JSON-LD-разметку продавца CinqSens, то есть это не витрина, а
  документ.

**Осталось 15 слабых цитат:** 2 поисковые выдачи (`caramel tendre` — Женин,
`marrons glacés` — техники конфисажа на MdC нет) и 13 голых корней:
`jacquesgenin.fr/univers` ×2 (мильфей и лимонный тарт — глубоких страниц нет),
`christophemichalak.com`, `cinqsensparis.com` (статья о детских сладостях),
`cedric-grolet.com`, `delicatisserie.com`, `lapatisseriecyrillignac.com`,
`leclairdegenie.com`, `baillardran.com`, `calisson.com`, `clementfaugier.fr`,
`legateaubasque.com`.

**Проверка batch 10:** все четыре Python-гейта зелёные (`audit_source_links`
включая офлайн-ветку `KNOWN_DEAD_URLS`, `audit_editorial_quality` — 155 статей,
минимум 2 ссылки, замечаний 0, `audit_content`, `audit_article_depth`); слабых
определением самого гейта ровно 15 при бюджете 15; ноль вставок `${}`; баланс
backtick сохранён. Полный `npm run validate` подтверждает CI.

### 7.10 Wave 4, batch 11 — три дома: история, спецификация формы, послойная конструкция — batch 11

**Рэтчет: 15 → 12** слабых цитат при **565** цитатах. Совокупно с начала Wave 2:
73 → 12. Слой расширения: 502 ссылки, минимум 2, среднее 3.24, замечаний 0.

- **`recipe-canele`** — статья о медных формах, пчелином воске и двухэтапной
  выпечке держала корень `baillardran.com` рядом с живой страницей MdC про
  culottage. Корень заменён **двумя** документами дома, и они закрывают именно те
  две половины темы, которых не было: историческую и инструментальную.
  `D'où vient le canelé traditionnel de Bordeaux ?` даёт происхождение в XVIII веке
  и связь с монахинями Couvent des Annonciades, основание Maison Canelés
  Baillardran Филиппом Байяраном в 1988 году, роль Confrérie des Canelés de
  Bordeaux и описание формы — карамелизованная хрустящая «роба» при мягкой
  сердцевине на ванили и роме, плюс варианты (классический, безалкогольный, с
  начинками). Вторая страница даёт **спецификацию самой медной формы**: лужёная
  медь, вместимость 60 г, диаметр 5,5 см, высота 4,5–5 см, 9,20 €, производство в
  Европе, — и приём возврата хруста: 5 минут при 200 °C, затем 15 минут при
  комнатной температуре. Это ровно «двухэтапность», о которой статья говорит.
- **`adam-eclair`** — вместо корня биографическая страница дома
  `portfolio/son-histoire/`: концепция, целиком посвящённая эклеру, запущена в
  **2012** году; десерты «оттачиваются» в парижских лабораториях; «Meilleur
  Pâtissier de l'année» **2014** по гиду Pudlo; «Meilleur pâtissier **2015**» по
  Relais Desserts; в **2017** году Vanity Fair ставит Адама на 40-е место в списке
  50 самых влиятельных французов мира. Статья про эклер как холст и 200 вариаций
  получает датированные подтверждения статуса, а не витрину.
- **`grolet-fruits-full`** — статья о фруктах, оболочке, начинке, аэрографе и
  правдоподобии держала книгу Ducasse Édition «Fruits» и корень сайта. Корень
  заменён двумя документами: страница Le Meurice перечисляет **послойную
  конструкцию** каждой скульптурной фигуры — Fresh Mango (манговое желе, взбитые
  сливки с ванилью, конфи из манго на ванили, бисквит), Red Apple (текучее сердце
  из красного яблока с ванилью, пралине-крустийан на бретонском сабле, ванилевый
  мусс), Cocoa Pod, Mango Tart и Mix Nuts, где три ореха разложены по одной схеме
  (карамель, пралине-крустийан, мусс); карточка отдельного плода Fruit de la
  Passion добавляет то, чего в списках нет, — **происхождение названо прямо:
  Бразилия**, и это единственный документ в корпусе, где терруар гролетовского
  фрукта указан самим домом.

**Осталось 12 слабых цитат:** 2 поисковые выдачи (`caramel tendre`, `marrons
glacés`) и 10 голых корней — `jacquesgenin.fr/univers` ×2 (мильфей и лимонный
тарт: глубоких страниц нет, замена намеренно не делается), `christophemichalak.com`
×2, `cinqsensparis.com`, `delicatisserie.com`, `lapatisseriecyrillignac.com`,
`calisson.com`, `clementfaugier.fr`, `legateaubasque.com`.

**Проверка batch 11:** все четыре Python-гейта зелёные (`audit_source_links`
включая офлайн-ветку `KNOWN_DEAD_URLS`, `audit_editorial_quality`, `audit_content`,
`audit_article_depth`); слабых определением самого гейта ровно 12 при бюджете 12;
ноль вставок `${}`; баланс backtick сохранён. Число цитат в комментарии рэтчета
было сначала записано как 566 и исправлено на фактическое 565 до коммита —
расхождение поймано независимым пересчётом, а не на глаз. Полный `npm run validate`
подтверждает CI.

### 7.11 Wave 4, batch 12 — Мишалак, Roy René и Clément Faugier: 12 → 7 — batch 12

**Рэтчет: 12 → 7** слабых цитат при 565 цитатах (все замены 1:1, объём не изменился).
Совокупно с начала Wave 2: 73 → 7. Поисковых выдач осталась **одна** из 12.

- **`michalak-religieuse`** — статья о карамельной религиёз по Мишалаку держала
  корень сайта рядом с живой страницей ADG `religieuse-caramel-beurre-sale`.
  Корень заменён карточкой изделия самого дома
  `religieuse-caramel-6-pers`: полный состав — pâte à choux, craquelin, crémeux
  caramel, crème légère на мадагаскарской ванили и crémeux caramel onctueux;
  **700 граммов на 6 персон**, 52,00 €; производство — Laboratoire Christophe
  Michalak, Mak 3 SAS, 8-10 rue des Cévennes, 94150 Rungis; аллергены и режим
  хранения, который и определяет подачу: **2–6 °C, употребить в течение 3 дней,
  достать из холодильника за 5 минут до дегустации**.
- **`michalak-chocolate-salt`** — вместо корня карточка
  `patisserie/glace-tarte-chocolat-caramel-fleur-de-sel`, в самом названии которой
  соединены оба полюса статьи; в том же документе — Kosmik Snickers (мусс на
  blond-шоколаде, мягкая карамель с fleur de sel, крамбл без муки, карамелизованный
  арахис) и Religieuse Caramel Beurre Salé, то есть соль в его линии работает не
  акцентом, а конструктивным элементом.
- **`recipe-calisson`** — статья и до этого держала сильный набор (Mercotte с
  домашним рецептом, UFCA по проекту IGP, INAO, вопрос в Сенате о защите
  наименования), но корень Confiserie du Roy René заменён на развёрнутый
  первоисточник дома `blog/lorigine-du-calisson-daix-legendes-et-histoire/`:
  силуэт удлинённого ромба, blond-паста из миндаля и засахаренной дыни,
  белоснежная glace royale; две соперничающие легенды — свадьба короля Рене
  Анжуйского с Жанной де Лаваль в **1454** году и этимология «Venez au calice»;
  средиземноморные корни и критские kalitsounia как дальний родственник; Экс как
  столица калиссона минимум с XIX века и его место среди **13 провансальских
  рождественских десертов** между белой и чёрной нугой; и главное — «формула
  третей»: треть миндаля, треть засахаренной дыни, треть сахарного сиропа, паста
  на тонком листе hostie и glace royale на яичном белке, гладкая и матовая;
  калиссонье Roy René работают с **1920** года.
- **`recipe-marrons-glaces`** закрыла **обе** свои слабые цитаты двумя разными
  документами Clément Faugier. Поисковая выдача ADG заменена карточкой Marrons
  Glacés Gros Cassés Frais (ballotin 300 г) с формулировкой дома: «уже более
  **140 лет** дом Clément Faugier прославляет **ардешский каштан** в своей
  знаменитой crème de marrons и в своих marrons glacés». Корень заменён карточкой
  Marrons Confits Brisés au Sirop (700 г), которая описывает ровно ту стадию, где
  конфисаж отделён от глазуровки: после вскрытия коробки неиспользованные обломки
  держат в сиропе, где они сохраняются в холодильнике несколько недель, и
  **глазируют позже, по мере надобности**. Это единственный документ в корпусе,
  разделяющий две стадии, — и он закрывает тему, по которой на Meilleur du Chef
  прямой техники нет вообще.

**Осталось 7 слабых цитат:** 1 поисковая выдача (`caramel tendre` в
`genin-caramel-philosophy`) и 6 голых корней — `jacquesgenin.fr/univers` ×2
(`genin-millefeuille`, `genin-tarte-au-citron-canon`: глубоких страниц про мильфей
и лимонный тарт на сайте дома нет), `lapatisseriecyrillignac.com`,
`delicatisserie.com`, `cinqsensparis.com`, `legateaubasque.com`.

**Проверка batch 12:** все четыре Python-гейта зелёные (`audit_source_links`
включая офлайн-ветку `KNOWN_DEAD_URLS`, `audit_editorial_quality` — 155 статей,
минимум 2 ссылки, замечаний 0, `audit_content`, `audit_article_depth`); слабых
определением самого гейта ровно 7 при бюджете 7; ноль вставок `${}`; баланс
backtick сохранён. Полный `npm run validate` подтверждает CI.

### 7.12 Wave 4, batch 13 — Lignac и Métayer: 7 → 5 — batch 13

**Рэтчет: 7 → 5** слабых цитат при 565 цитатах (замены 1:1). Совокупно с начала
Wave 2: **73 → 5**. Слой расширения: 502 ссылки, минимум 2, замечаний 0.

Закрыты последние два корня, для которых нашлась действительно уместная глубокая
страница. Обе цели **проверены на `generic_path()` до подстановки**, а не на глаз:
гейт подтвердил, что ни `/en/shops`, ни `/en/shop/` не считаются generic, — иначе
замена не снизила бы счётчик и создала бы видимость работы.

- **`lignac-patisserie-shop`** («как высокая выпечка стала соседской») вместо корня
  сайта получила страницу `Shops` самого дома: полный перечень точек с адресами,
  телефонами и **различающимися часами работы** — La Pâtisserie Chaillot
  (2 rue de Chaillot, 75016), La Chocolaterie (25 rue Chanzy, 75011, с зоной
  дегустации), Galeries Lafayette Le Gourmet (35 boulevard Haussmann, 75009), точка
  на 55 boulevard Pasteur (75015), La Pâtisserie Saint-Tropez (66 Route des Plages)
  и Saint-Tropez Village (1 rue de l'Annonciade). Часы — от ежедневных 7:00–21:00 до
  10:00–19:30 со вторника по пятницу, с датами августовского закрытия. Это
  документальное подтверждение того самого «соседского масштаба», который статья
  утверждает: высокая выпечка раздаётся по квартальным адресам с расписанием
  обычной булочной.
- **`metayer-secrets`** вместо голого домена получила страницу `Boutique` —
  структурированный репертуар Нины Метайе по коллекциям: «Créations de saison»
  (Fraisier, тарт с клубникой и мятой, Inspiration Sobacha, тарт с малиной и цветком
  красного перца, Tropézienne), «Les intemporelles» (Saint-Honoré, чизкейк, тарт
  лимонный меренговый, шоколадный тарт, flan на компанию, дегустационный набор из
  четырёх деликатесов), «Gâteaux de voyage» (moelleux с красными ягодами и
  умэбоси-кунжутом, Tigré, мармурный кекс, палье с корицей, Petit galopin, Brookie,
  печенье с фисташкой и с фундуком) и «Chocolat & bonbons» (Capucine, Coquelicot,
  Chocolate Daisy, Hollyhock, леденцы, кремовая карамель с fleur de sel, намазка
  пралине-фисташка, хрустящий батончик с карамелизованным фундуком). Для статьи о
  её выпечке это перечень того, что она печёт на самом деле.

**Осталось 5 слабых цитат — и каждая оставлена осознанно, четвёртый батч подряд:**
- `genin-millefeuille` и `genin-tarte-au-citron-canon` — `jacquesgenin.fr/univers`.
  Повторный поиск подтвердил: глубже страницы на сайте дома нет; `/univers` содержит
  его собственную цитату («Je travaille une matière de rêve : le chocolat. Le sucre,
  aussi, aux mille et une métamorphoses. Ils sont ma sève. La tendresse ultime.») и
  перечень того, что он делает, но ни мильфея, ни лимонного тартa там нет.
  Подстановка нерелевантного продукта исказила бы источник.
- `genin-caramel-philosophy` — последняя поисковая выдача (`caramel tendre`).
  Собственная декларация карамели дома уже стоит в этой статье с batch 8
  (`product/mosaique-500`); второй документ про карамель у Женина не подтверждён.
- `paciello-childhood` — `cinqsensparis.com`: страница с мадленами, которая
  подошла бы статье о детских сладостях, не верифицирована (подтверждена только
  страница Paris-Brest, уже использованная в двух других статьях).
- `recipe-gateau-basque` — `legateaubasque.com`: это музей в Sare, корень здесь
  уместен по смыслу, но гейт считает его generic; глубокая страница музея не
  подтверждена, а две полные рецептуры MdC в статье уже есть с batch 7.

**Проверка batch 13:** все четыре Python-гейта зелёные; слабых определением самого
гейта ровно 5 при бюджете 5; ноль вставок `${}`; баланс backtick сохранён. Полный
`npm run validate` подтверждает CI.
