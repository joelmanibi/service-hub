'use strict';

/**
 * Ajoute instances.client_id (obligatoire) : une Instance représente le
 * déploiement d'un Service chez un Client, elle appartient donc toujours
 * à un Client exactement. Remplace le rôle que jouait country_id (voir
 * 20260721090050-remove-country-id-from-instances.js) — la géographie
 * est désormais portée par Client (clients.country_id).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('instances', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instances', 'client_id');
  },
};
