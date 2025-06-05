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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Será redirigido
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-green-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4 shadow-xl">
                  <Users className="h-16 w-16 text-purple-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                SocialConnect
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Conecta con personas que comparten tus mismos intereses y construye 
              <span className="text-purple-600 font-semibold"> amistades auténticas</span> basadas en 
              <span className="text-green-600 font-semibold"> conexiones reales</span>
            </p>
            
            <button 
              onClick={handleGetStarted}
              className="group relative inline-flex items-center px-8 py-4 text-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-green-600 rounded-full hover:from-purple-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
            >
              <Sparkles className="w-6 h-6 mr-2 group-hover:animate-spin" />
              Comenzar mi aventura
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-green-600 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-purple-100 to-purple-200 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                  <Heart className="h-10 w-10 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">1. Comparte tus intereses</h3>
              <p className="text-gray-600">
                Cuéntanos qué te apasiona: deportes, música, tecnología, arte y mucho más.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-green-100 to-green-200 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                  <Users className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">2. Descubre personas afines</h3>
              <p className="text-gray-600">
                Nuestro algoritmo encuentra personas con intereses similares a los tuyos.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                  <MessageCircle className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">3. Inicia conversaciones</h3>
              <p className="text-gray-600">
                Conecta a través de chats significativos y construye amistades duraderas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            ¿Listo para conocer gente increíble?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a una comunidad donde las conexiones reales importan
          </p>
          <button 
            onClick={handleGetStarted}
            className="inline-flex items-center px-8 py-4 text-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-green-600 rounded-full hover:from-purple-700 hover:to-green-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
          >
            ¡Empezar ahora!
          </button>
        </div>
      </div>
    </div>
  )
}