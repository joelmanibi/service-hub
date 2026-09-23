'use strict';

/**
 * Ajoute `telephone` à `instance_support_levels` : comme `responsable`,
 * une donnée propre à l'assignation d'un niveau de support à une instance
 * (pas au référentiel `support_levels`) — le numéro de téléphone à
 * contacter pour ce niveau de support sur cette instance, optionnel.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('instance_support_levels', 'telephone', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instance_support_levels', 'telephone');
  },
};
