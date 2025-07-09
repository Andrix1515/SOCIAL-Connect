-- Migración completa del sistema de foros
-- Esta migración crea todas las tablas necesarias con las relaciones correctas

-- Habilitar las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de comunidades
DROP TABLE IF EXISTS communities CASCADE;
CREATE TABLE communities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    members INTEGER DEFAULT 0,
    type VARCHAR(50) DEFAULT 'public' CHECK (type IN ('public', 'private')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de miembros de comunidades
DROP TABLE IF EXISTS community_members CASCADE;
CREATE TABLE community_members (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- 3. Tabla de posts
DROP TABLE IF EXISTS posts CASCADE;
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id BIGINT REFERENCES communities(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de comentarios
DROP TABLE IF EXISTS comments CASCADE;
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de votos
DROP TABLE IF EXISTS votes CASCADE;
CREATE TABLE votes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)), -- -1 para downvote, 1 para upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_communities_created_by ON communities(created_by);
CREATE INDEX idx_communities_members ON communities(members DESC);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_post_id ON votes(post_id);

-- Funciones para actualizar contadores
CREATE OR REPLACE FUNCTION increment_community_members()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
        UPDATE communities 
        SET members = members + 1 
        WHERE id = NEW.community_id;
    ELSIF NEW.is_active = false AND OLD.is_active = true THEN
        UPDATE communities 
        SET members = members - 1 
        WHERE id = NEW.community_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 1 THEN
            UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Remover voto anterior
        IF OLD.vote_type = 1 THEN
            UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        -- Añadir nuevo voto
        IF NEW.vote_type = 1 THEN
            UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 1 THEN
            UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_increment_community_members ON community_members;
CREATE TRIGGER trigger_increment_community_members
    AFTER INSERT OR UPDATE ON community_members
    FOR EACH ROW
    EXECUTE FUNCTION increment_community_members();

DROP TRIGGER IF EXISTS trigger_increment_post_comments ON comments;
CREATE TRIGGER trigger_increment_post_comments
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION increment_post_comments();

DROP TRIGGER IF EXISTS trigger_update_post_votes ON votes;
CREATE TRIGGER trigger_update_post_votes
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_votes();

-- Políticas RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas para comunidades
CREATE POLICY "Communities are viewable by everyone" ON communities
    FOR SELECT USING (true);

CREATE POLICY "Users can create communities" ON communities
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators can update their communities" ON communities
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Community creators can delete their communities" ON communities
    FOR DELETE USING (auth.uid() = created_by);

-- Políticas para miembros de comunidades
CREATE POLICY "Community members are viewable by everyone" ON community_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join communities" ON community_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" ON community_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON community_members
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para posts
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Post authors can update their posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Post authors can delete their posts" ON posts
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para comentarios
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comment authors can update their comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Comment authors can delete their comments" ON comments
    FOR DELETE USING (auth.uid() = author_id);

-- Políticas para votos
CREATE POLICY "Votes are viewable by everyone" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create votes" ON votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.uid() = user_id); 