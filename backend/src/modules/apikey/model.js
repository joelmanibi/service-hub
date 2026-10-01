/**
 * Modèle Sequelize du module ApiKey.
 *
 *  - ApiKey  clé d'API d'une application tierce (accès en lecture au
 *            module Integration). Générée depuis l'administration : la clé
 *            en clair n'est affichée qu'une seule fois à sa création,
 *            seule son empreinte SHA-256 (`keyHash`) est conservée, avec
 *            ses premiers caractères (`keyPrefix`) pour l'identifier.
 *            Une clé révoquée (`revokedAt`) ou expirée (`expiresAt`) est
 *            refusée par middlewares/apiKeyGuard.js.
 */

module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define(
    'ApiKey',
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      keyPrefix: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      keyHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastUsedIp: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
    },
    { tableName: 'api_keys' }
  );

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, { as: 'createdBy', foreignKey: 'createdById' });
  };

  return ApiKey;
};
