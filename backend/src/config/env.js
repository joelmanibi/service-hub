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
    // Contournement temporaire pour un relais SMTP interne dont le
    // certificat est expiré/auto-signé — sécurisé par défaut (true),
    // à désactiver explicitement (SMTP_TLS_REJECT_UNAUTHORIZED=false)
    // uniquement le temps que le certificat soit renouvelé.
    tlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    gmail: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  },

  // Adresse publique du catalogue des services (site service-hub-public),
  // communiquée dans l'email envoyé à la création d'un compte.
  publicSiteUrl: process.env.PUBLIC_SITE_URL || 'http://localhost:3001',
  // Adresse de l'administration (lien des emails envoyés aux ADMIN, ex.
  // nouvelle demande de clé d'API). À défaut, l'origine CORS (= l'admin).
  adminSiteUrl:
    process.env.ADMIN_SITE_URL ||
    (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN : 'http://localhost:3000'),

  // Secret de chiffrement des clés d'API (ré-affichage par un ADMIN ou par
  // le propriétaire de la clé) — cf. shared/utils/secretBox.js. Facultatif :
  // dérivé de JWT_SECRET s'il est absent.
  apiKeyEncryptionSecret: process.env.API_KEY_ENCRYPTION_SECRET || null,

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
