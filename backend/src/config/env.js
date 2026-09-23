require('dotenv').config();

/**
 * Centralisation des variables d'environnement.
 * Responsabilité : constituer la source unique de vérité pour toute la
 * configuration de l'application (serveur, base de données, JWT, CORS, logs)
 * et éviter les accès épars à `process.env` dans le reste du code.
 */

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.DB_LOGGING === 'true',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  mailer: {
    // 'smtp' (générique, config SMTP_*) ou 'gmail' (config GMAIL_*, via
    // mot de passe d'application — nodemailer connaît nativement
    // `service: 'gmail'`, pas besoin de host/port explicites).
    provider: process.env.MAIL_PROVIDER || 'smtp',
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'ServiceHub <no-reply@servicehub.local>',
    gmail: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
