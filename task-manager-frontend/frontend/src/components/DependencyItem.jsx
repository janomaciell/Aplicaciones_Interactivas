import { useNavigate } from 'react-router-dom'
import Button from './Button.jsx'

const TIPO_LABELS = {
  DEPENDS_ON: 'Depende de',
  BLOCKED_BY: 'Bloqueada por',
  DUPLICATED_WITH: 'Duplicada con'
}

const ESTADO_COLORS = {
  pendiente: '#fbbf24',
  en_curso: '#22c55e',
  finalizada: '#3b82f6',
  cancelada: '#ef4444'
}

export default function DependencyItem({ 
  dependency, 
  isOutgoing, 
  onEdit, 
  onDelete,
  canEdit = true 
}) {
  const navigate = useNavigate()
  
  const relatedTask = isOutgoing ? dependency.targetTask : dependency.sourceTask
  const tipoLabel = TIPO_LABELS[dependency.type] || dependency.type
  
  const handleTaskClick = (e) => {
    e.stopPropagation()
    navigate(`/tareas/${relatedTask.id}`)
  }
  
  return (
    <div 
      style={{
        padding: 12,
        border: '1px solid var(--border)',
        borderRadius: 8,
        marginBottom: 8,
        background: 'var(--bg-secondary)',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span 
              style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              {tipoLabel}
            </span>
            <span 
              className="badge"
              style={{ 
                background: ESTADO_COLORS[relatedTask.estado] || '#gray',
                color: 'white',
                fontSize: 11,
                padding: '2px 8px'
              }}
            >
              {relatedTask.estado}
            </span>
          </div>
          
          <div 
            onClick={handleTaskClick}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--primary)',
              cursor: 'pointer',
              marginBottom: 4,
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            {relatedTask.titulo}
          </div>
          
          {dependency.note && (
            <div style={{ 
              fontSize: 13, 
              color: 'var(--text-secondary)',
              marginTop: 6,
              fontStyle: 'italic'
            }}>
              {dependency.note}
            </div>
          )}
        </div>
        
        {canEdit && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              variant="ghost"
              onClick={() => onEdit(dependency)}
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDelete(dependency)}
              style={{ padding: '4px 8px', fontSize: 12, color: 'var(--error)' }}
            >
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}



