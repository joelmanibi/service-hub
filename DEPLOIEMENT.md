# Déploiement initial de ServiceHub en production

Ce guide décrit la mise en production **initiale** de ServiceHub (première installation sur un serveur neuf). Pour les mises à jour suivantes, voir [MISE_A_JOUR.md](./MISE_A_JOUR.md).

Le projet est un monorepo à trois applications, déployées comme trois process Node distincts derrière PM2 :

| App | Dossier | Techno | Port par défaut |
|---|---|---|---|
| API backend | `backend/` | Node/Express + MySQL (Sequelize) | 3005 |
| Interface admin | `servicehub-frontend/` | Next.js | 3000 |
| Catalogue public | `service-hub-public/` | Next.js | 3001 |

---

## 0. Prérequis serveur

- Node.js **20 LTS** (ou plus récent) + npm
- MySQL 8.x (ou MariaDB compatible) accessible depuis le serveur
- Git
- PM2 installé globalement : `npm install -g pm2`
- (Recommandé) Un reverse proxy (Nginx, Caddy…) devant les 3 process pour gérer HTTPS et le routage par domaine — non couvert par ce guide, mais indispensable en production réelle.
- Un compte SMTP prêt à l'emploi (l'app utilise l'authentification par code OTP envoyé par email — sans SMTP fonctionnel, personne ne peut se connecter à l'interface admin).

---

## 1. Récupérer le code (`git clone`)

```bash
cd /var/www   # ou l'emplacement de votre choix
git clone <URL_DU_DEPOT> service-hub
cd service-hub
```

---

## 2. Base de données MySQL

Créer la base et un utilisateur dédié (adapter les valeurs) :

```sql
CREATE DATABASE servicehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'servicehub_user'@'localhost' IDENTIFIED BY 'UN_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON servicehub_db.* TO 'servicehub_user'@'localhost';
FLUSH PRIVILEGES;
```

> Adapter `'localhost'` si MySQL n'est pas sur la même machine que l'API.

---

## 3. Backend (`backend/`)

### 3.1 Installer les dépendances

```bash
cd backend
npm ci --omit=dev
```

### 3.2 Fichier `.env`

Créer `backend/.env` à partir du modèle ci-dessous (**ne jamais committer ce fichier** — il est déjà dans le `.gitignore` racine) :

```ini
# --- Application ---
NODE_ENV=production
PORT=3005
API_PREFIX=/api/v1

# --- Base de données (MySQL / Sequelize) ---
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=servicehub_db
DB_USER=servicehub_user
DB_PASSWORD=UN_MOT_DE_PASSE_FORT
DB_DIALECT=mysql
DB_LOGGING=false

# --- JWT ---
JWT_SECRET=UNE_CHAINE_ALEATOIRE_LONGUE_ET_UNIQUE
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# --- Email (envoi des codes OTP) — serveur SMTP de prod, PAS Gmail ---
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.votre-fournisseur.tld
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_utilisateur_smtp
SMTP_PASSWORD=votre_mot_de_passe_smtp
SMTP_FROM=ServiceHub <no-reply@votre-domaine.tld>

# --- Logging ---
LOG_LEVEL=info

# --- Premier compte administrateur (seeder 20260718140000-demo-admin-user.js) ---
# Lu par le seeder au moment de `db:seed:all` — aucune édition de code
# nécessaire. Repli sur une adresse de développement si absent : à
# renseigner obligatoirement en prod.
ADMIN_EMAIL=admin@votre-domaine.tld
ADMIN_LOGIN=admin

# --- CORS ---
# Une seule origine littérale (pas de liste séparée par des virgules —
# le middleware `cors` ne la découpe pas). C'est l'URL publique de
# servicehub-frontend (l'admin, seule app qui appelle l'API depuis le
# navigateur — service-hub-public interroge l'API côté serveur Next.js,
# jamais depuis le navigateur, donc pas concerné par CORS).
CORS_ORIGIN=https://admin.votre-domaine.tld
```

Générer une valeur pour `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

`SMTP_SECURE=true` si votre fournisseur utilise le port 465 (SSL implicite) ; `false` pour le port 587 (STARTTLS, cas le plus courant).

### 3.3 Migrations

```bash
npm run migrate
```

Vérifier :

```bash
npm run migrate:status
```

### 3.4 Seeders (données de référence)

Trois seeders sont des données de référence génériques, sûres à exécuter telles quelles en prod (environnements DEV/TEST/UAT/PREPROD/PROD, niveaux de support, modèles de service cloud).

Le seeder `20260718140000-demo-admin-user.js` crée en revanche le **premier compte administrateur**, à partir des variables `ADMIN_EMAIL`/`ADMIN_LOGIN` du `.env` (étape 3.2 — aucune édition de code nécessaire). Vérifier qu'elles sont bien renseignées avec l'email professionnel réel du premier administrateur avant de seeder (l'app n'a pas d'endpoint d'inscription — c'est le seul moyen de créer le tout premier compte).

Exécuter tous les seeders :

```bash
npx sequelize-cli db:seed:all
```

> D'autres référentiels utilisés par l'application (Statuts d'instance "En service"/"Décommissionné", Types de service, Pays, Plateformes, Hébergements…) n'ont pas de seeder : à créer manuellement depuis l'interface admin (Paramètres) après la première connexion.

### 3.5 Dossier uploads

Le dossier `backend/src/uploads/` doit exister et être accessible en écriture par le process Node (logos de service uploadés) :

```bash
mkdir -p src/uploads
chmod 755 src/uploads
```

---

## 4. Interface admin (`servicehub-frontend/`)

```bash
cd ../servicehub-frontend
npm ci
```

Créer `servicehub-frontend/.env` :

```ini
NEXT_PUBLIC_API_URL=https://api.votre-domaine.tld/api/v1
```

> `NEXT_PUBLIC_*` est injecté dans le bundle envoyé au navigateur : mettre l'URL **publique** de l'API (celle que les navigateurs des utilisateurs appelleront), pas une URL interne.

Build de production :

```bash
npm run build
```

---

## 5. Catalogue public (`service-hub-public/`)

```bash
cd ../service-hub-public
npm ci
```

Créer `service-hub-public/.env.local` (ou `.env`) :

```ini
API_URL=http://127.0.0.1:3005/api/v1
```

> Contrairement à l'admin, cette variable n'a pas le préfixe `NEXT_PUBLIC_` : elle n'est utilisée que côté serveur (Server Components), donc une URL interne/locale vers l'API convient (pas besoin qu'elle soit publiquement accessible).

Build de production :

```bash
npm run build
```

---

## 6. Fichier écosystème PM2

Créer `ecosystem.config.js` **à la racine du monorepo** (à côté de `backend/`, `servicehub-frontend/`, `service-hub-public/`) :

```js
module.exports = {
  apps: [
    {
      name: 'servicehub-backend',
      cwd: './backend',
      script: 'server.js',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_memory_restart: '300M',
    },
    {
      name: 'servicehub-frontend',
      cwd: './servicehub-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: '3000' },
      autorestart: true,
      max_memory_restart: '300M',
    },
    {
      name: 'servicehub-public',
      cwd: './service-hub-public',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      env: { NODE_ENV: 'production' },
      autorestart: true,
      max_memory_restart: '300M',
    },
  ],
};
```

Démarrer les trois apps :

```bash
cd /var/www/service-hub   # racine du monorepo
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # affiche (et éventuellement installe) la commande pour démarrer PM2 au boot du serveur — suivre l'instruction imprimée
```

Vérifier :

```bash
pm2 status
pm2 logs servicehub-backend --lines 50
```

---

## 7. Vérification post-déploiement

1. `curl http://127.0.0.1:3005/api/v1/public/services` → doit renvoyer un JSON `{"success":true,...}`.
2. Ouvrir l'URL publique de `servicehub-frontend`, se connecter avec l'email admin seedé à l'étape 3.4 → un code OTP doit arriver par email (confirme que le SMTP est correctement configuré).
3. Ouvrir l'URL publique de `service-hub-public` → le catalogue doit s'afficher (vide tant qu'aucun service n'a été créé depuis l'admin).

---

## Rappel sécurité

- `backend/.env`, `servicehub-frontend/.env`, `service-hub-public/.env.local` ne doivent **jamais** être commités (déjà couverts par le `.gitignore` racine).
- Renseigner `ADMIN_EMAIL`/`ADMIN_LOGIN` dans `backend/.env` (étape 3.2) est indispensable avant de seeder — sans ça, le premier compte admin de la prod serait rattaché à l'adresse de développement par défaut, qui ne vous appartient pas.
- `JWT_SECRET` doit être unique à cet environnement, jamais réutilisé depuis le `.env` de développement.
