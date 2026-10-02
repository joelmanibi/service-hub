"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";
import styles from "../Documentation.module.scss";

export type CodeSample = {
  label: string;
  language: string;
  code: string;
};

/**
 * Exemples d'un même appel dans plusieurs langages (curl, PowerShell,
 * JavaScript, Python…), sous forme d'onglets.
 */
export default function CodeTabs({ samples }: { samples: CodeSample[] }) {
  const [active, setActive] = useState(0);
  const sample = samples[active];

  return (
    <div className="mb-3">
      <div className={styles.tabs} role="tablist">
        {samples.map((item, index) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={`${styles.tab} ${index === active ? styles.tabActive : ""}`}
            onClick={() => setActive(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <CodeBlock code={sample.code} language={sample.language} title={sample.label} />
    </div>
  );
}
