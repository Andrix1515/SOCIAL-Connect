import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Calculator, 
  FlaskConical, 
  Microscope, 
  Stethoscope, 
  Scale,
  Building2,
  Gamepad2,
  Music,
  Camera,
  Palette,
  Users,
  Trophy,
  Heart,
  Search,
  Plus,
  MessageCircle,
  ThumbsUp,
  Pin,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Hash,
  Volume2,
  Coffee,
  Sparkles,
  Stars,
  Zap,
  Crown,
  Flame,
  Send,
  ImageIcon,
  Smile,
  Settings,
  Bell,
  MoreVertical,
  UserPlus,
  Shield,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Eye,
  MessageSquare,
  TrendingUp,
  Award,
  PenTool,
  Feather,
  ChevronLeft
} from 'lucide-react';

interface Community {
  id: number;
  name: string;
  displayName: string;
  description: string;
  members: number;
  online: number;
  color: string;
  featured?: boolean;
  lastActivity: string;
  avatar: string;
}

interface Category {
  icon: string;
  communities: Community[];
}

interface CommunityStructure {
  [key: string]: {
    title: string;
    subtitle: string;
    categories: {
      [key: string]: Category;
    };
  };
}

interface ColorMap {
  [key: string]: {
    [key: string]: string;
  };
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  tags: string[];
}

const ComunidadesPage = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar tiempo cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Estructura de comunidades estilo Discord con subcategorías
  const communityStructure: CommunityStructure = {
    educativa: {
      title: "🎓 Academia UNCP",
      subtitle: "Templo del conocimiento",
      categories: {
        "🏛️ FACULTADES PRINCIPALES": {
          icon: "👑",
          communities: [
            { 
              id: 1, 
              name: "ingenieria-civil", 
              displayName: "Ingeniería Civil", 
              description: "Construyendo el futuro de Huancayo", 
              members: 234, 
              online: 45, 
              color: "orange", 
              featured: true,
              lastActivity: "hace 5 min",
              avatar: "🏗️"
            },
            { 
              id: 2, 
              name: "medicina-humana", 
              displayName: "Medicina Humana", 
              description: "Salvando vidas, curando almas", 
              members: 312, 
              online: 67, 
              color: "red", 
              featured: true,
              lastActivity: "hace 2 min",
              avatar: "⚕️"
            },
            { 
              id: 3, 
              name: "derecho-politicas", 
              displayName: "Derecho & Política", 
              description: "Justicia y orden social", 
              members: 178, 
              online: 23, 
              color: "blue",
              lastActivity: "hace 15 min",
              avatar: "⚖️"
            },
            { 
              id: 4, 
              name: "ingenieria-sistemas", 
              displayName: "Sistemas & Computación", 
              description: "Codificando el mañana", 
              members: 289, 
              online: 78, 
              color: "green", 
              featured: true,
              lastActivity: "hace 1 min",
              avatar: "💻"
            }
          ]
        },
        "📚 CURSOS FUNDAMENTALES": {
          icon: "⚡",
          communities: [
            { 
              id: 5, 
              name: "matematicas-calculo", 
              displayName: "Matemáticas y Calculo", 
              description: "Donde los números cobran vida", 
              members: 456, 
              online: 89, 
              color: "purple", 
              featured: true,
              lastActivity: "hace 3 min",
              avatar: "∑"
            },
            { 
              id: 6, 
              name: "fisica-cuantica", 
              displayName: "Física & Universo", 
              description: "Explorando los misterios del cosmos", 
              members: 198, 
              online: 34, 
              color: "blue",
              lastActivity: "hace 8 min",
              avatar: "🌌"
            },
            { 
              id: 7, 
              name: "quimica-molecular", 
              displayName: "Química Molecular", 
              description: "Reacciones que transforman", 
              members: 167, 
              online: 28, 
              color: "green",
              lastActivity: "hace 12 min",
              avatar: "⚗️"
            },
            { 
              id: 8, 
              name: "comunicacion-arte", 
              displayName: "Comunicación & Arte", 
              description: "Expresando ideas con elegancia", 
              members: 234, 
              online: 41, 
              color: "green",
              lastActivity: "hace 6 min",
              avatar: "🎭"
            }
          ]
        },
        "🔬 LABORATORIOS ESPECIALES": {
          icon: "🧪",
          communities: [
            { 
              id: 9, 
              name: "investigacion-avanzada", 
              displayName: "Investigación Avanzada", 
              description: "Descubriendo lo imposible", 
              members: 89, 
              online: 12, 
              color: "violet",
              lastActivity: "hace 20 min",
              avatar: "🔬"
            },
            { 
              id: 10, 
              name: "proyectos-interdisciplinarios", 
              displayName: "Proyectos Interdisciplinarios", 
              description: "Conectando saberes", 
              members: 145, 
              online: 19, 
              color: "indigo",
              lastActivity: "hace 30 min",
              avatar: "🌐"
            }
          ]
        }
      }
    },
    recreativa: {
      title: "🌙 Recreación",
      subtitle: "Diviertete y comparte tus momentos",
      categories: {
        "🎮 GAMING": {
          icon: "👾",
          communities: [
            { 
              id: 11, 
              name: "left4dead", 
              displayName: "Left 4 Dead", 
              description: "F1 y una noche con el tank", 
              members: 423, 
              online: 156, 
              color: "orange", 
              featured: true,
              lastActivity: "hace 1 min",
              avatar: "🔥"
            },
            { 
              id: 12, 
              name: "dota", 
              displayName: "DOTA 2", 
              description: "Ancient protectors del valle", 
              members: 312, 
              online: 78, 
              color: "red", 
              featured: true,
              lastActivity: "hace 2 min",
              avatar: "⚔️"
            },
            { 
              id: 13, 
              name: "league-of-legends", 
              displayName: "League of Legends", 
              description: "Invocadores del rifts andino", 
              members: 267, 
              online: 89, 
              color: "blue",
              lastActivity: "hace 4 min",
              avatar: "🏆"
            },
            { 
              id: 14, 
              name: "valorant-agents", 
              displayName: "Valorant Agents", 
              description: "Tácticas precisas, victorias épicas", 
              members: 198, 
              online: 67, 
              color: "purple",
              lastActivity: "hace 7 min",
              avatar: "🎯"
            }
          ]
        },
        "🎭 ARTE & CULTURA": {
          icon: "🎨",
          communities: [
            { 
              id: 15, 
              name: "danzas-folcloricas", 
              displayName: "Danzas Folcloricas", 
              description: "Ritmos que conectan con la tierra", 
              members: 156, 
              online: 23, 
              color: "amber", 
              featured: true,
              lastActivity: "hace 10 min",
              avatar: "💃"
            },
            { 
              id: 16, 
              name: "Club de lectura", 
              displayName: "Club de lectura", 
              description: "Libros que abrazan el alma", 
              members: 234, 
              online: 45, 
              color: "green",
              lastActivity: "hace 5 min",
              avatar: "🎵"
            },
            { 
              id: 17, 
              name: "musica", 
              displayName: "Música", 
              description: "Rock, salsa, k-pop, reggaetón, música andina", 
              members: 189, 
              online: 31, 
              color: "purple",
              lastActivity: "hace 18 min",
              avatar: "🎬"
            },
          ]
        },
        "☕ CHARLAS": {
          icon: "💫",
          communities: [
            { 
              id: 19, 
              name: "filosofia-cafe", 
              displayName: "Filosofía & Café", 
              description: "Reflexiones profundas con aroma a café", 
              members: 98, 
              online: 15, 
              color: "brown",
              lastActivity: "hace 35 min",
              avatar: "☕"
            },
            { 
              id: 20, 
              name: "literatura-moderna", 
              displayName: "Literatura Moderna", 
              description: "Palabras que transforman realidades", 
              members: 167, 
              online: 22, 
              color: "indigo",
              lastActivity: "hace 22 min",
              avatar: "📚"
            },
            { 
              id: 21, 
              name: "viajes-aventuras", 
              displayName: "Viajes & Aventuras", 
              description: "Explorando mundos desconocidos", 
              members: 201, 
              online: 38, 
              color: "teal",
              lastActivity: "hace 14 min",
              avatar: "🌍"
            }
          ]
        }
      }
    }
  };

  // Posts de ejemplo para mostrar en las comunidades
  const samplePosts: Post[] = [
    {
      id: 1,
      author: "María Gonzáles",
      avatar: "👩‍🎓",
      time: "hace 2 horas",
      title: "Nuevo laboratorio de robótica inaugurado! 🤖",
      content: "Increíble noticia! La UNCP acaba de inaugurar un laboratorio de robótica de última generación. Quien más está emocionado por las posibilidades que esto abre para nuestros proyectos?",
      likes: 47,
      comments: 12,
      isPinned: true,
      tags: ["#robotica", "#laboratorio", "#innovacion"]
    },
    {
      id: 2,
      author: "Carlos Mendoza",
      avatar: "👨‍💻",
      time: "hace 4 horas",
      title: "Compartiendo mi proyecto final de algoritmos",
      content: "Después de meses de trabajo, finalmente terminé mi algoritmo de optimización para rutas de transporte público en Huancayo. Les comparto el repo de GitHub por si alguien quiere colaborar o dar feedback 💪",
      likes: 23,
      comments: 8,
      isPinned: false,
      tags: ["#algoritmos", "#proyecto", "#transporte"]
    },
    {
      id: 3,
      author: "Ana Sofia",
      avatar: "👩‍⚕️",
      time: "hace 6 horas",
      title: "Experiencia en prácticas hospitalarias",
      content: "Quería compartir mi experiencia en las prácticas de medicina interna. Ha sido desafiante pero increíblemente enriquecedor. Algún consejo para las rotaciones de pediatría?",
      likes: 31,
      comments: 15,
      isPinned: false,
      tags: ["#medicina", "#practicas", "#experiencia"]
    }
  ];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getColorClasses = (color: string, variant: string = 'bg'): string => {
    const colorMap: ColorMap = {
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', hover: 'hover:bg-orange-50', gradient: 'from-orange-400 to-red-500' },
      red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-300', hover: 'hover:bg-red-50', gradient: 'from-red-400 to-green-500' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300', hover: 'hover:bg-blue-50', gradient: 'from-blue-400 to-indigo-500' },
      green: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-300', hover: 'hover:bg-emerald-50', gradient: 'from-emerald-400 to-teal-500' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', hover: 'hover:bg-purple-50', gradient: 'from-purple-400 to-violet-500' },
      pink: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300', hover: 'hover:bg-green-50', gradient: 'from-green-400 to-blue-500' },
      violet: { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-300', hover: 'hover:bg-violet-50', gradient: 'from-violet-400 to-purple-500' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-300', hover: 'hover:bg-indigo-50', gradient: 'from-indigo-400 to-blue-500' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-300', hover: 'hover:bg-amber-50', gradient: 'from-amber-400 to-orange-500' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-300', hover: 'hover:bg-teal-50', gradient: 'from-teal-400 to-cyan-500' },
      brown: { bg: 'bg-amber-700', text: 'text-amber-700', border: 'border-amber-400', hover: 'hover:bg-amber-50', gradient: 'from-amber-600 to-yellow-600' }
    };
    return colorMap[color]?.[variant] || colorMap.blue[variant];
  };

  if (!selectedSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-blue-50 to-purple-100 relative overflow-hidden">
        {/* Elementos decorativos vintage mejorados */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-6xl animate-pulse">🌸</div>
          <div className="absolute top-32 right-20 text-4xl animate-bounce">✨</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-pulse">🦋</div>
          <div className="absolute bottom-32 right-10 text-3xl animate-bounce">🌙</div>
          <div className="absolute top-1/2 left-1/4 text-2xl animate-pulse">💫</div>
          <div className="absolute top-1/3 right-1/3 text-3xl animate-bounce">🌺</div>
          <div className="absolute bottom-1/3 left-1/3 text-4xl animate-pulse">⭐</div>
        </div>

        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-600 via-green-600 to-amber-600 bg-clip-text text-transparent mb-4 tracking-tight">
                ✨ Comunidades UNCP ✨
              </h1>
              <div className="w-40 h-1 bg-gradient-to-r from-green-400 via-purple-400 to-amber-400 mx-auto rounded-full mb-6 shadow-lg"></div>
            </div>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto font-medium italic mb-4">
              "Un lugar donde las mentes brillantes se encuentran y las pasiones cobran vida"
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubre espacios únicos de aprendizaje, creatividad y conexión en nuestra universidad
            </p>
            <div className="flex justify-center space-x-3 mt-6">
              <Stars className="text-amber-400 animate-pulse" size={24} />
              <Stars className="text-green-400 animate-bounce" size={20} />
              <Stars className="text-purple-400 animate-pulse" size={22} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
            {/* Sección Educativa */}
            <div 
              onClick={() => setSelectedSection('educativa')}
              className="group cursor-pointer transform transition-all duration-700 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-500"></div>
                <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl p-12 border-3 border-blue-200/50 group-hover:border-blue-400/70 transition-all shadow-2xl hover:shadow-3xl">
                  <div className="text-center">
                    <div className="mb-12 relative">
                      <div className="w-44 h-44 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-4xl transition-all relative overflow-hidden animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <GraduationCap size={88} className="text-white relative z-10" />
                      </div>
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <Crown size={36} className="text-white" />
                      </div>
                      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles size={28} className="text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      🎓 Academia
                    </h2>
                    <p className="text-xl text-blue-800 mb-3 font-semibold">Academico</p>
                    
                    <p className="text-gray-600 mb-10 text-xl italic leading-relaxed">
                      "Comparte tus conocimientos y aprende de los demás"
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-100 hover:border-blue-200 transition-all group/item">
                        <Calculator className="text-blue-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-blue-800 font-semibold block">Matemáticas</span>
                        <span className="text-xs text-blue-600">& Ciencias Exactas</span>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-100 hover:border-emerald-200 transition-all group/item">
                        <FlaskConical className="text-emerald-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-emerald-800 font-semibold block">Laboratorios</span>
                        <span className="text-xs text-emerald-600">& Experimentos</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border-2 border-purple-100 hover:border-purple-200 transition-all group/item">
                        <Stethoscope className="text-purple-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-purple-800 font-semibold block">Medicina</span>
                        <span className="text-xs text-purple-600">& Ciencias de la Salud</span>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-100 hover:border-amber-200 transition-all group/item">
                        <Building2 className="text-amber-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-amber-800 font-semibold block">Ingeniería</span>
                        <span className="text-xs text-amber-600">& Arquitectura</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white font-bold py-5 px-10 rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 text-lg">Explorar Academia ✨</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Recreativa */}
            <div 
              onClick={() => setSelectedSection('recreativa')}
              className="group cursor-pointer transform transition-all duration-700 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-purple-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-500"></div>
                <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl p-12 border-3 border-green-200/50 group-hover:border-green-400/70 transition-all shadow-2xl hover:shadow-3xl">
                  <div className="text-center">
                    <div className="mb-12 relative">
                      <div className="w-44 h-44 mx-auto bg-gradient-to-br from-green-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:shadow-4xl transition-all relative overflow-hidden animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                        <Coffee size={88} className="text-white relative z-10" />
                      </div>
                      <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-400 to-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <Heart size={36} className="text-white" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                        <Flame size={28} className="text-white" />
                      </div>
                    </div>
                    
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      🌙 Diviertete
                    </h2>
                    <p className="text-xl text-green-800 mb-3 font-semibold">Encuentra tu pasión</p>
                    
                    <p className="text-gray-600 mb-10 text-xl italic leading-relaxed">
                      "Un lugar para divertirte y disfrutar de la vida"
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-100 hover:border-green-200 transition-all group/item">
                        <Gamepad2 className="text-green-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-green-800 font-semibold block">Gaming</span>
                        <span className="text-xs text-green-600">& Esports</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border-2 border-purple-100 hover:border-purple-200 transition-all group/item">
                        <Music className="text-purple-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-purple-800 font-semibold block">Música</span>
                        <span className="text-xs text-purple-600">& Arte Sonoro</span>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl border-2 border-amber-100 hover:border-amber-200 transition-all group/item">
                        <Camera className="text-amber-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-amber-800 font-semibold block">Fotografía</span>
                        <span className="text-xs text-amber-600">& Visual Arts</span>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-100 hover:border-indigo-200 transition-all group/item">
                        <Palette className="text-indigo-600 mb-4 mx-auto group-hover/item:scale-110 transition-transform" size={32} />
                        <span className="text-sm text-indigo-800 font-semibold block">Arte</span>
                        <span className="text-xs text-indigo-600">& Creatividad</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-green-500 via-purple-500 to-indigo-600 text-white font-bold py-5 px-10 rounded-2xl hover:from-green-600 hover:via-purple-600 hover:to-indigo-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 text-lg">Explorar Café Nocturno ✨</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Función de búsqueda en tiempo real
  const filterCommunities = (communities: Community[], term: string) => {
    return communities.filter(community => 
      community.displayName.toLowerCase().includes(term.toLowerCase()) ||
      community.description.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Vista de comunidad seleccionada
  if (selectedSection && selectedCommunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setSelectedCommunity(null)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft size={24} className="mr-2" />
                <span>Volver</span>
              </button>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell size={20} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Settings size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getColorClasses(selectedCommunity.color, 'bg')}`}>
                <span className="text-2xl">{selectedCommunity.avatar}</span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{selectedCommunity.displayName}</h1>
                <p className="text-gray-600">{selectedCommunity.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-gray-900">{selectedCommunity.members}</div>
                <div className="text-sm text-gray-600">Miembros</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-green-600">{selectedCommunity.online}</div>
                <div className="text-sm text-gray-600">En línea</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-gray-900">{selectedCommunity.lastActivity}</div>
                <div className="text-sm text-gray-600">Última actividad</div>
              </div>
            </div>

            <div className="space-y-6">
              {samplePosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xl">{post.avatar}</span>
                      </div>
                      <div className="ml-3">
                        <div className="font-semibold text-gray-900">{post.author}</div>
                        <div className="text-sm text-gray-500">{post.time}</div>
                      </div>
                    </div>
                    {post.isPinned && (
                      <div className="flex items-center text-amber-600">
                        <Pin size={16} className="mr-1" />
                        <span className="text-sm">Destacado</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <p className="text-gray-700 mb-4">{post.content}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-gray-500">
                    <button className="flex items-center hover:text-gray-700 transition-colors">
                      <ThumbsUp size={18} className="mr-1" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center hover:text-gray-700 transition-colors">
                      <MessageCircle size={18} className="mr-1" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center hover:text-gray-700 transition-colors">
                      <Share2 size={18} />
                    </button>
                    <button className="flex items-center hover:text-gray-700 transition-colors">
                      <Bookmark size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full px-6 py-4 bg-gray-50 rounded-2xl pr-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <ImageIcon size={20} className="text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <Smile size={20} className="text-gray-600" />
                </button>
                <button className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 transition-colors">
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de sección seleccionada con búsqueda
  if (selectedSection) {
    const section = communityStructure[selectedSection as keyof typeof communityStructure];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setSelectedSection(null)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={24} className="mr-2" />
              <span>Volver</span>
            </button>
            
            <div className="relative flex-1 max-w-xl mx-8">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar comunidades..."
                className="w-full px-6 py-3 bg-gray-300 rounded-2xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(section.categories).map(([categoryName, category]) => (
              <div key={categoryName} className="space-y-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCategory(categoryName)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{category.icon}</span>
                    <h2 className="text-xl font-semibold text-gray-900">{categoryName}</h2>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`transform transition-transform ${expandedCategories[categoryName] ? 'rotate-180' : ''}`}
                  />
                </div>

                {expandedCategories[categoryName] && (
                  <div className="space-y-4">
                    {filterCommunities(category.communities, searchTerm).map(community => (
                      <div
                        key={community.id}
                        onClick={() => setSelectedCommunity(community)}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(community.color, 'bg')}`}>
                            <span className="text-xl">{community.avatar}</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {community.displayName}
                            </h3>
                            <p className="text-sm text-gray-500">{community.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users size={16} className="mr-1" />
                            <span>{community.members} miembros</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            <span>{community.online} en línea</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ComunidadesPage;