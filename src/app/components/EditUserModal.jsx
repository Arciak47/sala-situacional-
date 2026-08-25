"use client";

import { useState, useEffect } from 'react';
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

export default function EditUserModal({
  editingUser,
  setEditingUser,
  onSaveUser,
  users = [],
}) {
  const [username, setUsername] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [sala, setSala] = useState('Sala Comuna');
  const [role, setRole] = useState('Analista');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [edad, setEdad] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('Activo');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(editingUser.username || '');
      setNombres(editingUser.nombres || editingUser.name?.split(' ')[0] || '');
      setApellidos(editingUser.apellidos || editingUser.name?.split(' ').slice(1).join(' ') || '');
      setSala(editingUser.sala || SALAS_DISPONIBLES[0]);
      setRole(editingUser.role || 'Analista');
      setPassword(editingUser.password || '');
      setEmail(editingUser.email || '');
      setCedula(editingUser.cedula || '');
      setFechaNacimiento(editingUser.fechaNacimiento || '');
      setEdad(editingUser.edad || '');
      setCreatedAt(editingUser.createdAt || new Date().toISOString().split('T')[0]);
      setDepartment(editingUser.department || '');
      setStatus(editingUser.status || 'Activo');
      setErrorMsg('');
    }
  }, [editingUser]);

  if (!editingUser) return null;

  const handleBirthDateChange = (e) => {
    const val = e.target.value;
    setFechaNacimiento(val);
    const computedAge = calcAge(val);
    if (computedAge !== '') setEdad(String(computedAge));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !nombres.trim() || !apellidos.trim() || !password.trim()) {
      setErrorMsg('El nombre de usuario, nombres, apellidos y contraseña son obligatorios.');
      return;
    }

    const usernameClean = username.trim().toLowerCase();
    const emailClean = email.trim().toLowerCase();

    // Check duplicate username if changed
    if (
      users.some(
        (u) =>
          u.id !== editingUser.id &&
          ((u.username && u.username.toLowerCase() === usernameClean) ||
           (u.email && u.email.toLowerCase() === emailClean && emailClean !== ''))
      )
    ) {
      setErrorMsg('Ya existe otro usuario registrado con este nombre de usuario o correo.');
      return;
    }

    const fullName = `${nombres.trim()} ${apellidos.trim()}`;

    // Recalculate room code if room or role changed, otherwise preserve
    let finalSalaCodigo = editingUser.salaCodigo;
    let finalSalaEtiqueta = editingUser.salaEtiqueta;

    if (editingUser.sala !== sala || editingUser.role !== role || !finalSalaCodigo) {
      const existingInSalaRoleCount = users.filter(
        (u) => u.id !== editingUser.id && u.sala === sala && u.role === role
      ).length;
      const numStr = String(existingInSalaRoleCount + 1).padStart(2, '0');
      finalSalaCodigo = `${sala} ${role} ${numStr}`;
      finalSalaEtiqueta = `${finalSalaCodigo} - ${fullName}`;
    } else {
      finalSalaEtiqueta = `${finalSalaCodigo} - ${fullName}`;
    }

    const updatedUser = {
      ...editingUser,
      username: usernameClean,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      name: fullName,
      sala,
      salaCodigo: finalSalaCodigo,
      salaEtiqueta: finalSalaEtiqueta,
      password: password.trim(),
      email: emailClean,
      cedula: cedula.trim(),
      fechaNacimiento,
      edad,
      createdAt,
      department: department.trim(),
      role,
      status,
    };

    onSaveUser(updatedUser);
    setEditingUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-5 my-8">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              ✏️ Editar Usuario: {editingUser.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Modifica la información personal, credenciales, sala y permisos.
            </p>
          </div>
          <button
            onClick={() => setEditingUser(null)}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-base font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-bold flex items-center gap-2">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SALA Y ROL */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              🏛️ Asignación de Sala y Rol
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sala de Pertenencia *
                </label>
                <select
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
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
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={editingUser.role === 'Administrador'}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold disabled:opacity-60"
                >
                  <option value="Analista">Analista</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Observador">Observador</option>
                  {editingUser.role === 'Administrador' && (
                    <option value="Administrador">Administrador Principal</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estado de la Cuenta *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={editingUser.role === 'Administrador'}
                  className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold disabled:opacity-60"
                >
                  <option value="Activo">🟢 Activo</option>
                  <option value="Inactivo">🔴 Inactivo</option>
                </select>
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña *
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
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
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
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
                  value={fechaNacimiento}
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
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Creación Perfil
                </label>
                <input
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cédula de Identidad
                </label>
                <input
                  type="text"
                  placeholder="ej: V-12345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold"
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Departamento / Unidad
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
