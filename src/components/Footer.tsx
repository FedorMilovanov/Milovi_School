import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <footer id="about" className="bg-stone-950 text-amber-50">
      {/* Newsletter section */}
      <div className="border-b border-amber-100/10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.34em] text-amber-200/60">Newsletter</p>
            <h3 className="font-serif text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Новые материалы — прямо в почту
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-stone-400">
              Без спама. Только новые статьи о техниках, рецептах и шеф-кондитерах. Раз в неделю.
            </p>
          </div>
          <div className="mt-6 lg:mt-0">
            {submitted ? (
              <div className="border border-amber-500/30 px-6 py-4 text-sm text-amber-200">
                Запрос получен — подписка откроется скоро.
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-64 border border-white/20 bg-transparent px-4 py-3 text-sm text-white placeholder:text-stone-500 outline-none ring-0 focus:border-amber-400 focus:ring-0 transition-colors"
                  />
                  {/* F-09: newsletter not yet connected — show interest form, not fake subscription */}
                  <button
                    type="button"
                    onClick={() => { if (email.trim()) setSubmitted(true) }}
                    className="shrink-0 border border-amber-100 bg-amber-100 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.2em] text-stone-950 transition hover:bg-white"
                  >
                    Уведомить
                  </button>
                </div>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-stone-600">
                  Рассылка в разработке — сообщим когда откроется
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-amber-200/70">О проекте</p>
            <h2 className="max-w-3xl font-serif text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
              Французская pâtisserie на русском языке
            </h2>
          </div>
          <div className="space-y-6 text-stone-300">
            <p className="text-lg leading-8">
              Это библиотека о людях, которые сделали французскую кондитерку современной: Эрме, Гроле, Мишалак, Метайе, Контисини, Перре и другие. Мы собираем интервью, рецепты, курсы и профессиональные заметки — и переводим их в понятный формат.
            </p>
            <p className="text-lg leading-8">
              Здесь можно читать не рекламные описания, а ремесленную суть: что шеф хотел сказать, почему он выбрал именно эту технику, какие температуры и жесты важны.
            </p>

            <div className="border border-amber-100/15 p-6">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-200/60">Авторский проект</p>
              <span className="font-serif text-2xl font-semibold text-amber-100">Patisserie Russe</span>
              <p className="mt-3 text-sm leading-6 text-stone-400">
                French Pastry Archive — бесплатная база знаний о французской кондитерке и кухне. Проект сделан по любви к теме.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-amber-100/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-stone-600">
            Patisserie Russe · French Pastry Archive · {new Date().getFullYear()}
          </p>
          <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-600">
            <span>Сделано с уважением к ремеслу</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
