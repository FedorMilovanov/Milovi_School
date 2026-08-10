# Le Canon Sucré — corrective visual/editorial wave

**Дата:** 2026-08-10  
**Причина открытия:** owner visual review after the previous production closeout.

## Почему закрытый релиз пришлось открыть снова

После production closeout владелец проекта показал реальные desktop screenshots и обнаружил дефекты, которые формальные green gates не должны были пропустить как визуально завершённый продукт:

- dedicated Canon masters имеют размер `1280×800` (16:10), но большинство exhibition cards выводились через `aspect-ratio: 4 / 5` + `object-fit: cover`;
- на mobile тот же destructive portrait crop включался повторно;
- Opéra, 2000 Feuilles и другие горизонтальные формы теряли значимую часть предмета; Éclair, Tarte au Citron и Galette des Rois получали несогласованный subject scale;
- homepage gateway собирался из пяти отдельных узких фотопанелей, хотя gateway должен восприниматься как единая editorial composition;
- `/canon/` показывал почти только curator line + technique labels и плохо передавал реальную глубину связанных library dossiers;
- прежний visual gate проверял decode, overflow, overlap, navigation и responsive mechanics, но не защищал художественную геометрию master image и не заменял ручную art-direction проверку screenshots.

Это означает, что формулировка прежнего closeout «нет незакрытого Product-долга» была слишком сильной. Green technical QA не является доказательством принятого визуального качества без review самих screenshot artifacts.

## Root cause

### 1. Media contract и presentation contract противоречили друг другу

Media authority фиксировала единый master format 1280×800. Presentation layer затем помещал этот master в 4:5 frame и масштабировал его. Для 16:10 master это неизбежно уничтожало значительную часть горизонтальной композиции.

### 2. Проверялось наличие изображения, но не сохранность композиции

Browser QA доказывал, что файл загрузился и не создал технического overflow. Он не доказывал, что pastry form показана целиком, что subject scale согласован между соседями и что кадр выглядит редакционно правильно.

### 3. Screenshot evidence существовал, но прежняя сдача слишком сильно полагалась на PASS-статусы

Screenshot artifacts должны рассматриваться как review material, а не как побочный продукт CI. Для flagship editorial pages требуется ручной просмотр exact-SHA screenshots до merge/release.

## Что исправлено в corrective wave

### Media geometry

- все 15 exhibition masters сохраняют 16:10 frame на desktop/tablet/mobile;
- old blanket 4:5 crop больше не является visual authority;
- базовый дополнительный zoom снят;
- исключительные subject-scale corrections находятся в `canon-media.ts`, то есть в media art-direction data, а не разбросаны CSS hacks по id;
- Tarte au Citron, Éclair и Galette des Rois получили bounded scale correction без возврата destructive portrait crop.

### Homepage gateway

- удалён five-panel thumbnail stack;
- gateway использует одну непрерывную editorial image plane;
- typography, visual, CTA и frame читаются как один banner;
- permanent audit запрещает возврат `.canon-gateway-media-item` / `GATEWAY_SELECTION`.

### Canon hero

- пустая правая половина первого экрана получила мягкий Canon visual focal point;
- изображение интегрировано как background editorial plane, а не новая карточка/коллаж;
- mobile остаётся cleaner and text-first.

### Editorial density

- все 15 Canon cards теперь показывают реальный linked-dossier excerpt и reading context `DOSSIER · N MIN`;
- введён отдельный Canon dossier-depth gate;
- все 15 связанных routes должны иметь не менее 1000 слов и не менее пяти substantive sections;
- thin routes получили curated technical appendices: texture/process control/failure diagnostics/service logic вместо SEO filler;
- historical attribution boundaries остаются в researched source layer; appendices не выдумывают новые origin claims.

## Новая обязательная visual acceptance procedure

Для любой следующей production сдачи Canon недостаточно, что тесты зелёные. До merge должны быть просмотрены exact-head screenshots как минимум:

1. homepage Canon gateway;
2. `/canon/` hero;
3. Acte I / La Forme;
4. Acte II / La Signature;
5. Acte III / Le Territoire;
6. mobile work stream;
7. wide-desktop contextual rail;
8. Technique Index;
9. Research entry / Tatin evidence windows.

Review должен явно отвечать на вопросы:

- предмет не уничтожен crop'ом;
- смысловая форма десерта читается целиком;
- subject scale не выглядит случайным относительно соседей;
- negative space выглядит намеренным, а не забытым;
- текст не конфликтует с фото;
- desktop/mobile не используют разные разрушительные art-direction правила;
- controls не перекрывают research/editorial copy;
- screenshot выглядит как готовый product, а не только как технически валидный DOM.

## Permanent regression contracts

Corrective wave добавляет/усиливает gates, которые должны ломать CI при возврате известных ошибок:

- one coherent homepage gateway image;
- no retired five-panel gateway media system;
- native-ratio Canon art-direction layer present;
- no 4:5 rule in the authoritative corrective media layer;
- all 15 cards expose dossier preview;
- all 15 Canon routes exist and meet premium depth floor;
- exact Genin/Hermé dossiers retain stricter provenance/fail-closed wording;
- existing navigation, research, technique, SEO, accessibility and responsive contracts remain green.

## Evidence for this wave

Exact-SHA acceptance requires the normal repository workflows plus generated screenshot evidence from the same commit. A corrective PR must not be merged based on screenshots from an earlier SHA.

The previous closeout remains useful as a historical record of the first release, but its claim of zero Product debt is superseded by this owner-driven corrective record.
