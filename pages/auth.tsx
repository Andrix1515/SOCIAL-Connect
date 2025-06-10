import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const session = useSession()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error
      
      if (data.user) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: `${window.location.origin}/interests-quiz`
        }
      })

      if (error) throw error
      
      if (data.user) {
        if (data.user.identities && data.user.identities.length === 0) {
          setError('Este correo ya está registrado. Por favor, inicia sesión.')
          setIsLogin(true)
        } else {
          setShowConfirmation(true)
        }
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1f1f3a]/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-[#e94560]/20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">¡Registro Exitoso!</h2>
          <div className="space-y-4 text-gray-300">
            <p>Te hemos enviado un correo de confirmación a:</p>
            <p className="font-medium text-[#e94560]">{formData.email}</p>
            <p>Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.</p>
            <div className="mt-6 p-4 bg-[#16213e] rounded-lg">
              <p className="text-sm">
                <span className="font-medium text-[#e94560]">Nota:</span> Si no encuentras el correo, revisa tu carpeta de spam.
              </p>
            </div>
            <button
              onClick={() => setIsLogin(true)}
              className="mt-6 text-[#e94560] hover:text-[#ff6b6b] font-medium"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={handleBackToHome}
            className="inline-flex items-center text-[#e94560] hover:text-[#ff6b6b] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-white">Volver al inicio</span>
          </button>
          
          <div className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
            <h1 className="text-4xl sm:text-5xl font-bold mb-2">WooMeet!</h1>
          </div>
          <p className="text-gray-300">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta y comienza a conectar'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1f1f3a]/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-[#e94560]/20">
          {/* Toggle Buttons */}
          <div className="flex bg-[#16213e] rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-[#e94560] text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-[#e94560] text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Full Name (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#16213e] border border-[#e94560]/30 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all text-white placeholder-gray-400"
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#16213e] border border-[#e94560]/30 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all text-white placeholder-gray-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-[#16213e] border border-[#e94560]/30 rounded-lg focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all text-white placeholder-gray-400"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-1">
                  Mínimo 6 caracteres
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white py-3 px-4 rounded-lg font-medium hover:from-[#ff6b6b] hover:to-[#e94560] focus:ring-2 focus:ring-[#e94560] focus:ring-offset-2 focus:ring-offset-[#1f1f3a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </div>
              ) : (
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-300">
            {isLogin ? (
              <p>
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-[#e94560] hover:text-[#ff6b6b] font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes cuenta?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-[#e94560] hover:text-[#ff6b6b] font-medium"
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}