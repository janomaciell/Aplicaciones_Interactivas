import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'

export default function TaskDetails() {
  const { id } = useParams()
  const [tarea, setTarea] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [historial, setHistorial] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [t, c, h] = await Promise.all([
          api.get(`/tareas/${id}`),
          api.get(`/tareas/${id}/comentarios`),
          api.get(`/tareas/${id}/historial`),
        ])
        setTarea(t.data)
        setComentarios(c.data.rows || [])
        setHistorial(h.data.rows || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return
    const res = await api.post(`/tareas/${id}/comentarios`, { contenido: nuevoComentario })
    setComentarios((prev) => [res.data, ...prev])
    setNuevoComentario('')
  }

  if (loading) return <div className="page-loading">Cargando...</div>
  if (!tarea) return <div className="page-error">No se encontró la tarea</div>

  return (
    <div className="details-grid">
      <Card title={tarea.titulo}>
        <div className="stack">
          <div className="meta">Estado: {tarea.estado}</div>
          <div className="meta">Asignado: {tarea.asignadoA?.nombre || '—'}</div>
          <div className="meta">Prioridad: {tarea.prioridad || 'normal'}</div>
          <p>{tarea.descripcion}</p>
        </div>
      </Card>

      <Card title="Comentarios" actions={<Button onClick={agregarComentario}>Agregar</Button>}>
        <Input placeholder="Escribe un comentario" value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} />
        <div className="list" style={{ marginTop: 12 }}>
          {comentarios.map((c) => (
            <div key={c.id} className="list-item">
              <div className="list-title">{c.autor?.nombre || 'Alguien'}</div>
              <div className="list-sub">{c.contenido}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Historial">
        <div className="timeline">
          {historial.map((h) => (
            <div key={h.id} className="timeline-item">
              <div className="dot" />
              <div>
                <div className="timeline-title">{h.estadoAnterior} → {h.estadoNuevo}</div>
                <div className="timeline-sub">{new Date(h.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}


