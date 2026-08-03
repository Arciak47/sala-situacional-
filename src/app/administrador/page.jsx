"use client";

import { useState } from 'react';
import FormFields from '../components/FormFields';
import CanvasEditor from '../components/CanvasEditor';
import StatsView from '../components/StatsView';
import ProfileView from '../components/ProfileView';
import MessagingView from '../components/MessagingView';
import AdminDashboard from '../components/AdminDashboard';
import ShiftReportView from '../components/ShiftReportView';

export default function AdministradorView({
  activeTab,
  setActiveTab,
  users,
  currentUser,
  toggleStatus,
  deleteUser,
  setShowCreateModal,
  auditLogs,
  reportData,
  setReportData,
  handleSubmitForm,
  submissions,
  inboxFilter,
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  deleteSubmission,
  elements,
  setElements,
  selId,
  setSelId,
  editingId,
  setEditingId,
  imageCache,
  setImageCache,
  setOverlayRect,
  selectedSubmission,
  saveSubmissionEdits,
  handleImageUpload,
  allStats,
  onUpdateProfile,
  messages,
  onSendMessage,
  onMarkAsRead,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* ── FORMULARIO ── */}
      {activeTab === 'forms' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="border-b dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                📋 Formulario de Reporte
              </h3>
              <p className="text-xs text-slate-500">
                Completa los campos del reporte.
              </p>
            </div>
            <FormFields
              data={reportData}
              setData={setReportData}
              onImageUpload={handleImageUpload}
            />
            <div className="mt-6 pt-4 border-t dark:border-slate-800 flex gap-3">
              <button
                onClick={handleSubmitForm}
                className="flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                📤 Enviar Reporte
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className="flex-1 py-3 px-6 rounded-full text-xs font-bold uppercase bg-slate-800 text-white cursor-pointer hover:bg-slate-700"
              >
                🎨 Ir al Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BANDEJA DE ENTRADA ── */}
      {activeTab === 'inbox' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b dark:border-slate-800 pb-3 mb-4 gap-3">
              <div>
                <h3 className="text-lg font-black">📥 Bandeja de Formularios</h3>
                <p className="text-xs text-slate-500">
                  Formularios enviados por los Analistas
                </p>
              </div>
              <div className="flex gap-2">
                {['Todos', 'pendiente', 'revisado'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setInboxFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                      inboxFilter === f
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f === 'Todos'
                      ? '📋 Todos'
                      : f === 'pendiente'
                      ? '⏳ Pendientes'
                      : '✅ Revisados'}
                  </button>
                ))}
              </div>
            </div>

            {submissions.filter(
              (s) => inboxFilter === 'Todos' || s.status === inboxFilter
            ).length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-12">
                No hay formularios en esta categoría.
              </p>
            ) : (
              <div className="space-y-3">
                {submissions
                  .filter((s) => inboxFilter === 'Todos' || s.status === inboxFilter)
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-red-300 dark:hover:border-red-900 transition-all gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            sub.status === 'pendiente'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        ></span>
                        <div>
                          <div className="text-xs font-bold">
                            {sub.reportData.municipio} — {sub.reportData.redSocial}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Por:{' '}
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {sub.analystName}
                            </span>{' '}
                            • {new Date(sub.timestamp).toLocaleDateString('es-ES')}{' '}
                            {new Date(sub.timestamp).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          {sub.editedBy && (
                            <div className="text-[9px] text-blue-500">
                              ✏️ Editado por {sub.editedBy}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            sub.status === 'pendiente'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {sub.status === 'pendiente' ? '⏳ PENDIENTE' : '✅ REVISADO'}
                        </span>
                        <button
                          onClick={() => openSubmissionForReview(sub)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                        >
                          🎨 Editar en Canvas
                        </button>
                        {sub.status === 'pendiente' && (
                          <button
                            onClick={() => markAsReviewed(sub.id)}
                            className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border dark:border-emerald-900 cursor-pointer"
                          >
                            ✅ Revisado
                          </button>
                        )}
                        <button
                          onClick={() => deleteSubmission && deleteSubmission(sub.id)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 cursor-pointer transition-all"
                          title="Eliminar reporte permanentemente"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDITOR TIPO CANVA ── */}
      {activeTab === 'editor' && (
        <CanvasEditor
          reportData={reportData}
          setReportData={setReportData}
          elements={elements}
          setElements={setElements}
          selId={selId}
          setSelId={setSelId}
          editingId={editingId}
          setEditingId={setEditingId}
          imageCache={imageCache}
          setImageCache={setImageCache}
          setOverlayRect={setOverlayRect}
          selectedSubmission={selectedSubmission}
          saveSubmissionEdits={saveSubmissionEdits}
          markAsReviewed={markAsReviewed}
          handleImageUpload={handleImageUpload}
        />
      )}

      {/* ── ESTADÍSTICAS GLOBALES PARA ADMINISTRADOR ── */}
      {activeTab === 'stats' && (
        <StatsView currentUser={currentUser} allStats={allStats} />
      )}

      {/* ── USUARIOS ── */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">👥 Gestión de Usuarios</h2>
              <p className="text-xs text-slate-500">Administra roles del sistema</p>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="py-2.5 px-6 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer whitespace-nowrap"
              >
                + Crear Usuario
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar shadow-xl">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-4">Departamento</th>
                  <th className="py-4 px-4">Rol</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id}>
                      <td className="py-4 px-6">
                        <div className="font-bold">{u.name}</div>
                        <div className="text-slate-500 text-[10px]">{u.email}</div>
                      </td>
                      <td className="py-4 px-4">{u.department}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            u.role === 'Administrador'
                              ? 'bg-red-100 text-red-700'
                              : u.role === 'Supervisor'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`font-bold ${
                            u.status === 'Activo'
                              ? 'text-emerald-600'
                              : 'text-slate-400'
                          }`}
                        >
                          ● {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          disabled={u.id === currentUser.id}
                          className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-xs font-bold cursor-pointer disabled:opacity-40"
                        >
                          {u.status === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          disabled={u.id === currentUser.id}
                          className="px-3 py-1 rounded-full bg-red-50 text-xs font-bold text-red-700 cursor-pointer disabled:opacity-40 hover:bg-red-100"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AUDITORÍA ── */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-black border-b dark:border-slate-800 pb-3 mb-4">
            📜 Historial de Auditoría
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 uppercase border-b dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Fecha/Hora</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {auditLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-4 text-slate-500">{l.timestamp}</td>
                    <td className="py-3 px-4 text-red-600 font-bold">{l.user}</td>
                    <td className="py-3 px-4 font-sans font-semibold">{l.action}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DASHBOARD PRINCIPAL CON GRÁFICAS ── */}
      {activeTab === 'dashboard' && (
        <AdminDashboard
          currentUser={currentUser}
          allStats={allStats}
          submissions={submissions}
          users={users}
          auditLogs={auditLogs}
          messages={messages}
        />
      )}

      {/* ── MI PERFIL ── */}
      {activeTab === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          allStats={allStats}
          usersCount={users.length}
          auditLogsCount={auditLogs.length}
        />
      )}

      {/* ── MENSAJERÍA (CHAT INSTITUCIONAL) ── */}
      {activeTab === 'messaging' && (
        <MessagingView
          currentUser={currentUser}
          users={users}
          messages={messages}
          onSendMessage={onSendMessage}
          onMarkAsRead={onMarkAsRead}
        />
      )}
    </div>
  );
}
