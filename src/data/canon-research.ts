import type { CanonMediaId } from './canon-media'

export type CanonEvidenceKind = 'PRIMARY' | 'DOCUMENTED' | 'HOUSE' | 'INSTITUTIONAL' | 'CONFLICT' | 'BOUNDED'

export interface CanonResearchMilestone {
  id: string
  date: string
  sortKey: number
  workIds: readonly CanonMediaId[]
  title: string
  text: string
  evidence: CanonEvidenceKind
}

/**
 * Product-safe transfer from LE_CANON_SUCRE Research Wave 2 terminal authority.
 * Dates are documentary milestones, not automatic invention dates.
 * Only bounded/closed claims are represented here; visual-custody and locator
 * holds remain outside Product.
 */
export const canonResearchMilestones: readonly CanonResearchMilestone[] = [
  {
    id: 'saint-honore-1840-1873',
    date: '1840 / 1873',
    sortKey: 1840,
    workIds: ['saint-honore'],
    title: 'Saint-Honoré: рассказ о происхождении и документированная архитектура',
    text: 'Поздний рассказ Лакама относит историю Maison Chiboust к 1840 году; текст Гуффе 1873 года независимо фиксирует узнаваемую архитектуру с choux. Дата 1840 остаётся ретроспективным свидетельством, а не современным событию документом.',
    evidence: 'BOUNDED',
  },
  {
    id: 'citron-1845',
    date: '1845',
    sortKey: 1845,
    workIds: ['tarte-au-citron'],
    title: 'Архитектура лимонного тарта уже находится в обращении',
    text: 'Первое издание Acton описывает тонкие оболочки из теста и приготовленную лимонную начинку с яйцом, сахаром и маслом. Это ранняя транснациональная архитектура, а не доказательство национального изобретения.',
    evidence: 'PRIMARY',
  },
  {
    id: 'eclair-1848',
    date: '1848',
    sortKey: 1848,
    workIds: ['eclair'],
    title: 'Éclair: самый ранний текущий французский pastry-locator корпуса',
    text: 'У Шарля Поля де Кока в 1848 году точно локализован наполненный кремом десерт под названием éclairs. Это документальная точка присутствия, а не дата изобретения.',
    evidence: 'DOCUMENTED',
  },
  {
    id: 'bailleux-1860',
    date: '1860',
    sortKey: 1860,
    workIds: ['religieuse', 'baba-au-rhum'],
    title: 'Профессиональный слой именованных форм',
    text: 'Расширенное третье издание Bailleux напрямую показывает Religieuse, Babas parisiens, Savarin и Baba на уровне институционального оглавления. Корпус не переносит эти записи задним числом в первое издание 1856 года.',
    evidence: 'INSTITUTIONAL',
  },
  {
    id: 'mont-blanc-1891-1896',
    date: '1891 / 1896',
    sortKey: 1891,
    workIds: ['mont-blanc'],
    title: 'Mont-Blanc существует до линии Angelina',
    text: 'Artusi в 1891 году документирует близкую конструкцию из каштановых нитей и взбитых сливок; первое издание Farmer 1896 года уже содержит десерт с заголовком Mont Blanc. Angelina с 1903 года — знаменитая maison-signature, но не изобретатель категории.',
    evidence: 'PRIMARY',
  },
  {
    id: 'opera-1899',
    date: '1899',
    sortKey: 1899.1,
    workIds: ['opera'],
    title: 'Название «gâteau opéra» появляется раньше формы Dalloyau',
    text: 'Рекламный след Grand Hôtel фиксирует название в 1899 году. Research намеренно отделяет этот объект от архитектуры Dalloyau 1955 года и не объявляет их одним и тем же десертом.',
    evidence: 'BOUNDED',
  },
  {
    id: 'tatin-1899-1903',
    date: '1899 / 1903',
    sortKey: 1899.2,
    workIds: ['tarte-tatin'],
    title: 'Документальная известность Tatin предшествует легенде об ошибке',
    text: 'Периодические свидетельства уже знают тарт Tatin и горячий яблочный тарт как специальность Hôtel Tatin. Эти ранние источники подтверждают известность и передачу рецепта, но не подтверждают историю случайной ошибки.',
    evidence: 'DOCUMENTED',
  },
  {
    id: 'paris-brest-1909-1910',
    date: '1909–1910',
    sortKey: 1909,
    workIds: ['paris-brest'],
    title: 'Paris-Brest сохраняет реальный конфликт двух дат',
    text: 'Линия потомка и La Poste сохраняет 1909 год; современный Maison указывает 1910-й. Product показывает этот конфликт честно и не конструирует искусственную историю «заказ в 1909 — выпуск в 1910».',
    evidence: 'CONFLICT',
  },
  {
    id: 'opera-1955',
    date: '1955',
    sortKey: 1955.1,
    workIds: ['opera'],
    title: 'Каноническая современная линия Opéra у Dalloyau',
    text: 'Dalloyau и отраслевые источники поддерживают 1955 год и Cyriaque Gavillon как house-creation современной архитектуры Opéra, не смешивая её с более ранним названием 1899 года.',
    evidence: 'HOUSE',
  },
  {
    id: 'tropezienne-1955-1956',
    date: '1955 / 1956',
    sortKey: 1955.2,
    workIds: ['tarte-tropezienne'],
    title: 'Tropézienne: создание и кинохронология разделены',
    text: 'История Maison и города относит создание десерта к 1955 году; съёмки в Saint-Tropez проходят в мае–июле 1956-го. Поэтому популярная формула «назвали в 1955 году во время съёмок» отвергается.',
    evidence: 'BOUNDED',
  },
  {
    id: 'galette-1975',
    date: '1975',
    sortKey: 1975,
    workIds: ['galette-des-rois'],
    title: 'Современный ритуал galette в Élysée',
    text: 'Первичные материалы Élysée подтверждают традицию приёма мастеров-пекарей с 1975 года и республиканскую galette без fève. Прямая линия «Сатурналии → современная galette» как факт не публикуется.',
    evidence: 'PRIMARY',
  },
  {
    id: 'canele-1985',
    date: '1985',
    sortKey: 1985,
    workIds: ['canele-bordeaux'],
    title: 'Профессиональная институционализация canelé',
    text: 'Региональные, библиотечные и профессиональные источники сходятся на институционализации 1985 года и истории коллективной марки. Точные исторические реквизиты марки остаются за пределами Product.',
    evidence: 'INSTITUTIONAL',
  },
  {
    id: 'ispahan-1997',
    date: '1997',
    sortKey: 1997,
    workIds: ['ispahan'],
    title: 'Ispahan входит в официальную хронологию',
    text: 'Веха 1997 года поддерживается официальной и институциональной хронологией signature-композиции Pierre Hermé: роза, личи и малина.',
    evidence: 'HOUSE',
  },
  {
    id: 'kouign-protection-1999',
    date: 'c. 1999',
    sortKey: 1999,
    workIds: ['kouign-amann'],
    title: 'Документируется деятельность по защите Kouign-Amann',
    text: 'Независимый материал 2001 года подтверждает, что ассоциация Douarnenez занималась защитой примерно двумя годами ранее; участники называют 15 декабря 1999 года. Номера и классы INPI намеренно не публикуются без закрытого первичного объекта.',
    evidence: 'BOUNDED',
  },
  {
    id: '2000-feuilles-millennium',
    date: '≈ 2000',
    sortKey: 2000,
    workIds: ['2000-feuilles'],
    title: '2000 Feuilles закрепляется как современная signature-форма',
    text: 'Текущий состав и авторский статус Pierre Hermé закрыты источниками; контекст названия рубежа тысячелетий допустим только в ограниченной редакционной формулировке. Неполученная страница возможного предшественника Ladurée не повторяется.',
    evidence: 'HOUSE',
  },
  {
    id: 'genin-2010',
    date: '2010',
    sortKey: 2010,
    workIds: ['tarte-au-citron'],
    title: 'Техника Genin получает авторизованную издательскую фиксацию',
    text: 'Éditions Alternatives документирует публикацию Genin/Astier о tarte au citron и технике теста, выпечки и лимонного крема. Точная дата создания citron-basilic в 2009 году остаётся более поздним сообщением, а не закрытым первичным фактом.',
    evidence: 'DOCUMENTED',
  },
]

const researchIds = new Set<string>()
let previousSortKey = -Infinity
for (const milestone of canonResearchMilestones) {
  if (researchIds.has(milestone.id)) throw new Error(`[canon-research] Duplicate milestone id: ${milestone.id}`)
  researchIds.add(milestone.id)
  if (milestone.sortKey < previousSortKey) throw new Error(`[canon-research] Timeline is not chronological at ${milestone.id}`)
  previousSortKey = milestone.sortKey
  if (milestone.workIds.length === 0) throw new Error(`[canon-research] Milestone has no Canon work: ${milestone.id}`)
}
