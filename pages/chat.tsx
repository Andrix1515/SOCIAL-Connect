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
  edited: boolean
  deleted: boolean
  reactions: { [key: string]: string[] } // emoji: userId[]
  image_url?: string
}

interface ChatUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  user_interests: Array<{
    interests: { name: string; category: string }
  }>
  last_seen: string
  is_typing: boolean
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
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingMessage, setEditingMessage] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const MESSAGES_PER_PAGE = 20

  useEffect(() => {
    console.log('Debug user in useEffect:', user)
    if (userId && user) {
      loadChatData()
      setupRealtimeSubscription()
      updateUserPresence()
    }
  }, [userId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Actualizar presencia del usuario cada 30 segundos
  useEffect(() => {
    if (!user) return

    const interval = setInterval(updateUserPresence, 30000)
    return () => clearInterval(interval)
  }, [user])

  const updateUserPresence = async () => {
    if (!user) return

    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }

  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;
    
    try {
      const from = page * MESSAGES_PER_PAGE;
      const to = from + MESSAGES_PER_PAGE - 1;
      
      const { data: newMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (newMessages) {
        if (newMessages.length < MESSAGES_PER_PAGE) {
          setHasMore(false);
        }
        setMessages(prev => [...prev, ...newMessages.reverse()]);
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  const loadInitialMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (messagesError) throw messagesError;
      
      if (messagesData) {
        setMessages(messagesData.reverse());
        setHasMore(messagesData.length === MESSAGES_PER_PAGE);
      }

      // Marcar mensajes como leídos
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', userId)
        .eq('receiver_id', user?.id)
        .eq('read', false);

    } catch (error) {
      console.error('Error loading initial messages:', error);
    }
  };

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

      // Cargar información del usuario del chat
      const { data: chatUserData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, last_seen')
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
            user_interests: [],
            is_typing: false,
            last_seen: chatUserData.last_seen || new Date().toISOString()
          })
        } else {
          const fixedUserInterests = userInterestsData.map((ui: any) => ({
            ...ui,
            interests: Array.isArray(ui.interests) ? ui.interests[0] : ui.interests
          }))
          setChatUser({
            ...chatUserData,
            user_interests: fixedUserInterests,
            is_typing: false,
            last_seen: chatUserData.last_seen || new Date().toISOString()
          })
        }

        // Verificar si el usuario está en línea (últimos 2 minutos)
        const lastSeen = new Date(chatUserData.last_seen)
        const now = new Date()
        setIsOnline(now.getTime() - lastSeen.getTime() < 120000)
      } else {
        setChatUser(null)
      }

      await loadInitialMessages();
    } catch (error) {
      console.error('Error loading chat data:', error)
      console.log('Debug userId:', userId)
      console.log('Debug chatUserData:', chatUser)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Canal para mensajes
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUser?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser?.id}))`
        },
        async (payload) => {
          console.log('Realtime payload received:', payload)
          
          // Para inserciones de nuevos mensajes
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message
            setMessages(prev => {
              // Evitar duplicados
              if (prev.some(m => m.id === newMessage.id)) return prev
              return [...prev, newMessage]
            })
            
            // Marcar como leído si es mensaje recibido
            if (newMessage.sender_id === userId) {
              await markAsRead(newMessage.id)
            }
          } 
          // Para actualizaciones (ediciones, eliminaciones, reacciones)
          else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ))

            // Si el mensaje fue marcado como leído y es nuestro
            if (updatedMessage.read && updatedMessage.sender_id === currentUser?.id) {
              console.log('Mensaje marcado como leído:', updatedMessage)
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to messages channel')
        }
      })

    // Canal para estado de escritura y presencia
    const presenceChannel = supabase
      .channel('presence')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id.eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            const lastSeen = new Date(payload.new.last_seen)
            const now = new Date()
            setIsOnline(now.getTime() - lastSeen.getTime() < 120000)
            
            if (chatUser) {
              setChatUser(prev => prev ? {
                ...prev,
                is_typing: payload.new.is_typing || false,
                last_seen: payload.new.last_seen
              } : null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(presenceChannel)
    }
  }

  const handleTyping = () => {
    if (!user) return

    // Actualizar estado de escritura
    supabase
      .from('profiles')
      .update({ is_typing: true })
      .eq('id', user.id)
      .then(() => {
        // Limpiar timeout anterior si existe
        if (typingTimeout) {
          clearTimeout(typingTimeout)
        }

        // Establecer nuevo timeout para desactivar el estado de escritura
        const timeout = setTimeout(async () => {
          await supabase
            .from('profiles')
            .update({ is_typing: false })
            .eq('id', user.id)
        }, 2000)

        setTypingTimeout(timeout)
      })
  }

  const markAsRead = async (messageId: number) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select()

      if (error) {
        console.error('Error marking message as read:', error)
      }
    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
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

  const handleReaction = async (messageId: number, emoji: string) => {
    if (!user || !messages) return

    try {
      const message = messages.find(m => m.id === messageId)
      if (!message) return

      const reactions = { ...message.reactions }
      const userReactions = reactions[emoji] || []

      if (userReactions.includes(user.id)) {
        // Remover reacción
        reactions[emoji] = userReactions.filter(id => id !== user.id)
        if (reactions[emoji].length === 0) {
          delete reactions[emoji]
        }
      } else {
        // Añadir reacción
        reactions[emoji] = [...userReactions, user.id]
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId)
        .select()

      if (error) throw error

      // Actualizar el mensaje localmente
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions }
          : msg
      ))
    } catch (error) {
      console.error('Error updating reaction:', error)
      alert('Error al actualizar la reacción')
    }
  }

  const handleEditMessage = async (messageId: number) => {
    try {
      const message = messages.find(m => m.id === messageId)
      if (!message || message.sender_id !== user?.id) {
        console.log('No se puede editar el mensaje:', { message, userId: user?.id })
        return
      }

      console.log('Editando mensaje:', messageId)
      setEditingMessage(messageId)
      setEditContent(message.content)
      setShowEmojiPicker(false)
    } catch (error) {
      console.error('Error al iniciar edición:', error)
    }
  }

  const saveEditMessage = async () => {
    try {
      if (!editingMessage || !editContent.trim() || !user) {
        console.log('No se puede guardar la edición:', { editingMessage, content: editContent })
        return
      }

      console.log('Guardando edición del mensaje:', editingMessage)
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          content: editContent.trim(),
          edited: true 
        })
        .eq('id', editingMessage)
        .eq('sender_id', user.id) // Asegurar que solo el remitente puede editar

      if (error) {
        console.error('Error en la base de datos:', error)
        throw error
      }

      console.log('Mensaje editado exitosamente:', data)
      
      // Actualizar el mensaje localmente
      setMessages(prev => prev.map(msg => 
        msg.id === editingMessage 
          ? { ...msg, content: editContent.trim(), edited: true }
          : msg
      ))

      setEditingMessage(null)
      setEditContent('')
    } catch (error) {
      console.error('Error al guardar la edición:', error)
      alert('Error al editar el mensaje')
    }
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      if (!user) return

      const message = messages.find(m => m.id === messageId)
      if (!message || message.sender_id !== user.id) {
        console.log('No se puede eliminar el mensaje:', { message, userId: user.id })
        return
      }

      console.log('Eliminando mensaje:', messageId)
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          deleted: true,
          content: 'Este mensaje fue eliminado'
        })
        .eq('id', messageId)
        .eq('sender_id', user.id) // Asegurar que solo el remitente puede eliminar

      if (error) {
        console.error('Error en la base de datos:', error)
        throw error
      }

      console.log('Mensaje eliminado exitosamente:', data)
      
      // Actualizar el mensaje localmente
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, deleted: true, content: 'Este mensaje fue eliminado' }
          : msg
      ))

      // Si estábamos editando este mensaje, cancelar la edición
      if (editingMessage === messageId) {
        setEditingMessage(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error al eliminar el mensaje:', error)
      alert('Error al eliminar el mensaje')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validar el tipo y tamaño del archivo
    const fileType = file.type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(fileType)) {
      alert('Solo se permiten imágenes en formato JPG, PNG, GIF o WEBP')
      return
    }

    if (file.size > maxSize) {
      alert('La imagen no debe superar los 5MB')
      return
    }

    try {
      setSending(true)
      
      // Crear un nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('Subiendo imagen:', { fileName, fileType, size: file.size })
      
      // Subir imagen a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('chat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: fileType,
          upsert: false
        })

      if (uploadError) {
        console.error('Error al subir la imagen:', uploadError)
        throw uploadError
      }

      console.log('Imagen subida exitosamente:', uploadData)

      // Obtener URL pública de la imagen
      const { data } = supabase
        .storage
        .from('chat-images')
        .getPublicUrl(filePath)

      if (!data.publicUrl) {
        console.error('Error: No se pudo obtener la URL pública')
        throw new Error('No se pudo obtener la URL pública de la imagen')
      }

      console.log('URL pública obtenida:', data.publicUrl)

      // Enviar mensaje con la imagen
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content: '📷 Imagen',
          image_url: data.publicUrl
        })
        .select()
        .single()

      if (messageError) {
        console.error('Error al crear mensaje con imagen:', messageError)
        throw messageError
      }

      console.log('Mensaje con imagen enviado:', messageData)

      // Actualizar la lista de mensajes localmente
      if (messageData) {
        setMessages(prev => [...prev, messageData])
      }

    } catch (error) {
      console.error('Error detallado al subir la imagen:', error)
      alert('Error al subir la imagen. Por favor, intenta de nuevo.')
    } finally {
      setSending(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Función para cargar el estado actual de los mensajes
  const refreshMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      if (messagesData) {
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Error refreshing messages:', error)
    }
  }

  // Añadir un efecto para refrescar los mensajes periódicamente
  useEffect(() => {
    if (!user || !userId) return

    // Refrescar mensajes cada 30 segundos
    const interval = setInterval(refreshMessages, 30000)

    return () => clearInterval(interval)
  }, [user, userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] via-[#2c2f33] to-[#23272a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7289da]"></div>
      </div>
    )
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] via-[#2c2f33] to-[#23272a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Usuario no encontrado</h2>
          <button
            onClick={() => router.push('/conversations')}
            className="bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] via-[#2c2f33] to-[#23272a] flex flex-col h-screen">
      {/* Header del Chat - Fijo */}
      <header className="bg-[#464758]/80 backdrop-blur-sm shadow-lg border-b border-[#7289da]/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/conversations')}
                className="mr-4 p-2 hover:bg-[#7289da]/20 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#7289da]" />
              </button>
              
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {chatUser.full_name ? chatUser.full_name[0].toUpperCase() : chatUser.email[0].toUpperCase()}
                    </span>
                  </div>
                  {isOnline && (
                    <Circle className="absolute -bottom-1 -right-1 h-4 w-4 fill-[#6cf0c8] text-[#6cf0c8]" />
                  )}
                </div>
                
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-white">
                    {chatUser.full_name || 'Usuario'}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
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
              <button className="p-2 hover:bg-[#7289da]/20 rounded-full transition-colors">
                <Phone className="h-5 w-5 text-[#7289da]" />
              </button>
              <button className="p-2 hover:bg-[#7289da]/20 rounded-full transition-colors">
                <Video className="h-5 w-5 text-[#7289da]" />
              </button>
              <button className="p-2 hover:bg-[#7289da]/20 rounded-full transition-colors">
                <MoreVertical className="h-5 w-5 text-[#7289da]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Intereses - Parte del área scrolleable */}
      <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 144px)' }}>
        {chatUser.user_interests.length > 0 && (
          <div className="bg-[#464758]/60 border-b border-[#7289da]/20 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center space-x-2 text-sm">
                <Heart className="h-4 w-4 text-[#7289da]" />
                <span className="text-[#7289da] font-medium">Intereses:</span>
                <div className="flex flex-wrap gap-2">
                  {chatUser.user_interests.slice(0, 5).map((userInterest, index) => (
                    <span key={index} className="text-[#6cf0c8]">
                      {userInterest.interests.name}
                      {index < Math.min(chatUser.user_interests.length, 5) - 1 && ','}
                    </span>
                  ))}
                  {chatUser.user_interests.length > 5 && (
                    <span className="text-[#6cf0c8]">+{chatUser.user_interests.length - 5} más</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Área de Mensajes */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {hasMore && (
            <div className="text-center mb-4">
              <button
                onClick={loadMoreMessages}
                className="bg-[#464758]/60 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-[#7289da] hover:bg-[#464758]/80 transition-colors"
              >
                Cargar mensajes anteriores
              </button>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-[#464758]/60 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-[#7289da] to-[#6cf0c8] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  ¡Inicia la conversación!
                </h3>
                <p className="text-gray-300">
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
                        <span className="bg-[#464758]/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-300">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${
                        isFromCurrentUser
                          ? 'bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white'
                          : 'bg-[#464758]/80 backdrop-blur-sm text-white shadow-sm'
                      } rounded-2xl relative group`}>
                        
                        {/* Menú de opciones para mensajes propios */}
                        {isFromCurrentUser && !message.deleted && (
                          <div className="absolute -right-2 top-2">
                            <button
                              onClick={() => setSelectedEmoji(selectedEmoji === message.id ? null : message.id)}
                              className="p-1 hover:bg-[#7289da]/20 rounded-lg transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-white/60" />
                            </button>
                            
                            {selectedEmoji === message.id && (
                              <div className="absolute right-0 top-8 bg-[#464758]/90 backdrop-blur-sm rounded-lg p-2 shadow-lg min-w-[120px] z-50">
                                {editingMessage === message.id ? (
                                  <button
                                    onClick={saveEditMessage}
                                    className="w-full p-2 hover:bg-[#7289da]/20 rounded-lg transition-colors flex items-center space-x-2 text-left"
                                  >
                                    <span>✅</span>
                                    <span className="text-sm text-gray-300">Guardar</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEditMessage(message.id)}
                                    className="w-full p-2 hover:bg-[#7289da]/20 rounded-lg transition-colors flex items-center space-x-2 text-left"
                                  >
                                    <span>✏️</span>
                                    <span className="text-sm text-gray-300">Editar</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                                      handleDeleteMessage(message.id);
                                      setSelectedEmoji(null);
                                    }
                                  }}
                                  className="w-full p-2 hover:bg-red-500/20 rounded-lg transition-colors flex items-center space-x-2 text-left"
                                >
                                  <span>🗑️</span>
                                  <span className="text-sm text-gray-300">Eliminar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="px-4 py-2">
                          {/* Contenido del mensaje */}
                          {message.deleted ? (
                            <p className="text-sm italic opacity-60">Mensaje eliminado</p>
                          ) : editingMessage === message.id ? (
                            <div className="flex flex-col space-y-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-2 py-1 rounded bg-[#464758]/60 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-[#7289da]/50"
                                placeholder="Editar mensaje..."
                                rows={2}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    saveEditMessage();
                                  }
                                }}
                              />
                              <div className="flex justify-between items-center text-xs">
                                <span className="opacity-75">Presiona Enter para guardar</span>
                                <button
                                  onClick={() => {
                                    setEditingMessage(null);
                                    setEditContent('');
                                  }}
                                  className="hover:underline"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm break-words whitespace-pre-wrap">
                                {message.content}
                              </p>
                              {message.image_url && (
                                <img
                                  src={message.image_url}
                                  alt="Imagen compartida"
                                  className="mt-2 rounded-lg max-w-full"
                                  loading="lazy"
                                />
                              )}
                            </>
                          )}

                          {/* Reacciones */}
                          {!message.deleted && Object.keys(message.reactions || {}).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(message.reactions).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(message.id, emoji)}
                                  className={`px-2 py-0.5 rounded-full text-xs ${
                                    users.includes(user?.id || '')
                                      ? 'bg-[#7289da]/20'
                                      : 'bg-[#464758]/60'
                                  } hover:bg-[#7289da]/30 transition-colors`}
                                >
                                  {emoji} {users.length}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Metadata del mensaje */}
                          <div className={`text-xs mt-1 flex items-center space-x-2 ${
                            isFromCurrentUser ? 'text-white/80' : 'text-gray-300'
                          }`}>
                            <span>{formatTime(message.created_at)}</span>
                            {message.edited && <span className="opacity-60">(editado)</span>}
                            {isFromCurrentUser && (
                              <span>
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
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

      {/* Input de Mensaje - Fijo */}
      <div className="bg-[#464758]/80 backdrop-blur-sm border-t border-[#7289da]/20 sticky bottom-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex space-x-4">
            <div className="flex-1 flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={editingMessage ? editContent : newMessage}
                  onChange={(e) => {
                    if (editingMessage) {
                      setEditContent(e.target.value)
                    } else {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }
                  }}
                  placeholder={editingMessage ? "Editar mensaje..." : "Escribe un mensaje..."}
                  className="w-full px-4 py-3 bg-[#2c2f33] text-white border border-[#7289da]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent placeholder-gray-400"
                  disabled={sending}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (editingMessage) {
                        saveEditMessage()
                      } else {
                        sendMessage(e)
                      }
                    }
                  }}
                />
              </div>

              {/* Botones de acciones */}
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="p-3 rounded-2xl bg-[#2c2f33] hover:bg-[#7289da]/20 transition-colors text-[#7289da]"
                >
                  📷
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-3 rounded-2xl bg-[#2c2f33] hover:bg-[#7289da]/20 transition-colors text-[#7289da]"
                >
                  😊
                </button>
              </div>
            </div>

            <button
              onClick={editingMessage ? saveEditMessage : sendMessage}
              disabled={(!newMessage.trim() && !editingMessage) || sending}
              className="bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white p-3 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : editingMessage ? (
                '✓'
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Selector de emojis */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-4 bg-[#464758] rounded-xl shadow-lg p-4 w-96 border border-[#7289da]/20 backdrop-blur-sm">
              <div className="mb-4 text-white/80 text-sm font-medium px-2 flex justify-between items-center">
                <span>Stickers y Emojis</span>
                <button 
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-white/60 hover:text-white/80"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { emoji: '❤️', text: 'Te quiero' },
                  { emoji: '👍', text: '¡Me gusta!' },
                  { emoji: '😂', text: 'jajaja' },
                  { emoji: '😍', text: '¡Me encanta!' },
                  { emoji: '🎉', text: '¡Felicidades!' },
                  { emoji: '👏', text: '¡Bravo!' },
                  { emoji: '🔥', text: '¡Fuego!' },
                  { emoji: '🌟', text: '¡Increíble!' },
                  { emoji: '🤗', text: '¡Un abrazo!' }
                ].map(({ emoji, text }) => (
                  <button
                    key={emoji}
                    onClick={async () => {
                      setShowEmojiPicker(false)
                      // Enviar directamente como mensaje
                      if (!sending && currentUser && userId) {
                        setSending(true)
                        try {
                          await supabase
                            .from('messages')
                            .insert({
                              sender_id: currentUser.id,
                              receiver_id: userId,
                              content: `${emoji} ${text}`
                            })
                        } catch (error) {
                          console.error('Error sending sticker:', error)
                        } finally {
                          setSending(false)
                        }
                      }
                    }}
                    className="flex flex-col items-center p-4 hover:bg-[#7289da]/20 rounded-xl transition-all transform hover:scale-105 group"
                  >
                    <div className="bg-gradient-to-br from-[#7289da]/10 to-[#6cf0c8]/10 rounded-xl p-4 mb-2">
                      <span className="text-5xl block transform transition-transform group-hover:scale-110" style={{ filter: 'drop-shadow(0 0 8px rgba(108, 240, 200, 0.3))' }}>
                        {emoji}
                      </span>
                    </div>
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors text-center">
                      {text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}