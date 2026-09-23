'use strict';

/**
 * Ajoute `deleted_at` à `services` : `Service` passe en suppression
 * douce (`paranoid: true`, comme les référentiels du module settings)
 * au lieu d'une suppression physique. Objectif : permettre de supprimer
 * un service même s'il est encore référencé par des instances
 * (`instances.service_id` reste en `onDelete: 'RESTRICT'` — une
 * suppression physique resterait bloquée, mais le soft delete ne
 * déclenche jamais de vraie requête DELETE, donc jamais cette
 * contrainte).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'deleted_at');
  },
};
