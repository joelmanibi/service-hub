/**
 * Modèles Sequelize du module Auth (authentification).
 *
 * Le module `users` ne porte que l'identité applicative (users.id) : les
 * identifiants de connexion et les sessions vivent volontairement dans le
 * module `auth`, qui reste le seul propriétaire du schéma "authentification" :
 *  - Credential     identifiant de connexion (login + email), liée 1-1 à
 *                    un User (users.id). Authentification par code OTP
 *                    envoyé par email (module UserOtp) — plus de mot de
 *                    passe.
 *  - RefreshToken   jeton de rafraîchissement opaque, haché en base afin
 *                    de pouvoir être révoqué individuellement (logout)
 *  - UserOtp        code OTP envoyé par email pour l'authentification à
 *                    usage unique. Un utilisateur peut accumuler plusieurs
 *                    lignes dans le temps (historique), chacune n'étant
 *                    utilisable qu'une fois (`usedAt`) et expirant 60
 *                    secondes après sa création (`expiresAt`). La
 *                    contrainte "un seul OTP actif à la fois" et le
 *                    verrouillage après plusieurs tentatives (`attempts`)
 *                    ne sont pas exprimables en contrainte SQL statique
 *                    (dépendent de l'heure courante / de l'historique) :
 *                    ce sera à la couche service de les faire respecter
 *                    (non couverte ici, modèle et migration uniquement).
 *
 * Chargé dynamiquement par database/index.js, qui appelle ensuite la
 * méthode statique `associate` de chaque modèle une fois tous les modules
 * chargés — ce qui permet de référencer le modèle User (module users)
 * sans jamais modifier ce module.
 */

module.exports = (sequelize, DataTypes) => {
  const Credential = sequelize.define(
    'Credential',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      login: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: 'credentials' }
  );

  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tokenHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    { tableName: 'refresh_tokens' }
  );

  const UserOtp = sequelize.define(
    'UserOtp',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      otpCode: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { tableName: 'user_otps' }
  );

  // --- Associations ---

  Credential.associate = (models) => {
    Credential.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
  };

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
  };

  UserOtp.associate = (models) => {
    UserOtp.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
  };

  return { Credential, RefreshToken, UserOtp };
};
