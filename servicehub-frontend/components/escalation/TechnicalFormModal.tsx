"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import {
  updatePodEscalation,
  updateTechnicalNormalProcess,
  type EscalationContact,
  type PodEscalation,
  type TechnicalNormalProcess,
} from "@/services/escalation.service";
import { getApiErrorMessage } from "@/lib/apiError";
import ContactFields, { EMPTY_CONTACT, cleanContact } from "./ContactFields";

type TechnicalFormModalProps =
  | { kind: "normal"; initial: TechnicalNormalProcess; onClose: () => void; onSaved: () => Promise<void> }
  | { kind: "pod"; initial: PodEscalation; onClose: () => void; onSaved: () => Promise<void> };

function toContact(contact: EscalationContact | null): EscalationContact {
  return contact ? structuredClone(contact) : structuredClone(EMPTY_CONTACT);
}

function isEmpty(contact: EscalationContact): boolean {
  return !contact.name && !contact.email && contact.phones.length === 0;
}

/**
 * Édition d'une ligne de l'escalade technique GOS : soit la ligne commune
 * « Normal Process » (Service Desk & Monitoring), soit la ligne propre à un
 * POD (pays couverts, Quality Analyst, Head of Cluster).
 */
export default function TechnicalFormModal(props: TechnicalFormModalProps) {
  const isNormal = props.kind === "normal";
  const [intro, setIntro] = useState(isNormal ? props.initial.intro : "");
  const [cluster, setCluster] = useState(isNormal ? props.initial.cluster : "");
  const [countries, setCountries] = useState(props.initial.countries);
  const [qualityAnalyst, setQualityAnalyst] = useState(() => toContact(props.initial.qualityAnalyst));
  const [headOfCluster, setHeadOfCluster] = useState(() => toContact(props.initial.headOfCluster));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    const qa = cleanContact(qualityAnalyst);
    const head = cleanContact(headOfCluster);
    try {
      if (props.kind === "normal") {
        await updateTechnicalNormalProcess({
          intro: intro.trim(),
          cluster: cluster.trim(),
          countries: countries.trim(),
          qualityAnalyst: isEmpty(qa) ? null : qa,
          headOfCluster: isEmpty(head) ? null : head,
        });
      } else {
        await updatePodEscalation(props.initial.pod.id, {
          countries: countries.trim(),
          qualityAnalyst: isEmpty(qa) ? null : qa,
          headOfCluster: isEmpty(head) ? null : head,
        });
      }
      await props.onSaved();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Impossible d'enregistrer l'escalade technique."));
      setIsSaving(false);
    }
  };

  return (
    <ModalShell
      titleId="technical-form-title"
      title={isNormal ? "Escalade technique — Normal Process" : `Escalade technique — POD ${props.initial.pod.name}`}
      onClose={props.onClose}
      size="lg"
      scrollable
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={props.onClose} disabled={isSaving}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={isSaving}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Enregistrer
          </button>
        </>
      }
    >
      <p className="small text-body-secondary">
        {isNormal
          ? "Première ligne de l'escalade technique, commune à toutes les instances."
          : `Ligne affichée dans la matrice d'escalade de toutes les instances du POD ${props.initial.pod.name}.`}
      </p>

      <div className="row g-2 mb-3">
        {isNormal && (
          <>
            <div className="col-12">
              <label htmlFor="technical-intro" className="form-label small mb-1">
                Texte d&apos;introduction
              </label>
              <input
                id="technical-intro"
                type="text"
                className="form-control form-control-sm"
                value={intro}
                onChange={(event) => setIntro(event.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="technical-cluster" className="form-label small mb-1">
                Cluster
              </label>
              <input
                id="technical-cluster"
                type="text"
                className="form-control form-control-sm"
                value={cluster}
                onChange={(event) => setCluster(event.target.value)}
              />
            </div>
          </>
        )}
        <div className="col-12">
          <label htmlFor="technical-countries" className="form-label small mb-1">
            Pays / partenaires couverts <span className="text-body-secondary">(un par ligne)</span>
          </label>
          <textarea
            id="technical-countries"
            className="form-control form-control-sm"
            rows={3}
            value={countries}
            onChange={(event) => setCountries(event.target.value)}
          />
        </div>
      </div>

      <ContactFields
        idPrefix="technical-qa"
        title="Quality Analyst (incident, problem, and change management)"
        contact={qualityAnalyst}
        onChange={setQualityAnalyst}
      />
      <ContactFields
        idPrefix="technical-head"
        title="Head of Cluster (Support Leader)"
        contact={headOfCluster}
        onChange={setHeadOfCluster}
      />

      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      )}
    </ModalShell>
  );
}
