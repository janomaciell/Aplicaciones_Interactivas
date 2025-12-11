import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import TaskDependenciesPanel from '../components/TaskDependenciesPanel.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: '#fef3c7', textColor: '#92400e' },
  { value: 'en_curso', label: 'En curso', color: '#dbeafe', textColor: '#1e40af' },
  { value: 'finalizada', label: 'Finalizada', color: '#d1fae5', textColor: '#065f46' },
  { value: 'cancelada', label: 'Cancelada', color: '#fee2e2', textColor: '#991b1b' }
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
]

export default function TaskDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { error: showError, success } = useNotifications()
  const [tarea, setTarea] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [historial, setHistorial] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [loading, setLoading] = useState(true)
  const [equipoId, setEquipoId] = useState(null)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  
  // Estados para edición
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [prioridad, setPrioridad] = useState('media')
  const [fechaLimite, setFechaLimite] = useState('')
  const [asignadoA, setAsignadoA] = useState('')
  const [miembros, setMiembros] = useState([])

  const cargarMiembros = async (equipoId) => {
    if (!equipoId) {
      setMiembros([])
      return
    }
    try {
      const res = await api.get(`/equipos/${equipoId}/miembros`)
      const miembrosData = res?.data?.data?.miembros || []
      setMiembros(miembrosData)
    } catch (e) {
      console.error('Error cargando miembros:', e)
      setMiembros([])
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        // Primero obtener los equipos para buscar la tarea
        const equiposRes = await api.get('/equipos')
        const equipos = equiposRes?.data?.data?.equipos || []
        
        // Buscar la tarea en todos los equipos
        let tareaData = null
        let equipoEncontrado = null
        
        for (const equipo of equipos) {
          try {
            const tRes = await api.get(`/tareas/${equipo.id}/${id}`)
            tareaData = tRes.data?.data?.tarea || tRes.data?.data
            if (tareaData) {
              equipoEncontrado = equipo.id
              break
            }
          } catch (e) {
            // Continuar buscando en el siguiente equipo
            continue
          }
        }
        
        if (!tareaData) {
          showError('Error', 'Tarea no encontrada')
          return
        }
        
        setTarea(tareaData)
        const equipoIdFinal = equipoEncontrado || tareaData.equipoId || tareaData.equipo?.id
        setEquipoId(equipoIdFinal)
        
        // Inicializar estados de edición
        setTitulo(tareaData.titulo || '')
        setDescripcion(tareaData.descripcion || '')
        setEstado(tareaData.estado || 'pendiente')
        setPrioridad(tareaData.prioridad || 'media')
        setFechaLimite(tareaData.fechaLimite ? tareaData.fechaLimite.split('T')[0] : '')
        setAsignadoA(tareaData.asignado?.id || tareaData.asignadoA || '')
        
        // Cargar miembros del equipo
        if (equipoIdFinal) {
          cargarMiembros(equipoIdFinal)
          
          // Intentar cargar comentarios e historial si existen
          try {
            const [c, h] = await Promise.all([
              api.get(`/tareas/${equipoIdFinal}/${id}/comentarios`).catch(() => ({ data: { rows: [] } })),
              api.get(`/tareas/${equipoIdFinal}/${id}/historial`).catch(() => ({ data: { rows: [] } }))
            ])
            setComentarios(c.data?.rows || c.data?.comentarios || [])
            setHistorial(h.data?.rows || h.data?.historial || [])
          } catch (err) {
            // Si no existen esos endpoints, continuar sin ellos
            console.log('Comentarios o historial no disponibles')
          }
        }
      } catch (err) {
        showError('Error', 'No se pudo cargar la tarea')
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, showError])

  const handleGuardar = async () => {
    if (!equipoId) return
    
    setGuardando(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        estado,
        prioridad,
        fechaLimite: fechaLimite || undefined,
        asignadoA: asignadoA || undefined
      }
      
      // Remover campos undefined
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key]
        }
      })

      const res = await api.put(`/tareas/${equipoId}/${id}`, payload)
      const tareaActualizada = res.data?.data?.tarea || res.data?.data
      
      setTarea(tareaActualizada)
      setEditando(false)
      success('Tarea actualizada', 'La tarea se actualizó correctamente')
      
      // Recargar historial para ver los cambios
      try {
        const hRes = await api.get(`/tareas/${equipoId}/${id}/historial`)
        setHistorial(hRes.data?.rows || hRes.data?.historial || [])
      } catch (e) {
        console.log('No se pudo recargar historial')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar la tarea'
      showError('Error', errorMsg)
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelarEdicion = () => {
    // Restaurar valores originales
    if (tarea) {
      setTitulo(tarea.titulo || '')
      setDescripcion(tarea.descripcion || '')
      setEstado(tarea.estado || 'pendiente')
      setPrioridad(tarea.prioridad || 'media')
      setFechaLimite(tarea.fechaLimite ? tarea.fechaLimite.split('T')[0] : '')
      setAsignadoA(tarea.asignado?.id || tarea.asignadoA || '')
    }
    setEditando(false)
  }

  const handleEliminar = async () => {
    if (!equipoId) return
    
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas eliminar esta tarea?\n\n' +
      'Esta acción eliminará:\n' +
      '- La tarea y todos sus datos\n' +
      '- Todas las dependencias asociadas\n' +
      '- Todos los comentarios\n' +
      '- Todo el historial\n\n' +
      'Esta acción no se puede deshacer.'
    )
    
    if (!confirmar) return
    
    setEliminando(true)
    try {
      await api.delete(`/tareas/${equipoId}/${id}`)
      success('Tarea eliminada', 'La tarea se eliminó correctamente')
      navigate(`/tareas${equipoId ? `?equipo=${equipoId}` : ''}`)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar la tarea'
      showError('Error', errorMsg)
      setEliminando(false)
    }
  }

  const agregarComentario = async () => {
    if (!nuevoComentario.trim() || !equipoId) return
    try {
      const res = await api.post(`/tareas/${equipoId}/${id}/comentarios`, { contenido: nuevoComentario })
      setComentarios((prev) => [res.data?.data?.comentario || res.data, ...prev])
    setNuevoComentario('')
    } catch (err) {
      showError('Error', 'No se pudo agregar el comentario')
    }
  }

  if (loading) return <div className="page-loading">Cargando...</div>
  if (!tarea) return <div className="page-error">No se encontró la tarea</div>

  const formatearFecha = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const estadoInfo = ESTADOS.find(e => e.value === (editando ? estado : tarea.estado)) || ESTADOS[0]

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Detalle de Tarea</div>
          <p className="page-description">
            Información completa y gestión de dependencias
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editando ? (
            <>
              <Button 
                onClick={handleGuardar} 
                disabled={guardando || eliminando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleCancelarEdicion}
                disabled={guardando || eliminando}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditando(true)}>
                Editar
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleEliminar}
                disabled={eliminando}
                style={{ 
                  color: 'var(--error)', 
                  borderColor: 'var(--error)'
                }}
              >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </>
          )}
        </div>
      </div>

    <div className="details-grid">
        {/* Información Principal */}
        <Card title={editando ? (
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título de la tarea"
            style={{ fontSize: '18px', fontWeight: 600 }}
          />
        ) : tarea.titulo}>
          <div className="task-details-content">
            <div className="task-description" style={{ marginBottom: 16 }}>
              {editando ? (
                <textarea
                  className="field-input"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción de la tarea"
                  rows={4}
                  style={{ width: '100%' }}
                />
              ) : (
                tarea.descripcion && <p>{tarea.descripcion}</p>
              )}
            </div>
            
            <div className="task-metadata">
              <div className="metadata-item">
                <span className="metadata-label">Estado:</span>
                {editando ? (
                  <select
                    className="field-input"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    style={{
                      backgroundColor: ESTADOS.find(e => e.value === estado)?.color || 'transparent',
                      color: ESTADOS.find(e => e.value === estado)?.textColor || 'inherit',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      border: '1px solid var(--border)',
                      minWidth: 120
                    }}
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span 
                    className="metadata-value badge"
                    style={{
                      backgroundColor: estadoInfo.color,
                      color: estadoInfo.textColor,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {estadoInfo.label}
                  </span>
                )}
              </div>
              
              <div className="metadata-item">
                <span className="metadata-label">Prioridad:</span>
                {editando ? (
                  <select
                    className="field-input"
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: '1px solid var(--border)',
                      minWidth: 120
                    }}
                  >
                    {PRIORIDADES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`metadata-value badge badge-priority-${tarea.prioridad || 'media'}`}>
                    {tarea.prioridad || 'media'}
                  </span>
                )}
              </div>
              
              <div className="metadata-item">
                <span className="metadata-label">Asignado a:</span>
                {editando ? (
                  <select
                    className="field-input"
                    value={asignadoA}
                    onChange={(e) => setAsignadoA(e.target.value)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: '1px solid var(--border)',
                      minWidth: 180
                    }}
                  >
                    <option value="">Sin asignar</option>
                    {miembros.map((membresia) => {
                      const usuario = membresia.usuario || membresia
                      return (
                        <option key={usuario.id} value={usuario.id}>
                          @{usuario.nombre || usuario.email}
                        </option>
                      )
                    })}
                  </select>
                ) : (
                  <span className="metadata-value">
                    {tarea.asignado?.nombre || tarea.asignadoA?.nombre || 'Sin asignar'}
                  </span>
                )}
              </div>
              
              <div className="metadata-item">
                <span className="metadata-label">Fecha límite:</span>
                {editando ? (
                  <Input
                    type="date"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      border: '1px solid var(--border)',
                      minWidth: 150
                    }}
                  />
                ) : (
                  <span className="metadata-value">
                    {tarea.fechaLimite ? formatearFecha(tarea.fechaLimite) : 'Sin fecha límite'}
                  </span>
                )}
              </div>
            </div>
        </div>
      </Card>

        {/* Dependencias */}
        <TaskDependenciesPanel 
          tarea={tarea} 
          equipoId={equipoId}
          canEdit={true}
        />

        {/* Comentarios */}
        <Card title="Comentarios">
          <div className="comentarios-section">
            <div className="comentario-input">
              <textarea
                className="field-input"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe un comentario..."
                rows={3}
                style={{ width: '100%', marginBottom: 12 }}
              />
              <Button 
                onClick={agregarComentario} 
                disabled={!nuevoComentario.trim()}
                style={{ width: '100%' }}
              >
                Agregar comentario
              </Button>
            </div>
            
            {comentarios.length > 0 && (
              <div className="comentarios-list" style={{ marginTop: 20 }}>
          {comentarios.map((c) => (
                  <div key={c.id} className="comentario-item">
                    <div className="comentario-header">
                      <strong>@{c.usuario?.nombre || c.autor?.nombre || c.usuario?.email || c.autor?.email || 'Usuario'}</strong>
                      <span className="comentario-fecha">{formatearFecha(c.createdAt)}</span>
                    </div>
                    <div className="comentario-contenido">{c.contenido}</div>
            </div>
          ))}
              </div>
            )}
            
            {comentarios.length === 0 && (
              <div style={{ 
                padding: 24, 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: 14 
              }}>
                No hay comentarios aún
              </div>
            )}
        </div>
      </Card>

        {/* Historial */}
        <Card title="Historial de Cambios">
          {historial.length > 0 ? (
        <div className="timeline">
              {historial.map((h) => {
                const estadoAnterior = ESTADOS.find(e => e.value === h.estadoAnterior)
                const estadoNuevo = ESTADOS.find(e => e.value === h.estadoNuevo)
                return (
            <div key={h.id} className="timeline-item">
              <div className="dot" />
              <div>
                      <div className="timeline-title">
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: estadoAnterior?.color || '#f3f4f6',
                            color: estadoAnterior?.textColor || '#374151',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {h.estadoAnterior || '—'}
                        </span>
                        {' → '}
                        <span 
                          className="badge"
                          style={{
                            backgroundColor: estadoNuevo?.color || '#f3f4f6',
                            color: estadoNuevo?.textColor || '#374151',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          {h.estadoNuevo}
                        </span>
                      </div>
                      <div className="timeline-sub">{formatearFecha(h.createdAt)}</div>
                    </div>
              </div>
                )
              })}
            </div>
          ) : (
            <div style={{ 
              padding: 24, 
              textAlign: 'center', 
              color: 'var(--text-muted)',
              fontSize: 14 
            }}>
              No hay historial de cambios
        </div>
          )}
      </Card>
      </div>
    </div>
  )
}


