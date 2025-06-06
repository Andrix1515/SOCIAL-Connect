import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, Camera, Save, ArrowLeft, Upload } from 'lucide-react';
import { supabase, Profile as SupabaseProfile } from '../lib/supabaseClient';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

interface ExtendedProfile extends SupabaseProfile {
  career: string | null;
  semester: number | null;
  extroversion_level: number | null;
  description: string | null;
}

type Profile = ExtendedProfile;

const EXTROVERSION_LEVELS = [
  { value: 1, label: 'Muy Introvertido', description: 'Prefiero actividades tranquilas y grupos pequeños' },
  { value: 2, label: 'Introvertido', description: 'Me gusta socializar pero necesito tiempo a solas' },
  { value: 3, label: 'Equilibrado', description: 'Me adapto tanto a situaciones sociales como tranquilas' },
  { value: 4, label: 'Extrovertido', description: 'Disfruto mucho la interacción social y las actividades grupales' },
  { value: 5, label: 'Muy Extrovertido', description: 'Me energizo con las multitudes y eventos sociales' }
];

const CAREERS = [
  'Enfermería',
  'Medicina Humana',
  'Arquitectura',
  'Ingeniería Civil',
  'Ingeniería de Minas',
  'Ingeniería de Sistemas',
  'Ingeniería Eléctrica y Electrónica',
  'Ingeniería Mecánica',
  'Ingeniería Metalúrgica y de Materiales',
  'Ingeniería Química',
  'Ingeniería Química Industrial',
  'Ingeniería Química Ambiental',
  'Administración de Empresas',
  'Contabilidad',
  'Economía',
  'Administración de Negocios - Tarma',
  'Administración Hotelera y Turismo - Tarma',
  'Antropología',
  'Ciencias de la Comunicación',
  'Derecho y Ciencias Políticas',
  'Sociología',
  'Trabajo Social',
  'Educación Inicial',
  'Educación Primaria',
  'Educación Filosofía, Ciencias Sociales y Relaciones Humanas',
  'Educación Lengua,Literatura y Comunicación',
  'Educación Ciencias Naturales y Ambientales',
  'Educación Ciencias Matemáticas e Informática',
  'Educación Física y Psicomotricidad',
  'Agronomía',
  'Ciencias Forestales y del Ambiente',
  'Ingeniería en Industrias Alimentarias',
  'Zootecnia',
  'Ing. Agroindustrial - Tarma',
  'Ing. Agronomía Tropical - Satipo',
  'Ing. Forestal Tropical - Satipo',
  'Ing. Industrias Alimentarias Tropical - Satipo',
  'Zootecnia Tropical- Satipo',
  
];

export default function EditProfile() {
  const router = useRouter();
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    career: '',
    semester: '',
    extroversion_level: '',
    description: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        router.push('/auth');
        return;
      }

      try {
        setLoading(true);
        const { data: profileData, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          if (error.code === 'PGRST116') {
            // Si el perfil no existe, lo creamos
            const { data: newProfile, error: createError } = await supabaseClient
              .from('profiles')
              .insert([
                { 
                  id: user.id,
                  email: user.email,
                }
              ])
              .select()
              .single();

            if (createError) throw createError;
            setProfile(newProfile);
            setFormData({
              full_name: '',
              career: '',
              semester: '',
              extroversion_level: '',
              description: ''
            });
          } else {
            throw error;
          }
        } else {
          const extendedProfile: ExtendedProfile = {
            ...profileData,
            career: (profileData as any).career || null,
            semester: (profileData as any).semester || null,
            extroversion_level: (profileData as any).extroversion_level || null,
            description: (profileData as any).description || null
          };

          setProfile(extendedProfile);
          setFormData({
            full_name: extendedProfile.full_name || '',
            career: extendedProfile.career || '',
            semester: extendedProfile.semester?.toString() || '',
            extroversion_level: extendedProfile.extroversion_level?.toString() || '',
            description: extendedProfile.description || ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        alert(`Error al cargar el perfil. Por favor, intenta nuevamente. Detalle: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, router, supabaseClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      if (!user) {
        throw new Error('No user logged in');
      }

      // 1. Validar el tipo de archivo
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG y GIF.');
      }

      // 2. Generar un nombre único para el archivo
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // 3. Subir la nueva imagen
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Cambiado a true para sobrescribir si existe
        });

      if (uploadError) {
        console.error('Error de subida:', uploadError);
        throw new Error('Error al subir la imagen. Por favor, inténtalo de nuevo.');
      }

      if (!uploadData?.path) {
        throw new Error('No se pudo obtener la ruta del archivo subido');
      }

      // 4. Obtener la URL pública
      const { data: { publicUrl } } = supabaseClient.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);

      // 5. Actualizar el perfil con la nueva URL
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        // Si falla la actualización del perfil, intentamos eliminar la imagen subida
        await supabaseClient.storage
          .from('avatars')
          .remove([uploadData.path]);
        throw updateError;
      }

      // 6. Eliminar avatar anterior si existe y es diferente
      if (profile?.avatar_url) {
        const oldAvatarPath = profile.avatar_url.split('/').pop();
        if (oldAvatarPath && oldAvatarPath !== fileName) {
          await supabaseClient.storage
            .from('avatars')
            .remove([oldAvatarPath])
            .catch(console.error); // No lanzamos error si falla la eliminación
        }
      }

      // 7. Actualizar estado local
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      alert('Imagen de perfil actualizada exitosamente');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(error instanceof Error ? error.message : 'Error al subir la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      uploadAvatar(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) {
      alert('Perfil no cargado o usuario no autenticado. Por favor, recarga la página o inicia sesión.');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        full_name: formData.full_name.trim() || null,
        career: formData.career || null,
        semester: formData.semester ? parseInt(formData.semester) : null,
        extroversion_level: formData.extroversion_level ? parseInt(formData.extroversion_level) : null,
        description: formData.description.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      alert('Perfil actualizado exitosamente');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil. Por favor, inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] to-[#23272a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7289da]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c2f33] to-[#23272a]">
      <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mr-4 p-2 rounded-lg hover:bg-[#7289da]/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#7289da]" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#7289da] to-[#6cf0c8] bg-clip-text text-transparent">
            Editar Perfil
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-[#23272a]/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-[#7289da]/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
              <Camera className="w-6 h-6 mr-2 text-[#7289da]" />
              Foto de Perfil
            </h2>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-20 sm:w-24 h-20 sm:h-24 rounded-full object-cover border-4 border-[#7289da]"
                  />
                ) : (
                  <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-gradient-to-r from-[#7289da] to-[#6cf0c8] flex items-center justify-center border-4 border-[#23272a]">
                    <User className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploading}
                />
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center px-4 sm:px-5 py-2 border border-[#7289da] rounded-lg shadow-sm text-sm font-semibold text-[#7289da] bg-[#2c2f33] hover:bg-[#7289da]/10 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {uploading ? 'Subiendo...' : 'Cambiar foto'}
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG o GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-[#23272a]/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-[#7289da]/20">
            <h2 className="text-xl font-semibold mb-4 text-white">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#2c2f33] border border-[#7289da]/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Carrera
                </label>
                <select
                  name="career"
                  value={formData.career}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#2c2f33] border border-[#7289da]/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent text-white"
                >
                  <option value="" className="bg-[#23272a]">Selecciona tu carrera</option>
                  {CAREERS.map(career => (
                    <option key={career} value={career} className="bg-[#23272a]">{career}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Semestre
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#2c2f33] border border-[#7289da]/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent text-white"
                >
                  <option value="" className="bg-[#23272a]">Selecciona tu semestre</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(sem => (
                    <option key={sem} value={sem} className="bg-[#23272a]">{sem}° Semestre</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Extroversion Level */}
          <div className="bg-[#23272a]/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-[#7289da]/20">
            <h2 className="text-xl font-semibold mb-4 text-white">Nivel de Extroversión</h2>
            <p className="text-sm text-gray-300 mb-4">
              Esto nos ayuda a conectarte con personas compatibles con tu personalidad
            </p>
            <div className="space-y-4">
              {EXTROVERSION_LEVELS.map(level => (
                <label key={level.value} className="flex items-start space-x-4 cursor-pointer group">
                  <input
                    type="radio"
                    name="extroversion_level"
                    value={level.value}
                    checked={formData.extroversion_level === level.value.toString()}
                    onChange={handleInputChange}
                    className="mt-1 h-5 w-5 text-[#7289da] focus:ring-[#7289da] border-[#7289da]/30 bg-[#2c2f33]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-[#7289da] transition-colors">{level.label}</div>
                    <div className="text-sm text-gray-400">{level.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#23272a]/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-6 border border-[#7289da]/20">
            <h2 className="text-xl font-semibold mb-4 text-white">Sobre ti</h2>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-3 bg-[#2c2f33] border border-[#7289da]/30 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7289da] focus:border-transparent text-white placeholder-gray-500"
              placeholder="Cuéntanos un poco sobre ti, tus intereses, hobbies o cualquier cosa que quieras compartir..."
              maxLength={500}
            />
            <div className="text-right text-sm text-gray-400 mt-1">
              {formData.description.length}/500 caracteres
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto px-6 py-3 border border-[#7289da]/30 rounded-lg shadow-sm text-sm font-semibold text-gray-300 bg-[#2c2f33] hover:bg-[#7289da]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7289da] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-[#7289da] to-[#6cf0c8] hover:from-[#6cf0c8] hover:to-[#7289da] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7289da] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-[1.02]"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
