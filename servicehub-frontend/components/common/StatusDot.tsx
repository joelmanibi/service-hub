import { getStatusDotVariant } from "@/lib/statusDot";

type StatusDotProps = {
  label: string;
};

/**
 * Point coloré + libellé pour le statut d'une instance (StatutInstance) :
 * vert pour "En service", rouge pour "Décommissionné", gris pour tout
 * autre statut.
 */
export default function StatusDot({ label }: StatusDotProps) {
  return (
    <span className="d-inline-flex align-items-center gap-2 text-nowrap">
      <span
        className={`rounded-circle bg-${getStatusDotVariant(label)}`}
        style={{ width: "0.55rem", height: "0.55rem", flex: "0 0 auto" }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
