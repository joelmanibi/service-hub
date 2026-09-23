/**
 * Modèles Sequelize du module Instance.
 *
 *  - Instance             déploiement concret d'un Service chez un Client
 *                         (ex: "Maxit CI" chez "Orange Côte d'Ivoire").
 *                         Appartient obligatoirement à un Service (module
 *                         catalog), à un Client (module settings), à un
 *                         Pod (module settings) et possède un seul
 *                         StatutInstance (module settings). La géographie
 *                         (pays) n'est plus portée par l'Instance : elle
 *                         est désormais un attribut du Client
 *                         (Client.countryId).
 *  - InstanceEnvironment  table pivot portant la relation many-to-many
 *                         entre Instance et le référentiel générique
 *                         Environment (module settings) : une instance
 *                         peut être déployée dans plusieurs environnements
 *                         (DEV, TEST, UAT, PREPROD, PROD...). Inchangée
 *                         par le refactoring TypeClient/Client/Hosting.
 *  - InstanceHosting      table pivot portant la relation many-to-many
 *                         entre Instance et le référentiel générique
 *                         Hosting (module settings) : une instance peut
 *                         être hébergée sur plusieurs sites. Aucune liste
 *                         JSON stockée sur Instance — la normalisation
 *                         passe par cette table de jonction.
 *  - InstanceNetwork      table pivot portant la relation many-to-many
 *                         entre Instance et le référentiel générique
 *                         Network (module settings) : une instance peut
 *                         avoir plusieurs dépendances réseau. Même
 *                         principe qu'InstanceEnvironment/InstanceHosting.
 *  - Composant             composant(s) d'une Instance (nom + description
 *                         optionnelle) : relation one-to-many simple, pas
 *                         un référentiel partagé — chaque composant
 *                         appartient à une seule instance et n'est jamais
 *                         réutilisé ailleurs (à la différence
 *                         d'Environment/Hosting, sélectionnés dans une
 *                         liste commune). Supprimé en cascade avec son
 *                         instance. Peut en outre référencer une
 *                         plateforme (settings.Platform, propre à un
 *                         Hosting), facultative — `platformId` mis à
 *                         `null` automatiquement si la plateforme
 *                         référencée est supprimée (`onDelete: SET NULL`,
 *                         cf. migration 20260831093000).
 *  - Inventaire            inventaire(s) d'un Composant (ip + nom de
 *                         serveur, tous deux obligatoires) : même
 *                         principe que Composant vis-à-vis d'Instance —
 *                         relation one-to-many simple, propre à un seul
 *                         composant, jamais partagée. Supprimé en cascade
 *                         avec son composant.
 *  - InstanceSupportLevel  assignation d'un niveau de support (référentiel
 *                         générique SupportLevel, module settings) à une
 *                         Instance, avec un responsable (équipe/personne,
 *                         optionnel) et un téléphone (optionnel) propres à
 *                         cette assignation. Pas une relation
 *                         `belongsToMany` classique comme
 *                         Environment/Hosting : les colonnes `responsable`/
 *                         `telephone` diffèrent par ligne, ce qu'un pivot
 *                         `through` pur ne permet pas de définir en une
 *                         seule opération — gérée par remplacement en bloc
 *                         côté service, comme Composant. Une même Instance
 *                         ne peut avoir qu'une ligne par SupportLevel
 *                         (contrainte UNIQUE en base).
 *
 * `paranoid: true` sur Instance active la suppression douce (soft
 * delete) native de Sequelize.
 *
 * Chargé dynamiquement par database/index.js, qui appelle ensuite la
 * méthode statique `associate` une fois tous les modules chargés — ce qui
 * permet de référencer Service, Client, StatutInstance, Environment et
 * Hosting sans jamais modifier ces modules.
 */

module.exports = (sequelize, DataTypes) => {
  const Instance = sequelize.define(
    'Instance',
    {
      code: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      podId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      statutInstanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      produitOceane: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // Schéma d'architecture de l'instance (image), facultatif — géré
      // hors du payload JSON de create/update (multipart dédié, cf.
      // routes.js POST/DELETE /instances/:id/architecture-image), au
      // même titre que le logo de Service (module catalog).
      architectureImageUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'instances',
      paranoid: true,
    }
  );

  const InstanceEnvironment = sequelize.define(
    'InstanceEnvironment',
    {
      instanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      environmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    { tableName: 'instance_environments' }
  );

  const InstanceHosting = sequelize.define(
    'InstanceHosting',
    {
      instanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      hostingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    { tableName: 'instance_hostings' }
  );

  const InstanceNetwork = sequelize.define(
    'InstanceNetwork',
    {
      instanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      networkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    { tableName: 'instance_networks' }
  );

  const Composant = sequelize.define(
    'Composant',
    {
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      instanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Plateforme sur laquelle tourne ce composant (référentiel
      // settings.Platform, propre à un Hosting) — facultatif, un composant
      // peut exister sans plateforme assignée.
      platformId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { tableName: 'composants' }
  );

  const Inventaire = sequelize.define(
    'Inventaire',
    {
      ip: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      nomServeur: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      composantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { tableName: 'inventaires' }
  );

  const InstanceSupportLevel = sequelize.define(
    'InstanceSupportLevel',
    {
      instanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      supportLevelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      responsable: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      telephone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
    },
    { tableName: 'instance_support_levels' }
  );

  Instance.associate = (models) => {
    Instance.belongsTo(models.Service, { as: 'service', foreignKey: 'serviceId' });
    Instance.belongsTo(models.Client, { as: 'client', foreignKey: 'clientId' });
    Instance.belongsTo(models.Pod, { as: 'pod', foreignKey: 'podId' });
    Instance.belongsTo(models.StatutInstance, { as: 'statutInstance', foreignKey: 'statutInstanceId' });
    Instance.belongsToMany(models.Environment, {
      through: models.InstanceEnvironment,
      as: 'environments',
      foreignKey: 'instanceId',
      otherKey: 'environmentId',
    });
    Instance.belongsToMany(models.Hosting, {
      through: models.InstanceHosting,
      as: 'hostings',
      foreignKey: 'instanceId',
      otherKey: 'hostingId',
    });
    Instance.belongsToMany(models.Network, {
      through: models.InstanceNetwork,
      as: 'networks',
      foreignKey: 'instanceId',
      otherKey: 'networkId',
    });
    Instance.hasMany(models.Composant, { as: 'composants', foreignKey: 'instanceId' });
    Instance.hasMany(models.InstanceSupportLevel, { as: 'instanceSupportLevels', foreignKey: 'instanceId' });
  };

  InstanceEnvironment.associate = (models) => {
    InstanceEnvironment.belongsTo(models.Instance, { foreignKey: 'instanceId' });
    InstanceEnvironment.belongsTo(models.Environment, { foreignKey: 'environmentId' });
  };

  InstanceHosting.associate = (models) => {
    InstanceHosting.belongsTo(models.Instance, { foreignKey: 'instanceId' });
    InstanceHosting.belongsTo(models.Hosting, { foreignKey: 'hostingId' });
  };

  InstanceNetwork.associate = (models) => {
    InstanceNetwork.belongsTo(models.Instance, { foreignKey: 'instanceId' });
    InstanceNetwork.belongsTo(models.Network, { foreignKey: 'networkId' });
  };

  Composant.associate = (models) => {
    Composant.belongsTo(models.Instance, { foreignKey: 'instanceId' });
    Composant.belongsTo(models.Platform, { as: 'platform', foreignKey: 'platformId' });
    Composant.hasMany(models.Inventaire, { as: 'inventaires', foreignKey: 'composantId' });
  };

  Inventaire.associate = (models) => {
    Inventaire.belongsTo(models.Composant, { foreignKey: 'composantId' });
  };

  InstanceSupportLevel.associate = (models) => {
    InstanceSupportLevel.belongsTo(models.Instance, { foreignKey: 'instanceId' });
    InstanceSupportLevel.belongsTo(models.SupportLevel, { as: 'supportLevel', foreignKey: 'supportLevelId' });
  };

  return {
    Instance,
    InstanceEnvironment,
    InstanceHosting,
    InstanceNetwork,
    Composant,
    Inventaire,
    InstanceSupportLevel,
  };
};
