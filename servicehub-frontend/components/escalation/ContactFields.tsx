"use client";

import type { EscalationContact } from "@/services/escalation.service";
import PhonesField from "./PhonesField";

type ContactFieldsProps = {
  idPrefix: string;
  title: string;
  contact: EscalationContact;
  onChange: (contact: EscalationContact) => void;
};

export const EMPTY_CONTACT: EscalationContact = { name: "", email: "", phones: [] };

/**
 * Saisie d'un contact d'escalade : nom (équipe ou personne), email,
 * téléphones.
 */
export default function ContactFields({ idPrefix, title, contact, onChange }: ContactFieldsProps) {
  return (
    <fieldset className="border rounded-3 p-3 mb-3">
      <legend className="float-none w-auto fs-6 fw-semibold px-1 mb-0">{title}</legend>
      <div className="row g-2">
        <div className="col-12 col-md-6">
          <label htmlFor={`${idPrefix}-name`} className="form-label small mb-1">
            Nom / équipe
          </label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            className="form-control form-control-sm"
            maxLength={150}
            value={contact.name}
            onChange={(event) => onChange({ ...contact, name: event.target.value })}
          />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor={`${idPrefix}-email`} className="form-label small mb-1">
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            className="form-control form-control-sm"
            maxLength={150}
            value={contact.email}
            onChange={(event) => onChange({ ...contact, email: event.target.value })}
          />
        </div>
        <div className="col-12">
          <span className="form-label small mb-1 d-block">Téléphones</span>
          <PhonesField
            idPrefix={idPrefix}
            phones={contact.phones}
            onChange={(phones) => onChange({ ...contact, phones })}
          />
        </div>
      </div>
    </fieldset>
  );
}

// Nettoie un contact avant envoi : espaces superflus, téléphones vides retirés.
export function cleanContact(contact: EscalationContact): EscalationContact {
  return {
    name: contact.name.trim(),
    email: contact.email.trim(),
    phones: contact.phones
      .map((phone) => ({ label: phone.label, number: phone.number.trim() }))
      .filter((phone) => phone.number),
  };
}
