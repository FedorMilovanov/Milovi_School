# Качество контента и французская источниковая база — тотальная проверка и волны работ

**Дата:** 2026-09-15
**Ветка:** `arena/01a0a6df-milovi-school` (от `aa82176`)
**Причина открытия:** запрос владельца на тотальную проверку правил проекта и наполненности статей, с прицелом на качественный материал на базе топовых французских источников.
**Статус Wave 0:** выполнен, `npm run validate` зелёный.
**Статус Wave 2:** closeout выполнен — рэтчет `MAX_WEAK_CITATIONS` снижен 73 → **0**; слабые цитаты больше не допускаются.
**Статус внепланового прохода точности:** выполнен (см. §7).

Этот документ — постоянный журнал и authority по качеству контента. Он не заменяет
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
- **противоречие `audit/` закрыто перед PR:** `audit/site-audit-report.md` —
  генерируемый вывод `scripts/audit_site.py` — удалён из git-индекса и остаётся
  игнорируемым. Поэтому локальный аудит больше не пачкает дерево устаревшим snapshot.
  `audit/professional-fix-audit-2026-05-17.md` сохранён как намеренное историческое
  исключение: это архивный human-readable отчёт, а не текущий generated state.

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
4. **Противоречие `audit/` закрыто:** `audit/site-audit-report.md` больше не
   отслеживается и остаётся генерируемым локальным/CI-артефактом. Устаревший snapshot
   (181 изображение / 155 article pages / 159 sitemap URL) удалён из индекса.
   Архивный `professional-fix-audit-2026-05-17.md` оставлен отслеживаемым намеренно
   как исторический документ; `.gitignore` прямо фиксирует это исключение.
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

### 7.13 Волна верификации статусных утверждений: сканер как постоянный инструмент и первая найденная фактическая ошибка

Рэтчет слабых цитат к этому моменту фактически выбран (5 из 568, и все пять оставлены
осознанно — см. §7.12), поэтому работа переведена на класс риска, который до сих пор
не был покрыт ни одним гейтом: **статусные утверждения**. Гейт живости проверяет, что
URL живой и конкретный, но не может проверить, что предложение истинно.

#### `scripts/audit_status_claims.py` — новый постоянный инструмент

Прежний сканер жил в `artifacts/scan_status_claims.py`, то есть в каталоге, который
игнорируется git'ом и не переживает смену хода, — фактически он был потерян. Сканер
восстановлен в `scripts/`, то есть стал частью репозитория, а не одноразовой поделкой.

Он механически и избыточно собирает предложения-кандидаты по десяти маркерам
(MOF, титулы «лучший кондитер», чемпионаты, награды, «первый/изобретатель», даты,
превосходные степени, рекорды, звёзды Michelin, объекты наследия) и выдаёт их с id
статьи и сработавшим маркером. Сканер **не судит об истинности** — верификация
делается вручную по первоисточнику, а результат фиксируется здесь. Есть `--json`,
`--marker` и `--article` для точечной работы.

Первый прогон: **680 кандидатов в 135 статьях**. Из них 563 — просто четырёхзначные
годы (шум), а ценные классы: MOF 18, «первый/изобретатель» 14, титулы «лучший
кондитер» 12, награды 8, рекорды 8, звёзды Michelin 6, чемпионаты 3, наследие 3.

#### Найденная и исправленная фактическая ошибка: награда Нины Метайе

Сканер выдал два предложения о Метайе, и сверка показала, что **два слоя корпуса
противоречат друг другу**.

Слой расширения (`part6.ts`) был точен и даже содержал явный запрет на смешивание:
«В 2023 году Метайе получила титул, присуждённый Международным союзом пекарей и
кондитеров UIBC. В 2024 году её назвала лучшим шеф-кондитером мира организация
The World's 50 Best Restaurants. Это две отдельные награды с разными организаторами
и годами».

Базовый слой (`deepContents.ts`) содержал ошибку: «В октябре 2023 года на церемонии
World's 50 Best Restaurants **в Валенсии** Нина Métayer получила титул лучшего
кондитера мира — **World's Best Pastry Chef**. В зале её встретили аплодисментами
стоя.»

Проверка по первоисточникам (Euronews от 27 октября 2023, собственный сайт Метайе,
Sortiraparis от 7 июня 2024, список лауреатов the50.com) даёт другую картину, и
расхождение оказалось тройным:

| | в корпусе было | фактически |
|---|---|---|
| организатор | The World's 50 Best Restaurants | **UIBC** — Международный союз пекарей и кондитеров |
| город | Валенсия | **Мюнхен**, отраслевая выставка |
| название титула | World's Best Pastry Chef | **World Pastry Chef 2023**; World's Best Pastry Chef — это награда 50 Best, полученая **в июне 2024 года в Лас-Вегасе** (спонсор номинации — Sosa) |

Плюс два неподтверждённых элемента удалены как недоказуемые: «в зале её встретили
аплодисментами стоя» (сценическая деталь без источника) и «первый раз, когда женщина
получила этот приз без привязки к конкретному ресторану» (подтверждено только то, что
она **первая женщина** — обладательница титула UIBC; часть про «без привязки к
ресторану» источниками не подтверждается).

Вероятная причина ошибки понятна и потому особенно опасна: церемония The World's
50 Best Restaurants 2023 года действительно проходила в Валенсии — но в июне, и
награду Метайе там не вручали. Совпадение года и города создало правдоподобную, но
ложную конструкцию.

**Что изменено:**
- `deepContents.ts` — абзац переписан по первоисточникам, оба титула разведены явно,
  с прямой оговоркой, что в прессе их регулярно смешивают и что здесь они разведены
  намеренно. Добавлен подтверждённый факт независимой работы: Délicatisserie она
  ведёт с 2019 года.
- `articles.ts` — заголовок `World's Best Pastry Chef 2023` → `World Pastry Chef 2023`
  (заголовок содержал ту же ошибку); excerpt «от Ниора до Валенсии» → «от Ниора до
  Мюнхена и Лас-Вегаса»; добавлен `updatedAt: '2026-09-16'`.
- `part6.ts` — в статью добавлены три проверенных документа: Euronews (27.10.2023,
  UIBC в Мюнхене, а также Ferrandi, переход к Пьежу в 2015-м, две звезды годом позже,
  Le Chef 2016 и Gault et Millau 2017), Sortiraparis (07.06.2024, фиксирует оба
  титула в одном месте и в правильном порядке) и список лауреатов the50.com
  (Préalpato 2019, Goldfarb 2021, Frédéric 2025 — контекст, показывающий, что
  номинация 2024 года принадлежит Метайе, а 2023-го нет).

**Соответствие политике исправлений.** `src/pages/corrections.astro` — страница
политики, а не журнал отдельных записей; её правило гласит: «Если исправление меняет
смысл, дату, авторство, технологический вывод или важную рекомендацию, дата изменения
материала обновляется». Правка меняет и дату, и атрибуцию, поэтому `updatedAt`
выставлен и через `resolveUpdatedAt` → JSON-LD `dateModified` → sitemap `lastmod`
уйдёт в публикацию. Отдельная запись в журнале не требуется — его нет.

**Побочное наблюдение о самом гейте.** После добавления трёх источников счётчик слабых
показал 6 при бюджете 5, но `audit_source_links.py` напечатал OK: офлайн-ветка
возвращает 0 **до** рэтчет-проверки, поэтому локально рэтчет не контролируется вовсе.
Превышение поймано независимым пересчётом, а не гейтом. Виновником была первая
версия третьей ссылки — `ninametayer.com/en/`, то есть голая главная; она заменена на
конкретный документ Sortiraparis. Это второй случай (после мёртвого URL в batch 7),
когда офлайн-режим гейта оказывается слепым; вопрос о том, чтобы считать рэтчет и
без сети, остаётся открытым и стоит отдельной задачи.

**Параллельно проверено и подтверждено (без правок):** титул Cédric Grolet —
World's Best Pastry Chef **2018** на церемонии The World's 50 Best Restaurants
19 июня 2018 года в Palacio Euskalduna в Бильбао, и Pâtissier de l'année по версии
Gault&Millau; в корпусе (`grolet-lemon-yuzu`) оба утверждения сформулированы верно.
Единственная тонкость: Gault&Millau датирует звание 2018 годом, а часть прессы
относит объявление к концу 2017-го — расхождение в датировке самого гида, а не наша
ошибка; формулировка «в том же 2018» опирается на профиль шефа на сайте Gault&Millau.

**Проверка:** все четыре Python-гейта зелёные; `audit_editorial_quality` — 155 статей,
505 ссылок расширения, минимум 2, среднее 3.26, замечаний 0; слабых цитат ровно 5 при
бюджете 5 (пересчитано независимо, а не по выводу гейта); ноль вставок `${}`; баланс
backtick сохранён. Содержательная правка датирована через `updatedAt`. Полный
`npm run validate` подтверждает CI.

### 7.14 Перепроверка собственной работы: починен баг гейта и найдена вторая фактическая ошибка

Отдельный проход, посвящённый не новому материалу, а аудиту уже сделанного.

#### 1. Починен баг, который я нашёл и записал, но не починил

В §7.13 зафиксировано: офлайн-ветка `audit_source_links.py` возвращает 0 **до**
рэтчет-проверки, поэтому `MAX_WEAK_CITATIONS` локально не контролируется вовсе.
Записать наблюдение и оставить баг — это половина работы.

Разбор показал, что это не ограничение, а именно ошибка: `probe()` выносит вердикт
`weak` исключительно из `generic_path(url)` — чистого строкового предиката, который
не обращается к ответу сервера. Значит множество слабых цитат полностью вычислимо
без сети, и бюджет обязан проверяться всегда. Проверка вынесена **до** сетевой
ветки; сетевая ветка по-прежнему пересчитывает то же множество из результатов
зондирования для отчёта-артефакта, и оба значения совпадают по построению.

Негативный тест: при бюджете 4 гейт падает с `exit=1` и печатает полный список
статей-нарушителей; после возврата бюджета — `exit=0`. Текущее состояние:
**5 слабых из 571 цитаты при бюджете 5**, и теперь это видно в любом окружении.

#### 2. Тотальный аудит собственных правок

Проверены все строки, добавленные коммитами сессии (`aa82176..HEAD`, только
`src/data`): **221 строка, 141 markdown-ссылка**. Контролировались: невидимые
символы (мягкий перенос, ZWSP, BOM, неразрывное тире), интерполяции `${}`, схема
URL, наличие домена, пробелы внутри URL, пунктуация в конце URL, пустые и
подозрительно короткие подписи, незакрытые ссылки, оборванные строки источников,
продублированные строки источников, русские опечатки.

**Результат: 0 проблем.**

Отдельный прогон по всем 21 файлу контента дал 13 срабатываний, и все тринадцать
оказались ложными: 11 — последовательность `.  ![` (точка, два пробела, картинка) в
`deepContents.ts`, существующая разметка, а не дефект; 2 — `C.A.P pâtissier`, где
точки принадлежат французской аббревиатуре. Ни одного срабатывания в `part*.ts`,
то есть в файлах, которые правились тринадцатью батчами.

#### 3. Проверка на тот класс ошибки, который уже один раз поймал меня

Ошибка с наградой Метайе возникла из-за рассогласования двух слоёв корпуса.
Поэтому написан детектор: по каждой статье собираются награды и годы рядом с ними
отдельно из базового и расширительного слоя, и флагуются случаи, где одна и та же
награда датирована в слоях по-разному без пересечения.

**Результат: явных расхождений — 0.** Единственной статьёй, где одна и та же награда
упомянута в обоих слоях, оказалась `metayer-biography` — то есть та самая, что уже
исправлена. Класс закрыт.

#### 4. Вторая найденная фактическая ошибка: хронология наград Пьера Эрме

Детектор вывел `herme-biography` как статью с несколькими годами у одной награды.
Проверка по первоисточникам показала, что **все три датированных утверждения неверны**
— годы в блоке перепутаны местами:

| в корпусе было | фактически (подтверждено) |
|---|---|
| 2001: лучший кондитер мира по версии Relais Desserts | **1997**: Pastry Chef of the Year по версии Relais Desserts International, в 35 лет — самый молодой лауреат за историю звания |
| 2011: World's 50 Best Restaurants включил его в список «Best Pastry Chef» | **июнь 2016**: World's Best Pastry Chef, церемония The World's 50 Best Restaurants в Нью-Йорке. В 2011 году такой номинации не существовало: первая редакция — 2014 (Жорди Рока), затем Альбер Адриа 2015 |
| 2016: Chevalier de la Légion d'Honneur | **май 2007**: награждён Жаком Шираком. Часть источников датирует 2006 годом |
| «ежегодно с 2000-х в списках лучших» | утверждение непроверяемо и удалено; вместо него — конкретное: Vanity Fair, 4-е место в списке 50 самых влиятельных французов мира, 2016 |

Источники расходятся в годе Почётного легиона (2006 против 2007), и расхождение
**сохранено в тексте явно**, а не сглажено до одной удобной даты: это ровно то, что
требует правило fail-closed. Добавлены и сверенные факты, которых в блоке не было:
основание Maison Pierre Hermé Paris в 1998 году с Шарлем Знати, первый бутик в Токио
и парижский на rue Bonaparte, 72 в 2001-м, Chevalier des Arts et des Lettres 1997
года с повышением до Commandeur в 2019-м.

В статью добавлены три проверенных документа: сообщение о церемонии 16 июня 2016
года с составом академии (972 эксперта с пяти континентов, тайное голосование по
7 ресторанам из 27 регионов) и списком предыдущих лауреатов; биографическая канва
Wikipedia, по которой сверялись годы; и список лауреатов the50.com (Эрме 2016,
Ансель 2017, Гроле 2018, Пральпато 2019, Голдфарб 2021, Фредерик 2025) — документ,
который и доказывает, что в 2011 году номинации не существовало.

Поскольку правка меняет даты и смысл, `herme-biography` выставлен
`updatedAt: '2026-09-16'` — по тому же правилу политики исправлений, что и для
Метайе. Всего `updatedAt` на эту дату теперь у 9 статей.

#### 5. Уточнение, снявшее двусмысленность заголовка

Заголовок `metayer-world-best-2023` звучал как «лучший шеф-кондитер мира 2023» —
русская формулировка, которую можно прочитать как любую из двух наград. Заменён на
«Нина Метайе — World Pastry Chef 2023 (UIBC): история и работы»: название
организатора делает смешивание невозможным. Slug не тронут — он и так корректен,
поскольку титул UIBC действительно относится к 2023 году, а замена slug означала бы
смену URL при закрытом Canon-scope.

#### 6. Баги в собственных проверочных инструментах

Аудит выявил два дефекта не в корпусе, а в моих проверках, и оба стоит назвать:

- **Счётчик записей был написан слишком строго.** Паттерн `{ id: '` без допуска
  пробела между скобкой и ключом насчитал в `articles.ts` **101** статью вместо
  **155** и выглядел как пропавшие данные. Корректный паттерн `\{\s*id:\s*'` даёт
  155 — столько же, сколько в `deepContents.ts`. Расхождение было в инструменте,
  а не в корпусе; без перепроверки вторым способом это ушло бы в отчёт как потеря
  54 статей.
- **Дисбаланс круглых скобок — ложная тревога.** `articles.ts` (+4), `part13.ts`
  и `part14.ts` (−3) дают ненулевую разницу `(`/`)`. Сверка с HEAD показала
  **дельту +0** по всем трём: дисбаланс был там всегда и происходит от скобок в
  русском тексте, которые внутри прозы не обязаны париться. Вывод: такой тест
  пригоден только как сравнение с базой, а не как абсолютная проверка.

#### Проверка прохода

Все четыре Python-гейта зелёные, причём `audit_source_links` теперь выполняет
рэтчет-проверку и без сети; `audit_editorial_quality` — 155 статей, 508 ссылок
расширения, минимум 2, среднее 3.28, замечаний 0; слабых цитат ровно 5 при бюджете 5;
число статей в `articles.ts` и `deepContents.ts` совпадает (155 и 155); баланс
фигурных скобок нулевой во всех изменённых файлах, баланс круглых — без дельты
относительно HEAD; ноль вставок `${}`; backtick сбалансирован. Полный
`npm run validate` по-прежнему подтверждает CI: `node` в песочнице есть, но
`node_modules` нет, а реестр npm недоступен, поэтому `tsc` невыполним.

### 7.15 Волна верификации утверждений «первый/изобретатель»: неподтверждённая цитата и одно подтверждение

Продолжение аудита (§7.14) на классе «первый/изобретатель» — 14 утверждений. Метод тот
же: сначала отделить уже захежированные формулировки (их большинство — «по легенде»,
«неизвестно», «по данным …»), затем проверить оставшиеся по первоисточникам.

#### Подтверждено и оставлено без правок

- **`recipe-tarte-bourdaloue`** — атрибуция оказалась **точной и даже более аккуратной,
  чем в большинстве источников**. Корпус пишет: «По данным кондитера и историка кулинарии
  Пьера Лакама, изобретение пирожного под названием le Bourdaloue приписывают кондитеру по
  имени Никола Бургуэн из дома Lesserteur, обосновавшегося в начале 1850-х годов по адресу
  улица Бурдалу, 7». Ровно так же формулируют Wikipedia/Wikimonde: «Le pâtissier et
  historien de l'art culinaire Pierre Lacam attribue ainsi l'invention d'un gâteau appelé
  le Bourdaloue au pâtissier Nicolas Bourgoin de la maison Lesserteur, installée au début
  des années 1850 au 7 de la rue Bourdaloue, dans le 9e arrondissement de Paris». Важно,
  что корпус не утверждает это от себя, а **ссылается на Лакама**: в инфобоксах тех же
  статей создателем значится Fasquelle, который занял тот же адрес десятью годами позже,
  унаследовав дело Lesserteur, и именно ему «часть источников» приписывает entremets
  Bourdaloue. Наш текст это различение сохраняет.
- **`opera-gateau-histoire`** — «он первым объединил кофе и шоколад в одном изделии **как
  равноценные компоненты**» с прямой французской цитатой и указанием источника
  (`legoutdabord.ch`). Утверждение ограничено по смыслу и атрибутировано — правило
  fail-closed соблюдено.
- **`stohrer-1730`** — «Официальный сайт Stohrer подчёркивает: он «изобрёл современную
  форму кондитерской торговли»». Это пересказ чужой формулировки с явной атрибуцией, а не
  утверждение проекта.

#### Найденный дефект: прямая цитата, которой не существует

`recipe-eclairs-adam` **начиналась** с текста в кавычках-ёлочках:

> «Эклер — это чистый холст. Но если холст кривой, порванный или сырой, никакие краски его
> не спасут. Заварное тесто не прощает небрежности, оно требует абсолютного контроля над
> влажностью.» — Кристоф Адам, создатель L'Éclair de Génie (Париж)

Поиск по первоисточникам такой формулировки **не дал**. Это самый опасный класс дефекта в
корпусе: прямая речь в кавычках, приписанная реальному живому человеку, без источника. Она
выглядит как факт, читается как факт и не проверяется гейтом живости, потому что URL при
ней нет. Дополнительно разметка была сломана: маркер цитирования `>` стоял только на строке
атрибуции, а не на самой цитате.

Исправлено по правилу fail-closed, в три шага:
1. Формулировка **сохранена как мысль статьи**, но переведена в редакторский голос — без
   кавычек и без приписывания Адаму.
2. В текст **явно вписано**, что это редакторская формулировка, а не цитата, и что
   высказывания Адама в такой редакции в открытых источниках нет. Скрывать замену молча
   означало бы оставить читателя с неверным представлением о provenance.
3. Рядом поставлена **настоящая, проверенная** его фраза из Vanity Fair France
   (1 мая 2014): «En pleine guerre des macarons pastels, j'imposais ma patte funky et
   colorée», с тем же источником для подтверждённых фактов — более ста рецептов на одну
   тему к дате публикации и превращение «pain de la duchesse» в ультрамодерную gourmandise.

Тот же Vanity Fair France добавлен как источник в обе статьи об Адаме
(`recipe-eclairs-adam` и `adam-eclair`) — это единственный найденный первоисточник с его
прямой речью об эклере. Поскольку правка меняет смысл текста, `recipe-eclairs-adam`
выставлен `updatedAt: '2026-09-16'`.

#### Что осталось непроверенным в этом классе

- Заголовок `adam-eclair` говорит о «200 вариациях», а тело статьи относит это число к
  книге «Éclairs» (2020): «200 рецептов и свидетельства 15 мастеров». Vanity Fair от 2014
  года даёт «более ста рецептов» — но это другая дата и другой объект (состояние на 2014
  год против книги 2020 года), поэтому противоречия нет. Подтвердить число рецептов именно
  в книге 2020 года в этом проходе не удалось; утверждение оставлено как есть, а не
  ослаблено молча — оно требует отдельной проверки по изданию.
- `careme-first-celebrity-chef` («начинал Карем как tourrier») и `recipe-mont-blanc`
  (crème de marrons, 1885, Клеман Фожье) в этом проходе не перепроверялись. Для второго
  дата и авторство уже подтверждены в batch 12 декларацией самого дома Clément Faugier
  («recette originale créée par Monsieur Clément Faugier en 1885 à Privas»); мотивация
  про «крошку от marrons glacés» остаётся непроверенной деталью.

#### Техническая заметка о собственном скрипте

Вставка `updatedAt` в `articles.ts` сначала упала: запись `recipe-eclairs-adam`
оформлена многострочно, и граница записи искалась по паттерну `\n  { id:`, которого там
нет. Ошибка была в скрипте, а не в данных; граница записи определена через первое поле
`date:` внутри окна с проверкой, что оно не выходит за `},`. Это второй за две волны
случай, когда проверочный инструмент оказывался строже данных (первый — счётчик статей,
давший 101 вместо 155 в §7.14); вывод тот же: любой одноразовый скрипт правки нужно
сверять вторым способом, прежде чем верить его отказу.

#### Проверка прохода

Все четыре Python-гейта зелёные; `audit_source_links` — 573 цитаты, слабых ровно 5 при
бюджете 5 (рэтчет теперь контролируется и офлайн, после починки в §7.14);
`audit_editorial_quality` — 155 статей, 510 ссылок расширения, минимум 2, среднее 3.29,
замечаний 0; ноль вставок `${}`; backtick сбалансирован во всех изменённых файлах. Полный
`npm run validate` подтверждает CI.

### 7.16 Новый гейт `audit_attributed_quotes.py` и системный дефект приписанных цитат

#### Почему появился гейт

В §7.15 был найден дефект, который **не мог поймать ни один существующий гейт**:
текст в кавычках-ёлочках, подписанный реальным живым человеком, которого в открытых
источниках нет. Гейт живости проверяет URL — а у цитаты URL нет. Гейт статусных
утверждений ищет маркеры титулов и рекордов — а не прямую речь. Гейт глубины считает
объём и источники расширения. Получалось, что единственный класс фактологических
утверждений в корпусе не контролировался ничем.

Добавлен `scripts/audit_attributed_quotes.py`. Он находит фрагменты в «ёлочках»
не короче 45 знаков, за которыми в окне 160 знаков идёт атрибуция, и для каждой пары
проверяет наличие источника (URL в окне 700 знаков) либо явный хедж («по данным…»,
«в интервью…», «selon…»). Классификация:

- `speech` — прямая речь от первого лица, приписанная человеку, без источника и без
  хеджа. Наивысший риск: слова буквально вложены в уста человека;
- `claim` — атрибуция учреждению или дому либо не от первого лица;
- `ok` — источник рядом или утверждение захежировано.

Режим `--strict` даёт ненулевой код возврата при наличии цитат класса `speech`.

#### Отладка сканера: две итерации ложных срабатываний

Первый прогон дал 42 «приписанные цитаты» и немедленно оказался недоверенным — по
правилу, выведенному в §7.14–7.15 (инструмент проверяется вторым способом, прежде чем
ему верят). Независимый подсчёт сошёлся по общему числу (276 длинных цитат в корпусе,
42 с конструкцией атрибуции — обе цифры совпали), но **извлечение имени** было сломано:
подписями считались заголовки разделов, попавшие в окно атрибуции, — «ЛИЧИ», «БРЮЛЕ»,
«Пюре», «Détrempe», «Брест», «СОЛЬ КАК ТЕРРУАР», «Making».

Первая правка — фильтр капслока (доля заглавных букв > 0.8) — сняла 10 срабатываний
(42 → 32), но одиночные слова в обычном регистре («Минимально», «Пюре») прошли.

Вторая правка — принцип, а не список исключений: **одиночное слово считается фамилией
только если оно известно корпусу**. Словарь персоналий собирается из самого проекта,
поэтому не устаревает: поля `author:` (латинские написания — Christophe Adam, Pierre
Hermé), заголовки статей (русские написания тех же людей — Кристоф Адам, Пьер Эрме) и
id статей (`herme-`, `conticini-`, `couvreur-`). Многословные подписи пропускаются по
структуре. Результат: 42 → 17 настоящих атрибуций, все осмысленные. Список исключений
был бы костылём и устарел бы при первой новой статье; словарь из корпуса — нет.

#### Найдено: 11 цитат, приписанных людям, без источника

Из 17 атрибутированных цитат 11 не имели ни источника, ни хеджа, и 4 из них были
прямой речью от первого лица. Проверка двух самых громких показала, что проблема
серьёзнее, чем в §7.15:

- **`conticini-paris-brest`** — «Чтобы тебя запомнили — нужно напомнить что-то, что уже
  знакомо…» с подписью **«Филипп Контисини, лекция в FERRANDI Paris, 2011»**. Поиск по
  первоисточникам такой цитаты не дал.
- **`michalak-biography`** — «Я не делаю высокую кулинарию. Я делаю высокое
  удовольствие» с подписью **«Кристоф Мишалак, интервью Le Figaro, 2018»**. Реальные
  интервью Мишалака нашлись (France Inter, март 2025; Le Parisien, февраль 2025), но
  этой фразы там нет.

Обе подписи указывают **конкретное место и год**. Это хуже цитаты без атрибуции: такая
ссылка выглядит проверяемой, читатель или редактор потратит время на поиск
несуществующей лекции и несуществующего интервью. Выдуманная атрибуция источника —
отдельный подкласс дефекта, и гейт теперь ловит его как `speech`.

- **`couvreur-millefeuille`** и **`couvreur-biography`** — прямая речь от первого лица
  без подписи вовсе, но в контексте статьи читающаяся как слова Куврера.

#### Как исправлено

Все четыре цитаты переведены в редакторский голос, с **явным** указанием, что это
формулировка статьи, а не дословная цитата, и что прежняя атрибуция не подтверждается.
Молча убрать кавычки было бы недостаточно: читатель вправе знать, что provenance
изменился.

Отдельно для Контисини поиск дал содержательную замену вместо пустоты: сам **мотив
детства** у него документирован — книга «La Pâtisserie des Rêves» построена на
переосмыслении детских лакомств (madeleine de rêve, flan pâtissier, gaufre au sucre
roux), рядом с классикой Paris-Brest, baba au rhum doux и religieuse. То есть мысль в
статье была настоящая, подложной была только её атрибуция. Текст теперь опирается на
подтверждённый факт.

Все четыре статьи получили `updatedAt: '2026-09-16'` — правка меняет смысл и
авторство утверждения, а это по политике исправлений (`src/pages/corrections.astro`)
требует сдвига `lastmod`. Всего `updatedAt: '2026-09-16'` теперь у **14** статей.

#### Результат и что осталось

После правки сканер даёт: 13 атрибутированных цитат, 3 с источником рядом,
3 захежированных, 7 без источника и без хеджа, **и 0 класса `speech`** — худший класс
устранён полностью. Оставшиеся 7 — атрибуции учреждениям («Дом Dalloyau») и цитаты не
от первого лица; они требуют проверки по существу, но не вкладывают слова в уста
конкретного человека. Отдельно стоит `recipe-blanc-manger`, где атрибуция «Julie
Andrieu» — это библиографическая ссылка на её материал без URL: там нужна ссылка, а не
снятие атрибуции.

Гейт пока наблюдательный, а не блокирующий: чтобы включить `--strict` в CI, нужно
довести число цитат класса `speech` до нуля и держать его там. Сейчас это условие
выполнено, поэтому перевод в блокирующий режим — вопрос следующего прохода, а не
технического долга.

#### Проверка прохода

Все пять Python-гейтов зелёные; `audit_source_links` — 573 цитаты, слабых ровно 5 при
бюджете 5; `audit_editorial_quality` — 155 статей, 510 ссылок расширения, замечаний 0;
записей в `articles.ts` — 155 (пересчитано независимым способом); ноль вставок `${}`;
backtick сбалансирован во всех изменённых файлах. Полный `npm run validate` подтверждает
CI: локально он невыполним из-за недоступного реестра npm и отсутствия `node_modules`.

### 7.17 Опровержение собственного вывода, регрессионный самопроверочный тест и противоречие между статьями

#### Предыдущий вывод был неверен, и это надо зафиксировать явно

В §7.16 сообщалось, что после правок класс `speech` (прямая речь от первого лица,
приписанная человеку, без источника) сведён к нулю. **Это утверждение было ложным.**
Ноль был артефактом бага в самом сканере: `FIRST_PERSON_RE` перечислял словоформы
(`мой|моя|моё|мое`) и потому не находил склонённые формы. Цитата «Ревень — вкус **моего**
детства», приписанная Клэр Эйцлер, классифицировалась как `claim`, хотя это прямая речь.

Первая правка регулярки бага не сняла: класс `мо[йяёе][ехмю]?` не содержит «г», а `\b` не
срабатывал на «моего». То есть инструмент занижал реальное число дважды подряд, и оба раза
это обнаружилось только ручным чтением вывода.

Поэтому вместо третьей ручной правки в сканер добавлен **регрессионный самопроверочный
тест** (`--selftest`): 12 строк, которые ОБЯЗАНЫ распознаваться как первое лицо
(«вкус моего детства», «Я не делаю», «Попробуйте», «Je ne cherche pas», «Mon goût
d'enfance», «своим жиром»), и 6 строк, которые распознаваться НЕ должны («Молоко доводят
до 80 градусов», «Момент охлаждения критичен», «Можно использовать любой пралине»). Тест
проходит 12/12 и 6/6. Без отрицательных примеров регулярку легко «починить» до состояния,
где она матчит всё подряд и шумит.

Вывод, который стоит обобщить: **отрицательный результат проверяющего инструмента нельзя
принимать на веру так же, как и положительный.** Все предыдущие уроки (§7.14, §7.15) были
про ложные срабатывания — инструмент видел проблему там, где её нет. Здесь случай хуже:
инструмент НЕ видел проблему, и это выглядело как успех. Тишина гейта — тоже утверждение,
и его надо проверять.

После починки истинное число цитат класса `speech` оказалось **2**, а не 0:
`heitzler-less-sugar` (Эйцлер) и `herme-architecture-taste` (Эрме).

#### Дыра в сканере: атрибуция ПЕРЕД цитатой

При чтении статьи Эрме вручную нашлась ещё одна неподтверждённая цитата, которую сканер
не видел вовсе: «При этом сам Эрме называет свой главный принцип просто: «Работай так,
как будто тебя никто не смотрит…»». Атрибуция здесь стоит **до** открывающей кавычки, а
сканер искал только в окне после закрывающей. Это не редкость, а обычная русская
конструкция («Эрме говорит: «…»»), то есть целый класс пропусков. Добавлен
`PRE_ATTR_RE`, ищущий атрибуцию в окне перед цитатой.

#### Найденная настоящая цитата Эрме и новый факт

Проверка дала не только снятие ложного, но и подтверждённую замену. Интервью Notre Temps
(11 декабря 2022), данное по случаю выхода автобиографии Эрме **«Toutes les saveurs de la
vie, l'odyssée d'un pâtissier de génie»** (издательство Buchet-Chastel), содержит его
прямую речь: «Je ne fais aucune concession au plaisir», а также «la pâtisserie évolue en
même temps que la société» и «C'est bien de faire des choses pour rien, de là naissent des
créations inattendues».

Отсюда два содержательных пополнения:
- сама автобиография добавлена в раздел «Книги и передача знаний» статьи
  `herme-biography` — ранее в перечне публикаций её не было вовсе;
- неподтверждённая «главная принципия» Эрме заменена на его настоящую формулировку с
  указанием источника, а в `herme-architecture-taste` непроверяемая цитата про клубнику в
  январе переведена в редакторский голос с явной оговоркой.

При этом список книг оказался **хронологически сломан** моей же вставкой: автобиография
2022 года легла между «Larousse du Chocolat» (2002) и «PH10» (2005). Перенесена в конец
перечня с указанием года.

#### Противоречие между двумя статьями об авторстве торта Опера

`recipe-opera-dalloyau` утверждала: «Торт Опера был создан Гастоном Ленотром и Сириаком
Гавийоном». Статья `opera-gateau-histoire`, проверенная ранее по первоисточникам,
утверждает обратное: создал Гавийон в Dalloyau в 1955 году, Ленотр предъявлял права,
тяжбы шли годами, и признанное сообществом решение — Ленотр талантливый интерпретатор,
но не создатель.

Обе статьи были в корпусе одновременно. Это тот же класс дефекта, что и рассогласование
дат наград между базовым и расширительным слоем (§7.14), но здесь рассогласование между
двумя статьями базового слоя, и детектор наград его не покрывал, потому что речь не о
награде, а об авторстве. Приведено к проверенной версии с явным указанием на спор.

#### Остальные непроверенные цитаты

Сняты или переведены в редакторский голос с оговоркой: «Идеальная Опера в разрезе имеет
высоту ровно 3 сантиметра» (приписывалась дому Dalloyau; там же была сломана разметка —
маркер `>` стоял только на подписи, из-за чего непроверенная фраза выглядела
документированной речью учреждения), две цитаты Эрме о созревании макарона и цитата
Доминика Анселя про DKA. Во всех четырёх случаях само техническое утверждение остаётся в
тексте — оно объяснено выше по физике процесса, — снята только ложная атрибуция.

`notretemps.com` добавлен в `TRUSTED_DOMAINS`. Список уже содержит прессу (`bbc.com`,
`cuisineactuelle.fr`), так что это продолжение принятого критерия, а не его размывание:
интервью в крупном издании — документированная прямая речь человека, то есть именно то,
чем заменяются непроверяемые цитаты. Домен снабжён комментарием с обоснованием.

#### Побочный эффект, найденный гейтом

Правка провалила `audit_editorial_quality` с кодом `article_reference`: гейт запрещает
мета-ссылки вида «в статье», а в новом тексте было «разобран **в статье** об истории
торта Опера». Переформулировано. Полезно, что гейт поймал это сразу: проверка всех
добавленных строк против `META_PATTERNS` отдельным прогоном дала ровно одно совпадение —
то же самое, значит других таких нет.

#### Итог прохода

Приписанных цитат: 17 → **7**; без источника и без хеджа: 11 → **1**; класс `speech` —
**0** (теперь измеренный рабочим детектором и подтверждённый самопроверочным тестом).
Оставшаяся единственная — `recipe-blanc-manger`, где «Julie Andrieu» является
библиографической ссылкой на её материал без URL: там нужна ссылка, а не снятие
атрибуции, потому что это не слова, вложенные в уста человека.

Все шесть исполняемых Python-гейтов зелёные. `audit_seo` и `audit_site` локально
незапускаемы из-за отсутствия `bs4` и `PIL` — прежнее ограничение среды, в CI
зависимости есть. `audit_source_links` — 573 цитаты, слабых 5 при бюджете 5;
`audit_editorial_quality` — 155 статей, 512 ссылок расширения, минимум 2, среднее 3.3,
доверенных доменов 59, замечаний 0; записей в `articles.ts` — 155 и в `deepContents.ts`
— 155 (пересчитано независимым способом); ноль вставок `${}`; backtick сбалансирован.
`updatedAt: '2026-09-16'` теперь у **20** статей.

### 7.18 Приписанные цитаты доведены до нуля, гейт переведён в блокирующий режим

#### Третье занижение подряд — и почему это важнее самих правок

После §7.17 сообщалось: «без источника и без хеджа — 1, класс `speech` — 0». **Оба числа
были неверными.** Истинные значения: 12 цитат без источника, из них 5 — прямая речь от
первого лица. Ноль снова был артефактом неисправного детектора, причём по трём
независимым причинам сразу:

1. **Атрибуция перед цитатой не находилась никогда.** Обе PRE-регулярки требовали
   завершающей `«`, но окно `before` по построению обрезается ровно перед кавычкой —
   требование было невыполнимо. То есть ветка, добавленная в §7.17 как исправление,
   фактически не работала ни разу.
2. **Порядок «имя + глагол» не поддерживался.** «сам Пьер Эрме называет свой принцип
   просто: «…»» — обычная русская конструкция, а регулярка ждала «называет Эрме».
   Дополнительно частица «сам» стоит ПЕРЕД именем, а не после.
3. **`looks_like_heading` браковала любые имена из двух слов.** Функция содержала две
   «на всякий случай» ветки сверх содержательной проверки доли заглавных букв; одна из них
   срабатывала на «ПьерЭрме» (пробелы к тому моменту уже были удалены из строки) и
   отбрасывала корректную атрибуцию.

Каждый из трёх багов по отдельности занижал отчёт, вместе они создавали картину полного
благополучия. Обнаружились они только потому, что был добавлен самопроверочный тест:
фикстура на порядок «имя + глагол» упала и не давала себя игнорировать. Это прямое
подтверждение решения из §7.17 — **без самопроверочного теста третий баг тоже остался бы
невидимым.**

Вывод, который стоит закрепить как правило проекта: у каждого детектора обязаны быть
эталонные строки И на срабатывание, И на несрабатывание, и тест должен запускаться до
самого детектора. В `package.json` это сделано буквально:
`audit:attributed-quotes` = `selftest && --strict`. Если регулярки сломаны, блокирующий
гейт на их основе опаснее отсутствия гейта — он молча пропускает всё.

#### Отладка самопроверочного теста

Тест тоже оказался написан неверно и это проявилось сразу: фикстуры на паринг атрибуции
были короче `MIN_QUOTE = 45` знаков, поэтому проверялся порог длины, а не паринг, и тест
падал 0/3 по причине, не имеющей отношения к проверяемому свойству. Фикстуры удлинены до
реалистичных, в них же добавлены отрицательные примеры на паринг.

Отдельно выяснилось, что **письменная ссылка на документ — не то же самое, что устная
речь.** «David Lebovitz пишет, что «разрыхлитель не должен быть даже в одной комнате с
мадленами»» и «Le Petit Journal пишет: это дало возможность «развить новый полюс вокруг
французского art de vivre»» указывают на проверяемый текст; «Эрме говорит: «…»» не
указывает ни на что. `HEDGE_RE` дополнен конструкциями письменной атрибуции (в том числе
с двоеточием — первый вариант паттерна его пропускал). Оба случая переквалифицированы
из дефекта в корректную атрибуцию без правки текста: менять там было нечего.

#### Десять настоящих дефектов и как они исправлены

Снята ложная атрибуция устной речи без источника в десяти местах — Эрме (три цитаты:
о времени на изобретение вкусов, об интуиции и системе, о контрастных парах), Перре
(о Ritz как государстве), Мишалак (о религиёз), Гроле (о технике, которая не должна
кричать), Меркотт (две: о crème anglaise и об инсерте), Метайе (о муссе), Жени
(о мильфее как рентгене кондитера).

Во всех случаях **содержание сохранено**: техническое или философское утверждение
остаётся в тексте, переведённое в безличный или третьеличный оборот, и рядом явно указано,
что это изложение мысли, а не дословная цитата, и что источника у неё нет. Для Меркотт
дополнительно отмечено, что физика процесса изложена выше и проверяема независимо от
атрибуции — то есть снятие цитаты не ослабило доказательность.

Отдельный случай — Гроле: там стояла ссылка «в одном из интервью», то есть **расплывчатый
источник, который нельзя проверить в принципе**. Он снят с явной формулировкой, что
указывать непроверяемый источник хуже, чем не указывать никакого: такая ссылка создаёт
впечатление документированности, не давая способа её проверить.

#### Ошибка в собственном рабочем процессе

Негатив-тест блокирующего режима был проведён неверно: чтобы убедиться, что гейт падает на
подложной цитате, я внедрил её, а затем восстановил файл командой
`git checkout -- src/data/deepContents.ts`. Команда откатывает файл к HEAD, и поскольку
все десять правок на тот момент не были закоммичены, **они были стёрты**. Потеря
обнаружилась немедленно — сканер снова показал 12 цитат без источника, — и правки
восстановлены повторным прогоном того же скрипта (10/10, якоря совпали).

Правило на будущее: негатив-тест на рабочем дереве делается через резервную копию файла, а
не через git. Повторный тест проведён правильно: `cp` в `/tmp`, внедрение, проверка
(`exit=1`), восстановление из копии, проверка (`exit=0`) и побайтовое сравнение — файлы
идентичны. Уцелевшие `package.json`, сканер и `articles.ts` не пострадали, потому что
откатывался один файл.

Показательно, что сломанная проверка собственного процесса проявилась через тот же
инструмент, который она должна была проверить: сканер вернул прежнее число. Это ещё один
довод в пользу того, что гейт должен быть в состоянии сообщить о регрессии контента, а не
только о его исходных дефектах.

#### Мелкая языковая оплошность

В одной из правок в русскую прозу попало английское слово («хотя collections строятся…»).
Исправлено; добавлена проверка на отсутствие этого слова в `deepContents.ts`.

#### Итог

| Показатель | §7.16 | §7.17 (заявлено) | §7.17 (истинно) | сейчас |
|---|---|---|---|---|
| Приписанных цитат найдено | 17 | 7 | 29 | 19 |
| С источником рядом | 3 | 3 | 3 | 3 |
| Захежированы | 3 | 3 | 14 | 16 |
| Без источника и без хеджа | 11 | 1 | 12 | **0** |
| из них прямая речь 1-го лица | 4 | 0 | 5 | **0** |

Рост числа «найдено» с 7 до 29 — не ухудшение контента, а починка детектора: он наконец
видит атрибуцию перед цитатой и порядок «имя + глагол». Падение «без источника» до нуля —
результат и правок контента, и корректной классификации письменных атрибуций.

Гейт переведён в блокирующий режим: `audit:attributed-quotes` (selftest, затем `--strict`)
добавлен в `audit:content`, который входит в `npm run validate` и вызывается в CI.
Негатив-тест подтверждает, что режим действительно блокирует: на внедрённой подложной
цитате `exit=1`, после восстановления — `exit=0`.

Все шесть исполняемых Python-гейтов зелёные; самопроверка 12/12, 6/6, 3/3, 1/1;
`audit_source_links` — 575 цитат, слабых 5 при бюджете 5; `audit_editorial_quality` —
155 статей, 512 ссылок расширения, минимум 2, среднее 3.3, доверенных доменов 59,
замечаний 0; записей 155 в `articles.ts` и 155 в `deepContents.ts`; `updatedAt:
'2026-09-16'` у 27 статей; ноль вставок `${}`; ноль мета-паттернов в добавленных строках;
backtick сбалансирован во всех изменённых TS-файлах (проверка неприменима к Python-скрипту,
где backtick законен внутри регулярных выражений, — это ложная тревога проверки,
применённой шире её области).

### 7.19 Закрыты MOF, титулы «лучший кондитер» и книга Адама; найден системный дефект смешения алфавитов

#### Класс MOF (18 кандидатов) — чист, фальсифицируемых утверждений почти нет

Разбор показал, что почти все 18 срабатываний — общие упоминания MOF как института, а не
претензии на титул. Корпус описывает его уже корректно и осторожно: «Titre «Un des
Meilleurs Ouvriers de France» нельзя описывать как обычный диплом после CAP», «MOF — не
следующая школьная ступень», «Путь CAP → опыт → специализация → MOF не является
автоматической лестницей. Многие сильные шефы не участвуют…». Персональных утверждений
нашлось ровно два, и оба подтвердились:

- **Thomas Marie — MOF boulangerie 2007.** Присвоен 14 ноября 2007 года в возрасте 26 лет
  с первой попытки (Académie du Goût, страница преподавательского состава EHL, Babelio,
  собственный сайт, Le Messager 2025). Важно, что титул по категории **буланжери**, а не
  pâtisserie — и в корпусе он использован именно в контексте круассана и ламинации, то
  есть уместно. Уточнено в тексте, добавлена категория и год.
- **Thierry Bamas — MOF pâtissier 2011.** Его собственный сайт, LinkedIn, Callebaut,
  vie-economique. Здесь источники расходятся: baskulture пишет «sacré meilleur ouvrier de
  France en 2021», но vie-economique разъясняет хронологию — отклонён в квалификации 2003
  года, провал в финале 2007 года, успех в 2011-м с сахарной фигурой в честь Антонена
  Карема. То есть 2011 подтверждён несколькими источниками, включая первоисточник, а 2021
  — одиночная ошибка. Корпус год и не утверждал, только сам факт титула, поэтому правки не
  потребовалось.

#### Класс «лучший кондитер» (13 кандидатов) — подтверждён по официальному первоисточнику

`grolet-lemon-yuzu` утверждал World's Best Pastry Chef 2018. Проверено по **официальной
странице награды** The World's 50 Best Restaurants: полная последовательность лауреатов —
Альбер Адриа 2015, Пьер Эрме 2016, Доминик Ансель 2017, **Седрик Гроле 2018**, Жессика
Преальпато 2019. Утверждение верно. Оно же независимо подтверждает исправление хронологии
Эрме из §7.14 (2016, а не 2011): Эрме стоит в официальном перечне на своём месте.

Текст усилен проверенной деталью (церемония 19 июня 2018 года в Бильбао) и полным
перечнем лауреатов, официальный источник добавлен в слой расширения.

Согласованность между статьями проверена отдельно: `metayer-biography` и
`metayer-world-best-2023` одинаково разводят два титула — World Pastry Chef of the Year
2023 (UIBC, объявлен 27 октября 2023) и World's Best Pastry Chef 2024 (The World's 50
Best, июнь 2024, Лас-Вегас). Расхождения нет. `mercotte-anglaise` (соведущая Le Meilleur
Pâtissier на M6 с 2012 года) соответствует фактам.

Отдельно: в выдаче попался агрегатор с сомнительными утверждениями (Michalak «MOF 2019»,
Hermé «MOF Honoris Causa 2016»). Он **не использован** — корпус таких претензий не делает,
и добавлять их из непроверенного источника было бы регрессом.

#### Последний заявленный непроверенный пункт закрыт подтверждением

В §7.15 число рецептов в книге Адама «Éclairs» (2020) было оставлено как написано, а не
ослаблено молча, и записано как требующее проверки. Проверено по издательским данным:
книга называется **«Éclairs : 20 ans de création»**, La Martinière, 12 ноября 2020, 512
страниц, EAN 9782732494197, соавтор Sarah Vasseghi, фотограф Laurent Fau, — и в ней
действительно **200 рецептов эклеров** плюс история пирожного и **свидетельства 15
личностей**, среди названных Gilles Marchal, Christophe Felder, Sébastien Gaudard, Benoît
Couvrand, Benoît Castel, Isabelle Capron. Все четыре имени, перечисленные в корпусе,
подтвердились.

Запись усилена полной библиографией (точное название, дата, объём, соавтор, фотограф) и
двумя дополнительными подтверждёнными именами; издательские данные добавлены как источник
в обе статьи об Адаме.

#### Системный дефект: смешение алфавитов внутри слова

Побочная проверка при другом проходе обнаружила слово «Прeальпато» с **латинской** «e»
внутри кириллического текста. Такие дефекты неразличимы глазу и не ловятся ничем
существующим: орфография не проверяется, ссылки целы, структура валидна.

Добавлен `scripts/audit_mixed_script.py` — постоянный гейт, проверяющий, что внутри одного
слова не соседствуют кириллица и латиница (дефис считается границей слова, поэтому
«CAP-пэтисье» смешением не является). Первый же прогон дал **46 находок** — против трёх,
которые видел грубый разовый регулярище. Это два системных типа:

- **латинская буква с диакритикой внутри кириллического слова**: `пâтиссери`, `пâтисье`,
  `мерингé`, `нáппаж`, `бабá`, `Деборá`, `пâтон`, `Macaronную` — 43 вхождения;
- **французский термин с кириллической первой буквой**: `пâte`, `Пâte`, `ПÂТЕ`,
  `пâтissière`.

Все исправлены: 43 замены в трёх файлах (`part5.ts` — 1, `articles.ts` — 9,
`deepContents.ts` — 33). После правки детектор даёт 0.

Два срабатывания оказались легитимными и вынесены в явные исключения с обоснованием, а не
проигнорированы: символьный класс регулярного выражения в `library.ts`
(`/[A-Za-zА-Яа-яЁёÀ-ÿ0-9]+/`) обязан содержать оба алфавита — это его назначение, и
`bestseller'ом` — заимствование с кириллическим окончанием, где апостроф является
границей. Исключение для `library.ts` сделано по имени файла, чтобы не глушить проверку
во всём слое данных.

Отдельно проверено, что правка не сломала вызовы `body()`: функция объявлена как
`body(_topic, _id)` и использует только второй аргумент, поэтому изменение поисковых строк
в `articles.ts` на разрешение контента не влияет.

Гейт подключён в `audit:content` (а значит в `npm run validate` и CI) в режиме `--strict`.

#### Итог прохода

Семь Python-гейтов зелёные. `audit_attributed_quotes` — 19 приписанных цитат, 0 без
источника и без хеджа, 0 класса `speech`; самопроверка 12/12, 6/6, 3/3, 1/1.
`audit_mixed_script` — 0. `audit_source_links` — 578 цитат, слабых 5 при бюджете 5.
`audit_editorial_quality` — 155 статей, 515 ссылок расширения, минимум 2, среднее 3.32,
доверенных доменов 59, замечаний 0. Записей 155 в `articles.ts` и 155 в
`deepContents.ts`; `updatedAt: '2026-09-16'` у 28 статей; ноль вставок `${}`; ноль
остатков диакритики в кириллице; backtick сбалансирован.

Открытых пунктов из журналов §7.14–§7.19 не осталось: рэтчет `MAX_ROOT_REDIRECTS` остаётся
наблюдением (`None`) по прежнему решению, а обобщение детектора противоречий между
статьями с наград на авторство выполнено фактически — случай с Оперой (§7.17) разобран и
приведён к проверенной версии, а регулярная сверка согласованности титулов проведена в
этом проходе вручную по обоим статьям о Метайе.


### 7.20 Хирургический pre-merge аудит: закрыт blind spot metadata sourceUrl, weak-ratchet = 0

Перед PR проведён отдельный аудит самих гейтов, а не только их зелёного результата.
Найден существенный blind spot: `SOURCE_URL_FIELD_RE` был привязан к началу строки
(`^\\s*sourceUrl`), поэтому не видел `sourceUrl` в компактных однострочных объектах
`articles.ts`. Иными словами, гейт заявлял проверку metadata source trail, но реально
проверял только часть метаданных.

Регулярка отвязана от начала строки и теперь собирает каждое свойство `sourceUrl`.
Расширенная проверка сразу проявила два ранее невидимых слабых metadata URL
(`christophe-felder.com/recettes/` и корень Dominique Ansel), а отдельный статический
проход обнаружил четыре malformed Wikipedia URL с незакрытой скобкой в path
(Charlotte, Saint-Honoré, Dacquoise, Merveilleux). Все шесть metadata-дефектов заменены
конкретными живыми документами.

Одновременно закрыты последние пять слабых цитат, которые прежний гейт уже видел:
две ссылки `jacquesgenin.fr/univers`, корень CinqSens, поисковая выдача Académie du
Goût по `caramel tendre` и корень Musée du Gâteau Basque. Где конкретный документ
сильнее — ссылка заменена им; где корневая ссылка ничего не доказывала и рядом уже было
два сильных источника — она удалена.

Итоговый инвариант перед exact-head CI: `MAX_WEAK_CITATIONS = 0`. Поднимать его нельзя.
Strict CI обязан проверить сетевую живость всего расширенного набора URL, включая все
metadata `sourceUrl`.


### 7.21 Strict network closeout: hard-dead отделён от blocked, подтверждённые 404 закрыты

Первый полный сетевой прогон после исправления metadata-парсера проверил **344 уникальных
URL / 677 цитирований**. Старый бинарный verdict показал 79 «dead», но разбор доказал,
что в эту цифру были смешаны принципиально разные состояния:

- **33 HTTP 404** — подтверждённо отсутствующие документы;
- **45 transport/WAF verdicts** — 13×403, 1×429, 23×timeout, 4×TLS,
  2×connection refused и 2×DNS;
- **1 ошибка клиента** — Unicode URL `Gougère` падал в `urllib` до HTTP-запроса.

Гейт исправлен по смыслу, а не ослаблен: `dead` теперь означает только 404/410 или
soft-404; `blocked` — отдельный диагностический класс для anti-bot/transport; `weak`
остаётся жёстким ratchet-классом для корней, поиска и index-only ссылок. Unicode path
перед запросом percent-encode'ится, не меняя опубликованную ссылку.

Все 33 подтверждённых 404 из первого прохода были заменены/удалены по смыслу и записаны
в `KNOWN_DEAD_URLS`, чтобы не вернуться при последующем copy/paste. Следующий exact-head
прогон нашёл ещё **3 HTTP 404** в самих заменах: старую Gallica selection по
`Le Ménagier de Paris`, устаревший PDF Dalloyau и сезонный product URL Pierre Hermé.
Они также заменены на актуальные документы и добавлены в permanent dead registry.

Source trail дополнительно выровнен семантически: metadata `sourceLabel` больше не
называет один источник при URL другого домена; для исчезнувшей Cuisine Actuelle по
far breton явно обозначено архивное зеркало, а для Lignac/Kouign-Amann используется
документ M6, где критерии шефа зафиксированы напрямую.

Текущие merge-инварианты:
`MAX_WEAK_CITATIONS = 0`, `MAX_ROOT_REDIRECTS = 0`;
hard-dead URL должны быть 0 на exact-head CI. `blocked` не подменяет факт смерти
документа и остаётся отдельным наблюдаемым списком для независимой проверки.

Чтобы разделение `dead` / `blocked` не создало новый false-green, strict-run обязан
получить содержательное сетевое свидетельство: доля blocked/inconclusive не может
превысить **35%** уникальных URL. Первый полный прогон был около 13% blocked, поэтому
порог оставляет большой запас для anti-bot сайтов, но глобальный outage/egress failure
больше не сможет дать зелёный результат с «0 dead».
