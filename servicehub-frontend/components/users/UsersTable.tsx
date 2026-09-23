import type { ManagedUser } from "./mockUsers";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";

type UsersTableProps = {
  users: ManagedUser[];
  onEdit: (user: ManagedUser) => void;
  onChangeRole: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  onResetAccess: (user: ManagedUser) => void;
};

/**
 * Table Bootstrap des utilisateurs — colonnes secondaires (login,
 * dernière connexion) masquées sous le breakpoint md pour rester lisible
 * sur mobile (le scroll horizontal de .table-responsive reste le filet
 * de sécurité pour les colonnes restantes). Actions regroupées dans un
 * menu déroulant par ligne (Bootstrap dropdown, déjà piloté par le JS
 * Boosted chargé par AppLayout).
 */
export default function UsersTable({
  users,
  onEdit,
  onChangeRole,
  onToggleStatus,
  onResetAccess,
}: UsersTableProps) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Email</th>
              <th scope="col" className="d-none d-md-table-cell">
                Login
              </th>
              <th scope="col">Rôle</th>
              <th scope="col">Statut</th>
              <th scope="col" className="d-none d-lg-table-cell">
                Dernière connexion
              </th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="fw-semibold">
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td className="d-none d-md-table-cell">{user.login}</td>
                <td>
                  <RoleBadge role={user.role} />
                </td>
                <td>
                  <StatusBadge isActive={user.isActive} />
                </td>
                <td className="d-none d-lg-table-cell">{user.lastLoginAt ?? "Jamais connecté"}</td>
                <td className="text-end">
                  <div className="dropdown">
                    <button
                      type="button"
                      className="btn btn-icon btn-sm"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label={`Actions pour ${user.firstName} ${user.lastName}`}
                    >
                      <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button type="button" className="dropdown-item" onClick={() => onEdit(user)}>
                          <i className="bi bi-pencil me-2" aria-hidden="true" />
                          Modifier
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => onChangeRole(user)}
                        >
                          <i className="bi bi-person-badge me-2" aria-hidden="true" />
                          Changer le rôle
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => onResetAccess(user)}
                        >
                          <i className="bi bi-arrow-counterclockwise me-2" aria-hidden="true" />
                          Réinitialiser l&apos;accès
                        </button>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          type="button"
                          className={`dropdown-item ${user.isActive ? "text-danger" : ""}`}
                          onClick={() => onToggleStatus(user)}
                        >
                          <i
                            className={`bi ${user.isActive ? "bi-slash-circle" : "bi-check-circle"} me-2`}
                            aria-hidden="true"
                          />
                          {user.isActive ? "Désactiver" : "Réactiver"}
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-body-secondary py-4">
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
