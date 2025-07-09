// lib/forumHelpers.ts
// Funciones helper para el sistema de foros

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Community, 
  Post, 
  Comment, 
  Vote, 
  SupabasePost, 
  SupabaseComment 
} from './forumTypes';

const supabase = createClientComponentClient();

// Función para cargar todas las comunidades
export const loadCommunities = async (userId?: string): Promise<Community[]> => {
  try {
    const { data: communitiesData, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .order('members', { ascending: false });

    if (communitiesError) throw communitiesError;

    // Si hay un usuario autenticado, verificar membresías
    if (userId) {
      const { data: memberships, error: membershipsError } = await supabase
        .from('community_members')
        .select('community_id, is_active')
        .eq('user_id', userId);

      if (membershipsError) throw membershipsError;

      return communitiesData?.map(community => ({
        ...community,
        joined: memberships?.some(m => m.community_id === community.id && m.is_active) || false
      })) || [];
    }

    return communitiesData?.map(community => ({
      ...community,
      joined: false
    })) || [];
  } catch (error) {
    console.error('Error loading communities:', error);
    return [];
  }
};

// Función para cargar posts
export const loadPosts = async (communityId?: number): Promise<Post[]> => {
  try {
    let query = supabase
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
        is_pinned,
        communities (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) throw postsError;

    // Transformar los datos
    return (postsData as SupabasePost[] || []).map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      author_id: post.author_id,
      community_id: post.community_id,
      created_at: post.created_at,
      updated_at: post.updated_at,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      comments_count: post.comments_count,
      is_pinned: post.is_pinned,
      author: {
        email: 'Usuario', // Por ahora usamos un valor por defecto
        full_name: null,
        avatar_url: null
      },
      community: post.communities?.[0] ? {
        name: post.communities[0].name
      } : undefined
    }));
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
};

// Función para crear un post
export const createPost = async (postData: {
  title: string;
  content: string;
  community_id: number;
  author_id: string;
}): Promise<Post | null> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
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
        is_pinned,
        communities (
          name
        )
      `)
      .single();

    if (error) throw error;

    const post = data as SupabasePost;
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author_id: post.author_id,
      community_id: post.community_id,
      created_at: post.created_at,
      updated_at: post.updated_at,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      comments_count: post.comments_count,
      is_pinned: post.is_pinned,
      author: {
        email: 'Usuario',
        full_name: null,
        avatar_url: null
      },
      community: post.communities?.[0] ? {
        name: post.communities[0].name
      } : undefined
    };
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

// Función para cargar comentarios
export const loadComments = async (postId: number): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        post_id,
        author_id,
        content,
        created_at,
        updated_at,
        parent_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(comment => ({
      ...comment,
      author: {
        email: 'Usuario',
        full_name: null,
        avatar_url: null
      }
    }));
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
};

// Función para crear un comentario
export const createComment = async (commentData: {
  post_id: number;
  author_id: string;
  content: string;
  parent_id?: number;
}): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      author: {
        email: 'Usuario',
        full_name: null,
        avatar_url: null
      }
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
};

// Función para manejar votos
export const handleVote = async (
  userId: string,
  postId: number,
  voteType: 'up' | 'down'
): Promise<boolean> => {
  try {
    const voteValue = voteType === 'up' ? 1 : -1;

    // Verificar si ya existe un voto
    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('vote_type')
      .match({ user_id: userId, post_id: postId })
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingVote) {
      if (existingVote.vote_type === voteValue) {
        // Remover voto si es el mismo tipo
        const { error } = await supabase
          .from('votes')
          .delete()
          .match({ user_id: userId, post_id: postId });

        if (error) throw error;
      } else {
        // Cambiar voto
        const { error } = await supabase
          .from('votes')
          .update({ vote_type: voteValue })
          .match({ user_id: userId, post_id: postId });

        if (error) throw error;
      }
    } else {
      // Crear nuevo voto
      const { error } = await supabase
        .from('votes')
        .insert({
          user_id: userId,
          post_id: postId,
          vote_type: voteValue
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error handling vote:', error);
    return false;
  }
};

// Función para obtener el voto del usuario
export const getUserVote = async (userId: string, postId: number): Promise<'up' | 'down' | null> => {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('vote_type')
      .match({ user_id: userId, post_id: postId })
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      return data.vote_type === 1 ? 'up' : 'down';
    }

    return null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
};

// Función para unirse/salir de una comunidad
export const toggleCommunityMembership = async (
  userId: string,
  communityId: number
): Promise<boolean> => {
  try {
    // Verificar membresía existente
    const { data: existingMembership, error: checkError } = await supabase
      .from('community_members')
      .select('*')
      .match({ community_id: communityId, user_id: userId })
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingMembership) {
      // Cambiar estado de membresía
      const { error } = await supabase
        .from('community_members')
        .update({ is_active: !existingMembership.is_active })
        .match({ id: existingMembership.id });

      if (error) throw error;
    } else {
      // Crear nueva membresía
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          is_active: true
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error toggling community membership:', error);
    return false;
  }
}; 