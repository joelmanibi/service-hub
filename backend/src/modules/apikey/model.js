/**
 * Modèles Sequelize du module ApiKey.
 *
 *  - ApiKey         clé d'API d'une application tierce (accès en lecture au
 *                   module Integration). Authentification par empreinte
 *                   SHA-256 (`keyHash`) ; copie chiffrée (`keyEncrypted`,
 *                   AES-256-GCM) pour que la clé reste affichable par les
 *                   ADMIN et par son propriétaire (`ownerUserId`) — et par
 *                   personne d'autre. Une clé révoquée (`revokedAt`) ou
 *                   expirée (`expiresAt`) est refusée par
 *                   middlewares/apiKeyGuard.js.
 *  - ApiKeyRequest  demande de clé faite depuis le site public par un
 *                   utilisateur connecté (`requesterId`), approuvée (une
 *                   ApiKey lui est alors attribuée, `apiKeyId`) ou refusée
 *                   par un ADMIN.
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
      keyEncrypted: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      ownerUserId: {
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

  const ApiKeyRequest = sequelize.define(
    'ApiKeyRequest',
    {
      requesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      applicationName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      usageDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Durée de validité souhaitée, en jours (null = sans expiration).
      validityDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      apiKeyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { tableName: 'api_key_requests' }
  );

  ApiKey.associate = (models) => {
    ApiKey.belongsTo(models.User, { as: 'createdBy', foreignKey: 'createdById' });
    ApiKey.belongsTo(models.User, { as: 'owner', foreignKey: 'ownerUserId' });
  };

  ApiKeyRequest.associate = (models) => {
    ApiKeyRequest.belongsTo(models.User, { as: 'requester', foreignKey: 'requesterId' });
    ApiKeyRequest.belongsTo(models.User, { as: 'reviewedBy', foreignKey: 'reviewedById' });
    ApiKeyRequest.belongsTo(ApiKey, { as: 'apiKey', foreignKey: 'apiKeyId' });
  };

  return { ApiKey, ApiKeyRequest };
};
