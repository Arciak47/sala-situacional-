"use client";

import { SALAS_DISPONIBLES } from '../lib/constants';

function calcAge(birthDateStr) {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

export default function UserModal({
  showCreateModal,
  setShowCreateModal,
  formData,
  setFormData,
  modalError,
  handleCreateUser,
  users = [],
}) {
  if (!showCreateModal) return null;

  const hasAdmin = users.some((u) => u.role === 'Administrador');
  const selectedSala = formData.sala || SALAS_DISPONIBLES[0];
  const selectedRole = (hasAdmin && formData.role === 'Administrador') ? 'Analista' : (formData.role || 'Analista');

  // Count existing users matching BOTH the selected room and the selected role
  const existingInSalaRoleCount = users.filter(
    (u) => u.sala === selectedSala && u.role === selectedRole
  ).length;

  const nextNumStr = String(existingInSalaRoleCount + 1).padStart(2, '0');
  const salaCodigoPreview = `${selectedSala} ${selectedRole} ${nextNumStr}`;
  const fullNamePreview = [formData.nombres, formData.apellidos].filter(Boolean).join(' ');
  const salaEtiquetaPreview = fullNamePreview
    ? `${salaCodigoPreview} - ${fullNamePreview}`
    : `${salaCodigoPreview} - [Nombre y Apellido]`;

  const handleBirthDateChange = (e) => {
    const val = e.target.value;
    const computedAge = calcAge(val);
    setFormData({
      ...formData,
      fechaNacimiento: val,
      edad: computedAge !== '' ? String(computedAge) : formData.edad,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-5 my-8">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              👤 Crear Nuevo Usuario
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Secuencia independiente asignada por Rol y Sala.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(false)}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-base font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {modalError && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-bold flex items-center gap-2">
            ⚠️ {modalError}
          </div>
        )}

        {/* LIVE ROOM & ROLE PREVIEW BANNER */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-4.5 rounded-2xl text-white shadow-lg space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex justify-between items-center">
            <span>🏷️ Identificador Único Asignado (Rol + Sala)</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[9px]">
              {existingInSalaRoleCount} {selectedRole}s en {selectedSala}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black tracking-wide font-mono">
            {salaEtiquetaPreview}
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          {/* SELECCIÓN DE SALA Y ROL */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              🏛️ Asignación de Sala y Rol
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sala de Pertenencia *
                </label>
                <select
                  value={selectedSala}
                  onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                >
                  {SALAS_DISPONIBLES.map((salaOption) => (
                    <option key={salaOption} value={salaOption}>
                      🏢 {salaOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rol Asignado *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                >
                  <option value="Analista">Analista</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Observador">Observador</option>
                  <option value="Administrador" disabled={hasAdmin}>
                    {hasAdmin ? 'Administrador (Límite: 1 Admin alcanzado)' : 'Administrador'}
                  </option>
                </select>
                {hasAdmin && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                    🔒 El sistema permite solo 1 Administrador Principal.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CREDENCIALES PRINCIPALES */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
              🔑 Credenciales de Acceso
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: arangel"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña Inicial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Clave123*"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
              📋 Información Personal
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Anderson"
                  value={formData.nombres || ''}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Rangel"
                  value={formData.apellidos || ''}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formData.fechaNacimiento || ''}
                  onChange={handleBirthDateChange}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Edad (Años)
                </label>
                <input
                  type="number"
                  placeholder="ej: 28"
                  value={formData.edad || ''}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Creación Perfil
                </label>
                <input
                  type="date"
                  value={formData.createdAt || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* CONTACTO Y DEPARTAMENTO */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              ✉️ Contacto y Unidad
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="ej: arangel@monitoreo.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Departamento / Unidad
                </label>
                <input
                  type="text"
                  placeholder="ej: Monitoreo en Vivo"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 rounded-full text-xs font-black uppercase text-white bg-red-600 hover:bg-red-700 cursor-pointer shadow-lg shadow-red-600/30"
            >
              💾 Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
