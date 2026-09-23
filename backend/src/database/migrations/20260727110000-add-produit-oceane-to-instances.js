'use strict';

/**
 * Ajoute instances.produit_oceane (optionnel) : référence/code du produit
 * Océane associé à l'instance, quand applicable.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('instances', 'produit_oceane', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instances', 'produit_oceane');
  },
};
