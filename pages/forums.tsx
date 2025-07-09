import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  MessageCircle,
  Heart,
  MoreHorizontal,
  User,
  Bold,
  Italic,
  Link,
  List,
  Send,
  Eye,
  Edit3
} from 'lucide-react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';

interface Community {
  id: number;
  name: string;
  description: string;
  members: number;
  joined: boolean;
  type: string;
  created_by: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: string;
  community_id: number;
  upvotes: number;
  downvotes: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  author?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  community?: {
    name: string;
  };
}

interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  author?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: Post;
}

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const RedditForumSystem = () => {
  const router = useRouter();
  const user = useUser();
  const supabase = useSupabaseClient();
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forums_activeView') || 'home';
    }
    return 'home';
  });
  const [showCommunities, setShowCommunities] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forums_showCommunities') === 'true';
    }
    return false;
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  // Optimizaciones: solo un useState para posts y comunidades, sin cache local
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('forums_posts_cache');
      return !cached;
    }
    return true;
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      // Limpiar todos los borradores al cerrar sesión
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('forums_')) {
            localStorage.removeItem(key);
          }
        });
      }
      return;
    }
    loadData();
  }, [user]);

  // Guardar estado en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forums_activeView', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forums_showCommunities', showCommunities.toString());
    }
  }, [showCommunities]);

  // Cerrar menú móvil cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  // Carga eficiente: un solo select para posts, comunidades y perfiles relacionados
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar comunidades y membresías en una sola consulta
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select('*')
        .order('members', { ascending: false });
      if (communitiesError) throw communitiesError;

      // Cargar membresías del usuario
      const { data: memberships, error: membershipsError } = await supabase
        .from('community_members')
        .select('community_id, is_active')
        .eq('user_id', user?.id);
      if (membershipsError) throw membershipsError;

      // Marcar comunidades unidas
      const communitiesWithMembership = (communitiesData || []).map(community => ({
        ...community,
        joined: memberships?.some(m => m.community_id === community.id && m.is_active) || false
      }));
      setCommunities(communitiesWithMembership);

      // Cargar posts y luego obtener autor y comunidad por separado (sin joins SQL)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          author_id,
          community_id,
          created_at,
          updated_at,
          upvotes,
          downvotes,
          comments_count,
          is_pinned
        `)
        .order('created_at', { ascending: false });
      if (postsError) throw postsError;

      // Transformar los datos para el front (fetch autor y comunidad por cada post)
      const transformedPosts: Post[] = await Promise.all((postsData || []).map(async post => {
        // Obtener información del autor
        let authorData = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', post.author_id)
            .single();
          authorData = data;
        } catch {}

        // Obtener información de la comunidad
        let communityData = null;
        try {
          const { data } = await supabase
            .from('communities')
            .select('name')
            .eq('id', post.community_id)
            .single();
          communityData = data;
        } catch {}

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author_id: post.author_id,
          community_id: post.community_id,
          created_at: post.created_at,
          updated_at: post.updated_at,
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          comments_count: post.comments_count || 0,
          is_pinned: post.is_pinned || false,
          author: authorData ? {
            id: authorData.id,
            email: authorData.email || 'Usuario',
            full_name: authorData.full_name || null,
            avatar_url: authorData.avatar_url || null
          } : undefined,
          community: communityData ? {
            name: communityData.name
          } : { name: 'Comunidad desconocida' }
        };
      }));
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: { title: string; content: string; community_id: number }) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...postData,
          author_id: user?.id,
          upvotes: 0,
          downvotes: 0,
          comments_count: 0,
          is_pinned: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Obtener información de la comunidad
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('name')
        .eq('id', postData.community_id)
        .single();

      if (communityError) throw communityError;

      // Obtener información del autor
      const { data: authorData } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', user?.id)
        .single();

      // Crear el post transformado
      const transformedPost: Post = {
        id: data.id,
        title: data.title,
        content: data.content,
        author_id: data.author_id,
        community_id: data.community_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
        comments_count: data.comments_count || 0,
        is_pinned: data.is_pinned || false,
        author: {
          id: data.author_id,
          email: authorData?.email || 'Usuario',
          full_name: authorData?.full_name || null,
          avatar_url: authorData?.avatar_url || null
        },
        community: {
          name: communityData.name
        }
      };

      setPosts(prev => [transformedPost, ...prev]);
      
      // Actualizar cache de posts
      const updatedPosts = [transformedPost, ...posts];
      localStorage.setItem('forums_posts_cache', JSON.stringify(updatedPosts));
      localStorage.setItem('forums_posts_timestamp', Date.now().toString());
      
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error al crear la publicación. Por favor, intenta de nuevo.');
    }
  };

  const handleCreateCommunity = async (communityData: { name: string; description: string }) => {
    try {
      if (!user) {
        console.error('No hay usuario autenticado');
        return;
      }

      // Primero creamos la comunidad
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert([{
          name: communityData.name,
          description: communityData.description,
          members: 1,
          type: 'public',
          created_by: user.id
        }])
        .select()
        .single();

      if (communityError) throw communityError;

      // Luego añadimos al usuario actual como miembro
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: user.id,
          is_active: true
        });

      if (memberError) throw memberError;

      setCommunities(prev => [...prev, { ...community, joined: true }]);
      
      // Actualizar cache de comunidades
      const updatedCommunities = [...communities, { ...community, joined: true }];
      localStorage.setItem('forums_communities_cache', JSON.stringify(updatedCommunities));
      localStorage.setItem('forums_communities_timestamp', Date.now().toString());
      
      setShowCreateCommunity(false);
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  // Componente para texto expandible
  const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength = 300, className = "" }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const shouldTruncate = text.length > maxLength;
    const displayText = isExpanded ? text : text.substring(0, maxLength);
    
    if (!shouldTruncate) {
      return (
        <div 
          className={`${className} max-w-none break-words [&>strong]:font-bold [&>em]:italic [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>a]:underline [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:my-2 [&>br]:block [&>br]:h-2`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
      );
    }
    
    return (
      <div className={className}>
        <div 
          className="max-w-none break-words [&>strong]:font-bold [&>em]:italic [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>a]:underline [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:my-2 [&>br]:block [&>br]:h-2"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(displayText) }}
        />
        {!isExpanded && <span className="text-gray-500">...</span>}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </button>
      </div>
    );
  };

  // Función para renderizar markdown a HTML (global)
  const renderMarkdown = (text: string) => {
    return text
      // Negrita
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Cursiva
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Enlaces - solo procesar URLs válidas
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        // Verificar si la URL es válida (no es placeholder)
        if (url && url !== 'URL_AQUI' && url !== 'url' && !url.startsWith('@') && 
            (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
          return `<a href="${url.startsWith('www.') ? 'https://' + url : url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">${text}</a>`;
        } else {
          // Si no es una URL válida, mostrar como texto normal
          return `<span class="text-gray-400">[${text}](${url})</span>`;
        }
      })
      // Listas
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Convertir líneas con <li> en <ul>
      .replace(/(<li>.*<\/li>)/, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
      // Saltos de línea
      .replace(/\n/g, '<br>');
  };

  const handleJoinCommunity = async (communityId: number) => {
    if (!user) return;

    try {
      // Primero verificamos si ya existe una membresía
      const { data: existingMembership, error: checkError } = await supabase
        .from('community_members')
        .select('*')
        .match({ community_id: communityId, user_id: user.id })
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingMembership) {
        // Si existe, actualizamos el estado
        const { error: updateError } = await supabase
          .from('community_members')
          .update({ is_active: !existingMembership.is_active })
          .match({ id: existingMembership.id });

        if (updateError) throw updateError;

        // Obtenemos el valor actual de members
        const { data: currentCommunity, error: getError } = await supabase
          .from('communities')
          .select('members')
          .eq('id', communityId)
          .single();

        if (getError) throw getError;

        // Actualizamos el contador de miembros
        const { error: countError } = await supabase
          .from('communities')
          .update({ 
            members: existingMembership.is_active ? 
              (currentCommunity?.members || 0) - 1 : 
              (currentCommunity?.members || 0) + 1
          })
          .eq('id', communityId);

        if (countError) throw countError;

        setCommunities(prev => 
          prev.map(community => 
            community.id === communityId 
              ? { 
                  ...community, 
                  joined: !existingMembership.is_active,
                  members: existingMembership.is_active ? community.members - 1 : community.members + 1
                }
              : community
          )
        );
      } else {
        // Si no existe, creamos una nueva membresía
        const { error: insertError } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: user.id,
            is_active: true
          });

        if (insertError) throw insertError;

        // Obtenemos el valor actual de members
        const { data: currentCommunity, error: getError } = await supabase
          .from('communities')
          .select('members')
          .eq('id', communityId)
          .single();

        if (getError) throw getError;

        // Actualizamos el contador de miembros
        const { error: countError } = await supabase
          .from('communities')
          .update({ members: (currentCommunity?.members || 0) + 1 })
          .eq('id', communityId);

        if (countError) throw countError;

        setCommunities(prev => 
          prev.map(community => 
            community.id === communityId 
              ? { ...community, joined: true, members: community.members + 1 }
              : community
          )
        );
      }
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando foros...</p>
        </div>
      </div>
    );
  }

  // Cambios visuales globales para foros
  // 1. Fondo principal y contenedores
  // 2. Tarjetas de post con degradado y sombra
  // 3. Botones con gradientes y acentos vivos
  // 4. Headers y textos con gradientes y colores vibrantes
  // 5. Bordes y hover más notorios

  // Barra de navegación móvil
  const MobileNav = () => (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#23272a] border-b border-[#7289da]/30 z-50">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold text-white">Foros</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreatePost(true)}
            className="px-3 py-1 bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white rounded text-sm hover:from-[#6cf0c8] hover:to-[#7289da] transition-colors"
          >
            Crear
          </button>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-[#7289da] hover:text-[#6cf0c8] transition-colors mobile-menu-button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {showMobileMenu && (
        <div className="bg-[#2c2f33] border-t border-[#7289da]/20 p-4 mobile-menu rounded-b-2xl shadow-lg">
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveView('home');
                setShowMobileMenu(false);
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                activeView === 'home' 
                  ? 'bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white' 
                  : 'text-gray-300 hover:bg-[#23272a]'
              }`}
            >
              <Home size={20} />
              <span>Inicio</span>
            </button>
            <div>
              <button
                onClick={() => setShowCommunities(!showCommunities)}
                className="w-full flex items-center justify-between p-3 rounded-lg text-gray-300 hover:bg-[#23272a] transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Users size={20} />
                  <span>Comunidades</span>
                </div>
                {showCommunities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showCommunities && (
                <div className="ml-4 mt-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowCreateCommunity(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 p-2 rounded text-sm text-[#6cf0c8] hover:bg-[#23272a] transition-colors"
                  >
                    <Plus size={16} />
                    <span>Crear comunidad</span>
                  </button>
                  {communities.filter(c => c.joined).map((community) => (
                    <div
                      key={community.id}
                      className="flex items-center justify-between p-2 rounded text-sm hover:bg-[#23272a] transition-colors"
                    >
                      <button
                        onClick={() => {
                          setActiveView(`community-${community.id}`);
                          setShowMobileMenu(false);
                        }}
                        className={`flex-1 text-left ${
                          activeView === `community-${community.id}`
                            ? 'text-white'
                            : 'text-gray-300'
                        }`}
                      >
                        {community.name}
                      </button>
                      <button
                        onClick={() => handleJoinCommunity(community.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          community.joined
                            ? 'bg-[#7289da]/30 text-[#7289da] hover:bg-[#7289da]/50'
                            : 'bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white hover:from-[#6cf0c8] hover:to-[#7289da]'
                        }`}
                      >
                        {community.joined ? 'Salir' : 'Unirse'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Botón Descubrir en móvil */}
            <button
              onClick={() => {
                setShowDiscover(true);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg mb-2 transition-colors text-[#7289da] hover:bg-[#23272a]"
            >
              <Users size={20} />
              <span>Descubrir</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Componente de la barra lateral
  const Sidebar = () => (
    <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0 p-4 border-r border-gray-700 z-40 lg:block hidden">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white mb-6">Foros</h1>
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center space-x-3 p-3 rounded-lg mb-2 transition-colors ${
            activeView === 'home' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <Home size={20} />
          <span>Inicio</span>
        </button>
        <div className="mb-2">
          <button
            onClick={() => setShowCommunities(!showCommunities)}
            className="w-full flex items-center justify-between p-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users size={20} />
              <span>Comunidades</span>
            </div>
            {showCommunities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showCommunities && (
            <div className="ml-4 mt-2 space-y-1">
              <button
                onClick={() => setShowCreateCommunity(true)}
                className="w-full flex items-center space-x-2 p-2 rounded text-sm text-gray-400 hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                <span>Crear comunidad</span>
              </button>
              {communities.filter(c => c.joined).map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between p-2 rounded text-sm hover:bg-gray-800 transition-colors"
                >
                  <button
                    onClick={() => setActiveView(`community-${community.id}`)}
                    className={`flex-1 text-left ${
                      activeView === `community-${community.id}`
                          ? 'text-white'
                          : 'text-gray-300'
                  }`}
                >
                  {community.name}
                </button>
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      community.joined
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {community.joined ? 'Salir' : 'Unirse'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Botón Descubrir */}
        <button
          onClick={() => setShowDiscover(true)}
          className="w-full flex items-center space-x-3 p-3 rounded-lg mb-2 transition-colors text-gray-300 hover:bg-gray-800"
        >
          <Users size={20} />
          <span>Descubrir</span>
        </button>
      </div>
    </div>
  );

  // Modal para descubrir comunidades
  const DiscoverCommunitiesModal = () => {
    const notJoined = communities.filter(c => !c.joined);
    if (!showDiscover) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-[#23272a] rounded-2xl p-4 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#7289da]/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#7289da] to-[#6cf0c8] bg-clip-text text-transparent">Descubrir comunidades</h2>
            <button
              onClick={() => setShowDiscover(false)}
              className="text-[#7289da] hover:text-[#6cf0c8] text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            {notJoined.length === 0 && (
              <div className="text-[#7289da] text-center py-8 font-semibold">
                Ya perteneces a todas las comunidades.
              </div>
            )}
            {notJoined.map((community) => (
              <div key={community.id} className="flex items-center bg-gradient-to-r from-[#233561] to-[#23272a] rounded-xl p-4 border border-[#7289da]/20 shadow hover:shadow-lg transition-all">
                {/* Imagen con inicial */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#7289da] to-[#6cf0c8] flex items-center justify-center text-3xl font-bold text-white mr-4 shadow-lg">
                  {community.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg">{community.name}</div>
                  <div className="text-gray-300 text-sm">{community.description}</div>
                </div>
                <button
                  onClick={() => handleJoinCommunity(community.id)}
                  className="ml-4 px-5 py-2 bg-gradient-to-r from-[#7289da] to-[#6cf0c8] text-white rounded-lg font-semibold hover:from-[#6cf0c8] hover:to-[#7289da] transition-colors shadow"
                >
                  Unirse
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Componente para crear publicaciones
  const CreatePostModal = () => {
    const [title, setTitle] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('forums_draft_title') || '';
      }
      return '';
    });
    const [content, setContent] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('forums_draft_content') || '';
      }
      return '';
    });
    const [selectedCommunity, setSelectedCommunity] = useState<number | null>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('forums_draft_community');
        return saved ? Number(saved) : null;
      }
      return null;
    });
    const [loading, setLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    if (!showCreatePost) return null;

    // Guardar borrador en localStorage
    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('forums_draft_title', title);
      }
    }, [title]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('forums_draft_content', content);
      }
    }, [content]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        if (selectedCommunity) {
          localStorage.setItem('forums_draft_community', selectedCommunity.toString());
        } else {
          localStorage.removeItem('forums_draft_community');
        }
      }
    }, [selectedCommunity]);

    const handleSubmit = async () => {
      if (!title.trim() || !content.trim() || !selectedCommunity) return;

      setLoading(true);
      try {
        await handleCreatePost({
          title: title.trim(),
          content: content.trim(),
          community_id: selectedCommunity
        });
        
        // Limpiar borrador después de publicar exitosamente
        setTitle('');
        setContent('');
        setSelectedCommunity(null);
        localStorage.removeItem('forums_draft_title');
        localStorage.removeItem('forums_draft_content');
        localStorage.removeItem('forums_draft_community');
      } catch (error) {
        console.error('Error creating post:', error);
      } finally {
        setLoading(false);
      }
    };

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**texto en negrita**';
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*texto en cursiva*';
        break;
      case 'link':
        formattedText = selectedText ? `[${selectedText}](https://ejemplo.com)` : '[texto del enlace](https://ejemplo.com)';
        break;
      case 'list':
        formattedText = selectedText ? `- ${selectedText}` : '- Elemento de la lista';
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Restaurar el foco y la selección
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + formattedText.length);
      } else {
        // Si no hay texto seleccionado, seleccionar el placeholder
        const placeholderStart = start + formattedText.indexOf('texto');
        const placeholderEnd = start + formattedText.lastIndexOf(']') + 1;
        textarea.setSelectionRange(placeholderStart, placeholderEnd);
      }
    }, 0);
  };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Crear publicación</h2>
            <button
              onClick={() => setShowCreatePost(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-6 text-gray-300">
            <User size={20} />
            <span>{user?.email}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comunidad*
            </label>
            <select
              value={selectedCommunity || ''}
              onChange={(e) => setSelectedCommunity(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar comunidad</option>
              {communities.filter(c => c.joined).map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Título* <span className="text-xs text-gray-500">({title.length}/300)</span>
              {(title || content) && (
                <span className="ml-2 text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                  Borrador guardado
                </span>
              )}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Título de tu publicación..."
            />
          </div>

          <div className="mb-6">
            <div className="bg-gray-800 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between p-3 border-b border-gray-600">
                <div className="flex items-center space-x-2">
                  {[
                    { icon: Bold, title: 'Negrita (Ctrl+B)', format: 'bold' },
                    { icon: Italic, title: 'Cursiva (Ctrl+I)', format: 'italic' },
                    { icon: Link, title: 'Enlace', format: 'link' },
                    { icon: List, title: 'Lista', format: 'list' }
                  ].map(({ icon: Icon, title, format }) => (
                    <button
                      key={title}
                      title={title}
                      onClick={() => applyFormat(format)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                  <div className="text-xs text-gray-500 ml-2">
                    Selecciona texto y haz clic en un botón, o haz clic sin seleccionar para insertar plantilla. 
                    Para enlaces, reemplaza "https://ejemplo.com" con la URL real.
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`p-2 rounded transition-colors flex items-center space-x-1 text-sm ${
                      isPreview 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
                    <span>{isPreview ? 'Editar' : 'Vista previa'}</span>
                  </button>
                </div>
              </div>

              {isPreview ? (
                <div className="p-4 min-h-32">
                  <div 
                    className="text-white max-w-none [&>strong]:font-bold [&>em]:italic [&>a]:text-blue-400 [&>a]:hover:text-blue-300 [&>a]:underline [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:my-2 [&>br]:block [&>br]:h-2"
                    dangerouslySetInnerHTML={{ 
                      __html: content ? renderMarkdown(content) : '<span class="text-gray-500">Vista previa del contenido...</span>' 
                    }}
                  />
                </div>
              ) : (
                              <div className="relative">
                <textarea
                  id="content-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={5000}
                  className="w-full bg-transparent p-4 text-white resize-none focus:outline-none min-h-32"
                  placeholder="¿Qué quieres compartir? Usa los botones de formato arriba para dar estilo a tu texto."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {content.length}/5000
                </div>
              </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCreatePost(false);
                // Limpiar borrador al cancelar
                setTitle('');
                setContent('');
                setSelectedCommunity(null);
                localStorage.removeItem('forums_draft_title');
                localStorage.removeItem('forums_draft_content');
                localStorage.removeItem('forums_draft_community');
              }}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setTitle('');
                setContent('');
                setSelectedCommunity(null);
                localStorage.removeItem('forums_draft_title');
                localStorage.removeItem('forums_draft_content');
                localStorage.removeItem('forums_draft_community');
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Limpiar
            </button>
            <button
              disabled={!title.trim() || !content.trim() || !selectedCommunity || loading}
              onClick={handleSubmit}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                title.trim() && content.trim() && selectedCommunity && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente para crear comunidades
  const CreateCommunityModal = () => {
    const [communityName, setCommunityName] = useState('');
    const [communityDescription, setCommunityDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!showCreateCommunity) return null;

    const handleSubmit = async () => {
      if (!communityName.trim()) return;

      setLoading(true);
      try {
        await handleCreateCommunity({
          name: communityName.trim(),
          description: communityDescription.trim()
        });
      } catch (error) {
        console.error('Error creating community:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-4 sm:p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Crear Comunidad</h2>
            <button
              onClick={() => setShowCreateCommunity(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre de la comunidad
              </label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="r/mi-comunidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={communityDescription}
                onChange={(e) => setCommunityDescription(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Describe tu comunidad..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowCreateCommunity(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!communityName.trim() || loading}
                onClick={handleSubmit}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  communityName.trim() && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de publicación
  const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const [showComments, setShowComments] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`forums_showComments_${post.id}`) === 'true';
      }
      return false;
    });
    const [newComment, setNewComment] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`forums_comment_draft_${post.id}`) || '';
      }
      return '';
    });
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [voteCount, setVoteCount] = useState(0);
    const [showPostMenu, setShowPostMenu] = useState(false);

    // Guardar estado en localStorage
    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`forums_showComments_${post.id}`, showComments.toString());
      }
    }, [showComments, post.id]);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`forums_comment_draft_${post.id}`, newComment);
      }
    }, [newComment, post.id]);

    useEffect(() => {
      if (showComments) {
        loadComments();
      }
    }, [showComments]);

    useEffect(() => {
      loadUserVote();
      // Inicializar el contador de votos
      setVoteCount((post.upvotes || 0) - (post.downvotes || 0));
    }, [post.id]);

    // Cerrar menú del post cuando se hace clic fuera
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('.post-menu') && !target.closest('.post-menu-trigger')) {
          setShowPostMenu(false);
        }
      };

      if (showPostMenu) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showPostMenu]);

    const loadUserVote = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setUserVote(data.vote_type === 1 ? 'up' : 'down');
        } else {
          setUserVote(null);
        }
      } catch (error) {
        console.error('Error loading user vote:', error);
      }
    };

    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Transformar los datos de los comentarios para incluir información del autor
        const transformedComments: Comment[] = await Promise.all((data || []).map(async comment => {
          const { data: authorData } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url')
            .eq('id', comment.author_id)
            .single();

          return {
            ...comment,
            author: {
              id: comment.author_id,
              email: authorData?.email || 'Usuario',
              full_name: authorData?.full_name || null,
              avatar_url: authorData?.avatar_url || null
            }
          };
        }));

        setComments(transformedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    const handleVote = async (type: 'up' | 'down') => {
      if (!user) return;

      try {
        // Primero, obtener el voto actual del usuario para este post
        const { data: existingVote, error: voteError } = await supabase
          .from('votes')
          .select('id, vote_type')
          .eq('user_id', user.id)
          .eq('post_id', post.id)
          .maybeSingle();

        if (voteError && voteError.code !== 'PGRST116') throw voteError;

        if (existingVote) {
          if ((type === 'up' && existingVote.vote_type === 1) || (type === 'down' && existingVote.vote_type === -1)) {
            // Si el usuario ya votó igual, eliminar el voto (toggle)
            const { error: deleteError } = await supabase
              .from('votes')
              .delete()
              .eq('id', existingVote.id);
            if (deleteError) throw deleteError;

            setUserVote(null);
            setVoteCount(prev => prev - (type === 'up' ? 1 : -1));

            // Actualizar contadores en la base de datos
            await supabase
              .from('posts')
              .update({
                upvotes: type === 'up' ? post.upvotes - 1 : post.upvotes,
                downvotes: type === 'down' ? post.downvotes - 1 : post.downvotes
              })
              .eq('id', post.id);
          } else {
            // Si el usuario cambia de voto (up -> down o down -> up)
            const { error: updateError } = await supabase
              .from('votes')
              .update({ vote_type: type === 'up' ? 1 : -1 })
              .eq('id', existingVote.id);
            if (updateError) throw updateError;

            setUserVote(type);

            // Calcular nuevo conteo de votos
            let newUpvotes = post.upvotes || 0;
            let newDownvotes = post.downvotes || 0;
            if (type === 'up') {
              newUpvotes = newUpvotes + 1;
              newDownvotes = newDownvotes - 1;
            } else {
              newUpvotes = newUpvotes - 1;
              newDownvotes = newDownvotes + 1;
            }
            setVoteCount(newUpvotes - newDownvotes);

            // Actualizar contadores en la base de datos
            await supabase
              .from('posts')
              .update({
                upvotes: newUpvotes,
                downvotes: newDownvotes
              })
              .eq('id', post.id);
          }
        } else {
          // Si no hay voto previo, insertar uno nuevo
          const { error: insertError } = await supabase
            .from('votes')
            .insert({
              user_id: user.id,
              post_id: post.id,
              vote_type: type === 'up' ? 1 : -1
            });
          if (insertError) throw insertError;

          setUserVote(type);
          let newUpvotes = type === 'up' ? (post.upvotes || 0) + 1 : (post.upvotes || 0);
          let newDownvotes = type === 'down' ? (post.downvotes || 0) + 1 : (post.downvotes || 0);
          setVoteCount(newUpvotes - newDownvotes);

          // Actualizar contadores en la base de datos
          await supabase
            .from('posts')
            .update({
              upvotes: newUpvotes,
              downvotes: newDownvotes
            })
            .eq('id', post.id);
        }
      } catch (error) {
        console.error('Error handling vote:', error);
      }
    };

    const handleDeletePost = async (postId: number) => {
      if (!user || post.author_id !== user.id) return;

      if (!confirm('¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.')) {
        return;
      }

      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)
          .eq('author_id', user.id);

        if (error) throw error;

        // Remover el post de la lista local
        setPosts(prev => prev.filter(p => p.id !== postId));
        setShowPostMenu(false);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error al eliminar el post. Por favor, intenta de nuevo.');
      }
    };

    const handleDeleteComment = async (commentId: number) => {
      if (!user) return;

      if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
      }

      try {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId)
          .eq('author_id', user.id);

        if (error) throw error;

        // Remover el comentario de la lista local
        setComments(prev => prev.filter(c => c.id !== commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error al eliminar el comentario. Por favor, intenta de nuevo.');
      }
    };

    const handleComment = async () => {
      if (!user || !newComment.trim()) return;

      try {
        setLoading(true);
        const { error } = await supabase
          .from('comments')
          .insert({
            post_id: post.id,
            author_id: user.id,
            content: newComment.trim()
          });

        if (error) throw error;

        // El contador se actualiza automáticamente con el trigger
        // Solo necesitamos recargar los comentarios

        setNewComment('');
        localStorage.removeItem(`forums_comment_draft_${post.id}`);
        loadComments();
      } catch (error) {
        console.error('Error posting comment:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden mb-4 relative">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-3 text-sm text-gray-400">
            <span className="font-medium text-blue-400">{post.community?.name}</span>
            <span className="hidden sm:inline">•</span>
            <span>Por {post.author?.full_name || post.author?.email}</span>
            <span className="hidden sm:inline">•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>

          <h2 className="text-white font-semibold text-lg mb-2">{post.title}</h2>
          <ExpandableText 
            text={post.content} 
            maxLength={500} 
            className="text-gray-300 mb-4"
          />

          <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleVote('up')}
                  className={`p-1 rounded transition-colors ${
                    userVote === 'up' 
                      ? 'text-orange-500' 
                      : 'text-gray-400 hover:text-orange-500'
                  }`}
                >
                  <ChevronUp size={20} />
                </button>
                <span className="text-sm font-medium text-gray-300 min-w-[2rem] text-center">
                  {voteCount}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={`p-1 rounded transition-colors ${
                    userVote === 'down' 
                      ? 'text-blue-500' 
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle size={18} />
                <span className="text-sm">{post.comments_count || 0}</span>
              </button>
            </div>

            <div className="relative post-menu-trigger" style={{ position: 'relative', zIndex: 30 }}>
              <button 
                onClick={() => setShowPostMenu(!showPostMenu)}
                className="text-gray-400 hover:text-white transition-colors p-1 post-menu-trigger"
                aria-haspopup="true"
                aria-expanded={showPostMenu}
                style={{ zIndex: 31 }}
              >
                <MoreHorizontal size={18} />
              </button>
              {showPostMenu && (
                <div
                  className="fixed inset-0 z-50 flex items-end justify-end"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-32 mt-2 mr-4"
                    style={{
                      top: 'auto',
                      right: '2rem',
                      zIndex: 1000,
                      pointerEvents: 'auto',
                    }}
                  >
                    {post.author_id === user?.id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors text-sm"
                      >
                        Eliminar post
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              {user && (
              <div className="flex space-x-3 mb-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    {newComment && (
                      <div className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded z-10">
                        Borrador guardado
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={1000}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                        rows={3}
                        placeholder="Añade un comentario..."
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        {newComment.length}/1000
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                        disabled={!newComment.trim() || loading}
                        onClick={handleComment}
                      className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                          newComment.trim() && !loading
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send size={14} className="inline mr-1" />
                        {loading ? 'Enviando...' : 'Comentar'}
                    </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={12} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-gray-400 truncate">
                          {comment.author?.full_name || comment.author?.email} • {new Date(comment.created_at).toLocaleString()}
                        </div>
                        {comment.author_id === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                            title="Eliminar comentario"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#23272a] via-[#233561] to-[#23272a]">
      <Sidebar />
      <MobileNav />
      <div className="flex-1 p-2 sm:p-4 lg:ml-64 pt-20 lg:pt-4">
        {/* Botón creativo para ir al dashboard */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="group flex items-center space-x-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#7289da] to-[#6cf0c8] shadow-lg hover:from-[#6cf0c8] hover:to-[#7289da] transition-all duration-300 border-2 border-[#7289da]/40 hover:scale-105"
            title="Ir al Dashboard"
          >
            <svg className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v-2a7 7 0 0114 0v2h2m-2 0v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6m12 0H6" />
            </svg>
            <span className="font-bold text-white text-base drop-shadow">WooMeet</span>
          </button>
        </div>
        {activeView === 'home' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#6cf0c8] to-[#7289da] bg-clip-text text-transparent drop-shadow-lg">Foros</h1>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={loadData}
                className="px-3 py-2 bg-gradient-to-r from-[#233561] to-[#23272a] text-[#6cf0c8] rounded-lg hover:from-[#6cf0c8] hover:to-[#7289da] hover:text-white transition-all duration-200 text-sm flex items-center space-x-1 group"
                title="Refrescar datos"
              >
                <svg 
                  className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="hidden sm:inline font-semibold">Actualizar</span>
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#6cf0c8] to-[#7289da] text-white rounded-lg hover:from-[#7289da] hover:to-[#6cf0c8] font-bold shadow transition-colors flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Crear publicación</span>
                <span className="sm:hidden">Crear</span>
              </button>
            </div>
          </div>
        )}
        {activeView === 'home' && (
          <div className="grid grid-cols-1 gap-6">
            {posts
              .filter(post =>
              communities.find(c => c.id === post.community_id && c.joined)
            )
              .map((post) => (
                <div key={post.id} className="bg-gradient-to-br from-[#233561] via-[#23272a] to-[#23272a] rounded-2xl border-2 border-[#7289da]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <PostCard post={post} />
                </div>
              ))}
            {posts.filter(post =>
              communities.find(c => c.id === post.community_id && c.joined)
            ).length === 0 && (
              <div className="text-[#7289da] text-center py-8 font-semibold">
                No hay publicaciones. Únete a comunidades para ver sus posts aquí.
              </div>
            )}
          </div>
        )}
        {activeView.startsWith('community-') && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#6cf0c8] to-[#7289da] bg-clip-text text-transparent drop-shadow-lg">
              {communities.find(c => c.id === Number(activeView.split('-')[1]))?.name}
            </h1>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={loadData}
                className="px-3 py-2 bg-gradient-to-r from-[#233561] to-[#23272a] text-[#6cf0c8] rounded-lg hover:from-[#6cf0c8] hover:to-[#7289da] hover:text-white transition-all duration-200 text-sm flex items-center space-x-1 group"
                title="Refrescar datos"
              >
                <svg 
                  className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                <span className="hidden sm:inline font-semibold">Actualizar</span>
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#6cf0c8] to-[#7289da] text-white rounded-lg hover:from-[#7289da] hover:to-[#6cf0c8] font-bold shadow transition-colors flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Crear publicación</span>
                <span className="sm:hidden">Crear</span>
              </button>
            </div>
          </div>
        )}
        {activeView.startsWith('community-') && (
          <div className="grid grid-cols-1 gap-6">
            {posts
              .filter((post) => post.community_id === Number(activeView.split('-')[1]))
              .map((post) => (
                <div key={post.id} className="bg-gradient-to-br from-[#233561] via-[#23272a] to-[#23272a] rounded-2xl border-2 border-[#7289da]/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <PostCard post={post} />
                </div>
              ))}
          </div>
        )}
        {showCreatePost && <CreatePostModal />}
        {showCreateCommunity && <CreateCommunityModal />}
        {showDiscover && <DiscoverCommunitiesModal />}
      </div>
    </div>
  );
};

export default RedditForumSystem;