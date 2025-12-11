'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tarea_dependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      source_task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tareas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tareas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('DEPENDS_ON', 'BLOCKED_BY', 'DUPLICATED_WITH'),
        allowNull: false
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índice único para evitar duplicados
    await queryInterface.addIndex('tarea_dependencies', 
      ['source_task_id', 'target_task_id', 'type'],
      {
        unique: true,
        name: 'unique_dependency'
      }
    );

    // Índices para mejorar consultas
    await queryInterface.addIndex('tarea_dependencies', ['source_task_id']);
    await queryInterface.addIndex('tarea_dependencies', ['target_task_id']);
    await queryInterface.addIndex('tarea_dependencies', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tarea_dependencies');
  }
};



