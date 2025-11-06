import { useEffect, useState } from 'react'
import api from '../api/client.js'
import Card from '../components/Card.jsx'

export default function Activities() {
  const [items, setItems] = useState([])

  useEffect(() => {
    ;(async () => {
      const res = await api.get('/actividad/usuario')
      const arr = res?.data?.data?.actividades
      setItems(Array.isArray(arr) ? arr : [])
    })()
  }, [])

  return (
    <div className="page-grid">
      <Card title="Actividad">
        <div className="timeline">
          {items.map((a) => (
            <div key={a.id} className="timeline-item">
              <div className="dot" />
              <div>
                <div className="timeline-title">{a.tipo}</div>
                <div className="timeline-sub">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

