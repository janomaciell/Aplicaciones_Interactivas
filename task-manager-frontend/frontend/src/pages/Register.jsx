import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres'
    }
    if (!email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El email no es válido'
    }
    if (!password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setErrors({})
    setLoading(true)
    try {
      await register({ nombre, email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'No pudimos registrarte, intentá de nuevo' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-title">Crear cuenta</h1>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input 
            label="Nombre" 
            value={nombre} 
            onChange={(e) => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors({ ...errors, nombre: '' })
            }}
            error={errors.nombre}
            required 
            autoComplete="name"
          />
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            error={errors.email}
            required 
            autoComplete="email"
          />
          <div className="field">
            <div className="field-label">Contraseña</div>
            <div className="password-input-wrapper">
              <input 
                className={`field-input${errors.password ? ' has-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: '' })
                }}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          <Input 
            label="Confirmar contraseña" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
            }}
            error={errors.confirmPassword}
            required 
            autoComplete="new-password"
          />
          {errors.general && <div className="field-error" style={{ marginTop: 8 }}>{errors.general}</div>}
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Creando...' : 'Crear cuenta'}
          </Button>
        </form>
        <div className="auth-alt">¿Ya tenés cuenta? <Link to="/login">Ingresá</Link></div>
      </div>
    </div>
  )
}


