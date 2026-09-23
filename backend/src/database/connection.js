const { Sequelize } = require('sequelize');
const { db } = require('../config/env');
const logger = require('../config/logger');

/**
 * Connexion Sequelize (MySQL).
 * Responsabilité : instancier et configurer la connexion à la base de
 * données à partir de la configuration centralisée (config/env.js).
 * Ne contient aucun modèle ni logique métier.
 */

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  logging: db.logging ? (msg) => logger.debug(msg) : false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

module.exports = sequelize;
