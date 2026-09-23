'use strict';

/**
 * Ajoute `architecture_image_url` à `instances` : chemin relatif
 * (/uploads/...) vers un schéma d'architecture de l'instance (image),
 * facultatif — même principe que `logo_url` sur `services` (module
 * catalog).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('instances', 'architecture_image_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instances', 'architecture_image_url');
  },
};
