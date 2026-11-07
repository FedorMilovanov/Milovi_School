/**
 * Permanent curated routes for the history reading room.
 * Every id is a real published article route; unknown/new history-category
 * entries appear automatically under "Новые исследования", never vanish.
 */
export const HISTORY_CATEGORY = 'histoire-culinaire'
export const HISTORY_FEATURE_ID = 'confectionery-profession-history'
export const historySections = [
  {
    id: 'profession',
    number: '01',
    kicker: 'Мастерская · Цех · Школа',
    title: 'Как родилась профессия',
    description: 'Ремесло, мастерские и люди, благодаря которым pâtisserie стала самостоятельной дисциплиной.',
    articleIds: [
      'confectionery-profession-history',
      'patissiers-guild-medieval',
      'stohrer-1730',
      'laduree-1862',
      'careme-first-celebrity-chef',
      'escoffier-biography',
    ],
  },
  {
    id: 'desserts',
    number: '02',
    kicker: 'Десерты · Документы · Легенды',
    title: 'Происхождение знаменитых десертов',
    description: 'Отдельные истории изобретений, переименований и легенд — с проверкой границ того, что действительно известно.',
    articleIds: [
      'croissant-history',
      'paris-brest-race-dessert',
      'creme-brulee-dispute',
      'french-classics-origins',
      'eclair-histoire-complete',
      'millefeuille-histoire',
      'opera-gateau-histoire',
      'buche-noel-histoire',
      'canele-bordeaux-histoire',
      'financier-histoire',
    ],
  },
  {
    id: 'culture',
    number: '03',
    kicker: 'Общество · Идеи · Культура',
    title: 'Культура за пределами витрины',
    description: 'Банкеты, гастрономическая мысль и традиции, в которых кондитерское дело стало частью истории.',
    articleIds: [
      'brillat-savarin',
      'carnaval-culinaire-histoire',
      'histoire-tartes-francaises',
    ],
  },
] as const
