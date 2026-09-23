import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center flex-fill text-center py-5">
      <Image src="/orange-logo.svg" alt="Orange" width={48} height={48} className="mb-4" />
      <h1 className="fw-bold mb-2">Page introuvable</h1>
      <p className="text-body-secondary mb-4">Ce service n&apos;existe pas ou n&apos;est plus disponible.</p>
      <Link href="/" className="btn btn-primary">
        Retour au catalogue
      </Link>
    </div>
  );
}
