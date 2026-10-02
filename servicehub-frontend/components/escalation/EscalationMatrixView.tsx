import type {
  EscalationContact,
  EscalationPhone,
  ManagerialEscalation,
  PodEscalation,
  PodRef,
  TechnicalNormalProcess,
  TechnicalProcessStep,
} from "@/services/escalation.service";
import styles from "./EscalationMatrixView.module.scss";

function Phones({ phones }: { phones: EscalationPhone[] }) {
  if (phones.length === 0) return null;
  return (
    <ul className={styles.phones}>
      {phones.map((phone, index) => (
        <li key={`${phone.number}-${index}`}>
          {phone.label ? `${phone.label} : ` : ""}
          <a href={`tel:${phone.number.replace(/\s+/g, "")}`} className="text-reset">
            {phone.number}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Contact({ contact }: { contact: EscalationContact | null }) {
  if (!contact || (!contact.name && !contact.email && contact.phones.length === 0)) {
    return <span className="text-body-secondary">—</span>;
  }
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

export function ManagerialMatrix({ managerial }: { managerial: ManagerialEscalation }) {
  return (
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
  );
}

type TechnicalMatrixProps = {
  normalProcess: TechnicalNormalProcess;
  // Ligne du POD de l'instance ; undefined = afficher toutes les lignes de
  // `pods` (vue Paramètres), null = POD sans ligne configurée.
  podEscalation?: PodEscalation | null;
  pod?: PodRef | null;
  pods?: PodEscalation[];
  process: TechnicalProcessStep[];
};

export function TechnicalMatrix({ normalProcess, podEscalation, pod, pods, process }: TechnicalMatrixProps) {
  const rows: PodEscalation[] = pods ?? (podEscalation ? [podEscalation] : []);

  return (
    <div className={styles.block}>
      <div className={styles.banner}>Technical escalation GOS</div>
      {normalProcess.intro && <p className={styles.intro}>{normalProcess.intro}</p>}
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
              <td className={`${styles.cell} text-center fw-semibold`}>{normalProcess.cluster}</td>
              <td className={styles.cell}>
                <Lines text={normalProcess.countries} />
              </td>
              <td className={styles.cell}>
                <Contact contact={normalProcess.qualityAnalyst} />
              </td>
              <td className={styles.cell}>
                <Contact contact={normalProcess.headOfCluster} />
              </td>
            </tr>
            {rows.map((row) => (
              <tr key={row.pod.id}>
                <td className={styles.levelCell}>Technical escalation</td>
                <td className={`${styles.cell} text-center fw-semibold`}>{row.pod.name}</td>
                <td className={styles.cell}>
                  <Lines text={row.countries} />
                </td>
                <td className={styles.cell}>
                  <Contact contact={row.qualityAnalyst} />
                </td>
                <td className={styles.cell}>
                  <Contact contact={row.headOfCluster} />
                </td>
              </tr>
            ))}
            {!pods && !podEscalation && (
              <tr>
                <td className={styles.levelCell}>Technical escalation</td>
                <td colSpan={4} className={styles.missing}>
                  {pod
                    ? `Aucune escalade technique n'est encore définie pour le POD ${pod.name}.`
                    : "Instance sans POD : escalade technique non définie."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.process}>
        <div className="fw-bold mb-1">Technical escalation process</div>
        <ul className="mb-0">
          {process.map((step) => (
            <li key={step.step}>
              <strong>{step.step}</strong> <i className="bi bi-arrow-right mx-1" aria-hidden="true" /> {step.target}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
