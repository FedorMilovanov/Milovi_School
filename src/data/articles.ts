import { localImages } from '../assets/images'
import { dc } from './deepContents'

export interface RecipeData { prepTime: string; cookTime: string; yield: string; calories?: string; ingredients: string[]; }
export interface Article { id: string; title: string; excerpt: string; content: string; category: string; author: string; readTime: number; image: string; tags: string[]; date?: string; updatedAt?: string; sourceUrl?: string; sourceLabel?: string; recipeData?: RecipeData; faq?: { question: string; answer: string }[]; }

// Возвращает глубокий контент если есть, иначе шаблон
const body = (_topic: string, _id?: string) => {
  if (_id && dc[_id]) return dc[_id]
  return `**Примечание о формате**

Это смысловое переложение и учебный конспект по открытым источникам. Материал написан по-русски и объясняет технику без непереведённых больших цитат.

================================================
КОНТЕКСТ
================================================

${_topic} важен не как красивая легенда, а как рабочая система: продукт, температура, текстура, время отдыха и повторяемый жест. Французская кондитерская школа строится не на эффекте, а на точности.

**Технологическая логика**

- крем должен быть гладким и доваренным;
- тесто должно отдыхать, если в нём развивается клейковина;
- соль работает как усилитель вкуса, а не как солёность;
- хрустящий слой нужен только там, где он помогает укусу;
- температура подачи влияет на аромат не меньше рецепта.

**Диагностика ошибок**

Если десерт кажется плоским, проверьте кислотность, соль и температуру подачи. Если текстура тяжёлая, ищите избыток жира или слишком плотный крем. Если хруст пропал, проблема часто не в рецепте, а во влажности сборки и хранении.

**Практический вывод**

Сначала определите роль каждого слоя: аромат, хруст, влажность, жирность, кислота. Всё, что не выполняет функцию, лучше убрать.`
}

export const articles: Article[] = [
  { id: 'grolet-lemon-yuzu', title: 'Рецепт знаменитого «Лимона» Седрика Гроле: Пошаговая техника иллюзорного десерта', excerpt: 'Техническая карта по культовому лимону: как сохранить кислоту, сделать тонкое покрытие и избежать вкуса варенья.', content: body('Седрик Гроле и лимон', 'grolet-lemon-yuzu'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 6, image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800', tags: ['лимон', 'юдзу', 'ганаш', 'обманка'], sourceUrl: 'https://reportergourmet.com/en/news/7740-cedric-grolet-and-the-recipe-for-stuffed-lemon-it-looks-like-fruit-but-it-s-a-dessert', date: '2025-01-15', sourceLabel: 'Reporter Gourmet' },
  { id: 'herme-ispahan-deep', title: 'Десерт Испахан от Пьера Эрме: Рецепт архитектуры вкуса (роза, личи и малина)', excerpt: 'Полный учебный разбор культового десерта: кислота малины, цветочный верх розы, сочная середина личи.', content: body('Испахан Пьера Эрме', 'herme-ispahan-deep'), category: 'pierre-herme', author: 'PH10, Traveling Foodies, PastryClass', readTime: 3, image: 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=800', tags: ['Испахан', 'роза', 'личи', 'малина'], sourceUrl: 'https://travellingfoodies.wordpress.com/2011/03/25/pierre-hermes-ispahan/', date: '2025-01-22', sourceLabel: 'Traveling Foodies' },
  { id: 'perret-softness-volume', title: 'Перре: объем, мягкость, воздушность и хрупкость как язык десерта', excerpt: 'Разбор интервью Madame Figaro: почему нож должен входить без сопротивления, а вкус нельзя приносить в жертву эстетике.', content: body('Франсуа Перре', 'perret-softness-volume'), category: 'francois-perret', author: 'Madame Figaro, WWD', readTime: 2, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800', tags: ['мягкость', 'Ritz', 'сахар', 'текстура'], sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', date: '2025-02-01', sourceLabel: 'Ritz Paris Le Comptoir' },
  { id: 'heitzler-ethical-pastry', title: 'Клер Эйцлер: сезонность, фермеры и этичная выпечка', excerpt: 'Глубокий материал по интервью Chefs for Impact, Valrhona и Pastry Arts: почему клубника зимой меняет профессию.', content: body('Клер Эйцлер', 'heitzler-ethical-pastry'), category: 'claire-heitzler', author: 'Chefs for Impact, Valrhona, Pastry Arts Magazine', readTime: 4, image: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=800', tags: ['этичная выпечка', 'сезонность', 'фермеры'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2025-02-10', sourceLabel: 'Chefs for Impact' },
  { id: 'couvreur-full-course', title: 'Секреты эклеров и мильфея от Янна Куврера: Разбор техник французской школы', excerpt: 'Исчерпывающий конспект 14 уроков Янна Куврера: заварное тесто, пралине-крем, масляный крем и мильфей.', content: body('Янн Куврер', 'couvreur-full-course'), category: 'yann-couvreur', author: 'PastryClass, Gault&Millau', readTime: 7, image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800', tags: ['курс', 'choux', 'пралине', 'мильфей'], sourceUrl: 'https://mypastryclass.com/blogs/articles/yann-couvreur-teaches-elite-parisian-pastries', date: '2025-02-20', sourceLabel: 'PastryClass' },
  { id: 'felder-fundamentals', title: 'Базовые рецепты французской выпечки от Кристофа Фельдера: Тесто и кремы без ошибок', excerpt: 'Почему книга Patisserie стала рабочей базой: 3200 фотографий, пошаговые уроки, кремы, тесто, тарты.', content: body('Кристоф Фельдер', 'felder-fundamentals'), category: 'christophe-felder', author: 'Christophe Felder references', readTime: 7, image: 'https://images.unsplash.com/photo-1486427944344-cd3954218dd7?w=800', tags: ['Фельдер', 'основы', 'школа'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2025-03-01', sourceLabel: 'Head Butler' },
  { id: 'herme-biography', title: 'Пьер Эрме: «Дерзость — вот что сделало меня успешным за 50 лет»', excerpt: 'Детальный материал по жизни и карьере Пьера Эрме: Эльзас, ученичество у Ленотра в 14 лет, 11 лет в Fauchon, Ladurée и 60+ точек по миру.', content: body('Пьер Эрме', 'herme-biography'), category: 'pierre-herme', author: 'AFP, Michelin Guide, Pastry Workshop', readTime: 2, image: 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=800', tags: ['биография', 'Ленотр', 'Fauchon'], sourceUrl: 'https://www.laliste.com/news/pierre-herme-the-picasso-of-pastry', date: '2025-03-10', sourceLabel: 'La Liste' },
  { id: 'grolet-fruits-full', title: 'Гроле: фрукты, оболочка, начинка, аэрограф и правдоподобие', excerpt: 'Техническая карта реалистичного фруктового десерта: от белого шоколада до геля с чистым вкусом.', content: body('Седрик Гроле фрукты', 'grolet-fruits-full'), category: 'cedric-grolet', author: 'PastryClass', readTime: 7, image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800', tags: ['фрукты', 'шоколад', 'аэрограф'], sourceUrl: 'https://mypastryclass.com/blogs/articles/cedric-grolet-teaches-fruits-nuts-and-flowers', date: '2025-03-20', sourceLabel: 'PastryClass' },
  { id: 'michalak-chocolate-salt', title: 'Мишалак: шоколад, морская соль и принцип щедрой выпечки', excerpt: 'Как чемпион мира делает десерт понятным, ярким и не скучным: соль, текстура, щедрость.', content: body('Кристоф Мишалак', 'michalak-chocolate-salt'), category: 'christophe-michalak', author: 'Taste and Flavors', readTime: 6, image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=800', tags: ['шоколад', 'соль', 'щедрость'], sourceUrl: 'https://www.tasteandflavors.com/christophe-michalak/', date: '2025-04-01', sourceLabel: 'Taste and Flavors' },
  { id: 'conticini-praline', title: 'Пралине Контисини: осмос ореха, сахара и воды', excerpt: 'Почему один и тот же рецепт пралине может давать разный вкус: 0,5% воды в кожице фундука.', content: body('Филипп Контисини', 'conticini-praline'), category: 'philippe-conticini', author: 'So Good Magazine', readTime: 7, image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', tags: ['пралине', 'осмос', 'фундук'], sourceUrl: 'https://www.sogoodmagazine.com/pastry-blog/pastry-chef-articles/philippe-conticini-interview/', date: '2025-04-10', sourceLabel: 'So Good Magazine' },
  { id: 'crookie-conticini', title: 'Crookie: от парижской булочной до мирового тренда', excerpt: 'Как Стефан Лувар из Maison Louvard создал гибрид круассана и cookie, а TikTok сделал его вирусным.', content: body('Crookie Maison Louvard', 'crookie-conticini'), category: 'french-cuisine', author: 'Grokipedia, Maison Louvard', readTime: 6, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', tags: ['Crookie', 'Лувар', 'тренды', '2024'], sourceUrl: 'https://grokipedia.com/page/Crookie', date: '2025-04-20', sourceLabel: 'Grokipedia' },
  { id: 'metayer-secrets', title: 'Нина Метайе: 3 секрета выпечки от лучшего кондитера мира', excerpt: 'Практические советы от обладательницы титула лучший шеф-кондитер 2023: мусс, соль и уважение к фрукту.', content: body('Метайе секреты', 'metayer-secrets'), category: 'nina-metayer', author: 'EnVols', readTime: 7, image: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800', tags: ['советы', 'мусс', 'соль'], sourceUrl: 'https://www.en-vols.com/en/taste/gastronomy/nina-metayer-baking-secrets-2/', date: '2025-05-01', sourceLabel: 'EnVols' },
  { id: 'metayer-salt-fruit', title: 'Нина Метайе: соль, мусс и уважение к фрукту', excerpt: 'Три профессиональных секрета в расширенном разборе: не перевзбивать, солить, не мучить продукт.', content: body('Метайе соль фрукт', 'metayer-salt-fruit'), category: 'nina-metayer', author: 'EnVols, Nina Metayer', readTime: 2, image: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800', tags: ['соль', 'мусс', 'фрукты'], sourceUrl: 'https://www.tasteandflavors.com/nina-metayer/', date: '2025-05-10', sourceLabel: 'Taste and Flavors' },
  { id: 'tech-glossary-cap', title: 'Словарь французского кондитера: термины, без которых рецепты не читаются', excerpt: 'Dessecher, detrempe, dorer, dresser, panade, puncher и другие рабочие слова кухни.', content: body('Французский словарь CAP', 'tech-glossary-cap'), category: 'techniques', author: 'French pastry glossary', readTime: 7, image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800', tags: ['словарь', 'CAP', 'термины'], sourceUrl: 'https://delicesnco.blogspot.com/2014/03/petit-lexique-des-termes-techniques-de.html', date: '2025-05-20', sourceLabel: 'Delices and co' },
  { id: 'grolet-raspberry-rose', title: 'Raspberry Rose от Гроле: ягода, которую только что сорвали', excerpt: 'Полная сборка фирменной малины Гроле: ванильный ганаш, малиновый гель без блендера, песочное тесто, финансье и эффект влажной кожуры.', content: body('Raspberry Rose от Гроле: ягода, которую только что сорвали', 'grolet-raspberry-rose'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 2, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', tags: ['малина', 'ваниль', 'ганаш', 'обманка', 'велюр'], sourceUrl: 'https://mypastryclass.com/blogs/articles/cedric-grolet-teaches-fruits-nuts-and-flowers', date: '2025-06-01', sourceLabel: 'PastryClass' },
  { id: 'ansel-dka', title: 'DKA: техническая карта kouign-amann от Доминика Анселя', excerpt: 'Слоение, блок масла, сахар, карамельная корка и контроль температуры для бретонской выпечки.', content: body('Ансель DKA', 'ansel-dka'), category: 'dominique-ansel', author: 'Frenchly, Dominique Ansel Bakery', readTime: 2, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', tags: ['DKA', 'kouign-amann', 'ламинация'], sourceUrl: 'https://frenchly.us/dominique-ansel-kouign-amann-dka-recipe/', date: '2025-06-10', sourceLabel: 'Frenchly' },
  { id: 'tech-choux', title: 'Заварное тесто: научная логика и диагностика ошибок', excerpt: 'Крахмал, пар, полость, яйца, подсушка, трещины и гладкая поверхность для эклеров и шу.', content: body('Заварное тесто', 'tech-choux'), category: 'techniques', author: 'Food52, CAP pastry notes', readTime: 7, image: 'https://images.unsplash.com/photo-1509365390695-33aee754301f?w=800', tags: ['заварное тесто', 'пар', 'panade', 'углублено'], sourceUrl: 'https://food52.com/story/14068-how-to-make-crullers-master-pate-a-choux-along-the-way', date: '2025-06-20', sourceLabel: 'Food52' },
  { id: 'lignac-equinoxe', title: 'Сириль Линьяк и Equinoxe: ваниль, speculoos и соленая карамель', excerpt: 'Перевод-разбор фирменного пирожного: почему минимализм работает, как карамельный центр держит композицию.', content: body('Линьяк Equinoxe', 'lignac-equinoxe'), category: 'cyril-lignac', author: 'The Wandering Eater', readTime: 6, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', tags: ['Equinoxe', 'ваниль', 'карамель'], sourceUrl: 'https://thewanderingeater.com/2021/12/02/patisserie-cyril-lignac-paris-france/', date: '2025-07-01', sourceLabel: 'The Wandering Eater' },
  { id: 'mercotte-anglaise', title: 'Меркотт: заварной английский крем 85°C, плоский венчик и контроль желтка', excerpt: 'Технологическая карта: почему нельзя кипятить, как проверить наппа, зачем нужен плоский венчик.', content: body('Меркотт английский крем', 'mercotte-anglaise'), category: 'mercotte', author: 'Mercotte, CAP, Elle & Vire', readTime: 7, image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=800', tags: ['английский крем', 'венчик', 'наппа', '85°C'], sourceUrl: 'https://www.mercotte.fr/category/les-bases/', date: '2025-07-10', sourceLabel: 'Mercotte' },
  { id: 'perret-madeleine-18h', title: 'Франсуа Перре и мадлен Ritz: 18 часов ради одного укуса', excerpt: 'Отдых, влажность, глазурь, второй нагрев и память вкуса в Salon Proust.', content: body('Перре мадлен', 'perret-madeleine-18h'), category: 'francois-perret', author: 'Bon Appetit, Madame Figaro', readTime: 7, image: 'https://images.unsplash.com/photo-1601000938259-9e92002320cf?w=800', tags: ['мадлен', 'Ritz', 'влажность'], sourceUrl: 'https://www.bonappetit.com/story/ritz-paris-proust-madeleine', date: '2025-07-20', sourceLabel: 'Bon Appetit' },
  { id: 'mercotte-macarons', title: 'Меркотт: макарон на итальянской меренге как система контроля', excerpt: 'Выдержанные белки, сироп 117°C, tant-pour-tant, ruban и созревание 24-48 часов.', content: body('Меркотт макарон', 'mercotte-macarons'), category: 'mercotte', author: 'Mercotte, Elle & Vire', readTime: 7, image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800', tags: ['макарон', 'меренга', '117°C'], sourceUrl: 'https://www.elle-et-vire.com/fr/fr/recettes/les-macarons-a-la-meringue-italienne-de-mercotte/', date: '2025-08-01', sourceLabel: 'Elle & Vire' },
  { id: 'tech-mirror-glaze', title: 'Глазурь miroir без пузырей: температура, блендер и замороженный entremets', excerpt: 'Полная диагностика зеркальной глазури: глюкоза, желатин, шоколад, температура 28-32°C.', content: body('Зеркальная глазурь', 'tech-mirror-glaze'), category: 'techniques', author: 'CAP pastry notes', readTime: 2, image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800', tags: ['глазурь', 'miroir', 'entremets'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2025-08-10', sourceLabel: 'CAP pastry notes' },
  { id: 'cuisine-sauces', title: 'Материнские соусы на практике: как из пяти баз получить десятки блюд', excerpt: 'Бешамель, велюте, эспаньоль, томат и голландез: применение, ошибки и производные.', content: body('Пять соусов', 'cuisine-sauces'), category: 'french-cuisine', author: 'Escoffier, Food52', readTime: 7, image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800', tags: ['соусы', 'Эскоффер', 'roux'], sourceUrl: 'https://www.escoffier.edu/blog/recipes/how-to-make-the-five-mother-sauces/', date: '2025-08-20', sourceLabel: 'Escoffier' },
  { id: 'paciello-childhood', title: 'Николя Пачелло: детские сладости, сделанные с точностью дворца', excerpt: 'CinqSens, марбре, флан, Paris-Brest и десерты, которые дают улыбку.', content: body('Пачелло детство', 'paciello-childhood'), category: 'nicolas-paciello', author: 'Journal des Femmes', readTime: 7, image: 'https://images.unsplash.com/photo-1605807646983-377bc5a76493?w=800', tags: ['детство', 'пралине', 'шоколад'], sourceUrl: 'https://cuisine.journaldesfemmes.fr/chefs-et-gastronomie/2676605-nicolas-paciello-star-patissiere-tres-discrete/', date: '2025-09-01', sourceLabel: 'Journal des Femmes' },
  { id: 'ansel-time', title: 'Доминик Ансель: время как ингредиент', excerpt: 'Главный урок автора Cronut и DKA: несколько минут могут изменить десерт так же сильно, как соль.', content: body('Ансель время', 'ansel-time'), category: 'dominique-ansel', author: 'Bon Appetit, Spoon University', readTime: 2, image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800', tags: ['Cronut', 'DKA', 'время'], sourceUrl: 'https://www.bonappetit.com/people/chefs/article/dominique-ansel-interview', date: '2025-09-10', sourceLabel: 'Bon Appetit' },
  { id: 'tech-feuilletage', title: 'Feuilletage без провалов: почему слоёное тесто не поднимается', excerpt: 'Полная диагностика: детремп, масло для раскатки, простые и двойные туры, выпечка.', content: body('Слоёное тесто', 'tech-feuilletage'), category: 'techniques', author: 'Atouts Gourmands, CAP pastry notes', readTime: 7, image: 'https://images.unsplash.com/photo-1600626336206-82b8371ebdb6?w=800', tags: ['слоёное тесто', 'масло', 'выпечка'], sourceUrl: 'https://atoutsgourmands.wordpress.com/2023/01/12/pate-feuilletee-comprendre-et-maitriser/', date: '2025-09-20', sourceLabel: 'Atouts Gourmands' },
  { id: 'tech-creme-pat', title: 'Заварной крем без комков: гладкий и доваренный', excerpt: 'Профессиональная схема: темперирование желтков, крахмал, кипячение, охлаждение и стабилизация.', content: body('Заварной крем', 'tech-creme-pat'), category: 'techniques', author: 'CAP pastry notes', readTime: 2, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', tags: ['заварной крем', 'крахмал', 'ваниль'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2025-10-01', sourceLabel: 'CAP pastry notes' },
  { id: 'cuisine-brigade', title: 'Бригада де кухни: иерархия французского ресторана', excerpt: 'Классическая организация профессиональной кухни, придуманная Эскоффером.', content: body('Бригада де кухни', 'cuisine-brigade'), category: 'french-cuisine', author: 'IHM Notes', readTime: 2, image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800', tags: ['бригада', 'кухня', 'Эскоффер'], sourceUrl: 'https://www.escoffier.edu/blog/culinary-pastry-careers/different-types-of-chef-jobs-in-the-brigade-de-cuisine/', date: '2025-10-10', sourceLabel: 'Auguste Escoffier School' },
  { id: 'michalak-religieuse', title: 'Карамельная религиёз по Мишалаку: полный рецепт', excerpt: 'Детальная инструкция по созданию классического французского десерта от чемпиона мира.', content: body('Мишалак религиёз', 'michalak-religieuse'), category: 'christophe-michalak', author: 'Cook First', readTime: 2, image: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800', tags: ['религиёз', 'карамель', 'заварное тесто'], sourceUrl: 'https://www.academiedugout.fr/recettes/religieuse-caramel-beurre-sale_4463_2', date: '2025-10-20', sourceLabel: 'Académie du Goût' },
  { id: 'couvreur-millefeuille', title: 'Янн Куврер: мильфей, который едят ложкой', excerpt: 'Перевод-конспект о фирменном ванильном mille-feuille, kouign-amann-тесте и лёгком креме.', content: body('Куврер мильфей', 'couvreur-millefeuille'), category: 'yann-couvreur', author: 'Gault&Millau, PastryClass', readTime: 7, image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800', tags: ['мильфей', 'ваниль', 'хруст'], sourceUrl: 'https://fr.gaultmillau.com/en/news/yann-couvreur-en-5-patisseries', date: '2025-11-01', sourceLabel: 'Gault&Millau' },
  { id: 'heitzler-seasonality', title: 'Клер Эйцлер: почему клубника зимой — это не клубника', excerpt: 'Как сезонность меняет аромат, кислоту и текстуру фрукта, и что это значит для рецепта.', content: body('Эйцлер сезонность', 'heitzler-seasonality'), category: 'claire-heitzler', author: 'Chefs for Impact, Valrhona', readTime: 2, image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800', tags: ['сезонность', 'этика', 'фрукты'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2025-11-10', sourceLabel: 'Chefs for Impact' },
  { id: 'lignac-patisserie-shop', title: 'La Patisserie Cyril Lignac: как высокая выпечка стала соседской', excerpt: 'Конспект по бутику Линьяка и Бенуа Куврана: круассаны, флан, baba au rhum, лимонная тарта и хлеб.', content: body('Линьяк бутик', 'lignac-patisserie-shop'), category: 'cyril-lignac', author: 'David Lebovitz', readTime: 6, image: 'https://images.unsplash.com/photo-1620921568790-c1cf8984624c?w=800', tags: ['бутик', 'флан', 'круассан'], sourceUrl: 'https://www.davidlebovitz.com/la-patisserie/', date: '2025-11-20', sourceLabel: 'David Lebovitz' },
  { id: 'felder-alsace', title: 'Эльзасская линия Фельдера: kougelhopf, linzer, streusel и школа рук', excerpt: 'Перевод-конспект о школе Фельдера в Страсбурге и роли региональной выпечки в профессиональной базе.', content: body('Фельдер Эльзас', 'felder-alsace'), category: 'christophe-felder', author: 'Petit Fute, Felder school references', readTime: 7, image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=800', tags: ['Эльзас', 'kougelhopf', 'streusel'], sourceUrl: 'https://www.petitfute.co.uk/v458-strasbourg-67000/c1171-sports-loisirs/c1254-hobbies-et-autres-loisirs/c315-cours-de-cuisine/419978-ecole-de-patisserie-de-christophe-felder.html', date: '2025-12-01', sourceLabel: 'Petit Fute' },
  { id: 'paciello-cinqsens', title: 'CinqSens Пачелло: магазин как иммерсивная дегустация ингредиента', excerpt: 'Как строить десерт от сырья: ваниль Таити, сицилийская фисташка, какао Гватемалы.', content: body('Пачелло CinqSens', 'paciello-cinqsens'), category: 'nicolas-paciello', author: 'Journal des Femmes, Frenchefs', readTime: 2, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', tags: ['CinqSens', 'ингредиенты', 'фисташка'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2025-12-10', sourceLabel: 'Frenchefs' },
  { id: 'ansel-cronut-origin', title: 'Cronut: как 15 пончиков изменили кондитерский мир', excerpt: 'История изобретателя Cronut: кухня размером со стол, вирусная публикация и звонок президента Франции.', content: body('Ансель Cronut', 'ansel-cronut-origin'), category: 'dominique-ansel', author: 'Food and Wine, Bakepedia', readTime: 7, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', tags: ['Cronut', 'биография', 'Нью-Йорк'], sourceUrl: 'https://www.foodandwine.com/chefs/dominique-ansel-leading-light-pastry', date: '2025-12-20', sourceLabel: 'Food and Wine' },
  { id: 'michalak-fantastik', title: 'Мишалак и Fantastik: торт высотой 3 см, потому что рот не шире', excerpt: 'Эргономика десерта: почему чемпион мира буквально измерил свой рот перед созданием фирменного торта.', content: body('Мишалак Fantastik', 'michalak-fantastik'), category: 'christophe-michalak', author: 'HuffPost, Reporter Gourmet', readTime: 7, image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', tags: ['Fantastik', 'эргономика', 'шоколад'], sourceUrl: 'https://reportergourmet.com/en/chef/782-christophe-michalak', date: '2024-09-01', sourceLabel: 'Reporter Gourmet' },
  { id: 'tech-madeleine', title: 'Madeleine: бугорок не магия, а температурный шок', excerpt: 'Почему появляется bosse: холодное тесто, горячая форма, двухэтапная выпечка и металлическая форма.', content: body('Мадлен бугорок', 'tech-madeleine'), category: 'techniques', author: 'BakingLikeAChef, Pardon Your French', readTime: 5, image: 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800', tags: ['мадлен', 'bosse', 'температура'], sourceUrl: 'https://www.bakinglikeachef.com/secrets-of-the-madeleine-hump/', date: '2024-09-15', sourceLabel: 'BakingLikeAChef' },
  { id: 'cuisine-galette', title: 'Классическая Galette des Rois: миндальный крем, слоёное тесто, традиция', excerpt: 'Традиционный французский пирог Трёх королей с миндальным кремом и слоёным тестом.', content: body('Galette des Rois', 'cuisine-galette'), category: 'french-cuisine', author: 'Leonce Chenal', readTime: 2, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', tags: ['традиция', 'Galette', 'миндаль'], sourceUrl: 'https://lacuisinedethomas.fr/recettes/galette-des-rois-frangipane-christophe-michalak/', date: '2024-10-01', sourceLabel: 'La Cuisine de Thomas' },
  { id: 'cuisine-sauces-history', title: 'История французских соусов от Карема до Эскоффера', excerpt: 'Как два великих шефа создали систему, которой пользуются до сих пор.', content: body('История соусов', 'cuisine-sauces-history'), category: 'french-cuisine', author: 'Savory Kitchin', readTime: 2, image: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800', tags: ['история', 'Карем', 'Эскоффер'], sourceUrl: 'https://savorykitchin.com/deep-history-of-the-five-mother-sauces/', date: '2024-10-15', sourceLabel: 'Savory Kitchen' },
  { id: 'recipe-pecan-chocolate-creme-brulee', title: "Entremets «Пекан, шоколад и крем-брюле»: рецепт от Ogre de Carrouselberg", excerpt: 'Полная технологическая карта мини-тарт от лилльского кондитера: пралине из пекана, ганаш-монте, шоколадный бисквит и крем-брюле как вставка.', content: body('recipe-pecan-chocolate-creme-brulee', 'recipe-pecan-chocolate-creme-brulee'), category: 'recipes', author: 'Fou de Pâtisserie, Ogre de Carrouselberg, defis-patisserie.com', readTime: 7, image: localImages.pecan, tags: ['рецепт', 'пекан', 'шоколад', 'крем-брюле', 'entremets'], sourceUrl: 'https://defis-patisserie.com/decouvrez-lentremets-noix-de-pecans-chocolat-et-creme-brulee/', date: '2024-11-01', sourceLabel: 'defis-patisserie.com' },
  { id: 'tech-macaronage', title: 'Техника макаронаж: искусство идеального теста для макарон', excerpt: 'Секреты складывания теста: сбор и переворачивание, тест с лентой, проверка поверхности.', content: body('Макаронаж', 'tech-macaronage'), category: 'techniques', author: 'Pastry Expertise', readTime: 7, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800', tags: ['макаронаж', 'макарон', 'техника'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2024-11-15', sourceLabel: 'CAP pastry notes' },
  // === НОВЫЕ СТАТЬИ (апрель 2026) ===
  { id: 'adam-eclair', title: 'Кристоф Адам: эклер как холст — цвет, глянец и 200 вариаций', excerpt: 'Основатель L\'Éclair de Génie о том, почему эклер стал главным десертом десятилетия и как из классики сделать арт-объект.', content: body('Кристоф Адам эклер', 'adam-eclair'), category: 'techniques', author: 'L\'Éclair de Génie, Vogue France', readTime: 7, image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800', tags: ['эклер', 'глазурь', 'цвет'], sourceUrl: 'https://www.bakersjournal.com/interview-with-chef-christophe-adam-on-inspiration-and-eclairs-7517/', date: '2024-12-01', sourceLabel: 'Bakers Journal' },
  { id: 'tech-tempering-chocolate', title: 'Темперирование шоколада: кривая, кристаллы и глянец', excerpt: 'Полная технологическая карта: кривая темперирования для тёмного, молочного и белого шоколада. Метод стола, метод посева, микрио.', content: body('Темперирование шоколада', 'tech-tempering-chocolate'), category: 'techniques', author: 'Valrhona Professional, École Valrhona', readTime: 2, image: 'https://images.unsplash.com/photo-1548907040-4d42bcd3a8e0?w=800', tags: ['темперирование', 'шоколад', 'кристаллы', 'Valrhona'], sourceUrl: 'https://www.valrhona.com/en/l-ecole-valrhona/discover-l-ecole-valrhona/chocolate-terminology/tempering-chocolate', date: '2024-12-15', sourceLabel: 'École Valrhona' },
  { id: 'herme-fetish-flavors', title: 'Пьер Эрме: пять вкусов, которые он называет своими', excerpt: 'Роза-личи-малина, белый трюфель-ваниль, карамель с солью, маття и умами из соевого соуса — философия подписных вкусов шефа.', content: body('Эрме фирменные вкусы', 'herme-fetish-flavors'), category: 'pierre-herme', author: 'PH10, Maison Pierre Hermé Paris', readTime: 2, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', tags: ['Эрме', 'Испахан', 'ваниль', 'маття'], sourceUrl: 'https://english.aawsat.com/varieties/5265238-macarons-used-bore-me-says-french-pioneer-pierre-herme', date: '2024-01-15', sourceLabel: 'AFP' },
  { id: 'grolet-walnut', title: 'Гроле: орех грецкий — как сделать жёсткий продукт нежным', excerpt: 'Технологическая карта десерта Noix: скорлупа из молочного шоколада, пралине из грецкого ореха, мягкий ганаш и текстура, которую невозможно ожидать.', content: body('Гроле грецкий орех', 'grolet-walnut'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 2, image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800', tags: ['орех', 'пралине', 'ганаш', 'обманка'], sourceUrl: 'https://www.theworlds50best.com/stories/News/cedric-grolet-worlds-best-pastry-chef.html', date: '2024-02-01', sourceLabel: "World's 50 Best" },
  { id: 'tech-ganache-types', title: 'Три типа ганаша: эмульсия, монте и конфетный — в чём разница', excerpt: 'Когда брать ганаш для начинки конфет, когда для крема торта, а когда для глазури. Пропорции, жиры и стабильность.', content: body('Типы ганаша', 'tech-ganache-types'), category: 'techniques', author: 'Valrhona, École Ferrandi', readTime: 2, image: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=800', tags: ['ганаш', 'эмульсия', 'шоколад', 'крем'], sourceUrl: 'https://www.valrhona.com/en/l-ecole-valrhona/discover-l-ecole-valrhona/chocolate-terminology/chocolate-ganache', date: '2024-02-15', sourceLabel: 'École Valrhona' },
  { id: 'kayser-sourdough-pastry', title: 'Эрик Кайзер: закваска в кондитерке — хлебная логика в десерте', excerpt: 'Как основатель Maison Kayser привнёс кислотность хлебной закваски в бриошь, куинь-аман и слойку.', content: body('Эрик Кайзер закваска', 'kayser-sourdough-pastry'), category: 'techniques', author: 'Maison Kayser, Taste France', readTime: 2, image: 'https://images.unsplash.com/photo-1426869981800-95ebf51ce900?w=800', tags: ['закваска', 'бриошь', 'Кайзер', 'хлеб'], sourceUrl: 'https://maison-kayser.com/en/cours/make-your-own-natural-sourdough-with-eric-kaysers-recipe/', date: '2024-03-01', sourceLabel: 'Maison Kayser Academy' },
  { id: 'tech-entremets-assembly', title: 'Сборка entremets: порядок слоёв, заморозка и демолдирование без потерь', excerpt: 'Профессиональный алгоритм: что идёт первым в кольцо, как заморозить вставку, когда глазировать и как вынуть без трещин.', content: body('Сборка антреме', 'tech-entremets-assembly'), category: 'techniques', author: 'CAP pastry notes, École de Pâtisserie', readTime: 2, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', tags: ['entremets', 'сборка', 'заморозка', 'демолдирование'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2024-03-15', sourceLabel: 'École de Pâtisserie' },
  { id: 'conticini-texture-first', title: 'Контисини: текстура важнее вкуса — почему он так думает', excerpt: 'Философский разбор подхода Контисини: почему первым работает тактильное ощущение, и только потом приходит вкус.', content: body('Контисини текстура', 'conticini-texture-first'), category: 'philippe-conticini', author: 'So Good Magazine, Fou de Pâtisserie', readTime: 2, image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800', tags: ['текстура', 'Контисини', 'философия'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2024-04-01', sourceLabel: 'Gault&Millau' },
  { id: 'cuisine-fond-brun', title: 'Фон-де-во и фон-брюн: как французский бульон стал основой всей профессиональной кухни', excerpt: 'От обжарки костей до наппирования. Почему жидкость — это не вода, а система вкусов, которую нельзя заменить кубиком.', content: body('Фон-де-во французский', 'cuisine-fond-brun'), category: 'french-cuisine', author: 'Escoffier, Auguste Escoffier School', readTime: 2, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', tags: ['фон-де-во', 'бульон', 'Эскоффер', 'соус'], sourceUrl: 'https://escoffierathome.com/recipes/4-fond-brun-de-veau-brown-veal-stock/', date: '2024-04-15', sourceLabel: 'Escoffier At Home' },
  { id: 'metayer-world-best-2023', title: 'Нина Метайе — лучший шеф-кондитер мира 2023: история и работы', excerpt: 'Карьера от Troisgros до Accents, первая женщина с этим титулом за 10 лет — что стоит за победой и как выглядят её ключевые десерты.', content: body('Метайе лучший кондитер мира', 'metayer-world-best-2023'), category: 'nina-metayer', author: "World's 50 Best, Le Chef Magazine", readTime: 2, image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800', tags: ['Метайе', 'лучший кондитер', '2023', 'биография'], sourceUrl: 'https://www.theworlds50best.com/stories/News/nina-metayer-worlds-best-pastry-chef-2024-interview.html', date: '2024-05-01', sourceLabel: "World's 50 Best" },
  { id: 'tech-sugar-work', title: 'Работа с сахаром: тянутый, дутый и литой — три языка кондитерского искусства', excerpt: 'Стадии варки сахара, температуры, изомальт, техника сатинирования и практика дутья. С чего начинать и каких ошибок не простит сахар.', content: body('Работа с сахаром', 'tech-sugar-work'), category: 'techniques', author: 'École Ferrandi, MOF Pastry references', readTime: 2, image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', tags: ['сахар', 'изомальт', 'дутый сахар', 'украшения'], sourceUrl: 'https://www.escoffier.edu/blog/baking-pastry/sugar-sculpting-explained/', date: '2024-05-15', sourceLabel: 'Auguste Escoffier School' },
  { id: 'tech-mousse-stability', title: 'Мусс без желатина: как аэрация и жир удерживают форму', excerpt: 'Почему шоколадный мусс может стоять без желатина, а фруктовый — нет. Физика пены, роль сливок и правильная температура взбивания.', content: body('Мусс стабильность', 'tech-mousse-stability'), category: 'techniques', author: 'Valrhona, Pastry Arts Magazine', readTime: 2, image: 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=800', tags: ['мусс', 'стабильность', 'желатин', 'аэрация'], sourceUrl: 'https://www.valrhona.us/our-recipes/tips-and-tricks/valrhona-chef-s-tips-tricks', date: '2024-06-01', sourceLabel: 'Valrhona Professional' },

  { id: 'genin-autodidact', title: 'Жак Жени: от бойни до лучшего шоколада Парижа — без единого диплома', excerpt: 'Как человек без образования, работавший на бойне с 13 лет, стал поставщиком 200 ресторанов Michelin и открыл лучшую шоколатерию Марэ.', content: body('Жак Жени путь', 'genin-autodidact'), category: 'jacques-genin', author: 'Food & Sens, Newtable, Jacques Genin', readTime: 2, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800', tags: ['биография', 'автодидакт', 'шоколад', 'Марэ'], sourceUrl: 'https://foodandsens.com/made-by-f-and-s/chefs-on-parle-de-vous/jacques-genin-patissier-a-appris-aupres-chefs-de-cuisine/', date: '2024-06-15', sourceLabel: 'Food & Sens' },

  { id: 'genin-millefeuille', title: 'Мильфей Жани: «К 14:00 или к 20:00?» — почему сборка решает всё', excerpt: 'Почему лучший мильфей Парижа не продаётся утром: философия свежести, феноменальные карамели и то, чему Жени научился у ресторанных шефов.', content: body('Жак Жени мильфей', 'genin-millefeuille'), category: 'jacques-genin', author: 'Paris by Mouth, The Wandering Eater, L\'Honoré', readTime: 2, image: 'https://images.unsplash.com/photo-1526081347589-7151e5f26c8f?w=800', tags: ['мильфей', 'карамель', 'freshness', 'Париж'], sourceUrl: 'https://parisbymouth.com/our-guide-to-paris-jacques-genin/', date: '2024-07-01', sourceLabel: 'Paris by Mouth' },

  { id: 'herme-architecture-taste', title: 'Эрме в Гарварде: лекция об архитектуре вкуса, соль и Испахан', excerpt: 'Как четвёртое поколение кондитеров из Эльзаса превратило соль в инструмент баланса, а болгарская розовая трапеза 1987 года создала главный десерт эпохи.', content: body('Эрме архитектура вкуса', 'herme-architecture-taste'), category: 'pierre-herme', author: 'The Talks, Michelin Guide, La Liste', readTime: 2, image: 'https://images.unsplash.com/photo-1490323930654-6f5bb35fc7b0?w=800', tags: ['Испахан', 'соль', 'вкус', 'Гарвард', 'архитектура'], sourceUrl: 'https://the-talks.com/interview/pierre-herme/', date: '2024-07-15', sourceLabel: 'The Talks' },

  { id: 'conticini-paris-brest-iconic', title: 'Контисини: Париж-Брест, верин и почему шоколадные крокеты 1986 года изменили французскую кондитерскую', excerpt: 'Пять ключевых десертов — пять этапов пути от La Table d\'Anvers до La Pâtisserie des Rêves: как один повар переосмыслил классику через эмоцию.', content: body('Контисини Париж-Брест иконы', 'conticini-paris-brest-iconic'), category: 'philippe-conticini', author: 'Gault&Millau, Maison.com, Raids Pâtisseries', readTime: 2, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800', tags: ['Париж-Брест', 'верин', 'история', 'эмоция', 'La Table d\'Anvers'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2024-08-01', sourceLabel: 'Gault&Millau' },

  { id: 'couvreur-canal-biography', title: 'Янн Куврер: лис, Канал Сен-Мартен и путь из Eden Rock в Майами', excerpt: 'Как бывший шеф-кондитер Prince de Galles открыл бутик у канала и стал символом нового парижского кондитерского движения — через сезонность и честный вкус.', content: body('Куврер лис биография', 'couvreur-canal-biography'), category: 'yann-couvreur', author: 'Le JDD, Wikipedia, Galeries Lafayette', readTime: 2, image: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=800', tags: ['биография', 'лис', 'Canal Saint-Martin', 'сезонность'], sourceUrl: 'https://www.lejdd.fr/culture/yann-couvreur-le-chef-patissier-qui-exporte-son-talent-aux-quatre-coins-du-monde-154676', date: '2024-08-15', sourceLabel: 'Le JDD' },

  { id: 'perret-ritz-notebook', title: 'Перре: «правильный сахар» — мильфей, который носят в руке, и лучшая кондитерская мира', excerpt: 'Как шеф-кондитер Ritz Paris превратил мадлен Salon Proust в бренд мирового уровня и почему La Liste назвала его бутик лучшим в мире в 2024 году.', content: body('Перре Ritz записная книжка', 'perret-ritz-notebook'), category: 'francois-perret', author: 'Gault&Millau, Ritz Paris Le Comptoir, Meet & Match', readTime: 2, image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800', tags: ['Ritz', 'мадлен', 'мильфей', 'La Liste', 'лучшая кондитерская'], sourceUrl: 'https://fr.gaultmillau.com/en/news/francois-perret-en-5-desserts', date: '2023-09-01', sourceLabel: 'Gault&Millau' },

  // === КОНТЕНТ-СТРАТЕГИЯ (апрель 2026) — по аудиту ===

  { id: 'stohrer-1730', title: 'Maison Stohrer 1730: старейшая кондитерская Парижа, пережившая Наполеона, революцию и две войны', excerpt: 'Николас Шторер — кондитер польского короля — открыл лавку на Rue Montorgueil в 1730 году. Там же она стоит до сих пор. История баба-о-рома, puits d\'amour и religieuse.', content: body('Maison Stohrer 1730: старейшая кондитерская Парижа, переживш', 'stohrer-1730'), category: 'histoire-culinaire', author: 'stohrer.fr, The Parisian Guide, France Today', readTime: 2, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', tags: ['Stohrer', 'история', 'баба-о-ром', '1730', 'Rue Montorgueil'], sourceUrl: 'https://stohrer.fr/about-us/', date: '2023-10-01', sourceLabel: 'Maison Stohrer' },

  { id: 'laduree-1862', title: 'Ladurée 1862: как пожар, женщина с идеей и внук с кремом создали символ Парижа', excerpt: 'Луи-Эрнест Ладюрэ открыл булочную в 1862 году. Пожар уничтожил её — он перестроил в кондитерскую. Жена добавила чайный салон. Внук склеил два печенья кремом. Родился парижский макарон.', content: body('Ladurée 1862: как пожар, женщина с идеей и внук с кремом соз', 'laduree-1862'), category: 'histoire-culinaire', author: 'Wikipedia, Paris.zagranitsa.com', readTime: 2, image: 'https://images.unsplash.com/photo-1520218823717-f6e0b8a89d70?w=800', tags: ['Ladurée', 'макарон', 'история', '1862', 'Пьер Эрме'], sourceUrl: 'https://en.wikipedia.org/wiki/Laduree', date: '2023-11-01', sourceLabel: 'Wikipedia' },

  { id: 'careme-first-celebrity-chef', title: 'Антонен Карем: первый звёздный шеф, который кормил Наполеона', excerpt: 'Брошенный ребёнок из Парижа — и кондитер Наполеона, Александра I и принца-регента Англии. История о том, как 15-летний беспризорник стал «королём шефов», изобрёл мать-соусы и превратил кондитерское дело в архитектуру.', content: body('Антонен Карем: первый звёздный шеф, который кормил Наполеона', 'careme-first-celebrity-chef'), category: 'histoire-culinaire', author: 'NPR, National Geographic, Britannica', readTime: 2, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', tags: ['Антонен Карем', 'история', 'XIX век', 'Наполеон', 'мать-соусы'], sourceUrl: 'https://www.npr.org/sections/thesalt/2017/01/12/509154654/how-a-destitute-abandoned-parisian-boy-became-the-first-celebrity-chef', date: '2023-12-01', sourceLabel: 'NPR' },

  { id: 'croissant-history', title: 'История круассана: не французский, не из Парижа — и всё равно символ Франции', excerpt: 'Круассан родился в Вене в 1683 году как kipfel. В Париж привёз австрийский офицер в 1839-м. Слоёное тесто появилось только в 1895-м. История ламинирования, спора chocolatine vs pain au chocolat и почему 30–40% круассанов во Франции — замороженные.', content: body('История круассана: не французский, не из Парижа — и всё равн', 'croissant-history'), category: 'histoire-culinaire', author: 'ICE, Taste and Travel, Sortir à Paris', readTime: 2, image: 'https://images.unsplash.com/photo-1549090702-3a93a0b26e35?w=800', tags: ['круассан', 'история', 'ламинирование', 'венуазри', 'Август Занг'], sourceUrl: 'https://www.ice.edu/blog/brief-history-croissant-austrian-kipferl-layered-french-luxury', date: '2023-01-15', sourceLabel: 'ICE Culinary School' },

  { id: 'escoffier-biography', title: 'Огюст Эскоффье: бригада, «Le Guide Culinaire» и кухня как система', excerpt: 'Как беглый юнга из Ниццы стал «Императором шефов», изобрёл бригадную кухню, накормил Нелли Мелба и написал 5000 рецептов, которыми пользуются до сих пор.', content: body('Огюст Эскоффье биография', 'escoffier-biography'), category: 'histoire-culinaire', author: 'Le Guide Culinaire, NPR, Escoffier School', readTime: 5, image: 'https://images.unsplash.com/photo-1425325948733-7c0ed8ab1d3f?w=800', tags: ['Эскоффье', 'история', 'бригада', 'XIX век', 'Le Guide Culinaire'], sourceUrl: 'https://www.escoffier.edu/blog/culinary-pastry-careers/different-types-of-chef-jobs-in-the-brigade-de-cuisine/', date: '2023-02-01', sourceLabel: 'Auguste Escoffier School' },

  { id: 'brillat-savarin', title: 'Бриллья-Саварен: «Скажи мне, что ты ешь» — философ, написавший гастрономию', excerpt: 'Адвокат, мэр, судья и беглец от революции, который провёл три года в Коннектикуте, охотился на индеек и написал книгу, изменившую отношение к еде.', content: body('Бриллья-Саварен философ вкуса', 'brillat-savarin'), category: 'histoire-culinaire', author: 'Physiologie du Goût, Britannica', readTime: 5, image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800', tags: ['Бриллья-Саварен', 'история', 'философия', 'XIX век', 'гастрономия'], sourceUrl: 'https://www.britannica.com/biography/Jean-Anthelme-Brillat-Savarin', date: '2023-03-01', sourceLabel: 'Britannica' },

  { id: 'paris-brest-race-dessert', title: 'Paris-Brest: десерт для велогонки, который пережил её на 100 лет', excerpt: 'В 1910 году кондитер Луи Дюран придумал пирожное в форме колеса для велогонки Париж–Брест. В 2009-м Контисини спрятал его начинку — и переизобрёл классику.', content: body('Paris-Brest история велогонка', 'paris-brest-race-dessert'), category: 'histoire-culinaire', author: 'ICE Culinary, PBP History', readTime: 6, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800', tags: ['Paris-Brest', 'история', 'Луи Дюран', 'велогонка', 'Контисини'], sourceUrl: 'https://www.ice.edu/blog/history-of-paris-brest', date: '2023-04-01', sourceLabel: 'ICE Culinary School' },

  { id: 'creme-brulee-dispute', title: 'Крем-брюле: Франция, Англия и Каталония — кто изобрёл и как это доказать', excerpt: 'Тринити-колледж 1879 года. Каталонская рукопись 1324-го. Французское меню XVII века. Три страны, три источника и ни одного бесспорного первенства.', content: body('Крем-брюле история спор', 'creme-brulee-dispute'), category: 'histoire-culinaire', author: 'Taste and Travel, ICE Culinary', readTime: 7, image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800', tags: ['крем-брюле', 'история', 'Каталония', 'Тринити', 'спор'], sourceUrl: 'https://www.ice.edu/blog/creme-brulee-history', date: '2023-05-01', sourceLabel: 'ICE Culinary School' },

  { id: 'patissiers-guild-medieval', title: 'Цехи кондитеров: как Средние века создали профессию — и почему их след есть в CAP Pâtissier', excerpt: 'С 1270 года — устав вафельщиков. С 1440-го — официальный цех pâtissiers. С 1566-го — королевский эдикт Карла IX. История монополий, войн за сахар и того, как гильдии стали государственным экзаменом.', content: body('Цехи кондитеров история Средние века', 'patissiers-guild-medieval'), category: 'histoire-culinaire', author: 'Histoire de la Pâtisserie, Escoffier', readTime: 5, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', tags: ['история', 'гильдии', 'Средние века', 'CAP', 'confiseurs'], sourceUrl: 'https://www.escoffier.edu/blog/baking-pastry/a-brief-history-of-french-pastry/', date: '2023-06-01', sourceLabel: 'Auguste Escoffier School' },

  { id: 'french-classics-origins', title: 'Tarte Tatin, баба-о-ром, éclair: 5 французских десертов с реальной историей создания', excerpt: 'Tarte Tatin — случайная ошибка сестёр. Баба-о-ром — пересохший кугельхопф польского короля. Éclair назвали «молнией», потому что его съедали мгновенно. Пять историй с первоисточниками.', content: body('Tarte Tatin, баба-о-ром, éclair: 5 французских десертов с ре', 'french-classics-origins'), category: 'histoire-culinaire', author: 'Taste and Travel, ICE Culinary School', readTime: 2, image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=800', tags: ['Tarte Tatin', 'éclair', 'мильфей', 'макарон', 'история'], sourceUrl: 'https://tasteandtravel.fr/en/ru-blog-en/the-real-history-of-the-french-pastries-part-one/', date: '2023-07-01', sourceLabel: 'Taste and Travel' },

  { id: 'eclair-histoire-complete', title: 'L\'Éclair: от «pain à la duchesse» до L\'Éclair de Génie — полная история', excerpt: 'В 1742 году его звали «картушем». Карем дал ему начинку. Лионская douille — форму. Кристоф Адам в 2012-м — концепцию. История одного пирожного за 280 лет.', content: body('Эклер история французская кухня', 'eclair-histoire-complete'), category: 'histoire-culinaire', author: 'France Bleu, Inside Lyon, La Bonne Vague, Le Chef, Horsdoeuvre.fr', readTime: 7, image: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=800', tags: ['éclair', 'Карем', 'история', 'Fauchon', 'Кристоф Адам', 'pâte à choux', 'XIX век'], sourceUrl: 'https://www.francebleu.fr/emissions/coup-de-fourchette/l-histoire-des-eclairs-et-des-religieuses-des-patisseries-emblematiques-6218775', date: '2023-08-01', sourceLabel: 'France Bleu' },

  { id: 'millefeuille-histoire', title: 'Мильфей: 729 слоёв, миф о Наполеоне и Seugnot 1867', excerpt: 'Ла Варен описал его в 1651-м. Руже опубликовал рецепт в 1806-м — и его забыли. Только Seugnot в 1867-м превратил его в парижский феномен. А «Наполеон» — просто ложная легенда.', content: body('Мильфей история Наполеон французская пâтиссери', 'millefeuille-histoire'), category: 'histoire-culinaire', author: 'BoulangerieNet, Luxury Place, france.fr, La Bête à Pain', readTime: 5, image: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=800', tags: ['мильфей', 'Наполеон', 'история', 'Seugnot', 'pâte feuilletée', 'XVII век'], sourceUrl: 'https://www.boulangerienet.fr/bn/viewtopic.php?t=47393', date: '2026-01-10', sourceLabel: 'BoulangerieNet' },

  { id: 'opera-gateau-histoire', title: 'Гато Опера: Dalloyau против Lenôtre — 30 лет войны за прямоугольник', excerpt: 'В 1955-м Сириак Гавийон создал прямоугольный торт без алкоголя и с минимумом сахара. Жена назвала его «Опера» в честь балерин. Через пять лет Гастон Лёнотр заявил, что изобрёл его сам. Le Monde рассудил в 1988-м.', content: body('Гато Опера история Dalloyau Lenôtre спор', 'opera-gateau-histoire'), category: 'histoire-culinaire', author: 'Europe1, Sortir à Paris, Wikipedia, Les Noces de Jeannette', readTime: 5, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800', tags: ['Опера', 'Dalloyau', 'Lenôtre', 'история', 'Гавийон', 'бисквит Жоконд'], sourceUrl: 'https://www.sortiraparis.com/en/where-to-eat-in-paris/brunch-cafe-tea-time/articles/260130-history-of-french-pastry-opera', date: '2026-01-20', sourceLabel: 'Sortir à Paris' },

  { id: 'buche-noel-histoire', title: 'Бюш де Ноэль: от языческого бревна в очаге до ежегодного конкурса шефов', excerpt: 'Первое упоминание — 1184 год. Язычество, солнцестояние, ритуал бенедикции. В XIX веке печи вытеснили камины — и кондитеры придумали съедобную замену. Имя изобретателя до сих пор неизвестно.', content: body('Бюш де Ноэль история ритуал рождество', 'buche-noel-histoire'), category: 'histoire-culinaire', author: 'Wikpédia, Mon Grand Est, Aventure Culinaire, Cité du Chocolat Valrhona', readTime: 5, image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800', tags: ['бюш', 'рождество', 'история', 'ритуал', 'XIX век', 'традиция'], sourceUrl: 'https://fr.wikipedia.org/wiki/B%C3%BBche_de_No%C3%ABl', date: '2026-02-01', sourceLabel: 'Wikpédia' },

  { id: 'histoire-tartes-francaises', title: 'История французских тартов: дариол XIII века, Бурдалу и тарт Татен из ошибки', excerpt: 'От кремовой тарталетки из средневекового Амьена до тарта из Ламот-Бёврон, перевёрнутого случайно. Семь столетий эволюции французского тарта — с именами, адресами и документами.', content: body('История французских тартов средние века дариол Татен Бурдалу', 'histoire-tartes-francaises'), category: 'histoire-culinaire', author: 'Wikpédia, Patissiers.pro, 196 Flavors, Tendances-Food', readTime: 5, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800', tags: ['тарт', 'история', 'дариол', 'Татен', 'Бурдалу', 'фланже', 'XIII век'], sourceUrl: 'https://fr.wikipedia.org/wiki/Flan_p%C3%A2tissier', date: '2026-02-15', sourceLabel: 'Wikpédia' },

  { id: 'carnaval-culinaire-histoire', title: 'Carnaval culinaire: как Карем превратил кухню XIX века в политический театр', excerpt: 'Сахарные египетские пирамиды на банкете. Кухня Талейрана как инструмент Венского конгресса. Pièces montées высотой в метр. Эпоха, когда повар был архитектором — и почему Эскоффье её закончил.', content: body('Карем пьесы монтес история XIX кулинарный театр Талейран', 'carnaval-culinaire-histoire'), category: 'histoire-culinaire', author: 'La Bête à Pain, Escoffier School, France Gastronomique', readTime: 6, image: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800', tags: ['Карем', 'история', 'XIX век', 'Талейран', 'pièces montées', 'carnaval', 'театр'], sourceUrl: 'https://labeteapain.com/histoire-de-la-patisserie/', date: '2026-03-01', sourceLabel: 'La Bête à Pain' },

  { id: 'canele-bordeaux-histoire', title: 'Канеле: монахини, вино и медный моул — как Бордо изобрело самое загадочное пирожное Франции', excerpt: 'Сёстры Анонсиад собирали муку с причалов и желтки — от виноделен. Ром и ваниль добавил безымянный мастер начала XX века. А в 1985-м один «n» убрали официально. История продукта, у которого нет ни одного доказанного факта — кроме вкуса.', content: body('Канеле Бордо история монахини вино медный моул', 'canele-bordeaux-histoire'), category: 'histoire-culinaire', author: 'La Toque Cuivrée, Wikipédia, La Bête à Pain, La Bonne Vague, Baillardran', readTime: 6, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', tags: ['канеле', 'Бордо', 'история', 'монахини', 'ром', 'ваниль', 'медный моул', 'конфрерия'], sourceUrl: 'https://www.la-toque-cuivree.fr/histoire-du-canele/', date: '2026-03-15', sourceLabel: 'La Toque Cuivrée' },

  { id: 'financier-histoire', title: 'Финансье: как монахини Нанси накормили парижских биржевиков — и создали форму золотого слитка', excerpt: 'В XVII веке это пекли визитандинки, чтобы не тратить яичные белки от живописи. В 1890-м кондитер Ласне придал тесту форму lingot d\'or — и продавал у стен Бурсы. История маленького гато с большими деньгами.', content: body('Финансье история Нанси визитандинки Ласне Бурса парижская кухня', 'financier-histoire'), category: 'histoire-culinaire', author: 'Wikipédia, La Bête à Pain, La Bonne Vague, ICI France, Monsieur de France', readTime: 5, image: 'https://images.unsplash.com/photo-1604869515882-4d10fa4b0492?w=800', tags: ['финансье', 'история', 'Нанси', 'Бурса', 'визитандинки', 'бёр нуазет', 'миндаль'], sourceUrl: 'https://fr.wikipedia.org/wiki/Financier_(p%C3%A2tisserie)', date: '2026-04-01', sourceLabel: 'Wikipédia' },

  // ── РЕЦЕПТЫ ──────────────────────────────────────────────────────────────────

  {
    id: 'recipe-tarte-citron-meringuee',
    title: 'Тарт о ситрон мерингé — тарт с лимонным кремом и итальянской меренгой',
    excerpt: 'Классика французской кондитерской из Meilleur du Chef: хрустящее миндальное тесто, крем из лимона на 82°C и шёлковая меренга, приготовленная при 118°C. Точные пропорции и диагностика ошибок.',
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Philippe',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1501963422762-3d89bd989eb3?w=800',
    tags: ['рецепт', 'тарт', 'лимон', 'меренга', 'pâte sablée'],
    sourceUrl: 'https://www.meilleurduchef.com/fr/recette/tartelette-citron-meringuee.html',
    sourceLabel: 'Meilleur du Chef',
    date: '2025-08-15',
    content: body('Тарт о ситрон мерингé — тарт с лимонным кремом и итальянской', 'recipe-tarte-citron-meringuee')
  },

  {
    id: 'recipe-paris-brest-classique',
    title: 'Paris-Brest: заварное тесто, пралиновый крем-муслин и хрустящие амандины',
    excerpt: 'Рецепт по Chef Simon и Meilleur du Chef: pâte à choux на молоке и воде, crème mousseline с пралине из фундука, карамелизованные миндальные лепестки. С вариантом Контисини — прячем пралине внутрь.',
    category: 'recipes',
    author: 'Chef Simon, Meilleur du Chef',
    readTime: 9,
    image: 'https://images.unsplash.com/photo-1616299908714-e30073a84ca7?w=800',
    tags: ['рецепт', 'Paris-Brest', 'choux', 'пралине', 'крем-муслин'],
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/paris-brest--4',
    sourceLabel: 'Chef Simon',
    date: '2025-09-20',
    content: body('Paris-Brest: заварное тесто, пралиновый крем-муслин и хрустя', 'recipe-paris-brest-classique')
  },

  // ── MERCOTTE ────────────────────────────────────────────────────────────────
  { id: 'mercotte-tarte-citron', title: 'Меркотт: тарт с лимоном — кислота, баланс и идеальная меренга', excerpt: 'Разбор классического лимонного тарта: песочное тесто, crème citron без желатина и итальянская меренга с горелкой.', content: body('Меркотт тарт лимон', 'mercotte-tarte-citron'), category: 'mercotte', author: 'Mercotte, CAP pastry notes', readTime: 6, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d5b1c6?w=800', tags: ['тарт', 'лимон', 'меренга', 'крем'], sourceUrl: 'https://www.mercotte.fr/category/les-bases/', date: '2026-04-10', sourceLabel: 'Mercotte' },
  { id: 'mercotte-entremets-system', title: 'Меркотт: энтреме от А до Я — бисквит, мусс, гляссаж, сборка', excerpt: 'Система подготовки к CAP Pâtisserie и домашним энтреме: вкладыш, кольцо, температура зеркальной глазури.', content: body('Меркотт энтреме система', 'mercotte-entremets-system'), category: 'mercotte', author: 'Mercotte, Elle à Table, CAP', readTime: 7, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', tags: ['энтреме', 'мусс', 'гляссаж', 'CAP'], sourceUrl: 'https://www.mercotte.fr/category/entremets/', date: '2026-04-15', sourceLabel: 'Mercotte' },

  // ── JACQUES GENIN ────────────────────────────────────────────────────────────
  { id: 'genin-caramel-philosophy', title: 'Жак Жени: философия карамели — горечь, соль, время и терруар', excerpt: 'Как человек без диплома создал лучшую карамель Парижа: почему карамель нельзя спешить и что значит «карамель au beurre salé de Guérande».', content: body('Жак Жени карамель', 'genin-caramel-philosophy'), category: 'jacques-genin', author: 'Paris by Mouth, Food & Sens', readTime: 6, image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800', tags: ['карамель', 'соль', 'Guérande', 'терруар'], sourceUrl: 'https://parisbymouth.com/our-guide-to-paris-jacques-genin/', date: '2026-04-20', sourceLabel: 'Paris by Mouth' },
  { id: 'genin-ganache-craft', title: 'Жак Жени и ганаш: шоколад как продукт терруара, а не бренда', excerpt: 'Как Жени выбирает какао-бобы, работает с криолло из Мадагаскара и почему в его ганаше нет лишних ингредиентов.', content: body('Жак Жени ганаш терруар', 'genin-ganache-craft'), category: 'jacques-genin', author: 'Food & Sens, Newtable', readTime: 5, image: 'https://images.unsplash.com/photo-1605811804993-b83e50d69cb2?w=800', tags: ['ганаш', 'шоколад', 'терруар', 'криолло'], sourceUrl: 'https://foodandsens.com/made-by-f-and-s/chefs-on-parle-de-vous/jacques-genin-patissier-a-appris-aupres-chefs-de-cuisine/', date: '2026-04-25', sourceLabel: 'Food & Sens' },

  // ── CYRIL LIGNAC ─────────────────────────────────────────────────────────────
  { id: 'lignac-far-breton', title: 'Сириль Линьяк: фар бретон — деревенский десерт с точностью haute pâtisserie', excerpt: 'Учебный разбор фар бретон: соотношение яиц, сливок и муки, сухофрукты, температура и зачем нужен высокий бортик формы.', content: body('Линьяк фар бретон', 'lignac-far-breton'), category: 'cyril-lignac', author: 'Cyril Lignac, Cuisine Actuelle', readTime: 5, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800', tags: ['фар бретон', 'Бретань', 'яйца', 'простота'], sourceUrl: 'https://www.cuisineactuelle.fr/recettes/recettes-de-chefs/far-breton-au-pruneaux-de-cyril-lignac-53044', date: '2026-04-28', sourceLabel: 'Cuisine Actuelle' },
  { id: 'lignac-kouign-amann', title: 'Сириль Линьяк и Kouign-Amann: карамельная корка, слоёность и соль Бретани', excerpt: 'Полный технологический разбор бретонской классики: дрожжевое тесто, масло, сахар, тройной тур и финальная карамелизация в форме.', content: body('Линьяк куинь-аман', 'lignac-kouign-amann'), category: 'cyril-lignac', author: 'Cyril Lignac, David Lebovitz', readTime: 6, image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800', tags: ['kouign-amann', 'Бретань', 'карамель', 'слоёность'], sourceUrl: 'https://www.davidlebovitz.com/kouign-amann/', date: '2026-04-29', sourceLabel: 'David Lebovitz' },

  // ── CLAIRE HEITZLER ─────────────────────────────────────────────────────────
  { id: 'heitzler-less-sugar', title: 'Клер Эйцлер: меньше сахара — больше вкуса. Как убрать 30% без потери удовольствия', excerpt: 'Практический разбор методологии: чем компенсировать сладость, как работает кислота, и почему горечь — это не враг.', content: body('Эйцлер меньше сахара', 'heitzler-less-sugar'), category: 'claire-heitzler', author: 'Pastry Arts Magazine, Valrhona', readTime: 6, image: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=800', tags: ['сахар', 'баланс', 'кислота', 'горечь'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2026-04-30', sourceLabel: 'Pastry Arts Magazine' },
  { id: 'heitzler-floral-palette', title: 'Клер Эйцлер: цветочная палитра — жасмин, фиалка, роза в современном десерте', excerpt: 'Как работать с цветочными ароматами без синтетики: натуральные экстракты, свежие лепестки, дистилляция и точный баланс.', content: body('Эйцлер цветочная палитра', 'heitzler-floral-palette'), category: 'claire-heitzler', author: 'Madame Figaro, Pastry Arts Magazine', readTime: 5, image: 'https://images.unsplash.com/photo-1461009312844-e6e51ee8c1eb?w=800', tags: ['цветы', 'жасмин', 'роза', 'аромат'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2026-05-01', sourceLabel: 'Madame Figaro' },

  // ── CHRISTOPHE FELDER ────────────────────────────────────────────────────────
  { id: 'felder-fraisier', title: 'Фрезье Фельдера: классика, которую надо понять до автоматизма', excerpt: 'Пошаговый учебный разбор знакового торта: génoise, crème mousseline, сироп понч, клубника и финальная отделка марципаном.', content: body('Фельдер фрезье', 'felder-fraisier'), category: 'christophe-felder', author: 'Christophe Felder, Patisserie book', readTime: 7, image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=800', tags: ['фрезье', 'генуаз', 'муссилин', 'клубника'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2026-05-02', sourceLabel: 'Patisserie — Felder' },
  { id: 'felder-biscuit-joconde', title: 'Бисквит «Жоконда» по Фельдеру: структура, техника и рулет Opera', excerpt: 'Почему бисквит «Жоконда» — это не просто тесто, а архитектурный элемент энтреме: миндаль, протеин белка и рулет Опера.', content: body('Фельдер бисквит жоконда', 'felder-biscuit-joconde'), category: 'christophe-felder', author: 'Christophe Felder, Patisserie book', readTime: 6, image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800', tags: ['жоконда', 'Опера', 'бисквит', 'миндаль'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2026-05-03', sourceLabel: 'Patisserie — Felder' },

  // ── NICOLAS PACIELLO ─────────────────────────────────────────────────────────
  { id: 'paciello-flan-parisien', title: 'Николя Пачелло: flan parisien — философия простоты и техника без права на ошибку', excerpt: 'Почему главный кондитер Plaza Athénée посвятил парижскому флану отдельную страницу в меню: тесто, крем, температура.', content: body('Пачелло флан парижский', 'paciello-flan-parisien'), category: 'nicolas-paciello', author: 'Frenchefs, Journal des Femmes', readTime: 6, image: 'https://images.unsplash.com/photo-1454944338482-a69bb95894af?w=800', tags: ['флан', 'Париж', 'простота', 'Plaza Athénée'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2026-05-04', sourceLabel: 'Frenchefs' },
  { id: 'paciello-praline-art', title: 'Пачелло: пралине как художественный жест — ореховая база, текстура и точность', excerpt: 'Как шеф-кондитер CinqSens работает с пралине: три сорта фундука, карамельные степени, гранулометрия и правило «вкус из сырья».', content: body('Пачелло пралине искусство', 'paciello-praline-art'), category: 'nicolas-paciello', author: 'Frenchefs, So Good Magazine', readTime: 5, image: 'https://images.unsplash.com/photo-1592459937017-48d8e50a39d8?w=800', tags: ['пралине', 'фундук', 'карамель', 'CinqSens'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2025-01-15', sourceLabel: 'So Good Magazine' },

  // ── НОВЫЕ СТАТЬИ (до 4 в каждой категории) ────────────────────────────────

  { id: 'michalak-biography', title: 'Кристоф Мишалак: чемпион мира, Plaza Athénée и принцип щедрого десерта', excerpt: 'Биография: Санлис, CAP, 11 лет в Plaza Athénée, победа на Coupe du Monde 2005 и открытие Masterclass.', content: body('Мишалак биография', 'michalak-biography'), category: 'christophe-michalak', author: 'Le Figaro, Reporter Gourmet', readTime: 5, image: 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=800', tags: ['биография', 'чемпион мира', 'Plaza Athénée', 'Fantastik'], sourceUrl: 'https://reportergourmet.com/en/chef/782-christophe-michalak', date: '2025-01-22', sourceLabel: 'Reporter Gourmet' },

  { id: 'ansel-cronut', title: 'Ансель после Cronut: токийская лаборатория, концепция невозможного десерта и эволюция', excerpt: 'Что Доминик Ансель придумал после того, как Cronut стал иконой: японский минимализм, физика мороженого и теория «мгновения» в современной пекарне.', content: body('Ансель Cronut', 'ansel-cronut'), category: 'dominique-ansel', author: 'The New York Times, Food52, Dominique Ansel Bakery', readTime: 6, image: 'https://images.unsplash.com/photo-1484723091739-30990ca73ef3?w=800', tags: ['Токио', 'инновация', 'концепция', 'эволюция'], sourceUrl: 'https://dominiqueanselbakery.com', date: '2025-02-01', sourceLabel: 'Dominique Ansel Bakery' },

  { id: 'perret-madeleine', title: 'Мадлен Перре: beurre noisette, лимонная глазурь и Пруст на витрине Ritz', excerpt: 'Технологический разбор самой знаменитой мадлен Парижа: коричневое масло, мёд акации, температурный шок и 7 евро за штуку.', content: body('Перре мадлен', 'perret-madeleine'), category: 'francois-perret', author: 'Ritz Paris, Madame Figaro', readTime: 5, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800', tags: ['мадлен', 'beurre noisette', 'Пруст', 'Ritz'], sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', date: '2025-02-10', sourceLabel: 'Ritz Paris Le Comptoir' },

  { id: 'metayer-biography', title: "Нина Метайе: FERRANDI, Ladurée, World's Best Pastry Chef 2023", excerpt: 'Биография лучшего кондитера мира: от Ниора до Валенсии — через трёхзвёздочный Реймс, Fauchon, Le Meurice и 14 лет найма.', content: body('Метайе биография', 'metayer-biography'), category: 'nina-metayer', author: "World's 50 Best, Le Monde", readTime: 6, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800', tags: ['биография', 'World\'s Best', 'FERRANDI', 'Ladurée'], sourceUrl: 'https://www.theworlds50best.com/stories/News/nina-metayer-worlds-best-pastry-chef-2023.html', date: '2025-02-20', sourceLabel: "World's 50 Best" },

  { id: 'conticini-paris-brest', title: 'Контисини: верин, эмоция и La Table d\'Anvers — революция, которую не заметили', excerpt: 'Как в 1994 году Контисини переизобрёл формат десерта в стеклянном стакане, заложил философию «вкусовой памяти» и сформировал целое поколение французских кондитеров.', content: body('Контисини Париж-Брест', 'conticini-paris-brest'), category: 'philippe-conticini', author: 'Le Monde, Gault&Millau, Omnivore', readTime: 7, image: 'https://images.unsplash.com/photo-1619954388188-de1bbb4ef40c?w=800', tags: ['верин', 'La Table d\'Anvers', 'философия', 'эмоция', 'история'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2025-03-01', sourceLabel: 'Gault&Millau' },

  { id: 'recipe-canele', title: 'Канеле де Бордо: медные формы, пчелиный воск и двухэтапная выпечка', excerpt: 'Полная технологическая карта бордоского канеле: выдержка теста 48 часов, температурный шок, почти горелая корочка и заварная середина.', content: body('Канеле Бордо', 'recipe-canele'), category: 'recipes', author: 'Confrérie du Canelé, Baillardran', readTime: 6, image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800', tags: ['канеле', 'Бордо', 'ром', 'медные формы'], sourceUrl: 'https://www.baillardran.com/en/canele', date: '2025-03-10', sourceLabel: 'Baillardran' },

  { id: 'couvreur-biography', title: 'Янн Куврер: Реймс, Ferrandi, мильфей à la minute и улица Мартир', excerpt: 'Биография: от кондитерского ученика в Реймсе до шефа Le Meurice и владельца трёх бутиков. История о feuilletage и независимости.', content: body('Куврер биография', 'couvreur-biography'), category: 'yann-couvreur', author: 'Gault&Millau, Le Figaro', readTime: 5, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800', tags: ['биография', 'мильфей', 'feuilletage', 'Ferrandi'], sourceUrl: 'https://fr.gaultmillau.com/en/chefs/yann-couvreur', date: '2025-03-20', sourceLabel: 'Gault&Millau' },


  // ── АУТЕНТИЧНЫЕ ФРАНЦУЗСКИЕ РЕЦЕПТЫ ──────────────────────────────────────

  { id: 'recipe-tarte-tatin', title: 'Классический Тарт Татен (Tarte Tatin): Аутентичный французский рецепт с карамелью', excerpt: 'Полная технологическая карта классической тарт Татен: сухой карамель, двухэтапная выпечка, демуляж без потерь. История из Ламотт-Бёврон, которая стала символом французского десерта.', content: body('Тарт Татен', 'recipe-tarte-tatin'), category: 'recipes', author: 'Meilleur du Chef, Confrérie du Tarte Tatin', readTime: 9, image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800', tags: ['тарт татен', 'яблоки', 'карамель', 'pâte brisée', 'Солонь'], date: '2026-05-05', sourceUrl: 'https://www.meilleurduchef.com/en/recipe/tarte-tatin-apple.html', sourceLabel: 'Meilleur du Chef' },

  { id: 'recipe-creme-brulee', title: 'Идеальный Крем-брюле: Классический французский рецепт с ванилью и карамельной корочкой', excerpt: 'Исчерпывающий рецепт классического crème brûlée: 100°C, 55 минут, соотношение 5 желтков на 500 мл сливок, chalumeau и правило 90 секунд до подачи.', content: body('Крем-брюле ваниль', 'recipe-creme-brulee'), category: 'recipes', author: 'Rians, Atelier des Chefs', readTime: 8, image: 'https://images.unsplash.com/photo-1588515724527-074a7a56616c?w=800', tags: ['крем-брюле', 'ваниль bourbon', 'бань-мари', 'chalumeau', 'желтки'], date: '2026-05-05', sourceUrl: 'https://rians.com/fr/recettes/creme-brulee-la-recette-authentique-rians/', sourceLabel: 'Rians — Recette Authentique' },

  { id: 'recipe-clafoutis-cerises', title: 'Клафути с вишней: лимузенский рецепт с kirsch и косточками', excerpt: 'Аутентичный clafoutis aux cerises из Лимузена: почему косточки не вынимают, двухтемпературная выпечка 210→180°C и рецепт Ladurée с цедрой лимона.', content: body('Клафути вишня', 'recipe-clafoutis-cerises'), category: 'recipes', author: 'Académie du Goût (Alain Ducasse), Ladurée Sucré', readTime: 8, image: 'https://images.unsplash.com/photo-1535912259830-92ec2c73e0c9?w=800', tags: ['клафути', 'вишня', 'Лимузен', 'kirsch', 'Ladurée'], date: '2026-05-05', sourceUrl: 'https://www.academiedugout.fr/recettes/clafoutis-aux-cerises_10375_2', sourceLabel: 'Académie du Goût — Alain Ducasse' },

  { id: 'recipe-souffle-chocolat', title: 'Шоколадное суфле: физика горба, меренга и правило 90 секунд', excerpt: 'Полный разбор soufflé au chocolat: смазка вертикально, трик chapeau de cuisinier, метод crème pâtissière для ресторанного суфле и почему не надо бояться открывать духовку.', content: body('Шоколадное суфле', 'recipe-souffle-chocolat'), category: 'recipes', author: 'Christophe Michalak, Plaza Athénée technique', readTime: 9, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800', tags: ['суфле', 'шоколад', 'меренга', 'Valrhona', 'Plaza Athénée'], date: '2026-05-05', sourceUrl: 'https://mypastryclass.com/blogs/articles/', sourceLabel: 'PastryClass' },

  { id: 'recipe-madeleines', title: 'Мадлен: beurre noisette, температурный шок и горб — техника Ritz Paris', excerpt: 'Пошаговый рецепт мадлен с культовым горбом: охлаждение теста ночь, духовка 210°C, форма холодная. История Пруста, техника Ritz Paris и полная диагностика плоских мадлен.', content: body('Мадлен', 'recipe-madeleines'), category: 'recipes', author: 'François Perret (Ritz Paris), Madame Figaro', readTime: 8, image: 'https://images.unsplash.com/photo-1548940740-204726a19be3?w=800', tags: ['мадлен', 'beurre noisette', 'горб', 'Ritz Paris', 'Пруст'], date: '2026-05-05', sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', sourceLabel: 'Ritz Paris — François Perret' },

  // ── Chiffres Gourmands ────────────────────────────────────────────────────
  {
    id: 'chiffres-marche-15mlrd',
    title: '15 миллиардов евро и 12 миллионов круассанов в день: анатомия французской кондитерской',
    excerpt: 'Из чего состоит экономика французской пэтисери: 44 000 заведений, средний чек 6 €, десерт №1 — lemon tart, и почему хлеб умер, а десерты расцвели. Данные CNBPF, INSEE, IFOP.',
    content: body('Рынок французской кондитерской 15 млрд', 'chiffres-marche-15mlrd'),
    category: 'chiffres-gourmands',
    author: 'CNBPF, INSEE, IFOP, Observatoire Fiducial, EPSIMAS',
    readTime: 9,
    image: 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?w=800',
    tags: ['рынок', 'экономика', 'статистика', '15 млрд', 'tarte au citron', 'круассан'],
    date: '2026-05-05',
    sourceUrl: 'https://www.boulangerie.org/',
    sourceLabel: 'Confédération Nationale Boulangerie-Pâtisserie',
  },
  {
    id: 'chiffres-macarons-laduree-herme',
    title: 'Империи макаронов: как Ladurée и Pierre Hermé превратили миндальное печенье в 100 млн €',
    excerpt: '38,5 миллиона макаронов в год, оборот Ladurée и Hermé по 100 млн € каждый, маржа 50–60% и экономика «доступного люкса». Реальные цифры главных кондитерских домов Франции.',
    content: body('Империи макаронов Ladurée Hermé', 'chiffres-macarons-laduree-herme'),
    category: 'chiffres-gourmands',
    author: 'Planetoscope, En-Contact, FashionNetwork, Glitz.paris',
    readTime: 8,
    image: 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?w=800',
    tags: ['макароны', 'Ladurée', 'Pierre Hermé', 'экономика', 'маржа', 'люкс'],
    date: '2026-05-05',
    sourceUrl: 'https://www.planetoscope.com/',
    sourceLabel: 'Planetoscope — Statistiques mondiales',
  },
  {
    id: 'chiffres-education-mof',
    title: 'От ученика до MOF: полная экономика французского кондитерского образования',
    excerpt: '30 000 учеников, 55 000 € за Grand Diplôme, 133 Meilleurs Ouvriers de France и дефицит в 25 000 специалистов. Как работает самая престижная система подготовки кондитеров в мире: от бесплатного CAP до элитного Ferrandi и Le Cordon Bleu.',
    content: body('Образование кондитеров MOF', 'chiffres-education-mof'),
    category: 'chiffres-gourmands',
    author: "Observatoire des Métiers de l'Alimentation, Le Cordon Bleu, Ferrandi Paris, ANMOF",
    readTime: 12,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    tags: ['образование', 'MOF', 'Le Cordon Bleu', 'Ferrandi', 'CAP', 'apprentissage', 'карьера'],
    date: '2026-05-06',
    sourceUrl: 'https://www.observatoire-metiers-alimentation.fr/',
    sourceLabel: "Observatoire des Métiers de l'Alimentation",
  },
  {
    id: 'chiffres-luxury-desserts',
    title: "Топ-15 самых дорогих десертов Франции 2026: от 18 € за trompe-l'œil до 25 000 € за showpiece",
    excerpt: 'Cédric Grolet, Pierre Hermé, Maxime Frédéric и другие. Маржа 58–74%, рост сегмента +19% в год, 68% покупок через Instagram. Полная экономика, психология и география французского сладкого люкса 2026 года.',
    content: body('Топ-15 дорогих десертов Франции', 'chiffres-luxury-desserts'),
    category: 'chiffres-gourmands',
    author: "Euromonitor International, Gault&Millau, INSEE, Observatoire des Métiers de l'Alimentation",
    readTime: 10,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800',
    tags: ['люкс', "trompe-l'œil", 'Cédric Grolet', 'showpiece', 'palace', 'маржа', 'цены'],
    date: '2026-05-06',
    sourceUrl: 'https://www.gaultmillau.com/',
    sourceLabel: 'Gault&Millau — Pastry Chef of the Year 2026',
  },
  {
    id: 'chiffres-anatomie-gateau',
    title: 'Анатомия французского торта: entremets, tartes и gâteaux à partager',
    excerpt: 'Что французы называют тортом и почему мастика не прижилась. Золотое сечение entremets: mousse, biscuit, insert, croustillant, glaçage. Рейтинг любимых десертов (93% покупают хотя бы иногда), архитектура вкуса и 6 концептов для вашего сайта.',
    content: body('Анатомия французского торта', 'chiffres-anatomie-gateau'),
    category: 'chiffres-gourmands',
    author: 'INSEE, FranceAgriMer, OpinionWay, Salon de la Pâtisserie',
    readTime: 11,
    image: 'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800',
    tags: ['entremets', 'tarte', 'fraisier', 'архитектура', 'текстуры', 'статистика', 'рецепты'],
    date: '2026-05-06',
    sourceUrl: 'https://www.salondelapatisserie.com/',
    sourceLabel: 'Salon de la Pâtisserie — OpinionWay 2023',
  },

  { 
    id: 'recipe-macarons-herme', 
    title: 'Рецепт макарон (Macarons) от Пьера Эрме: Итальянская меренга и секреты идеальной «юбочки»', 
    excerpt: 'Полный технический гид по макарон от "Пикассо кондитерского искусства". Разбор макаронажа, состаривания белков и температурного режима.', 
    content: body('Макароны Эрме', 'recipe-macarons-herme'),
    category: 'recipes', 
    author: 'Pierre Hermé, Macaron', 
    readTime: 12, 
    image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800', 
    tags: ['макарон', 'Пьер Эрме', 'итальянская меренга', 'macaronage'], 
    date: '2026-05-07', 
    sourceLabel: 'PH10',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT14M', yield: '40 половинок',
      ingredients: ['300г миндальной муки', '300г сахарной пудры', '110г + 110г состаренных яичных белков', '300г сахара', '75г воды']
    },
    faq: [
      { question: 'Почему у макарон нет юбочки?', answer: 'Юбочка не образуется, если вы не подсушили отсаженные макарон перед выпечкой (croutage), или если температура в духовке слишком низкая (ниже 150°C).' },
      { question: 'Почему макарон пустые внутри?', answer: 'Частая причина — перевзбитая меренга или слишком агрессивный макаронаж, который разрушил структуру белка.' }
    ]
  },
  { 
    id: 'recipe-croissant-poilane', 
    title: 'Французские круассаны в домашних условиях: Рецепт слоеного теста и техника ламинирования', 
    excerpt: 'Анатомия идеального французского круассана. Какое сливочное масло выбрать, как делать détrempe и почему температура на кухне важнее рецепта.', 
    content: body('Круассаны Пуалан', 'recipe-croissant-poilane'),
    category: 'recipes', 
    author: 'Tartine, Ferrandi', 
    readTime: 15, 
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', 
    tags: ['круассаны', 'слоеное тесто', 'ламинирование', 'завтрак'], 
    date: '2026-05-08', 
    recipeData: {
      prepTime: 'PT12H', cookTime: 'PT20M', yield: '10 круассанов',
      ingredients: ['500г муки T45', '10г соли', '50г сахара', '20г свежих дрожжей', '140г воды', '140г молока', '250г сухого сливочного масла (beurre sec) 84%']
    }
  },
  { 
    id: 'recipe-eclairs-adam', 
    title: 'Секреты идеальных эклеров: Заварное тесто без трещин и хрустящий кракелин', 
    excerpt: 'Технология Кристофа Адама: физика заварного теста (pâte à choux), зачем нужен кракелин и полный траблшутинг — почему эклеры опадают или рвутся в духовке.', 
    content: body('Эклеры Адама', 'recipe-eclairs-adam'),
    category: 'recipes', 
    author: 'Christophe Adam, L\'Éclair de Génie', 
    readTime: 12, 
    image: 'https://images.unsplash.com/photo-1601379321458-71fea421bf28?w=800', 
    tags: ['эклеры', 'заварное тесто', 'кракелин', 'Christophe Adam'], 
    date: '2026-05-10',
    recipeData: {
      prepTime: 'PT45M', cookTime: 'PT40M', yield: '15 эклеров',
      ingredients: ['125г воды', '125г молока', '110г сливочного масла', '150г муки T55', '250г яиц', '100г масла для кракелина', '120г коричневого сахара']
    },
    faq: [
      { question: 'Почему эклеры рвутся по бокам?', answer: 'Чаще всего из-за слишком горячей духовки в начале выпечки или из-за недостатка влаги в тесте (мало яиц).' },
      { question: 'Почему эклеры опадают после выпечки?', answer: 'Они не пропеклись внутри. Структура осталась сырой и опала под весом пара при остывании.' }
    ]
  },
  { 
    id: 'recipe-opera-dalloyau', 
    title: 'Торт Опера (L\'Opéra): Архитектура французской классики и кофейный масляный крем', 
    excerpt: 'Пошаговая сборка главного парижского торта: миндальный бисквит Джоконда, масляный крем на pâte à bombe и правило "идеальных 3 сантиметров".', 
    content: body('Опера Даллуайо', 'recipe-opera-dalloyau'),
    category: 'recipes', 
    author: 'Dalloyau, Gaston Lenôtre', 
    readTime: 15, 
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', 
    tags: ['торт опера', 'бисквит джоконда', 'масляный крем', 'кофе'], 
    date: '2026-05-11',
    recipeData: {
      prepTime: 'PT2H', cookTime: 'PT15M', yield: '1 торт (10 порций)',
      ingredients: ['150г миндальной муки', '200г яиц', '350г сливочного масла', 'Кофейный экстракт', 'Темный шоколад 70%']
    }
  },
  { 
    id: 'recipe-millefeuille-inverser', 
    title: 'Классический Мильфей: Инвертированное слоеное тесто и секрет карамелизации слоев', 
    excerpt: 'Философия хруста от Филиппа Контисини. Зачем выворачивать тесто наизнанку (маслом наружу), как печь коржи между двумя противнями и рецепт крема дипломат.', 
    content: body('Мильфей Контисини', 'recipe-millefeuille-inverser'),
    category: 'recipes', 
    author: 'Philippe Conticini, François Perret', 
    readTime: 14, 
    image: 'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800', 
    tags: ['мильфей', 'слоеное тесто', 'крем дипломат', 'инвертированное тесто'], 
    date: '2026-05-12',
    recipeData: {
      prepTime: 'PT14H', cookTime: 'PT40M', yield: '6 порций',
      ingredients: ['375г сухого масла', '500г муки T55', '500г молока', 'Стручок ванили', '250г сливок 35%']
    }
  },

  { 
    id: 'recipe-baba-rhum-alain-ducasse', 
    title: 'Ром-баба по рецепту Алена Дюкасса: Идеальное бриошь-тесто и сироп', 
    excerpt: 'Один из самых известных десертов в трехзвездочных ресторанах Дюкасса. Техника замеса теста саварен, идеальная температура сиропа и правильная подача с шантильи.', 
    content: body('Баба Дюкасс', 'recipe-baba-rhum-alain-ducasse'),
    category: 'recipes', 
    author: 'Alain Ducasse', 
    readTime: 18, 
    image: 'https://images.unsplash.com/photo-1621236058348-18e5e8e3d64b?w=800', 
    tags: ['ром-баба', 'Ален Дюкасс', 'саварен', 'сироп', 'бриошь'], 
    date: '2026-05-15',
    recipeData: {
      prepTime: 'PT1H30M', cookTime: 'PT25M', yield: '8 порций',
      ingredients: ['250г муки T45', '15г свежих дрожжей', '100г молока', '3 яйца (150г)', '80г сливочного масла', '750г воды (для сиропа)', '400г сахара', '150мл выдержанного рома (Dark Rum)']
    },
    faq: [
      { question: 'Почему баба получилась плотной и не впитывает сироп?', answer: 'Вы недостаточно вымесили тесто (не развили глютеновое окно) или пересушили его в духовке. Тесто должно быть очень эластичным и пористым, как губка.' },
      { question: 'Какой температуры должен быть сироп при пропитке?', answer: 'Золотое правило: горячая баба в холодный сироп ИЛИ холодная (подсушенная) баба в горячий сироп (60°C). Дюкасс предпочитает второй метод: он сушит выпечку день, а потом купает в горячем сиропе.' }
    ]
  },
  { 
    id: 'recipe-tarte-citron-grolet', 
    title: 'Тарт о Ситрон Седрика Гроле: Запеченный лимонный крем и цукаты', 
    excerpt: 'Никакого обычного лимонного курда. Гроле запекает крем прямо в тарталетке, добавляет лимонное конфи и меренгу, обожженную без сахара.', 
    content: body('Тарт Лимон Гроле', 'recipe-tarte-citron-grolet'),
    category: 'recipes', 
    author: 'Cédric Grolet, Le Meurice', 
    readTime: 16, 
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800', 
    tags: ['тарт', 'лимон', 'Седрик Гроле', 'pâte sucrée'], 
    date: '2026-05-16',
    recipeData: {
      prepTime: 'PT3H', cookTime: 'PT35M', yield: '1 тарт 18см',
      ingredients: ['150г сливочного масла', '90г сахарной пудры', '30г миндальной муки', '250г муки T55', '50г яиц (для песочного теста)', '150г лимонного сока', '150г сахара', '150г яиц (для крема)']
    },
    faq: [
      { question: 'Почему песочное тесто сползает по бортикам при выпечке?', answer: 'Тесто не отдохнуло. После укладки (fonçage) в кольцо, уберите его в морозилку минимум на 2 часа, а лучше на ночь. Пеките замороженным.' }
    ]
  },

]
// ─── Metadata only (no content) — safe to send to the browser ───────────────
// Use this in React client islands to avoid shipping all 103 articles' content.
// Each article page receives its own full content as a static SSG prop.
export type ArticleMeta = Omit<Article, 'content'>

export const articlesMeta: ArticleMeta[] = articles.map(({ content: _content, ...meta }) => meta)
