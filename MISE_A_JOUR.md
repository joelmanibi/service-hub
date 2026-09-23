# Mise à jour de ServiceHub en production

Ce guide décrit le déploiement d'une **nouvelle version** sur un serveur déjà configuré (voir [DEPLOIEMENT.md](./DEPLOIEMENT.md) pour l'installation initiale). À exécuter à chaque nouvelle mise en production.

Prérequis : PM2 tourne déjà avec les 3 apps (`servicehub-backend`, `servicehub-frontend`, `servicehub-public` — noms définis dans `ecosystem.config.js`).

---

## 0. Sauvegarder la base avant toute migration

```bash
mysqldump -u servicehub_user -p servicehub_db > backup_$(date +%Y%m%d_%H%M).sql
```

À conserver quelques jours ; c'est le filet de sécurité en cas de migration problématique.

---

## 1. Récupérer le nouveau code

```bash
cd /var/www/service-hub   # racine du monorepo
git fetch origin
git status                # vérifier qu'il n'y a pas de modifs locales non commitées
git pull origin main      # ou la branche déployée
```

> Si `git status` signale des changements locaux (ex. un `.env` mal placé au mauvais endroit), les traiter avant de continuer — ne jamais `git pull` sur un arbre de travail sale sans comprendre pourquoi.

---

## 2. Backend

```bash
cd backend
```

### 2.1 Dépendances

Seulement si `package.json`/`package-lock.json` ont changé (`git diff HEAD@{1} -- package.json package-lock.json`) :

```bash
npm ci --omit=dev
```

### 2.2 Migrations

Toujours exécuter cette étape — `sequelize-cli` ne rejoue que les migrations non encore appliquées (suivi via la table `SequelizeMeta`), sans risque à relancer :

```bash
npm run migrate
npm run migrate:status
```

### 2.3 Seeders — uniquement les nouveaux, jamais `db:seed:all` en aveugle

Contrairement aux migrations, les seeders ne sont **pas** protégés contre une double exécution (pas de suivi "déjà exécuté" fiable pour `db:seed:all`) : relancer tous les seeders existants provoquerait des doublons ou des erreurs d'insertion sur des données déjà en place.

Si cette mise à jour ajoute un **nouveau** fichier dans `backend/src/database/seeders/`, l'exécuter individuellement par son nom :

```bash
npx sequelize-cli db:seed --seed <nom-exact-du-nouveau-fichier>.js
```

Si aucun nouveau seeder n'a été ajouté, ignorer cette étape.

### 2.4 Redémarrage

```bash
cd /var/www/service-hub
pm2 reload servicehub-backend
pm2 logs servicehub-backend --lines 30   # vérifier l'absence d'erreur au démarrage
```

---

## 3. Interface admin (`servicehub-frontend`)

```bash
cd servicehub-frontend
npm ci                 # si les dépendances ont changé, sinon npm install suffit à vérifier
npm run build
cd ..
pm2 reload servicehub-frontend
```

---

## 4. Catalogue public (`service-hub-public`)

```bash
cd service-hub-public
npm ci
npm run build
cd ..
pm2 reload servicehub-public
```

---

## 5. Vérification post-déploiement

```bash
pm2 status
```

Les 3 process doivent être `online` avec un `uptime` récent et `↺` (restarts) qui n'explose pas en boucle.

1. `curl http://127.0.0.1:3005/api/v1/public/services` → JSON valide.
2. Ouvrir l'interface admin, vérifier qu'une page déjà connue s'affiche sans erreur console.
3. Ouvrir le catalogue public, vérifier que la liste des services s'affiche toujours.

Si un des 3 process redémarre en boucle (`pm2 status` → restarts qui augmente), consulter immédiatement `pm2 logs <nom-app> --err --lines 100` avant de considérer le déploiement terminé.

---

## 6. Rollback rapide en cas de problème

```bash
cd /var/www/service-hub
git log --oneline -5          # repérer le commit précédent stable
git checkout <commit-ou-tag-precedent>
cd backend && npm ci --omit=dev && cd ..
cd servicehub-frontend && npm ci && npm run build && cd ..
cd service-hub-public && npm ci && npm run build && cd ..
pm2 reload ecosystem.config.js
```

> Si la mise à jour problématique incluait une migration destructive (colonne supprimée, etc.), un simple rollback de code ne suffit pas : restaurer la sauvegarde de l'étape 0 (`mysql -u servicehub_user -p servicehub_db < backup_XXXX.sql`) et/ou exécuter `npm run migrate:undo` côté backend avant de revenir en arrière.
