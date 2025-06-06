import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { getCurrentProfile, supabase, Profile } from '../lib/supabaseClient'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { MessageCircle, ArrowLeft, Search, Circle, Clock } from 'lucide-react'

interface Conversation {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  last_message: string | null
  last_message_time: string | null
  unread_count: number
  is_online: boolean
}

export default function ConversationsPage() {
  const router = useRouter()
  const user = useUser()
  const supabase = useSupabaseClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadConversations()
      setupRealtimeSubscription()
    } else {
      router.push('/auth')
    }
  }, [user])

  const loadConversations = async () => {
    try {
      if (!user) return

      // Obtener todas las conversaciones del usuario actual
      const { data: conversationsData, error } = await supabase.rpc('get_user_conversations', {
        current_user_id: user.id
      })
      console.log('RPC get_user_conversations data:', conversationsData, 'error:', error)

      if (error) {
        console.error('Error con RPC, usando consulta alternativa:', error)
        // Consulta alternativa si la función RPC no existe
        await loadConversationsAlternative(user.id)
      } else {
        setConversations(conversationsData || [])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversationsAlternative = async (userId: string) => {
    try {
      // Obtener mensajes únicos por usuario
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id, sender_id, receiver_id, content, created_at, read,
          sender:profiles!messages_sender_id_fkey(id, email, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, email, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      console.log('Alternative query messagesData:', messagesData, 'error:', messagesError)

      if (messagesError) throw messagesError

      // Procesar mensajes para crear lista de conversaciones
      const conversationsMap = new Map<string, Conversation>()

      messagesData?.forEach((message: any) => {
        const otherUser = message.sender_id === userId ? message.receiver : message.sender
        const otherUserId = otherUser.id

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            id: otherUserId,
            email: otherUser.email,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: 0,
            is_online: false // Por ahora false, se puede implementar presencia después
          })
        }

        // Contar mensajes no leídos
        if (message.sender_id !== userId && !message.read) {
          const conversation = conversationsMap.get(otherUserId)!
          conversation.unread_count++
        }
      })

      setConversations(Array.from(conversationsMap.values()))
    } catch (error) {
      console.error('Error in alternative query:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Recargar conversaciones cuando hay nuevos mensajes
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 168) { // 7 días
      return date.toLocaleDateString('es-ES', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#e94560]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* Header */}
      <header className="bg-[#1f1f3a]/90 backdrop-blur-sm shadow-lg border-b border-[#e94560]/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 hover:bg-[#e94560]/10 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#e94560]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#e94560] to-[#ff6b6b] bg-clip-text text-transparent">
                  Conversaciones
                </h1>
                <p className="text-sm text-gray-300">
                  {conversations.length} conversaciones activas
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Búsqueda */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#1f1f3a]/60 backdrop-blur-sm border border-[#e94560]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Lista de Conversaciones */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[#1f1f3a]/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-[#e94560]/20 max-w-md mx-auto">
              <MessageCircle className="h-16 w-16 text-[#e94560] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'No se encontraron conversaciones' : '¡Aún no tienes conversaciones!'}
              </h3>
              <p className="text-gray-300 mb-4">
                {searchTerm 
                  ? 'Intenta con otro término de búsqueda'
                  : 'Ve al dashboard y comienza a chatear con otros usuarios'
                }
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white px-6 py-3 rounded-xl font-medium hover:from-[#ff6b6b] hover:to-[#e94560] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => router.push(`/chat?userId=${conversation.id}`)}
                className="bg-[#1f1f3a]/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#e94560]/20 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:bg-[#1f1f3a]/80"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-white">
                        {conversation.full_name ? conversation.full_name[0].toUpperCase() : conversation.email[0].toUpperCase()}
                      </span>
                    </div>
                    {conversation.is_online && (
                      <Circle className="absolute -bottom-1 -right-1 h-4 w-4 fill-[#4ade80] text-[#4ade80]" />
                    )}
                  </div>

                  {/* Información de la Conversación */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {conversation.full_name || 'Usuario'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.last_message_time && (
                          <span className="text-sm text-gray-300">
                            {formatLastMessageTime(conversation.last_message_time)}
                          </span>
                        )}
                        {conversation.unread_count > 0 && (
                          <div className="bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-300 truncate flex-1">
                        {conversation.last_message || 'Nueva conversación'}
                      </p>
                      {conversation.is_online && (
                        <span className="text-xs text-[#4ade80] font-medium">En línea</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}