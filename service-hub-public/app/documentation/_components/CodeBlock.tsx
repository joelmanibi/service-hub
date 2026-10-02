"use client";

import { useState } from "react";
import styles from "../Documentation.module.scss";

type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
};

/**
 * Bloc de code de la documentation, avec bouton « Copier ».
 */
export default function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span>{title ?? language ?? "code"}</span>
        <button type="button" className={styles.copyButton} onClick={copy} aria-label="Copier le code">
          <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} me-1`} aria-hidden="true" />
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className={styles.code}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
