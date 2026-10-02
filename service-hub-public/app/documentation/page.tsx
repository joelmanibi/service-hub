import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import Header from "../_components/Header";
import CodeBlock from "./_components/CodeBlock";
import CodeTabs, { type CodeSample } from "./_components/CodeTabs";
import styles from "./Documentation.module.scss";

export const metadata: Metadata = {
  title: "Documentation de l'API — ServiceHub",
  description: "Documentation de l'API d'intégration ServiceHub : authentification, endpoints, paramètres et exemples.",
};

// URL de base de l'API telle que l'appelant externe la voit : domaine du
// site (derrière le reverse proxy, /api/v1 est relayé vers le backend).
// Surcharge possible par PUBLIC_API_BASE_URL.
async function resolveBaseUrl(): Promise<string> {
  if (process.env.PUBLIC_API_BASE_URL) return process.env.PUBLIC_API_BASE_URL.replace(/\/+$/, "");

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3001";
  const forwardedProto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}/api/v1`;
}

const TOC: { id: string; label: string; sub?: boolean }[] = [
  { id: "introduction", label: "Introduction" },
  { id: "obtenir-une-cle", label: "Obtenir une clé d'API" },
  { id: "authentification", label: "Authentification" },
  { id: "conventions", label: "URL de base et conventions" },
  { id: "endpoints", label: "Endpoints" },
  { id: "liste-instances", label: "Lister les instances", sub: true },
  { id: "instance-par-id", label: "Fiche d'une instance", sub: true },
  { id: "instances-par-pod", label: "Instances d'un POD", sub: true },
  { id: "modele", label: "Modèle de données" },
  { id: "pagination", label: "Pagination et synchronisation" },
  { id: "erreurs", label: "Codes d'erreur" },
  { id: "bonnes-pratiques", label: "Sécurité et bonnes pratiques" },
  { id: "faq", label: "Questions fréquentes" },
];

type ParamRow = { name: string; type: string; required?: boolean; description: ReactNode };

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="table-responsive mb-3">
      <table className={`table table-sm align-middle ${styles.paramTable}`}>
        <thead className="table-light">
          <tr>
            <th scope="col">Paramètre</th>
            <th scope="col">Type</th>
            <th scope="col">Obligatoire</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td className="text-nowrap">{row.type}</td>
              <td>{row.required ? <span className="badge text-bg-dark">Oui</span> : "Non"}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Endpoint({ path }: { path: string }) {
  return (
    <div className={styles.endpoint}>
      <span className={styles.method}>GET</span>
      <span>{path}</span>
    </div>
  );
}

function Callout({ icon = "bi-info-circle", children }: { icon?: string; children: ReactNode }) {
  return (
    <div className={styles.callout}>
      <i className={`bi ${icon} text-primary`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

function samples(baseUrl: string, path: string): CodeSample[] {
  const url = `${baseUrl}${path}`;
  return [
    {
      label: "curl",
      language: "bash",
      code: `curl -s "${url}" \\\n  -H "X-API-Key: $SERVICEHUB_API_KEY" \\\n  -H "Accept: application/json"`,
    },
    {
      label: "PowerShell",
      language: "powershell",
      code: `$headers = @{ "X-API-Key" = $env:SERVICEHUB_API_KEY }\n$response = Invoke-RestMethod -Uri "${url}" -Headers $headers\n$response.data`,
    },
    {
      label: "JavaScript (Node 18+)",
      language: "javascript",
      code: `const response = await fetch("${url}", {\n  headers: { "X-API-Key": process.env.SERVICEHUB_API_KEY },\n});\nif (!response.ok) {\n  throw new Error(\`ServiceHub \${response.status} : \${(await response.json()).message}\`);\n}\nconst { data } = await response.json();\nconsole.log(data);`,
    },
    {
      label: "Python",
      language: "python",
      code: `import os\nimport requests\n\nresponse = requests.get(\n    "${url}",\n    headers={"X-API-Key": os.environ["SERVICEHUB_API_KEY"]},\n    timeout=30,\n)\nresponse.raise_for_status()\ndata = response.json()["data"]\nprint(data)`,
    },
  ];
}

const INSTANCE_EXAMPLE = `{
  "id": 2,
  "code": "INST-000002",
  "name": "INTEROP RDC",
  "comments": "Instance de production",
  "produitOceane": "INTEROP_RDC",
  "architectureImageUrl": "/uploads/1785153533607-716509051.png",
  "createdAt": "2026-07-28T09:12:44.000Z",
  "updatedAt": "2026-09-30T14:03:10.000Z",
  "service": {
    "id": 2,
    "code": "SRV-INTEROP",
    "name": "Interopérabilité",
    "serviceType": { "id": 1, "code": "APP", "name": "Application" }
  },
  "client": {
    "id": 2,
    "code": "ORDC",
    "name": "Orange RDC",
    "country": { "id": 5, "code": "CD", "name": "RD Congo" },
    "typeClient": { "id": 1, "code": "FIL", "name": "Filiale" }
  },
  "pod": { "id": 1, "code": "WECA", "name": "WECA" },
  "statutInstance": { "id": 1, "code": "EN_SERVICE", "name": "EN SERVICE" },
  "environments": [{ "id": 5, "code": "PROD", "name": "Production" }],
  "hostings": [{ "id": 3, "code": "MTC-RDC", "name": "MTC RDC" }],
  "networks": [],
  "composants": [
    {
      "id": 24,
      "name": "Serveur applicatif",
      "description": null,
      "platform": { "id": 4, "name": "OPC_OBW", "hostingId": 3 },
      "inventaires": [
        { "id": 46, "ip": "10.0.0.11", "nomServeur": "srv-app-01" },
        { "id": 47, "ip": "10.0.0.12", "nomServeur": "srv-app-02" }
      ]
    }
  ],
  "supportLevels": [
    {
      "id": 22,
      "supportLevel": { "id": 2, "code": "N2", "name": "Support applicatif" },
      "responsable": "Équipe GOS",
      "telephone": "+225 07 00 00 00 00"
    }
  ]
}`;

const LIST_RESPONSE_EXAMPLE = `{
  "success": true,
  "message": "Liste des instances",
  "data": {
    "items": [
      { "id": 2, "code": "INST-000002", "name": "INTEROP RDC", "...": "fiche complète (voir Modèle de données)" }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 37,
      "totalPages": 1,
      "hasNextPage": false
    }
  }
}`;

const POD_RESPONSE_EXAMPLE = `{
  "success": true,
  "message": "Liste des instances du POD",
  "data": {
    "pod": { "id": 1, "code": "WECA", "name": "WECA" },
    "items": [ { "id": 9, "code": "INST-000009", "name": "...", "...": "..." } ],
    "pagination": { "page": 1, "limit": 100, "total": 9, "totalPages": 1, "hasNextPage": false }
  }
}`;

const ERROR_EXAMPLE = `{
  "success": false,
  "message": "Clé d'API invalide, révoquée ou expirée"
}`;

function fullSyncSamples(baseUrl: string): CodeSample[] {
  return [
    {
      label: "bash + jq",
      language: "bash",
      code: `#!/usr/bin/env bash
# Récupère toutes les instances, page par page, dans instances.json
set -euo pipefail
BASE="${baseUrl}"
page=1
echo "[]" > instances.json
while : ; do
  body=$(curl -sf "$BASE/integration/instances?page=$page&limit=500" -H "X-API-Key: $SERVICEHUB_API_KEY")
  jq -s '.[0] + .[1].data.items' instances.json <(echo "$body") > tmp.json && mv tmp.json instances.json
  [ "$(echo "$body" | jq '.data.pagination.hasNextPage')" = "true" ] || break
  page=$((page + 1))
done
echo "$(jq length instances.json) instances récupérées"`,
    },
    {
      label: "JavaScript (Node 18+)",
      language: "javascript",
      code: `const BASE = "${baseUrl}";
const headers = { "X-API-Key": process.env.SERVICEHUB_API_KEY };

async function fetchAllInstances(params = {}) {
  const all = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ ...params, page, limit: 500 });
    const res = await fetch(\`\${BASE}/integration/instances?\${query}\`, { headers });
    if (!res.ok) throw new Error(\`ServiceHub \${res.status} : \${(await res.json()).message}\`);
    const { data } = await res.json();
    all.push(...data.items);
    if (!data.pagination.hasNextPage) return all;
  }
}

const instances = await fetchAllInstances();
console.log(\`\${instances.length} instances\`);`,
    },
    {
      label: "Python",
      language: "python",
      code: `import os
import requests

BASE = "${baseUrl}"
HEADERS = {"X-API-Key": os.environ["SERVICEHUB_API_KEY"]}

def fetch_all_instances(**params):
    instances, page = [], 1
    while True:
        response = requests.get(
            f"{BASE}/integration/instances",
            headers=HEADERS,
            params={**params, "page": page, "limit": 500},
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()["data"]
        instances.extend(data["items"])
        if not data["pagination"]["hasNextPage"]:
            return instances
        page += 1

print(len(fetch_all_instances()), "instances")`,
    },
  ];
}

/**
 * Documentation de l'API d'intégration (applications externes) :
 * obtention d'une clé, authentification, endpoints avec paramètres,
 * exemples (curl, PowerShell, JavaScript, Python), modèle de données,
 * pagination, erreurs et bonnes pratiques. L'URL de base affichée est
 * celle du domaine courant (cf. resolveBaseUrl).
 */
export default async function DocumentationPage() {
  const baseUrl = await resolveBaseUrl();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-fill bg-body-tertiary py-4 px-3 px-lg-5">
        <div className={styles.layout}>
          <nav className="d-none d-lg-block" aria-label="Sommaire de la documentation">
            <div className={styles.toc}>
              <p className="small fw-semibold text-uppercase text-body-secondary mb-2 ps-2">Sommaire</p>
              {TOC.map((entry) => (
                <a key={entry.id} href={`#${entry.id}`} className={entry.sub ? styles.tocSub : undefined}>
                  {entry.label}
                </a>
              ))}
            </div>
          </nav>

          <article className={styles.content}>
            <section className={styles.hero} id="introduction">
              <span className={styles.heroBadge}>API v1 · lecture seule</span>
              <h1 className="fw-semibold mt-3 mb-2">API d&apos;intégration ServiceHub</h1>
              <p className="mb-3 opacity-75">
                Interrogez le référentiel des instances de services depuis vos applications : fiches complètes
                (service, client, POD, statut, environnements, hébergements, composants, inventaire IP/serveurs,
                niveaux de support), filtres et synchronisation incrémentale.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link href="/mes-cles-api" className="btn btn-primary btn-sm">
                  <i className="bi bi-key me-2" aria-hidden="true" />
                  Demander une clé d&apos;API
                </Link>
                <a href="#liste-instances" className="btn btn-outline-light btn-sm">
                  Voir les endpoints
                </a>
              </div>
            </section>

            <p className="mt-4">
              L&apos;API est une API <strong>REST</strong>, en <strong>lecture seule</strong>, qui renvoie du{" "}
              <strong>JSON</strong> encodé en UTF-8. Elle est destinée aux appels <strong>de serveur à serveur</strong>{" "}
              (scripts, outils de supervision, CMDB, applications métier) : la clé d&apos;API ne doit jamais être
              embarquée dans du code exécuté dans un navigateur ou une application mobile.
            </p>

            <h2 id="obtenir-une-cle">Obtenir une clé d&apos;API</h2>
            <p>Chaque application qui appelle l&apos;API utilise sa propre clé. Pour en obtenir une :</p>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <strong>Connectez-vous</strong> au catalogue (bouton « Se connecter » en haut à droite) avec votre compte
                ServiceHub. Un code de connexion vous est envoyé par email.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                Ouvrez <Link href="/mes-cles-api">Mes clés d&apos;API</Link> et remplissez le formulaire de{" "}
                <strong>demande de clé</strong> : nom de l&apos;application, usage prévu (données utilisées, fréquence
                d&apos;appel…) et durée de validité souhaitée.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                Un <strong>administrateur</strong> examine la demande. Vous recevez un email dès qu&apos;elle est
                approuvée ou refusée.
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div>
                Une fois la demande approuvée, la clé apparaît dans <Link href="/mes-cles-api">Mes clés d&apos;API</Link>.
                Cliquez sur <strong>« Afficher la clé »</strong> pour la copier.
              </div>
            </div>
            <Callout icon="bi-shield-lock">
              <strong>Confidentialité :</strong> une clé n&apos;est visible que par vous (le demandeur) et par les
              administrateurs ServiceHub. Elle n&apos;est jamais envoyée par email. Chaque affichage est journalisé.
            </Callout>

            <h2 id="authentification">Authentification</h2>
            <p>
              Chaque requête doit présenter la clé d&apos;API dans <strong>l&apos;un</strong> des deux en-têtes HTTP
              suivants :
            </p>
            <ParamTable
              rows={[
                {
                  name: "X-API-Key",
                  type: "en-tête",
                  description: (
                    <>
                      La clé seule. Ex. : <code>X-API-Key: shk_AbC123…</code> (forme recommandée).
                    </>
                  ),
                },
                {
                  name: "Authorization",
                  type: "en-tête",
                  description: (
                    <>
                      Schéma Bearer. Ex. : <code>Authorization: Bearer shk_AbC123…</code>
                    </>
                  ),
                },
              ]}
            />
            <p>
              Une clé commence toujours par <code>shk_</code>. Une clé absente, inconnue, <strong>révoquée</strong> ou{" "}
              <strong>expirée</strong> est refusée avec le code <code>401</code>. Ne passez jamais la clé dans
              l&apos;URL (paramètre de requête) : elle apparaîtrait dans les journaux des serveurs et des proxys.
            </p>
            <CodeTabs
              samples={[
                {
                  label: "X-API-Key",
                  language: "bash",
                  code: `curl -s "${baseUrl}/integration/instances?limit=1" \\\n  -H "X-API-Key: shk_VOTRE_CLE"`,
                },
                {
                  label: "Authorization: Bearer",
                  language: "bash",
                  code: `curl -s "${baseUrl}/integration/instances?limit=1" \\\n  -H "Authorization: Bearer shk_VOTRE_CLE"`,
                },
              ]}
            />
            <p>
              Dans les exemples suivants, la clé est lue depuis la variable d&apos;environnement{" "}
              <code>SERVICEHUB_API_KEY</code> :
            </p>
            <CodeTabs
              samples={[
                { label: "bash", language: "bash", code: 'export SERVICEHUB_API_KEY="shk_VOTRE_CLE"' },
                { label: "PowerShell", language: "powershell", code: '$env:SERVICEHUB_API_KEY = "shk_VOTRE_CLE"' },
              ]}
            />

            <h2 id="conventions">URL de base et conventions</h2>
            <p>Toutes les URL de cette documentation sont relatives à l&apos;URL de base :</p>
            <CodeBlock code={baseUrl} title="URL de base" />
            <ul>
              <li>
                <strong>Méthode</strong> : toutes les routes sont en <code>GET</code>. Aucune route ne modifie de
                données.
              </li>
              <li>
                <strong>Enveloppe de réponse</strong> : chaque réponse est un objet{" "}
                <code>{"{ success, message, data }"}</code>. <code>success</code> vaut <code>true</code> en cas de
                succès ; les données utiles sont dans <code>data</code>.
              </li>
              <li>
                <strong>Dates</strong> : format ISO 8601 en UTC (ex. <code>2026-09-30T14:03:10.000Z</code>).
              </li>
              <li>
                <strong>Références</strong> : les objets liés (service, POD, statut, environnement…) sont renvoyés sous la
                forme <code>{"{ id, code, name }"}</code>. Une valeur absente vaut <code>null</code> (objet) ou{" "}
                <code>[]</code> (liste).
              </li>
              <li>
                <strong>Tri</strong> : les listes sont triées par <code>id</code> croissant, ce qui garantit une
                pagination stable.
              </li>
            </ul>

            <h2 id="endpoints">Endpoints</h2>
            <div className="table-responsive mb-3">
              <table className={`table table-sm align-middle ${styles.paramTable}`}>
                <thead className="table-light">
                  <tr>
                    <th scope="col">Méthode</th>
                    <th scope="col">Route</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GET</td>
                    <td>
                      <a href="#liste-instances">
                        <code>/integration/instances</code>
                      </a>
                    </td>
                    <td>Liste paginée et filtrable des instances (fiches complètes)</td>
                  </tr>
                  <tr>
                    <td>GET</td>
                    <td>
                      <a href="#instance-par-id">
                        <code>/integration/instances/{"{id}"}</code>
                      </a>
                    </td>
                    <td>Fiche complète d&apos;une instance</td>
                  </tr>
                  <tr>
                    <td>GET</td>
                    <td>
                      <a href="#instances-par-pod">
                        <code>/integration/pods/{"{pod}"}/instances</code>
                      </a>
                    </td>
                    <td>Instances d&apos;un POD (désigné par son code, son nom ou son id)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 id="liste-instances">Lister les instances</h3>
            <Endpoint path="/integration/instances" />
            <p>
              Renvoie les instances avec leur fiche complète, page par page. Tous les paramètres sont facultatifs et se
              combinent (ET logique).
            </p>
            <p className="fw-semibold mb-2">Paramètres de requête (query string)</p>
            <ParamTable
              rows={[
                { name: "page", type: "entier ≥ 1", description: "Numéro de page. Défaut : 1." },
                {
                  name: "limit",
                  type: "entier 1–500",
                  description: "Nombre d'instances par page. Défaut : 100, maximum : 500.",
                },
                { name: "serviceId", type: "entier", description: "Ne renvoie que les instances de ce service." },
                { name: "clientId", type: "entier", description: "Ne renvoie que les instances de ce client." },
                {
                  name: "podId",
                  type: "entier",
                  description: (
                    <>
                      Ne renvoie que les instances de ce POD (voir aussi{" "}
                      <a href="#instances-par-pod">la route dédiée</a>, qui accepte le code du POD).
                    </>
                  ),
                },
                { name: "statutInstanceId", type: "entier", description: "Ne renvoie que les instances de ce statut." },
                {
                  name: "updatedSince",
                  type: "date ISO 8601",
                  description: (
                    <>
                      Ne renvoie que les instances modifiées <strong>depuis</strong> cette date (incluse). Ex. :{" "}
                      <code>2026-09-01</code> ou <code>2026-09-01T08:00:00Z</code>. Voir{" "}
                      <a href="#pagination">synchronisation incrémentale</a>.
                    </>
                  ),
                },
              ]}
            />
            <p className="fw-semibold mb-2">Exemple de requête</p>
            <CodeTabs samples={samples(baseUrl, "/integration/instances?page=1&limit=100")} />
            <p className="fw-semibold mb-2">Avec filtres</p>
            <CodeBlock
              language="bash"
              title="curl"
              code={`# Instances du service 12, en service (statut 1), modifiées depuis le 1er septembre 2026\ncurl -s "${baseUrl}/integration/instances?serviceId=12&statutInstanceId=1&updatedSince=2026-09-01" \\\n  -H "X-API-Key: $SERVICEHUB_API_KEY"`}
            />
            <p className="fw-semibold mb-2">
              Réponse <code>200 OK</code>
            </p>
            <CodeBlock language="json" title="JSON" code={LIST_RESPONSE_EXAMPLE} />
            <ParamTable
              rows={[
                { name: "data.items", type: "tableau", description: <a href="#modele">Instances</a> },
                { name: "data.pagination.page", type: "entier", description: "Page renvoyée." },
                { name: "data.pagination.limit", type: "entier", description: "Taille de page appliquée." },
                { name: "data.pagination.total", type: "entier", description: "Nombre total d'instances correspondant aux filtres." },
                { name: "data.pagination.totalPages", type: "entier", description: "Nombre total de pages." },
                {
                  name: "data.pagination.hasNextPage",
                  type: "booléen",
                  description: "true s'il reste des pages à lire : continuez avec page + 1.",
                },
              ]}
            />

            <h3 id="instance-par-id">Fiche d&apos;une instance</h3>
            <Endpoint path="/integration/instances/{id}" />
            <p className="fw-semibold mb-2">Paramètre de chemin</p>
            <ParamTable
              rows={[{ name: "id", type: "entier", required: true, description: "Identifiant de l'instance (champ id)." }]}
            />
            <p className="fw-semibold mb-2">Exemple de requête</p>
            <CodeTabs samples={samples(baseUrl, "/integration/instances/2")} />
            <p className="fw-semibold mb-2">
              Réponse <code>200 OK</code>
            </p>
            <CodeBlock
              language="json"
              title="JSON"
              code={`{\n  "success": true,\n  "message": "Fiche de l'instance",\n  "data": ${INSTANCE_EXAMPLE.replace(/\n/g, "\n  ")}\n}`}
            />
            <p>
              La fiche unitaire contient en plus l&apos;objet <code>escalation</code> : la{" "}
              <a href="#escalade">matrice d&apos;escalade GOS</a> de l&apos;instance (absente des listes, où elle serait
              répétée à l&apos;identique).
            </p>
            <p>
              Instance inexistante : <code>404</code> avec <code>{'"message": "Instance introuvable"'}</code>.
            </p>

            <h3 id="instances-par-pod">Instances d&apos;un POD</h3>
            <Endpoint path="/integration/pods/{pod}/instances" />
            <p>
              Renvoie toutes les instances rattachées à un POD, avec le même format et la même pagination que{" "}
              <a href="#liste-instances">la liste des instances</a>, plus l&apos;objet <code>data.pod</code>.
            </p>
            <p className="fw-semibold mb-2">Paramètre de chemin</p>
            <ParamTable
              rows={[
                {
                  name: "pod",
                  type: "texte",
                  required: true,
                  description: (
                    <>
                      <strong>Code</strong> (ex. <code>WECA</code>), <strong>nom</strong> ou <strong>id</strong> du POD.
                      Insensible à la casse : <code>WECA</code>, <code>weca</code> et <code>1</code> désignent le même
                      POD. Encodez les espaces éventuels (<code>%20</code>).
                    </>
                  ),
                },
              ]}
            />
            <p className="fw-semibold mb-2">Paramètres de requête (facultatifs)</p>
            <p>
              Identiques à <a href="#liste-instances">la liste des instances</a> : <code>page</code>, <code>limit</code>,{" "}
              <code>serviceId</code>, <code>clientId</code>, <code>statutInstanceId</code>, <code>updatedSince</code>.
              Le paramètre <code>podId</code> est interdit sur cette route (<code>400</code>), le POD étant porté par
              l&apos;URL.
            </p>
            <p className="fw-semibold mb-2">Exemple de requête</p>
            <CodeTabs samples={samples(baseUrl, "/integration/pods/WECA/instances")} />
            <p className="fw-semibold mb-2">
              Réponse <code>200 OK</code>
            </p>
            <CodeBlock language="json" title="JSON" code={POD_RESPONSE_EXAMPLE} />
            <p>
              POD inconnu : <code>404</code> avec <code>{'"message": "POD introuvable : \\"XYZ\\""'}</code>.
            </p>

            <h2 id="modele">Modèle de données</h2>
            <h3>Instance</h3>
            <ParamTable
              rows={[
                { name: "id", type: "entier", description: "Identifiant unique de l'instance." },
                { name: "code", type: "texte", description: "Code fonctionnel unique (ex. INST-000002)." },
                { name: "name", type: "texte", description: "Nom de l'instance." },
                { name: "comments", type: "texte | null", description: "Commentaires libres." },
                { name: "produitOceane", type: "texte | null", description: "Produit Océane associé." },
                {
                  name: "architectureImageUrl",
                  type: "texte | null",
                  description: (
                    <>
                      Chemin du schéma d&apos;architecture (image), à préfixer par le domaine du site (ex.{" "}
                      <code>{baseUrl.replace(/\/api\/v1$/, "")}/uploads/…</code>).
                    </>
                  ),
                },
                { name: "createdAt / updatedAt", type: "date ISO", description: "Dates de création et de dernière modification." },
                { name: "service", type: "objet", description: "{ id, code, name, serviceType } — service déployé." },
                {
                  name: "client",
                  type: "objet",
                  description: "{ id, code, name, country, typeClient } — client de l'instance, avec son pays.",
                },
                { name: "pod", type: "référence", description: "POD de rattachement." },
                { name: "statutInstance", type: "référence", description: "Statut (ex. EN SERVICE, DÉCOMMISSIONNÉ)." },
                { name: "environments", type: "référence[]", description: "Environnements (DEV, PREPROD, PROD…)." },
                { name: "hostings", type: "référence[]", description: "Sites d'hébergement." },
                { name: "networks", type: "référence[]", description: "Dépendances réseau." },
                { name: "composants", type: "Composant[]", description: "Composants techniques et leur inventaire." },
                { name: "supportLevels", type: "NiveauSupport[]", description: "Niveaux de support et contacts." },
              ]}
            />
            <h3>Référence</h3>
            <ParamTable
              rows={[
                { name: "id", type: "entier", description: "Identifiant." },
                { name: "code", type: "texte", description: "Code court." },
                { name: "name", type: "texte", description: "Libellé." },
              ]}
            />
            <h3>Composant</h3>
            <ParamTable
              rows={[
                { name: "id", type: "entier", description: "Identifiant du composant." },
                { name: "name", type: "texte", description: "Nom (ex. Serveur applicatif, Base de données)." },
                { name: "description", type: "texte | null", description: "Description." },
                { name: "platform", type: "objet | null", description: "{ id, name, hostingId } — plateforme d'exécution." },
                { name: "inventaires", type: "Inventaire[]", description: "Serveurs du composant." },
              ]}
            />
            <h3>Inventaire</h3>
            <ParamTable
              rows={[
                { name: "id", type: "entier", description: "Identifiant." },
                { name: "ip", type: "texte", description: "Adresse IP (IPv4 ou IPv6)." },
                { name: "nomServeur", type: "texte", description: "Nom du serveur." },
              ]}
            />
            <h3>Niveau de support</h3>
            <ParamTable
              rows={[
                { name: "id", type: "entier", description: "Identifiant de l'affectation." },
                { name: "supportLevel", type: "référence", description: "Niveau (ex. Support applicatif, N3)." },
                { name: "responsable", type: "texte | null", description: "Équipe ou personne responsable." },
                { name: "telephone", type: "texte | null", description: "Téléphone de contact." },
              ]}
            />
            <p className="fw-semibold mb-2">Exemple complet d&apos;instance</p>
            <CodeBlock language="json" title="JSON" code={INSTANCE_EXAMPLE} />

            <h3 id="escalade">Matrice d&apos;escalade (fiche unitaire)</h3>
            <p>
              Renvoyée dans <code>data.escalation</code> par <a href="#instance-par-id">la fiche d&apos;une instance</a>.
              L&apos;escalade <strong>managériale</strong> est la même pour toutes les instances ; l&apos;escalade{" "}
              <strong>technique</strong> comprend la ligne commune « Normal Process » et la ligne propre au{" "}
              <strong>POD de l&apos;instance</strong> (<code>podEscalation</code>, <code>null</code> si elle n&apos;est pas
              encore définie). Un contact a la forme <code>{"{ name, email, phones: [{ label, number }] }"}</code>, où{" "}
              <code>label</code> vaut <code>F</code> (fixe) ou <code>M</code> (mobile).
            </p>
            <CodeBlock
              language="json"
              title="JSON — data.escalation"
              code={`{
  "managerial": {
    "intro": "GOS provides L1 & L2 support during business and non business hours",
    "availability": "24/7",
    "businessHours": "Monday - Friday 08h-17h GMT",
    "eds": "555402",
    "note": "Un client peut escalader sa requête au niveau supérieur lorsqu'il est insatisfait",
    "levels": [
      {
        "level": "Escalation L1",
        "contact": "Nom du contact",
        "phones": [{ "label": "F", "number": "+225 27 00 00 00 00" }, { "label": "M", "number": "+225 07 00 00 00 00" }],
        "email": "contact.l1@orange.com"
      }
    ]
  },
  "technical": {
    "normalProcess": {
      "cluster": "Service Desk & Monitoring",
      "countries": "All Countries\\nAll Partners",
      "qualityAnalyst": { "name": "Service desk", "email": "...", "phones": [ ... ] },
      "headOfCluster": { "name": "...", "email": "...", "phones": [ ... ] }
    },
    "pod": { "id": 2, "code": "MENA", "name": "MENA" },
    "podEscalation": {
      "pod": { "id": 2, "code": "MENA", "name": "MENA" },
      "countries": "Orange Tunisia\\nOrange Maroc\\nOrange Jordan",
      "qualityAnalyst": { "name": "...", "email": "...", "phones": [ ... ] },
      "headOfCluster": { "name": "...", "email": "...", "phones": [ ... ] }
    },
    "process": [
      { "step": "Normal Process", "target": "Service Desk & Monitoring" },
      { "step": "Escalation 1", "target": "Quality Analyst" },
      { "step": "Escalation 2", "target": "Support Leader (Head of cluster)" }
    ]
  }
}`}
            />

            <h2 id="pagination">Pagination et synchronisation</h2>
            <h3>Récupérer toutes les instances</h3>
            <p>
              Demandez les pages successivement (<code>page=1</code>, <code>page=2</code>…) tant que{" "}
              <code>data.pagination.hasNextPage</code> vaut <code>true</code>. Utilisez <code>limit=500</code> pour
              limiter le nombre d&apos;appels.
            </p>
            <CodeTabs samples={fullSyncSamples(baseUrl)} />
            <h3>Synchronisation incrémentale</h3>
            <p>Pour maintenir une copie à jour sans tout retélécharger :</p>
            <ol>
              <li>Faites une première récupération complète et mémorisez l&apos;heure de début de cette récupération.</li>
              <li>
                Aux exécutions suivantes, appelez la liste avec <code>updatedSince=&lt;heure mémorisée&gt;</code> : seules
                les instances créées ou modifiées depuis sont renvoyées. Mettez à jour votre copie par <code>id</code>.
              </li>
              <li>Mémorisez la nouvelle heure de début, et ainsi de suite.</li>
            </ol>
            <CodeBlock
              language="bash"
              title="curl"
              code={`curl -s "${baseUrl}/integration/instances?updatedSince=2026-10-01T06:00:00Z&limit=500" \\\n  -H "X-API-Key: $SERVICEHUB_API_KEY"`}
            />
            <Callout>
              Une instance <strong>supprimée</strong> n&apos;apparaît plus dans les réponses. Pour détecter les
              suppressions, refaites périodiquement (par exemple chaque nuit) une récupération complète et comparez les{" "}
              <code>id</code>.
            </Callout>

            <h2 id="erreurs">Codes d&apos;erreur</h2>
            <p>
              En cas d&apos;erreur, <code>success</code> vaut <code>false</code> et <code>message</code> décrit le
              problème :
            </p>
            <CodeBlock language="json" title={"Exemple — 401"} code={ERROR_EXAMPLE} />
            <div className="table-responsive mb-3">
              <table className={`table table-sm align-middle ${styles.paramTable}`}>
                <thead className="table-light">
                  <tr>
                    <th scope="col">Code HTTP</th>
                    <th scope="col">Signification</th>
                    <th scope="col">Que faire</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>200</code>
                    </td>
                    <td>Succès.</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>
                      <code>400</code>
                    </td>
                    <td>
                      Paramètre invalide (ex. <code>limit=9999</code>, date mal formée, <code>podId</code> sur la route
                      d&apos;un POD).
                    </td>
                    <td>Corrigez la requête d&apos;après le message.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>401</code>
                    </td>
                    <td>Clé absente, invalide, révoquée ou expirée.</td>
                    <td>Vérifiez l&apos;en-tête ; si la clé a expiré ou été révoquée, faites une nouvelle demande.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>404</code>
                    </td>
                    <td>Instance ou POD introuvable, ou route inexistante.</td>
                    <td>Vérifiez l&apos;identifiant et l&apos;URL.</td>
                  </tr>
                  <tr>
                    <td>
                      <code>500</code>
                    </td>
                    <td>Erreur interne.</td>
                    <td>Réessayez plus tard ; si l&apos;erreur persiste, contactez l&apos;équipe ServiceHub.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="bonnes-pratiques">Sécurité et bonnes pratiques</h2>
            <ul>
              <li>
                <strong>Gardez la clé secrète</strong> : stockez-la dans un coffre-fort de secrets ou une variable
                d&apos;environnement, jamais dans le code source, un dépôt Git, un ticket ou un email.
              </li>
              <li>
                <strong>Appels serveur à serveur uniquement</strong> : n&apos;utilisez jamais la clé dans un navigateur ou
                une application mobile.
              </li>
              <li>
                <strong>Une clé par application</strong> : elle permet de suivre l&apos;usage (date et IP de dernière
                utilisation) et de révoquer un accès sans impacter les autres.
              </li>
              <li>
                <strong>Clé compromise ?</strong> Prévenez immédiatement un administrateur ServiceHub : la révocation est
                effective instantanément. Faites ensuite une nouvelle demande.
              </li>
              <li>
                <strong>Expiration</strong> : notez la date d&apos;expiration affichée dans{" "}
                <Link href="/mes-cles-api">Mes clés d&apos;API</Link> et demandez une nouvelle clé avant son échéance.
              </li>
              <li>
                <strong>Fréquence d&apos;appel raisonnable</strong> : préférez une synchronisation incrémentale
                (<code>updatedSince</code>) toutes les 5 à 15 minutes plutôt que des récupérations complètes répétées.
              </li>
              <li>
                <strong>Données sensibles</strong> : les réponses contiennent des adresses IP, des noms de serveurs et des
                contacts. Protégez les données récupérées comme les sources ServiceHub.
              </li>
              <li>
                <strong>HTTPS</strong> : appelez toujours l&apos;API en <code>https://</code>.
              </li>
            </ul>

            <h2 id="faq">Questions fréquentes</h2>
            <p className="fw-semibold mb-1">J&apos;ai perdu ma clé, comment la retrouver ?</p>
            <p>
              Connectez-vous et ouvrez <Link href="/mes-cles-api">Mes clés d&apos;API</Link> : cliquez sur « Afficher la
              clé ».
            </p>
            <p className="fw-semibold mb-1">Ma clé renvoie 401 alors qu&apos;elle fonctionnait.</p>
            <p>
              Elle a probablement expiré ou été révoquée : son statut est indiqué dans{" "}
              <Link href="/mes-cles-api">Mes clés d&apos;API</Link>. Faites une nouvelle demande.
            </p>
            <p className="fw-semibold mb-1">Comment connaître les identifiants (serviceId, statutInstanceId…) ?</p>
            <p>
              Ils figurent dans chaque fiche renvoyée par l&apos;API (<code>service.id</code>,{" "}
              <code>statutInstance.id</code>, <code>client.id</code>…). Pour les POD, utilisez directement leur code avec
              la route <a href="#instances-par-pod">/integration/pods/{"{pod}"}/instances</a>.
            </p>
            <p className="fw-semibold mb-1">Puis-je modifier des données via l&apos;API ?</p>
            <p className="mb-5">
              Non : l&apos;API d&apos;intégration est en lecture seule. Les modifications se font dans l&apos;interface
              d&apos;administration ServiceHub.
            </p>
          </article>
        </div>
      </main>
    </div>
  );
}
