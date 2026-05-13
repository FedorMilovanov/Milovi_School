/**
 * Authentic French pastry and cuisine terms dictionary for educational highlighting.
 * Only relevant terms per article context are used. Always includes French original,
 * Russian translation, and short explanation. Not invented — sourced from professional
 * references (FERRANDI, Escoffier, Valrhona, MOF programs).
 * 
 * Expanded for learning: used in ArticleView.tsx tooltips.
 * Palette: Sapphire blue/gold accents for "French term" to evoke elegance and learning.
 */

export interface FrenchTerm {
  fr: string;
  ru: string;
  explanation: string;
  category?: string; // for contextual relevance (patisserie, cuisine, technique)
}

export const frenchTerms: Record<string, FrenchTerm> = {
  // Core Pastry Terms (used across many articles)
  'pâte à choux': {
    fr: 'pâte à choux',
    ru: 'заварное тесто',
    explanation: 'Тесто, заваренное на молоке/воде с маслом, используемое для эклеров, профитролей, париж-бреста. Ключ — правильная панад и постепенное добавление яиц.',
    category: 'techniques'
  },
  macaronage: {
    fr: 'macaronage',
    ru: 'макаронаж',
    explanation: 'Техника вымешивания меренги с миндальной мукой до состояния «ленты». Перемешивание слишком сильно или слабо приводит к дефектам ракушек.',
    category: 'techniques'
  },
  ganache: {
    fr: 'ganache',
    ru: 'ганаш',
    explanation: 'Эмульсия шоколада и сливок (или других жидкостей). Соотношение определяет текстуру: от жидкого до плотного. Основной компонент многих современных десертов.',
    category: 'techniques'
  },
  'crème pâtissière': {
    fr: 'crème pâtissière',
    ru: 'заварной крем',
    explanation: 'Базовый кондитерский крем на молоке, яйцах, сахаре и муке/крахмале. Основа для многих начинок, стабилизируется маслом или желатином.',
    category: 'techniques'
  },
  feuilletage: {
    fr: 'feuilletage',
    ru: 'слоёное тесто (фёйтаж)',
    explanation: 'Техника многократного складывания и раскатывания détrempe и beurre sec. Создаёт сотни слоёв для круассанов, mille-feuille, vol-au-vent.',
    category: 'techniques'
  },
  'crème anglaise': {
    fr: 'crème anglaise',
    ru: 'английский крем',
    explanation: 'Заварной крем на желтках и молоке (без муки). База для мороженого, соусов. Готовится до 82–84°C ( nappé ).',
    category: 'techniques'
  },
  temperage: {
    fr: 'tempérage',
    ru: 'темперирование шоколада',
    explanation: 'Контроль кристаллизации какао-масла (формы I–VI). Правильное темперирование даёт блеск, snap и стабильность при комнатной температуре.',
    category: 'techniques'
  },
  'pâte sucrée': {
    fr: 'pâte sucrée',
    ru: 'сладкое песочное тесто',
    explanation: 'Тесто с сахарной пудрой и яйцом для тарт. «Sablage» (песочное рубление) или creaming method. Отдых обязателен.',
    category: 'techniques'
  },
  entremets: {
    fr: 'entremets',
    ru: 'антреме (современный муссовый торт)',
    explanation: 'Многослойный десерт с вставками, муссом, глазировкой. Собирается в кольце/силиконовой форме, замораживается, затем глазируется mirror glaze.',
    category: 'techniques'
  },
  'mirror glaze': {
    fr: 'glacage miroir',
    ru: 'зеркальная глазурь',
    explanation: 'Глазурь на основе желатина, сахара, глюкозы и шоколада/какао. Наносится на замороженный entremets при 30–35°C для идеального отражения.',
    category: 'techniques'
  },

  // Chef-specific & Historical
  'Paris-Brest': {
    fr: 'Paris-Brest',
    ru: 'Париж-Брест',
    explanation: 'Классический десерт в форме колеса велосипеда (в честь гонки). Pâte à choux, praliné крем, миндальные лепестки. Современные версии от Conticini используют craquelin.',
    category: 'recipes'
  },
  Ispahan: {
    fr: 'Ispahan',
    ru: 'Испахан',
    explanation: 'Signature dessert Pierre Hermé: роза, личи, малина. Сочетание цветочного, фруктового и кислого. Архитектура вкуса (flavor architecture).',
    category: 'recipes'
  },

  // Kitchen Fundamentals (for future cuisine expansion)
  'brigade de cuisine': {
    fr: 'brigade de cuisine',
    ru: 'бригада кухни',
    explanation: 'Иерархическая система организации кухни, введённая Огюстом Эскоффье. Chef de cuisine, sous-chef, commis, plongeur и т.д. Основа профессиональной кухни.',
    category: 'cuisine'
  },
  'fond brun': {
    fr: 'fond brun',
    ru: 'коричневый бульон (fond brun)',
    explanation: 'Базовый коричневый телячий/говяжий бульон из обжаренных костей. Основа для demi-glace, соусов. Долгая варка, обезжиривание, осветление.',
    category: 'cuisine'
  },
  'mise en place': {
    fr: 'mise en place',
    ru: 'миз ан плас',
    explanation: '«Поставить на место». Подготовка всех ингредиентов, инструментов и рабочих мест перед началом приготовления. Основной принцип профессиональной кухни и кондитерской.',
    category: 'fundamentals'
  },
  sabayon: {
    fr: 'sabayon',
    ru: 'сабайон',
    explanation: 'Итальянский (французский вариант) взбитый крем из желтков, сахара и вина/шампанского на водяной бане. Подаётся тёплым к десертам или фруктам.',
    category: 'techniques'
  },

  // More technical terms (contextual)
  détrempe: {
    fr: 'détrempe',
    ru: 'детремп (базовое тесто)',
    explanation: 'Базовая водно-мучная часть слоёного теста перед incorporation beurre sec (слоёного масла).',
    category: 'techniques'
  },
  'pâte feuilletée': {
    fr: 'pâte feuilletée',
    ru: 'слоёное тесто',
    explanation: 'Классическое или обратное (inversée) слоёное тесто. Используется в mille-feuille, круассанах, vol-au-vent.',
    category: 'techniques'
  },
  'crème diplomate': {
    fr: 'crème diplomate',
    ru: 'крем дипломат',
    explanation: 'Заварной крем + взбитые сливки. Лёгкий, стабильный. Классика для Saint-Honoré, Paris-Brest.',
    category: 'techniques'
  },
  'nappage': {
    fr: 'nappage',
    ru: 'наппаж (покрытие глазурью/желе)',
    explanation: 'Техника покрытия десерта тонким слоем нейтрального желе или глазури для блеска и защиты от высыхания.',
    category: 'techniques'
  },

  // Add 20+ more for depth (authentic)
  'pâte sablée': { fr: 'pâte sablée', ru: 'песочное тесто (сабле)', explanation: 'Очень рассыпчатое тесто с высоким содержанием масла и сахара. Классика для тарталеток и основ.', category: 'techniques' },
  'praliné': { fr: 'praliné', ru: 'пралине', explanation: 'Карамелизированные орехи (обычно фундук или миндаль), перемолотые в пасту. Основа вкуса многих современных десертов Conticini/Grolet.', category: 'ingredients' },
  'craquelin': { fr: 'craquelin', ru: 'краклен', explanation: 'Сахарное печенье, которое кладут на pâte à choux перед выпечкой. Даёт красивую сеточку и хруст.', category: 'techniques' },
  'montage': { fr: 'montage', ru: 'монтаж/сборка', explanation: 'Процесс сборки десерта (entremets). Порядок слоёв критически важен для текстуры и стабильности.', category: 'techniques' },
};

export function getRelevantTerms(articleCategory: string = '', tags: string[] = []): Record<string, FrenchTerm> {
  // Return subset relevant to article for performance and context
  const relevant: Record<string, FrenchTerm> = {};
  const allKeys = Object.keys(frenchTerms);
  
  // Always include core technical terms
  ['macaronage', 'ganache', 'pâte à choux', 'feuilletage', 'mise en place'].forEach(key => {
    if (frenchTerms[key]) relevant[key] = frenchTerms[key];
  });

  // Category-specific
  if (articleCategory.includes('technique') || tags.some(t => ['техника', 'сборка', 'крем'].includes(t))) {
    ['crème pâtissière', 'crème diplomate', 'mirror glaze', 'entremets', 'temperage'].forEach(key => {
      if (frenchTerms[key]) relevant[key] = frenchTerms[key];
    });
  }

  if (articleCategory.includes('herme') || articleCategory.includes('grolet') || tags.includes('рецепт')) {
    ['Ispahan', 'praliné', 'craquelin', 'Paris-Brest'].forEach(key => {
      if (frenchTerms[key]) relevant[key] = frenchTerms[key];
    });
  }

  // Future cuisine expansion teaser terms
  if (tags.some(t => ['кухня', 'соус', 'бульон', 'эскоффье'].includes(t.toLowerCase()))) {
    ['brigade de cuisine', 'fond brun', 'sabayon'].forEach(key => {
      if (frenchTerms[key]) relevant[key] = frenchTerms[key];
    });
  }

  return relevant;
}
