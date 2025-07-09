# Guía de Solución de Problemas - Sistema de Foros

## Problemas Comunes y Soluciones

### 1. Las publicaciones no se crean

**Síntomas:**
- El botón "Publicar" no funciona
- No aparece mensaje de error
- Las publicaciones no aparecen en la lista

**Soluciones:**

#### A. Verificar la estructura de la tabla `posts`
```sql
-- Ejecutar en el SQL Editor de Supabase
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;
```

La tabla debe tener estas columnas:
- `id` (SERIAL PRIMARY KEY)
- `title` (TEXT NOT NULL)
- `content` (TEXT NOT NULL)
- `author_id` (UUID NOT NULL)
- `community_id` (INTEGER NOT NULL)
- `upvotes` (INTEGER DEFAULT 0)
- `downvotes` (INTEGER DEFAULT 0)
- `comments_count` (INTEGER DEFAULT 0)
- `is_pinned` (BOOLEAN DEFAULT FALSE)
- `created_at` (TIMESTAMP DEFAULT NOW())
- `updated_at` (TIMESTAMP DEFAULT NOW())

#### B. Verificar políticas RLS
```sql
-- Habilitar RLS en la tabla posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política para insertar posts
CREATE POLICY "Users can insert their own posts" ON posts
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Política para ver posts
CREATE POLICY "Anyone can view posts" ON posts
FOR SELECT USING (true);

-- Política para actualizar posts propios
CREATE POLICY "Users can update their own posts" ON posts
FOR UPDATE USING (auth.uid() = author_id);

-- Política para eliminar posts propios
CREATE POLICY "Users can delete their own posts" ON posts
FOR DELETE USING (auth.uid() = author_id);
```

#### C. Verificar variables de entorno
Asegúrate de que tu archivo `.env.local` tenga las credenciales correctas:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### 2. Los botones de formato no funcionan

**Síntomas:**
- Los botones de negrita, cursiva, enlace y lista no hacen nada
- No se aplica formato al texto seleccionado

**Soluciones:**

#### A. Verificar que el textarea tenga el ID correcto
El textarea debe tener el ID `content-textarea`:
```jsx
<textarea
  id="content-textarea"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  className="w-full bg-transparent p-4 text-white resize-none focus:outline-none min-h-32"
  placeholder="¿Qué quieres compartir?"
/>
```

#### B. Verificar la función applyFormat
La función debe estar definida dentro del componente `CreatePostModal`:
```jsx
const applyFormat = (format: string) => {
  const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.substring(start, end);
  let formattedText = '';

  switch (format) {
    case 'bold':
      formattedText = `**${selectedText}**`;
      break;
    case 'italic':
      formattedText = `*${selectedText}*`;
      break;
    case 'link':
      formattedText = `[${selectedText}](url)`;
      break;
    case 'list':
      formattedText = `- ${selectedText}`;
      break;
    default:
      return;
  }

  const newContent = content.substring(0, start) + formattedText + content.substring(end);
  setContent(newContent);

  // Restaurar el foco y la selección
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start, start + formattedText.length);
  }, 0);
};
```

#### C. Verificar que los botones tengan onClick
```jsx
{[
  { icon: Bold, title: 'Negrita', format: 'bold' },
  { icon: Italic, title: 'Cursiva', format: 'italic' },
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
```

### 3. Los votos no funcionan

**Síntomas:**
- Los botones de votar no responden
- Los contadores no se actualizan
- No se guardan los votos

**Soluciones:**

#### A. Verificar la tabla `votes`
```sql
-- Crear tabla votes si no existe
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Habilitar RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can insert their own votes" ON votes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON votes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON votes
FOR SELECT USING (true);
```

#### B. Verificar triggers para actualizar contadores
```sql
-- Función para actualizar contadores de votos
CREATE OR REPLACE FUNCTION update_post_vote_count()
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
    -- Agregar nuevo voto
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

-- Trigger para votos
DROP TRIGGER IF EXISTS trigger_update_post_vote_count ON votes;
CREATE TRIGGER trigger_update_post_vote_count
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();
```

### 4. Los comentarios no se cargan

**Síntomas:**
- No aparecen comentarios en las publicaciones
- Error al cargar comentarios

**Soluciones:**

#### A. Verificar la tabla `comments`
```sql
-- Crear tabla comments si no existe
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can insert their own comments" ON comments
FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Anyone can view comments" ON comments
FOR SELECT USING (true);

CREATE POLICY "Users can update their own comments" ON comments
FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON comments
FOR DELETE USING (auth.uid() = author_id);
```

#### B. Verificar trigger para contador de comentarios
```sql
-- Función para actualizar contador de comentarios
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para comentarios
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();
```

### 5. Script de prueba

Ejecuta el script de prueba para verificar que todo funcione:

```bash
# Instalar dependencias si no están instaladas
npm install @supabase/supabase-js

# Configurar variables de entorno
export NEXT_PUBLIC_SUPABASE_URL="tu_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_clave"

# Ejecutar prueba
node test-forums.js
```

### 6. Verificación manual en Supabase

1. Ve al **Dashboard de Supabase**
2. Navega a **Table Editor**
3. Verifica que las tablas existan:
   - `communities`
   - `community_members`
   - `posts`
   - `comments`
   - `votes`
   - `profiles`

4. Ve a **Authentication > Policies** para verificar las políticas RLS

5. Ve a **Database > Functions** para verificar los triggers

### 7. Logs de depuración

Para depurar problemas, agrega logs en el código:

```jsx
const handleCreatePost = async (postData) => {
  try {
    console.log('Creando post con datos:', postData);
    
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

    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }

    console.log('Post creado exitosamente:', data);
    // ... resto del código
  } catch (error) {
    console.error('Error completo:', error);
    alert('Error al crear la publicación. Por favor, intenta de nuevo.');
  }
};
```

## Contacto

Si sigues teniendo problemas después de intentar estas soluciones, revisa:
1. Los logs de la consola del navegador
2. Los logs del servidor de desarrollo
3. Los logs de Supabase en el dashboard 