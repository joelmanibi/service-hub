/**
 * Titre + sous-titre communs à toutes les pages d'authentification.
 */
export default function AuthHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <h1 className="h3 fw-bold mb-2">{title}</h1>
      <p className="text-body-secondary mb-4">{subtitle}</p>
    </>
  );
}
