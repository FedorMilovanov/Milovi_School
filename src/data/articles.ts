import { localImages } from '../assets/images'
import { articleImageDimensions } from './articleImageDimensions'
import { dc } from './deepContents'
import type { Article, ArticleMeta } from './types'
export type { Article, ArticleMeta, RecipeData } from './types'

// Возвращает глубокий контент. Fallback-шаблон запрещён: если контент
// отсутствует, сборка должна упасть, а не выпускать thin/duplicate page.
const body = (_topic: string, _id?: string) => {
  if (_id && dc[_id]) return dc[_id]
  throw new Error(`[articles] Missing deepContents entry for ${_id ?? _topic}`)
}

export const articles: Article[] = [
  { id: 'grolet-lemon-yuzu', title: 'Рецепт знаменитого «Лимона» Седрика Гроле: Пошаговая техника иллюзорного десерта', excerpt: 'Техническая карта по культовому лимону: как сохранить кислоту, сделать тонкое покрытие и избежать вкуса варенья.', content: body('Седрик Гроле и лимон', 'grolet-lemon-yuzu'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 6, image: '/images/articles/grolet-lemon-yuzu.webp', tags: ['лимон', 'юдзу', 'yuzu', 'ганаш', 'обманка'], sourceUrl: 'https://reportergourmet.com/en/news/7740-cedric-grolet-and-the-recipe-for-stuffed-lemon-it-looks-like-fruit-but-it-s-a-dessert', date: '2025-01-15', sourceLabel: 'Reporter Gourmet' },
  { id: 'herme-ispahan-deep', title: 'Десерт Испахан от Пьера Эрме: Рецепт архитектуры вкуса (роза, личи и малина)', excerpt: 'Полный учебный разбор культового десерта: кислота малины, цветочный верх розы, сочная середина личи.', content: body('Испахан Пьера Эрме', 'herme-ispahan-deep'), category: 'pierre-herme', author: 'PH10, Traveling Foodies, PastryClass', readTime: 5, image: '/images/articles/herme-ispahan-deep.webp', tags: ['Испахан', 'роза', 'личи', 'малина'], sourceUrl: 'https://travellingfoodies.wordpress.com/2011/03/25/pierre-hermes-ispahan/', date: '2025-01-22', sourceLabel: 'Traveling Foodies' },
  { id: 'perret-softness-volume', title: 'Перре: объем, мягкость, воздушность и хрупкость как язык десерта', excerpt: 'Проверенный разбор стиля François Perret: мягкость, объём, лёгкость и десерты Ritz Paris без неподтверждённых цитат.', content: body('Франсуа Перре', 'perret-softness-volume'), category: 'francois-perret', author: 'Ritz Paris, So Good Magazine, Books for Chefs', readTime: 5, image: '/images/articles/perret-softness-volume.webp', tags: ['мягкость', 'Ritz', 'сахар', 'текстура'], sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', date: '2025-02-01', sourceLabel: 'Ritz Paris Le Comptoir' },
  { id: 'heitzler-ethical-pastry', title: 'Клер Эйцлер: сезонность, фермеры и этичная выпечка', excerpt: 'Глубокий материал по интервью Chefs for Impact, Valrhona и Pastry Arts: почему клубника зимой меняет профессию.', content: body('Клер Эйцлер', 'heitzler-ethical-pastry'), category: 'claire-heitzler', author: 'Chefs for Impact, Valrhona, Pastry Arts Magazine', readTime: 4, image: '/images/articles/heitzler-ethical-pastry.webp', tags: ['этичная выпечка', 'сезонность', 'фермеры'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2025-02-10', sourceLabel: 'Chefs for Impact' },
  { id: 'couvreur-full-course', title: 'Секреты эклеров и мильфея от Янна Куврера: Разбор техник французской школы', excerpt: 'Исчерпывающий конспект 14 уроков Янна Куврера: заварное тесто, пралине-крем, масляный крем и мильфей.', content: body('Янн Куврер', 'couvreur-full-course'), category: 'yann-couvreur', author: 'PastryClass, Gault&Millau', readTime: 5, image: '/images/articles/couvreur-full-course.webp', tags: ['курс', 'choux', 'пралине', 'мильфей'], sourceUrl: 'https://mypastryclass.com/blogs/articles/yann-couvreur-teaches-elite-parisian-pastries', date: '2025-02-20', sourceLabel: 'PastryClass' },
  { id: 'felder-fundamentals', title: 'Базовые рецепты французской выпечки от Кристофа Фельдера: Тесто и кремы без ошибок', excerpt: 'Почему книга Patisserie стала рабочей базой: 3200 фотографий, пошаговые уроки, кремы, тесто, тарты.', content: body('Кристоф Фельдер', 'felder-fundamentals'), category: 'christophe-felder', author: 'Christophe Felder references', readTime: 5, image: '/images/articles/felder-fundamentals.webp', tags: ['Фельдер', 'основы', 'школа'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2025-03-01', sourceLabel: 'Head Butler' },
  { id: 'herme-biography', title: 'Пьер Эрме: «Дерзость — вот что сделало меня успешным за 50 лет»', excerpt: 'Детальный материал по жизни и карьере Пьера Эрме: Эльзас, ученичество у Ленотра в 14 лет, 11 лет в Fauchon, Ladurée и 60+ точек по миру.', content: body('Пьер Эрме', 'herme-biography'), category: 'pierre-herme', author: 'AFP, Michelin Guide, Pastry Workshop', readTime: 5, image: '/images/articles/herme-biography.webp', tags: ['биография', 'Ленотр', 'Fauchon'], sourceUrl: 'https://www.laliste.com/news/pierre-herme-the-picasso-of-pastry', date: '2025-03-10', sourceLabel: 'La Liste' },
  { id: 'grolet-fruits-full', title: 'Гроле: фрукты, оболочка, начинка, аэрограф и правдоподобие', excerpt: 'Техническая карта реалистичного фруктового десерта: от белого шоколада до геля с чистым вкусом.', content: body('Седрик Гроле фрукты', 'grolet-fruits-full'), category: 'cedric-grolet', author: 'PastryClass', readTime: 5, image: '/images/articles/grolet-fruits-full.webp', tags: ['фрукты', 'шоколад', 'аэрограф'], sourceUrl: 'https://mypastryclass.com/blogs/articles/cedric-grolet-teaches-fruits-nuts-and-flowers', date: '2025-03-20', sourceLabel: 'PastryClass' },
  { id: 'michalak-chocolate-salt', title: 'Мишалак: шоколад, морская соль и принцип щедрой выпечки', excerpt: 'Как чемпион мира делает десерт понятным, ярким и не скучным: соль, текстура, щедрость.', content: body('Кристоф Мишалак', 'michalak-chocolate-salt'), category: 'christophe-michalak', author: 'Taste and Flavors', readTime: 4, image: '/images/articles/michalak-chocolate-salt.webp', tags: ['шоколад', 'соль', 'щедрость'], sourceUrl: 'https://www.tasteandflavors.com/christophe-michalak/', date: '2025-04-01', sourceLabel: 'Taste and Flavors' },
  { id: 'conticini-praline', title: 'Пралине Контисини: орехи, сироп 116–118°C и карамелизация', excerpt: 'Проверенная формула Philippe Conticini: 300 г фундука, 300 г миндаля, 400 г сахара, 100 г воды и стадия sablage.', content: body('Филипп Контисини', 'conticini-praline'), category: 'philippe-conticini', author: 'Philippe Conticini, Meilleur du Chef', readTime: 5, image: '/images/articles/conticini-praline.webp', tags: ['пралине', 'осмос', 'фундук'], sourceUrl: 'https://www.meilleurduchef.com/fr/recette/praline-maison.html', date: '2025-04-10', sourceLabel: 'Meilleur du Chef' },
  { id: 'crookie-conticini', title: 'Crookie: от парижской булочной до мирового тренда', excerpt: 'Как Стефан Лувар из Maison Louvard создал гибрид круассана и cookie, а TikTok сделал его вирусным.', content: body('Crookie Maison Louvard', 'crookie-conticini'), category: 'french-cuisine', author: 'BBC Travel, AFP, Maison Louvard', readTime: 5, image: '/images/articles/crookie-conticini.webp', tags: ['Crookie', 'Лувар', 'тренды', '2024'], sourceUrl: 'https://www.bbc.com/travel/article/20240305-the-surprisingly-complicated-history-of-the-croissant', date: '2025-04-20', sourceLabel: 'BBC Travel' },
  { id: 'metayer-secrets', title: 'Нина Метайе: 3 секрета выпечки от лучшего кондитера мира', excerpt: 'Практические советы от обладательницы титула лучший шеф-кондитер 2023: мусс, соль и уважение к фрукту.', content: body('Метайе секреты', 'metayer-secrets'), category: 'nina-metayer', author: 'EnVols', readTime: 5, image: '/images/articles/metayer-secrets.webp', tags: ['советы', 'мусс', 'соль'], sourceUrl: 'https://www.en-vols.com/en/taste/gastronomy/nina-metayer-baking-secrets-2/', date: '2025-05-01', sourceLabel: 'EnVols' },
  { id: 'metayer-salt-fruit', title: 'Нина Метайе: соль, мусс и уважение к фрукту', excerpt: 'Три профессиональных секрета в расширенном разборе: не перевзбивать, солить, не мучить продукт.', content: body('Метайе соль фрукт', 'metayer-salt-fruit'), category: 'nina-metayer', author: 'EnVols, Nina Metayer', readTime: 3, image: '/images/articles/metayer-salt-fruit.webp', tags: ['соль', 'мусс', 'фрукты'], sourceUrl: 'https://www.tasteandflavors.com/nina-metayer/', date: '2025-05-10', sourceLabel: 'Taste and Flavors' },
  { id: 'tech-glossary-cap', title: 'Словарь французского кондитера: термины, без которых рецепты не читаются', excerpt: 'Dessecher, detrempe, dorer, dresser, panade, puncher и другие рабочие слова кухни.', content: body('Французский словарь CAP', 'tech-glossary-cap'), category: 'techniques', author: 'French pastry glossary', readTime: 5, image: '/images/articles/tech-glossary-cap.webp', tags: ['словарь', 'CAP', 'термины'], sourceUrl: 'https://delicesnco.blogspot.com/2014/03/petit-lexique-des-termes-techniques-de.html', date: '2025-05-20', sourceLabel: 'Delices and co' },
  { id: 'grolet-raspberry-rose', title: 'Raspberry Rose от Гроле: ягода, которую только что сорвали', excerpt: 'Полная сборка фирменной малины Гроле: ванильный ганаш, малиновый гель без блендера, песочное тесто, финансье и эффект влажной кожуры.', content: body('Raspberry Rose от Гроле: ягода, которую только что сорвали', 'grolet-raspberry-rose'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 3, image: '/images/articles/grolet-raspberry-rose.webp', tags: ['малина', 'Raspberry Rose', 'малиновая роза', 'роза', 'ваниль', 'ганаш', 'обманка', 'велюр'], sourceUrl: 'https://mypastryclass.com/blogs/articles/cedric-grolet-teaches-fruits-nuts-and-flowers', date: '2025-06-01', sourceLabel: 'PastryClass' },
  { id: 'ansel-dka', title: 'DKA: техническая карта kouign-amann от Доминика Анселя', excerpt: 'Слоение, блок масла, сахар, карамельная корка и контроль температуры для бретонской выпечки.', content: body('Ансель DKA', 'ansel-dka'), category: 'dominique-ansel', author: 'Frenchly, Dominique Ansel Bakery', readTime: 3, image: '/images/articles/ansel-dka.webp', tags: ['DKA', 'kouign-amann', 'ламинация'], sourceUrl: 'https://frenchly.us/dominique-ansel-kouign-amann-dka-recipe/', date: '2025-06-10', sourceLabel: 'Frenchly' },
  { id: 'tech-choux', title: 'Заварное тесто: научная логика и диагностика ошибок', excerpt: 'Крахмал, пар, полость, яйца, подсушка, трещины и гладкая поверхность для эклеров и шу.', content: body('Заварное тесто', 'tech-choux'), category: 'techniques', author: 'Food52, CAP pastry notes', readTime: 5, image: '/images/articles/tech-choux.webp', tags: ['заварное тесто', 'пар', 'panade', 'углублено'], sourceUrl: 'https://food52.com/story/14068-how-to-make-crullers-master-pate-a-choux-along-the-way', date: '2025-06-20', sourceLabel: 'Food52' },
  { id: 'lignac-equinoxe', title: 'Сириль Линьяк и Equinoxe: ваниль, speculoos и соленая карамель', excerpt: 'Перевод-разбор фирменного пирожного: почему минимализм работает, как карамельный центр держит композицию.', content: body('Линьяк Equinoxe', 'lignac-equinoxe'), category: 'cyril-lignac', author: 'La Pâtisserie Cyril Lignac, Académie du Goût', readTime: 3, image: '/images/articles/lignac-equinoxe.webp', tags: ['Equinoxe', 'эквинокс', 'равноденствие', 'ваниль', 'карамель', 'speculoos'], sourceUrl: 'https://lapatisseriecyrillignac.com/en/pastries/20-equinoxe-lignac.html', date: '2025-07-01', sourceLabel: 'La Pâtisserie Cyril Lignac' },
  { id: 'mercotte-anglaise', title: 'Меркотт: заварной английский крем 85°C, плоский венчик и контроль желтка', excerpt: 'Технологическая карта: почему нельзя кипятить, как проверить наппа, зачем нужен плоский венчик.', content: body('Меркотт английский крем', 'mercotte-anglaise'), category: 'mercotte', author: 'Mercotte, CAP, Elle & Vire', readTime: 5, image: '/images/articles/mercotte-anglaise.webp', tags: ['английский крем', 'венчик', 'наппа', '85°C'], sourceUrl: 'https://www.mercotte.fr/category/les-bases/', date: '2025-07-10', sourceLabel: 'Mercotte' },
  { id: 'perret-madeleine-18h', title: 'Франсуа Перре и мадлен Ritz: 18 часов ради одного укуса', excerpt: 'Отдых, влажность, глазурь, второй нагрев и память вкуса в Salon Proust.', content: body('Перре мадлен', 'perret-madeleine-18h'), category: 'francois-perret', author: 'Ritz Paris, François Perret, Instants sucrés au Ritz Paris', readTime: 3, image: '/images/articles/perret-madeleine-18h.webp', tags: ['мадлен', 'Ritz', 'влажность'], sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', date: '2025-07-20', sourceLabel: 'Ritz Paris Le Comptoir' },
  { id: 'mercotte-macarons', title: 'Меркотт: макарон на итальянской меренге как система контроля', excerpt: 'Выдержанные белки, сироп 117°C, tant-pour-tant, ruban и созревание 24-48 часов.', content: body('Меркотт макарон', 'mercotte-macarons'), category: 'mercotte', author: 'Mercotte, Elle & Vire', readTime: 5, image: '/images/articles/mercotte-macarons.webp', tags: ['макарон', 'меренга', '117°C'], sourceUrl: 'https://www.elle-et-vire.com/fr/fr/recettes/les-macarons-a-la-meringue-italienne-de-mercotte/', date: '2025-08-01', sourceLabel: 'Elle & Vire' },
  { id: 'tech-mirror-glaze', title: 'Глазурь miroir без пузырей: температура, блендер и замороженный entremets', excerpt: 'Полная диагностика зеркальной глазури: глюкоза, желатин, шоколад, температура 28-32°C.', content: body('Зеркальная глазурь', 'tech-mirror-glaze'), category: 'techniques', author: 'CAP pastry notes', readTime: 3, image: '/images/articles/tech-mirror-glaze.webp', tags: ['глазурь', 'miroir', 'entremets'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2025-08-10', sourceLabel: 'CAP pastry notes' },
  { id: 'cuisine-sauces', title: 'Материнские соусы на практике: как из пяти баз получить десятки блюд', excerpt: 'Бешамель, велюте, эспаньоль, томат и голландез: применение, ошибки и производные.', content: body('Пять соусов', 'cuisine-sauces'), category: 'french-cuisine', author: 'Escoffier, Food52', readTime: 5, image: '/images/articles/cuisine-sauces.webp', tags: ['соусы', 'Эскоффер', 'roux'], sourceUrl: 'https://www.escoffier.edu/blog/recipes/how-to-make-the-five-mother-sauces/', date: '2025-08-20', sourceLabel: 'Escoffier' },
  { id: 'paciello-childhood', title: 'Николя Пачелло: детские сладости, сделанные с точностью дворца', excerpt: 'CinqSens, марбре, флан, Paris-Brest и десерты, которые дают улыбку.', content: body('Пачелло детство', 'paciello-childhood'), category: 'nicolas-paciello', author: 'Journal des Femmes', readTime: 5, image: '/images/articles/paciello-childhood.webp', tags: ['детство', 'пралине', 'шоколад'], sourceUrl: 'https://cuisine.journaldesfemmes.fr/chefs-et-gastronomie/2676605-nicolas-paciello-star-patissiere-tres-discrete/', date: '2025-09-01', sourceLabel: 'Journal des Femmes' },
  { id: 'ansel-time', title: 'Доминик Ансель: время как ингредиент', excerpt: 'Главный урок автора Cronut и DKA: несколько минут могут изменить десерт так же сильно, как соль.', content: body('Ансель время', 'ansel-time'), category: 'dominique-ansel', author: 'Bon Appetit, Spoon University', readTime: 3, image: '/images/articles/ansel-time.webp', tags: ['Cronut', 'DKA', 'время'], sourceUrl: 'https://www.bonappetit.com/people/chefs/article/dominique-ansel-interview', date: '2025-09-10', sourceLabel: 'Bon Appétit' },
  { id: 'tech-feuilletage', title: 'Feuilletage без провалов: почему слоёное тесто не поднимается', excerpt: 'Полная диагностика: детремп, масло для раскатки, простые и двойные туры, выпечка.', content: body('Слоёное тесто', 'tech-feuilletage'), category: 'techniques', author: 'Atouts Gourmands, CAP pastry notes', readTime: 5, image: '/images/articles/tech-feuilletage.webp', tags: ['слоёное тесто', 'масло', 'выпечка'], sourceUrl: 'https://atoutsgourmands.wordpress.com/2023/01/12/pate-feuilletee-comprendre-et-maitriser/', date: '2025-09-20', sourceLabel: 'Atouts Gourmands' },
  { id: 'tech-creme-pat', title: 'Заварной крем без комков: гладкий и доваренный', excerpt: 'Профессиональная схема: темперирование желтков, крахмал, кипячение, охлаждение и стабилизация.', content: body('Заварной крем', 'tech-creme-pat'), category: 'techniques', author: 'CAP pastry notes', readTime: 4, image: '/images/articles/tech-creme-pat.webp', tags: ['заварной крем', 'крахмал', 'ваниль'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2025-10-01', sourceLabel: 'CAP pastry notes' },
  { id: 'cuisine-brigade', title: 'Бригада де кухни: иерархия французского ресторана', excerpt: 'Классическая организация профессиональной кухни, придуманная Эскоффером.', content: body('Бригада де кухни', 'cuisine-brigade'), category: 'french-cuisine', author: 'IHM Notes', readTime: 3, image: '/images/articles/cuisine-brigade.webp', tags: ['бригада', 'кухня', 'Эскоффер'], sourceUrl: 'https://www.escoffier.edu/blog/culinary-pastry-careers/different-types-of-chef-jobs-in-the-brigade-de-cuisine/', date: '2025-10-10', sourceLabel: 'Auguste Escoffier School' },
  { id: 'michalak-religieuse', title: 'Карамельная религиёз по Мишалаку: полный рецепт', excerpt: 'Детальная инструкция по созданию классического французского десерта от чемпиона мира.', content: body('Мишалак религиёз', 'michalak-religieuse'), category: 'christophe-michalak', author: 'Cook First', readTime: 4, image: '/images/articles/michalak-religieuse.webp', tags: ['религиёз', 'карамель', 'заварное тесто'], sourceUrl: 'https://www.academiedugout.fr/recettes/religieuse-caramel-beurre-sale_4463_2', date: '2025-10-20', sourceLabel: 'Académie du Goût' },
  { id: 'couvreur-millefeuille', title: 'Янн Куврер: мильфей, который едят ложкой', excerpt: 'Перевод-конспект о фирменном ванильном mille-feuille, kouign-amann-тесте и лёгком креме.', content: body('Куврер мильфей', 'couvreur-millefeuille'), category: 'yann-couvreur', author: 'Gault&Millau, PastryClass', readTime: 5, image: '/images/articles/couvreur-millefeuille.webp', tags: ['мильфей', 'ваниль', 'хруст'], sourceUrl: 'https://fr.gaultmillau.com/en/news/yann-couvreur-en-5-patisseries', date: '2025-11-01', sourceLabel: 'Gault&Millau' },
  { id: 'heitzler-seasonality', title: 'Клер Эйцлер: почему клубника зимой — это не клубника', excerpt: 'Как сезонность меняет аромат, кислоту и текстуру фрукта, и что это значит для рецепта.', content: body('Эйцлер сезонность', 'heitzler-seasonality'), category: 'claire-heitzler', author: 'Chefs for Impact, Valrhona', readTime: 3, image: '/images/articles/heitzler-seasonality.webp', tags: ['сезонность', 'этика', 'фрукты'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2025-11-10', sourceLabel: 'Chefs for Impact' },
  { id: 'lignac-patisserie-shop', title: 'La Patisserie Cyril Lignac: как высокая выпечка стала соседской', excerpt: 'Конспект по бутику Линьяка и Бенуа Куврана: круассаны, флан, baba au rhum, лимонная тарта и хлеб.', content: body('Линьяк бутик', 'lignac-patisserie-shop'), category: 'cyril-lignac', author: 'David Lebovitz', readTime: 5, image: '/images/articles/lignac-patisserie-shop.webp', tags: ['бутик', 'флан', 'круассан'], sourceUrl: 'https://www.davidlebovitz.com/la-patisserie/', date: '2025-11-20', sourceLabel: 'David Lebovitz' },
  { id: 'felder-alsace', title: 'Эльзасская линия Фельдера: kougelhopf, linzer, streusel и школа рук', excerpt: 'Перевод-конспект о школе Фельдера в Страсбурге и роли региональной выпечки в профессиональной базе.', content: body('Фельдер Эльзас', 'felder-alsace'), category: 'christophe-felder', author: 'Petit Fute, Felder school references', readTime: 5, image: '/images/articles/felder-alsace.webp', tags: ['Эльзас', 'kougelhopf', 'streusel'], sourceUrl: 'https://www.petitfute.co.uk/v458-strasbourg-67000/c1171-sports-loisirs/c1254-hobbies-et-autres-loisirs/c315-cours-de-cuisine/419978-ecole-de-patisserie-de-christophe-felder.html', date: '2025-12-01', sourceLabel: 'Petit Fute' },
  { id: 'paciello-cinqsens', title: 'CinqSens Пачелло: магазин как иммерсивная дегустация ингредиента', excerpt: 'Как строить десерт от сырья: ваниль Таити, сицилийская фисташка, какао Гватемалы.', content: body('Пачелло CinqSens', 'paciello-cinqsens'), category: 'nicolas-paciello', author: 'Journal des Femmes, Frenchefs', readTime: 4, image: '/images/articles/paciello-cinqsens.webp', tags: ['CinqSens', 'ингредиенты', 'фисташка'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2025-12-10', sourceLabel: 'Frenchefs' },
  { id: 'ansel-cronut-origin', title: 'Cronut: как 15 пончиков изменили кондитерский мир', excerpt: 'История изобретателя Cronut: кухня размером со стол, вирусная публикация и звонок президента Франции.', content: body('Ансель Cronut', 'ansel-cronut-origin'), category: 'dominique-ansel', author: 'Food and Wine, Bakepedia', readTime: 5, image: '/images/articles/ansel-cronut-origin.webp', tags: ['Cronut', 'биография', 'Нью-Йорк'], sourceUrl: 'https://www.foodandwine.com/chefs/dominique-ansel-leading-light-pastry', date: '2025-12-20', sourceLabel: 'Food and Wine' },
  { id: 'michalak-fantastik', title: 'Мишалак и Fantastik: торт высотой 3 см, потому что рот не шире', excerpt: 'Эргономика десерта: почему чемпион мира буквально измерил свой рот перед созданием фирменного торта.', content: body('Мишалак Fantastik', 'michalak-fantastik'), category: 'christophe-michalak', author: 'HuffPost, Reporter Gourmet', readTime: 5, image: '/images/articles/michalak-fantastik.webp', tags: ['Fantastik', 'эргономика', 'шоколад'], sourceUrl: 'https://reportergourmet.com/en/chef/782-christophe-michalak', date: '2024-09-01', sourceLabel: 'Reporter Gourmet' },
  { id: 'tech-madeleine', title: 'Madeleine: бугорок не магия, а температурный шок', excerpt: 'Почему появляется bosse: холодное тесто, горячая форма, двухэтапная выпечка и металлическая форма.', content: body('Мадлен бугорок', 'tech-madeleine'), category: 'techniques', author: 'BakingLikeAChef, Pardon Your French', readTime: 4, image: '/images/articles/tech-madeleine.webp', tags: ['мадлен', 'bosse', 'температура'], sourceUrl: 'https://www.bakinglikeachef.com/secrets-of-the-madeleine-hump/', date: '2024-09-15', sourceLabel: 'BakingLikeAChef' },
  { id: 'cuisine-galette', title: 'Классическая Galette des Rois: миндальный крем, слоёное тесто, традиция', excerpt: 'Традиционный французский пирог Трёх королей с миндальным кремом и слоёным тестом.', content: body('Galette des Rois', 'cuisine-galette'), category: 'french-cuisine', author: 'Leonce Chenal', readTime: 3, image: '/images/articles/cuisine-galette.webp', tags: ['традиция', 'Galette', 'миндаль'], sourceUrl: 'https://lacuisinedethomas.fr/recettes/galette-des-rois-frangipane-christophe-michalak/', date: '2024-10-01', sourceLabel: 'La Cuisine de Thomas' },
  { id: 'cuisine-sauces-history', title: 'История французских соусов от Карема до Эскоффера', excerpt: 'Как два великих шефа создали систему, которой пользуются до сих пор.', content: body('История соусов', 'cuisine-sauces-history'), category: 'french-cuisine', author: 'Savory Kitchin', readTime: 3, image: '/images/articles/cuisine-sauces-history.webp', tags: ['история', 'Карем', 'Эскоффер'], sourceUrl: 'https://savorykitchin.com/deep-history-of-the-five-mother-sauces/', date: '2024-10-15', sourceLabel: 'Savory Kitchen' },
  { id: 'recipe-pecan-chocolate-creme-brulee', title: "Entremets «Пекан, шоколад и крем-брюле»: рецепт от Ogre de Carrouselberg", excerpt: 'Полная технологическая карта мини-тарт от лилльского кондитера: пралине из пекана, ганаш-монте, шоколадный бисквит и крем-брюле как вставка.', content: body('recipe-pecan-chocolate-creme-brulee', 'recipe-pecan-chocolate-creme-brulee'), category: 'recipes', author: 'Fou de Pâtisserie, Ogre de Carrouselberg, defis-patisserie.com', readTime: 4, image: localImages.pecan, tags: ['рецепт', 'пекан', 'шоколад', 'крем-брюле', 'entremets'], sourceUrl: 'https://defis-patisserie.com/decouvrez-lentremets-noix-de-pecans-chocolat-et-creme-brulee/', date: '2024-11-01', sourceLabel: 'defis-patisserie.com' },
  { id: 'tech-macaronage', title: 'Техника макаронаж: искусство идеального теста для макарон', excerpt: 'Секреты складывания теста: сбор и переворачивание, тест с лентой, проверка поверхности.', content: body('Макаронаж', 'tech-macaronage'), category: 'techniques', author: 'Pastry Expertise', readTime: 4, image: '/images/articles/tech-macaronage.webp', tags: ['макаронаж', 'макарон', 'техника'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2024-11-15', sourceLabel: 'CAP pastry notes' },
  // === НОВЫЕ СТАТЬИ (апрель 2026) ===
  { id: 'adam-eclair', title: 'Кристоф Адам: эклер как холст — цвет, глянец и 200 вариаций', excerpt: 'Основатель L\'Éclair de Génie о том, почему эклер стал главным десертом десятилетия и как из классики сделать арт-объект.', content: body('Кристоф Адам эклер', 'adam-eclair'), category: 'techniques', author: 'L\'Éclair de Génie, Vogue France', readTime: 5, image: '/images/articles/adam-eclair.webp', tags: ['эклер', 'глазурь', 'цвет'], sourceUrl: 'https://www.bakersjournal.com/interview-with-chef-christophe-adam-on-inspiration-and-eclairs-7517/', date: '2024-12-01', sourceLabel: 'Bakers Journal' },
  { id: 'tech-tempering-chocolate', title: 'Темперирование шоколада: кривая, кристаллы и глянец', excerpt: 'Полная технологическая карта: кривая темперирования для тёмного, молочного и белого шоколада. Метод стола, метод посева, микрио.', content: body('Темперирование шоколада', 'tech-tempering-chocolate'), category: 'techniques', author: 'Valrhona Professional, École Valrhona', readTime: 4, image: '/images/articles/tech-tempering-chocolate.webp', tags: ['темперирование', 'шоколад', 'кристаллы', 'Valrhona'], sourceUrl: 'https://www.valrhona.com/en/l-ecole-valrhona/discover-l-ecole-valrhona/chocolate-terminology/tempering-chocolate', date: '2024-12-15', sourceLabel: 'École Valrhona' },
  { id: 'herme-fetish-flavors', title: 'Пьер Эрме: пять вкусов, которые он называет своими', excerpt: 'Роза-личи-малина, белый трюфель-ваниль, карамель с солью, маття и умами из соевого соуса — философия подписных вкусов шефа.', content: body('Эрме фирменные вкусы', 'herme-fetish-flavors'), category: 'pierre-herme', author: 'PH10, Maison Pierre Hermé Paris', readTime: 4, image: '/images/articles/herme-fetish-flavors.webp', tags: ['Эрме', 'Испахан', 'ваниль', 'маття'], sourceUrl: 'https://english.aawsat.com/varieties/5265238-macarons-used-bore-me-says-french-pioneer-pierre-herme', date: '2024-01-15', sourceLabel: 'AFP' },
  { id: 'grolet-walnut', title: 'Гроле: орех грецкий — как сделать жёсткий продукт нежным', excerpt: 'Технологическая карта десерта Noix: скорлупа из молочного шоколада, пралине из грецкого ореха, мягкий ганаш и текстура, которую невозможно ожидать.', content: body('Гроле грецкий орех', 'grolet-walnut'), category: 'cedric-grolet', author: 'PastryClass, Cedric Grolet references', readTime: 4, image: '/images/articles/grolet-walnut.webp', tags: ['орех', 'пралине', 'ганаш', 'обманка'], sourceUrl: 'https://www.theworlds50best.com/stories/News/cedric-grolet-worlds-best-pastry-chef.html', date: '2024-02-01', sourceLabel: "World's 50 Best" },
  { id: 'tech-ganache-types', title: 'Три типа ганаша: эмульсия, монте и конфетный — в чём разница', excerpt: 'Когда брать ганаш для начинки конфет, когда для крема торта, а когда для глазури. Пропорции, жиры и стабильность.', content: body('Типы ганаша', 'tech-ganache-types'), category: 'techniques', author: 'Valrhona, École Ferrandi', readTime: 3, image: '/images/articles/tech-ganache-types.webp', tags: ['ганаш', 'эмульсия', 'шоколад', 'крем'], sourceUrl: 'https://www.valrhona.com/en/l-ecole-valrhona/discover-l-ecole-valrhona/chocolate-terminology/chocolate-ganache', date: '2024-02-15', sourceLabel: 'École Valrhona' },
  { id: 'kayser-sourdough-pastry', title: 'Эрик Кайзер: закваска в кондитерке — хлебная логика в десерте', excerpt: 'Как основатель Maison Kayser привнёс кислотность хлебной закваски в бриошь, куинь-аман и слойку.', content: body('Эрик Кайзер закваска', 'kayser-sourdough-pastry'), category: 'techniques', author: 'Maison Kayser, Taste France', readTime: 4, image: '/images/articles/kayser-sourdough-pastry.webp', tags: ['закваска', 'бриошь', 'Кайзер', 'хлеб'], sourceUrl: 'https://maison-kayser.com/en/cours/make-your-own-natural-sourdough-with-eric-kaysers-recipe/', date: '2024-03-01', sourceLabel: 'Maison Kayser Academy' },
  { id: 'tech-entremets-assembly', title: 'Сборка entremets: порядок слоёв, заморозка и демолдирование без потерь', excerpt: 'Профессиональный алгоритм: что идёт первым в кольцо, как заморозить вставку, когда глазировать и как вынуть без трещин.', content: body('Сборка антреме', 'tech-entremets-assembly'), category: 'techniques', author: 'CAP pastry notes, École de Pâtisserie', readTime: 5, image: '/images/articles/tech-entremets-assembly.webp', tags: ['entremets', 'сборка', 'заморозка', 'демолдирование'], sourceUrl: 'https://ecoledepatisserie-boutique.com/fr-us/blogs/patisserie-conseil-professionnel/preparation-cap-patisserie', date: '2024-03-15', sourceLabel: 'École de Pâtisserie' },
  { id: 'conticini-texture-first', title: 'Контисини: текстура важнее вкуса — почему он так думает', excerpt: 'Философский разбор подхода Контисини: почему первым работает тактильное ощущение, и только потом приходит вкус.', content: body('Контисини текстура', 'conticini-texture-first'), category: 'philippe-conticini', author: 'So Good Magazine, Fou de Pâtisserie', readTime: 4, image: '/images/articles/conticini-texture-first.webp', tags: ['текстура', 'Контисини', 'философия'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2024-04-01', sourceLabel: 'Gault&Millau' },
  { id: 'cuisine-fond-brun', title: 'Фон-де-во и фон-брюн: как французский бульон стал основой всей профессиональной кухни', excerpt: 'От обжарки костей до наппирования. Почему жидкость — это не вода, а система вкусов, которую нельзя заменить кубиком.', content: body('Фон-де-во французский', 'cuisine-fond-brun'), category: 'french-cuisine', author: 'Escoffier, Auguste Escoffier School', readTime: 4, image: '/images/articles/cuisine-fond-brun.webp', tags: ['фон-де-во', 'бульон', 'Эскоффер', 'соус'], sourceUrl: 'https://escoffierathome.com/recipes/4-fond-brun-de-veau-brown-veal-stock/', date: '2024-04-15', sourceLabel: 'Escoffier At Home' },
  { id: 'metayer-world-best-2023', title: 'Нина Метайе — лучший шеф-кондитер мира 2023: история и работы', excerpt: 'Карьера от Troisgros до Accents, первая женщина с этим титулом за 10 лет — что стоит за победой и как выглядят её ключевые десерты.', content: body('Метайе лучший кондитер мира', 'metayer-world-best-2023'), category: 'nina-metayer', author: "World's 50 Best, Le Chef Magazine", readTime: 5, image: '/images/articles/metayer-world-best-2023.webp', tags: ['Метайе', 'лучший кондитер', '2023', 'биография'], sourceUrl: 'https://www.theworlds50best.com/stories/News/nina-metayer-worlds-best-pastry-chef-2024-interview.html', date: '2024-05-01', sourceLabel: "World's 50 Best" },
  { id: 'tech-sugar-work', title: 'Работа с сахаром: тянутый, дутый и литой — три языка кондитерского искусства', excerpt: 'Стадии варки сахара, температуры, изомальт, техника сатинирования и практика дутья. С чего начинать и каких ошибок не простит сахар.', content: body('Работа с сахаром', 'tech-sugar-work'), category: 'techniques', author: 'École Ferrandi, MOF Pastry references', readTime: 4, image: '/images/articles/tech-sugar-work.webp', tags: ['сахар', 'изомальт', 'дутый сахар', 'украшения'], sourceUrl: 'https://www.escoffier.edu/blog/baking-pastry/sugar-sculpting-explained/', date: '2024-05-15', sourceLabel: 'Auguste Escoffier School' },
  { id: 'tech-mousse-stability', title: 'Мусс без желатина: как аэрация и жир удерживают форму', excerpt: 'Почему шоколадный мусс может стоять без желатина, а фруктовый — нет. Физика пены, роль сливок и правильная температура взбивания.', content: body('Мусс стабильность', 'tech-mousse-stability'), category: 'techniques', author: 'Valrhona, Pastry Arts Magazine', readTime: 3, image: '/images/articles/tech-mousse-stability.webp', tags: ['мусс', 'стабильность', 'желатин', 'аэрация'], sourceUrl: 'https://www.valrhona.us/our-recipes/tips-and-tricks/valrhona-chef-s-tips-tricks', date: '2024-06-01', sourceLabel: 'Valrhona Professional' },

  { id: 'genin-autodidact', title: 'Жак Жени: от бойни до лучшего шоколада Парижа — без единого диплома', excerpt: 'Как человек без образования, работавший на бойне с 13 лет, стал поставщиком 200 ресторанов Michelin и открыл лучшую шоколатерию Марэ.', content: body('Жак Жени путь', 'genin-autodidact'), category: 'jacques-genin', author: 'Food & Sens, Newtable, Jacques Genin', readTime: 4, image: '/images/articles/genin-autodidact.webp', tags: ['биография', 'автодидакт', 'шоколад', 'Марэ'], sourceUrl: 'https://foodandsens.com/made-by-f-and-s/chefs-on-parle-de-vous/jacques-genin-patissier-a-appris-aupres-chefs-de-cuisine/', date: '2024-06-15', sourceLabel: 'Food & Sens' },

  { id: 'genin-millefeuille', title: 'Мильфей Жани: «К 14:00 или к 20:00?» — почему сборка решает всё', excerpt: 'Почему лучший мильфей Парижа не продаётся утром: философия свежести, феноменальные карамели и то, чему Жени научился у ресторанных шефов.', content: body('Жак Жени мильфей', 'genin-millefeuille'), category: 'jacques-genin', author: 'Paris by Mouth, The Wandering Eater, L\'Honoré', readTime: 3, image: '/images/articles/genin-millefeuille.webp', tags: ['мильфей', 'карамель', 'freshness', 'Париж'], sourceUrl: 'https://parisbymouth.com/our-guide-to-paris-jacques-genin/', date: '2024-07-01', sourceLabel: 'Paris by Mouth' },

  { id: 'herme-architecture-taste', title: 'Эрме в Гарварде: лекция об архитектуре вкуса, соль и Испахан', excerpt: 'Как четвёртое поколение кондитеров из Эльзаса превратило соль в инструмент баланса, а болгарская розовая трапеза 1987 года создала главный десерт эпохи.', content: body('Эрме архитектура вкуса', 'herme-architecture-taste'), category: 'pierre-herme', author: 'The Talks, Michelin Guide, La Liste', readTime: 3, image: '/images/articles/herme-architecture-taste.webp', tags: ['Испахан', 'соль', 'вкус', 'Гарвард', 'архитектура'], sourceUrl: 'https://the-talks.com/interview/pierre-herme/', date: '2024-07-15', sourceLabel: 'The Talks' },

  { id: 'conticini-paris-brest-iconic', title: 'Контисини: Париж-Брест, верин и почему шоколадные крокеты 1986 года изменили французскую кондитерскую', excerpt: 'Пять ключевых десертов — пять этапов пути от La Table d\'Anvers до La Pâtisserie des Rêves: как один повар переосмыслил классику через эмоцию.', content: body('Контисини Париж-Брест иконы', 'conticini-paris-brest-iconic'), category: 'philippe-conticini', author: 'Gault&Millau, Maison.com, Raids Pâtisseries', readTime: 4, image: '/images/articles/conticini-paris-brest-iconic.webp', tags: ['Париж-Брест', 'верин', 'история', 'эмоция', 'La Table d\'Anvers'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2024-08-01', sourceLabel: 'Gault&Millau' },

  { id: 'couvreur-canal-biography', title: 'Янн Куврер: лис, Канал Сен-Мартен и путь из Eden Rock в Майами', excerpt: 'Как бывший шеф-кондитер Prince de Galles открыл бутик у канала и стал символом нового парижского кондитерского движения — через сезонность и честный вкус.', content: body('Куврер лис биография', 'couvreur-canal-biography'), category: 'yann-couvreur', author: 'Le JDD, Wikipedia, Galeries Lafayette', readTime: 4, image: '/images/articles/couvreur-canal-biography.webp', tags: ['биография', 'лис', 'Canal Saint-Martin', 'сезонность'], sourceUrl: 'https://www.lejdd.fr/culture/yann-couvreur-le-chef-patissier-qui-exporte-son-talent-aux-quatre-coins-du-monde-154676', date: '2024-08-15', sourceLabel: 'Le JDD' },

  { id: 'perret-ritz-notebook', title: 'Перре: «правильный сахар» — мильфей, который носят в руке, и лучшая кондитерская мира', excerpt: 'Как шеф-кондитер Ritz Paris превратил мадлен Salon Proust в бренд мирового уровня и почему La Liste назвала его бутик лучшим в мире в 2024 году.', content: body('Перре Ritz записная книжка', 'perret-ritz-notebook'), category: 'francois-perret', author: 'Gault&Millau, Ritz Paris Le Comptoir, Meet & Match', readTime: 3, image: '/images/articles/perret-ritz-notebook.webp', tags: ['Ritz', 'мадлен', 'мильфей', 'La Liste', 'лучшая кондитерская'], sourceUrl: 'https://fr.gaultmillau.com/en/news/francois-perret-en-5-desserts', date: '2024-09-01', sourceLabel: 'Gault&Millau' },

  // === КОНТЕНТ-СТРАТЕГИЯ (апрель 2026) — по аудиту ===

  { id: 'stohrer-1730', title: 'Maison Stohrer 1730: старейшая кондитерская Парижа, пережившая Наполеона, революцию и две войны', excerpt: 'Николас Шторер — кондитер польского короля — открыл лавку на Rue Montorgueil в 1730 году. Там же она стоит до сих пор. История баба-о-рома, puits d\'amour и religieuse.', content: body('Maison Stohrer 1730: старейшая кондитерская Парижа, переживш', 'stohrer-1730'), category: 'histoire-culinaire', author: 'stohrer.fr, The Parisian Guide, France Today', readTime: 3, image: '/images/articles/stohrer-1730.webp', tags: ['Stohrer', 'история', 'баба-о-ром', '1730', 'Rue Montorgueil'], sourceUrl: 'https://stohrer.fr/about-us/', date: '2023-10-01', sourceLabel: 'Maison Stohrer' },

  { id: 'laduree-1862', title: 'Ladurée 1862: как пожар, женщина с идеей и внук с кремом создали символ Парижа', excerpt: 'Луи-Эрнест Ладюрэ открыл булочную в 1862 году. Пожар уничтожил её — он перестроил в кондитерскую. Жена добавила чайный салон. Внук склеил два печенья кремом. Родился парижский макарон.', content: body('Ladurée 1862: как пожар, женщина с идеей и внук с кремом соз', 'laduree-1862'), category: 'histoire-culinaire', author: 'Wikipedia, Paris.zagranitsa.com', readTime: 3, image: '/images/articles/laduree-1862.webp', tags: ['Ladurée', 'макарон', 'история', '1862', 'Пьер Эрме'], sourceUrl: 'https://en.wikipedia.org/wiki/Laduree', date: '2023-11-01', sourceLabel: 'Wikipedia' },

  { id: 'careme-first-celebrity-chef', title: 'Антонен Карем: первый звёздный шеф, который кормил Наполеона', excerpt: 'Брошенный ребёнок из Парижа — и кондитер Наполеона, Александра I и принца-регента Англии. История о том, как 15-летний беспризорник стал «королём шефов», изобрёл мать-соусы и превратил кондитерское дело в архитектуру.', content: body('Антонен Карем: первый звёздный шеф, который кормил Наполеона', 'careme-first-celebrity-chef'), category: 'histoire-culinaire', author: 'NPR, National Geographic, Britannica', readTime: 4, image: '/images/articles/careme-first-celebrity-chef.webp', tags: ['Антонен Карем', 'история', 'XIX век', 'Наполеон', 'мать-соусы'], sourceUrl: 'https://www.npr.org/sections/thesalt/2017/01/12/509154654/how-a-destitute-abandoned-parisian-boy-became-the-first-celebrity-chef', date: '2023-12-01', sourceLabel: 'NPR' },

  { id: 'croissant-history', title: 'История круассана: не французский, не из Парижа — и всё равно символ Франции', excerpt: 'Круассан родился в Вене в 1683 году как kipfel. В Париж привёз австрийский офицер в 1839-м. Слоёное тесто появилось только в 1895-м. История ламинирования, спора chocolatine vs pain au chocolat и почему 30–40% круассанов во Франции — замороженные.', content: body('История круассана: не французский, не из Парижа — и всё равн', 'croissant-history'), category: 'histoire-culinaire', author: 'ICE, Taste and Travel, Sortir à Paris', readTime: 5, image: '/images/articles/croissant-history.webp', tags: ['круассан', 'история', 'ламинирование', 'венуазри', 'Август Занг'], sourceUrl: 'https://www.ice.edu/blog/brief-history-croissant-austrian-kipferl-layered-french-luxury', date: '2023-01-15', sourceLabel: 'ICE Culinary School' },

  { id: 'escoffier-biography', title: 'Огюст Эскоффье: бригада, «Le Guide Culinaire» и кухня как система', excerpt: 'Как беглый юнга из Ниццы стал «Императором шефов», изобрёл бригадную кухню, накормил Нелли Мелба и написал 5000 рецептов, которыми пользуются до сих пор.', content: body('Огюст Эскоффье биография', 'escoffier-biography'), category: 'histoire-culinaire', author: 'Le Guide Culinaire, NPR, Escoffier School', readTime: 3, image: '/images/articles/escoffier-biography.webp', tags: ['Эскоффье', 'история', 'бригада', 'XIX век', 'Le Guide Culinaire'], sourceUrl: 'https://www.escoffier.edu/blog/culinary-pastry-careers/different-types-of-chef-jobs-in-the-brigade-de-cuisine/', date: '2023-02-01', sourceLabel: 'Auguste Escoffier School' },

  { id: 'brillat-savarin', title: 'Бриллья-Саварен: «Скажи мне, что ты ешь» — философ, написавший гастрономию', excerpt: 'Адвокат, мэр, судья и беглец от революции, который провёл три года в Коннектикуте, охотился на индеек и написал книгу, изменившую отношение к еде.', content: body('Бриллья-Саварен философ вкуса', 'brillat-savarin'), category: 'histoire-culinaire', author: 'Physiologie du Goût, Britannica', readTime: 3, image: '/images/articles/brillat-savarin.webp', tags: ['Бриллья-Саварен', 'история', 'философия', 'XIX век', 'гастрономия'], sourceUrl: 'https://www.britannica.com/biography/Jean-Anthelme-Brillat-Savarin', date: '2023-03-01', sourceLabel: 'Britannica' },

  { id: 'paris-brest-race-dessert', title: 'Paris-Brest: десерт для велогонки, который пережил её на 100 лет', excerpt: 'В 1910 году кондитер Луи Дюран придумал пирожное в форме колеса для велогонки Париж–Брест. В 2009-м Контисини спрятал его начинку — и переизобрёл классику.', content: body('Paris-Brest история велогонка', 'paris-brest-race-dessert'), category: 'histoire-culinaire', author: 'ICE Culinary, PBP History', readTime: 4, image: '/images/articles/paris-brest-race-dessert.webp', tags: ['Paris-Brest', 'история', 'Луи Дюран', 'велогонка', 'Контисини'], sourceUrl: 'https://www.ice.edu/blog/history-of-paris-brest', date: '2023-04-01', sourceLabel: 'ICE Culinary School' },

  { id: 'creme-brulee-dispute', title: 'Крем-брюле: Франция, Англия и Каталония — кто изобрёл и как это доказать', excerpt: 'Тринити-колледж 1879 года. Каталонская рукопись 1324-го. Французское меню XVII века. Три страны, три источника и ни одного бесспорного первенства.', content: body('Крем-брюле история спор', 'creme-brulee-dispute'), category: 'histoire-culinaire', author: 'Taste and Travel, ICE Culinary', readTime: 4, image: '/images/articles/creme-brulee-dispute.webp', tags: ['крем-брюле', 'история', 'Каталония', 'Тринити', 'спор'], sourceUrl: 'https://www.ice.edu/blog/creme-brulee-history', date: '2023-05-01', sourceLabel: 'ICE Culinary School' },

  { id: 'patissiers-guild-medieval', title: 'Цехи кондитеров: как Средние века создали профессию — и почему их след есть в CAP Pâtissier', excerpt: 'С 1270 года — устав вафельщиков. С 1440-го — официальный цех pâtissiers. С 1566-го — королевский эдикт Карла IX. История монополий, войн за сахар и того, как гильдии стали государственным экзаменом.', content: body('Цехи кондитеров история Средние века', 'patissiers-guild-medieval'), category: 'histoire-culinaire', author: 'Histoire de la Pâtisserie, Escoffier', readTime: 3, image: '/images/articles/patissiers-guild-medieval.webp', tags: ['история', 'гильдии', 'Средние века', 'CAP', 'confiseurs'], sourceUrl: 'https://www.escoffier.edu/blog/baking-pastry/a-brief-history-of-french-pastry/', date: '2023-06-01', sourceLabel: 'Auguste Escoffier School' },

  { id: 'french-classics-origins', title: 'Tarte Tatin, баба-о-ром, éclair: 5 французских десертов с реальной историей создания', excerpt: 'Tarte Tatin — случайная ошибка сестёр. Баба-о-ром — пересохший кугельхопф польского короля. Éclair назвали «молнией», потому что его съедали мгновенно. Пять историй с первоисточниками.', content: body('Tarte Tatin, баба-о-ром, éclair: 5 французских десертов с ре', 'french-classics-origins'), category: 'histoire-culinaire', author: 'Taste and Travel, ICE Culinary School', readTime: 5, image: '/images/articles/french-classics-origins.webp', tags: ['Tarte Tatin', 'éclair', 'мильфей', 'макарон', 'история'], sourceUrl: 'https://tasteandtravel.fr/en/ru-blog-en/the-real-history-of-the-french-pastries-part-one/', date: '2023-07-01', sourceLabel: 'Taste and Travel' },

  { id: 'eclair-histoire-complete', title: 'L\'Éclair: от «pain à la duchesse» до L\'Éclair de Génie — полная история', excerpt: 'В 1742 году его звали «картушем». Карем дал ему начинку. Лионская douille — форму. Кристоф Адам в 2012-м — концепцию. История одного пирожного за 280 лет.', content: body('Эклер история французская кухня', 'eclair-histoire-complete'), category: 'histoire-culinaire', author: 'France Bleu, Inside Lyon, La Bonne Vague, Le Chef, Horsdoeuvre.fr', readTime: 8, image: '/images/articles/eclair-histoire-complete.webp', tags: ['éclair', 'Карем', 'история', 'Fauchon', 'Кристоф Адам', 'pâte à choux', 'XIX век'], sourceUrl: 'https://www.francebleu.fr/emissions/coup-de-fourchette/l-histoire-des-eclairs-et-des-religieuses-des-patisseries-emblematiques-6218775', date: '2024-08-01', sourceLabel: 'France Bleu' },

  { id: 'millefeuille-histoire', title: 'Мильфей: 729 слоёв, миф о Наполеоне и Seugnot 1867', excerpt: 'Ла Варен описал его в 1651-м. Руже опубликовал рецепт в 1806-м — и его забыли. Только Seugnot в 1867-м превратил его в парижский феномен. А «Наполеон» — просто ложная легенда.', content: body('Мильфей история Наполеон французская пâтиссери', 'millefeuille-histoire'), category: 'histoire-culinaire', author: 'BoulangerieNet, Luxury Place, france.fr, La Bête à Pain', readTime: 4, image: '/images/articles/millefeuille-histoire.webp', tags: ['мильфей', 'Наполеон', 'история', 'Seugnot', 'pâte feuilletée', 'XVII век'], sourceUrl: 'https://www.boulangerienet.fr/bn/viewtopic.php?t=47393', date: '2026-01-10', sourceLabel: 'BoulangerieNet' },

  { id: 'opera-gateau-histoire', title: 'Гато Опера: Dalloyau против Lenôtre — 30 лет войны за прямоугольник', excerpt: 'В 1955-м Сириак Гавийон создал прямоугольный торт без алкоголя и с минимумом сахара. Жена назвала его «Опера» в честь балерин. Через пять лет Гастон Лёнотр заявил, что изобрёл его сам. Le Monde рассудил в 1988-м.', content: body('Гато Опера история Dalloyau Lenôtre спор', 'opera-gateau-histoire'), category: 'histoire-culinaire', author: 'Europe1, Sortir à Paris, Wikipedia, Les Noces de Jeannette', readTime: 4, image: '/images/articles/opera-gateau-histoire.webp', tags: ['Опера', 'Dalloyau', 'Lenôtre', 'история', 'Гавийон', 'бисквит Жоконд'], sourceUrl: 'https://www.sortiraparis.com/en/where-to-eat-in-paris/brunch-cafe-tea-time/articles/260130-history-of-french-pastry-opera', date: '2026-01-20', sourceLabel: 'Sortir à Paris' },

  { id: 'buche-noel-histoire', title: 'Бюш де Ноэль: от языческого бревна в очаге до ежегодного конкурса шефов', excerpt: 'Первое упоминание — 1184 год. Язычество, солнцестояние, ритуал бенедикции. В XIX веке печи вытеснили камины — и кондитеры придумали съедобную замену. Имя изобретателя до сих пор неизвестно.', content: body('Бюш де Ноэль история ритуал рождество', 'buche-noel-histoire'), category: 'histoire-culinaire', author: 'Wikipédia, Mon Grand Est, Aventure Culinaire, Cité du Chocolat Valrhona', readTime: 4, image: '/images/articles/buche-noel-histoire.webp', tags: ['бюш', 'рождество', 'история', 'ритуал', 'XIX век', 'традиция'], sourceUrl: 'https://fr.wikipedia.org/wiki/B%C3%BBche_de_No%C3%ABl', date: '2026-02-01', sourceLabel: 'Wikipédia' },

  { id: 'histoire-tartes-francaises', title: 'История французских тартов: дариол XIII века, Бурдалу и тарт Татен из ошибки', excerpt: 'От кремовой тарталетки из средневекового Амьена до тарта из Ламот-Бёврон, перевёрнутого случайно. Семь столетий эволюции французского тарта — с именами, адресами и документами.', content: body('История французских тартов средние века дариол Татен Бурдалу', 'histoire-tartes-francaises'), category: 'histoire-culinaire', author: 'Wikipédia, Patissiers.pro, 196 Flavors, Tendances-Food', readTime: 4, image: '/images/articles/histoire-tartes-francaises.webp', tags: ['тарт', 'история', 'дариол', 'Татен', 'Бурдалу', 'фланже', 'XIII век'], sourceUrl: 'https://fr.wikipedia.org/wiki/Flan_p%C3%A2tissier', date: '2026-02-15', sourceLabel: 'Wikipédia' },

  { id: 'carnaval-culinaire-histoire', title: 'Carnaval culinaire: как Карем превратил кухню XIX века в политический театр', excerpt: 'Сахарные египетские пирамиды на банкете. Кухня Талейрана как инструмент Венского конгресса. Pièces montées высотой в метр. Эпоха, когда повар был архитектором — и почему Эскоффье её закончил.', content: body('Карем пьесы монтес история XIX кулинарный театр Талейран', 'carnaval-culinaire-histoire'), category: 'histoire-culinaire', author: 'La Bête à Pain, Escoffier School, France Gastronomique', readTime: 4, image: '/images/articles/carnaval-culinaire-histoire.webp', tags: ['Карем', 'история', 'XIX век', 'Талейран', 'pièces montées', 'carnaval', 'театр'], sourceUrl: 'https://labeteapain.com/histoire-de-la-patisserie/', date: '2026-03-01', sourceLabel: 'La Bête à Pain' },

  { id: 'canele-bordeaux-histoire', title: 'Канеле: монахини, вино и медный моул — как Бордо изобрело самое загадочное пирожное Франции', excerpt: 'Сёстры Анонсиад собирали муку с причалов и желтки — от виноделен. Ром и ваниль добавил безымянный мастер начала XX века. А в 1985-м один «n» убрали официально. История продукта, у которого нет ни одного доказанного факта — кроме вкуса.', content: body('Канеле Бордо история монахини вино медный моул', 'canele-bordeaux-histoire'), category: 'histoire-culinaire', author: 'La Toque Cuivrée, Wikipédia, La Bête à Pain, La Bonne Vague, Baillardran', readTime: 4, image: '/images/articles/canele-bordeaux-histoire.webp', tags: ['канеле', 'Бордо', 'история', 'монахини', 'ром', 'ваниль', 'медный моул', 'конфрерия'], sourceUrl: 'https://www.la-toque-cuivree.fr/histoire-du-canele/', date: '2026-03-15', sourceLabel: 'La Toque Cuivrée' },

  { id: 'financier-histoire', title: 'Финансье: как монахини Нанси накормили парижских биржевиков — и создали форму золотого слитка', excerpt: 'В XVII веке это пекли визитандинки, чтобы не тратить яичные белки от живописи. В 1890-м кондитер Ласне придал тесту форму lingot d\'or — и продавал у стен Бурсы. История маленького гато с большими деньгами.', content: body('Финансье история Нанси визитандинки Ласне Бурса парижская кухня', 'financier-histoire'), category: 'histoire-culinaire', author: 'Wikipédia, La Bête à Pain, La Bonne Vague, ICI France, Monsieur de France', readTime: 4, image: '/images/articles/financier-histoire.webp', tags: ['финансье', 'история', 'Нанси', 'Бурса', 'визитандинки', 'бёр нуазет', 'миндаль'], sourceUrl: 'https://fr.wikipedia.org/wiki/Financier_(p%C3%A2tisserie)', date: '2026-04-01', sourceLabel: 'Wikipédia' },

  // ── РЕЦЕПТЫ ──────────────────────────────────────────────────────────────────

  {
    id: 'recipe-tarte-citron-meringuee',
    title: 'Тарт о ситрон мерингé — тарт с лимонным кремом и итальянской меренгой',
    excerpt: 'Классика французской кондитерской из Meilleur du Chef: хрустящее миндальное тесто, крем из лимона на 82°C и шёлковая меренга, приготовленная при 118°C. Точные пропорции и диагностика ошибок.',
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Philippe',
    readTime: 4,
    image: '/images/articles/recipe-tarte-citron-meringuee.webp',
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
    readTime: 4,
    image: '/images/articles/recipe-paris-brest-classique.webp',
    tags: ['рецепт', 'Paris-Brest', 'choux', 'пралине', 'крем-муслин'],
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/paris-brest--4',
    sourceLabel: 'Chef Simon',
    date: '2025-09-20',
    content: body('Paris-Brest: заварное тесто, пралиновый крем-муслин и хрустя', 'recipe-paris-brest-classique')
  },

  // ── MERCOTTE ────────────────────────────────────────────────────────────────
  { id: 'mercotte-tarte-citron', title: 'Меркотт: тарт с лимоном — кислота, баланс и идеальная меренга', excerpt: 'Разбор классического лимонного тарта: песочное тесто, crème citron без желатина и итальянская меренга с горелкой.', content: body('Меркотт тарт лимон', 'mercotte-tarte-citron'), category: 'mercotte', author: 'Mercotte, CAP pastry notes', readTime: 5, image: '/images/articles/mercotte-tarte-citron.webp', tags: ['тарт', 'лимон', 'меренга', 'крем'], sourceUrl: 'https://www.mercotte.fr/category/les-bases/', date: '2026-04-10', sourceLabel: 'Mercotte' },
  { id: 'mercotte-entremets-system', title: 'Меркотт: энтреме от А до Я — бисквит, мусс, гляссаж, сборка', excerpt: 'Система подготовки к CAP Pâtisserie и домашним энтреме: вкладыш, кольцо, температура зеркальной глазури.', content: body('Меркотт энтреме система', 'mercotte-entremets-system'), category: 'mercotte', author: 'Mercotte, Elle à Table, CAP', readTime: 6, image: '/images/articles/mercotte-entremets-system.webp', tags: ['энтреме', 'мусс', 'гляссаж', 'CAP'], sourceUrl: 'https://www.mercotte.fr/category/entremets/', date: '2026-04-15', sourceLabel: 'Mercotte' },

  // ── JACQUES GENIN ────────────────────────────────────────────────────────────
  { id: 'genin-caramel-philosophy', title: 'Жак Жени: философия карамели — горечь, соль, время и терруар', excerpt: 'Как человек без диплома создал лучшую карамель Парижа: почему карамель нельзя спешить и что значит «карамель au beurre salé de Guérande».', content: body('Жак Жени карамель', 'genin-caramel-philosophy'), category: 'jacques-genin', author: 'Paris by Mouth, Food & Sens', readTime: 5, image: '/images/articles/genin-caramel-philosophy.webp', tags: ['карамель', 'соль', 'Guérande', 'терруар'], sourceUrl: 'https://parisbymouth.com/our-guide-to-paris-jacques-genin/', date: '2026-04-20', sourceLabel: 'Paris by Mouth' },
  { id: 'genin-ganache-craft', title: 'Жак Жени и ганаш: шоколад как продукт терруара, а не бренда', excerpt: 'Как Жени выбирает какао-бобы, работает с криолло из Мадагаскара и почему в его ганаше нет лишних ингредиентов.', content: body('Жак Жени ганаш терруар', 'genin-ganache-craft'), category: 'jacques-genin', author: 'Food & Sens, Newtable', readTime: 5, image: '/images/articles/genin-ganache-craft.webp', tags: ['ганаш', 'шоколад', 'терруар', 'криолло'], sourceUrl: 'https://foodandsens.com/made-by-f-and-s/chefs-on-parle-de-vous/jacques-genin-patissier-a-appris-aupres-chefs-de-cuisine/', date: '2026-04-25', sourceLabel: 'Food & Sens' },

  // ── CYRIL LIGNAC ─────────────────────────────────────────────────────────────
  { id: 'lignac-far-breton', title: 'Сириль Линьяк: фар бретон — деревенский десерт с точностью haute pâtisserie', excerpt: 'Учебный разбор фар бретон: соотношение яиц, сливок и муки, сухофрукты, температура и зачем нужен высокий бортик формы.', content: body('Линьяк фар бретон', 'lignac-far-breton'), category: 'cyril-lignac', author: 'Cyril Lignac, Cuisine Actuelle', readTime: 5, image: '/images/articles/lignac-far-breton.webp', tags: ['фар бретон', 'Бретань', 'яйца', 'простота'], sourceUrl: 'https://www.cuisineactuelle.fr/recettes/recettes-de-chefs/far-breton-au-pruneaux-de-cyril-lignac-53044', date: '2026-04-28', sourceLabel: 'Cuisine Actuelle' },
  { id: 'lignac-kouign-amann', title: 'Сириль Линьяк и Kouign-Amann: карамельная корка, слоёность и соль Бретани', excerpt: 'Полный технологический разбор бретонской классики: дрожжевое тесто, масло, сахар, тройной тур и финальная карамелизация в форме.', content: body('Линьяк куинь-аман', 'lignac-kouign-amann'), category: 'cyril-lignac', author: 'Cyril Lignac, David Lebovitz', readTime: 3, image: '/images/articles/lignac-kouign-amann.webp', tags: ['kouign-amann', 'Бретань', 'карамель', 'слоёность'], sourceUrl: 'https://www.davidlebovitz.com/kouign-amann/', date: '2026-04-29', sourceLabel: 'David Lebovitz' },

  // ── CLAIRE HEITZLER ─────────────────────────────────────────────────────────
  { id: 'heitzler-less-sugar', title: 'Клер Эйцлер: меньше сахара — больше вкуса. Как убрать 30% без потери удовольствия', excerpt: 'Практический разбор методологии: чем компенсировать сладость, как работает кислота, и почему горечь — это не враг.', content: body('Эйцлер меньше сахара', 'heitzler-less-sugar'), category: 'claire-heitzler', author: 'Pastry Arts Magazine, Valrhona', readTime: 5, image: '/images/articles/heitzler-less-sugar.webp', tags: ['сахар', 'баланс', 'кислота', 'горечь'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2026-04-30', sourceLabel: 'Pastry Arts Magazine' },
  { id: 'heitzler-floral-palette', title: 'Клер Эйцлер: цветочная палитра — жасмин, фиалка, роза в современном десерте', excerpt: 'Как работать с цветочными ароматами без синтетики: натуральные экстракты, свежие лепестки, дистилляция и точный баланс.', content: body('Эйцлер цветочная палитра', 'heitzler-floral-palette'), category: 'claire-heitzler', author: 'Madame Figaro, Pastry Arts Magazine', readTime: 3, image: '/images/articles/heitzler-floral-palette.webp', tags: ['цветы', 'жасмин', 'роза', 'аромат'], sourceUrl: 'https://www.chefs4impact.org/post/meet-claire-heitzler', date: '2026-05-01', sourceLabel: 'Madame Figaro' },

  // ── CHRISTOPHE FELDER ────────────────────────────────────────────────────────
  { id: 'felder-fraisier', title: 'Фрезье Фельдера: классика, которую надо понять до автоматизма', excerpt: 'Пошаговый учебный разбор знакового торта: génoise, crème mousseline, сироп понч, клубника и финальная отделка марципаном.', content: body('Фельдер фрезье', 'felder-fraisier'), category: 'christophe-felder', author: 'Christophe Felder, Patisserie book', readTime: 5, image: '/images/articles/felder-fraisier.webp', tags: ['фрезье', 'генуаз', 'муссилин', 'клубника'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2026-05-02', sourceLabel: 'Patisserie — Felder' },
  { id: 'felder-biscuit-joconde', title: 'Бисквит «Жоконда» по Фельдеру: структура, техника и рулет Opera', excerpt: 'Почему бисквит «Жоконда» — это не просто тесто, а архитектурный элемент энтреме: миндаль, протеин белка и рулет Опера.', content: body('Фельдер бисквит жоконда', 'felder-biscuit-joconde'), category: 'christophe-felder', author: 'Christophe Felder, Patisserie book', readTime: 3, image: '/images/articles/felder-biscuit-joconde.webp', tags: ['жоконда', 'Опера', 'бисквит', 'миндаль'], sourceUrl: 'https://headbutler.com/reviews/patisserie-mastering-the-fundamentals-of-french-pastry/', date: '2026-05-03', sourceLabel: 'Patisserie — Felder' },

  // ── NICOLAS PACIELLO ─────────────────────────────────────────────────────────
  { id: 'paciello-flan-parisien', title: 'Николя Пачелло: flan parisien — философия простоты и техника без права на ошибку', excerpt: 'Почему главный кондитер парижского паласа Prince de Galles посвятил парижскому флану отдельную страницу в меню: тесто, крем, температура.', content: body('Пачелло флан парижский', 'paciello-flan-parisien'), category: 'nicolas-paciello', author: 'Frenchefs, Journal des Femmes', readTime: 3, image: '/images/articles/paciello-flan-parisien.webp', tags: ['флан', 'Париж', 'простота', 'Prince de Galles'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2026-05-04', sourceLabel: 'Frenchefs' },
  { id: 'paciello-praline-art', title: 'Пачелло: пралине как художественный жест — ореховая база, текстура и точность', excerpt: 'Как шеф-кондитер CinqSens работает с пралине: три сорта фундука, карамельные степени, гранулометрия и правило «вкус из сырья».', content: body('Пачелло пралине искусство', 'paciello-praline-art'), category: 'nicolas-paciello', author: 'Frenchefs, So Good Magazine', readTime: 3, image: '/images/articles/paciello-praline-art.webp', tags: ['пралине', 'фундук', 'карамель', 'CinqSens'], sourceUrl: 'https://frenchefs.fr/nicolas-paciello', date: '2025-01-15', sourceLabel: 'Frenchefs' },

  // ── НОВЫЕ СТАТЬИ (до 4 в каждой категории) ────────────────────────────────

  { id: 'michalak-biography', title: 'Кристоф Мишалак: чемпион мира, Plaza Athénée и принцип щедрого десерта', excerpt: 'Биография: Санлис, CAP, 11 лет в Plaza Athénée, победа на Coupe du Monde 2005 и открытие Masterclass.', content: body('Мишалак биография', 'michalak-biography'), category: 'christophe-michalak', author: 'Le Figaro, Reporter Gourmet', readTime: 3, image: '/images/articles/michalak-biography.webp', tags: ['биография', 'чемпион мира', 'Plaza Athénée', 'Fantastik'], sourceUrl: 'https://reportergourmet.com/en/chef/782-christophe-michalak', date: '2025-01-22', sourceLabel: 'Reporter Gourmet' },

  { id: 'ansel-cronut', title: 'Ансель после Cronut: токийская лаборатория, концепция невозможного десерта и эволюция', excerpt: 'Что Доминик Ансель придумал после того, как Cronut стал иконой: японский минимализм, физика мороженого и теория «мгновения» в современной пекарне.', content: body('Ансель Cronut', 'ansel-cronut'), category: 'dominique-ansel', author: 'The New York Times, Food52, Dominique Ansel Bakery', readTime: 5, image: '/images/articles/ansel-cronut.webp', tags: ['Токио', 'инновация', 'концепция', 'эволюция'], sourceUrl: 'https://dominiqueanselbakery.com', date: '2025-02-01', sourceLabel: 'Dominique Ansel Bakery' },

  { id: 'perret-madeleine', title: 'Мадлен Перре: beurre noisette, лимонная глазурь и Пруст на витрине Ritz', excerpt: 'Технологический разбор самой знаменитой мадлен Парижа: коричневое масло, мёд акации, температурный шок и 7 евро за штуку.', content: body('Перре мадлен', 'perret-madeleine'), category: 'francois-perret', author: 'Ritz Paris, Madame Figaro', readTime: 5, image: '/images/articles/perret-madeleine.webp', tags: ['мадлен', 'beurre noisette', 'Пруст', 'Ritz'], sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', date: '2025-02-10', sourceLabel: 'Ritz Paris Le Comptoir' },

  { id: 'metayer-biography', title: "Нина Метайе: FERRANDI, Ladurée, World's Best Pastry Chef 2023", excerpt: 'Биография лучшего кондитера мира: от Ниора до Валенсии — через трёхзвёздочный Реймс, Fauchon, Le Meurice и 14 лет найма.', content: body('Метайе биография', 'metayer-biography'), category: 'nina-metayer', author: "World's 50 Best, Le Monde", readTime: 3, image: '/images/articles/metayer-biography.webp', tags: ['биография', 'World\'s Best', 'FERRANDI', 'Ladurée'], sourceUrl: 'https://www.theworlds50best.com/stories/News/nina-metayer-worlds-best-pastry-chef-2023.html', date: '2025-02-20', sourceLabel: "World's 50 Best" },

  { id: 'conticini-paris-brest', title: 'Контисини: верин, эмоция и La Table d\'Anvers — революция, которую не заметили', excerpt: 'Как в 1994 году Контисини переизобрёл формат десерта в стеклянном стакане, заложил философию «вкусовой памяти» и сформировал целое поколение французских кондитеров.', content: body('Контисини Париж-Брест', 'conticini-paris-brest'), category: 'philippe-conticini', author: 'Le Monde, Gault&Millau, Omnivore', readTime: 5, image: '/images/articles/conticini-paris-brest.webp', tags: ['верин', 'La Table d\'Anvers', 'философия', 'эмоция', 'история'], sourceUrl: 'https://fr.gaultmillau.com/en/news/philippe-conticini-en-5-desserts', date: '2025-03-01', sourceLabel: 'Gault&Millau' },

  { id: 'recipe-canele', title: 'Канеле де Бордо: медные формы, пчелиный воск и двухэтапная выпечка', excerpt: 'Полная технологическая карта бордоского канеле: выдержка теста 48 часов, температурный шок, почти горелая корочка и заварная середина.', content: body('Канеле Бордо', 'recipe-canele'), category: 'recipes', author: 'Confrérie du Canelé, Baillardran', readTime: 4, image: '/images/articles/recipe-canele.webp', tags: ['канеле', 'Бордо', 'ром', 'медные формы'], sourceUrl: 'https://www.baillardran.com/en/canele', date: '2025-03-10', sourceLabel: 'Baillardran' },

  { id: 'couvreur-biography', title: 'Янн Куврер: Реймс, Ferrandi, мильфей à la minute и улица Мартир', excerpt: 'Биография: от кондитерского ученика в Реймсе до шефа Le Meurice и владельца трёх бутиков. История о feuilletage и независимости.', content: body('Куврер биография', 'couvreur-biography'), category: 'yann-couvreur', author: 'Gault&Millau, Le Figaro', readTime: 3, image: '/images/articles/couvreur-biography.webp', tags: ['биография', 'мильфей', 'feuilletage', 'Ferrandi'], sourceUrl: 'https://fr.gaultmillau.com/en/chefs/yann-couvreur', date: '2025-03-20', sourceLabel: 'Gault&Millau' },


  // ── АУТЕНТИЧНЫЕ ФРАНЦУЗСКИЕ РЕЦЕПТЫ ──────────────────────────────────────

  { id: 'recipe-tarte-tatin', title: 'Классический Тарт Татен (Tarte Tatin): Аутентичный французский рецепт с карамелью', excerpt: 'Полная технологическая карта классической тарт Татен: сухой карамель, двухэтапная выпечка, демуляж без потерь. История из Ламотт-Бёврон, которая стала символом французского десерта.', content: body('Тарт Татен', 'recipe-tarte-tatin'), category: 'recipes', author: 'Meilleur du Chef, Confrérie du Tarte Tatin', readTime: 5, image: '/images/articles/recipe-tarte-tatin.webp', tags: ['тарт татен', 'яблоки', 'карамель', 'pâte brisée', 'Солонь'], date: '2026-05-05', sourceUrl: 'https://www.meilleurduchef.com/en/recipe/tarte-tatin-apple.html', sourceLabel: 'Meilleur du Chef' },

  { id: 'recipe-creme-brulee', title: 'Идеальный Крем-брюле: Классический французский рецепт с ванилью и карамельной корочкой', excerpt: 'Исчерпывающий рецепт классического crème brûlée: 100°C, 55 минут, соотношение 5 желтков на 500 мл сливок, chalumeau и правило 90 секунд до подачи.', content: body('Крем-брюле ваниль', 'recipe-creme-brulee'), category: 'recipes', author: 'Rians, Atelier des Chefs', readTime: 5, image: '/images/articles/recipe-creme-brulee.webp', tags: ['крем-брюле', 'крем брюле', 'crème brûlée', 'brulee', 'ваниль bourbon', 'бань-мари', 'chalumeau', 'желтки'], date: '2026-05-05', sourceUrl: 'https://rians.com/fr/recettes/creme-brulee-la-recette-authentique-rians/', sourceLabel: 'Rians — Recette Authentique' },

  { id: 'recipe-clafoutis-cerises', title: 'Клафути с вишней: лимузенский рецепт с kirsch и косточками', excerpt: 'Аутентичный clafoutis aux cerises из Лимузена: почему косточки не вынимают, двухтемпературная выпечка 210→180°C и рецепт Ladurée с цедрой лимона.', content: body('Клафути вишня', 'recipe-clafoutis-cerises'), category: 'recipes', author: 'Académie du Goût (Alain Ducasse), Ladurée Sucré', readTime: 3, image: '/images/articles/recipe-clafoutis-cerises.webp', tags: ['клафути', 'вишня', 'Лимузен', 'kirsch', 'Ladurée'], date: '2026-05-05', sourceUrl: 'https://www.academiedugout.fr/recettes/clafoutis-aux-cerises_10375_2', sourceLabel: 'Académie du Goût — Alain Ducasse' },

  { id: 'recipe-souffle-chocolat', title: 'Шоколадное суфле: физика горба, меренга и правило 90 секунд', excerpt: 'Полный разбор soufflé au chocolat: смазка вертикально, трик chapeau de cuisinier, метод crème pâtissière для ресторанного суфле и почему не надо бояться открывать духовку.', content: body('Шоколадное суфле', 'recipe-souffle-chocolat'), category: 'recipes', author: 'Christophe Michalak, Plaza Athénée technique', readTime: 5, image: '/images/articles/recipe-souffle-chocolat.webp', tags: ['суфле', 'шоколад', 'меренга', 'Valrhona', 'Plaza Athénée'], date: '2026-05-05', sourceUrl: 'https://mypastryclass.com/blogs/articles/', sourceLabel: 'PastryClass' },

  { id: 'recipe-madeleines', title: 'Мадлен: beurre noisette, температурный шок и горб — техника Ritz Paris', excerpt: 'Пошаговый рецепт мадлен с культовым горбом: охлаждение теста ночь, духовка 210°C, форма холодная. История Пруста, техника Ritz Paris и полная диагностика плоских мадлен.', content: body('Мадлен', 'recipe-madeleines'), category: 'recipes', author: 'François Perret (Ritz Paris), Madame Figaro', readTime: 5, image: '/images/articles/recipe-madeleines.webp', tags: ['мадлен', 'beurre noisette', 'горб', 'Ritz Paris', 'Пруст'], date: '2026-05-05', sourceUrl: 'https://www.ritzparislecomptoir.com/en/francois-perret', sourceLabel: 'Ritz Paris — François Perret' },

  // ── Chiffres Gourmands ────────────────────────────────────────────────────
  {
    id: 'chiffres-marche-15mlrd',
    title: '15 миллиардов евро и 12 миллионов круассанов в день: анатомия французской кондитерской',
    excerpt: 'Из чего состоит экономика французской пэтисери: 44 000 заведений, средний чек 6 €, десерт №1 — lemon tart, и почему хлеб умер, а десерты расцвели. Данные CNBPF, INSEE, IFOP.',
    content: body('Рынок французской кондитерской 15 млрд', 'chiffres-marche-15mlrd'),
    category: 'chiffres-gourmands',
    author: 'CNBPF, INSEE, IFOP, Observatoire Fiducial, EPSIMAS',
    readTime: 4,
    image: '/images/articles/chiffres-marche-15mlrd.webp',
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
    readTime: 3,
    image: '/images/articles/chiffres-macarons-laduree-herme.webp',
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
    readTime: 9,
    image: '/images/articles/chiffres-education-mof.webp',
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
    readTime: 6,
    image: '/images/articles/chiffres-luxury-desserts.webp',
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
    readTime: 7,
    image: '/images/articles/chiffres-anatomie-gateau.webp',
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
    readTime: 3,
    image: '/images/articles/recipe-macarons-herme.webp',
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
    readTime: 3,
    image: '/images/articles/recipe-croissant-poilane.webp',
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
    readTime: 3,
    image: '/images/articles/recipe-eclairs-adam.webp',
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
    readTime: 3,
    image: '/images/articles/recipe-opera-dalloyau.webp',
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
    readTime: 4,
    image: '/images/articles/recipe-millefeuille-inverser.webp',
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
    readTime: 3,
    image: '/images/articles/recipe-baba-rhum-alain-ducasse.webp',
    tags: ['ром-баба', 'Ален Дюкасс', 'саварен', 'сироп', 'бриошь'],
    date: '2026-05-12',
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
    readTime: 3,
    image: '/images/articles/recipe-tarte-citron-grolet.webp',
    tags: ['тарт', 'лимон', 'Седрик Гроле', 'pâte sucrée'],
    date: '2026-05-12',
    recipeData: {
      prepTime: 'PT3H', cookTime: 'PT35M', yield: '1 тарт 18см',
      ingredients: ['150г сливочного масла', '90г сахарной пудры', '30г миндальной муки', '250г муки T55', '50г яиц (для песочного теста)', '150г лимонного сока', '150г сахара', '150г яиц (для крема)']
    },
    faq: [
      { question: 'Почему песочное тесто сползает по бортикам при выпечке?', answer: 'Тесто не отдохнуло. После укладки (fonçage) в кольцо, уберите его в морозилку минимум на 2 часа, а лучше на ночь. Пеките замороженным.' }
    ]
  },

  {
    id: 'recipe-charlotte-fraises',
    title: 'Шарлотт с клубникой: история, крем баваруаз и техника',
    excerpt: 'Шарлотт с клубникой (charlotte aux fraises): история десерта от Антонена Карема, классический баварский крем, бисквиты а-ля кюйер и разбор ошибок сборки.',
    content: body('Шарлотт с клубникой: история, крем бавар', 'recipe-charlotte-fraises'),
    category: 'recipes',
    author: 'Mercotte, Chef Simon, Meilleur du Chef, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-charlotte-fraises.webp',
    tags: ['шарлотт', 'клубника', 'баваруаз', 'бисквит а-ля кюйер', 'французская выпечка', 'Антонен Карем'],
    date: '2026-07-01',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Charlotte_(dessert',
    sourceLabel: 'Mercotte',
    recipeData: {
      prepTime: 'PT1H', cookTime: 'PT20M', yield: '1 шарлотт 18 см / 6-8 порций',
      ingredients: ['Бисквиты а-ля кюйер или будуары — 24 шт', 'Клубника — 500 г', 'Молоко цельное — 150 мл', 'Желтки — 4 шт', 'Сахар — 90 г', 'Стручок ванили — 1 шт', 'Желатин листовой — 3 листа (6 г)', 'Сливки 30-35% — 450 мл', 'Сироп для пропитки (вода плюс сахар) — 100 мл']
    },
    faq: [
      { question: 'Почему баварский крем в шарлотте не застывает?', answer: 'Чаще всего под видом баваруаз готовят обычную шантийи с клубничным коулисом без желатина — такая масса оседает, как только снимают форму. Нужен настоящий crème bavaroise: заварной крем с желатином (crème anglaise collée) плюс взбитые сливки, и выдержка 4-6 часов, лучше ночь.' },
      { question: 'Как пропитывать бисквиты, чтобы шарлотт не развалился?', answer: 'Окунайте каждый бисквит в лёгкий сироп буквально на 1-2 секунды с каждой стороны. Перемоченные бисквиты набирают влагу, оседают и рушат конструкцию при разрезе, поэтому сироп берут лёгкий (вода плюс сахар), а не кислый сок.' },
      { question: 'Чем бисквит а-ля кюйер отличается от будуара?', answer: 'Будуар суше и замешивается на цельном яйце, а в бисквите а-ля кюйер (biscuit à la cuillère) белки взбивают в меренгу отдельно, поэтому он воздушнее и мягче. По легенде именно будуар довёл до ума Антонен Карем.' }
    ]
  },

  {
    id: 'recipe-tarte-bourdaloue',
    title: 'Тарт Бурдалу: парижская классика с грушей и миндалём',
    excerpt: 'Тарт Бурдалу (tarte Bourdaloue): история десерта с улицы Бурдалу, рецепт песочного теста, миндального крема и груш в сиропе, отличие от франжипана и ошибки.',
    content: body('Тарт Бурдалу: парижская классика с груше', 'recipe-tarte-bourdaloue'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Académie du Goût, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-tarte-bourdaloue.webp',
    tags: ['тарт бурдалу', 'груши', 'миндальный крем', 'песочное тесто', 'франжипан', 'французская выпечка'],
    date: '2026-07-04',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Tarte_Bourdaloue',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT45M', cookTime: 'PT30M', yield: '1 тарт 22 см / 8 порций',
      ingredients: ['Мука — 200 г', 'Сливочное масло — 100 г для теста плюс 70 г для крема', 'Сахарная пудра — 80 г', 'Яйцо — 40 г для теста плюс 70 г для крема', 'Миндальная мука — 70 г', 'Сахар — 70 г', 'Груши (половинки в сиропе) — 3-4 шт', 'Стручок ванили — 1 шт', 'Миндальные лепестки — 30 г', 'Абрикосовый нап. для глазировки', 'Ром (по желанию) — 1 ст. л.']
    },
    faq: [
      { question: 'Чем миндальный крем отличается от франжипана?', answer: 'Миндальный крем (crème d\'amandes) — это масло, миндальная мука, сахар, яйца и по желанию ром. Франжипан (frangipane) — тот же крем плюс заварной крем (crème pâtissière), обычно в пропорции две части к одной. Классический бурдалу делают на миндальном креме или на франжипане.' },
      { question: 'Почему миндальный крем вздувается и вытекает при выпечке?', answer: 'В крем вбили слишком много воздуха. Соединяйте масло, сахар, яйца и миндаль лопаткой или силиконовой маризой, а не венчиком, до однородности, но не взбивайте — иначе крем сильно поднимется и перельётся через борт.' },
      { question: 'Как избежать мокрого дна у тарта?', answer: 'Подсушите тесто вслепую (à blanc) около 12 минут, ставьте форму на разогретый противень, не перегружайте кремом, а половинки груш тщательно обсушите на бумажном полотенце перед укладкой.' }
    ]
  },

  {
    id: 'recipe-gateau-basque',
    title: 'Гато баск: настоящий баскский пирог с кремом и вишней',
    excerpt: 'Гато баск — пирог Страны Басков: песочное тесто и начинка из ванильного заварного крема или конфитюра из чёрной вишни Итксасу. История, рецептура и техника.',
    content: body('Гато баск: настоящий баскский пирог с кр', 'recipe-gateau-basque'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Wikipédia, France.fr',
    readTime: 6,
    image: '/images/articles/recipe-gateau-basque.webp',
    tags: ['гато баск', 'gâteau basque', 'страна басков', 'заварной крем', 'чёрная вишня итксасу', 'песочное тесто'],
    date: '2026-07-07',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Gateau_basque',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT45M', cookTime: 'PT40M', yield: '1 пирог 22 см / 8 порций',
      ingredients: ['Мука Т55 — 300 г', 'Сахарный песок — 200 г', 'Мягкое сливочное масло — 120 г', 'Яйцо — 1 шт плюс 1 желток', 'Тан-пур-тан (миндаль/сахар) — 40 г', 'Разрыхлитель — 8 г', 'Молоко — 250 мл', 'Стручок ванили — 1 шт', 'Тёмный ром — 1 ст. л.', 'Конфитюр из чёрной вишни Итксасу — 200 г']
    },
    faq: [
      { question: 'В чём разница между гато баск с кремом и с вишней?', answer: 'Это две канонические версии одного пирога. С заварным кремом (crème pâtissière) — считается исторически более «домашним» вариантом; с конфитюром из чёрной вишни Итксасу — праздничным. Баски полушутя говорят, что настоящий гато баск — с кремом, а вишнёвый «для туристов».' },
      { question: 'Какая вишня нужна для начинки?', answer: 'Чёрная вишня Итксасу (cerise noire d\'Itxassou) — местный сорт из деревни Итксассу, из которого варят густой тёмный конфитюр. Классический сорт для варенья — beltxa, поспевающий в середине июня.' },
      { question: 'Почему тесто трудно раскатывать?', answer: 'Тесто гато баск жирное и мягкое из-за большого количества масла и сахара. Его обязательно охлаждают минимум 40 минут, а часто распределяют по форме руками, а не скалкой.' }
    ]
  },

  {
    id: 'recipe-kouglof',
    title: 'Кугельхопф: эльзасская бриошь-корона с изюмом и киршем',
    excerpt: 'Кугельхопф — праздничная бриошь Эльзаса в форме короны: дрожжевое тесто, изюм в кирше и миндаль. История, рецептура и техника выпечки в глиняной форме.',
    content: body('Кугельхопф: эльзасская бриошь-корона с и', 'recipe-kouglof'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Wikipédia, Visit Alsace',
    readTime: 6,
    image: '/images/articles/recipe-kouglof.webp',
    tags: ['кугельхопф', 'kouglof', 'эльзас', 'дрожжевое тесто', 'изюм в кирше', 'бриошь'],
    date: '2026-07-10',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Kougelhopf',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT45M', yield: '1 кугельхопф на 8 порций',
      ingredients: ['Мука — 500 г', 'Мягкое сливочное масло — 180 г', 'Сахар — 75 г', 'Яйцо — 2 шт', 'Тёплое молоко — 250 мл', 'Свежие дрожжи — 20 г', 'Изюм — 100 г', 'Кирш — 3 ст. л.', 'Целый миндаль — 12–16 шт', 'Соль — щепотка', 'Сахарная пудра — для отделки']
    },
    faq: [
      { question: 'Кугельхопф бывает сладким или солёным?', answer: 'И тем и другим. Классический вариант — сладкий, с изюмом и миндалём, к завтраку. Существует и солёная версия (kougelhopf salé) с копчёной грудинкой и грецкими орехами — её подают к аперитиву.' },
      { question: 'Чем замачивают изюм?', answer: 'Традиционно эльзасцы вымачивают изюм в кирше — вишнёвом бренди региона. Допустима замена на ром. Изюм берут сорта султана, малага или коринка.' },
      { question: 'Обязательна ли глиняная форма из Зуфленхайма?', answer: 'Не обязательна, но желательна. Глазурованная керамика из Зуфленхайма равномерно держит тепло и даёт характерную корочку и рельеф короны. Подойдёт и медная, металлическая или эмалированная форма — главное, обильно её смазать.' }
    ]
  },

  {
    id: 'recipe-saint-honore',
    title: 'Торт Сент-Оноре: рецепт и история французской классики',
    excerpt: 'Гато Сент-Оноре: подробный рецепт с кремом шибуст, историей кондитера Шибуста с улицы Сент-Оноре, техникой карамели и разбором ошибок пошагово.',
    content: body('Торт Сент-Оноре: рецепт и история францу', 'recipe-saint-honore'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Mercotte, Wikipédia France',
    readTime: 6,
    image: '/images/articles/recipe-saint-honore.webp',
    tags: ['сент-оноре', 'крем шибуст', 'заварное тесто', 'слоёное тесто', 'французские десерты', 'карамель'],
    date: '2026-06-03',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Saint-honor%C3%A9_(p%C3%A2tisserie',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT2H', cookTime: 'PT1H10M', yield: '1 торт 20 см / 8 порций',
      ingredients: ['Мука для слоёного теста 250 г', 'Масло сливочное турное 200 г', 'Вода 125 г', 'Заварное тесто мука 75 г', 'Яйца 3 шт', 'Молоко цельное 250 мл', 'Ваниль 1 стручок', 'Желтки 4 шт', 'Сахар 35 г', 'Кукурузный крахмал 10 г', 'Желатин 5 г', 'Сахар для карамели 200 г']
    },
    faq: [
      { question: 'Чем крем шибуст отличается от крема Сент-Оноре?', answer: 'Это один и тот же крем: заварной крем с желатином, облегчённый горячей итальянской меренгой. Классически им наполняют именно торт Сент-Оноре.' },
      { question: 'Какое тесто для основы правильное — слоёное или песочное?', answer: 'Изначально Шибуст использовал pâte brisée (песочное), сегодня чаще берут pâte feuilletée (слоёное). Оба варианта считаются аутентичными.' },
      { question: 'Почему карамель на профитролях тает и липнет?', answer: 'Карамель боится влаги холодильника. Собирайте торт в день подачи, не переваривайте карамель до тёмного и подавайте в течение нескольких часов.' }
    ]
  },

  {
    id: 'recipe-croquembouche',
    title: 'Крокембуш: рецепт башни из профитролей и карамели',
    excerpt: 'Крокембуш — французская пьес-монте из заварных профитролей на карамели. Рецепт, история от Антонена Карема, нугатин, техника карамели и разбор ошибок.',
    content: body('Крокембуш: рецепт башни из профитролей и', 'recipe-croquembouche'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Wikipédia France, Académie du Goût',
    readTime: 6,
    image: '/images/articles/recipe-croquembouche.webp',
    tags: ['крокембуш', 'пьес-монте', 'заварное тесто', 'профитроли', 'карамель', 'нугатин'],
    date: '2026-06-08',
    sourceUrl: 'https://www.meilleurduchef.com/fr/recette/piece-montee-choux.html',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT3H', cookTime: 'PT40M', yield: 'пирамида на 12-15 порций / около 100 профитролей',
      ingredients: ['Вода для теста 1 л', 'Соль 20 г', 'Масло сливочное 400 г', 'Мука 800 г', 'Яйца 16 шт', 'Молоко для крема 1 л', 'Сахар для карамели 500 г', 'Глюкозный сироп 200 г', 'Фондан для нугатин 300 г', 'Миндаль лепестками 150 г', 'Драже для декора 100 г']
    },
    faq: [
      { question: 'Что такое крокембуш и почему он так называется?', answer: 'Крокембуш (croque-en-bouche, \'хрустит во рту\') — французская пьес-монте: конус из заварных профитролей, скреплённых карамелью. Подают на свадьбах, крестинах и причастиях.' },
      { question: 'Можно ли собрать крокембуш заранее?', answer: 'Нет. Карамель боится влаги холодильника, поэтому пьес-монте собирают в день подачи. Карамель с глюкозой от 40% массы сахара держится максимум около 12 часов.' },
      { question: 'Зачем нужна нугатин в основании?', answer: 'Нугатин — карамель с миндалём — даёт прочный socle (основание) и устойчивость всей башне, а также служит декоративной подставкой для конуса.' }
    ]
  },

  {
    id: 'recipe-profiteroles',
    title: 'Профитроли: рецепт заварных choux с мороженым и шоколадом',
    excerpt: 'Профитроли: подробный рецепт pâte à choux, ванильного мороженого и горячего соуса шоколад. История десерта, техника заварного теста и разбор ошибок.',
    content: body('Профитроли: рецепт заварных choux с моро', 'recipe-profiteroles'),
    category: 'recipes',
    author: 'Académie du Goût, Meilleur du Chef, Chef Simon, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-profiteroles.webp',
    tags: ['профитроли', 'pâte à choux', 'заварное тесто', 'французские десерты', 'соус шоколад', 'choux'],
    date: '2026-06-13',
    sourceUrl: 'https://www.academiedugout.fr/articles/les-profiteroles_2303',
    sourceLabel: 'Académie du Goût',
    recipeData: {
      prepTime: 'PT45M', cookTime: 'PT35M', yield: '20 профитролей (6 порций)',
      ingredients: ['Вода 125 г', 'Молоко цельное 125 г', 'Сливочное масло 100 г', 'Мука Т55 165 г', 'Яйца взбитые 250 г', 'Соль щепотка', 'Ванильное мороженое 500 г', 'Тёмный шоколад 200 г', 'Молоко для соуса 200 г']
    },
    faq: [
      { question: 'Чем наполняют профитроли — мороженым или кремом?', answer: 'Классически ванильным мороженым на основе crème anglaise. По Académie du Goût, до формы 1875 года choux чаще наполняли кремом шантийи и подавали без соуса; допустим и заварной крем.' },
      { question: 'Почему профитроли оседают после выпечки?', answer: 'Либо тесто недостаточно подсушено и в него введено слишком много яйца, либо духовку открыли слишком рано. Сушите panade до плёнки на дне и не открывайте дверцу в начале выпечки.' },
      { question: 'Как приготовить соус шоколад для профитролей?', answer: 'По рецепту Meilleur du Chef, залейте кусочки тёмного шоколада горячим молоком, дайте постоять минуту и размешайте венчиком; для сливочной текстуры замените половину молока сливками 35 % и держите тёплым на водяной бане.' }
    ]
  },

  {
    id: 'recipe-mont-blanc',
    title: 'Мон-Блан: рецепт десерта из каштанов, меренги и шантийи',
    excerpt: 'Мон-Блан (Mont-Blanc marron): рецепт десерта Angelina из меренги, крема шантийи и вермишели crème de marrons. История, техника и частые ошибки.',
    content: body('Мон-Блан: рецепт десерта из каштанов, ме', 'recipe-mont-blanc'),
    category: 'recipes',
    author: 'Angelina Paris, Meilleur du Chef, Chef Simon, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-mont-blanc.webp',
    tags: ['мон блан', 'Mont-Blanc', 'crème de marrons', 'каштановый десерт', 'меренга', 'Angelina'],
    date: '2026-06-18',
    sourceUrl: 'https://www.angelina-paris.fr/notre-savoir-faire',
    sourceLabel: 'Angelina Paris',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT1H30M', yield: '6 индивидуальных Мон-Блан',
      ingredients: ['Яичные белки 4 шт', 'Сахар-песок 240 г', 'Сливки 30-35% 250 г', 'Сахарная пудра 30 г', 'Ваниль 1 стручок', 'Crème de marrons 200 г', 'Pâte de marrons 150 г', 'Сливочное масло 40 г', 'Ром 1 ст.л.', 'Сахарная пудра для отделки']
    },
    faq: [
      { question: 'В чём разница между crème de marrons и purée de châtaignes?', answer: 'Crème de marrons сладкая, а purée de châtaignes — нет. По Википедии, чем больше сахара, тем темнее масса; без сахара это светло-бежевое несладкое пюре. Крем изобрёл Клеман Фожье в 1885 году.' },
      { question: 'Почему меренга у Мон-Блана размякает?', answer: 'Меренга гигроскопична и быстро вбирает влагу из крема шантийи. Собирайте десерт перед подачей и присыпайте влагостойкой сахарной пудрой.' },
      { question: 'Какой насадкой делают каштановую вермишель?', answer: 'Специальной насадкой-«вермишель» с несколькими отверстиями диаметром 3–4 мм. Каштановую массу перед этим доводят до полной однородности, чтобы нити не рвались.' }
    ]
  },

  {
    id: 'recipe-ile-flottante',
    title: 'Île flottante: плавающий остров, англез, безе и карамель',
    excerpt: 'Île flottante — французский плавающий остров: взбитые белки на ванильном крем-англез с карамелью и миндалём. Отличие от œufs à la neige, техника варки крема 82-85°C и разбор ошибок.',
    content: body('Île flottante: плавающий остров, англез,', 'recipe-ile-flottante'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Académie du Goût, Néorestauration',
    readTime: 7,
    image: '/images/articles/recipe-ile-flottante.webp',
    tags: ['île flottante', 'плавающий остров', 'œufs à la neige', 'крем англез', 'французские десерты', 'карамель'],
    date: '2026-06-23',
    sourceUrl: 'https://fr.wikipedia.org/wiki/%C5%92ufs_%C3%A0_la_neige',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT30M', cookTime: 'PT15M', yield: '4 порции',
      ingredients: ['Молоко цельное 500 мл', 'Стручок ванили 1 шт', 'Яичные желтки 6 шт', 'Сахар для англеза 75 г', 'Яичные белки 6 шт', 'Сахар для белков 50 г', 'Щепотка соли', 'Сахар для карамели 80 г', 'Вода 30 мл', 'Миндальные лепестки 30 г']
    },
    faq: [
      { question: 'Чем île flottante отличается от œufs à la neige?', answer: 'Разница только в способе приготовления взбитых белков: для œufs à la neige их формуют ложкой и отваривают (pochage) в едва кипящем молоке, а для île flottante выкладывают в форму и запекают в духовке на водяной бане. Крем-англез и карамель у обоих одинаковы.' },
      { question: 'При какой температуре готовить крем-англез?', answer: 'Крем-англез варят на медленном огне до 82-85°C. Точка свёртывания желтка — 85°C, но с огня снимают на 82-83°C, так как крем доходит по инерции. Выше 86°C белок сворачивается и крем идёт крупкой.' },
      { question: 'Что делать, если крем-англез свернулся?', answer: 'Пробейте его погружным блендером 20-30 секунд — лопасти разобьют комочки и заново эмульгируют крем, затем процедите через мелкое сито (chinois). Приём спасает при небольшом перегреве.' }
    ]
  },

  {
    id: 'recipe-dacquoise',
    title: 'Дакуаз (Dacquoise): миндальный бисквит-основа для антреме',
    excerpt: 'Дакуаз (dacquoise) — французский миндально-ореховый бисквит-безе на основе tant pour tant. История из города Дакс, техника взбивания, отсадки и выпечки при 170°C, разбор ошибок.',
    content: body('Дакуаз (Dacquoise): миндальный бисквит-о', 'recipe-dacquoise'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Académie du Goût, Mercotte',
    readTime: 7,
    image: '/images/articles/recipe-dacquoise.webp',
    tags: ['дакуаз', 'dacquoise', 'бисквит дакуаз', 'tant pour tant', 'антреме', 'французские десерты'],
    date: '2026-06-28',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Dacquoise_(p%C3%A2tisserie',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT25M', cookTime: 'PT16M', yield: '2 диска 20 см',
      ingredients: ['Яичные белки 3 шт (100 г)', 'Миндальная мука 100 г', 'Сахарная пудра 80 г', 'Сахар-песок 30 г', 'Мука 20 г', 'Щепотка соли', 'Сахарная пудра для обсыпки 20 г', 'Фундучная мука (вариант) 60 г']
    },
    faq: [
      { question: 'Что такое tant pour tant в дакуазе?', answer: 'Tant pour tant — «столько на столько», равные по весу части ореховой (миндальной или фундучной) муки и сахарной пудры. Их смешивают, просеивают вместе и вмешивают во французское безе. Это база текстуры и вкуса дакуаза.' },
      { question: 'Чем дакуаз отличается от бисквита сюксе (succès)?', answer: 'Оба — меренговые бисквиты с ореховой пудрой. Дакуаз классически делают на фундуке и часто с щепоткой муки: он пышнее, с трескучей корочкой и мягкой серединкой, но менее хрустящий. Сюксе делают на миндале, он более хрустящий; прогрес (progrès) — версия пополам миндаль и фундук.' },
      { question: 'При какой температуре и сколько выпекать дакуаз?', answer: 'Диски пекут в духовке с конвекцией при 170°C около 14-16 минут до золотистой корочки, оставляя середину мягкой. Пласт в рамке можно печь при 190°C 10-12 минут. Приоткрытая дверца выпускает пар и не даёт бисквиту опасть.' }
    ]
  },

  {
    id: 'recipe-flan-parisien',
    title: 'Флан патисье: нежный парижский заварной тарт из булочной',
    excerpt: 'Флан патисье, он же флан паризьен: история от средневекового flaon, точная рецептура на молоке и майзене, выпечка в два жара и разбор частых ошибок.',
    content: body('Флан патисье: нежный парижский заварной ', 'recipe-flan-parisien'),
    category: 'recipes',
    author: 'Meilleur du Chef, Académie du Goût, Chef Simon, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-flan-parisien.webp',
    tags: ['флан', 'флан патисье', 'флан паризьен', 'французская выпечка', 'заварной крем', 'парижский тарт'],
    date: '2026-06-05',
    sourceUrl: 'https://www.meilleurduchef.com/en/recipe/parisian-flan.html',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT45M', cookTime: 'PT50M', yield: '1 тарт 26 см / 8 порций',
      ingredients: ['молоко цельное 650 мл', 'сахар 160 г', 'яйца средние 3 шт', 'кукурузный крахмал (майзена) 55 г', 'стручок ванили 1 шт', 'мука для теста 250 г', 'сливочное масло 125 г', 'яйцо для теста 1 шт', 'соль щепотка']
    },
    faq: [
      { question: 'Какое тесто выбрать — бризе или слоёное?', answer: 'В булочных парижский флан чаще пекут на pâte brisée: песочная основа держит влажную начинку и меньше размокает. Feuilletée даёт более хрусткий, но капризный вариант, который легче пропитать.' },
      { question: 'Что даёт кремовость — крахмал или сливки?', answer: 'Классика — кукурузный крахмал (майзена). Alain Ducasse берёт poudre à crème, а Cyril Lignac добавляет сливки и лишние желтки ради более нежной, тающей текстуры.' },
      { question: 'Сколько времени остужать флан?', answer: 'Минимум 2 часа при комнатной температуре, затем в холодильник, в идеале на ночь. Так начинка окончательно стабилизируется и режется чистым ломтем.' }
    ]
  },

  {
    id: 'recipe-palmiers',
    title: 'Пальмье: французское печенье-сердечко из 2 ингредиентов',
    excerpt: 'Пальмье — французское печенье из слоёного теста и сахара. Разбираем историю названия, формовку сердечком, температуру выпечки и типичные ошибки.',
    content: body('Пальмье: французское печенье-сердечко из', 'recipe-palmiers'),
    category: 'recipes',
    author: 'Chef Simon, Meilleur du Chef, 750g',
    readTime: 6,
    image: '/images/articles/recipe-palmiers.webp',
    tags: ['пальмье', 'слоёное тесто', 'французская выпечка', 'печенье', 'pâte feuilletée', 'карамелизация'],
    date: '2026-06-10',
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/petits-palmiers',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT30M', cookTime: 'PT16M', yield: '20-24 пальмье',
      ingredients: ['Слоёное тесто (pâte feuilletée) 250 г', 'Сахар кристаллический (sucre cristallisé) 120 г', 'Сахар коричневый (cassonade) 30 г', 'Сахар ванильный 1 пакетик', 'Яичный желток 1 шт', 'Вода 1 ч. л.']
    },
    faq: [
      { question: 'Почему пальмье называют «сердечками» и «слоновьими ушами»?', answer: 'Из-за формы: нарезанный двойной рулет при выпечке раскрывается в силуэт сердца или пальмового листа. Отсюда palmier (пальмовый лист), oreilles d\'éléphant («слоновьи уши») и Cœur de France.' },
      { question: 'Какой сахар лучше для пальмье?', answer: 'Крупный кристаллический (sucre cristallisé): он даёт блестящую золотистую карамель и не растворяется в тесте раньше времени. Cassonade добавляет карамельный оттенок, но легче подгорает.' },
      { question: 'Почему пальмье нужно переворачивать во время выпечки?', answer: 'Чтобы сахар карамелизовался с обеих сторон. В середине выпечки (à mi-cuisson) печенье переворачивают лопаткой и допекают до золотистого цвета второй грани.' }
    ]
  },

  {
    id: 'recipe-brioche',
    title: 'Бриошь: французская масляная сдоба, рецепт и техника',
    excerpt: 'Бриошь — французское сдобное тесто на сливочном масле и яйцах. История, рецептура, замес до тонкой клейковины, формовка à tête и Nanterre, ошибки.',
    content: body('Бриошь: французская масляная сдоба, реце', 'recipe-brioche'),
    category: 'recipes',
    author: 'Mercotte, Meilleur du Chef, Chef Simon',
    readTime: 6,
    image: '/images/articles/recipe-brioche.webp',
    tags: ['бриошь', 'brioche', 'дрожжевое тесто', 'французская выпечка', 'виеннуазери', 'brioche à tête'],
    date: '2026-06-15',
    sourceUrl: 'https://www.mercotte.fr/quelques-conseils-utiles-pour-les-pates-levees-surtout-les-brioches/',
    sourceLabel: 'Mercotte',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT30M', yield: '1 большая бриошь (8-10 порций)',
      ingredients: ['Мука T45 500 г', 'Яйца 300 г (6 шт)', 'Сливочное масло 200 г', 'Молоко 50 г', 'Сахар 50 г', 'Дрожжи свежие 25 г', 'Соль 10 г', 'Яйцо для смазки 1 шт']
    },
    faq: [
      { question: 'Правда ли, что Мария-Антуанетта сказала «Пусть едят бриошь»?', answer: 'Скорее легенда. Фразу «Qu\'ils mangent de la brioche» записал Руссо в «Исповеди» (закончена около 1769, издана 1782) о безымянной «великой принцессе»; Мария-Антуанетта тогда ещё не жила во Франции. Историки считают приписывание ошибочным.' },
      { question: 'Когда добавлять масло в тесто для бриоши?', answer: 'Только после того как тесто вымесилось и начало отходить от стенок дежи. Масло вводят мягким (pommade) в 1-2 приёма и долго вымешивают. Раннее масло мешает развитию клейковины и брожению.' },
      { question: 'Почему бриошь получается плотной, а масло вытекает?', answer: 'Чаще всего тесто перегрелось: при температуре выше 24-25°C масло «выпотевает». Плотный мякиш даёт слабая расстойка или короткий замес. Держите тесто и масло прохладными, вымешивайте до теста «в окно».' }
    ]
  },

  {
    id: 'recipe-tarte-aux-pommes',
    title: 'Тарт с яблоками: французская классика с компоте и веером',
    excerpt: 'Классический французский тарт с яблоками: песочное тесто, слой компоте, яблоки веером и абрикосовый нáппаж. Пошаговый рецепт, выбор сортов и типичные ошибки.',
    content: body('Тарт с яблоками: французская классика с ', 'recipe-tarte-aux-pommes'),
    category: 'recipes',
    author: 'Chef Simon, Meilleur du Chef, Académie du Goût, 750g',
    readTime: 6,
    image: '/images/articles/recipe-tarte-aux-pommes.webp',
    tags: ['тарт с яблоками', 'tarte aux pommes', 'французская выпечка', 'песочное тесто', 'компоте', 'десерт с яблоками'],
    date: '2026-06-20',
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/tarte-fine-aux-pommes--13',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT45M', yield: '1 тарт 26 см (8 порций)',
      ingredients: ['Пшеничная мука T55 — 250 г', 'Сливочное масло в тесто — 125 г', 'Желток — 1 шт', 'Сахарная пудра — 12 г', 'Холодная вода — 50 мл', 'Яблоки (рен, голден) — 900 г', 'Сахар (компоте и посыпка) — 60 г', 'Стручок ванили — 1 шт', 'Абрикосовый конфитюр для нáппажа — 3 ст. л.', 'Масло для карамелизации — 20 г', 'Соль — 1 щепотка']
    },
    faq: [
      { question: 'Какие яблоки лучше для тарта с яблоками?', answer: 'Ароматные сорта, которые держат форму при выпечке: рен де ренет (reine des reinettes), бель де боскоп, гренни смит. Голден универсальна и доступна круглый год. Идеально сочетать сладкий сорт с более кислым.' },
      { question: 'Зачем под яблоками нужен слой компоте?', answer: 'Компоте защищает тесто от сока свежих яблок, помогая дну остаться хрустящим, и добавляет вкус и влажность. Наносят ровным слоем 3–5 мм по наколотому дну.' },
      { question: 'Чем tarte aux pommes отличается от тарта Татен?', answer: 'Классический тарт печётся тестом вниз, яблоки уложены веером сверху. Тарт Татен — перевёрнутый: карамелизованные яблоки внизу, тесто сверху, после выпечки тарт переворачивают.' }
    ]
  },

  {
    id: 'recipe-sables-diamant',
    title: 'Сабле диаман: французское печенье с хрустящим сахарным краем',
    excerpt: 'Сабле диаман (sablés diamant) — французское песочное печенье с блестящим сахарным краем. Рецепт в духе Фельдера и Эрме: крем-масло, ваниль, обвалка, выпечка.',
    content: body('Сабле диаман: французское печенье с хрус', 'recipe-sables-diamant'),
    category: 'recipes',
    author: 'Christophe Felder, Pierre Hermé, Mercotte, Chef Simon',
    readTime: 6,
    image: '/images/articles/recipe-sables-diamant.webp',
    tags: ['сабле диаман', 'sablés diamant', 'песочное печенье', 'французская выпечка', 'печенье с сахаром', 'ваниль'],
    date: '2026-06-25',
    sourceUrl: 'https://www.mercotte.fr/2021/09/19/sables-diamant-a-la-noisette-et-aux-eclats-de-noisettes-caramelises/',
    sourceLabel: 'Christophe Felder',
    recipeData: {
      prepTime: 'PT30M', cookTime: 'PT15M', yield: 'около 30 печений (2 колбаски)',
      ingredients: ['Сливочное масло мягкое — 150 г', 'Сахарная пудра — 60 г', 'Желток — 1 шт', 'Стручок ванили — 1 шт', 'Пшеничная мука T55 — 220 г', 'Соль (fleur de sel) — 1 щепотка', 'Кристаллический сахар для обвалки — 50 г', 'Белок для смазки — 1 шт']
    },
    faq: [
      { question: 'Почему печенье называется диаман (diamant)?', answer: 'Из-за обвалки колбаски теста в кристаллическом сахаре: после выпечки крупные кристаллы по краю блестят и хрустят, напоминая грани бриллианта.' },
      { question: 'Почему сабле расплываются при выпечке?', answer: 'Чаще всего масло было слишком мягким или тесто не отдохнуло на холоде. Виноваты также недогретая духовка и избыток сахара. Охлаждайте тесто минимум 1 час и пеките при 170 °C.' },
      { question: 'Какой сахар нужен для края — пудра или кристаллический?', answer: 'Для обвалки берут именно кристаллический сахар (sucre cristal): его крупные грани дают хруст и блеск. Сахарная пудра идёт только в тесто, в крем-масло.' }
    ]
  },

  {
    id: 'recipe-merveilleux',
    title: 'Мервейё (Merveilleux): меренга, крем и шоколадная стружка',
    excerpt: 'Мервейё (merveilleux) — десерт Севера Франции и Бельгии: две коржа французской меренги, взбитый шоколадный крем и стружка шоколада. История Фредерика Вокампа, рецептура и техника.',
    content: body('Мервейё (Merveilleux): меренга, крем и ш', 'recipe-merveilleux'),
    category: 'recipes',
    author: 'Chef Simon, Meilleur du Chef, Wikipédia, Académie du Goût',
    readTime: 7,
    image: '/images/articles/recipe-merveilleux.webp',
    tags: ['мервейё', 'merveilleux', 'французская меренга', 'взбитые сливки', 'шоколадная стружка', 'aux merveilleux de fred'],
    date: '2026-06-30',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Merveilleux_(g%C3%A2teau',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT90M', yield: '8 пирожных',
      ingredients: ['Яичные белки 4 шт (120 г)', 'Сахар-песок 200 г', 'Сахарная пудра 50 г', 'Сливки 30-35% (crème fleurette) 400 мл', 'Маскарпоне (по желанию) 200 г', 'Тёмный шоколад для крема 150 г', 'Сахарная пудра для крема 30 г', 'Тёмный шоколад для стружки 200 г', 'Стручок ванили 1 шт', 'Щепотка соли']
    },
    faq: [
      { question: 'Из чего состоит классический мервейё?', answer: 'Мервейё — это две коржа сухой французской меренги, склеенные и полностью обмазанные взбитым кремом (часто шоколадным крем-шантийи), а затем обвалянные в стружке тёмного шоколада. В бельгийской версии крем — простые взбитые сливки, а сверху кладут коктейльную вишню.' },
      { question: 'Кто придумал мервейё?', answer: 'Сам десерт родился, по легенде в XIX веке, во Фландрии между Севером Франции и Бельгией. Всемирную известность ему принёс кондитер Фредерик Вокамп: в 1985 году он взял дело в Азбруке, а в 1997-м открыл первую лавку Aux Merveilleux de Fred в Старом Лилле, заменив масляный крем на лёгкий шантийи.' },
      { question: 'Почему меренга для мервейё получается мягкой и липкой?', answer: 'Меренгу не высушили до конца или собрали пирожные заранее. Коржи сушат при 90°C около 1ч30 до полной сухости, хранят в сухом месте и собирают мервейё как можно ближе к подаче, потому что крем быстро увлажняет меренгу.' }
    ]
  },

  {
    id: 'recipe-quatre-quarts',
    title: 'Катр-кар бретонский: кекс из четырёх равных частей',
    excerpt: 'Катр-кар (quatre-quarts) — бретонский кекс из равных долей масла, сахара, яиц и муки. Правило веса яиц, солёное масло Бретани, техника кремажа и разбор ошибок.',
    content: body('Катр-кар бретонский: кекс из четырёх рав', 'recipe-quatre-quarts'),
    category: 'recipes',
    author: 'Meilleur du Chef, Chef Simon, Académie du Goût, Recettes Bretonnes',
    readTime: 6,
    image: '/images/articles/recipe-quatre-quarts.webp',
    tags: ['катр-кар', 'quatre-quarts', 'бретонский кекс', 'солёное масло', 'вес яиц', 'французская выпечка'],
    date: '2026-07-02',
    sourceUrl: 'https://www.meilleurduchef.com/fr/recette/quatre-quarts.html',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT20M', cookTime: 'PT45M', yield: '1 кекс / 8 порций',
      ingredients: ['Яйца 3 шт (около 175 г без скорлупы)', 'Сахар 175 г', 'Мука 175 г', 'Сливочное масло (в Бретани солёное) 175 г', 'Разрыхлитель (по желанию) 6 г', 'Ванильный сахар 1 пакетик', 'Ром тёмный (по желанию) 1 ст. л.', 'Щепотка соли']
    },
    faq: [
      { question: 'Что означает название «катр-кар»?', answer: 'Quatre-quarts значит «четыре четверти»: кекс состоит из равных по весу долей четырёх продуктов — сливочного масла, сахара, яиц и муки, каждый по четверти от общей массы. Отсюда и легендарная простота рецепта.' },
      { question: 'Что такое правило «веса яиц»?', answer: 'Сначала взвешивают яйца (по бретонской традиции без скорлупы), а затем берут ровно столько же по весу сахара, муки и масла. Например, три яйца дают около 175 г — значит, всех остальных ингредиентов тоже по 175 г.' },
      { question: 'Почему катр-кар получается плотным и сухим?', answer: 'Плотность — от недостаточного взбивания: в тесто не вбили воздух, либо муку вмешали грубо и осадили пузырьки. Сухость — от слишком горячей духовки или передержки. Пеките при 160-170°C и не уменьшайте сахар: он удерживает влагу.' }
    ]
  },

  {
    id: 'recipe-gougeres',
    title: 'Гужеры (Gougères): бургундское заварное тесто с сыром',
    excerpt: 'Гужеры (gougères) — классика Бургундии: солёное заварное тесто пат-а-шу с сыром комте или грюйер. Рецепт, точные пропорции, техника дессеша и разбор ошибок.',
    content: body('Гужеры (Gougères): бургундское заварное ', 'recipe-gougeres'),
    category: 'french-cuisine',
    author: 'Chef Simon, Meilleur du Chef, Academie du Gout, France.fr',
    readTime: 6,
    image: '/images/articles/recipe-gougeres.webp',
    tags: ['гужеры', 'gougères', 'пат-а-шу', 'бургундская кухня', 'закуска к вину', 'заварное тесто'],
    date: '2026-07-05',
    sourceUrl: 'https://fr.wikipedia.org/wiki/Gougère',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT30M', cookTime: 'PT25M', yield: '25-30 гужер (или 1 корона)',
      ingredients: ['Вода 250 мл', 'Сливочное масло 90 г', 'Мука 150 г', 'Яйца 4 шт', 'Комте или грюйер тёртый 150 г', 'Соль 1 щепотка', 'Мускатный орех щепотка', 'Яичный желток для смазки 1 шт']
    },
    faq: [
      { question: 'Какой сыр брать для гужер?', answer: 'Сыр варёно-прессованного типа (a pate pressee cuite): комте, грюйер, эмменталь или бофор. Со времён XIX века эталоном считают комте и грюйер — они плавятся, не расслаиваясь, и держат вкус.' },
      { question: 'Почему гужеры опадают после выпечки?', answer: 'Чаще всего тесто было недосушено (слишком влажная panade) или духовку открыли раньше времени. Хорошо подсушивайте тесто на огне, не открывайте духовку первые 15 минут, а последние 3 минуты досушивайте с приоткрытой дверцей.' },
      { question: 'Гужеры едят тёплыми или холодными?', answer: 'И так, и так. В бургундских погребах на дегустациях вина их подают холодными или комнатной температуры, а как аперитивную закуску прямо из духовки ценят за хруст.' }
    ]
  },

  {
    id: 'recipe-tarte-tropezienne',
    title: 'Тарт тропезьен: бриошь Сен-Тропе с кремом мусселин',
    excerpt: 'Тарт тропезьен: история от Александра Мика и Брижит Бардо, рецепт мягкой бриоши с сахаром в зёрнах, крем мусселин, сборка и разбор частых ошибок.',
    content: body('Тарт тропезьен: бриошь Сен-Тропе с кремо', 'recipe-tarte-tropezienne'),
    category: 'recipes',
    author: 'Meilleur du Chef, Encore un Gâteau, La Tarte Tropézienne, Wikipédia',
    readTime: 6,
    image: '/images/articles/recipe-tarte-tropezienne.webp',
    tags: ['тропезьен', 'тарт тропезьен', 'бриошь', 'крем мусселин', 'Сен-Тропе', 'французская выпечка'],
    date: '2026-07-08',
    sourceUrl: 'https://www.meilleurduchef.com/fr/recette/tropezienne.html',
    sourceLabel: 'Meilleur du Chef',
    recipeData: {
      prepTime: 'PT2H', cookTime: 'PT30M', yield: '1 тарт 22 см / 8 порций',
      ingredients: ['мука T45 250 г', 'свежие дрожжи 10 г', 'молоко 100 мл', 'яйцо 1 шт', 'сахар 30 г', 'соль 5 г', 'сливочное масло 90 г (тесто)', 'крупный жемчужный сахар для верха', 'молоко 400 мл (крем)', 'сахар 200 г и крахмал 60 г (крем)', 'яйца 2 шт плюс желток', 'сливочное масло 200 г и флёрдоранж 2 ст.л.']
    },
    faq: [
      { question: 'Кто придумал тарт тропезьен?', answer: 'Кондитер польского происхождения Александр Мика в Сен-Тропе в середине 1950-х. По легенде, имя десерту предложила Брижит Бардо на съёмках фильма «И Бог создал женщину». Марка зарегистрирована в 1973 году.' },
      { question: 'Какой крем настоящий — мусселин или дипломат?', answer: 'У Мика это смесь заварного крема и крема на масле. Сегодня чаще берут crème mousseline (пâтissière плюс масло) или более лёгкий crème diplomate (пâтissière плюс взбитые сливки).' },
      { question: 'Почему бриошь плохо поднимается?', answer: 'Обычно молоко было слишком горячим и убило дрожжи либо в тесте оказалось много муки. Дайте медленную расстойку в тепле до 30°C с мисочкой воды для влажности.' }
    ]
  },

  {
    id: 'recipe-tuiles-amandes',
    title: 'Тюиль (Tuiles aux amandes): тонкое миндальное печенье',
    excerpt: 'Тюиль (tuiles aux amandes) — тонкое хрустящее миндальное печенье, изогнутое как черепица. Классический рецепт, точные пропорции, техника формовки и разбор ошибок.',
    content: body('Тюиль (Tuiles aux amandes): тонкое минда', 'recipe-tuiles-amandes'),
    category: 'recipes',
    author: 'Chef Simon, Meilleur du Chef, 750g, Academie du Gout',
    readTime: 5,
    image: '/images/articles/recipe-tuiles-amandes.webp',
    tags: ['тюиль', 'tuiles aux amandes', 'миндальное печенье', 'петифур', 'французская выпечка', 'миндальные лепестки'],
    date: '2026-07-09',
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/tuiles-aux-amandes--8',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT20M', cookTime: 'PT10M', yield: 'около 30 тюилей',
      ingredients: ['Яичные белки 2 шт', 'Сахарная пудра 100 г', 'Мука 50 г', 'Сливочное масло 35 г', 'Миндальные лепестки 80 г', 'Соль 1 щепотка', 'Ванильный экстракт несколько капель']
    },
    faq: [
      { question: 'Почему печенье называется тюиль?', answer: 'От французского tuile — кровельная черепица. Остывая, горячую пластинку укладывают на округлую форму, и она застывает дугой, напоминая глиняную черепицу с крыш южной Франции.' },
      { question: 'Обязательно ли охлаждать тесто перед выпечкой?', answer: 'Необязательно — например, Chef Simon выпекает сразу. Но отдых теста в холоде даёт более ровную толщину: растопленное масло застывает, и тюили выходят тоньше и однороднее.' },
      { question: 'Как сохранить хруст тюилей?', answer: 'Держите их в герметичной коробке в сухом и не слишком тёплом месте. Тюили впитывают влагу из воздуха и размягчаются; если это случилось, верните хруст, подсушив их пару минут в духовке.' }
    ]
  },

  {
    id: 'recipe-crepes-suzette',
    title: 'Крепы сюзетт: апельсиновый соус, бёр сюзетт и фламбе',
    excerpt: 'Крепы сюзетт: история из Монте-Карло, спор Шарпантье и Эскофье, классический бёр сюзетт на апельсине и ликёре, техника фламбе у стола и разбор частых ошибок.',
    content: body('Крепы сюзетт: апельсиновый соус, бёр сюз', 'recipe-crepes-suzette'),
    category: 'recipes',
    author: 'Auguste Escoffier, Chef Simon, Meilleur du Chef, Philippe Etchebest',
    readTime: 8,
    image: '/images/articles/recipe-crepes-suzette.webp',
    tags: ['крепы сюзетт', 'crêpes suzette', 'французские блинчики', 'бёр сюзетт', 'фламбе', 'апельсиновый соус'],
    date: '2026-06-02',
    sourceUrl: 'https://www.assiettesgourmandes.fr/2013/01/desserts/crepes-suzette-la-vraie-recette-dauguste-escoffier/',
    sourceLabel: 'Auguste Escoffier',
    recipeData: {
      prepTime: 'PT40M', cookTime: 'PT20M', yield: '12-16 блинчиков / 4 порции',
      ingredients: ['мука 250 г', 'яйца 3 шт', 'молоко 500 мл', 'сахар для теста 40 г', 'апельсины 2-3 шт', 'сахар для соуса 80 г', 'сливочное масло 80 г', 'цедра апельсина 1 шт', 'Grand Marnier или куантро 10 cl', 'щепотка соли']
    },
    faq: [
      { question: 'Чем фламбировать крепы сюзетт?', answer: 'Апельсиновым ликёром крепостью около 40°: Grand Marnier или Cointreau, исторически curaçao. Наливайте порцию в металлический половник, а не из бутылки, слегка подогрейте и поджигайте сбоку от сковороды.' },
      { question: 'Обязательно ли фламбировать?', answer: 'Нет. В оригинале Эскофье (Guide culinaire, 1903) крепы сюзетт не фламбировали: блинчик пропитывали бёр сюзетт и прогревали. Огонь у стола добавили позже ради зрелища и аромата.' },
      { question: 'Почему апельсиновый соус горчит?', answer: 'Из-за перегрева. Работайте на умеренном огне, не давайте маслу подрумяниться и не пережигайте карамель, иначе цитрусовые ноты уходят и появляется горечь.' }
    ]
  },

  {
    id: 'recipe-financiers',
    title: 'Финансье: миндальные пирожные-слитки на бёр нуазет',
    excerpt: 'Финансье — французские миндальные пирожные в форме слитка. Разбираем бёр нуазет, точные пропорции, невзбитые белки, температуру выпечки и типичные ошибки.',
    content: body('Финансье: миндальные пирожные-слитки на ', 'recipe-financiers'),
    category: 'recipes',
    author: 'Chef Simon, Mercotte, Alain Ducasse, Meilleur du Chef',
    readTime: 8,
    image: '/images/articles/recipe-financiers.webp',
    tags: ['финансье', 'бёр нуазет', 'миндальная мука', 'французская выпечка', 'visitandines', 'пирожные к чаю'],
    date: '2026-06-07',
    sourceUrl: 'https://chefsimon.com/gourmets/chef-simon/recettes/financiers--14',
    sourceLabel: 'Chef Simon',
    recipeData: {
      prepTime: 'PT25M', cookTime: 'PT15M', yield: '12-16 финансье',
      ingredients: ['Сливочное масло для бёр нуазет 150 г', 'Сахарная пудра 150 г', 'Миндальная мука 100 г', 'Мука пшеничная 60 г', 'Яичные белки 4 шт (~140 г)', 'Мёд 15 г', 'Ваниль 1/2 стручка', 'Соль щепотка']
    },
    faq: [
      { question: 'Что такое финансье и почему у них форма слитка?', answer: 'Это маленькие миндальные пирожные на бёр нуазет и невзбитых белках. По распространённой версии форму слитка (lingot d\'or) им придал парижский кондитер Лан около 1890 года — в квартале биржи, для клиентов-финансистов.' },
      { question: 'Обязательно ли готовить бёр нуазет?', answer: 'Да, это ключ вкуса. Масло топят до орехового аромата и янтарного цвета: карамелизация молочных белков даёт те самые ноты жареного фундука, ради которых финансье и ценят.' },
      { question: 'Почему финансье получаются сухими и плоскими?', answer: 'Чаще всего из-за перепёка (лишние 2 минуты сушат мякиш) и вымешивания венчиком, который вбивает пузыри. Белки вводят невзбитыми лопаткой, а тесту дают отдохнуть в холоде.' }
    ]
  },

]
// ─── SEO defaults for article images ─────────────────────────────────────────
// Keep image metadata with the article object so React cards, JSON-LD, OpenGraph
// and the custom image sitemap all speak the same language. Editors can override
// any of these fields per article; these defaults prevent weak/empty alt text.
const stripBrand = (value: string) => value.replace(/\s+—\s+Patisserie Russe$/i, '').trim()
const short = (value: string, max = 92) => {
  const clean = stripBrand(value).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 48)).trim()}…`
}

function defaultImageTitle(article: Article) {
  return short(article.title, 80)
}

function defaultImageAlt(article: Article) {
  const tags = article.tags?.slice(0, 3).join(', ')
  if (article.category === 'recipes') {
    return `Французский десерт «${short(article.title, 58)}»: готовая подача, ключевые текстуры и техника ${tags ? `(${tags})` : ''}`.trim()
  }
  if (article.category === 'techniques') {
    return `Иллюстрация французской кондитерской техники «${short(article.title, 60)}»${tags ? `: ${tags}` : ''}`
  }
  if (article.category === 'histoire-culinaire') {
    return `Исторический материал о французской pâtisserie: «${short(article.title, 62)}»`
  }
  if (article.category === 'chiffres-gourmands') {
    return `Инфографичный визуал к аналитике французской кондитерской: «${short(article.title, 60)}»`
  }
  return `Французская кондитерская школа: визуал к материалу «${short(article.title, 68)}»${tags ? `(${tags})` : ''}`
}

function defaultImageCaption(article: Article) {
  if (article.category === 'recipes') {
    return `${short(article.title, 86)}. Визуальная привязка рецепта: подача, текстура и технологическая логика французской школы.`
  }
  if (article.category === 'techniques') {
    return `${short(article.title, 86)}. Иллюстрация к разбору техники, температур и ошибок.`
  }
  return `${short(article.title, 96)}. Материал библиотеки Patisserie Russe / Milovi School.`
}

function imageFileName(image: string | undefined) {
  if (!image) return undefined
  const clean = image.split('?')[0]
  return clean.startsWith('/images/articles/') ? clean.slice('/images/articles/'.length) : undefined
}

for (const article of articles) {
  article.imageTitle ??= defaultImageTitle(article)
  article.imageAlt ??= defaultImageAlt(article)
  article.imageCaption ??= defaultImageCaption(article)
  article.imageCredit ??= 'Patisserie Russe / Milovi School'

  // Keep SEO dimensions and the visible hero aspect ratio tied to the real file.
  // The previous blanket 1280×800 assumption was wrong for 1408×768 and portrait
  // images, so many heroes were cropped by a too-wide wrapper.
  const fileName = imageFileName(article.image)
  const dimensions = fileName ? articleImageDimensions[fileName] : undefined
  if (dimensions) {
    article.imageWidth ??= dimensions.width
    article.imageHeight ??= dimensions.height
  } else if (article.id === 'recipe-pecan-chocolate-creme-brulee') {
    // Vite-bundled fallback image in src/assets/pastry-pecan.jpg.
    article.imageWidth ??= 1296
    article.imageHeight ??= 864
  } else {
    article.imageWidth ??= 1280
    article.imageHeight ??= 800
  }
}

// ─── Metadata only (no content) — safe to send to the browser ───────────────
// Use this in React client islands to avoid shipping all 103 articles' content.
// Each article page receives its own full content as a static SSG prop.
export const articlesMeta: ArticleMeta[] = articles.map(({ content: _content, ...meta }) => meta)
