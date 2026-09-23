/**
 * Modèles Sequelize du module Catalog (catalogue de services IT).
 *
 * Ce module gère uniquement le produit/l'application générique
 * (Service), sans notion de pays, d'environnement ni de statut de
 * production — ces aspects appartiennent au module `instance`
 * (déploiement concret d'un Service dans un contexte donné, ex:
 * "Maxit CI").
 *
 * Category, Tag/ServiceTag, ServiceLevelAgreement et PricingPlan sont
 * conservés tels quels (inchangés).
 *
 * Chargé dynamiquement par database/index.js, qui appelle ensuite la
 * méthode statique `associate` de chaque modèle une fois tous les modules
 * chargés — ce qui permet à Service de référencer ServiceType (module
 * settings) et Instance (module instance) sans jamais modifier ces
 * modules.
 */

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    { tableName: 'categories' }
  );

  const Service = sequelize.define(
    'Service',
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'services',
      // `paranoid: true` : suppression douce, comme les référentiels du
      // module settings — pour pouvoir supprimer un service même s'il
      // est encore référencé par des instances (`instances.service_id`
      // reste en RESTRICT côté DB, mais un soft delete ne déclenche
      // jamais de vraie requête DELETE, donc jamais cette contrainte).
      paranoid: true,
    }
  );

  const ServiceLevelAgreement = sequelize.define(
    'ServiceLevelAgreement',
    {
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      responseTimeHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },
      resolutionTimeHours: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },
      availabilityPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 99.9,
      },
    },
    { tableName: 'service_level_agreements' }
  );

  const PricingPlan = sequelize.define(
    'PricingPlan',
    {
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      billingCycle: {
        type: DataTypes.ENUM('one_time', 'monthly', 'yearly', 'per_use'),
        allowNull: false,
        defaultValue: 'monthly',
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { tableName: 'pricing_plans' }
  );

  const Tag = sequelize.define(
    'Tag',
    {
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
      },
    },
    { tableName: 'tags' }
  );

  const ServiceTag = sequelize.define(
    'ServiceTag',
    {
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    { tableName: 'service_tags' }
  );

  // Pivot many-to-many entre Service et le référentiel
  // settings.CloudServiceModel (IaaS/PaaS/SaaS/FaaS/CaaS) — un service
  // peut relever de plusieurs modèles de service cloud à la fois, même
  // principe que ServiceTag ci-dessus.
  const ServiceCloudServiceModel = sequelize.define(
    'ServiceCloudServiceModel',
    {
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      cloudServiceModelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    { tableName: 'service_cloud_service_models' }
  );

  // --- Associations ---

  Category.associate = (models) => {
    Category.belongsTo(models.Category, { as: 'parent', foreignKey: 'parentId' });
    Category.hasMany(models.Category, { as: 'children', foreignKey: 'parentId' });
  };

  Service.associate = (models) => {
    Service.belongsTo(models.ServiceType, { as: 'serviceType', foreignKey: 'serviceTypeId' });
    Service.hasMany(models.Instance, { as: 'instances', foreignKey: 'serviceId' });
    Service.hasMany(models.ServiceLevelAgreement, { as: 'slas', foreignKey: 'serviceId' });
    Service.hasMany(models.PricingPlan, { as: 'pricingPlans', foreignKey: 'serviceId' });
    Service.belongsToMany(models.Tag, {
      through: models.ServiceTag,
      as: 'tags',
      foreignKey: 'serviceId',
      otherKey: 'tagId',
    });
    Service.belongsToMany(models.CloudServiceModel, {
      through: models.ServiceCloudServiceModel,
      as: 'cloudServiceModels',
      foreignKey: 'serviceId',
      otherKey: 'cloudServiceModelId',
    });
  };

  ServiceLevelAgreement.associate = (models) => {
    ServiceLevelAgreement.belongsTo(models.Service, { as: 'service', foreignKey: 'serviceId' });
  };

  PricingPlan.associate = (models) => {
    PricingPlan.belongsTo(models.Service, { as: 'service', foreignKey: 'serviceId' });
  };

  Tag.associate = (models) => {
    Tag.belongsToMany(models.Service, {
      through: models.ServiceTag,
      as: 'services',
      foreignKey: 'tagId',
      otherKey: 'serviceId',
    });
  };

  ServiceTag.associate = (models) => {
    ServiceTag.belongsTo(models.Service, { foreignKey: 'serviceId' });
    ServiceTag.belongsTo(models.Tag, { foreignKey: 'tagId' });
  };

  ServiceCloudServiceModel.associate = (models) => {
    ServiceCloudServiceModel.belongsTo(models.Service, { foreignKey: 'serviceId' });
    ServiceCloudServiceModel.belongsTo(models.CloudServiceModel, { foreignKey: 'cloudServiceModelId' });
  };

  return {
    Category,
    Service,
    ServiceLevelAgreement,
    PricingPlan,
    Tag,
    ServiceTag,
    ServiceCloudServiceModel,
  };
};
