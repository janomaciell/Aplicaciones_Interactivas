import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotifications } from '../context/NotificationContext.jsx'
import api from '../api/client.js'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Modal from '../components/Modal.jsx'

export default function Teams() {
  const { user } = useAuth()
  const { success, error: showError } = useNotifications()
  const [equipos, setEquipos] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Crear equipo
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [creando, setCreando] = useState(false)

  // Invitar miembro
  const [mostrarInvitar, setMostrarInvitar] = useState(false)
  const [emailUsuario, setEmailUsuario] = useState('')
  const [invitando, setInvitando] = useState(false)

  // Editar equipo
  const [editando, setEditando] = useState(false)
  const [nombreEditado, setNombreEditado] = useState('')

  useEffect(() => {
    cargarEquipos()
  }, [])

  useEffect(() => {
    if (equipoSeleccionado) {
      cargarMiembros(equipoSeleccionado.id)
      setNombreEditado(equipoSeleccionado.nombre)
    }
  }, [equipoSeleccionado])

  const cargarEquipos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/equipos')
      const arr = res?.data?.data?.equipos || []
      setEquipos(arr)
      if (arr.length > 0 && !equipoSeleccionado) {
        setEquipoSeleccionado(arr[0])
      }
    } catch (e) {
      setError('No pudimos cargar los equipos')
    } finally {
      setLoading(false)
    }
  }

  const cargarMiembros = async (equipoId) => {
    try {
      const res = await api.get(`/equipos/${equipoId}/miembros`)
      setMiembros(res?.data?.data?.miembros || [])
    } catch (e) {
      console.error('Error cargando miembros:', e)
    }
  }

  const crearEquipo = async () => {
    if (!nombreNuevo.trim()) return
    setCreando(true)
    try {
      const res = await api.post('/equipos', { nombre: nombreNuevo.trim() })
      const nuevoEquipo = res?.data?.data?.equipo
      setEquipos([nuevoEquipo, ...equipos])
      setEquipoSeleccionado(nuevoEquipo)
      setNombreNuevo('')
      setMostrarCrear(false)
      success('Equipo creado', 'El equipo se creó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
    } finally {
      setCreando(false)
    }
  }

  const actualizarEquipo = async () => {
    if (!nombreEditado.trim() || !equipoSeleccionado) return
    setEditando(true)
    try {
      const res = await api.put(`/equipos/${equipoSeleccionado.id}`, {
        nombre: nombreEditado.trim()
      })
      const equipoActualizado = res?.data?.data?.equipo
      setEquipos(equipos.map(e => e.id === equipoActualizado.id ? equipoActualizado : e))
      setEquipoSeleccionado(equipoActualizado)
      setEditando(false)
      success('Equipo actualizado', 'El equipo se actualizó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
      setEditando(false)
    }
  }

  const invitarMiembro = async () => {
    if (!emailUsuario.trim() || !equipoSeleccionado) return
    setInvitando(true)
    try {
      await api.post(`/equipos/${equipoSeleccionado.id}/miembros`, {
        email: emailUsuario.trim()
      })
      await cargarMiembros(equipoSeleccionado.id)
      setEmailUsuario('')
      setMostrarInvitar(false)
      success('Miembro invitado', 'El miembro se agregó al equipo correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al invitar miembro'
      setError(errorMsg)
      showError('Error', errorMsg)
    } finally {
      setInvitando(false)
    }
  }

  const removerMiembro = async (usuarioId) => {
    if (!equipoSeleccionado) return
    if (!confirm('¿Estás seguro de que querés remover este miembro del equipo?')) return
    
    try {
      await api.delete(`/equipos/${equipoSeleccionado.id}/miembros/${usuarioId}`)
      await cargarMiembros(equipoSeleccionado.id)
      success('Miembro removido', 'El miembro se removió del equipo correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al remover miembro'
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const eliminarEquipo = async () => {
    if (!equipoSeleccionado) return
    if (!confirm('¿Estás seguro de que querés eliminar este equipo? Esta acción no se puede deshacer.')) return
    
    try {
      await api.delete(`/equipos/${equipoSeleccionado.id}`)
      const nuevosEquipos = equipos.filter(e => e.id !== equipoSeleccionado.id)
      setEquipos(nuevosEquipos)
      setEquipoSeleccionado(nuevosEquipos.length > 0 ? nuevosEquipos[0] : null)
      success('Equipo eliminado', 'El equipo se eliminó correctamente')
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar el equipo'
      setError(errorMsg)
      showError('Error', errorMsg)
    }
  }

  const esAdmin = (membresia) => {
    return membresia?.rol === 'admin' || membresia?.usuarioId === equipoSeleccionado?.creadoPor
  }

  const puedeGestionar = equipoSeleccionado && miembros.some(m => 
    m.usuarioId === user?.id && esAdmin(m)
  )

  if (loading) {
    return <div className="page-loading">Cargando equipos...</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">Gestión de Equipos</div>
        <Button onClick={() => setMostrarCrear(true)}>Nuevo equipo</Button>
      </div>

      {error && <div className="page-error">{error}</div>}

      <div className="teams-layout">
        <Card title="Equipos">
          {equipos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No hay equipos</div>
              <div className="empty-description">Creá tu primer equipo para comenzar</div>
              <Button onClick={() => setMostrarCrear(true)}>Crear equipo</Button>
            </div>
          ) : (
            <div className="teams-list">
              {equipos.map((equipo) => (
                <div
                  key={equipo.id}
                  className={`team-item ${equipoSeleccionado?.id === equipo.id ? 'active' : ''}`}
                  onClick={() => setEquipoSeleccionado(equipo)}
                >
                  <div className="team-name">{equipo.nombre}</div>
                  <div className="team-meta">
                    {equipo.membresias?.length || 0} miembros
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {equipoSeleccionado && (
          <Card title="Detalle del equipo">
            <div className="team-detail">
              <div className="form-group">
                <Input
                  label="Nombre"
                  value={nombreEditado}
                  onChange={(e) => setNombreEditado(e.target.value)}
                  disabled={!puedeGestionar || editando}
                />
                {puedeGestionar && !editando && (
                  <Button onClick={actualizarEquipo} style={{ marginTop: 8 }}>
                    Guardar
                  </Button>
                )}
              </div>

              <div className="form-group">
                <div className="field-label">Miembros</div>
                <div className="members-list">
                  {miembros.length === 0 ? (
                    <div className="empty-state-small">No hay miembros en este equipo</div>
                  ) : (
                    miembros.map((membresia) => (
                      <div key={membresia.id} className="member-item">
                        <div className="member-info">
                          <strong>@{membresia.usuario?.nombre || membresia.usuario?.email || 'Usuario'}</strong>
                          <span className="member-role">
                            {esAdmin(membresia) ? 'Propietario' : 'Miembro'}
                          </span>
                        </div>
                        {puedeGestionar && membresia.usuarioId !== user?.id && (
                          <Button
                            variant="ghost"
                            onClick={() => removerMiembro(membresia.usuarioId)}
                            style={{ padding: '4px 8px', fontSize: '13px' }}
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {puedeGestionar && (
                <>
                  <div className="form-group">
                    <div className="field-label">Invitar miembro</div>
                    <div className="invite-control">
                      <Input
                        type="email"
                        placeholder="Email o ID de usuario"
                        value={emailUsuario}
                        onChange={(e) => setEmailUsuario(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && invitarMiembro()}
                      />
                      <Button onClick={invitarMiembro} disabled={!emailUsuario.trim() || invitando}>
                        Invitar
                      </Button>
                    </div>
                  </div>

                  <div className="form-group">
                    <Button
                      variant="ghost"
                      onClick={eliminarEquipo}
                      style={{ color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      Eliminar equipo
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modal crear equipo */}
      <Modal
        open={mostrarCrear}
        title="Nuevo equipo"
        onClose={() => {
          setMostrarCrear(false)
          setNombreNuevo('')
        }}
      >
          <Input
            label="Nombre del equipo"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Ej: Equipo de Desarrollo"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && crearEquipo()}
          />
          <div className="modal-actions">
            <Button onClick={crearEquipo} disabled={!nombreNuevo.trim() || creando}>
              {creando ? 'Creando...' : 'Crear'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setMostrarCrear(false)
                setNombreNuevo('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </Modal>
    </div>
  )
}

