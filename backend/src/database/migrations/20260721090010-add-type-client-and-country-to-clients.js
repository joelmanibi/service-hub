'use strict';

/**
 * Ajoute à `clients` :
 *  - type_client_id (obligatoire) : un Client appartient à un seul
 *    TypeClient — référentiel créé par
 *    20260721090000-create-type-clients.js.
 *  - country_id (facultatif) : la géographie d'un client (ex: "Orange
 *    Côte d'Ivoire") est désormais portée par Client plutôt que par
 *    Instance (voir 20260721090050-remove-country-id-from-instances.js).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'type_client_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'type_clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.addColumn('clients', 'country_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'countries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('clients', 'country_id');
    await queryInterface.removeColumn('clients', 'type_client_id');
  },
};
