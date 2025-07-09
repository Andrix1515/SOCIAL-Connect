// lib/forumTypes.ts
// Tipos TypeScript para el sistema de foros

export interface Community {
  id: number;
  name: string;
  description: string;
  members: number;
  joined: boolean;
  type: string;
  created_by: string;
}

export interface Post {
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
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  community?: {
    name: string;
  };
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  author?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Vote {
  id: number;
  user_id: string;
  post_id: number;
  vote_type: number; // 1 para upvote, -1 para downvote
  created_at: string;
}

export interface CommunityMember {
  id: number;
  community_id: number;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos para las respuestas de Supabase
export interface SupabasePost {
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
  communities: {
    name: string;
  }[];
}

export interface SupabaseComment {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: number | null;
  author?: {
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
} 