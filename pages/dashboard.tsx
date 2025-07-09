import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getAllUsers, getUserInterests, supabase, Profile } from '../lib/supabaseClient'
import { MessageCircle, Heart, LogOut, User, Sparkles, Filter, Search, Users, Mail, Star, MessageSquare } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Interest {
  id: number;
  name: string;
  category: string;
  created_at: string;
}

interface UserInterest {
  user_id: string;
  interest_id: number;
  interest: {
    id: number;
    name: string;
    category: string;
  };
}

interface UserWithInterests {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  career: string | null;
  description: string | null;
  created_at: string;
  interests_count: number;
  interest_names: string[];
  interest_categories: string[];
  compatibility_score: number;
  shared_interests: Interest[];
  isTopMatch?: boolean;
}

interface InterestCategory {
  name: string
  count: number
}

import { GetServerSideProps } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    }
  }

  // Intentar obtener el perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return {
    props: {
      initialSession: session,
      user: session.user,
      profile: profile || null,
    },
  }
}

export default function ImprovedDashboard({ initialSession, user, profile }: { 
  initialSession: any, 
  user: any,
  profile: any 
}) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any | null>(user || null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(profile || null)
  const [users, setUsers] = useState<UserWithInterests[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithInterests[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'compatibility' | 'recent' | 'name'>('compatibility')
  const [categories, setCategories] = useState<InterestCategory[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth')
      } else if (session && session.user) {
        setCurrentUser(session.user)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      if (!currentUser) {
        console.error('No hay usuario actual')
        return
      }

      // Verificar si el usuario tiene intereses
      const userInterests = await getUserInterests(currentUser.id)

      // Verificación adicional directa a la base de datos
      const { data: directCheck, error: directError } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', currentUser.id)

      // Solo redirigir si realmente estamos seguros de que no hay intereses
      if ((!userInterests || userInterests.length === 0) && (!directCheck || directCheck.length === 0)) {
        router.push('/interests-quiz')
        return
      }

      // Cargar usuarios con sistema de compatibilidad
      try {
        await loadUsersWithCompatibility(currentUser.id)
      } catch (usersError) {
        console.error('Error loading users with compatibility')
      }

      // Cargar categorías de intereses
      try {
        await loadInterestCategories()
      } catch (categoriesError) {
        console.error('Error loading interest categories')
      }

      // Cargar mensajes no leídos
      try {
        const { count, error: messagesError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', currentUser.id)
          .eq('read', false)

        if (messagesError) throw messagesError
        setUnreadMessages(count || 0)
      } catch (messagesError) {
        console.error('Error loading unread messages')
      }

    } catch (error) {
      console.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterAndSortUsers()
  }, [users, searchTerm, selectedCategory, sortBy])

  const loadUsersWithCompatibility = async (currentUserId: string) => {
    try {
      // Obtener todos los usuarios
      const allUsers = await getAllUsers();

      if (!allUsers) {
        setUsers([]);
        return;
      }

      // Obtener matches existentes ordenados por compatibilidad
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, compatibility_score')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .order('compatibility_score', { ascending: false });

      if (matchesError) {
        throw matchesError;
      }

      // Obtener los intereses del usuario actual
      const currentUserData = allUsers.find(u => u.id === currentUserId);
      if (!currentUserData) {
        setUsers([]);
        return;
      }

      const currentUserInterests = currentUserData.interests || [];

      // Filtrar usuarios y añadir puntuación de compatibilidad e intereses
      const filteredUsers = allUsers
        .filter(u => u.id !== currentUserId)
        .map((user) => {
          // Buscar si existe un match
          const match = matches?.find(m => 
            (m.user1_id === currentUserId && m.user2_id === user.id) ||
            (m.user2_id === currentUserId && m.user1_id === user.id)
          );

          // Obtener los intereses del usuario
          const userInterests = user.interests || [];

          // Calcular intereses compartidos
          const sharedInterests = userInterests.filter(interest =>
            currentUserInterests.some(cui => cui.id === interest.id)
          );

          const userWithInterests: UserWithInterests = {
            ...user,
            compatibility_score: match?.compatibility_score || 0,
            shared_interests: sharedInterests,
            interest_names: user.interest_names || [],
            interest_categories: user.interest_categories || [],
            interests_count: userInterests.length
          };

          return userWithInterests;
        })
        .sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

      // Encontrar el usuario con la puntuación más alta
      const maxCompatibilityScore = Math.max(...filteredUsers.map(u => u.compatibility_score || 0));
      
      // Marcar como top match solo si tiene la puntuación más alta y es >= 70
      const usersWithTopMatch = filteredUsers.map((user, index) => ({
        ...user,
        isTopMatch: user.compatibility_score === maxCompatibilityScore && user.compatibility_score >= 70 && index === 0
      }));

      setUsers(usersWithTopMatch);
    } catch (error) {
      console.error('Error loading users with compatibility');
      setUsers([]);
    }
  };

  const loadInterestCategories = async () => {
    try {
      const { data: interestsData } = await supabase
        .from('interests')
        .select('category')

      if (interestsData) {
        const categoryCount = interestsData.reduce((acc: Record<string, number>, interest) => {
          acc[interest.category] = (acc[interest.category] || 0) + 1
          return acc
        }, {})

        const categoryList = Object.entries(categoryCount).map(([name, count]) => ({
          name,
          count: count as number
        }))

        setCategories(categoryList)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const filterAndSortUsers = () => {
    if (!users) {
      setFilteredUsers([])
      return
    }
    let filtered = users.filter(user => {
      // Filtro por búsqueda
      const matchesSearch = searchTerm === '' || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.interest_names.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        )

      // Filtro por categoría
      const matchesCategory = selectedCategory === 'all' ||
        user.interest_categories.includes(selectedCategory)

      return matchesSearch && matchesCategory
    })

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'compatibility':
          return (b.compatibility_score || 0) - (a.compatibility_score || 0)
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
          return (a.full_name || a.email).localeCompare(b.full_name || b.email)
        default:
          return 0
      }
    })

    setFilteredUsers(filtered)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleStartChat = (userId: string, userName: string) => {
    router.push(`/chat?userId=${userId}`)
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getCompatibilityText = (score: number) => {
    if (score >= 70) return 'Muy compatible'
    if (score >= 40) return 'Compatible'
    return 'Algo compatible'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#464758] via-[#233561] to-[#7289da] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7289da]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] via-[#2c2f33] to-[#23272a]">
      {/* Header */}
      <header className="bg-[#464758]/80 backdrop-blur-sm shadow-lg border-b border-[#7289da]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-full p-2 mr-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7289da] to-[#6cf0c8] bg-clip-text text-transparent">
                WooMeet!
                </h1>
                <p className="text-sm text-gray-300">
                  ¡Hola {currentProfile && currentProfile.full_name ? currentProfile.full_name : 'Usuario'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/forums')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#7289da] bg-[#7289da]/10 rounded-lg hover:bg-[#7289da]/20 transition-colors group"
              >
                <MessageSquare className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                Foros
              </button>
              <button
                onClick={() => router.push('/edit_profile')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-lg hover:from-[#d64156] hover:to-[#482e74] transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Editar Perfil
              </button>
              <button
                onClick={() => router.push('/conversations')}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-[#e5d2d3] bg-[#ceb2a4]/50 rounded-lg hover:bg-[#7289da]/20 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Mensajes
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#7289da] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/interests-quiz')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#6cf0c8] bg-[#6cf0c8]/10 rounded-lg hover:bg-[#6cf0c8]/20 transition-colors"
              >
                <Heart className="h-4 w-4 mr-2" />
                Mis Intereses
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filtros y Búsqueda */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-[#7289da]/20 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o intereses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#233561] text-white border border-[#6cf0c8]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Categoría */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#233561] text-white border border-[#6cf0c8]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Ordenamiento */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'compatibility' | 'recent' | 'name')}
                className="w-full px-4 py-3 bg-[#233561] text-white border border-[#6cf0c8]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent"
              >
                <option value="compatibility">Más compatible</option>
                <option value="recent">Más reciente</option>
                <option value="name">Por nombre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#7289da]/20">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#7289da] mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
                <p className="text-sm text-gray-300">Usuarios disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#7289da]/20">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-[#6cf0c8] mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {filteredUsers.filter(user => user.compatibility_score >= 70).length}
                </p>
                <p className="text-sm text-gray-300">Muy compatibles</p>
              </div>
            </div>
          </div>
          <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#7289da]/20">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-[#7289da] mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{unreadMessages}</p>
                <p className="text-sm text-gray-300">Mensajes sin leer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Descubre personas increíbles
          </h2>
          <p className="text-lg text-gray-300">
            {filteredUsers.length === users.length 
              ? `Conecta con ${users.length} personas que comparten tus intereses`
              : `Mostrando ${filteredUsers.length} de ${users.length} usuarios`
            }
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-[#7289da]/20 max-w-md mx-auto">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? '¡No se encontraron usuarios!' 
                  : '¡Aún no hay usuarios!'
                }
              </h3>
              <p className="text-gray-300">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Sé de los primeros en unirte a nuestra comunidad. Comparte el enlace con tus amigos para comenzar a conectar.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredUsers.map((user) => {
              const isHighlyCompatible = user.compatibility_score && user.compatibility_score >= 70;
              
              return (
                <div 
                  key={user.id} 
                  className={`relative bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-105 ${
                    user.isTopMatch 
                      ? 'border-2 border-[#7289da] shadow-lg shadow-[#7289da]/20 hover:shadow-xl hover:shadow-[#7289da]/30 animate-pulse-slow' 
                      : isHighlyCompatible
                      ? 'border-2 border-[#6cf0c8] shadow-lg shadow-[#6cf0c8]/20 hover:shadow-xl hover:shadow-[#6cf0c8]/30'
                      : 'border border-[#7289da]/20 hover:shadow-xl'
                  }`}
                >
                  {/* Insignia de mejor match */}
                  {user.isTopMatch && (
                    <div className="absolute -top-4 -right-4 bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg transform rotate-12 animate-bounce-slow flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      ¡Mejor Match!
                    </div>
                  )}
                  
                  {/* Insignia de alta compatibilidad */}
                  {isHighlyCompatible && !user.isTopMatch && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#6cf0c8] to-[#7289da] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      ¡Match Perfecto!
                    </div>
                  )}

                  {/* Score de Compatibilidad */}
                  {user.compatibility_score !== undefined && user.compatibility_score > 0 && (
                    <div className={`flex justify-between items-center mb-4 ${user.isTopMatch ? 'bg-[#6cf0c8]/10 p-2 rounded-lg' : ''}`}>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.compatibility_score >= 70 
                          ? 'bg-[#6cf0c8]/20 text-[#6cf0c8]' 
                          : user.compatibility_score >= 40 
                          ? 'bg-[#7289da]/20 text-[#7289da]' 
                          : 'bg-gray-800/30 text-gray-300'
                      }`}>
                        {user.compatibility_score}% compatible
                      </span>
                      <span className="text-xs text-gray-400">
                        {getCompatibilityText(user.compatibility_score)}
                      </span>
                    </div>
                  )}

                  {/* User Info */}
                  <div className="text-center mb-4">
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={`Foto de ${user.full_name || 'Usuario'}`}
                          className="w-full h-full rounded-full object-cover border-4 border-gradient-to-r from-[#7289da] to-[#6cf0c8]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {user.full_name || 'Usuario'}
                    </h3>
                    {user.career && (
                      <p className="text-sm text-[#7289da] font-medium mb-2">
                        {user.career}
                      </p>
                    )}
                    {user.description && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                        {user.description}
                      </p>
                    )}
                  </div>

                  {/* Intereses Compartidos */}
                  {user.shared_interests && user.shared_interests.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-[#7289da] mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-2 text-[#7289da]" />
                        Intereses compartidos
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.shared_interests.slice(0, 3).map((interest, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#6cf0c8]/20 text-[#6cf0c8] rounded-full text-xs font-medium border border-[#6cf0c8]/30"
                          >
                            {interest.name}
                          </span>
                        ))}
                        {user.shared_interests.length > 3 && (
                          <span className="px-3 py-1 bg-[#6cf0c8]/20 text-[#6cf0c8] rounded-full text-xs font-medium">
                            +{user.shared_interests.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Todos los Intereses */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-[#7289da] mb-3 flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-[#7289da]" />
                      Todos los intereses
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {user.interest_names.slice(0, 6).map((interestName, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#7289da]/10 text-[#7289da] rounded-full text-xs font-medium"
                        >
                          {interestName}
                        </span>
                      ))}
                      {user.interest_names.length > 6 && (
                        <span className="px-3 py-1 bg-gray-800/30 text-gray-300 rounded-full text-xs font-medium">
                          +{user.interest_names.length - 6} más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartChat(user.id, user.full_name || user.email)}
                    className="w-full bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white py-3 px-4 rounded-xl font-medium hover:from-[#d64156] hover:to-[#482e74] transition-all duration-300 flex items-center justify-center group"
                  >
                    <MessageCircle className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                    Iniciar Chat
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}