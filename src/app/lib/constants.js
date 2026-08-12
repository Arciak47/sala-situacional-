// ──────────────────────────────────────────────────────────
// CONSTANTS & INITIAL DATA
// ──────────────────────────────────────────────────────────

export const CW = 1200;
export const CH = 750;
export const HR = 6; // Handle radius in px

export const SALAS_DISPONIBLES = [
  'Sala Comuna',
  'Sala CLEBG',
  'Sala Posicionamiento de Gestión',
  'Sala Principal',
  'Sala Comunicacional',
];

export const INITIAL_USERS = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    nombres: 'Administrador',
    apellidos: 'Principal',
    name: 'Administrador Principal',
    sala: 'Sala Principal',
    salaCodigo: 'Sala Principal 01',
    salaEtiqueta: 'Sala Principal 01 - Administrador Principal',
    edad: '35',
    fechaNacimiento: '1991-01-01',
    email: 'admin@monitoreo.com',
    password: 'admin123',
    role: 'Administrador',
    department: 'Gerencia de Sala Situacional',
    status: 'Activo',
    createdAt: '2026-07-01',
  },
];

export const INITIAL_LOGS = [
  {
    id: 'log-101',
    timestamp: new Date().toLocaleDateString('es-ES') + ' 09:30:00',
    user: 'Sistema',
    action: 'Sistema Iniciado',
    details: 'Editor tipo Canva v2 listo.',
    type: 'info',
  },
];

export const INITIAL_MESSAGES = [];

export const EMPTY_REPORT = {
  municipio: '',
  fecha: '',
  hora: '',
  redSocial: 'INSTAGRAM',
  postTitle: '',
  usuario: '',
  area: 'AGUA',
  contexto: '',
  sentimiento: 'NEGATIVO',
  viralidad: 'MEDIO',
  enlace: '',
  likes: '0',
  comments: '0',
  shares: '0',
  views: '0',
  evidenceImageSrc: '',
};

// 15 MUNICIPIOS DEL ESTADO GUÁRICO
export const MUNICIPIOS = [
  'JUAN GERMÁN ROSCIO',
  'FRANCISCO DE MIRANDA',
  'LEONARDO INFANTE',
  'JOSÉ TADEO MONAGAS',
  'PEDRO ZARAZA',
  'JULIÁN MELLADO',
  'JOSÉ FÉLIX RIBAS',
  'JUAN JOSÉ RONDÓN',
  'CAMAGUÁN',
  'SAN GERÓNIMO DE GUAYABAL',
  'ORTÍZ',
  'CHAGUARAMAS',
  'EL SOCORRO',
  'SANTA MARÍA DE IPIRE',
  'SAN JOSÉ DE GUARIBE',
];

export const REDES_SOCIALES = [
  'INSTAGRAM',
  'TWITTER / X',
  'FACEBOOK',
  'TIKTOK',
];

export const AREAS = [
  'AGUA',
  'GAS DOMÉSTICO',
  'VIALIDAD',
  'TRANSPORTE',
  'EDUCACIÓN',
  'SALUD',
  'ALIMENTACIÓN',
  'ECONOMÍA',
  'TELECOMUNICACIONES',
  'SEGURIDAD',
  'PROTECCIÓN CIVIL',
  'JUDICIAL',
  'ELECTRICIDAD',
  'CONTEXTO POLÍTICO',
  'DEPORTE',
  'INFRAESTRUCTURA',
  'SERVICIOS PÚBLICOS',
];

export const SENTIMIENTOS = ['NEGATIVO', 'NEUTRO', 'POSITIVO'];

export const VIRALIDADES = ['BAJO', 'MEDIO', 'ALTO'];

export const ROLE_BADGES = {
  Administrador: {
    color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
    icon: '👑',
  },
  Analista: {
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
    icon: '📊',
  },
  Supervisor: {
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
    icon: '🔍',
  },
  Observador: {
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400',
    icon: '👁️',
  },
};

export const getEventHour = (obj) => {
  if (!obj) return 12;
  const horaRaw = obj.reportData?.horaRaw || obj.horaRaw;
  if (horaRaw) {
    const parsedHour = parseInt(horaRaw.split(':')[0], 10);
    if (!isNaN(parsedHour)) return parsedHour;
  }
  const ts = obj.timestamp || obj.fechaHora || obj.fecha;
  if (ts) {
    return new Date(ts).getHours();
  }
  return 12;
};

export const getEventTimestamp = (obj) => {
  if (!obj) return 0;
  try {
    const fechaRaw = obj.reportData?.fechaRaw || obj.fechaRaw;
    const horaRaw = obj.reportData?.horaRaw || obj.horaRaw;
    
    if (fechaRaw && horaRaw) {
      // Create a valid ISO string e.g. "2026-08-12T19:30:00"
      const dateStr = `${fechaRaw}T${horaRaw}`;
      const time = new Date(dateStr).getTime();
      if (!isNaN(time)) return time;
    }
  } catch (err) {}

  const ts = obj.timestamp || obj.fechaHora || obj.fecha;
  if (ts) {
    const time = new Date(ts).getTime();
    if (!isNaN(time)) return time;
  }
  
  return 0;
};
