import { useState, useEffect } from 'react'
import api from '../api/client.js'

export function useTaskDependencies(tareaId, equipoId) {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!tareaId || !equipoId) {
      setResumen(null)
      return
    }
    
    const cargarResumen = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/tareas/${equipoId}/${tareaId}/dependencias/resumen`)
        setResumen(res.data?.data?.resumen || null)
      } catch (err) {
        setResumen(null)
      } finally {
        setLoading(false)
      }
    }
    
    cargarResumen()
  }, [tareaId, equipoId])
  
  return { resumen, loading }
}



