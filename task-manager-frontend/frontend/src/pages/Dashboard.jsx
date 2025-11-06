import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: '#fef3c7', textColor: '#92400e' },
  { value: 'en_curso', label: 'En curso', color: '#dbeafe', textColor: '#1e40af' },
  { value: 'finalizada', label: 'Finalizada', color: '#d1fae5', textColor: '#065f46' },
  { value: 'cancelada', label: 'Cancelada', color: '#fee2e2', textColor: '#991b1b' }
]

const PRIORIDADES = [
  { value: 'alta', label: 'Alta', color: '#fee2e2', textColor: '#991b1b' },
  { value: 'media', label: 'Media', color: '#fef3c7', textColor: '#92400e' },
  { value: 'baja', label: 'Baja', color: '#d1fae5', textColor: '#065f46' }
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [tareas, setTareas] = useState([])
  const [actividades, setActividades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    try {
      const [resEquipos, resActividades] = await Promise.all([
        api.get('/equipos'),
        api.get('/actividad/usuario?limite=10')
      ])

      const equiposData = resEquipos?.data?.data?.equipos || []
      setEquipos(equiposData)
      setActividades(resActividades?.data?.data?.actividades || [])

      // Cargar tareas de todos los equipos
      const todasLasTareas = []
      for (const equipo of equiposData) {
        try {
          const resTareas = await api.get(`/tareas/${equipo.id}?limite=100`)
          const tareasEquipo = resTareas?.data?.data?.tareas || resTareas?.data?.rows || []
          todasLasTareas.push(...tareasEquipo)
        } catch (e) {
          console.error(`Error cargando tareas del equipo ${equipo.id}:`, e)
        }
      }
      setTareas(todasLasTareas)
    } catch (e) {
      setError('No pudimos cargar los datos')
      console.error('Error cargando datos:', e)
    } finally {
      setLoading(false)
    }
  }

  const estadisticas = useMemo(() => {
    const porEstado = ESTADOS.reduce((acc, estado) => {
      acc[estado.value] = tareas.filter(t => t.estado === estado.value).length
      return acc
    }, {})

    const porPrioridad = PRIORIDADES.reduce((acc, prioridad) => {
      acc[prioridad.value] = tareas.filter(t => t.prioridad === prioridad.value).length
      return acc
    }, {})

    const tareasAsignadas = tareas.filter(t => t.asignadoA === user?.id).length
    const tareasVencidas = tareas.filter(t => {
      if (!t.fechaLimite) return false
      const fecha = new Date(t.fechaLimite)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      return fecha < hoy && t.estado !== 'finalizada' && t.estado !== 'cancelada'
    }).length

    const tareasProximas = tareas.filter(t => {
      if (!t.fechaLimite) return false
      const fecha = new Date(t.fechaLimite)
      const hoy = new Date()
      const en7Dias = new Date()
      en7Dias.setDate(hoy.getDate() + 7)
      hoy.setHours(0, 0, 0, 0)
      fecha.setHours(0, 0, 0, 0)
      return fecha >= hoy && fecha <= en7Dias && t.estado !== 'finalizada' && t.estado !== 'cancelada'
    }).length

    const total = tareas.length

    return {
      porEstado,
      porPrioridad,
      tareasAsignadas,
      tareasVencidas,
      tareasProximas,
      total
    }
  }, [tareas, user])

  const maxEstado = Math.max(...Object.values(estadisticas.porEstado), 1)
  const maxPrioridad = Math.max(...Object.values(estadisticas.porPrioridad), 1)

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) return <div className="page-loading">Cargando dashboard...</div>
  if (error) return <div className="page-error">{error}</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="row gap">
          <Button variant="secondary" onClick={() => navigate('/tareas')}>
            Ver todas las tareas
          </Button>
          <Button onClick={() => navigate('/tareas/nueva')}>
            Nueva tarea
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        <Card>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.total}</div>
            <div className="stat-label">Total de tareas</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value">{estadisticas.tareasAsignadas}</div>
            <div className="stat-label">Asignadas a mí</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444' }}>{estadisticas.tareasVencidas}</div>
            <div className="stat-label">Vencidas</div>
          </div>
        </Card>
        <Card>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f59e0b' }}>{estadisticas.tareasProximas}</div>
            <div className="stat-label">Próximas (7 días)</div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="dashboard-grid">
        <Card title="Tareas por Estado">
          <div className="chart-container">
            {ESTADOS.map((estado) => {
              const count = estadisticas.porEstado[estado.value] || 0
              const porcentaje = maxEstado > 0 ? (count / maxEstado) * 100 : 0
              return (
                <div key={estado.value} className="chart-item">
                  <div className="chart-label">
                    <span className="chart-label-text">{estado.label}</span>
                    <span className="chart-label-value">{count}</span>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: estado.color,
                        color: estado.textColor
                      }}
                    >
                      {count > 0 && <span className="chart-bar-text">{count}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Tareas por Prioridad">
          <div className="chart-container">
            {PRIORIDADES.map((prioridad) => {
              const count = estadisticas.porPrioridad[prioridad.value] || 0
              const porcentaje = maxPrioridad > 0 ? (count / maxPrioridad) * 100 : 0
              return (
                <div key={prioridad.value} className="chart-item">
                  <div className="chart-label">
                    <span className="chart-label-text">{prioridad.label}</span>
                    <span className="chart-label-value">{count}</span>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${porcentaje}%`,
                        backgroundColor: prioridad.color,
                        color: prioridad.textColor
                      }}
                    >
                      {count > 0 && <span className="chart-bar-text">{count}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Gráfico circular (donut) */}
      <Card title="Distribución por Estado">
        <div className="donut-chart">
          {ESTADOS.map((estado) => {
            const count = estadisticas.porEstado[estado.value] || 0
            const porcentaje = estadisticas.total > 0 ? (count / estadisticas.total) * 100 : 0
            return (
              <div key={estado.value} className="donut-item">
                <div 
                  className="donut-segment"
                  style={{
                    backgroundColor: estado.color,
                    width: `${porcentaje}%`,
                    minWidth: porcentaje > 0 ? '20px' : '0'
                  }}
                >
                  <div className="donut-label">
                    <div className="donut-label-name">{estado.label}</div>
                    <div className="donut-label-value">{count} ({porcentaje.toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Tareas próximas a vencer */}
      <Card title="Tareas próximas a vencer">
        {tareas.filter(t => {
          if (!t.fechaLimite) return false
          const fecha = new Date(t.fechaLimite)
          const hoy = new Date()
          const en7Dias = new Date()
          en7Dias.setDate(hoy.getDate() + 7)
          hoy.setHours(0, 0, 0, 0)
          fecha.setHours(0, 0, 0, 0)
          return fecha >= hoy && fecha <= en7Dias && t.estado !== 'finalizada' && t.estado !== 'cancelada'
        }).length === 0 ? (
          <div className="empty-state-small">No hay tareas próximas a vencer</div>
        ) : (
          <div className="list">
            {tareas
              .filter(t => {
                if (!t.fechaLimite) return false
                const fecha = new Date(t.fechaLimite)
                const hoy = new Date()
                const en7Dias = new Date()
                en7Dias.setDate(hoy.getDate() + 7)
                hoy.setHours(0, 0, 0, 0)
                fecha.setHours(0, 0, 0, 0)
                return fecha >= hoy && fecha <= en7Dias && t.estado !== 'finalizada' && t.estado !== 'cancelada'
              })
              .slice(0, 5)
              .map((t) => (
                <div 
                  key={t.id} 
                  className="list-item"
                  onClick={() => navigate(`/tareas/${t.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="list-title">{t.titulo}</div>
                    <div className="list-sub">
                      Vence: {formatearFecha(t.fechaLimite)} · 
                      <span className={`badge badge-${t.estado}`} style={{ marginLeft: 8 }}>
                        {ESTADOS.find(e => e.value === t.estado)?.label || t.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Actividad reciente */}
      <Card title="Actividad reciente">
        {actividades.length === 0 ? (
          <div className="empty-state-small">No hay actividad reciente</div>
        ) : (
          <div className="timeline">
            {actividades.slice(0, 10).map((a) => (
              <div key={a.id} className="timeline-item">
                <div className="dot" />
                <div>
                  <div className="timeline-title">{a.descripcion || a.tipo}</div>
                  <div className="timeline-sub">{formatearFecha(a.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

