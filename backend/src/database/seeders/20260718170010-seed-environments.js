'use strict';

const { Op } = require('sequelize');

/**
 * Seeder des environnements disponibles (référentiel settings.Environment,
 * table `environments`) : DEV, TEST, UAT, PREPROD, PROD.
 */

const ENVIRONMENTS = [
  { name: 'Développement', code: 'DEV' },
  { name: 'Test', code: 'TEST' },
  { name: 'UAT', code: 'UAT' },
  { name: 'Pré-production', code: 'PREPROD' },
  { name: 'Production', code: 'PROD' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'environments',
      ENVIRONMENTS.map((env) => ({ ...env, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('environments', {
      code: { [Op.in]: ENVIRONMENTS.map((env) => env.code) },
    });
  },
};
