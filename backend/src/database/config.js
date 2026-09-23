const { db } = require('../config/env');

/**
 * Configuration Sequelize CLI (migrations & seeders).
 * Responsabilité : fournir à sequelize-cli les paramètres de connexion
 * par environnement, à partir de la même configuration centralisée que
 * l'application (config/env.js). Ne pas confondre avec
 * database/connection.js, utilisé par l'application au runtime.
 */

const connection = {
  username: db.user,
  password: db.password,
  database: db.name,
  host: db.host,
  port: db.port,
  dialect: db.dialect,
};

module.exports = {
  development: connection,
  test: connection,
  production: connection,
};
