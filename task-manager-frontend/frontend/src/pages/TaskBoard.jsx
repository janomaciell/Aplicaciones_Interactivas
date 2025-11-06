import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'

const ESTADOS = ['pendiente', 'en_curso', 'finalizada', 'cancelada']

export default function TaskBoard() {
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return; // evita doble fetch con StrictMode
    fetched.current = true
    ;(async () => {
      try {
        const resEquipos = await api.get('/equipos')
        const arrEquipos = resEquipos?.data?.data?.equipos || []
        setEquipos(arrEquipos)
        const firstId = arrEquipos[0]?.id
        if (firstId) {
          setEquipoId(firstId)
          const resT = await api.get(`/tareas/${firstId}`)
          setTareas(resT?.data?.rows || resT?.data?.data?.tareas || [])
        } else {
          setTareas([])
        }
      } catch (e) {
        setError('No pudimos cargar las tareas')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const onChangeEquipo = async (id) => {
    setEquipoId(id)
    if (!id) { setTareas([]); return }
    setLoading(true)
    try {
      const resT = await api.get(`/tareas/${id}`)
      setTareas(resT?.data?.rows || resT?.data?.data?.tareas || [])
    } catch (_e) {
      setError('No pudimos cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const porEstado = useMemo(() => {
    const map = Object.fromEntries(ESTADOS.map((e) => [e, []]))
    tareas.forEach((t) => { (map[t.estado] || map.pendiente).push(t) })
    return map
  }, [tareas])

  const move = async (tarea, toEstado) => {
    const prev = tareas
    setTareas((arr) => arr.map((t) => t.id === tarea.id ? { ...t, estado: toEstado } : t))
    try {
      if (!tarea.equipoId) throw new Error('equipoId faltante')
      await api.put(`/tareas/${tarea.equipoId}/${tarea.id}`, { estado: toEstado })
    } catch (e) {
      setTareas(prev)
    }
  }

  if (loading) return <div className="page-loading">Cargando...</div>
  if (error) return <div className="page-error">{error}</div>

  return (
    <div className="board">
      <div className="column" style={{ gridColumn: '1 / -1' }}>
        <div className="row gap">
          <select className="field-input" value={equipoId} onChange={(e) => onChangeEquipo(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">Elegí un equipo…</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      {ESTADOS.map((estado) => (
        <div key={estado} className="column">
          <div className="column-head">
            <div className="column-title">{tituloEstado(estado)}</div>
            <Button variant="secondary" onClick={() => {}} disabled={!equipoId}>+</Button>
          </div>
          <div className="cards">
            {(porEstado[estado] || []).map((t) => (
              <Card key={t.id} title={t.titulo} actions={<EstadoActions tarea={t} onMove={move} />}>
                <div className="meta">{t.prioridad || 'normal'} · {t.asignadoA?.nombre || 'Sin asignar'}</div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EstadoActions({ tarea, onMove }) {
  return (
    <div className="row gap">
      {ESTADOS.filter((e) => e !== tarea.estado).map((e) => (
        <button key={e} className="chip" onClick={() => onMove(tarea, e)}>{tituloEstado(e)}</button>
      ))}
      <a className="chip ghost" href={`/tareas/${tarea.id}`}>Abrir</a>
    </div>
  )
}

function tituloEstado(e) {
  switch (e) {
    case 'pendiente': return 'Pendiente'
    case 'en_curso': return 'En curso'
    case 'en_progreso': return 'En curso' // Compatibilidad
    case 'finalizada': return 'Finalizada'
    case 'cancelada': return 'Cancelada'
    default: return e
  }
}

