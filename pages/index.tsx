import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getCurrentUser } from '../lib/supabaseClient'
import { Users, Heart, MessageCircle, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

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
    </div>
  )
}