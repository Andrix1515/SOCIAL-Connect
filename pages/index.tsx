import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser } from '../lib/supabaseClient'
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin,
  ChevronDown,
  Star,
  CheckCircle2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Send
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    suggestion: ''
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // Si ya está logueado, redirigir al dashboard
      if (currentUser) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    router.push('/auth')
  }

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmitSuggestion = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Aquí puedes implementar la lógica para enviar la sugerencia
    console.log('Sugerencia enviada:', formData)
    // Resetear el formulario
    setFormData({
      name: '',
      email: '',
      suggestion: ''
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#e94560]"></div>
      </div>
    )
  }

  if (user) {
    return null // Será redirigido
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-[#1f1f3a] rounded-full p-4 shadow-xl border border-[#e94560]/20">
                  <Users className="h-16 w-16 text-[#e94560]" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-gray-100 mb-6">
              <span className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
                SocialConnect
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Conecta con personas que comparten tus mismos intereses y construye 
              <span className="text-[#e94560] font-semibold"> amistades auténticas</span> basadas en 
              <span className="text-[#ff6b6b] font-semibold"> conexiones reales</span>
            </p>
            
            <button 
              onClick={handleGetStarted}
              className="group relative inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full hover:from-[#ff6b6b] hover:to-[#e94560] transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:animate-spin" />
              Comenzar mi aventura
              <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-[#1f1f3a]/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-12">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#e94560] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-[#1f1f3a] to-[#16213e] rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center border border-[#e94560]/20">
                  <Heart className="h-10 w-10 text-[#e94560]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. Comparte tus intereses</h3>
              <p className="text-gray-300">
                Cuéntanos qué te apasiona: deportes, música, tecnología, arte y mucho más.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#ff6b6b] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-[#1f1f3a] to-[#16213e] rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center border border-[#ff6b6b]/20">
                  <Users className="h-10 w-10 text-[#ff6b6b]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. Descubre personas afines</h3>
              <p className="text-gray-300">
                Nuestro algoritmo encuentra personas con intereses similares a los tuyos.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#4ade80] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-[#1f1f3a] to-[#16213e] rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center border border-[#4ade80]/20">
                  <MessageCircle className="h-10 w-10 text-[#4ade80]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. Inicia conversaciones</h3>
              <p className="text-gray-300">
                Conecta a través de chats significativos y construye amistades duraderas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para conocer gente increíble?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8">
            Únete a una comunidad donde las conexiones reales importan
          </p>
          <button 
            onClick={handleGetStarted}
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full hover:from-[#ff6b6b] hover:to-[#e94560] transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            ¡Empezar ahora!
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-[#1a1a2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Guía de Convivencia
          </h2>
          {[
            {
              question: "¿Cómo puedo mantener una comunicación respetuosa?",
              answer: "Mantén un tono cordial y respetuoso en todas tus interacciones. Evita lenguaje ofensivo, discriminatorio o agresivo. Recuerda que detrás de cada perfil hay una persona real."
            },
            {
              question: "¿Qué debo hacer si experimento comportamiento inapropiado?",
              answer: "Si encuentras comportamiento inapropiado, puedes: 1) Utilizar el botón de reporte en el perfil del usuario, 2) Bloquear al usuario para evitar futuras interacciones, 3) Contactar a nuestro equipo de soporte con evidencias del comportamiento."
            },
            {
              question: "¿Cómo puedo hacer que mis conexiones sean más significativas?",
              answer: "Completa tu perfil con información relevante sobre tus intereses, sé honesto en tus interacciones, participa activamente en las conversaciones y grupos de tu interés, y toma la iniciativa para organizar actividades o encuentros virtuales."
            },
            {
              question: "¿Cuáles son las normas básicas de la comunidad?",
              answer: "1) Respeto mutuo en toda interacción, 2) No compartir información personal sensible, 3) No realizar spam ni publicidad no autorizada, 4) No compartir contenido inapropiado o ilegal, 5) Ser honesto en la información de tu perfil."
            },
            {
              question: "¿Cómo puedo proteger mi privacidad?",
              answer: "Configura tu perfil de privacidad según tus preferencias, no compartas información personal sensible en chats públicos, utiliza el chat privado para conversaciones más personales, y reporta cualquier solicitud sospechosa de información personal."
            }
          ].map((faq, index) => (
            <div key={index} className="mb-6">
              <div className="flex items-center justify-between bg-[#1f1f3a] p-4 rounded-lg cursor-pointer">
                <h3 className="text-white font-semibold">{faq.question}</h3>
                <ChevronDown className="w-5 h-5 text-[#e94560]" />
              </div>
              <div className="bg-[#1f1f3a]/60 p-4 rounded-lg mt-2">
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sugerencias Section */}
      <div className="py-16 bg-[#1f1f3a]/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Envíanos tus Sugerencias
          </h2>
          <form onSubmit={handleSubmitSuggestion} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-white font-medium mb-2">Nombre</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] text-white border border-[#e94560]/20 focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] outline-none"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] text-white border border-[#e94560]/20 focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] outline-none"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="suggestion" className="block text-white font-medium mb-2">Sugerencia</label>
              <textarea
                id="suggestion"
                name="suggestion"
                value={formData.suggestion}
                onChange={handleFormChange}
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] text-white border border-[#e94560]/20 focus:border-[#e94560] focus:ring-1 focus:ring-[#e94560] outline-none resize-none"
                placeholder="Escribe tu sugerencia aquí..."
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full hover:from-[#ff6b6b] hover:to-[#e94560] transform hover:scale-105 transition-all duration-300"
              >
                <Send className="w-5 h-5 mr-2" />
                Enviar Sugerencia
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-white mb-4">¿Tienes alguna pregunta específica?</p>
            <a 
              href="mailto:andtoms15@gmail.com"
              className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-[#1a1a2e] rounded-full hover:bg-[#e94560] transition-colors duration-300"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contáctanos
            </a>
          </div>
        </div>
      </div>

      {/* Contacto Section */}
      <div className="py-16 bg-[#1f1f3a]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Contacta con Nosotros
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="bg-[#1a1a2e] p-4 rounded-full inline-block mb-4">
                  <Mail className="w-6 h-6 text-[#e94560]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Email</h3>
                <p className="text-gray-300">contacto@socialconnect.com</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="bg-[#1a1a2e] p-4 rounded-full inline-block mb-4">
                  <Phone className="w-6 h-6 text-[#e94560]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Teléfono</h3>
                <p className="text-gray-300">+51 999 999 999</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="bg-[#1a1a2e] p-4 rounded-full inline-block mb-4">
                  <MapPin className="w-6 h-6 text-[#e94560]" />
                </div>
                <h3 className="text-white font-semibold mb-2">Ubicación</h3>
                <p className="text-gray-300">Huancayo, Perú</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a2e] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">SocialConnect</h3>
              <p className="text-gray-400">Conectando personas, creando historias.</p>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Enlaces</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Inicio</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Sobre Nosotros</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Términos de Uso</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Política de Privacidad</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#e94560]">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Síguenos</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#e94560]">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#e94560]">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#e94560]">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-[#e94560]">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-400">
              © {new Date().getFullYear()} SocialConnect. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}