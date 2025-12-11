'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen dependencias
    const existingDeps = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM tarea_dependencies',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingDeps[0].count > 0) {
      console.log('Las dependencias de prueba ya existen, saltando seeder...');
      return;
    }

    // Obtener usuarios y equipos existentes
    const usuarios = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios LIMIT 3',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const equipos = await queryInterface.sequelize.query(
      'SELECT id FROM equipos LIMIT 2',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (usuarios.length === 0 || equipos.length === 0) {
      console.log('No hay usuarios o equipos, saltando seeder de dependencias...');
      return;
    }

    const usuario1Id = usuarios[0].id;
    const equipo1Id = equipos[0].id;

    // Obtener tareas existentes usando queryInterface (más seguro)
    let tareaIds = [];
    try {
      // Usar queryInterface.select que maneja los nombres de columnas correctamente
      const tareasExistentes = await queryInterface.sequelize.query(
        `SELECT id FROM tareas LIMIT 5`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      tareaIds = tareasExistentes.map(t => t.id);
    } catch (e) {
      console.log('No se pudieron obtener tareas existentes:', e.message);
    }

    // Si no hay suficientes tareas, crear algunas
    if (tareaIds.length < 3) {
      const nuevasTareas = [];
      for (let i = 0; i < 5; i++) {
        const tareaId = uuidv4();
        nuevasTareas.push({
          id: tareaId,
          titulo: `Tarea de ejemplo ${i + 1}`,
          descripcion: `Descripción de la tarea de ejemplo ${i + 1}`,
          estado: i === 0 ? 'finalizada' : i === 1 ? 'en_curso' : 'pendiente',
          prioridad: i % 2 === 0 ? 'alta' : 'media',
          equipoId: equipo1Id,
          creadoPor: usuario1Id,
          asignadoA: usuario1Id,
          orden: i,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        tareaIds.push(tareaId);
      }

      await queryInterface.bulkInsert('tareas', nuevasTareas);
      console.log('Tareas de ejemplo creadas para dependencias');
    }

    // Crear dependencias de ejemplo
    if (tareaIds.length >= 3) {
      const dependencias = [
        {
          id: uuidv4(),
          source_task_id: tareaIds[1], // Tarea en curso
          target_task_id: tareaIds[0], // Tarea finalizada
          type: 'DEPENDS_ON',
          note: 'Esta tarea depende de la tarea finalizada',
          created_by: usuario1Id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          source_task_id: tareaIds[2], // Tarea pendiente
          target_task_id: tareaIds[1], // Tarea en curso
          type: 'BLOCKED_BY',
          note: 'Esta tarea está bloqueada por la tarea en curso',
          created_by: usuario1Id,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          source_task_id: tareaIds[3] || tareaIds[0],
          target_task_id: tareaIds[4] || tareaIds[1],
          type: 'DUPLICATED_WITH',
          note: 'Estas tareas son duplicadas',
          created_by: usuario1Id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ].filter(dep => dep.source_task_id && dep.target_task_id && dep.source_task_id !== dep.target_task_id);

      if (dependencias.length > 0) {
        await queryInterface.bulkInsert('tarea_dependencies', dependencias);
        console.log('Dependencias de prueba insertadas correctamente');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tarea_dependencies', null, {});
    // Opcional: eliminar tareas de ejemplo creadas
    // await queryInterface.bulkDelete('tareas', { titulo: { [Op.like]: 'Tarea de ejemplo%' } }, {});
  }
};

