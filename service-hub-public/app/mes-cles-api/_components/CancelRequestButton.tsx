"use client";

import { useState, useTransition } from "react";
import { cancelApiKeyRequestAction } from "../../_actions/apiKeys";

export default function CancelRequestButton({ requestId }: { requestId: number }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cancel = () => {
    if (!window.confirm("Annuler cette demande de clé ?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelApiKeyRequestAction(requestId);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancel} disabled={isPending}>
        {isPending && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />}
        Annuler
      </button>
      {error && <div className="small text-danger mt-1">{error}</div>}
    </>
  );
}
