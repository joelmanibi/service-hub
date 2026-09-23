'use strict';

const { Op } = require('sequelize');

/**
 * Seeder des modèles de service cloud disponibles (référentiel
 * settings.CloudServiceModel, table `cloud_service_models`) :
 * IaaS/PaaS/SaaS/FaaS/CaaS.
 */

const CLOUD_SERVICE_MODELS = [
  {
    name: 'Infrastructure as a Service',
    code: 'IAAS',
    description: 'Serveurs, VM, réseau, stockage',
  },
  {
    name: 'Platform as a Service',
    code: 'PAAS',
    description: "Environnement d'exécution, DB, middleware, runtime",
  },
  {
    name: 'Software as a Service',
    code: 'SAAS',
    description: 'Application complète accessible via Internet',
  },
  {
    name: 'Function as a Service',
    code: 'FAAS',
    description: 'Exécution de fonctions/serverless',
  },
  {
    name: 'Container as a Service',
    code: 'CAAS',
    description: 'Gestion/exécution de conteneurs',
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'cloud_service_models',
      CLOUD_SERVICE_MODELS.map((model) => ({ ...model, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cloud_service_models', {
      code: { [Op.in]: CLOUD_SERVICE_MODELS.map((model) => model.code) },
    });
  },
};
