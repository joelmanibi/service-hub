const { port, env } = require('./src/config/env');
const app = require('./src/app');
const { sequelize } = require('./src/database');
const logger = require('./src/config/logger');

/**
 * Point d'entrée du serveur.
 * Responsabilité : établir la connexion à la base de données puis
 * démarrer le serveur HTTP Express. Ne contient aucune logique métier.
 */

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    app.listen(port, () => {
      logger.info(`ServiceHub API running on port ${port} [${env}]`);
    });
  } catch (error) {
    logger.error(`Unable to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
