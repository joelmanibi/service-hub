'use strict';

/**
 * Ajoute la contrainte de clé étrangère services.service_type_id →
 * service_types.id, différée depuis 20260718120020-create-services.js
 * (service_types n'existe qu'à partir de 20260718150070).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.addConstraint('services', {
      fields: ['service_type_id'],
      type: 'foreign key',
      name: 'services_service_type_id_fkey',
      references: {
        table: 'service_types',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('services', 'services_service_type_id_fkey');
  },
};
