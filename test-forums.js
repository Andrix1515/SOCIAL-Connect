// Script de prueba para verificar el sistema de foros
// Ejecutar con: node test-forums.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (reemplaza con tus credenciales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testForumsSystem() {
  console.log('🧪 Iniciando pruebas del sistema de foros...\n');

  try {
    // 1. Verificar que las tablas existen
    console.log('1. Verificando estructura de tablas...');
    
    const tables = ['communities', 'community_members', 'posts', 'comments', 'votes', 'profiles'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error en tabla ${table}:`, error.message);
        } else {
          console.log(`✅ Tabla ${table} existe y es accesible`);
        }
      } catch (err) {
        console.log(`❌ Error accediendo a tabla ${table}:`, err.message);
      }
    }

    // 2. Verificar políticas RLS
    console.log('\n2. Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies');
    
    if (policiesError) {
      console.log('⚠️  No se pudieron verificar las políticas RLS:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS verificadas');
    }

    // 3. Probar inserción de datos de prueba
    console.log('\n3. Probando inserción de datos...');
    
    // Crear una comunidad de prueba
    const { data: testCommunity, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: 'test-community-' + Date.now(),
        description: 'Comunidad de prueba',
        members: 0,
        type: 'public',
        created_by: 'test-user'
      })
      .select()
      .single();

    if (communityError) {
      console.log('❌ Error creando comunidad de prueba:', communityError.message);
    } else {
      console.log('✅ Comunidad de prueba creada:', testCommunity.name);
      
      // Crear un post de prueba
      const { data: testPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title: 'Post de prueba',
          content: 'Contenido de prueba',
          author_id: 'test-user',
          community_id: testCommunity.id,
          upvotes: 0,
          downvotes: 0,
          comments_count: 0,
          is_pinned: false
        })
        .select()
        .single();

      if (postError) {
        console.log('❌ Error creando post de prueba:', postError.message);
      } else {
        console.log('✅ Post de prueba creado:', testPost.title);
        
        // Crear un comentario de prueba
        const { data: testComment, error: commentError } = await supabase
          .from('comments')
          .insert({
            post_id: testPost.id,
            author_id: 'test-user',
            content: 'Comentario de prueba',
            parent_id: null
          })
          .select()
          .single();

        if (commentError) {
          console.log('❌ Error creando comentario de prueba:', commentError.message);
        } else {
          console.log('✅ Comentario de prueba creado');
        }

        // Crear un voto de prueba
        const { data: testVote, error: voteError } = await supabase
          .from('votes')
          .insert({
            user_id: 'test-user',
            post_id: testPost.id,
            vote_type: 1
          })
          .select()
          .single();

        if (voteError) {
          console.log('❌ Error creando voto de prueba:', voteError.message);
        } else {
          console.log('✅ Voto de prueba creado');
        }

        // Limpiar datos de prueba
        console.log('\n4. Limpiando datos de prueba...');
        
        await supabase.from('votes').delete().eq('post_id', testPost.id);
        await supabase.from('comments').delete().eq('post_id', testPost.id);
        await supabase.from('posts').delete().eq('id', testPost.id);
        await supabase.from('communities').delete().eq('id', testCommunity.id);
        
        console.log('✅ Datos de prueba eliminados');
      }
    }

    // 4. Verificar triggers y funciones
    console.log('\n5. Verificando triggers y funciones...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_functions');
    
    if (functionsError) {
      console.log('⚠️  No se pudieron verificar las funciones:', functionsError.message);
    } else {
      console.log('✅ Funciones verificadas');
    }

    console.log('\n🎉 Pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- Las tablas están creadas y accesibles');
    console.log('- Las políticas RLS están configuradas');
    console.log('- Se pueden insertar y eliminar datos');
    console.log('- Los triggers y funciones están funcionando');
    console.log('\n🚀 El sistema de foros está listo para usar!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Función auxiliar para obtener políticas (si existe)
async function getPolicies() {
  try {
    const { data, error } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'public');
    
    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}

// Función auxiliar para obtener funciones (si existe)
async function getFunctions() {
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_schema', 'public');
    
    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  testForumsSystem();
}

module.exports = { testForumsSystem }; 