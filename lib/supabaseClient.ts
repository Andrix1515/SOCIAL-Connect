// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso en componentes
export const supabase = createClientComponentClient()

// Cliente para uso en API routes y getServerSideProps
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

// Interfaces TypeScript basadas en tu esquema SQL
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Interest {
  id: number
  name: string
  category: string
  created_at: string
}

export interface UserInterest {
  id: number
  user_id: string
  interest_id: number
  created_at: string
  interest?: Interest
}

export interface Match {
  id: number
  user1_id: string
  user2_id: string
  compatibility_score: number
  created_at: string
  is_mutual: boolean
}

export interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read: boolean
}

interface UserWithInterests extends Profile {
  interests_count: number;
  interest_names: string[];
  interest_categories: string[];
  career: string | null;
  description: string | null;
  interests?: Interest[];
}

interface UserInterestWithJoin {
  interest: {
    id: number;
    name: string;
    category: string;
    created_at: string;
  }
}

// Funciones helper
export const getCurrentUser = async (): Promise<any | null> => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data as Profile
}

export const getAllInterests = async (): Promise<Interest[]> => {
  const { data, error } = await supabase
    .from('interests')
    .select('*')
    .order('category', { ascending: true })
  
  if (error) throw error
  return data as Interest[]
}

export const getUserInterests = async (userId: string) => {
  console.log('🔍 getUserInterests llamado para:', userId);

  // Usar el cliente de componentes que maneja automáticamente la sesión
  const client = createClientComponentClient();
  
  // Primero, verificar si hay registros en user_interests sin el join
  const { data: rawData, error: rawError } = await client
    .from('user_interests')
    .select('*')
    .eq('user_id', userId);

  console.log('📊 Datos crudos de user_interests:', {
    userId,
    count: rawData?.length || 0,
    data: rawData,
    error: rawError
  });

  if (rawError) {
    console.error('❌ Error en consulta cruda:', rawError);
    return [];
  }

  // Ahora intentar con el join
  const { data, error } = await client
    .from('user_interests')
    .select(`
      id,
      user_id,
      interest_id,
      created_at,
      interest:interests (
        id,
        name,
        category,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('❌ Error en getUserInterests:', error);
    return [];
  }

  // Verificar si tenemos datos antes del join
  console.log('🔄 Datos antes del join:', {
    userId,
    count: data?.length || 0,
    data: data?.map(d => ({
      id: d.id,
      user_id: d.user_id,
      interest_id: d.interest_id
    }))
  });

  // Asegurarnos de que los datos tienen la estructura correcta
  const typedData = ((data as any[]) || [])
    .filter(item => item && item.interest && typeof item.interest === 'object')
    .map(item => ({
      id: item.id,
      user_id: item.user_id,
      interest_id: item.interest_id,
      created_at: item.created_at,
      interest: {
        id: item.interest.id,
        name: item.interest.name,
        category: item.interest.category,
        created_at: item.interest.created_at
      }
    }));

  console.log('✅ getUserInterests resultado final:', {
    userId,
    count: typedData.length,
    interests: typedData.map(ui => ({
      id: ui.interest.id,
      name: ui.interest.name,
      category: ui.interest.category
    }))
  });

  return typedData;
}

export const getAllUsers = async (): Promise<UserWithInterests[]> => {
  const client = createClientComponentClient();

  try {
    // Primero obtener todos los usuarios
    const { data: users, error: usersError } = await client
      .from('profiles')
      .select('id,email,full_name,avatar_url,created_at,updated_at,career,description');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios');
      throw usersError;
    }

    // Verificar la tabla user_interests directamente usando una vista pública
    const { data: userInterestsCheck, error: checkError } = await client
      .from('public_user_interests_view')
      .select('*');

    if (checkError) {
      console.error('❌ Error en verificación de user_interests');
    }

    // Obtener todos los intereses de una vez
    const { data: allInterests, error: allInterestsError } = await client
      .from('interests')
      .select('*');

    if (allInterestsError) {
      console.error('❌ Error obteniendo todos los intereses');
      throw allInterestsError;
    }

    // Obtener todas las relaciones user_interests usando la vista pública
    const { data: allUserInterests, error: userInterestsError } = await client
      .from('public_user_interests_view')
      .select('*');

    if (userInterestsError) {
      console.error('❌ Error obteniendo relaciones user_interests');
      throw userInterestsError;
    }

    // Para cada usuario, procesar sus intereses
    const usersWithInterests = users.map(user => {
      // Encontrar los interest_ids para este usuario
      const userInterestIds = allUserInterests
        .filter(ui => ui.user_id === user.id)
        .map(ui => ui.interest_id);

      // Encontrar los intereses completos
      const interests = allInterests
        .filter(interest => userInterestIds.includes(interest.id));

      // Extraer nombres y categorías únicas de intereses
      const interest_names = interests.map(i => i.name);
      const interest_categories = [...new Set(interests.map(i => i.category))];

      return {
        ...user,
        interests_count: interests.length,
        interest_names,
        interest_categories,
        interests
      };
    });

    return usersWithInterests;
  } catch (error) {
    console.error('❌ Error general en getAllUsers');
    throw error;
  }
}

export const getUserMatches = async (userId: string): Promise<{ userId: string; compatibility_score: number }[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select('user1_id,user2_id,compatibility_score')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  if (error) throw error

  // Map to array of { userId: otherUserId, compatibility_score }
  const matches = data.map((match: any) => {
    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id
    return {
      userId: otherUserId,
      compatibility_score: match.compatibility_score
    }
  })

  return matches
}

export const saveUserInterests = async (supabaseClient: any, userId: string, interestIds: number[]) => {
  console.log('🔄 Guardando intereses:', {
    userId,
    interestCount: interestIds.length,
    interestIds
  });

  // Usar el cliente de componentes que maneja automáticamente la sesión
  const client = createClientComponentClient();

  // Primero eliminar intereses existentes
  const { error: deleteError } = await client
    .from('user_interests')
    .delete()
    .eq('user_id', userId);
  
  if (deleteError) {
    console.error('❌ Error eliminando intereses existentes:', deleteError);
    throw deleteError;
  }

  console.log('✅ Intereses anteriores eliminados');
  
  // Insertar nuevos intereses
  const userInterests = interestIds.map(interestId => ({
    user_id: userId,
    interest_id: interestId
  }));
  
  console.log('📝 Insertando nuevos intereses:', userInterests);

  const { data: insertData, error: insertError } = await client
    .from('user_interests')
    .insert(userInterests)
    .select();
  
  if (insertError) {
    console.error('❌ Error insertando nuevos intereses:', insertError);
    throw insertError;
  }

  console.log('✅ Intereses guardados correctamente:', {
    count: insertData?.length || 0,
    data: insertData
  });

  // Verificar que los intereses se guardaron correctamente
  const { data: verifyData, error: verifyError } = await client
    .from('user_interests')
    .select('*')
    .eq('user_id', userId);

  console.log('🔍 Verificación de guardado:', {
    count: verifyData?.length || 0,
    error: verifyError
  });
}
