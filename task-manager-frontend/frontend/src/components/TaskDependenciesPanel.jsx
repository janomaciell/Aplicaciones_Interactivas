import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client.js'
import { useNotifications } from '../context/NotificationContext.jsx'
import DependencyGroup from './DependencyGroup.jsx'
import DependencyForm from './DependencyForm.jsx'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import Card from './Card.jsx'

export default function TaskDependenciesPanel({ tarea, equipoId, canEdit = true, showPlaceholderWhenMissing = false }) {
  
  const { id: tareaIdFromParams } = useParams()
  const { success, error: showError } = useNotifications()
  
  const tareaId = tarea?.id || tareaIdFromParams
  
  
  const [dependencias, setDependencias] = useState([])
  const [availableTasks, setAvailableTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDependency, setEditingDependency] = useState(null)
  const [formType, setFormType] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resumen, setResumen] = useState(null)
  
  const cargarDependencias = useCallback(async () => {
    if (!tareaId || !equipoId) {
      console.log('Faltan tareaId o equipoId:', { tareaId, equipoId })
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      console.log('Cargando dependencias para:', { equipoId, tareaId })
      
      const [depsRes, tasksRes, resumenRes] = await Promise.all([
        api.get(`/tareas/${equipoId}/${tareaId}/dependencias`).catch(err => {
          console.error('Error cargando dependencias:', err)
          return { data: { data: { dependencias: [] } } }
        }),
        api.get(`/tareas/${equipoId}`).catch(err => {
          console.error('Error cargando tareas:', err)
          return { data: { data: { tareas: [] } } }
        }),
        api.get(`/tareas/${equipoId}/${tareaId}/dependencias/resumen`).catch(err => {
          return { data: { data: { resumen: null } } }
        })
      ])
      
      const deps = depsRes.data?.data?.dependencias || []
      const tasks = tasksRes.data?.data?.tareas || tasksRes.data?.data?.rows || []
      const resumenData = resumenRes.data?.data?.resumen || null

      setDependencias(deps)
      setAvailableTasks(tasks)
      setResumen(resumenData)
    } catch (err) {
      showError('Error', 'No se pudieron cargar las dependencias')
    } finally {
      setLoading(false)
    }
  }, [tareaId, equipoId, showError])
  
  useEffect(() => {
    cargarDependencias()
  }, [cargarDependencias])
  
  const organizarDependencias = (deps) => {
    if (!tareaId) return { DEPENDS_ON: { outgoing: [], incoming: [] }, BLOCKED_BY: { outgoing: [], incoming: [] }, DUPLICATED_WITH: { outgoing: [], incoming: [] } }
    
    const salientes = deps.filter(d => String(d.sourceTask?.id) === String(tareaId))
    const entrantes = deps.filter(d => String(d.targetTask?.id) === String(tareaId))
    
    return {
      DEPENDS_ON: {
        outgoing: salientes.filter(d => d.type === 'DEPENDS_ON'),
        incoming: entrantes.filter(d => d.type === 'DEPENDS_ON')
      },
      BLOCKED_BY: {
        outgoing: salientes.filter(d => d.type === 'BLOCKED_BY'),
        incoming: entrantes.filter(d => d.type === 'BLOCKED_BY')
      },
      DUPLICATED_WITH: {
        outgoing: salientes.filter(d => d.type === 'DUPLICATED_WITH'),
        incoming: entrantes.filter(d => d.type === 'DUPLICATED_WITH')
      }
    }
  }
  
  const handleAdd = (type) => {
    setFormType(type)
    setEditingDependency(null)
    setFormOpen(true)
  }
  
  const handleEdit = (dependency) => {
    setEditingDependency(dependency)
    setFormType(dependency.type)
    setFormOpen(true)
  }
  
  const handleDelete = async (dependency) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta dependencia?')) {
      return
    }
    
    try {
      await api.delete(`/tareas/${equipoId}/${tareaId}/dependencias/${dependency.id}`)
      success('Éxito', 'Dependencia eliminada correctamente')
      cargarDependencias()
    } catch (err) {
      const message = err.response?.data?.message || 'Error al eliminar dependencia'
      showError('Error', message)
    }
  }
  
  const handleSubmit = async (formData) => {
    try {
      setSaving(true)
      
      if (editingDependency) {
        // Actualizar
        await api.put(
          `/tareas/${equipoId}/${tareaId}/dependencias/${editingDependency.id}`,
          formData
        )
        success('Éxito', 'Dependencia actualizada correctamente')
      } else {

        await api.post(
          `/tareas/${equipoId}/${tareaId}/dependencias`,
          formData
        )
        success('Éxito', 'Dependencia creada correctamente')
      }
      
      setFormOpen(false)
      setEditingDependency(null)
      setFormType(null)
      cargarDependencias()
    } catch (err) {
      const message = err.response?.data?.message || 'Error al guardar dependencia'
      showError('Error', message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    setFormOpen(false)
    setEditingDependency(null)
    setFormType(null)
  }
  
  const depsOrganizadas = organizarDependencias(dependencias)

  const missingIds = !tareaId || !equipoId
  
  const abrirNuevaDependencia = () => {
    setFormType('DEPENDS_ON')
    setEditingDependency(null)
    setFormOpen(true)
  }
 
  return (
    <>
      <Card 
        title="Dependencias"
        actions={
          canEdit && !missingIds ? (
            <Button 
              onClick={() => abrirNuevaDependencia()} 
              className="btn-success" 
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              Nueva dependencia
            </Button>
          ) : null
        }
      >
        {!equipoId && (
          <div style={{ 
            padding: 16, 
            marginBottom: 16,
            background: '#fee2e2',
            borderRadius: 8,
            border: '1px solid #ef4444',
            color: '#dc2626',
            fontSize: 13
          }}>
            ⚠️ No se pudo cargar el equipo. Las dependencias no están disponibles.
            <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
              Debug: tareaId={tareaId}, equipoId={equipoId || 'null'}, tarea.id={tarea?.id}
            </div>
          </div>
        )}

        {showPlaceholderWhenMissing && missingIds && (
          <div style={{ 
            padding: 16, 
            marginBottom: 16,
            background: '#f8fafc',
            borderRadius: 8,
            border: '1px dashed var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 14
          }}>
            {equipoId
              ? 'Guardá la tarea o seleccioná una existente para gestionar sus dependencias.'
              : 'Elegí un equipo y una tarea para ver y editar sus dependencias.'}
          </div>
        )}

        {resumen && !missingIds && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: resumen.bloqueada ? '#fee2e2' : '#f0f9ff',
            borderRadius: 8,
            border: `1px solid ${resumen.bloqueada ? '#ef4444' : '#3b82f6'}`,
            fontSize: 13
          }}>
            {resumen.bloqueada && (
              <div style={{ color: '#dc2626', fontWeight: 600 }}>
                ⚠️ Esta tarea está bloqueada por dependencias pendientes
              </div>
            )}
            {resumen.tieneDuplicados && (
              <div style={{ color: '#1e40af', marginTop: 4 }}>
                🔄 Esta tarea tiene duplicados
              </div>
            )}
          </div>
        )}
        
        {missingIds ? (
          <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>
            {equipoId
              ? 'Seleccioná una tarea para ver sus dependencias.'
              : 'Esperando información del equipo...'}
          </div>
        ) : loading ? (
          <div>
            <div className="skeleton" style={{ height: 100, borderRadius: 8, marginBottom: 16 }}></div>
            <div className="skeleton" style={{ height: 100, borderRadius: 8, marginBottom: 16 }}></div>
            <div className="skeleton" style={{ height: 100, borderRadius: 8 }}></div>
          </div>
        ) : (
          <>
            <DependencyGroup
              type="DEPENDS_ON"
              dependencies={depsOrganizadas.DEPENDS_ON.outgoing}
              isOutgoing={true}
              onAdd={canEdit ? handleAdd : null}
              onEdit={canEdit ? handleEdit : null}
              onDelete={canEdit ? handleDelete : null}
              canEdit={canEdit}
            />
            
            <DependencyGroup
              type="BLOCKED_BY"
              dependencies={depsOrganizadas.BLOCKED_BY.outgoing}
              isOutgoing={true}
              onAdd={canEdit ? handleAdd : null}
              onEdit={canEdit ? handleEdit : null}
              onDelete={canEdit ? handleDelete : null}
              canEdit={canEdit}
            />
            
            <DependencyGroup
              type="DUPLICATED_WITH"
              dependencies={[
                ...depsOrganizadas.DUPLICATED_WITH.outgoing,
                ...depsOrganizadas.DUPLICATED_WITH.incoming
              ]}
              isOutgoing={true}
              onAdd={canEdit ? handleAdd : null}
              onEdit={canEdit ? handleEdit : null}
              onDelete={canEdit ? handleDelete : null}
              canEdit={canEdit}
            />
          </>
        )}
      </Card>
      
      <Modal
        open={formOpen}
        title={editingDependency ? 'Editar dependencia' : 'Nueva dependencia'}
        onClose={handleCancel}
        actions={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
          </div>
        }
      >
        <DependencyForm
          dependency={editingDependency}
          sourceTaskId={tareaId}
          availableTasks={availableTasks}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </Modal>
    </>
  )
}

