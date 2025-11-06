import { useEffect, useState } from 'react'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'

export default function Labels() {
  const [etiquetas, setEtiquetas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [equipoId, setEquipoId] = useState('')
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState('#6b7280')

  useEffect(() => {
    ;(async () => {
      const resEquipos = await api.get('/equipos')
      const arrEquipos = resEquipos?.data?.data?.equipos || []
      setEquipos(arrEquipos)
      const firstId = arrEquipos[0]?.id
      if (firstId) {
        setEquipoId(firstId)
        const resEti = await api.get(`/etiquetas/${firstId}/etiquetas`)
        const arrEti = resEti?.data?.data?.etiquetas || resEti?.data?.rows || []
        setEtiquetas(Array.isArray(arrEti) ? arrEti : [])
      } else {
        setEtiquetas([])
      }
    })()
  }, [])

  const onChangeEquipo = async (id) => {
    setEquipoId(id)
    if (!id) { setEtiquetas([]); return }
    const resEti = await api.get(`/etiquetas/${id}/etiquetas`)
    const arrEti = resEti?.data?.data?.etiquetas || resEti?.data?.rows || []
    setEtiquetas(Array.isArray(arrEti) ? arrEti : [])
  }

  const crear = async () => {
    if (!nombre.trim()) return
    if (!equipoId) return
    const res = await api.post(`/etiquetas/${equipoId}/etiquetas`, { nombre, color })
    const etiqueta = res?.data?.data?.etiqueta || res?.data
    setEtiquetas((arr) => etiqueta ? [etiqueta, ...arr] : arr)
    setNombre('')
  }

  return (
    <div className="page-grid">
      <Card title="Nueva etiqueta" actions={<Button onClick={crear} disabled={!equipoId}>Crear</Button>}>
        <div className="row gap">
          <select className="field-input" value={equipoId} onChange={(e) => onChangeEquipo(e.target.value)}>
            <option value="">Elegí un equipo…</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre}</option>
            ))}
          </select>
          <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="color-input" />
        </div>
      </Card>
      <Card title="Etiquetas">
        <div className="chips">
          {etiquetas.map((e) => (
            <span key={e.id} className="chip" style={{ backgroundColor: e.color || '#e5e7eb', color: '#111827' }}>{e.nombre}</span>
          ))}
        </div>
      </Card>
    </div>
  )
}

