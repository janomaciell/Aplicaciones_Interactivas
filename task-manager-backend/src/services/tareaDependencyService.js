const { TareaDependency, Tarea } = require('../models');
const { Op } = require('sequelize');

class TareaDependencyService {
  /**
   * Lista dependencias de una tarea
   * @param {string} tareaId - ID de la tarea
   * @param {object} filters - Filtros opcionales
   * @param {string} filters.type - Tipo de dependencia (DEPENDS_ON, BLOCKED_BY, DUPLICATED_WITH)
   * @param {string} filters.direction - Dirección (outgoing, incoming, both)
   * @returns {Promise<object>} Dependencias encontradas
   */
  static async listarDependencias(tareaId, filters = {}) {
    const { type, direction = 'both' } = filters;
    
    const where = {};
    const include = [];
    
    // Construir condiciones según dirección
    if (direction === 'outgoing' || direction === 'both') {
      where[Op.or] = where[Op.or] || [];
      where[Op.or].push({ sourceTaskId: tareaId });
    }
    
    if (direction === 'incoming' || direction === 'both') {
      where[Op.or] = where[Op.or] || [];
      where[Op.or].push({ targetTaskId: tareaId });
    }
    
    // Filtrar por tipo si se especifica
    if (type) {
      where.type = type;
    }
    
    const dependencias = await TareaDependency.findAll({
      where,
      include: [
        {
          model: Tarea,
          as: 'sourceTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        },
        {
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return dependencias;
  }

  /**
   * Crea una nueva dependencia
   * @param {object} data - Datos de la dependencia
   * @param {string} data.sourceTaskId - ID de la tarea origen
   * @param {string} data.targetTaskId - ID de la tarea objetivo
   * @param {string} data.type - Tipo de dependencia
   * @param {string} data.note - Nota opcional
   * @param {string} data.createdBy - ID del usuario creador
   * @returns {Promise<object>} Dependencia creada
   */
  static async crearDependencia(data) {
    const { sourceTaskId, targetTaskId, type, note, createdBy } = data;
    
    // Validar que las tareas existan
    const sourceTask = await Tarea.findByPk(sourceTaskId);
    const targetTask = await Tarea.findByPk(targetTaskId);
    
    if (!sourceTask) {
      throw new Error('La tarea origen no existe');
    }
    
    if (!targetTask) {
      throw new Error('La tarea objetivo no existe');
    }
    
    // Validar que pertenezcan al mismo equipo
    if (sourceTask.equipoId !== targetTask.equipoId) {
      throw new Error('Las tareas deben pertenecer al mismo equipo');
    }
    
    // Validar que no sean la misma tarea
    if (sourceTaskId === targetTaskId) {
      throw new Error('Una tarea no puede depender de sí misma');
    }
    
    // Validar que no exista ya la dependencia
    const existe = await TareaDependency.findOne({
      where: {
        sourceTaskId,
        targetTaskId,
        type
      }
    });
    
    if (existe) {
      throw new Error('Esta dependencia ya existe');
    }
    
    // Validar ciclos directos para DEPENDS_ON y BLOCKED_BY
    if (type === 'DEPENDS_ON' || type === 'BLOCKED_BY') {
      const cicloDirecto = await TareaDependency.findOne({
        where: {
          sourceTaskId: targetTaskId,
          targetTaskId: sourceTaskId,
          type: type === 'DEPENDS_ON' ? 'DEPENDS_ON' : 'BLOCKED_BY'
        }
      });
      
      if (cicloDirecto) {
        throw new Error(`No se puede crear un ciclo directo: la tarea objetivo ya tiene una dependencia ${type === 'DEPENDS_ON' ? 'DEPENDS_ON' : 'BLOCKED_BY'} hacia la tarea origen`);
      }
    }
    
    const dependencia = await TareaDependency.create({
      sourceTaskId,
      targetTaskId,
      type,
      note: note || null,
      createdBy: createdBy || null
    });
    
    return await TareaDependency.findByPk(dependencia.id, {
      include: [
        {
          model: Tarea,
          as: 'sourceTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        },
        {
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        }
      ]
    });
  }

  /**
   * Actualiza una dependencia existente
   * @param {string} dependenciaId - ID de la dependencia
   * @param {object} data - Datos a actualizar
   * @param {string} data.type - Nuevo tipo (opcional)
   * @param {string} data.note - Nueva nota (opcional)
   * @returns {Promise<object>} Dependencia actualizada
   */
  static async actualizarDependencia(dependenciaId, data) {
    const { type, note } = data;
    
    const dependencia = await TareaDependency.findByPk(dependenciaId);
    
    if (!dependencia) {
      throw new Error('Dependencia no encontrada');
    }
    
    // Si se actualiza el tipo, validar ciclos
    if (type && type !== dependencia.type) {
      if (type === 'DEPENDS_ON' || type === 'BLOCKED_BY') {
        const cicloDirecto = await TareaDependency.findOne({
          where: {
            sourceTaskId: dependencia.targetTaskId,
            targetTaskId: dependencia.sourceTaskId,
            type: type === 'DEPENDS_ON' ? 'DEPENDS_ON' : 'BLOCKED_BY',
            id: { [Op.ne]: dependenciaId }
          }
        });
        
        if (cicloDirecto) {
          throw new Error(`No se puede actualizar: se crearía un ciclo directo`);
        }
      }
    }
    
    await dependencia.update({
      type: type || dependencia.type,
      note: note !== undefined ? note : dependencia.note
    });
    
    return await TareaDependency.findByPk(dependencia.id, {
      include: [
        {
          model: Tarea,
          as: 'sourceTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        },
        {
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'titulo', 'estado', 'prioridad']
        }
      ]
    });
  }

  /**
   * Elimina una dependencia
   * @param {string} dependenciaId - ID de la dependencia
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async eliminarDependencia(dependenciaId) {
    const dependencia = await TareaDependency.findByPk(dependenciaId);
    
    if (!dependencia) {
      throw new Error('Dependencia no encontrada');
    }
    
    await dependencia.destroy();
    return true;
  }

  /**
   * Valida si una tarea puede moverse a estado DONE
   * @param {string} tareaId - ID de la tarea
   * @returns {Promise<object>} Resultado de la validación
   */
  static async validarCierreTarea(tareaId) {
    const tarea = await Tarea.findByPk(tareaId);
    
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }
    
    // Buscar dependencias que bloqueen el cierre
    const dependenciasBloqueantes = await TareaDependency.findAll({
      where: {
        sourceTaskId: tareaId,
        type: {
          [Op.in]: ['DEPENDS_ON', 'BLOCKED_BY']
        }
      },
      include: [
        {
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'titulo', 'estado']
        }
      ]
    });
    
    const tareasPendientes = dependenciasBloqueantes
      .filter(dep => {
        const targetEstado = dep.targetTask.estado;
        return targetEstado !== 'finalizada' && targetEstado !== 'cancelada';
      })
      .map(dep => ({
        id: dep.targetTask.id,
        titulo: dep.targetTask.titulo,
        estado: dep.targetTask.estado,
        tipo: dep.type
      }));
    
    return {
      puedeCerrar: tareasPendientes.length === 0,
      tareasPendientes
    };
  }

  /**
   * Sincroniza estados para dependencias DUPLICATED_WITH
   * @param {string} tareaId - ID de la tarea que cambió de estado
   * @param {string} nuevoEstado - Nuevo estado
   * @returns {Promise<void>}
   */
  static async sincronizarDuplicados(tareaId, nuevoEstado) {
    // Solo sincronizar estados DONE y CANCELLED
    if (nuevoEstado !== 'finalizada' && nuevoEstado !== 'cancelada') {
      return;
    }
    
    // Buscar todas las dependencias DUPLICATED_WITH donde esta tarea es source o target
    const dependencias = await TareaDependency.findAll({
      where: {
        type: 'DUPLICATED_WITH',
        [Op.or]: [
          { sourceTaskId: tareaId },
          { targetTaskId: tareaId }
        ]
      },
      include: [
        {
          model: Tarea,
          as: 'sourceTask',
          attributes: ['id', 'estado']
        },
        {
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'estado']
        }
      ]
    });
    
    // Sincronizar estado en las tareas relacionadas
    for (const dep of dependencias) {
      const otraTareaId = dep.sourceTaskId === tareaId 
        ? dep.targetTaskId 
        : dep.sourceTaskId;
      
      const otraTarea = await Tarea.findByPk(otraTareaId);
      
      if (otraTarea && otraTarea.estado !== nuevoEstado) {
        await otraTarea.update({ estado: nuevoEstado });
      }
    }
  }

  /**
   * Obtiene el resumen de dependencias de una tarea
   * @param {string} tareaId - ID de la tarea
   * @returns {Promise<object>} Resumen de dependencias
   */
  static async obtenerResumenDependencias(tareaId) {
    const [salientes, entrantes] = await Promise.all([
      TareaDependency.findAll({
        where: { sourceTaskId: tareaId },
        include: [{
          model: Tarea,
          as: 'targetTask',
          attributes: ['id', 'titulo', 'estado']
        }]
      }),
      TareaDependency.findAll({
        where: { targetTaskId: tareaId },
        include: [{
          model: Tarea,
          as: 'sourceTask',
          attributes: ['id', 'titulo', 'estado']
        }]
      })
    ]);
    
    const bloqueada = salientes.some(dep => 
      dep.type === 'BLOCKED_BY' && 
      dep.targetTask.estado !== 'finalizada' && 
      dep.targetTask.estado !== 'cancelada'
    );
    
    const tieneDuplicados = salientes.some(dep => dep.type === 'DUPLICATED_WITH') ||
                            entrantes.some(dep => dep.type === 'DUPLICATED_WITH');
    
    return {
      bloqueada,
      tieneDuplicados,
      totalSalientes: salientes.length,
      totalEntrantes: entrantes.length
    };
  }
}

module.exports = TareaDependencyService;



