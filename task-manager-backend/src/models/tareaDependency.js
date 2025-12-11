module.exports = (sequelize, DataTypes) => {
  const TareaDependency = sequelize.define('TareaDependency', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceTaskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tareas',
        key: 'id'
      },
      field: 'source_task_id'
    },
    targetTaskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tareas',
        key: 'id'
      },
      field: 'target_task_id'
    },
    type: {
      type: DataTypes.ENUM('DEPENDS_ON', 'BLOCKED_BY', 'DUPLICATED_WITH'),
      allowNull: false
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      field: 'created_by'
    }
  }, {
    tableName: 'tarea_dependencies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['source_task_id', 'target_task_id', 'type'],
        name: 'unique_dependency'
      },
      {
        fields: ['source_task_id']
      },
      {
        fields: ['target_task_id']
      },
      {
        fields: ['type']
      }
    ],
    hooks: {
      beforeCreate: async (dependency, options) => {
        if (dependency.sourceTaskId === dependency.targetTaskId) {
          throw new Error('Una tarea no puede depender de sí misma');
        }
      },
      beforeValidate: async (dependency, options) => {
        if (dependency.sourceTaskId === dependency.targetTaskId) {
          throw new Error('Una tarea no puede depender de sí misma');
        }
      }
    }
  });

  TareaDependency.associate = (models) => {
    TareaDependency.belongsTo(models.Tarea, {
      foreignKey: 'sourceTaskId',
      as: 'sourceTask'
    });
    
    TareaDependency.belongsTo(models.Tarea, {
      foreignKey: 'targetTaskId',
      as: 'targetTask'
    });
    
    TareaDependency.belongsTo(models.Usuario, {
      foreignKey: 'createdBy',
      as: 'creador'
    });
  };

  return TareaDependency;
};



