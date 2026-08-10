import { canonResearchMilestones, type CanonEvidenceKind } from '../data/canon-research'
import { canonWorks } from '../data/canon'
import '../styles/canon-research.css'

const evidenceLabels: Record<CanonEvidenceKind, string> = {
  PRIMARY: 'PRIMARY',
  DOCUMENTED: 'DOCUMENTED',
  HOUSE: 'MAISON',
  INSTITUTIONAL: 'INSTITUTIONAL',
  CONFLICT: 'SOURCE CONFLICT',
  BOUNDED: 'BOUNDED',
}

const workNames = new Map(canonWorks.map((work) => [work.id, work.name]))

export default function CanonResearchTimeline() {
  return (
    <section className="canon-research" aria-labelledby="canon-research-title">
      <div className="canon-shell">
        <header className="canon-research-head">
          <div>
            <span className="canon-research-kicker">CHRONOLOGIE DOCUMENTAIRE</span>
            <h2 id="canon-research-title">Не дата рождения.<br />Дата, которую можно доказать.</h2>
          </div>
          <p>
            Эта шкала не превращает первый найденный документ в «момент изобретения». Здесь рядом стоят
            первичные свидетельства, earliest-current locators, линии Maison, институционализация и честно
            сохранённые конфликты источников.
          </p>
        </header>

        <div className="canon-research-timeline">
          {canonResearchMilestones.map((milestone) => (
            <article key={milestone.id} className="canon-research-milestone" data-evidence={milestone.evidence}>
              <div className="canon-research-date" aria-label={`Дата: ${milestone.date}`}>
                <span>{milestone.date}</span>
                <i aria-hidden="true" />
              </div>
              <div className="canon-research-copy">
                <span className="canon-research-evidence">{evidenceLabels[milestone.evidence]}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.text}</p>
                <div className="canon-research-works" aria-label="Связанные объекты Canon">
                  {milestone.workIds.map((workId) => (
                    <a key={workId} href={`#canon-${workId}`}>{workNames.get(workId) ?? workId}</a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="canon-legend-document" aria-labelledby="canon-tatin-document-title">
          <div className="canon-legend-pane">
            <span className="canon-research-kicker">LÉGENDE</span>
            <h3>«Tarte Tatin появилась из случайной ошибки».</h3>
            <p>
              Это знаменитая история, но ранние документальные свидетели не фиксируют accident. Research
              прослеживает развитую форму легенды значительно позже самой известности тарта.
            </p>
          </div>
          <div className="canon-document-pane">
            <span className="canon-research-kicker">DOCUMENT</span>
            <h3 id="canon-tatin-document-title">Сначала — specialty и передача рецепта.</h3>
            <p>
              Свидетельства 1899/1903 годов уже знают Tatin как известный яблочный тарт Hôtel Tatin, а цепочка
              печатной передачи 1921→1926 существует отдельно от поздней accident-story. Более ранние техники
              перевёрнутых тартов тоже документированы, но не объявляются «современной Tatin».
            </p>
            <a href="#canon-tarte-tatin">Вернуться к Tarte Tatin ↑</a>
          </div>
        </section>

        <footer className="canon-research-foot">
          <span>RESEARCH WAVE 2 · FAIL-CLOSED TRANSFER</span>
          <p>Исторические facsimile и длинные цитаты намеренно не публикуются без отдельного item-level rights review.</p>
        </footer>
      </div>
    </section>
  )
}
