import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import TaskDependenciesPanel from '../components/TaskDependenciesPanel.jsx'
import Input from '../components/Input.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'

export default function Dependencies() {
  const navigate = useNavigate()
  const { error: showError } = useNotifications()
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [tareas, setTareas] = useState([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const resEquipos = await api.get('/equipos')
        const equiposData = resEquipos?.data?.data?.equipos || []
        setEquipos(equiposData)
        if (equiposData.length > 0) {
          setEquipoId(equiposData[0].id)
        }
      } catch (err) {
        console.error('Error cargando equipos para dependencias:', err)
        showError('Error', 'No pudimos cargar tus equipos')
        setEquipos([])
      }
    })()
  }, [showError])

  useEffect(() => {
    if (!equipoId) {
      setTareas([])
      setSelectedTaskId('')
      setLoading(false)
      return
    }

    const cargarTareas = async () => {
      setLoading(true)
      try {
        const resTareas = await api.get(`/tareas/${equipoId}`)
        const tareasData = resTareas?.data?.data?.tareas || resTareas?.data?.rows || []
        setTareas(tareasData)
        if (!selectedTaskId && tareasData.length > 0) {
          setSelectedTaskId(tareasData[0].id)
        }
      } catch (err) {
        console.error('Error cargando tareas para dependencias:', err)
        showError('Error', 'No pudimos cargar las tareas del equipo seleccionado')
        setTareas([])
        setSelectedTaskId('')
      } finally {
        setLoading(false)
      }
    }

    cargarTareas()
  }, [equipoId, selectedTaskId, showError])

  const tareasFiltradas = useMemo(() => {
    if (!filtroTexto) return tareas
    const term = filtroTexto.toLowerCase()
    return tareas.filter((t) => (t.titulo || '').toLowerCase().includes(term))
  }, [tareas, filtroTexto])

  const tareaSeleccionada = useMemo(
    () => tareas.find((t) => t.id === selectedTaskId) || null,
    [tareas, selectedTaskId]
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-title">Dependencias</div>
          <p className="page-description">
            Gestiona relaciones entre tareas (bloqueos, dependencias y duplicados)
          </p>
        </div>
        <Button
          className="btn-success"
          onClick={() => navigate(`/tareas/nueva${equipoId ? `?equipo=${equipoId}` : ''}`)}
        >
          Nueva tarea
        </Button>
      </div>

      <div className="details-grid">
        <Card title="Seleccioná una tarea">
          <div className="stack" style={{ gap: 12 }}>
            <div>
              <div className="field-label">Equipo</div>
              <select
                className="field-input"
                value={equipoId}
                onChange={(e) => {
                  setEquipoId(e.target.value)
                  setSelectedTaskId('')
                }}
              >
                <option value="">Seleccionar equipo...</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Buscar tarea"
              placeholder="Filtrar por título"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              disabled={!equipoId || loading}
            />

            <div>
              <div className="field-label">Tarea</div>
              <select
                className="field-input"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={!equipoId || loading || tareasFiltradas.length === 0}
              >
                <option value="">Seleccionar tarea...</option>
                {tareasFiltradas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} ({t.estado || 'sin estado'})
                  </option>
                ))}
              </select>
              {!equipoId && (
                <div className="field-hint">Elegí un equipo para ver sus tareas</div>
              )}
              {equipoId && tareasFiltradas.length === 0 && !loading && (
                <div className="field-hint">
                  Este equipo no tiene tareas o no coinciden con el filtro
                </div>
              )}
            </div>
          </div>
        </Card>

        <TaskDependenciesPanel
          tarea={tareaSeleccionada}
          equipoId={equipoId}
          canEdit={Boolean(tareaSeleccionada)}
          showPlaceholderWhenMissing
        />
      </div>
    </div>
  )
}

