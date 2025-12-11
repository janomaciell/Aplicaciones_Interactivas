import DependencyItem from './DependencyItem.jsx'
import Button from './Button.jsx'

const TIPO_LABELS = {
  DEPENDS_ON: 'Depende de',
  BLOCKED_BY: 'Bloqueada por',
  DUPLICATED_WITH: 'Duplicada con'
}

export default function DependencyGroup({ 
  type, 
  dependencies, 
  isOutgoing,
  onAdd,
  onEdit,
  onDelete,
  canEdit = true,
  loading = false
}) {
  const tipoLabel = TIPO_LABELS[type] || type
  
  if (loading) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 12 
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{tipoLabel}</h3>
        </div>
        <div className="skeleton" style={{ height: 60, borderRadius: 8 }}></div>
      </div>
    )
  }
  
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12 
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
          {tipoLabel} 
          {dependencies.length > 0 && (
            <span style={{ 
              marginLeft: 8, 
              fontSize: 14, 
              fontWeight: 400, 
              color: 'var(--text-muted)' 
            }}>
              ({dependencies.length})
            </span>
          )}
        </h3>
        {canEdit && onAdd && (
          <Button
            variant="ghost"
            onClick={() => onAdd(type)}
            style={{ padding: '6px 12px', fontSize: 13 }}
          >
            + Agregar
          </Button>
        )}
      </div>
      
      {dependencies.length === 0 ? (
        <div style={{
          padding: 24,
          textAlign: 'center',
          background: 'var(--bg-tertiary)',
          borderRadius: 8,
          color: 'var(--text-muted)',
          fontSize: 14
        }}>
          No hay dependencias de este tipo
          {canEdit && onAdd && (
            <div style={{ marginTop: 8 }}>
              <Button
                variant="ghost"
                onClick={() => onAdd(type)}
                style={{ fontSize: 13 }}
              >
                Agregar una dependencia
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {dependencies.map((dep) => (
            <DependencyItem
              key={dep.id}
              dependency={dep}
              isOutgoing={isOutgoing}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}



