const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('./connection');

/**
 * Point d'entrée de la couche base de données.
 * Responsabilité : charger dynamiquement le(s) modèle(s) Sequelize de
 * chaque module métier (modules/<nom>/model.js) — un module peut exposer
 * un seul modèle ou une map de plusieurs modèles liés (ex: le module
 * catalog expose Category, Service, ServiceLevelAgreement, PricingPlan,
 * Tag et ServiceTag) — puis établir les associations qu'ils déclarent
 * (méthode statique `associate`, appelée une fois tous les modules
 * chargés afin de permettre les relations inter-modules), et enfin
 * exposer l'instance Sequelize ainsi que les modèles chargés.
 */

const modulesDir = path.join(__dirname, '..', 'modules');
const db = {};

const isSequelizeModel = (candidate) =>
  Boolean(candidate) && typeof candidate.init === 'function' && typeof candidate.name === 'string';

fs.readdirSync(modulesDir)
  .filter((moduleName) => fs.statSync(path.join(modulesDir, moduleName)).isDirectory())
  .forEach((moduleName) => {
    const modelPath = path.join(modulesDir, moduleName, 'model.js');
    if (!fs.existsSync(modelPath)) return;

    const defineModel = require(modelPath);
    const result = defineModel(sequelize, DataTypes);

    if (!result) return;

    const models = isSequelizeModel(result) ? [result] : Object.values(result);
    models.forEach((model) => {
      if (isSequelizeModel(model)) {
        db[model.name] = model;
      }
    });
  });

Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;

module.exports = db;
