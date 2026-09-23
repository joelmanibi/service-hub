"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import type { InstanceFormValues } from "./InstanceFormModal";
import type { Platform } from "@/services/hostings.service";
import SearchableSelect from "@/components/common/SearchableSelect";

type ComposantFieldGroupProps = {
  control: Control<InstanceFormValues>;
  register: UseFormRegister<InstanceFormValues>;
  errors: FieldErrors<InstanceFormValues>;
  composantIndex: number;
  availablePlatforms: Platform[];
  onRemove: () => void;
};

/**
 * Un composant du formulaire d'instance (nom + description), sa
 * plateforme (`platformId`, facultatif — un composant tourne sur au plus
 * une plateforme, limitée à `availablePlatforms` : celles des
 * hébergements cochés pour l'instance, calculées par le parent
 * InstanceFormModal) et ses inventaires imbriqués (ip + nom de serveur).
 * Extrait de InstanceFormModal car un `useFieldArray` imbriqué
 * (`composants.${index}.inventaires`) doit être déclaré dans son propre
 * composant — react-hook-form ne permet pas de l'appeler dynamiquement
 * dans la boucle `.map` du parent (violerait les règles des Hooks).
 */
export default function ComposantFieldGroup({
  control,
  register,
  errors,
  composantIndex,
  availablePlatforms,
  onRemove,
}: ComposantFieldGroupProps) {
  const {
    fields: inventaireFields,
    append: appendInventaire,
    remove: removeInventaire,
  } = useFieldArray({ control, name: `composants.${composantIndex}.inventaires` });

  const composantErrors = errors.composants?.[composantIndex];

  return (
    <div className="border rounded p-2 mb-2">
      <div className="row g-2 align-items-start">
        <div className="col-12 col-sm-5">
          <input
            type="text"
            placeholder="Nom du composant"
            aria-label={`Nom du composant ${composantIndex + 1}`}
            className={`form-control${composantErrors?.name ? " is-invalid" : ""}`}
            {...register(`composants.${composantIndex}.name` as const)}
          />
          {composantErrors?.name && (
            <div className="invalid-feedback" role="alert">
              {composantErrors.name.message}
            </div>
          )}
        </div>
        <div className="col-12 col-sm-6">
          <input
            type="text"
            placeholder="Description (optionnel)"
            aria-label={`Description du composant ${composantIndex + 1}`}
            className="form-control"
            {...register(`composants.${composantIndex}.description` as const)}
          />
        </div>
        <div className="col-12 col-sm-1 d-flex">
          <button
            type="button"
            className="btn btn-icon btn-sm text-danger"
            aria-label={`Supprimer le composant ${composantIndex + 1}`}
            onClick={onRemove}
          >
            <i className="bi bi-trash" aria-hidden="true" />
          </button>
        </div>
        <div className="col-12 col-sm-6">
          <Controller
            name={`composants.${composantIndex}.platformId` as const}
            control={control}
            render={({ field }) => (
              <SearchableSelect
                ariaLabel={`Plateforme du composant ${composantIndex + 1}`}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Plateforme (optionnel)"
                options={availablePlatforms.map((platform) => ({ value: String(platform.id), label: platform.name }))}
              />
            )}
          />
          {availablePlatforms.length === 0 && (
            <p className="text-body-secondary small mb-0 mt-1">
              Aucune plateforme disponible — coche un hébergement ci-dessus pour en proposer.
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 ps-3 border-start">
        <div className="d-flex align-items-center justify-content-between mb-1">
          <span className="small text-body-secondary">Inventaires (optionnel)</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => appendInventaire({ ip: "", nomServeur: "" })}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />
            Ajouter un inventaire
          </button>
        </div>

        {inventaireFields.length === 0 && <p className="text-body-secondary small mb-0">Aucun inventaire.</p>}

        {inventaireFields.map((field, inventaireIndex) => {
          const inventaireErrors = composantErrors?.inventaires?.[inventaireIndex];

          return (
            <div className="row g-2 align-items-start mb-2" key={field.id}>
              <div className="col-12 col-sm-5">
                <input
                  type="text"
                  placeholder="IP"
                  aria-label={`IP de l'inventaire ${inventaireIndex + 1}`}
                  className={`form-control${inventaireErrors?.ip ? " is-invalid" : ""}`}
                  {...register(`composants.${composantIndex}.inventaires.${inventaireIndex}.ip` as const)}
                />
                {inventaireErrors?.ip && (
                  <div className="invalid-feedback" role="alert">
                    {inventaireErrors.ip.message}
                  </div>
                )}
              </div>
              <div className="col-12 col-sm-6">
                <input
                  type="text"
                  placeholder="Nom du serveur"
                  aria-label={`Nom du serveur de l'inventaire ${inventaireIndex + 1}`}
                  className={`form-control${inventaireErrors?.nomServeur ? " is-invalid" : ""}`}
                  {...register(`composants.${composantIndex}.inventaires.${inventaireIndex}.nomServeur` as const)}
                />
                {inventaireErrors?.nomServeur && (
                  <div className="invalid-feedback" role="alert">
                    {inventaireErrors.nomServeur.message}
                  </div>
                )}
              </div>
              <div className="col-12 col-sm-1 d-flex">
                <button
                  type="button"
                  className="btn btn-icon btn-sm text-danger"
                  aria-label={`Supprimer l'inventaire ${inventaireIndex + 1}`}
                  onClick={() => removeInventaire(inventaireIndex)}
                >
                  <i className="bi bi-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
