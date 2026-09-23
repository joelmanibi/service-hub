/**
 * Modèles Sequelize du module Settings (données de référence).
 * Responsabilité : définir les référentiels utilisés par le reste de
 * l'application (Pays, Types de client, Statuts, Criticités,
 * Technologies, Hébergements, Environnements, Types de services, Statuts
 * d'instance, Pods, Niveaux de support, Modèles de service cloud,
 * Réseaux). La plupart partagent volontairement la même forme
 * générique (name, code, description) et aucune logique métier
 * spécifique : la particularité de chaque référentiel sera portée par
 * les modules qui les consomment, pas par settings lui-même.
 *
 * `Client` fait exception : depuis le refactoring du modèle métier
 * (TypeClient → Client → Instance), il porte deux clés étrangères
 * (typeClientId, countryId) en plus de la forme générique, et est donc
 * défini explicitement, hors de la boucle REFERENCE_TABLES.
 *
 * `paranoid: true` active la suppression douce (soft delete) native de
 * Sequelize : `.destroy()` renseigne `deletedAt` au lieu de supprimer la
 * ligne, et les lectures excluent automatiquement les lignes supprimées.
 *
 * `Platform` (plateforme) n'est en revanche pas un référentiel partagé :
 * une plateforme appartient à un seul Hébergement (relation one-to-many,
 * `hostingId` obligatoire) et n'est jamais réutilisée par un autre —
 * même principe que `Composant` vis-à-vis d'une Instance (module
 * instance). Définie explicitement, hors de la boucle REFERENCE_TABLES.
 */

const REFERENCE_TABLES = [
  { modelName: 'Country', tableName: 'countries' },
  { modelName: 'TypeClient', tableName: 'type_clients' },
  { modelName: 'Status', tableName: 'statuses' },
  { modelName: 'Criticality', tableName: 'criticalities' },
  { modelName: 'Technology', tableName: 'technologies' },
  { modelName: 'Hosting', tableName: 'hostings' },
  { modelName: 'Environment', tableName: 'environments' },
  { modelName: 'ServiceType', tableName: 'service_types' },
  { modelName: 'StatutInstance', tableName: 'statut_instances' },
  { modelName: 'Pod', tableName: 'pods' },
  { modelName: 'SupportLevel', tableName: 'support_levels' },
  { modelName: 'CloudServiceModel', tableName: 'cloud_service_models' },
  { modelName: 'Network', tableName: 'networks' },
];

module.exports = (sequelize, DataTypes) => {
  const models = {};

  REFERENCE_TABLES.forEach(({ modelName, tableName }) => {
    models[modelName] = sequelize.define(
      modelName,
      {
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
      },
      {
        tableName,
        paranoid: true,
      }
    );
  });

  // Client : référentiel non générique — porte l'identité géographique
  // (countryId) et la classification (typeClientId) d'un client, en plus
  // du nom/code/description commun aux autres référentiels.
  models.Client = sequelize.define(
    'Client',
    {
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      typeClientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      countryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'clients',
      paranoid: true,
    }
  );

  // Platform : propre à un seul Hosting (pas un référentiel partagé sous
  // forme de liste réutilisable, à la différence des REFERENCE_TABLES
  // ci-dessus) — même principe que Composant vis-à-vis d'Instance : pas
  // de `code` ni d'unicité en base, remplacée en bloc à chaque
  // create/update de son Hosting (cf. settings/service.js#syncPlatforms).
  models.Platform = sequelize.define(
    'Platform',
    {
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hostingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { tableName: 'platforms' }
  );

  // --- Associations ---

  models.TypeClient.associate = (allModels) => {
    models.TypeClient.hasMany(allModels.Client, { as: 'clients', foreignKey: 'typeClientId' });
  };

  models.Client.associate = (allModels) => {
    models.Client.belongsTo(allModels.TypeClient, { as: 'typeClient', foreignKey: 'typeClientId' });
    models.Client.belongsTo(allModels.Country, { as: 'country', foreignKey: 'countryId' });
    models.Client.hasMany(allModels.Instance, { as: 'instances', foreignKey: 'clientId' });
  };

  models.StatutInstance.associate = (allModels) => {
    models.StatutInstance.hasMany(allModels.Instance, { as: 'instances', foreignKey: 'statutInstanceId' });
  };

  models.Pod.associate = (allModels) => {
    models.Pod.hasMany(allModels.Instance, { as: 'instances', foreignKey: 'podId' });
  };

  // Une Instance peut être déployée dans plusieurs environnements (DEV,
  // TEST, UAT, PREPROD, PROD...), via la table pivot instance_environments
  // — inchangé par le refactoring TypeClient/Client/Hosting.
  models.Environment.associate = (allModels) => {
    models.Environment.belongsToMany(allModels.Instance, {
      through: allModels.InstanceEnvironment,
      as: 'instances',
      foreignKey: 'environmentId',
      otherKey: 'instanceId',
    });
  };

  // Une Instance peut être hébergée sur plusieurs sites, via la table
  // pivot instance_hostings (aucune liste JSON stockée sur Instance).
  // Un Hosting peut par ailleurs avoir plusieurs Platform (one-to-many,
  // chaque Platform appartenant à un seul Hosting — pas un pivot).
  models.Hosting.associate = (allModels) => {
    models.Hosting.belongsToMany(allModels.Instance, {
      through: allModels.InstanceHosting,
      as: 'instances',
      foreignKey: 'hostingId',
      otherKey: 'instanceId',
    });
    models.Hosting.hasMany(allModels.Platform, { as: 'platforms', foreignKey: 'hostingId' });
  };

  models.Platform.associate = (allModels) => {
    models.Platform.belongsTo(allModels.Hosting, { as: 'hosting', foreignKey: 'hostingId' });
  };

  // Une Instance peut avoir plusieurs dépendances réseau, via la table
  // pivot instance_networks — même principe qu'Environment/Hosting.
  models.Network.associate = (allModels) => {
    models.Network.belongsToMany(allModels.Instance, {
      through: allModels.InstanceNetwork,
      as: 'instances',
      foreignKey: 'networkId',
      otherKey: 'instanceId',
    });
  };

  return models;
};
