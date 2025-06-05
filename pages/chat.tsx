import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { getCurrentProfile, Profile } from '../lib/supabaseClient'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Send, ArrowLeft, Circle, Phone, Video, MoreVertical, Heart } from 'lucide-react'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

interface ChatUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  user_interests: Array<{
    interests: { name: string; category: string }
  }>
}

export default function ChatPage() {
  const router = useRouter()
  let { userId } = router.query
  if (Array.isArray(userId)) {
    userId = userId[0]
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const user = useUser()
  const supabase = useSupabaseClient()
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [chatUser, setChatUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    console.log('Debug user in useEffect:', user)
    if (userId && user) {
      loadChatData()
      setupRealtimeSubscription()
    }
  }, [userId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatData = async () => {
    try {
      console.log('Debug userId type:', typeof userId)
      console.log('Debug userId value:', userId)

      if (!user) {
        router.push('/auth')
        return
      }
      setCurrentUser(user)

      // Fetch profile using supabase client from context
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError
      setCurrentProfile(profileData)

      // Cargar información del usuario del chat (sin user_interests para debug)
      const { data: chatUserData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (chatUserData) {
        // Fetch user_interests separately
        const { data: userInterestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select('interests (name, category)')
          .eq('profile_id', userId)

        if (interestsError) {
          console.error('Error fetching user interests:', interestsError)
          setChatUser({
            ...chatUserData,
            user_interests: []
          })
        } else {
          // Fix type mismatch: transform interests array to single object if needed
          const fixedUserInterests = userInterestsData.map((ui: any) => ({
            ...ui,
            interests: Array.isArray(ui.interests) ? ui.interests[0] : ui.interests
          }))
          setChatUser({
            ...chatUserData,
            user_interests: fixedUserInterests
          })
        }
      } else {
        setChatUser(null)
      }

      // Cargar mensajes
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])

      // Marcar mensajes como leídos
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user.id)
        .eq('read', false)

    } catch (error) {
      console.error('Error loading chat data:', error)
      console.log('Debug userId:', userId)
      console.log('Debug chatUserData:', chatUser)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser?.id}))`
        },
        (payload) => {
          console.log('Realtime payload received:', payload)
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message])
            
            // Marcar como leído si es mensaje recibido
            if (payload.new.sender_id === userId) {
              markAsRead(payload.new.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (messageId: number) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)
  }

  const sendMessage = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !currentUser || !userId) return

    setSending(true)
    try {
      const { error, data } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: userId,
          content: newMessage.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
        alert('Error al enviar mensaje')
      } else {
        console.log('Message sent successfully:', data)
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usuario no encontrado</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-green-50 to-blue-50 flex flex-col">
      {/* Header del Chat */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-green-400 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {chatUser.full_name ? chatUser.full_name[0].toUpperCase() : chatUser.email[0].toUpperCase()}
                    </span>
                  </div>
                  {isOnline && (
                    <Circle className="absolute -bottom-1 -right-1 h-4 w-4 fill-green-500 text-green-500" />
                  )}
                </div>
                
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {chatUser.full_name || 'Usuario'}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{isOnline ? 'En línea' : 'Desconectado'}</span>
                    {chatUser.user_interests.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{chatUser.user_interests.length} intereses</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Video className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Intereses Compartidos */}
      {chatUser.user_interests.length > 0 && (
        <div className="bg-gradient-to-r from-purple-100 to-green-100 border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-sm">
              <Heart className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-medium">Intereses:</span>
              <div className="flex flex-wrap gap-2">
                {chatUser.user_interests.slice(0, 5).map((userInterest, index) => (
                  <span key={index} className="text-purple-600">
                    {userInterest.interests.name}
                    {index < Math.min(chatUser.user_interests.length, 5) - 1 && ','}
                  </span>
                ))}
                {chatUser.user_interests.length > 5 && (
                  <span className="text-purple-600">+{chatUser.user_interests.length - 5} más</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Inicia la conversación!
                </h3>
                <p className="text-gray-600">
                  Sé el primero en enviar un mensaje a {chatUser.full_name || 'este usuario'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isFromCurrentUser = message.sender_id === currentUser?.id
                const showTimestamp = index === 0 || 
                  new Date(messages[index - 1].created_at).getTime() - new Date(message.created_at).getTime() > 300000 // 5 minutos

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="text-center mb-4">
                        <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isFromCurrentUser
                          ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white'
                          : 'bg-white/80 backdrop-blur-sm text-gray-900 shadow-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`text-xs mt-1 ${
                          isFromCurrentUser ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                          {isFromCurrentUser && (
                            <span className="ml-2">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input de Mensaje */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={sending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(e)
                  }
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-purple-600 to-green-600 text-white p-3 rounded-2xl hover:from-purple-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}