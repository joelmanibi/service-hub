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
