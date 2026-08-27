"use client";

import { useState, useEffect } from 'react';
import { ROLE_BADGES } from '../lib/constants';
import { fetchUserProfileStats, fetchGlobalStats } from '../lib/firestoreService';

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

export default function ProfileView({
  currentUser,
  onUpdateProfile,
  stats,
  allStats,
  usersCount,
  auditLogsCount,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [username, setUsername] = useState(currentUser?.username || '');
  const [nombres, setNombres] = useState(currentUser?.nombres || currentUser?.name?.split(' ')[0] || '');
  const [apellidos, setApellidos] = useState(currentUser?.apellidos || currentUser?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(currentUser?.fechaNacimiento || '');
  const [edad, setEdad] = useState(currentUser?.edad || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const role = currentUser?.role || 'Analista';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Analista;

  // ── Load accurate stats directly from Firestore ──
  const [profileStats, setProfileStats] = useState(null);
  const [profileStatsLoading, setProfileStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      setProfileStatsLoading(true);
      try {
        if (role === 'Analista') {
          const s = await fetchUserProfileStats(currentUser);
          if (!cancelled && s) setProfileStats(s);
        } else {
          // Supervisors/Admins: load global stats + their own personal stats
          const [globalData, personalData] = await Promise.all([
            fetchGlobalStats(),
            fetchUserProfileStats(currentUser),
          ]);
          if (!cancelled) {
            setProfileStats({
              ...(globalData || {}),
              personal: personalData,
            });
          }
        }
      } catch (err) {
        console.error('Error loading profile stats:', err);
      }
      if (!cancelled) setProfileStatsLoading(false);
    };
    if (currentUser) loadStats();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const handleBirthDateChange = (e) => {
    const val = e.target.value;
    setFechaNacimiento(val);
    const computedAge = calcAge(val);
    if (computedAge !== '') setEdad(String(computedAge));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !nombres.trim() || !apellidos.trim() || !password.trim()) {
      setErrorMsg('El usuario, nombres, apellidos y contraseña son obligatorios.');
      return;
    }

    const fullName = `${nombres.trim()} ${apellidos.trim()}`;

    // Preserve room code if already exists
    let updatedSalaEtiqueta = currentUser.salaEtiqueta;
    if (currentUser.salaCodigo) {
      updatedSalaEtiqueta = `${currentUser.salaCodigo} - ${fullName}`;
    }

    const updatedUser = {
      ...currentUser,
      username: username.trim().toLowerCase(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      name: fullName,
      salaEtiqueta: updatedSalaEtiqueta || currentUser.salaEtiqueta,
      email: email.trim(),
      password: password.trim(),
      fechaNacimiento,
      edad,
      department: department.trim(),
    };

    onUpdateProfile(updatedUser);
    setIsEditing(false);
    setSuccessMsg('✅ ¡Perfil actualizado correctamente!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── HEADER CARD ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="h-32 bg-gradient-to-r from-red-600 via-red-700 to-amber-600 relative">
          <div className="absolute -bottom-10 left-6 sm:left-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-2xl">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-inner">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 pb-6 px-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {currentUser?.salaEtiqueta || currentUser?.name}
              <span
                className={`text-xs font-bold ${badge.color} px-2.5 py-1 rounded-full`}
              >
                {badge.icon} {role}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-mono">
              @{currentUser?.username || 'usuario'} • {currentUser?.email} • {currentUser?.department}
            </p>
          </div>

          {currentUser?.role === 'Administrador' ? (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="self-start sm:self-center px-4 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              {isEditing ? '✕ Cancelar' : '✏️ Editar Mi Perfil'}
            </button>
          ) : (
            <div className="self-start sm:self-center px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5">
              <span>🔒</span> Solo el Administrador puede editar el perfil
            </div>
          )}
        </div>
      </div>

      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* ── EDIT FORM OR DETAILS GRID ── */}
      {isEditing && currentUser?.role === 'Administrador' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="border-b dark:border-slate-800 pb-3 mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              ✏️ Editar Mis Datos Personales y Acceso
            </h3>
            <p className="text-xs text-slate-500">
              Modifica la información de tu cuenta personal.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de Usuario (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={handleBirthDateChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Departamento / Unidad
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-4 border-t dark:border-slate-800 flex gap-3">
              <button
                type="submit"
                className="py-2.5 px-6 rounded-full text-xs font-bold uppercase text-white bg-red-600 hover:bg-red-700 cursor-pointer shadow-md"
              >
                💾 Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-6 rounded-full text-xs font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* USER DATA GRID */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-3 flex items-center gap-2">
              <span>📋</span> Datos de la Cuenta
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Identificador Sala:</span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                  {currentUser?.salaEtiqueta || currentUser?.salaCodigo || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Nombre de Usuario:</span>
                <span className="font-bold font-mono text-red-600 dark:text-red-400">
                  @{currentUser?.username || 'admin'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Nombre Completo:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.name}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Edad / Nacimiento:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.edad ? `${currentUser.edad} años` : 'N/A'} {currentUser?.fechaNacimiento ? `(${currentUser.fechaNacimiento})` : ''}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Correo Electrónico:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.email}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Rol Asignado:</span>
                <span className={`font-bold ${badge.color.split(' ')[0]}`}>
                  {role}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Departamento:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.department}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-semibold">Fecha de Creación:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.createdAt || '2026-07-01'}
                </span>
              </div>
            </div>
          </div>

          {/* ROLE ACTIVITY SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b dark:border-slate-800 pb-3 flex items-center gap-2">
              <span>📈</span> Resumen de Actividad
            </h3>

            {profileStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
              </div>
            ) : profileStats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-slate-500 text-[11px] font-semibold">
                      Total Reportes
                    </div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-500 mt-1">
                      {role === 'Analista' ? profileStats.total : (profileStats.totalGlobal ?? profileStats.total ?? 0)}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-slate-500 text-[11px] font-semibold">
                      Pendientes
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">
                      {role === 'Analista' ? profileStats.pending : (profileStats.pendingGlobal ?? profileStats.pending ?? 0)}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-slate-500 text-[11px] font-semibold">
                      Revisados
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                      {role === 'Analista' ? profileStats.reviewed : (profileStats.reviewedGlobal ?? profileStats.reviewed ?? 0)}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    <div className="text-slate-500 text-[11px] font-semibold">
                      {role === 'Analista' ? 'Enviados Hoy' : 'Recibidos Hoy'}
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                      {role === 'Analista' ? profileStats.today : (profileStats.todayGlobal ?? profileStats.today ?? 0)}
                    </div>
                  </div>

                  {role === 'Analista' && (
                    <>
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <div className="text-slate-500 text-[11px] font-semibold">
                          Esta Semana
                        </div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                          {profileStats.week ?? 0}
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <div className="text-slate-500 text-[11px] font-semibold">
                          Este Mes
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                          {profileStats.month ?? 0}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-2 bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl border border-orange-200/60 dark:border-orange-900/50">
                    <div className="text-orange-600 dark:text-orange-400 text-[11px] font-semibold">
                      🔁 Repetidas
                    </div>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                      {role === 'Analista' ? (profileStats.repeated ?? 0) : (profileStats.repeatedGlobal ?? profileStats.repeated ?? 0)}
                    </div>
                  </div>
                </div>

                {role === 'Analista' && (profileStats.repeated || 0) > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total subidos:</span>
                      <span className="font-black text-slate-900 dark:text-white">{profileStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">✅ Revisados:</span>
                      <span className="font-black text-emerald-600">{profileStats.reviewed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">🔁 Repetidas:</span>
                      <span className="font-black text-orange-600">{profileStats.repeated || 0}</span>
                    </div>
                    <div className="pt-1 text-[11px] text-orange-600 dark:text-orange-400 font-bold border-t border-orange-200 dark:border-orange-900/50">
                      ⚠️ Subiste {profileStats.total} reporte{profileStats.total !== 1 ? 's' : ''}, {profileStats.reviewed || 0} revisado{(profileStats.reviewed || 0) !== 1 ? 's' : ''} y {profileStats.repeated} marcado{(profileStats.repeated || 0) !== 1 ? 's' : ''} como repetido{(profileStats.repeated || 0) !== 1 ? 's' : ''}.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 py-6">
                No hay datos disponibles.
              </div>
            )}

            {role === 'Administrador' && (
              <div className="pt-2">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-500">
                    Historial de auditoría registrado:
                  </span>{' '}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {auditLogsCount || 0} registros
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
