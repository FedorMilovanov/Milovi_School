import '../styles/canon-technique-matrix.css'

const works = [
  ['saint-honore', '01'], ['paris-brest', '02'], ['religieuse', '03'], ['eclair', '04'], ['opera', '05'],
  ['baba-au-rhum', '06'], ['tarte-au-citron', '07'], ['ispahan', '08'], ['2000-feuilles', '09'], ['mont-blanc', '10'],
  ['kouign-amann', '11'], ['tarte-tatin', '12'], ['tarte-tropezienne', '13'], ['canele-bordeaux', '14'], ['galette-des-rois', '15'],
] as const

const rows = [
  { id: 'choux', label: 'PÂTE À CHOUX', works: ['saint-honore', 'paris-brest', 'religieuse', 'eclair'] },
  { id: 'lamination', label: 'FEUILLETAGE · LAMINATION', works: ['saint-honore', '2000-feuilles', 'kouign-amann', 'galette-des-rois'] },
  { id: 'caramel', label: 'CARAMEL · CARAMÉLISATION', works: ['saint-honore', '2000-feuilles', 'kouign-amann', 'tarte-tatin', 'canele-bordeaux'] },
  { id: 'praline', label: 'PRALINÉ', works: ['paris-brest', '2000-feuilles'] },
  { id: 'levee', label: 'PÂTE LEVÉE · BRIOCHE', works: ['baba-au-rhum', 'kouign-amann', 'tarte-tropezienne'] },
  { id: 'meringue', label: 'MERINGUE', works: ['mont-blanc'] },
  { id: 'emulsion', label: 'ÉMULSION', works: ['tarte-au-citron'] },
  { id: 'mould', label: 'CUISSON MOULÉE', works: ['canele-bordeaux'] },
] as const

export default function CanonTechniqueMatrix() {
  return (
    <aside className="canon-technique-index" aria-labelledby="canon-technique-title">
      <div className="canon-technique-shell">
        <div className="canon-technique-heading">
          <div>
            <span className="canon-technique-kicker">INDEX TECHNIQUE</span>
            <h2 id="canon-technique-title">Une grammaire<br />de pâtisserie.</h2>
          </div>
          <p>
            Пятнадцать произведений читаются не только по именам. Одни и те же профессиональные жесты — choux, lamination, caramel, praliné — связывают разные эпохи и формы в единую техническую грамматику.
          </p>
        </div>

        <div className="canon-technique-scroll" tabIndex={0} aria-label="Матрица техник Le Canon Sucré">
          <div className="canon-technique-grid" role="table" aria-label="Связь десертов и ключевых техник">
            <div className="canon-technique-corner" role="columnheader">TECHNIQUE</div>
            {works.map(([id, number]) => (
              <a key={id} href={`#canon-${id}`} className="canon-technique-work-head" role="columnheader" aria-label={`Работа ${number}`}>
                {number}
              </a>
            ))}

            {rows.map((row) => (
              <div className="canon-technique-row" role="row" key={row.id}>
                <div className="canon-technique-label" role="rowheader">{row.label}</div>
                {works.map(([workId, number]) => {
                  const active = (row.works as readonly string[]).includes(workId)
                  return (
                    <a
                      key={workId}
                      href={`#canon-${workId}`}
                      className={`canon-technique-cell ${active ? 'is-active' : ''}`}
                      role="cell"
                      aria-label={`${row.label}: работа ${number}${active ? ' — используется' : ' — не является ключевой'}`}
                      tabIndex={active ? 0 : -1}
                    >
                      <span aria-hidden="true" />
                    </a>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="canon-technique-note">Нажмите на номер или активную точку, чтобы вернуться к соответствующей работе.</p>
      </div>
    </aside>
  )
}
