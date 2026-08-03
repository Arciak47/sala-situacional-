"use client";

import { useState } from 'react';
import { ROLE_BADGES } from '../lib/constants';

export default function ProfileView({
  currentUser,
  onUpdateProfile,
  stats,
  allStats,
  usersCount,
  auditLogsCount,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const role = currentUser?.role || 'Analista';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.Analista;

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('El nombre, correo y contraseña son obligatorios.');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
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
              {currentUser?.name}
              <span
                className={`text-xs font-bold ${badge.color} px-2.5 py-1 rounded-full`}
              >
                {badge.icon} {role}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {currentUser?.email} • {currentUser?.department}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="self-start sm:self-center px-4 py-2 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            {isEditing ? '✕ Cancelar' : '✏️ Editar Perfil'}
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* ── EDIT FORM OR DETAILS GRID ── */}
      {isEditing ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="border-b dark:border-slate-800 pb-3 mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              ✏️ Editar Datos Personales
            </h3>
            <p className="text-xs text-slate-500">
              Modifica la información de tu cuenta.
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
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
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
                <span className="text-slate-500 font-semibold">Nombre Completo:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser?.name}
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

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">Estado de la Cuenta:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ● {currentUser?.status || 'Activo'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 font-semibold">ID de Usuario:</span>
                <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                  {currentUser?.id}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-semibold">Fecha de Registro:</span>
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

            {role === 'Analista' && stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Total Reportes
                  </div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-500 mt-1">
                    {stats.total}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Enviados Hoy
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">
                    {stats.today}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Esta Semana
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                    {stats.week}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Este Mes
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                    {stats.month}
                  </div>
                </div>
              </div>
            )}

            {(role === 'Supervisor' || role === 'Administrador') && allStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Total Formularios
                  </div>
                  <div className="text-2xl font-black text-red-600 dark:text-red-500 mt-1">
                    {allStats.totalGlobal}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Pendientes
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1">
                    {allStats.pendingGlobal}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    Revisados
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1">
                    {allStats.reviewedGlobal}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-500 text-[11px] font-semibold">
                    {role === 'Administrador' ? 'Usuarios Sistema' : 'Recibidos Hoy'}
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                    {role === 'Administrador' ? usersCount : allStats.todayGlobal}
                  </div>
                </div>
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
