export interface Category { id: string; name: string; icon: string; description: string; color: string }

/** Category IDs that are NOT chef-specific — used by HomeApp, MainCategories, CommandPalette */
export const NON_CHEF_CATEGORY_IDS = new Set([
  'techniques', 'recipes', 'french-cuisine', 'histoire-culinaire', 'chiffres-gourmands',
])

export const categories: Category[] = [
  { id: 'pierre-herme', name: 'Пьер Эрме', icon: 'PH', description: 'Макарон, вкус как архитектура, соль как баланс', color: 'from-rose-700 to-stone-950' },
  { id: 'cedric-grolet', name: 'Седрик Гроле', icon: 'CG', description: "Фрукты trompe-l'oeil, оболочки, гели, текстуры", color: 'from-amber-700 to-stone-950' },
  { id: 'christophe-michalak', name: 'Кристоф Мишалак', icon: 'CM', description: 'Щедрая современная классика, шоколад, карамель', color: 'from-blue-900 to-stone-950' },
  { id: 'philippe-conticini', name: 'Филипп Контисини', icon: 'PC', description: 'Пралине, эмоция, осмос вкуса и текстур', color: 'from-violet-900 to-stone-950' },
  { id: 'nina-metayer', name: 'Нина Метайе', icon: 'NM', description: 'Точность, выпечка, баланс соли и фруктов', color: 'from-emerald-900 to-stone-950' },
  { id: 'yann-couvreur', name: 'Янн Куврер', icon: 'YC', description: 'Мильфей a la minute, масло, Париж-Брест-эклер', color: 'from-orange-800 to-stone-950' },
  { id: 'dominique-ansel', name: 'Доминик Ансель', icon: 'DA', description: 'Cronut, DKA, время как ингредиент, инновации', color: 'from-cyan-900 to-stone-950' },
  { id: 'claire-heitzler', name: 'Клер Эйцлер', icon: 'CH', description: 'Этичная выпечка, сезонность, меньше сахара', color: 'from-lime-900 to-stone-950' },
  { id: 'francois-perret', name: 'Франсуа Перре', icon: 'FP', description: 'Ritz Paris, мадлен, мягкость, понятный вкус', color: 'from-yellow-900 to-stone-950' },
  { id: 'cyril-lignac', name: 'Сириль Линьяк', icon: 'CL', description: 'Equinoxe, ваниль, карамель, доступная высокая выпечка', color: 'from-neutral-700 to-stone-950' },
  { id: 'nicolas-paciello', name: 'Николя Пачелло', icon: 'NP', description: 'Детские воспоминания, точность, шоколад и пралине', color: 'from-red-950 to-stone-950' },
  { id: 'christophe-felder', name: 'Кристоф Фельдер', icon: 'CF', description: 'Фундамент французской pastry-школы', color: 'from-fuchsia-950 to-stone-950' },
  { id: 'mercotte', name: 'Меркотт', icon: 'MC', description: 'Макарон, меренга, любительская точность', color: 'from-pink-900 to-stone-950' },
  { id: 'techniques', name: 'Техники', icon: 'TK', description: 'Feuilletage, pate a choux, кремы, глазури', color: 'from-stone-700 to-stone-950' },
  { id: 'french-cuisine', name: 'Французская кухня', icon: 'FR', description: 'Соусы, бригада, классика и кухня ресторана', color: 'from-red-900 to-stone-950' },
  { id: 'recipes', name: 'Рецепты', icon: 'RC', description: 'Практические карты сборки и домашние версии', color: 'from-yellow-800 to-stone-950' },
  { id: 'jacques-genin', name: 'Жак Жени', icon: 'JG', description: 'Шоколад, карамель, мильфей à la minute — без диплома', color: 'from-indigo-950 to-stone-950' },
  { id: 'histoire-culinaire', name: 'Histoire Culinaire', icon: 'HC', description: 'Исторические материалы с французских источников — цехи, персоны, десерты', color: 'from-amber-900 to-stone-950' },
  { id: 'chiffres-gourmands', name: 'Chiffres Gourmands', icon: 'EC', description: 'Экономика французской кондитерской в точных цифрах — рынок, бренды, потребление', color: 'from-teal-800 to-stone-950' }
]
