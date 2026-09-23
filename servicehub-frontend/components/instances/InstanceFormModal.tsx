"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import ModalShell from "@/components/users/ModalShell";
import SearchableSelect from "@/components/common/SearchableSelect";
import {
  getInstanceArchitectureImageUrl,
  uploadInstanceArchitectureImage,
  removeInstanceArchitectureImage,
  type ManagedInstance,
} from "@/services/instances.service";
import type { ManagedClient } from "@/components/clients/clientTypes";
import type { CatalogService } from "@/services/catalog.service";
import type { StatutInstance } from "@/services/statutInstances.service";
import type { Environment } from "@/services/environments.service";
import type { Hosting } from "@/services/hostings.service";
import type { Network } from "@/services/networks.service";
import type { Pod } from "@/services/pods.service";
import type { SupportLevel } from "@/services/supportLevels.service";
import { getApiErrorMessage } from "@/lib/apiError";
import ComposantFieldGroup from "./ComposantFieldGroup";
import styles from "./InstanceFormModal.module.scss";

// Valeurs connues du champ "Produit Océane" (fournies par le métier,
// aucune table dédiée — champ texte libre côté backend, cf.
// modules/instance/validator.js). Liste fermée côté UX mais pas côté
// validation : une valeur hors liste (option "Autre...") reste acceptée,
// pour ne pas bloquer la saisie si un nouveau produit apparaît avant
// mise à jour de cette liste.
const PRODUIT_OCEANE_OPTIONS = [
  "MAXIT_OCI",
  "MS_ITN_OCD",
  "EME_OCI",
  "MAXIT_OCD",
  "OTAP_OBF",
  "KAABU MOBILE_OCD",
  "MAXIT_OBF",
  "KAABU MOBILE_OBF",
  "EME_OCM",
  "MS_OM_OCD",
  "Orange Money_OLR",
  "ORANGE TV_OCI",
  "OMPAY_OCI",
  "MAXIT_OLR",
  "KAABU MOBILE_OCI",
  "Zebra_OCI",
  "WAAAT_OBF",
  "OBA_OCI",
  "EME_OML",
  "EME_OSN",
  "EME_OGW",
  "EME_OBW",
  "KAABU_OCD",
  "EME_OLR",
  "KAABU MOBILE_OCM",
  "EME_ALL",
  "Paddock_OCI",
  "AAS_OBF",
  "Coris Bank B2W",
  "MAXIT_OGN",
  "OCTAVE_OCI",
  "EME_OMA",
  "O'ZEN POUR SOI",
  "Achat pass mix pour tiers via OM",
  "OTAP_OCI",
  "EME_OGN",
  "Echec d'authenfication_MAXIT_OCI",
  "Match en live",
  "INTERNET",
  "Nomad Subscription_ONE",
  "MAXIT_OTN",
  "MAXIT_OMG",
  "MAXIT_OCM",
  "MAXIT_OCF",
  "KAABU MOBILE_OCF",
  "BUS_OBW",
  "AAS_OCF",
  "One_FRA_ALL",
  "Mail Internet_OCM",
  "WAAAT_OCF",
  "WAAAT_OCM",
  "Application gestion API",
  "One_FRA_OBF",
  "ORANGE INFRA_OCM",
  "KAABU MOBILE_OSL",
  "NOMAD SUBSCRIPTION",
  "USSD_OMG",
  "Orange Money_OCM",
  "Orange Money",
  "WAAAT_OBW",
  "BUS_OMG",
  "OMS_OML",
  "CMS_OML",
  "USSD Shop _OGN",
  "USSD B2B_OGN",
  "Paddock_OSN",
  "OTAP_OML",
  "AAS_OML",
  "WAAAT_OGN",
  "CMS_OGN",
  "MAXIT_OGW",
  "OMS_OSN",
  "OTA",
  "WAAAT_OSN",
  "MAXIT_OJO",
  "MAXIT_OMA",
  "CENTREON_GOS",
  "B2B_TRANSCAO",
  "WALLIX",
  "OSIGN-ODS_GOS",
  "B2B_QUIPUX",
  "CMS_OCI",
  "Entertainment / Divertissement",
  "One_FRA_OLR",
  "One_FRA_OCI",
  "One_FRA_OCM",
  "Paddock_OML",
  "DATA 3G_OCI",
  "ONE_FRA_OCD",
  "MEGAWIN_OCI",
  "APPLI OMA",
] as const;

const OTHER_PRODUIT_OCEANE = "__autre__";

// Aligné sur les validators Joi du backend
// (modules/instance/validator.js — createInstanceSchema/updateInstanceSchema).
// `code` est volontairement absent : généré automatiquement par le
// backend, jamais fourni ni modifiable par le formulaire.
const inventaireFormSchema = z.object({
  ip: z.string().trim().min(1, "L'IP est requise.").max(45),
  nomServeur: z.string().trim().min(1, "Le nom du serveur est requis.").max(150),
});

const composantFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom du composant est requis.").max(150),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  platformId: z.string().optional(),
  inventaires: z.array(inventaireFormSchema).optional(),
});

const supportLevelAssignmentFormSchema = z.object({
  supportLevelId: z.string().min(1, "Le niveau de support est requis."),
  responsable: z.string().trim().max(150).optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
});

const instanceFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(150),
  clientId: z.string().min(1, "Le client est requis."),
  podId: z.string().min(1, "Le pod est requis."),
  serviceId: z.string().min(1, "Le service est requis."),
  statutInstanceId: z.string().min(1, "Le statut est requis."),
  comments: z.string().trim().optional().or(z.literal("")),
  produitOceane: z.string().trim().max(100).optional().or(z.literal("")),
  environmentIds: z.array(z.string()).optional(),
  hostingIds: z.array(z.string()).optional(),
  networkIds: z.array(z.string()).optional(),
  composants: z.array(composantFormSchema).optional(),
  supportLevels: z.array(supportLevelAssignmentFormSchema).optional(),
});

export type InstanceFormValues = z.infer<typeof instanceFormSchema>;

// Découpage du formulaire en 3 étapes : Informations générales (identité
// + rattachements + notes), Architecture technique (composants de
// l'instance) et Chaîne de soutien (niveaux de support assignés). Chaque
// étape ne valide (via `trigger`, au clic sur "Suivant") que ses propres
// champs — le schéma Zod complet reste néanmoins revalidé par
// react-hook-form au submit final, qui reste le garde-fou.
const STEPS = [
  { label: "Informations générales" },
  { label: "Architecture technique" },
  { label: "Chaîne de soutien" },
] as const;

const STEP_FIELDS: (keyof InstanceFormValues)[][] = [
  [
    "name",
    "clientId",
    "podId",
    "serviceId",
    "statutInstanceId",
    "produitOceane",
    "environmentIds",
    "hostingIds",
    "networkIds",
    "comments",
  ],
  ["composants"],
  ["supportLevels"],
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol
      className={`d-flex list-unstyled mb-4 ${styles.stepper}`}
      aria-label={`Étape ${currentStep + 1} sur ${STEPS.length} : ${STEPS[currentStep].label}`}
    >
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <li
            className={`d-flex align-items-center ${styles.step} ${
              index < STEPS.length - 1 ? styles.stepWithConnector : ""
            }`}
            key={step.label}
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={`rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0 fw-semibold ${styles.stepCircle} ${
                isCompleted
                  ? "bg-primary text-white"
                  : isActive
                    ? "bg-primary-subtle text-primary border border-primary"
                    : "bg-body-tertiary text-body-secondary"
              }`}
            >
              {isCompleted ? <i className="bi bi-check-lg" aria-hidden="true" /> : index + 1}
            </span>
            <span className={`ms-2 small ${isActive ? "fw-semibold" : "text-body-secondary"} ${styles.stepLabel}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type InstanceFormModalProps = {
  mode: "create" | "edit";
  instance?: ManagedInstance;
  clients: ManagedClient[];
  services: CatalogService[];
  statutInstances: StatutInstance[];
  environments: Environment[];
  hostings: Hosting[];
  networks: Network[];
  pods: Pod[];
  supportLevels: SupportLevel[];
  onClose: () => void;
  onSubmit: (values: InstanceFormValues) => Promise<void>;
  // Le schéma d'architecture (image) est envoyé immédiatement au backend
  // (endpoint multipart dédié), indépendamment du submit du formulaire —
  // ce callback permet au parent de recharger sa liste (le thumbnail
  // éventuellement affiché ailleurs) sans attendre "Enregistrer".
  onArchitectureImageChange?: () => void;
};

/**
 * Modale de création/modification d'une instance (Bootstrap Modal +
 * Bootstrap Form). Les clés étrangères (`clientId`, `podId`, `serviceId`,
 * `statutInstanceId`) sont manipulées comme des chaînes côté formulaire
 * (valeurs de SearchableSelect — select à recherche, piloté via
 * `Controller` plutôt que `register`, utile dès qu'une liste est longue,
 * comme les ~102 Service du catalogue) ; les relations many-to-many
 * (`environmentIds`, `hostingIds`, `networkIds` — dépendances réseau,
 * référentiel settings.Network) sont des cases à cocher partageant le
 * même `name` — react-hook-form agrège nativement les valeurs cochées en
 * tableau de chaînes. Le tout est converti en nombres par le parent
 * (InstancesPageClient) avant l'appel API. Les composants (`composants`,
 * propres à l'instance — pas un référentiel partagé) sont une liste
 * éditable via `useFieldArray` (ajout/suppression de lignes nom +
 * description), chacun avec ses propres inventaires (ip + nom de serveur)
 * imbriqués — cf. ComposantFieldGroup, qui porte le `useFieldArray`
 * imbriqué correspondant, ainsi que son sélecteur de plateforme
 * (`platformId`, facultatif) : les options proposées sont limitées aux
 * plateformes des hébergements actuellement cochés (`hostingIds`,
 * réactif via `watch`) — un composant tourne forcément sur un hébergement
 * de l'instance. Envoyé tel quel, `composants` remplace intégralement les
 * composants (et leurs inventaires) existants côté backend (cf.
 * modules/instance/service.js). `produitOceane` reste un
 * champ texte libre côté backend (pas de référentiel dédié) : le
 * SearchableSelect (PRODUIT_OCEANE_OPTIONS) n'est qu'une commodité de
 * saisie côté UI — l'option "Autre..." bascule sur un champ texte libre
 * (`isCustomProduitOceane`) toujours enregistré sous le même nom RHF
 * `produitOceane`, pour ne pas bloquer la saisie d'une valeur absente de
 * la liste. Les niveaux de support (`supportLevels`) sont une liste
 * éditable via `useFieldArray` (référentiel settings.SupportLevel +
 * responsable/téléphone propres à l'assignation) ; envoyée telle quelle, elle
 * remplace intégralement les assignations existantes côté backend
 * (cf. modules/instance/service.js#syncSupportLevels). `onSubmit` doit
 * résoudre en cas de succès (le parent ferme la modale) ou rejeter en
 * cas d'échec API (affiché ici, modale conservée ouverte).
 */
export default function InstanceFormModal({
  mode,
  instance,
  clients,
  services,
  statutInstances,
  environments,
  hostings,
  networks,
  pods,
  supportLevels,
  onClose,
  onSubmit,
  onArchitectureImageChange,
}: InstanceFormModalProps) {
  const titleId = "instance-form-modal-title";
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [stepBlocked, setStepBlocked] = useState(false);
  const isLastStep = step === STEPS.length - 1;

  const [architectureImageUrl, setArchitectureImageUrl] = useState<string | null>(
    instance?.architectureImageUrl ?? null
  );
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    watch,
    trigger,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InstanceFormValues>({
    resolver: zodResolver(instanceFormSchema),
    defaultValues: {
      name: instance?.name ?? "",
      clientId: instance ? String(instance.clientId) : "",
      podId: instance ? String(instance.podId) : "",
      serviceId: instance ? String(instance.serviceId) : "",
      statutInstanceId: instance ? String(instance.statutInstanceId) : "",
      comments: instance?.comments ?? "",
      produitOceane: instance?.produitOceane ?? "",
      environmentIds: instance?.environmentIds.map(String) ?? [],
      hostingIds: instance?.hostingIds.map(String) ?? [],
      networkIds: instance?.networkIds.map(String) ?? [],
      composants: instance?.composants.map((composant) => ({
        name: composant.name,
        description: composant.description ?? "",
        platformId: composant.platformId ? String(composant.platformId) : "",
        inventaires: composant.inventaires.map((inventaire) => ({
          ip: inventaire.ip,
          nomServeur: inventaire.nomServeur,
        })),
      })) ?? [],
      supportLevels: instance?.supportLevels.map((supportLevel) => ({
        supportLevelId: String(supportLevel.supportLevelId),
        responsable: supportLevel.responsable ?? "",
        telephone: supportLevel.telephone ?? "",
      })) ?? [],
    },
    mode: "onChange",
  });

  const {
    fields: composantFields,
    append: appendComposant,
    remove: removeComposant,
  } = useFieldArray({ control, name: "composants" });

  const {
    fields: supportLevelFields,
    append: appendSupportLevel,
    remove: removeSupportLevel,
  } = useFieldArray({ control, name: "supportLevels" });

  // Plateformes sélectionnables pour un composant : celles des
  // hébergements actuellement cochés pour l'instance (`hostingIds`,
  // réactif — se met à jour dès qu'une case Hébergements est
  // cochée/décochée). Chaque Hosting embarque déjà ses `platforms` (cf.
  // hostings.service.ts), pas besoin d'un appel API supplémentaire.
  const hostingIdsValue = watch("hostingIds") ?? [];
  const availablePlatforms = hostings
    .filter((hosting) => hostingIdsValue.includes(String(hosting.id)))
    .flatMap((hosting) => hosting.platforms);

  const produitOceaneValue = watch("produitOceane") ?? "";
  const isKnownProduitOceane =
    produitOceaneValue === "" || (PRODUIT_OCEANE_OPTIONS as readonly string[]).includes(produitOceaneValue);
  const [isCustomProduitOceane, setIsCustomProduitOceane] = useState(!isKnownProduitOceane);

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const formId = "instance-form";

  const goToNextStep = async () => {
    const isStepValid = await trigger(STEP_FIELDS[step]);
    if (isStepValid) {
      setStepBlocked(false);
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    } else {
      setStepBlocked(true);
    }
  };

  const goToPreviousStep = () => {
    setStepBlocked(false);
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleArchitectureImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !instance) return;

    setImageError(null);
    setIsImageUploading(true);
    try {
      const updated = await uploadInstanceArchitectureImage(instance.id, file);
      setArchitectureImageUrl(updated.architectureImageUrl);
      onArchitectureImageChange?.();
    } catch (error) {
      setImageError(getApiErrorMessage(error));
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleArchitectureImageRemove = async () => {
    if (!instance) return;

    setImageError(null);
    setIsImageUploading(true);
    try {
      const updated = await removeInstanceArchitectureImage(instance.id);
      setArchitectureImageUrl(updated.architectureImageUrl);
      onArchitectureImageChange?.();
    } catch (error) {
      setImageError(getApiErrorMessage(error));
    } finally {
      setIsImageUploading(false);
    }
  };

  // Efface l'avertissement dès que les champs fautifs de l'étape en
  // cours sont corrigés (mode: "onChange" tient `errors` à jour à chaque
  // frappe) — évite un bandeau "corrigez les erreurs" qui reste affiché
  // alors que l'utilisateur vient de les corriger.
  useEffect(() => {
    if (!stepBlocked) return;
    const stillHasErrors = STEP_FIELDS[step].some((field) => errors[field]);
    if (!stillHasErrors) setStepBlocked(false);
  }, [errors, step, stepBlocked]);

  return (
    <ModalShell
      titleId={titleId}
      title={mode === "create" ? "Créer une instance" : "Modifier l'instance"}
      onClose={onClose}
      size="lg"
      scrollable
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Annuler
          </button>
          {step > 0 && (
            <button type="button" className="btn btn-outline-secondary" onClick={goToPreviousStep}>
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Précédent
            </button>
          )}
          {isLastStep ? (
            <button
              key="submit-action"
              type="submit"
              form={formId}
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          ) : (
            <button key="next-action" type="button" className="btn btn-primary" onClick={goToNextStep}>
              Suivant
              <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
            </button>
          )}
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setFormError(null);
          try {
            await onSubmit(values);
          } catch (error) {
            setFormError(getApiErrorMessage(error));
          }
        })}
      >
        {formError && (
          <div className="alert alert-danger" role="alert">
            {formError}
          </div>
        )}

        <StepIndicator currentStep={step} />

        {stepBlocked && (
          <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            <span>Merci de corriger les champs en erreur ci-dessous avant de continuer.</span>
          </div>
        )}

        {step === 0 && (
        <div className="row g-3">
          {mode === "edit" && instance && (
            <div className="col-12">
              <span className="form-label d-block mb-1">Code</span>
              <span className="fw-semibold">{instance.code}</span>
              <div className="form-text">Le code est généré automatiquement et ne peut pas être modifié.</div>
            </div>
          )}

          <div className="col-12">
            <label htmlFor="name" className="form-label">
              Nom
            </label>
            <input
              id="name"
              type="text"
              className={`form-control${errors.name ? " is-invalid" : ""}`}
              aria-invalid={errors.name ? "true" : "false"}
              {...register("name")}
            />
            {errors.name && (
              <div className="invalid-feedback" role="alert">
                {errors.name.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="clientId" className="form-label">
              Client
            </label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="clientId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.clientId}
                  placeholder="Sélectionner..."
                  options={clients.map((client) => ({ value: String(client.id), label: client.name }))}
                />
              )}
            />
            {errors.clientId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.clientId.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="podId" className="form-label">
              Pod
            </label>
            <Controller
              name="podId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="podId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.podId}
                  placeholder="Sélectionner..."
                  options={pods.map((pod) => ({ value: String(pod.id), label: pod.name }))}
                />
              )}
            />
            {errors.podId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.podId.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="serviceId" className="form-label">
              Service
            </label>
            <Controller
              name="serviceId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="serviceId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.serviceId}
                  placeholder="Sélectionner..."
                  options={services.map((service) => ({ value: String(service.id), label: service.name }))}
                />
              )}
            />
            {errors.serviceId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.serviceId.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="statutInstanceId" className="form-label">
              Etat du service
            </label>
            <Controller
              name="statutInstanceId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="statutInstanceId"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  isInvalid={!!errors.statutInstanceId}
                  placeholder="Sélectionner..."
                  options={statutInstances.map((statutInstance) => ({
                    value: String(statutInstance.id),
                    label: statutInstance.name,
                  }))}
                />
              )}
            />
            {errors.statutInstanceId && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.statutInstanceId.message}
              </div>
            )}
          </div>

          <div className="col-12 col-sm-6">
            <span className="form-label d-block">
              Environnements <span className="text-body-secondary">(optionnel)</span>
            </span>
            <div className="border rounded p-2" style={{ maxHeight: "10rem", overflowY: "auto" }}>
              {environments.map((environment) => (
                <div className="form-check" key={environment.id}>
                  <input
                    id={`environmentIds-${environment.id}`}
                    type="checkbox"
                    className="form-check-input"
                    value={environment.id}
                    {...register("environmentIds")}
                  />
                  <label className="form-check-label" htmlFor={`environmentIds-${environment.id}`}>
                    {environment.name}
                  </label>
                </div>
              ))}
              {environments.length === 0 && <p className="text-body-secondary small mb-0">Aucun environnement.</p>}
            </div>
          </div>

          <div className="col-12 col-sm-6">
            <span className="form-label d-block">
              Sites d&apos;hébergement <span className="text-body-secondary">(optionnel)</span>
            </span>
            <div className="border rounded p-2" style={{ maxHeight: "10rem", overflowY: "auto" }}>
              {hostings.map((hosting) => (
                <div className="form-check" key={hosting.id}>
                  <input
                    id={`hostingIds-${hosting.id}`}
                    type="checkbox"
                    className="form-check-input"
                    value={hosting.id}
                    {...register("hostingIds")}
                  />
                  <label className="form-check-label" htmlFor={`hostingIds-${hosting.id}`}>
                    {hosting.name}
                  </label>
                </div>
              ))}
              {hostings.length === 0 && <p className="text-body-secondary small mb-0">Aucun hébergement.</p>}
            </div>
          </div>

          <div className="col-12 col-sm-6">
            <span className="form-label d-block">
              Dépendances réseau <span className="text-body-secondary">(optionnel)</span>
            </span>
            <div className="border rounded p-2" style={{ maxHeight: "10rem", overflowY: "auto" }}>
              {networks.map((network) => (
                <div className="form-check" key={network.id}>
                  <input
                    id={`networkIds-${network.id}`}
                    type="checkbox"
                    className="form-check-input"
                    value={network.id}
                    {...register("networkIds")}
                  />
                  <label className="form-check-label" htmlFor={`networkIds-${network.id}`}>
                    {network.name}
                  </label>
                </div>
              ))}
              {networks.length === 0 && <p className="text-body-secondary small mb-0">Aucun réseau.</p>}
            </div>
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="produitOceane" className="form-label">
              Produit Océane <span className="text-body-secondary">(optionnel)</span>
            </label>
            <SearchableSelect
              id="produitOceane"
              isInvalid={!!errors.produitOceane}
              placeholder="Sélectionner..."
              value={isCustomProduitOceane ? OTHER_PRODUIT_OCEANE : produitOceaneValue}
              onChange={(value) => {
                if (value === OTHER_PRODUIT_OCEANE) {
                  setIsCustomProduitOceane(true);
                  setValue("produitOceane", "", { shouldValidate: true });
                  return;
                }
                setIsCustomProduitOceane(false);
                setValue("produitOceane", value, { shouldValidate: true });
              }}
              options={[
                ...PRODUIT_OCEANE_OPTIONS.map((option) => ({ value: option, label: option })),
                { value: OTHER_PRODUIT_OCEANE, label: "Autre..." },
              ]}
            />
            {isCustomProduitOceane && (
              <input
                type="text"
                placeholder="Préciser le produit"
                className={`form-control mt-2${errors.produitOceane ? " is-invalid" : ""}`}
                aria-label="Produit Océane (saisie libre)"
                aria-invalid={errors.produitOceane ? "true" : "false"}
                {...register("produitOceane")}
              />
            )}
            {errors.produitOceane && (
              <div className="invalid-feedback d-block" role="alert">
                {errors.produitOceane.message}
              </div>
            )}
          </div>

          <div className="col-12">
            <label htmlFor="comments" className="form-label">
              Commentaires <span className="text-body-secondary">(optionnel)</span>
            </label>
            <textarea id="comments" className="form-control" rows={2} {...register("comments")} />
          </div>
        </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-4">
              <span className="form-label d-block">
                Schéma d&apos;architecture (image) <span className="text-body-secondary">(optionnel)</span>
              </span>

              {mode === "create" || !instance ? (
                <p className="text-body-secondary small mb-0">
                  Disponible une fois l&apos;instance créée — enregistrez d&apos;abord l&apos;instance, puis
                  modifiez-la pour ajouter le schéma.
                </p>
              ) : (
                <>
                  {imageError && (
                    <div className="alert alert-danger py-2 small" role="alert">
                      {imageError}
                    </div>
                  )}

                  {architectureImageUrl ? (
                    <div className={styles.architectureImagePreview}>
                      <img
                        src={getInstanceArchitectureImageUrl(architectureImageUrl) ?? undefined}
                        alt="Schéma d'architecture de l'instance"
                        className="img-fluid rounded border"
                      />
                      <div className="d-flex gap-2 mt-2">
                        <label
                          className={`btn btn-sm btn-outline-secondary mb-0${isImageUploading ? " disabled" : ""}`}
                        >
                          {isImageUploading && (
                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                          )}
                          Remplacer
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={isImageUploading}
                            onChange={handleArchitectureImageUpload}
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={isImageUploading}
                          onClick={handleArchitectureImageRemove}
                        >
                          <i className="bi bi-trash me-1" aria-hidden="true" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      className={`btn btn-sm btn-outline-secondary mb-0${isImageUploading ? " disabled" : ""}`}
                    >
                      {isImageUploading && (
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      )}
                      <i className="bi bi-upload me-1" aria-hidden="true" />
                      Ajouter une image
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={isImageUploading}
                        onChange={handleArchitectureImageUpload}
                      />
                    </label>
                  )}
                </>
              )}
            </div>

            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="form-label mb-0">
                Composants <span className="text-body-secondary">(optionnel)</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => appendComposant({ name: "", description: "", inventaires: [] })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Ajouter un composant
              </button>
            </div>

            {composantFields.length === 0 && (
              <p className="text-body-secondary small mb-0">Aucun composant.</p>
            )}

            {composantFields.map((field, index) => (
              <ComposantFieldGroup
                key={field.id}
                control={control}
                register={register}
                errors={errors}
                composantIndex={index}
                availablePlatforms={availablePlatforms}
                onRemove={() => removeComposant(index)}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="form-label mb-0">
                Niveaux de support <span className="text-body-secondary">(optionnel)</span>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => appendSupportLevel({ supportLevelId: "", responsable: "", telephone: "" })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                Ajouter un niveau de support
              </button>
            </div>

            {supportLevelFields.length === 0 && (
              <p className="text-body-secondary small mb-0">Aucun niveau de support.</p>
            )}

            {supportLevelFields.map((field, index) => (
              <div className="row g-2 align-items-start mb-2" key={field.id}>
                <div className="col-12 col-sm-4">
                  <Controller
                    name={`supportLevels.${index}.supportLevelId` as const}
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        ariaLabel={`Niveau de support ${index + 1}`}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        isInvalid={!!errors.supportLevels?.[index]?.supportLevelId}
                        placeholder="Sélectionner..."
                        options={supportLevels.map((supportLevel) => ({
                          value: String(supportLevel.id),
                          label: supportLevel.name,
                        }))}
                      />
                    )}
                  />
                  {errors.supportLevels?.[index]?.supportLevelId && (
                    <div className="invalid-feedback d-block" role="alert">
                      {errors.supportLevels[index]?.supportLevelId?.message}
                    </div>
                  )}
                </div>
                <div className="col-12 col-sm-3">
                  <input
                    type="text"
                    placeholder="Responsable (optionnel)"
                    aria-label={`Responsable du niveau de support ${index + 1}`}
                    className="form-control"
                    {...register(`supportLevels.${index}.responsable` as const)}
                  />
                </div>
                <div className="col-12 col-sm-4">
                  <input
                    type="tel"
                    placeholder="Téléphone (optionnel)"
                    aria-label={`Téléphone du niveau de support ${index + 1}`}
                    className="form-control"
                    {...register(`supportLevels.${index}.telephone` as const)}
                  />
                </div>
                <div className="col-12 col-sm-1 d-flex">
                  <button
                    type="button"
                    className="btn btn-icon btn-sm text-danger"
                    aria-label={`Supprimer le niveau de support ${index + 1}`}
                    onClick={() => removeSupportLevel(index)}
                  >
                    <i className="bi bi-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </form>
    </ModalShell>
  );
}
