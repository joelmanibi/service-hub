'use strict';

/**
 * Retire instances.country_id : la géographie d'une Instance est
 * désormais portée par son Client (clients.country_id), pas par
 * l'Instance elle-même. Voir
 * 20260721090010-add-type-client-and-country-to-clients.js et
 * 20260721090030-add-client-id-to-instances.js.
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('instances', 'country_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('instances', 'country_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'countries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },
};
