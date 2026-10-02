"use client";

import type { EscalationPhone } from "@/services/escalation.service";

type PhonesFieldProps = {
  idPrefix: string;
  phones: EscalationPhone[];
  onChange: (phones: EscalationPhone[]) => void;
};

/**
 * Liste éditable de téléphones (type F = fixe / M = mobile + numéro).
 */
export default function PhonesField({ idPrefix, phones, onChange }: PhonesFieldProps) {
  const update = (index: number, patch: Partial<EscalationPhone>) =>
    onChange(phones.map((phone, i) => (i === index ? { ...phone, ...patch } : phone)));

  return (
    <div>
      {phones.map((phone, index) => (
        <div className="input-group input-group-sm mb-1" key={index}>
          <select
            className="form-select flex-grow-0"
            style={{ width: "5.5rem" }}
            aria-label="Type de téléphone"
            value={phone.label}
            onChange={(event) => update(index, { label: event.target.value })}
          >
            <option value="F">Fixe</option>
            <option value="M">Mobile</option>
            <option value="">—</option>
          </select>
          <input
            id={`${idPrefix}-phone-${index}`}
            type="tel"
            className="form-control"
            placeholder="+225 07 00 00 00 00"
            value={phone.number}
            maxLength={40}
            onChange={(event) => update(index, { number: event.target.value })}
          />
          <button
            type="button"
            className="btn btn-outline-danger"
            aria-label="Retirer ce téléphone"
            onClick={() => onChange(phones.filter((_, i) => i !== index))}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      ))}
      {phones.length < 5 && (
        <button
          type="button"
          className="btn btn-link btn-sm p-0"
          onClick={() => onChange([...phones, { label: "M", number: "" }])}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
          Ajouter un téléphone
        </button>
      )}
    </div>
  );
}
