"use client";

import { useState } from "react";
import ModalShell from "@/components/users/ModalShell";
import { updateManagerialEscalation, type ManagerialEscalation, type ManagerialLevel } from "@/services/escalation.service";
import { getApiErrorMessage } from "@/lib/apiError";
import PhonesField from "./PhonesField";
import { cleanContact } from "./ContactFields";

type ManagerialFormModalProps = {
  initial: ManagerialEscalation;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

/**
 * Édition de l'escalade managériale GOS (commune à toutes les instances) :
 * en-tête (disponibilité, heures ouvrées, EDS), niveaux L1..Ln, note.
 */
export default function ManagerialFormModal({ initial, onClose, onSaved }: ManagerialFormModalProps) {
  const [form, setForm] = useState<ManagerialEscalation>(() => structuredClone(initial));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setLevel = (index: number, patch: Partial<ManagerialLevel>) =>
    setForm((current) => ({
      ...current,
      levels: current.levels.map((level, i) => (i === index ? { ...level, ...patch } : level)),
    }));

  const moveLevel = (index: number, delta: number) =>
    setForm((current) => {
      const levels = [...current.levels];
      const [moved] = levels.splice(index, 1);
      levels.splice(index + delta, 0, moved);
      return { ...current, levels };
    });

  const save = async () => {
    if (form.levels.some((level) => !level.level.trim())) {
      setError("Chaque niveau doit avoir un libellé (ex. Escalation L1).");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateManagerialEscalation({
        intro: form.intro.trim(),
        availability: form.availability.trim(),
        businessHours: form.businessHours.trim(),
        eds: form.eds.trim(),
        note: form.note.trim(),
        levels: form.levels.map((level) => {
          const contact = cleanContact({ name: level.contact, email: level.email, phones: level.phones });
          return { level: level.level.trim(), contact: contact.name, email: contact.email, phones: contact.phones };
        }),
      });
      await onSaved();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Impossible d'enregistrer l'escalade managériale."));
      setIsSaving(false);
    }
  };

  const field = (key: "intro" | "availability" | "businessHours" | "eds" | "note", label: string, placeholder = "") => (
    <div className={key === "intro" || key === "note" ? "col-12" : "col-12 col-md-4"}>
      <label htmlFor={`managerial-${key}`} className="form-label small mb-1">
        {label}
      </label>
      <input
        id={`managerial-${key}`}
        type="text"
        className="form-control form-control-sm"
        placeholder={placeholder}
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
      />
    </div>
  );

  return (
    <ModalShell
      titleId="managerial-form-title"
      title="Escalade managériale GOS"
      onClose={onClose}
      size="xl"
      scrollable
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSaving}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={isSaving}>
            {isSaving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            Enregistrer
          </button>
        </>
      }
    >
      <p className="small text-body-secondary">Commune à toutes les instances, quel que soit leur service ou leur POD.</p>
      <div className="row g-2 mb-4">
        {field("intro", "Texte d'introduction", "GOS provides L1 & L2 support during business and non business hours")}
        {field("availability", "Disponibilité", "24/7")}
        {field("businessHours", "Heures ouvrées", "Monday - Friday 08h-17h GMT")}
        {field("eds", "EDS", "555402")}
        {field("note", "Note de bas de matrice")}
      </div>

      <h3 className="h6 fw-semibold">Niveaux d&apos;escalade</h3>
      {form.levels.map((level, index) => (
        <div key={index} className="border rounded-3 p-3 mb-2">
          <div className="row g-2 align-items-start">
            <div className="col-12 col-md-3">
              <label className="form-label small mb-1" htmlFor={`level-${index}-label`}>
                Niveau
              </label>
              <input
                id={`level-${index}-label`}
                type="text"
                className="form-control form-control-sm"
                placeholder="Escalation L1"
                value={level.level}
                onChange={(event) => setLevel(index, { level: event.target.value })}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small mb-1" htmlFor={`level-${index}-contact`}>
                Équipe / contact
              </label>
              <input
                id={`level-${index}-contact`}
                type="text"
                className="form-control form-control-sm"
                value={level.contact}
                onChange={(event) => setLevel(index, { contact: event.target.value })}
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label small mb-1" htmlFor={`level-${index}-email`}>
                Email
              </label>
              <input
                id={`level-${index}-email`}
                type="email"
                className="form-control form-control-sm"
                value={level.email}
                onChange={(event) => setLevel(index, { email: event.target.value })}
              />
            </div>
            <div className="col-12 col-md-3 d-flex justify-content-md-end gap-1 pt-md-4">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label="Monter"
                disabled={index === 0}
                onClick={() => moveLevel(index, -1)}
              >
                <i className="bi bi-arrow-up" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label="Descendre"
                disabled={index === form.levels.length - 1}
                onClick={() => moveLevel(index, 1)}
              >
                <i className="bi bi-arrow-down" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                aria-label="Supprimer ce niveau"
                onClick={() => setForm((current) => ({ ...current, levels: current.levels.filter((_, i) => i !== index) }))}
              >
                <i className="bi bi-trash" aria-hidden="true" />
              </button>
            </div>
            <div className="col-12">
              <span className="form-label small mb-1 d-block">Téléphones</span>
              <PhonesField
                idPrefix={`level-${index}`}
                phones={level.phones}
                onChange={(phones) => setLevel(index, { phones })}
              />
            </div>
          </div>
        </div>
      ))}
      {form.levels.length < 10 && (
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() =>
            setForm((current) => ({
              ...current,
              levels: [
                ...current.levels,
                { level: `Escalation L${current.levels.length + 1}`, contact: "", email: "", phones: [] },
              ],
            }))
          }
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Ajouter un niveau
        </button>
      )}

      {error && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {error}
        </div>
      )}
    </ModalShell>
  );
}
