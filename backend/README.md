# ServiceHub — Backend

Base d'API backend pour ServiceHub, organisée en architecture modulaire.
Ce dépôt contient l'ossature définitive du projet (configuration, base de
données, middlewares transverses et modules métier) mais aucune logique
métier n'est implémentée : chaque fichier de module est un squelette
commenté décrivant sa responsabilité.

## Stack technique

- Node.js / Express.js
- Sequelize (ORM) + MySQL
- JWT (jsonwebtoken)
- Joi (validation)
- Winston (logs applicatifs)
- Morgan (logs HTTP)
- Multer (upload de fichiers)
- Helmet (sécurité HTTP)
- CORS
- dotenv

## Architecture

```
backend/
├── logs/                        # Fichiers de logs générés par Winston
├── src/
│   ├── config/                  # Configuration technique de l'application
│   │   ├── env.js               # Source unique de vérité des variables d'environnement
│   │   ├── cors.js              # Options du middleware CORS
│   │   ├── jwt.js               # Paramètres JWT (secret, durée)
│   │   ├── logger.js            # Configuration Winston
│   │   └── multer.js            # Configuration Multer (upload)
│   │
│   ├── database/                # Couche d'accès à la base de données
│   │   ├── connection.js        # Instance Sequelize (connexion MySQL)
│   │   ├── index.js             # Charge dynamiquement les modèles des modules + associations
│   │   ├── migrations/          # Migrations Sequelize (à venir)
│   │   └── seeders/             # Seeders Sequelize (à venir)
│   │
│   ├── middlewares/             # Middlewares Express transverses
│   │   ├── auth.js              # Vérification du token JWT (squelette)
│   │   ├── validate.js          # Validation générique des requêtes via Joi (squelette)
│   │   ├── errorHandler.js      # Gestionnaire d'erreurs centralisé
│   │   └── notFound.js          # Gestionnaire 404
│   │
│   ├── shared/                  # Éléments transverses réutilisables par tous les modules
│   │   ├── constants.js         # Constantes partagées (codes HTTP, etc.)
│   │   └── utils/
│   │       ├── ApiError.js      # Classe d'erreur applicative standardisée
│   │       ├── ApiResponse.js   # Formateur de réponse HTTP standardisé
│   │       └── asyncHandler.js  # Wrapper pour capturer les erreurs des handlers async
│   │
│   ├── modules/                 # Modules métier (aucune logique implémentée)
│   │   ├── auth/                # controller.js / service.js / model.js / validator.js / routes.js
│   │   ├── users/
│   │   ├── catalog/
│   │   ├── dashboard/
│   │   └── settings/
│   │
│   ├── routes/
│   │   └── index.js             # Agrège les routes.js de chaque module + endpoints techniques (/health)
│   │
│   ├── uploads/                 # Destination des fichiers uploadés
│   └── app.js                   # Configuration de l'application Express
│
├── .env.example
├── .gitignore
├── package.json
└── server.js                    # Point d'entrée (connexion DB + démarrage serveur)
```

### Convention de chaque module

Chaque dossier de `src/modules/` suit strictement la même structure à 5
fichiers, avec une séparation claire des responsabilités :

| Fichier          | Responsabilité                                                                 |
|------------------|---------------------------------------------------------------------------------|
| `routes.js`      | Déclare les endpoints du module et les relie aux méthodes du contrôleur.        |
| `controller.js`  | Reçoit les requêtes HTTP (req/res), délègue au service, formate la réponse.     |
| `service.js`     | Contient la logique métier, orchestre les appels au(x) modèle(s).              |
| `model.js`       | Définit le(s) modèle(s) Sequelize et leurs associations.                       |
| `validator.js`   | Définit les schémas Joi de validation des payloads entrants.                   |

## Installation

```bash
npm install
```

Copier le fichier d'environnement et renseigner vos valeurs :

```bash
cp .env.example .env
```

## Démarrage

```bash
npm run dev     # mode développement (nodemon)
npm start       # mode production
```

Le serveur démarre par défaut sur `http://localhost:3000`.

## Vérification

Une fois démarré, tester le endpoint technique de santé :

```
GET http://localhost:3000/api/v1/health
```

## Variables d'environnement

Voir [.env.example](.env.example) pour la liste complète des variables
nécessaires (serveur, base de données, JWT, logs, CORS).

## API d'intégration (applications tierces)

API en lecture seule, authentifiée par **clé d'API** (et non par un compte
utilisateur), qui expose la fiche complète des instances — client,
composants, plateformes, **inventaire (IP, nom de serveur)** et niveaux de
support compris.

### Gestion des clés

La documentation complète destinée aux développeurs des applications
externes (authentification, endpoints, paramètres, exemples curl /
PowerShell / JavaScript / Python, modèle de données, erreurs) est publiée
sur le catalogue public : **/documentation**.

**Demande de clé (parcours standard)** : l'utilisateur se connecte au
catalogue public, ouvre **Mes clés d'API** (`/mes-cles-api`) et fait une
demande (application, usage prévu, validité). Les ADMIN sont prévenus par
email et l'approuvent ou la refusent dans **Paramètres → Clés d'API** ;
le demandeur est prévenu par email. La clé approuvée est attribuée au
demandeur : **seuls lui et les ADMIN peuvent l'afficher** (copie chiffrée
AES-256-GCM, cf. `API_KEY_ENCRYPTION_SECRET` ; chaque affichage est
journalisé). La clé n'est jamais envoyée par email.

Endpoints correspondants (JWT utilisateur) : `POST /api/v1/api-key-requests`,
`GET /api/v1/api-key-requests/mine`, `POST /api/v1/api-key-requests/:id/cancel`,
`GET /api/v1/api-keys/mine`, `GET /api/v1/api-keys/:id/reveal` (propriétaire ou
ADMIN) ; ADMIN : `GET /api/v1/api-key-requests`, `POST /api/v1/api-key-requests/:id/approve`,
`POST /api/v1/api-key-requests/:id/reject`.

Un ADMIN peut aussi générer une clé directement dans **Paramètres → Clés
d'API**. L'authentification se fait par l'empreinte SHA-256 de la clé (table
`api_keys`). La liste indique pour chaque clé son propriétaire, son statut
(active, révoquée, expirée) et sa dernière utilisation (date, IP). Révoquer
une clé coupe l'accès de l'application immédiatement. Les clés créées avant
la migration `20261002090000` ne sont pas ré-affichables.

Endpoints d'administration correspondants (JWT ADMIN) : `GET /api/v1/api-keys`,
`POST /api/v1/api-keys`, `POST /api/v1/api-keys/:id/revoke`,
`DELETE /api/v1/api-keys/:id`.

### Authentification

L'une ou l'autre de ces en-têtes :

```
Authorization: Bearer <clé>
X-API-Key: <clé>
```

### Endpoints

| Méthode | URL | Description |
| --- | --- | --- |
| GET | `/api/v1/integration/instances` | Liste paginée des instances (fiche complète) |
| GET | `/api/v1/integration/instances/:id` | Fiche complète d'une instance |
| GET | `/api/v1/integration/pods/:pod/instances` | Instances d'un POD (`:pod` = code, nom ou id — ex. `WECA`), mêmes paramètres et même format que `/instances`, plus `data.pod` |

Paramètres de `GET /instances` (tous facultatifs) :

| Paramètre | Description |
| --- | --- |
| `page` | Numéro de page (défaut 1) |
| `limit` | Taille de page, 1 à 500 (défaut 100) |
| `serviceId`, `clientId`, `podId`, `statutInstanceId` | Filtres |
| `updatedSince` | Date ISO 8601 — uniquement les instances modifiées depuis (synchronisation incrémentale) |

Les instances sont triées par `id` croissant : pour tout récupérer, parcourir
les pages tant que `pagination.hasNextPage` vaut `true`.

### Exemple

```
curl -H "Authorization: Bearer <clé>" "http://localhost:3005/api/v1/integration/instances?limit=100&page=1"

# Instances du POD WECA
curl -H "X-API-Key: <clé>" "http://localhost:3005/api/v1/integration/pods/WECA/instances"
```

```json
{
  "success": true,
  "message": "Liste des instances",
  "data": {
    "items": [
      {
        "id": 2,
        "code": "INST-000002",
        "name": "INTEROP RDC",
        "comments": null,
        "produitOceane": null,
        "architectureImageUrl": null,
        "createdAt": "…",
        "updatedAt": "…",
        "service": { "id": 2, "code": "…", "name": "…", "serviceType": { "id": 1, "code": "…", "name": "…" } },
        "client": { "id": 1, "code": "…", "name": "…", "country": { … }, "typeClient": { … } },
        "pod": { "id": 1, "code": "WECA", "name": "WECA" },
        "statutInstance": { "id": 1, "code": "…", "name": "En service" },
        "environments": [{ "id": 1, "code": "PROD", "name": "Production" }],
        "hostings": [{ "id": 3, "code": "…", "name": "MTC RDC" }],
        "networks": [],
        "composants": [
          {
            "id": 24,
            "name": "serveur applicatif",
            "description": null,
            "platform": null,
            "inventaires": [{ "id": 46, "ip": "10.25.2.62", "nomServeur": "srv-app-1" }]
          }
        ],
        "supportLevels": [
          { "id": 22, "supportLevel": { "id": 2, "code": "…", "name": "Support applicatif" }, "responsable": "GOS", "telephone": "+225…" }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 100, "total": 37, "totalPages": 1, "hasNextPage": false }
  }
}
```

Codes d'erreur : `400` paramètre invalide, `401` clé absente, invalide, révoquée ou expirée,
`404` instance ou POD introuvable. Chaque appel est tracé dans `logs/combined.log`
avec le nom de la clé appelante.
