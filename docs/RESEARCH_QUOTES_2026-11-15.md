# Журнал верификации цитат «Мысль дня» — 2026-11-15

## Сфера

Блок QUOTES в `src/components/DashboardBento.tsx`: семь цитат, приписанных
реальным людям (Эрме, Контисини, Метайе, Гроле, Ру, Дюкасс, Ленотр), публиковались
без указания источников. Ни один гейт проекта их не контролировал: карточки живут
в React-компоненте, а не в слоях `src/data/`, которые читают
`audit_attributed_quotes.py` и `audit_source_links.py`.

## Методика

1. Дословный поиск исходной русской формулировки и её вероятных оригиналов
   (FR/EN) в открытых источниках.
2. Если прямое совпадение не найдено — поиск документированных реплик того же
   автора на ту же тему в интервью и на собственных страницах домов.
3. Каждая кандидатная замена верифицирована чтением живой страницы первоисточника
   (не сниппетом поиска): формулировка сверена дословно, дата публикации и автор
   зафиксированы.
4. Вторичные пересказы («по словам шефа…» в чужих статьях) источником не считаются.

Правило замены: персоналия сохраняется, слова заменяются на документированную
реплику; русская подача — перевод дословной формулировки. Исходные формулировки
не объявляются «выдуманными» (отсутствие следа в открытых источниках — не
доказательство), но публиковаться без источника не могут.

## Результат по каждой карточке

### 1. Пьер Эрме

- Было: «Вкус — это не просто сочетание ингредиентов. Это архитектура эмоций и
  точный расчёт.»
- Статус: точного оригинала нет; концепция «архитектура вкуса» документирована
  (Qatar Eating 2015; France Today 2017; Delano/Paperjam 2024; NYT 2017),
  но «точный расчёт» в документированных репликах отсутствует.
- Стало: «Для меня самое важное — архитектура вкуса и эмоции, которые несёт торт.»
- Оригинал: «For me, the most important thing is the architecture of the taste
  and the emotions that the cake brings.» — собственная страница дома,
  https://www.pierreherme.com/en/en/the-art-of-pastry (первое предложение цитаты;
  далее по тексту источника: «Then, I just try to highlight it, to make it
  desirable without artifice or decoration»).

### 2. Филипп Контисини

- Было: «Кондитерское искусство рождается на стыке абсолютной точности и
  искренней страсти.»
- Статус: оригинал не найден. Документированная позиция Контичини иная по смыслу:
  вкус как единственный ориентир (см. ниже); «вкус важен, ощущение ещё важнее»
  (epicuriendusud.com, 30.04.2015: «le mot goût est important mais le mot
  sensation l'est encore plus»).
- Стало: «В кухне, как и в кондитерском деле, единственный ориентир — вкус.»
- Оригинал: «en cuisine comme en pâtisserie, le seul point de repère, c'est le
  goût» — интервью Serge Bressan, Le Quotidien, 03.07.2022,
  https://lequotidien.lu/culture/la-star-de-la-patisserie-philippe-conticini-veut-entretenir-lemerveillement/953193
  (контекст: больница 2010 г., два месяца комы — «j'ai compris ce qui est une
  évidence»).

### 3. Нина Метайе

- Было: «Соль — лучший друг кондитера. Без соли сладость становится плоской и
  невыразительной.»
- Статус: близкий пересказ её документированной позиции о соли, но дословной
  реплики нет.
- Стало: «Мы все пробовали хлеб без соли — это невкусно. С пирожными то же самое!»
- Оригинал: «On a tous goûté un pain qui n'avait pas de sel, ce n'est pas bon.
  C'est la même chose pour les gâteaux !» — ответ в передаче «Les P'tits
  Bateaux» (вопрос Габриэль, 5 лет), France Inter, 28.03.2026,
  https://www.radiofrance.fr/franceinter/podcasts/les-p-tits-bateaux/les-p-tits-bateaux-du-samedi-28-mars-2026-9145100
  (там же о шоколаде: «Le sel va réveiller les bonnes saveurs d'un bon
  chocolat… ça va lui donner encore plus d'ampleur»).

### 4. Седрик Гроле

- Было: «Когда вы едите десерт, вы должны сначала удивиться глазами, а затем —
  текстурой.»
- Статус: прямого оригинала не найдено (включая поиск по интервью 2017–2023).
- Стало: «Красивое пирожное приводит, вкусное — возвращает.»
- Оригинал: «La pâtisserie physiquement belle fait venir, le bon fait revenir.»
  (далее по источнику: «Et aujourd'hui, on gagne sa vie quand les gens
  reviennent !») — интервью Fred Ricou, 7 à table!, 26.10.2017,
  https://www.7detable.com/article/dans-les-cuisines/cedric-grolet-un-michelin-special-patisserie-c-est-un-reve/1940
  (там же: «Je goûte plus la matière première que la matière finale» — «я
  дегустирую сырьё больше, чем готовый продукт»).

### 5. Мишель Ру

- Было: «Хороший рецепт — это начало. Повторяемый результат — это мастерство.»
- Статус: оригинал не найден. Документированная реплика о кондитерском деле —
  из интервью Мишеля Ру-мл. (подпись карточки уточнена: «Мишель Ру-мл.», поскольку
  источник — Michel Roux Jr., а не его дядя Michel Roux Sr.).
- Стало: «Кондитерское дело — более строгая дисциплина: оно прививает работе
  Vigor и точность. Всё взвешено и вымерено, почти химия.»
- Оригинал: «Pastry is more of a discipline, and it instills vigor and precision
  into your work. It's more weighed and measured, almost chemistry.» (ответ на
  вопрос о лучшем совете отца; контраст: «[Savory] cooking is more about flair
  and spontaneity») — Nation's Restaurant News, 24.09.2007,
  https://www.nrn.com/food-trends/under-the-toque-michel-roux-jr-keeps-tradition-alive-at-le-gavroche

### 6. Ален Дюкасс

- Было: «Глазурь скрывает ошибки. Текстура — обнажает всё.»
- Статус: оригинал не найден ни в FR, ни в EN выдаче.
- Стало: «Зачем прятать вкус свежесобранных овощей под густым соусом?»
- Оригинал: «Why hide the flavour of freshly picked vegetables with a rich
  sauce?» (рядом: «If my cuisine were to be defined by just one taste, it would
  be that of subtle, aromatic, extra-virgin olive oil») — The Independent,
  10.06.2006,
  https://www.the-independent.com/life-style/food-and-drink/features/alain-ducasse-the-greatest-chef-in-the-world-481722.html

### 7. Гастон Ленотр

- Было: «Крем должен быть гладким, как мысль, и стойким, как характер.»
- Статус: оригинал не найден; поэтическая формулировка без следов в источниках.
- Стало: «Пирожные создаются не для того, чтобы накормить людей, а чтобы
  подарить им нежность, которую можно разделить.»
- Оригинал: «La pâtisserie, vous savez, on ne la fait pas pour nourrir les gens
  mais pour leur offrir de la douceur à partager.» — Madame Figaro (Alexandra
  Michot), 29.12.2007,
  https://madame.lefigaro.fr/art-de-vivre/lenotre-traiteur-nomme-plaisir-291207-10398
  (там же его формула обучения: «Les poids, les mesures, la rigueur»).

## Контракт после правки

- Каждая карточка QUOTES несёт `sourceUrl` + `sourceLabel`; ссылка выводится в
  интерфейсе под автором.
- `audit_attributed_quotes.py` разбирает DashboardBento.tsx: карточка без
  `sourceUrl` проваливает `--strict`.
- `audit_source_links.py` собирает `sourceUrl` карточек как origin
  `dashboard-quotes`: мёртвая ссылка в «Мысли дня» теперь видна реестру.

## Что не найдено и не заменено

- Дословные оригиналы исходных формулировок №1 (полностью), №4, №5, №6, №7 —
  поиск по FR/EN/RU не дал совпадений; зафиксировано отсутствие следа, а не
  «факт выдумки».
- Для №2 документированная реплика Контичини про «ощущение важнее вкуса»
  (epicuriendusud 2015) сохранена в журнале как альтернатива; выбрана реплика
  2022 г. как более короткая и более близкая к теме кондитерского дела.
