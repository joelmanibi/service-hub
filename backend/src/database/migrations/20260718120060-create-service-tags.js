'use strict';

/**
 * Table `service_tags` — pivot many-to-many entre `services` et `tags`,
 * clé primaire composite (service_id, tag_id) : un même tag ne peut être
 * associé qu'une seule fois à un même service.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_tags', {
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      tag_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'tags', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_tags');
  },
};
