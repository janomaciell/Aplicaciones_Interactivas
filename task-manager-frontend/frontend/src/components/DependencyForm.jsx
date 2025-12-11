import { useState, useEffect } from 'react'
import Input from './Input.jsx'
import Button from './Button.jsx'

const TIPOS = [
  { value: 'DEPENDS_ON', label: 'Depende de' },
  { value: 'BLOCKED_BY', label: 'Bloqueada por' },
  { value: 'DUPLICATED_WITH', label: 'Duplicada con' }
]

export default function DependencyForm({ 
  dependency = null,
  sourceTaskId,
  availableTasks = [],
  onSubmit,
  onCancel,
  loading = false
}) {
  const [targetTaskId, setTargetTaskId] = useState(dependency?.targetTaskId || '')
  const [type, setType] = useState(dependency?.type || 'DEPENDS_ON')
  const [note, setNote] = useState(dependency?.note || '')
  const [errors, setErrors] = useState({})
  
  useEffect(() => {
    if (dependency) {
      setTargetTaskId(dependency.targetTaskId)
      setType(dependency.type)
      setNote(dependency.note || '')
    }
  }, [dependency])
  
  const validate = () => {
    const newErrors = {}
    
    if (!targetTaskId) {
      newErrors.targetTaskId = 'Debes seleccionar una tarea'
    } else if (targetTaskId === sourceTaskId) {
      newErrors.targetTaskId = 'No puedes seleccionar la misma tarea'
    }
    
    if (!type) {
      newErrors.type = 'Debes seleccionar un tipo de dependencia'
    }
    
    if (note && note.length > 255) {
      newErrors.note = 'La nota no puede exceder 255 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validate()) {
      return
    }
    
    onSubmit({
      targetTaskId,
      type,
      note: note.trim() || null
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 500 
        }}>
          Tarea relacionada *
        </label>
        <select
          className="field-input"
          value={targetTaskId}
          onChange={(e) => {
            setTargetTaskId(e.target.value)
            setErrors(prev => ({ ...prev, targetTaskId: null }))
          }}
          disabled={loading}
          style={{ 
            width: '100%',
            borderColor: errors.targetTaskId ? 'var(--error)' : undefined
          }}
        >
          <option value="">Seleccionar tarea...</option>
          {availableTasks
            .filter(task => task.id !== sourceTaskId)
            .map(task => (
              <option key={task.id} value={task.id}>
                {task.titulo} ({task.estado})
              </option>
            ))}
        </select>
        {availableTasks.filter(task => task.id !== sourceTaskId).length === 0 && (
          <div style={{ 
            fontSize: 12, 
            color: 'var(--text-muted)', 
            marginTop: 6 
          }}>
            No hay tareas disponibles para relacionar en este equipo.
          </div>
        )}
        {errors.targetTaskId && (
          <div style={{ 
            fontSize: 12, 
            color: 'var(--error)', 
            marginTop: 4 
          }}>
            {errors.targetTaskId}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 500 
        }}>
          Tipo de dependencia *
        </label>
        <select
          className="field-input"
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setErrors(prev => ({ ...prev, type: null }))
          }}
          disabled={loading}
          style={{ 
            width: '100%',
            borderColor: errors.type ? 'var(--error)' : undefined
          }}
        >
          {TIPOS.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
        {errors.type && (
          <div style={{ 
            fontSize: 12, 
            color: 'var(--error)', 
            marginTop: 4 
          }}>
            {errors.type}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 500 
        }}>
          Nota (opcional)
        </label>
        <Input
          type="text"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setErrors(prev => ({ ...prev, note: null }))
          }}
          placeholder="Justificación de la relación..."
          maxLength={255}
          disabled={loading}
          style={{ 
            borderColor: errors.note ? 'var(--error)' : undefined
          }}
        />
        <div style={{ 
          fontSize: 11, 
          color: 'var(--text-muted)', 
          marginTop: 4 
        }}>
          {note.length}/255 caracteres
        </div>
        {errors.note && (
          <div style={{ 
            fontSize: 12, 
            color: 'var(--error)', 
            marginTop: 4 
          }}>
            {errors.note}
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        justifyContent: 'flex-end' 
      }}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Guardando...' : (dependency ? 'Actualizar' : 'Crear')}
        </Button>
      </div>
    </form>
  )
}

