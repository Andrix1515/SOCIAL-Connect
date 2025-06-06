import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getAllInterests, saveUserInterests } from '../lib/supabaseClient'
import { Check, ArrowRight, Heart } from 'lucide-react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

interface Interest {
  id: number
  name: string
  category: string
  created_at: string
}

interface User {
  id: string
  // add other user properties if needed
}

export default function InterestsQuiz() {
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const session = useSession()
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      if (!session?.user) {
        router.push('/auth')
        return
      }
      setUser(session.user as User)

      console.log('🔍 Cargando intereses disponibles...');
      const { data, error } = await supabaseClient
        .from('interests')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      
      console.log('📋 Intereses encontrados:', {
        total: data?.length || 0,
        categories: [...new Set(data?.map(i => i.category) || [])],
        interests: data?.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category
        }))
      });

      setInterests(data as Interest[]);

      // Cargar intereses ya seleccionados por el usuario
      const { data: userInterests, error: userInterestsError } = await supabaseClient
        .from('user_interests')
        .select('interest_id')
        .eq('user_id', session.user.id);

      if (!userInterestsError && userInterests) {
        console.log('👤 Intereses del usuario:', {
          userId: session.user.id,
          selectedCount: userInterests.length,
          selectedIds: userInterests.map(ui => ui.interest_id)
        });
        setSelectedInterests(userInterests.map(ui => ui.interest_id));
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInterestToggle = (interestId: number) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleSaveInterests = async () => {
    if (selectedInterests.length < 3) {
      alert('Por favor selecciona al menos 3 intereses')
      return
    }

    if (!user) {
      alert('Usuario no autenticado. Por favor inicia sesión de nuevo.')
      router.push('/auth')
      return
    }

    setSaving(true)
    try {
      await saveUserInterests(supabaseClient, user.id, selectedInterests)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving interests:', error)
      alert('Error al guardar intereses. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] to-[#23272a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7289da]"></div>
      </div>
    )
  }

  // Agrupar intereses por categoría
  const interestsByCategory = interests.reduce((acc: Record<string, Interest[]>, interest: Interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = []
    }
    acc[interest.category].push(interest)
    return acc
  }, {} as Record<string, Interest[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] to-[#23272a] py-6 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-full p-3 shadow-lg">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            ¡Cuéntanos sobre ti!
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-2">
            Selecciona tus intereses para encontrar personas afines
          </p>
          <p className="text-sm text-[#7289da] font-medium">
            Selecciona al menos 3 intereses ({selectedInterests.length} seleccionados)
          </p>
        </div>

        {/* Interests Grid */}
        <div className="space-y-6">
          {Object.entries(interestsByCategory).map(([category, categoryInterests]: [string, Interest[]]) => (
            <div key={category} className="bg-[#2c2f33]/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-[#7289da]/20">
              <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
                <span className="bg-gradient-to-r from-[#7289da] to-[#6cf0c8] bg-clip-text text-transparent">
                  {category}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {categoryInterests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`relative p-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedInterests.includes(interest.id)
                        ? 'bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white shadow-lg transform scale-[1.02]'
                        : 'bg-[#23272a] hover:bg-[#2c2f33] text-gray-300 border border-[#7289da]/20 hover:border-[#7289da]/50'
                    }`}
                  >
                    {interest.name}
                    {selectedInterests.includes(interest.id) && (
                      <div className="absolute -top-1 -right-1 bg-[#23272a] rounded-full p-1 shadow-lg border border-[#7289da]/20">
                        <Check className="h-3 w-3 text-[#6cf0c8]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="text-center mt-8">
          <button
            onClick={handleSaveInterests}
            disabled={selectedInterests.length < 3 || saving}
            className={`inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full transition-all duration-300 ${
              selectedInterests.length >= 3 && !saving
                ? 'bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white hover:from-[#6cf0c8] hover:to-[#7289da] transform hover:scale-105 shadow-xl'
                : 'bg-[#23272a] text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
          
          {selectedInterests.length > 0 && selectedInterests.length < 3 && (
            <p className="text-[#6cf0c8] mt-2 text-sm">
              Selecciona {3 - selectedInterests.length} intereses más para continuar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}