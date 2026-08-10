import { canonArticleContents } from './canonArticleContents'
import type { Article } from './types'

export const canonArticles: readonly Article[] = [
  {
    id: 'genin-tarte-au-citron-canon',
    title: 'Tarte au Citron Жака Жени: от ранней лимонной тарты к современной авторской точности',
    excerpt: 'Документированная история без мифа об изобретателе: ранняя транснациональная архитектура, французские свидетельства XIX века и авторизованная техника Jacques Genin к 2010 году.',
    content: canonArticleContents['genin-tarte-au-citron-canon'],
    category: 'jacques-genin',
    author: 'Éditions Alternatives, Jacques Genin, Le Monde, historical primary sources',
    readTime: 8,
    image: '/images/canon-sucre/tarte-au-citron.webp',
    imageAlt: 'Tarte au Citron — pâte sucrée fine et crème citron',
    imageTitle: 'Tarte au Citron — Le Canon Sucré',
    imageCaption: 'Tarte au Citron — современная авторская интерпретация внутри Le Canon Sucré.',
    imageCredit: 'Patisserie Russe / Le Canon Sucré — original generated editorial artwork',
    imageWidth: 1280,
    imageHeight: 800,
    tags: ['tarte au citron', 'Jacques Genin', 'лимон', 'pâte sucrée', 'история pâtisserie', 'Le Canon Sucré'],
    sourceUrl: 'https://www.editionsalternatives.com/site.php?id=991&type=P',
    sourceLabel: 'Éditions Alternatives — Le meilleur de la tarte au citron',
    date: '2026-08-10',
  },
  {
    id: 'herme-2000-feuilles-canon',
    title: '2000 Feuilles Пьера Эрме: как классический mille-feuille стал авторской системой текстур',
    excerpt: 'Официальная композиция Pierre Hermé, millennium-контекст названия, двойной хруст и граница доказанного вокруг Ladurée-предшественника.',
    content: canonArticleContents['herme-2000-feuilles-canon'],
    category: 'pierre-herme',
    author: 'Pierre Hermé Paris, Gault&Millau, Galeries Lafayette Le Gourmet',
    readTime: 8,
    image: '/images/canon-sucre/2000-feuilles.webp',
    imageAlt: '2000 Feuilles — feuilletage caramélisé et crème pralinée',
    imageTitle: '2000 Feuilles — Le Canon Sucré',
    imageCaption: '2000 Feuilles — авторское переосмысление mille-feuille в Le Canon Sucré.',
    imageCredit: 'Patisserie Russe / Le Canon Sucré — original generated editorial artwork',
    imageWidth: 1280,
    imageHeight: 800,
    tags: ['2000 Feuilles', 'Pierre Hermé', 'mille-feuille', 'praliné', 'feuilletage', 'Le Canon Sucré'],
    sourceUrl: 'https://www.pierreherme.com/fr/2000-feuilles-entremets.html',
    sourceLabel: 'Pierre Hermé Paris — 2000 Feuilles',
    date: '2026-08-10',
  },
] as const

const canonArticleIds = canonArticles.map((article) => article.id)
if (canonArticleIds.length !== new Set(canonArticleIds).size) {
  throw new Error('[canon-articles] Duplicate Canon article id')
}
if (canonArticles.some((article) => !article.content.trim())) {
  throw new Error('[canon-articles] Exact Canon dossier content must not be empty')
}
