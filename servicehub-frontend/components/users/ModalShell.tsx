"use client";

import { useEffect, type ReactNode } from "react";

type ModalShellProps = {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  size?: "md" | "lg" | "xl";
  scrollable?: boolean;
};

const SIZE_CLASS: Record<"md" | "lg" | "xl", string> = {
  md: "",
  lg: "modal-lg",
  xl: "modal-xl",
};

/**
 * Coquille Bootstrap Modal commune (backdrop + dialog + header/body/footer),
 * pilotée entièrement par l'état React du parent (pas par le JS Boosted :
 * évite les conflits entre l'instance bootstrap.Modal et le rendu
 * conditionnel React). Ferme sur Échap ou clic sur le backdrop.
 * Réutilisée par UserFormModal, ChangeRoleModal et ConfirmActionModal.
 */
export default function ModalShell({
  titleId,
  title,
  onClose,
  children,
  footer,
  size = "md",
  scrollable = false,
}: ModalShellProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className={[
            "modal-dialog modal-dialog-centered",
            SIZE_CLASS[size],
            scrollable ? "modal-dialog-scrollable" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5 mb-0" id={titleId}>
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Fermer" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">{footer}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
