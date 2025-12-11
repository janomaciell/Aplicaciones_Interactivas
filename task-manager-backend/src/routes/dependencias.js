const express = require('express');
const TareaDependencyController = require('../controllers/tareaDependencyController');
const validaciones = require('../utils/validations');
const manejarValidacion = require('../middleware/validation');
const auth = require('../middleware/auth');
const { verificarAccesoEquipo } = require('../middleware/equipoAccess');

const router = express.Router({ mergeParams: true });

router.use(auth);

// GET /equipos/:equipoId/tareas/:tareaId/dependencias
// Lista dependencias de una tarea
router.get('/',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.validarQueryDependencias,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.listar
);

// GET /equipos/:equipoId/tareas/:tareaId/dependencias/resumen
// Obtiene resumen de dependencias
router.get('/resumen',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.obtenerResumen
);

// POST /equipos/:equipoId/tareas/:tareaId/dependencias
// Crea una nueva dependencia
router.post('/',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.crearDependencia,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.crear
);

// GET /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
// Obtiene una dependencia específica
router.get('/:dependenciaId',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.validarUUID('dependenciaId'),
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.obtener
);

// PUT /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
// Actualiza una dependencia
router.put('/:dependenciaId',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.validarUUID('dependenciaId'),
  validaciones.actualizarDependencia,
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.actualizar
);

// DELETE /equipos/:equipoId/tareas/:tareaId/dependencias/:dependenciaId
// Elimina una dependencia
router.delete('/:dependenciaId',
  validaciones.validarUUID('equipoId'),
  validaciones.validarUUID('tareaId'),
  validaciones.validarUUID('dependenciaId'),
  manejarValidacion,
  verificarAccesoEquipo,
  TareaDependencyController.eliminar
);


module.exports = router;



