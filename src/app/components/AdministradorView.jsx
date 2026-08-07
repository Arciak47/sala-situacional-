"use client";

import { useState } from 'react';
import FormFields from '../components/FormFields';
import CanvasEditor from '../components/CanvasEditor';
import StatsView from '../components/StatsView';
import ProfileView from '../components/ProfileView';
import MessagingView from '../components/MessagingView';
import AdminDashboard from '../components/AdminDashboard';
import ShiftReportView from '../components/ShiftReportView';
import ShiftHistoryView from '../components/ShiftHistoryView';
import SubmissionInboxView from '../components/SubmissionInboxView';

export default function AdministradorView({
  activeTab,
  setActiveTab,
  users,
  currentUser,
  toggleStatus,
  deleteUser,
  setEditingUser,
  setShowCreateModal,
  auditLogs,
  reportData,
  setReportData,
  goToEditor,
  handleSubmitForm,
  submissions,
  inboxFilter,
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  markAsRepeated,
  markAsReported,
  deleteSubmission,
  elements,
  setElements,
  selId,
  setSelId,
  editingId,
  setEditingId,
  editText,
  setEditText,
  commitTextEdit,
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
  shiftReports,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* ── HEADER ACCIONES GLOBALES ── */}
      <div className="flex justify-end mb-4">
      </div>
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
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                📤 Enviar Reporte
              </button>
              <button
                onClick={goToEditor}
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                🎨 Ir al Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BANDEJA DE ENTRADA ── */}
      {activeTab === 'inbox' && (
        <SubmissionInboxView
          submissions={submissions}
          inboxFilter={inboxFilter}
          setInboxFilter={setInboxFilter}
          openSubmissionForReview={openSubmissionForReview}
          markAsReviewed={markAsReviewed}
          markAsRepeated={markAsRepeated}
          markAsReported={markAsReported}
          deleteSubmission={deleteSubmission}
        />
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
          editText={editText}
          setEditText={setEditText}
          commitTextEdit={commitTextEdit}
          imageCache={imageCache}
          setImageCache={setImageCache}
          setOverlayRect={setOverlayRect}
          selectedSubmission={selectedSubmission}
          saveSubmissionEdits={saveSubmissionEdits}
          markAsReviewed={markAsReviewed}
          markAsRepeated={markAsRepeated}
          markAsReported={markAsReported}
          handleImageUpload={handleImageUpload}
        />
      )}

      {/* ── REPORTE DE TURNO ── */}
      {activeTab === 'shift' && (
        <ShiftReportView submissions={submissions} users={users} currentUser={currentUser} />
      )}

      {/* ── HISTORIAL DE TURNOS ── */}
      {activeTab === 'history' && (
        <ShiftHistoryView
          reports={shiftReports}
          submissions={submissions}
          openSubmissionForReview={openSubmissionForReview}
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
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white cursor-pointer whitespace-nowrap"
              >
                + Crear Usuario
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto custom-scrollbar shadow-xl">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold border-b dark:border-slate-800">
                <tr>
                  <th className="py-4 px-6">Usuario & Sala</th>
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
                      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.salaCodigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.salaEtiqueta?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id}>
                      <td className="py-4 px-6">
                        {u.salaEtiqueta ? (
                          <div className="font-black text-amber-600 dark:text-amber-400 font-mono text-xs">
                            🏷️ {u.salaEtiqueta}
                          </div>
                        ) : (
                          <div className="font-bold">{u.name}</div>
                        )}
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          @{u.username || u.email?.split('@')[0]} • <span className="font-normal">{u.email}</span>
                        </div>
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
                          onClick={() => setEditingUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 cursor-pointer disabled:opacity-50"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => toggleStatus(u.id)}
                          disabled={u.id === currentUser.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                        >
                          {u.status === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          disabled={u.id === currentUser.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 cursor-pointer disabled:opacity-50"
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
