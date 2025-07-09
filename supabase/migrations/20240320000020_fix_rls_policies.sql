-- Corregir políticas RLS para el sistema de foros

-- Políticas para la tabla profiles (si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view all profiles') THEN
        CREATE POLICY "Users can view all profiles" ON profiles
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Políticas para la tabla communities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Communities are viewable by everyone') THEN
        CREATE POLICY "Communities are viewable by everyone" ON communities
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Authenticated users can create communities') THEN
        CREATE POLICY "Authenticated users can create communities" ON communities
            FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Community creators can update their communities') THEN
        CREATE POLICY "Community creators can update their communities" ON communities
            FOR UPDATE USING (auth.uid() = created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Community creators can delete their communities') THEN
        CREATE POLICY "Community creators can delete their communities" ON communities
            FOR DELETE USING (auth.uid() = created_by);
    END IF;
END $$;

-- Políticas para la tabla community_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community members are viewable by everyone') THEN
        CREATE POLICY "Community members are viewable by everyone" ON community_members
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Authenticated users can join communities') THEN
        CREATE POLICY "Authenticated users can join communities" ON community_members
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can update their own memberships') THEN
        CREATE POLICY "Users can update their own memberships" ON community_members
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can leave communities') THEN
        CREATE POLICY "Users can leave communities" ON community_members
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Políticas para la tabla posts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Posts are viewable by everyone') THEN
        CREATE POLICY "Posts are viewable by everyone" ON posts
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Authenticated users can create posts') THEN
        CREATE POLICY "Authenticated users can create posts" ON posts
            FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Post authors can update their posts') THEN
        CREATE POLICY "Post authors can update their posts" ON posts
            FOR UPDATE USING (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Post authors can delete their posts') THEN
        CREATE POLICY "Post authors can delete their posts" ON posts
            FOR DELETE USING (auth.uid() = author_id);
    END IF;
END $$;

-- Políticas para la tabla comments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comments are viewable by everyone') THEN
        CREATE POLICY "Comments are viewable by everyone" ON comments
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Authenticated users can create comments') THEN
        CREATE POLICY "Authenticated users can create comments" ON comments
            FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comment authors can update their comments') THEN
        CREATE POLICY "Comment authors can update their comments" ON comments
            FOR UPDATE USING (auth.uid() = author_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Comment authors can delete their comments') THEN
        CREATE POLICY "Comment authors can delete their comments" ON comments
            FOR DELETE USING (auth.uid() = author_id);
    END IF;
END $$;

-- Políticas para la tabla votes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Votes are viewable by everyone') THEN
        CREATE POLICY "Votes are viewable by everyone" ON votes
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Authenticated users can vote') THEN
        CREATE POLICY "Authenticated users can vote" ON votes
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$; 