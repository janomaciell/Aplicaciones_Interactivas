'use strict';

const NUEVOS_TIPOS = [
  'tarea_creada', 'tarea_editada', 'tarea_asignada', 'tarea_estado_cambiado',
  'comentario_agregado', 'etiqueta_agregada', 'etiqueta_removida',
  'miembro_agregado', 'miembro_removido',
  'dependencia_creada', 'dependencia_actualizada', 'dependencia_eliminada'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('actividades', 'tipo', {
      type: Sequelize.ENUM(...NUEVOS_TIPOS),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    const TIPOS_ANTERIORES = [
      'tarea_creada', 'tarea_editada', 'tarea_asignada', 'tarea_estado_cambiado',
      'comentario_agregado', 'etiqueta_agregada', 'etiqueta_removida',
      'miembro_agregado', 'miembro_removido'
    ];

    await queryInterface.changeColumn('actividades', 'tipo', {
      type: Sequelize.ENUM(...TIPOS_ANTERIORES),
      allowNull: false
    });
  }
};

