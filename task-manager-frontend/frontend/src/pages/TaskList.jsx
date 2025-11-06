import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Card from '../components/Card.jsx'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' }
]

const PRIORIDADES = [
  { value: '', label: 'Todas' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
]

export default function TaskList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [tareas, setTareas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [asignadoA, setAsignadoA] = useState('')
  const [etiquetas, setEtiquetas] = useState([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  
  // Paginación
  const [pagina, setPagina] = useState(1)
  const [limite] = useState(10)
  const [ordenarPor, setOrdenarPor] = useState('fechaLimite')
  const [direccion, setDireccion] = useState('ASC')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/equipos')
        const arr = res?.data?.data?.equipos || []
        setEquipos(arr)
        if (arr.length > 0) {
          setEquipoId(arr[0].id)
        }
      } catch (e) {
        setError('No pudimos cargar los equipos')
      }
    })()
  }, [])

  useEffect(() => {
    if (!equipoId) {
      setTareas([])
      setTotal(0)
      setLoading(false)
      return
    }
    cargarTareas()
  }, [equipoId, pagina, estado, prioridad, asignadoA, fechaDesde, fechaHasta, ordenarPor, direccion, busqueda])

  const cargarTareas = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        limite: limite.toString(),
        ordenarPor,
        direccion
      })
      
      if (estado) params.append('estado', estado)
      if (prioridad) params.append('prioridad', prioridad)
      if (asignadoA) params.append('asignadoA', asignadoA)
      if (fechaDesde) params.append('fechaLimiteDesde', fechaDesde)
      if (fechaHasta) params.append('fechaLimiteHasta', fechaHasta)
      if (busqueda) params.append('busqueda', busqueda)
      if (etiquetas.length > 0) params.append('etiquetas', etiquetas.join(','))

      const res = await api.get(`/tareas/${equipoId}?${params}`)
      const data = res.data?.data || res.data
      setTareas(data.rows || data.tareas || [])
      setTotal(data.count || data.total || 0)
    } catch (e) {
      setError('No pudimos cargar las tareas')
      setTareas([])
    } finally {
      setLoading(false)
    }
  }

  const totalPaginas = Math.ceil(total / limite)

  const formatearFecha = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  const tituloEstado = (e) => {
    const estado = ESTADOS.find(s => s.value === e)
    return estado?.label || e
  }

  const tituloPrioridad = (p) => {
    const prioridad = PRIORIDADES.find(pr => pr.value === p)
    return prioridad?.label || p
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstado('')
    setPrioridad('')
    setAsignadoA('')
    setEtiquetas([])
    setFechaDesde('')
    setFechaHasta('')
    setPagina(1)
  }

  const tieneFiltros = estado || prioridad || asignadoA || fechaDesde || fechaHasta || busqueda || etiquetas.length > 0

  if (loading && tareas.length === 0) {
    return (
      <div className="page-container">
        <div className="page-loading">Cargando tareas...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Lista de Tareas</div>
        <Button onClick={() => navigate(`/tareas/nueva${equipoId ? `?equipo=${equipoId}` : ''}`)}>
          Nueva tarea
        </Button>
      </div>

      {/* Filtros superiores */}
      <div className="filters-bar">
        <div className="filter-group">
          <select 
            className="field-input" 
            value={equipoId} 
            onChange={(e) => {
              setEquipoId(e.target.value)
              setPagina(1)
            }}
            style={{ minWidth: 200 }}
          >
            <option value="">Seleccionar equipo</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <Input
            type="search"
            placeholder="Buscar en título y descripción..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
            style={{ minWidth: 250 }}
          />
        </div>

        <div className="filter-group">
          <select 
            className="field-input" 
            value={estado} 
            onChange={(e) => {
              setEstado(e.target.value)
              setPagina(1)
            }}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            className="field-input" 
            value={prioridad} 
            onChange={(e) => {
              setPrioridad(e.target.value)
              setPagina(1)
            }}
          >
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            className="field-input" 
            value={ordenarPor} 
            onChange={(e) => setOrdenarPor(e.target.value)}
          >
            <option value="fechaLimite">Ordenar por fecha límite</option>
            <option value="prioridad">Ordenar por prioridad</option>
            <option value="createdAt">Ordenar por creación</option>
          </select>
        </div>

        {tieneFiltros && (
          <Button variant="ghost" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && <div className="page-error">{error}</div>}

      {/* Tabla de tareas */}
      <Card>
        {tareas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No hay tareas</div>
            <div className="empty-description">
              {equipoId 
                ? 'No se encontraron tareas con los filtros seleccionados'
                : 'Seleccioná un equipo para ver sus tareas'}
            </div>
            {equipoId && (
              <Button onClick={() => navigate(`/tareas/nueva?equipo=${equipoId}`)}>
                Crear tarea
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Vence</th>
                  <th>Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tareas.map((tarea, idx) => (
                  <tr key={tarea.id}>
                    <td>{(pagina - 1) * limite + idx + 1}</td>
                    <td>
                      <div className="task-title" onClick={() => navigate(`/tareas/${tarea.id}`)}>
                        {tarea.titulo}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${tarea.estado}`}>
                        {tituloEstado(tarea.estado)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${tarea.prioridad || 'media'}`}>
                        {tituloPrioridad(tarea.prioridad || 'media')}
                      </span>
                    </td>
                    <td>{formatearFecha(tarea.fechaLimite)}</td>
                    <td>
                      {tarea.asignado ? `@${tarea.asignado.nombre || tarea.asignado.email}` : '—'}
                    </td>
                    <td>
                      <div className="row gap">
                        <Button 
                          variant="ghost" 
                          onClick={() => navigate(`/tareas/${tarea.id}`)}
                          style={{ padding: '4px 8px', fontSize: '13px' }}
                        >
                          Ver
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="pagination">
                <Button 
                  variant="ghost" 
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  ◀ Anterior
                </Button>
                <div className="pagination-info">
                  Página {pagina} de {totalPaginas} ({total} tareas)
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente ▶
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

