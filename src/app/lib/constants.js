// ──────────────────────────────────────────────────────────
// CONSTANTS & INITIAL DATA
// ──────────────────────────────────────────────────────────

export const CW = 1200;
export const CH = 750;
export const HR = 6; // Handle radius in px

export const INITIAL_USERS = [
  {
    id: 'usr-admin-01',
    name: 'Administrador Principal',
    email: 'admin@monitoreo.com',
    password: 'admin123',
    role: 'Administrador',
    department: 'Gerencia de Sala Situacional',
    status: 'Activo',
    createdAt: '2026-07-01',
  },
  {
    id: 'usr-analyst-01',
    name: 'María García',
    email: 'analista@monitoreo.com',
    password: 'analista123',
    role: 'Analista',
    department: 'Análisis de Redes Sociales',
    status: 'Activo',
    createdAt: '2026-07-10',
  },
  {
    id: 'usr-super-01',
    name: 'Carlos Mendoza',
    email: 'supervisor@monitoreo.com',
    password: 'supervisor123',
    role: 'Supervisor',
    department: 'Supervisión de Sala Situacional',
    status: 'Activo',
    createdAt: '2026-07-05',
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

export const INITIAL_MESSAGES = [
  {
    id: 'msg-101',
    chatId: 'usr-admin-01_usr-analyst-01',
    emisorId: 'usr-analyst-01',
    emisorNombre: 'María García',
    receptorId: 'usr-admin-01',
    mensaje: 'Hola Administrador, acabo de enviar el reporte de Juan Germán Roscio.',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    leido: true,
  },
  {
    id: 'msg-102',
    chatId: 'usr-admin-01_usr-analyst-01',
    emisorId: 'usr-admin-01',
    emisorNombre: 'Administrador Principal',
    receptorId: 'usr-analyst-01',
    mensaje: 'Excelente María, revisaremos la información oportunamente.',
    fecha: new Date(Date.now() - 3600000 * 1).toISOString(),
    leido: true,
  },
  {
    id: 'msg-103',
    chatId: 'usr-admin-01_usr-super-01',
    emisorId: 'usr-super-01',
    emisorNombre: 'Carlos Mendoza',
    receptorId: 'usr-admin-01',
    mensaje: 'Buenas tardes. Todo conforme con el flujo de supervisión.',
    fecha: new Date(Date.now() - 1800000).toISOString(),
    leido: false,
  },
];

export const EMPTY_REPORT = {
  municipio: '',
  fecha: '',
  hora: '',
  redSocial: 'INSTAGRAM',
  postTitle: '',
  usuario: '',
  area: 'INFRAESTRUCTURA',
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
  'SALUD',
  'EDUCACIÓN',
  'SERVICIOS PÚBLICOS',
  'TRANSPORTE',
  'SEGURIDAD',
  'ECONOMÍA',
  'ALIMENTACIÓN',
  'VIVIENDA',
  'INFRAESTRUCTURA',
  'DESARROLLO SOCIAL',
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
};
