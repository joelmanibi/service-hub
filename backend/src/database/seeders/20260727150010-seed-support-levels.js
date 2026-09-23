'use strict';

const { Op } = require('sequelize');

/**
 * Seeder des niveaux de support disponibles (référentiel
 * settings.SupportLevel, table `support_levels`).
 */

const SUPPORT_LEVELS = [
  { name: 'Support niveau 1', code: 'SUPPORT_N1' },
  { name: 'Support applicatif', code: 'SUPPORT_APPLICATIF' },
  { name: 'Support infra', code: 'SUPPORT_INFRA' },
  { name: 'Support base de données', code: 'SUPPORT_BDD' },
  { name: 'Support niveau 3', code: 'SUPPORT_N3' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'support_levels',
      SUPPORT_LEVELS.map((level) => ({ ...level, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('support_levels', {
      code: { [Op.in]: SUPPORT_LEVELS.map((level) => level.code) },
    });
  },
};
