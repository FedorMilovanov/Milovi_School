import { canonWorks } from '../data/canon'
import { canonTechniqueRows } from '../data/canon-techniques'
import '../styles/canon-technique-matrix.css'

const pad = (value: number) => String(value).padStart(2, '0')

export default function CanonTechniqueMatrix() {
  return (
    <section className="canon-technique-index" aria-labelledby="canon-technique-title">
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

            {canonTechniqueRows.map((row) => (
              <div className="canon-technique-row" key={row.id}>
                <div className="canon-technique-label">{row.label}</div>
                {canonWorks.map((work) => {
                  const active = row.workIds.includes(work.id)
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
    </section>
  )
}