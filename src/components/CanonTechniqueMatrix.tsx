import { canonWorks } from '../data/canon'
import '../styles/canon-technique-matrix.css'

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

const pad = (value: number) => String(value).padStart(2, '0')

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

        <div className="canon-technique-scroll" aria-label="Матрица техник Le Canon Sucré">
          <div className="canon-technique-grid">
            <div className="canon-technique-corner">TECHNIQUE</div>
            {canonWorks.map((work) => (
              <a key={work.id} href={`#canon-${work.id}`} className="canon-technique-work-head" aria-label={`Перейти к ${pad(work.order)} — ${work.name}`}>
                {pad(work.order)}
              </a>
            ))}

            {rows.map((row) => (
              <div className="canon-technique-row" key={row.id}>
                <div className="canon-technique-label">{row.label}</div>
                {canonWorks.map((work) => {
                  const active = (row.works as readonly string[]).includes(work.id)
                  return active ? (
                    <span
                      key={work.id}
                      className="canon-technique-cell is-active"
                      role="img"
                      aria-label={`${row.label}: ${work.name}`}
                    >
                      <span aria-hidden="true" />
                    </span>
                  ) : (
                    <span key={work.id} className="canon-technique-cell" aria-hidden="true">
                      <span />
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="canon-technique-note">Номер работы возвращает к соответствующему объекту коллекции.</p>
      </div>
    </aside>
  )
}
