type SubmitButtonProps = {
  isSubmitting: boolean;
  label: string;
  loadingLabel: string;
};

/**
 * Bouton de soumission avec spinner Boosted pendant le chargement,
 * partagé par les trois formulaires d'authentification.
 */
export default function SubmitButton({
  isSubmitting,
  label,
  loadingLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className="btn btn-primary w-100"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting && (
        // Purement décoratif : le libellé ci-dessous porte l'information
        // d'état (annoncée via aria-busy sur le bouton), donc aria-hidden
        // seul suffit — pas de role="status" (ignoré par les lecteurs
        // d'écran sur un élément masqué de l'arbre d'accessibilité).
        <span
          className="spinner-border spinner-border-sm me-2"
          aria-hidden="true"
        />
      )}
      <span>{isSubmitting ? loadingLabel : label}</span>
    </button>
  );
}
