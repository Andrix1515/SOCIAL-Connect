# Sistema de Foros - Documentación

## 📋 Descripción General

El sistema de foros es una implementación completa de un sistema de comunidades estilo Reddit, integrado con Supabase como backend. Incluye funcionalidades de comunidades, posts, comentarios, votos y membresías.

## 🏗️ Arquitectura

### Base de Datos

El sistema utiliza las siguientes tablas en Supabase:

- **`communities`**: Almacena información de las comunidades
- **`community_members`**: Gestiona las membresías de usuarios a comunidades
- **`posts`**: Contiene las publicaciones de los usuarios
- **`comments`**: Almacena los comentarios en los posts
- **`votes`**: Gestiona los votos (upvote/downvote) de los usuarios

### Funciones y Triggers

- **`increment_community_members()`**: Actualiza automáticamente el contador de miembros
- **`increment_post_comments()`**: Actualiza automáticamente el contador de comentarios
- **`update_post_votes()`**: Actualiza automáticamente los contadores de votos

## 🚀 Instalación y Configuración

### 1. Ejecutar la Migración

```bash
# Aplicar la migración completa del sistema de foros
supabase db push
```

### 2. Verificar la Instalación

```bash
# Ejecutar el script de pruebas
node scripts/test-forums.js
```

### 3. Variables de Entorno

Asegúrate de tener configuradas las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 📁 Estructura de Archivos

```
lib/
├── forumTypes.ts          # Tipos TypeScript para el sistema
├── forumHelpers.ts        # Funciones helper para operaciones
└── supabaseClient.ts      # Cliente de Supabase

pages/
└── forums.tsx             # Página principal del sistema de foros

supabase/
└── migrations/
    └── 20240320000018_create_complete_forums_system.sql

scripts/
└── test-forums.js         # Script de pruebas

docs/
└── FORUMS_README.md       # Esta documentación
```

## 🔧 Funcionalidades

### Comunidades

- ✅ Crear comunidades
- ✅ Unirse/salir de comunidades
- ✅ Ver lista de comunidades
- ✅ Contador automático de miembros

### Posts

- ✅ Crear posts en comunidades
- ✅ Ver posts con información de autor y comunidad
- ✅ Sistema de votos (upvote/downvote)
- ✅ Contador automático de comentarios

### Comentarios

- ✅ Crear comentarios en posts
- ✅ Ver comentarios con información de autor
- ✅ Sistema de comentarios anidados (preparado)

### Votos

- ✅ Sistema de votos por post
- ✅ Un voto por usuario por post
- ✅ Contadores automáticos de upvotes/downvotes

## 🛡️ Seguridad

### Políticas RLS (Row Level Security)

Todas las tablas tienen políticas RLS configuradas:

- **Lectura**: Todos pueden ver comunidades, posts, comentarios y votos
- **Escritura**: Solo usuarios autenticados pueden crear contenido
- **Actualización**: Solo los autores pueden editar su contenido
- **Eliminación**: Solo los autores pueden eliminar su contenido

### Validaciones

- Nombres de comunidades únicos
- Un voto por usuario por post
- Una membresía por usuario por comunidad
- Contenido requerido en posts y comentarios

## 🔄 Flujo de Datos

### Crear un Post

1. Usuario selecciona una comunidad
2. Completa título y contenido
3. Se inserta en la tabla `posts`
4. Se actualiza automáticamente el contador de posts de la comunidad

### Votar un Post

1. Usuario hace clic en upvote/downvote
2. Se verifica si ya existe un voto
3. Se actualiza o crea el voto en la tabla `votes`
4. Los contadores se actualizan automáticamente via trigger

### Comentar un Post

1. Usuario escribe un comentario
2. Se inserta en la tabla `comments`
3. El contador de comentarios se actualiza automáticamente

## 🐛 Solución de Problemas

### Error: "Foreign key constraint failed"

**Causa**: Relaciones incorrectas entre tablas
**Solución**: Ejecutar la migración completa nuevamente

```bash
supabase db reset
supabase db push
```

### Error: "Row Level Security policy violation"

**Causa**: Políticas RLS bloqueando operaciones
**Solución**: Verificar que el usuario esté autenticado y tenga permisos

### Error: "Column does not exist"

**Causa**: Esquema de base de datos desactualizado
**Solución**: Ejecutar las migraciones pendientes

```bash
supabase db push
```

## 📈 Optimizaciones

### Índices

Se han creado índices para mejorar el rendimiento:

- `idx_communities_members`: Para ordenar por número de miembros
- `idx_posts_created_at`: Para ordenar posts por fecha
- `idx_posts_community_id`: Para filtrar posts por comunidad
- `idx_votes_user_id`: Para buscar votos de usuario

### Consultas Optimizadas

- Uso de `!inner` para joins obligatorios
- Selección específica de columnas necesarias
- Ordenamiento en la base de datos

## 🔮 Próximas Mejoras

- [ ] Sistema de notificaciones
- [ ] Moderación de contenido
- [ ] Búsqueda avanzada
- [ ] Sistema de etiquetas
- [ ] Estadísticas de comunidades
- [ ] API REST para integración externa

## 📞 Soporte

Si encuentras problemas:

1. Verifica que la migración se ejecutó correctamente
2. Revisa los logs de Supabase
3. Ejecuta el script de pruebas
4. Consulta la documentación de Supabase

## 📝 Notas de Desarrollo

- El sistema está diseñado para ser escalable
- Todas las operaciones son transaccionales
- Los triggers mantienen la consistencia de datos
- El código está optimizado para TypeScript 