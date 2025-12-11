const TareaDependencyService = require('../services/tareaDependencyService');
const { Tarea } = require('../models');
const ActividadService = require('../services/actividadService');

class TareaDependencyController {
  /**
   * GET /equipos/:equipoId/tareas/:tareaId/dependencias
   * Lista dependencias de una tarea
   */
  static async listar(req, res) {
    try {
      const { tareaId } = req.params;
      const { type, direction } = req.query;
      
      // Verificar que la tarea existe y pertenece al equipo
      const tarea = await Tarea.findByPk(tareaId);
      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }
      
      const dependencias = await TareaDependencyService.listarDependencias(tareaId, {
        type,
        direction: direction || 'both'
      });
      
      res.json({
        success: true,
        data: {
          dependencias: dependencias.map(dep => ({
            id: dep.id,
            type: dep.type,
            note: dep.note,
            createdAt: dep.createdAt,
            updatedAt: dep.updatedAt,
            sourceTask: {
              id: dep.sourceTask.id,
              titulo: dep.sourceTask.titulo,
              estado: dep.sourceTask.estado,
              prioridad: dep.sourceTask.prioridad
            },
            targetTask: {
              id: dep.targetTask.id,
              titulo: dep.targetTask.titulo,
              estado: dep.targetTask.estado,
              prioridad: dep.targetTask.prioridad
            }
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al listar dependencias',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * POST /equipos/:equipoId/tareas/:tareaId/dependencias
   * Crea una nueva dependencia
   */
  static async crear(req, res) {
    try {
      const { tareaId } = req.params;
      const { targetTaskId, type, note } = req.body;
      const usuarioId = req.usuario.id;
      
      // Verificar que la tarea origen existe y pertenece al equipo
      const tareaOrigen = await Tarea.findByPk(tareaId);
      if (!tareaOrigen) {
        return res.status(404).json({
          success: false,
          message: 'Tarea origen no encontrada'
        });
      }
      
      const dependencia = await TareaDependencyService.crearDependencia({
        sourceTaskId: tareaId,
        targetTaskId,
        type,
        note,
        createdBy: usuarioId
      });
      
      // Registrar actividad
      await ActividadService.registrarActividad({
        tipo: 'dependencia_creada',
        descripcion: `${req.usuario.nombre} creó una dependencia ${type} entre tareas`,
        usuarioId,
        equipoId: tareaOrigen.equipoId,
        tareaId: tareaId,
        metadatos: {
          dependencyId: dependencia.id,
          targetTaskId,
          type
        }
      });
      
      res.status(201).json({
        success: true,
        data: {
          dependencia: {
            id: dependencia.id,
            type: dependencia.type,
            note: dependencia.note,
            createdAt: dependencia.createdAt,
            updatedAt: dependencia.updatedAt,
            sourceTask: {
              id: dependencia.sourceTask.id,
              titulo: dependencia.sourceTask.titulo,
              estado: dependencia.sourceTask.estado,
              prioridad: dependencia.sourceTask.prioridad
            },
            targetTask: {
              id: dependencia.targetTask.id,
              titulo: dependencia.targetTask.titulo,
              estado: dependencia.targetTask.estado,
              prioridad: dependencia.targetTask.prioridad
            }
          }
        },
        message: 'Dependencia creada exitosamente'
      });
    } catch (error) {
      if (error.message.includes('no existe') || 
          error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('mismo equipo') ||
          error.message.includes('sí misma') ||
          error.message.includes('ya existe') ||
          error.message.includes('ciclo')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al crear dependencia',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
   * Obtiene una dependencia específica
   */
  static async obtener(req, res) {
    try {
      const { dependenciaId, tareaId } = req.params;
      
      const { TareaDependency } = require('../models');
      const dependencia = await TareaDependency.findByPk(dependenciaId, {
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
      
      if (!dependencia) {
        return res.status(404).json({
          success: false,
          message: 'Dependencia no encontrada'
        });
      }
      
      // Verificar que pertenece a la tarea especificada
      if (dependencia.sourceTaskId !== tareaId && dependencia.targetTaskId !== tareaId) {
        return res.status(403).json({
          success: false,
          message: 'La dependencia no pertenece a esta tarea'
        });
      }
      
      res.json({
        success: true,
        data: {
          dependencia: {
            id: dependencia.id,
            type: dependencia.type,
            note: dependencia.note,
            createdAt: dependencia.createdAt,
            updatedAt: dependencia.updatedAt,
            sourceTask: {
              id: dependencia.sourceTask.id,
              titulo: dependencia.sourceTask.titulo,
              estado: dependencia.sourceTask.estado,
              prioridad: dependencia.sourceTask.prioridad
            },
            targetTask: {
              id: dependencia.targetTask.id,
              titulo: dependencia.targetTask.titulo,
              estado: dependencia.targetTask.estado,
              prioridad: dependencia.targetTask.prioridad
            }
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener dependencia',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * PUT /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
   * Actualiza una dependencia
   */
  static async actualizar(req, res) {
    try {
      const { dependenciaId, tareaId } = req.params;
      const { type, note } = req.body;
      const usuarioId = req.usuario.id;
      
      const dependenciaActualizada = await TareaDependencyService.actualizarDependencia(
        dependenciaId,
        { type, note }
      );
      
      // Obtener tarea para registrar actividad
      const tarea = await Tarea.findByPk(tareaId);
      
      if (tarea) {
        await ActividadService.registrarActividad({
          tipo: 'dependencia_actualizada',
          descripcion: `${req.usuario.nombre} actualizó una dependencia`,
          usuarioId,
          equipoId: tarea.equipoId,
          tareaId: tareaId,
          metadatos: {
            dependencyId: dependenciaId,
            type: dependenciaActualizada.type
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          dependencia: {
            id: dependenciaActualizada.id,
            type: dependenciaActualizada.type,
            note: dependenciaActualizada.note,
            createdAt: dependenciaActualizada.createdAt,
            updatedAt: dependenciaActualizada.updatedAt,
            sourceTask: {
              id: dependenciaActualizada.sourceTask.id,
              titulo: dependenciaActualizada.sourceTask.titulo,
              estado: dependenciaActualizada.sourceTask.estado,
              prioridad: dependenciaActualizada.sourceTask.prioridad
            },
            targetTask: {
              id: dependenciaActualizada.targetTask.id,
              titulo: dependenciaActualizada.targetTask.titulo,
              estado: dependenciaActualizada.targetTask.estado,
              prioridad: dependenciaActualizada.targetTask.prioridad
            }
          }
        },
        message: 'Dependencia actualizada exitosamente'
      });
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ciclo')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar dependencia',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * DELETE /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
   * Elimina una dependencia
   */
  static async eliminar(req, res) {
    try {
      const { dependenciaId, tareaId } = req.params;
      const usuarioId = req.usuario.id;
      
      // Obtener dependencia antes de eliminarla para registrar actividad
      const { TareaDependency } = require('../models');
      const dependencia = await TareaDependency.findByPk(dependenciaId);
      
      if (!dependencia) {
        return res.status(404).json({
          success: false,
          message: 'Dependencia no encontrada'
        });
      }
      
      // Verificar que pertenece a la tarea especificada
      if (dependencia.sourceTaskId !== tareaId && dependencia.targetTaskId !== tareaId) {
        return res.status(403).json({
          success: false,
          message: 'La dependencia no pertenece a esta tarea'
        });
      }
      
      // Obtener tarea para registrar actividad
      const tarea = await Tarea.findByPk(tareaId);
      
      await TareaDependencyService.eliminarDependencia(dependenciaId);
      
      if (tarea) {
        await ActividadService.registrarActividad({
          tipo: 'dependencia_eliminada',
          descripcion: `${req.usuario.nombre} eliminó una dependencia`,
          usuarioId,
          equipoId: tarea.equipoId,
          tareaId: tareaId,
          metadatos: {
            dependencyId: dependenciaId,
            type: dependencia.type
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Dependencia eliminada exitosamente'
      });
    } catch (error) {
      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al eliminar dependencia',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /equipos/:equipoId/tareas/:tareaId/dependencias/resumen
   * Obtiene resumen de dependencias (bloqueada, duplicados, etc.)
   */
  static async obtenerResumen(req, res) {
    try {
      const { tareaId } = req.params;
      
      const tarea = await Tarea.findByPk(tareaId);
      if (!tarea) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }
      
      const resumen = await TareaDependencyService.obtenerResumenDependencias(tareaId);
      
      res.json({
        success: true,
        data: { resumen }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de dependencias',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = TareaDependencyController;



