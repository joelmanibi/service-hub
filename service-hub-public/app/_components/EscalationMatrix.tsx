import type { EscalationContact, EscalationMatrix as EscalationMatrixData, EscalationPhone } from "@/lib/publicApi";
import styles from "./EscalationMatrix.module.scss";

function Phones({ phones }: { phones: EscalationPhone[] }) {
  if (phones.length === 0) return null;
  return (
    <ul className={styles.phones}>
      {phones.map((phone, index) => (
        <li key={`${phone.number}-${index}`}>
          {phone.label ? `${phone.label} : ` : ""}
          <a href={`tel:${phone.number.replace(/\s+/g, "")}`}>{phone.number}</a>
        </li>
      ))}
    </ul>
  );
}

function Contact({ contact }: { contact: EscalationContact | null }) {
  if (!contact || (!contact.name && !contact.email && contact.phones.length === 0)) return <>—</>;
  return (
    <>
      {contact.name && <div className="fw-semibold">{contact.name}</div>}
      {contact.email && (
        <div>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
      )}
      <Phones phones={contact.phones} />
    </>
  );
}

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </>
  );
}

/**
 * Matrice d'escalade GOS d'une instance (fiche publique, utilisateur
 * connecté) : escalade managériale commune et escalade technique (ligne
 * « Normal Process » commune + ligne du POD de l'instance).
 */
export default function EscalationMatrix({ matrix }: { matrix: EscalationMatrixData }) {
  const { managerial, technical } = matrix;
  const normal = technical.normalProcess;
  const podRow = technical.podEscalation;

  return (
    <div>
      <div className={styles.block}>
        <div className={styles.banner}>Managerial escalation GOS</div>
        {managerial.intro && <p className={styles.intro}>{managerial.intro}</p>}
        <div className={styles.scroll}>
          <table className={styles.table}>
            <tbody>
              {managerial.availability && (
                <tr className={styles.infoRow}>
                  <td colSpan={4}>Availability : {managerial.availability}</td>
                </tr>
              )}
              {managerial.businessHours && (
                <tr className={styles.infoRow}>
                  <td colSpan={4}>Business Hours : {managerial.businessHours}</td>
                </tr>
              )}
              {managerial.eds && (
                <tr className={styles.infoRow}>
                  <td colSpan={4}>EDS : {managerial.eds}</td>
                </tr>
              )}
              <tr>
                <th className={styles.head}>Contact level</th>
                <th className={styles.subHead}>Team / Contact</th>
                <th className={styles.subHead}>Phone</th>
                <th className={styles.subHead}>Email</th>
              </tr>
              {managerial.levels.map((level) => (
                <tr key={level.level}>
                  <td className={styles.levelCell}>{level.level}</td>
                  <td className={`${styles.cell} text-center`}>{level.contact || "—"}</td>
                  <td className={styles.cell}>
                    <Phones phones={level.phones} />
                  </td>
                  <td className={`${styles.cell} text-center`}>
                    {level.email ? <a href={`mailto:${level.email}`}>{level.email}</a> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {managerial.note && <p className={styles.note}>« {managerial.note} »</p>}
      </div>

      <div className={styles.block}>
        <div className={styles.banner}>Technical escalation GOS</div>
        {normal.intro && <p className={styles.intro}>{normal.intro}</p>}
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.head} />
                <th className={styles.head}>Cluster</th>
                <th className={styles.head}>Country</th>
                <th className={styles.head}>Quality Analyst (incident, problem, and change management)</th>
                <th className={styles.head}>Head of Cluster (Support Leader)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.levelCell}>Normal Process</td>
                <td className={`${styles.cell} text-center fw-semibold`}>{normal.cluster}</td>
                <td className={styles.cell}>
                  <Lines text={normal.countries} />
                </td>
                <td className={styles.cell}>
                  <Contact contact={normal.qualityAnalyst} />
                </td>
                <td className={styles.cell}>
                  <Contact contact={normal.headOfCluster} />
                </td>
              </tr>
              <tr>
                <td className={styles.levelCell}>Technical escalation</td>
                {podRow ? (
                  <>
                    <td className={`${styles.cell} text-center fw-semibold`}>{podRow.pod.name}</td>
                    <td className={styles.cell}>
                      <Lines text={podRow.countries} />
                    </td>
                    <td className={styles.cell}>
                      <Contact contact={podRow.qualityAnalyst} />
                    </td>
                    <td className={styles.cell}>
                      <Contact contact={podRow.headOfCluster} />
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className={styles.missing}>
                    {technical.pod
                      ? `Escalade technique du POD ${technical.pod.name} non encore définie.`
                      : "Escalade technique non définie pour cette instance."}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
        <div className={styles.process}>
          <div className="fw-bold mb-1">Technical escalation process</div>
          <ul className="mb-0">
            {technical.process.map((step) => (
              <li key={step.step}>
                <strong>{step.step}</strong> <i className="bi bi-arrow-right mx-1" aria-hidden="true" /> {step.target}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
