'use strict';

/**
 * Ajoute services.logo_url (optionnel) : chemin relatif (/uploads/...)
 * vers le logo du service, s'il a été téléversé.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'logo_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'logo_url');
  },
};
