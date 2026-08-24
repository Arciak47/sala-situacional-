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
  loadDashboardStats,
  dashboardLoading,
  onUpdateProfile,
  messages,
  onSendMessage,
  onMarkAsRead,
  shiftReports,
  isObserver,
  handleMarkForCorrection
}) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* ── HEADER ACCIONES GLOBALES ── */}
      <div className="flex justify-end mb-4">
      </div>
      {/* ── FORMULARIO ── */}
      <div className={activeTab === 'forms' ? 'block' : 'hidden'}>
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
            </div>
          </div>
        </div>
      </div>

      {/* ── DASHBOARD ── */}
      <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
        <AdminDashboard
          users={users}
          currentUser={currentUser}
          auditLogs={auditLogs}
          submissions={submissions}
          allStats={allStats}
          loadDashboardStats={loadDashboardStats}
          dashboardLoading={dashboardLoading}
        />
      </div>

      {/* ── BANDEJA DE ENTRADA ── */}
      <div className={activeTab === 'inbox' ? 'block' : 'hidden'}>
        <SubmissionInboxView
          submissions={submissions}
          currentUser={currentUser}
          inboxFilter={inboxFilter}
          setInboxFilter={setInboxFilter}
          openSubmissionForReview={openSubmissionForReview}
          markAsReviewed={markAsReviewed}
          markAsRepeated={markAsRepeated}
          markAsReported={markAsReported}
          handleMarkForCorrection={handleMarkForCorrection}
          deleteSubmission={deleteSubmission}
          users={users}
          isObserver={isObserver}
        />
      </div>

      {/* ── EDITOR TIPO CANVA ── */}
      <div className={activeTab === 'editor' ? 'block' : 'hidden'}>
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
          isObserver={isObserver}
          handleMarkForCorrection={handleMarkForCorrection}
        />
      </div>

      {/* ── REPORTE DE TURNO ── */}
      <div className={activeTab === 'shift' ? 'block' : 'hidden'}>
        <ShiftReportView submissions={submissions} users={users} currentUser={currentUser} />
      </div>

      {/* ── HISTORIAL DE TURNOS ── */}
      <div className={activeTab === 'history' ? 'block' : 'hidden'}>
        <ShiftHistoryView
          reports={shiftReports}
          submissions={submissions}
          openSubmissionForReview={openSubmissionForReview}
        />
      </div>

      {/* ── ESTADÍSTICAS GLOBALES PARA ADMINISTRADOR ── */}
      <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
        <StatsView 
          currentUser={currentUser} 
          allStats={allStats} 
          loadDashboardStats={loadDashboardStats} 
          dashboardLoading={dashboardLoading} 
        />
      </div>

      {/* ── USUARIOS ── */}
      <div className={activeTab === 'users' ? 'block' : 'hidden'}>
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">👥 Gestión de Usuarios</h2>
              <p className="text-sm text-slate-500 mt-1">Administra el acceso y roles de los usuarios del sistema.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 text-sm px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isObserver && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  + Nuevo
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users
              .filter(u => 
                (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(u => (
              <div key={u.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{u.name}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{u.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'Administrador' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        u.role === 'Supervisor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                      {u.salaEtiqueta && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">
                          {u.salaEtiqueta}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isObserver && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                        title="Editar Usuario"
                      >
                        ✏️
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                          title="Eliminar Usuario"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
                  <span className="text-xs font-bold text-slate-500">Estado</span>
                  {!isObserver ? (
                    <button
                      onClick={() => toggleStatus(u.id)}
                      disabled={u.id === currentUser?.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                        u.status === 'Activo' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'
                      } ${u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          u.status === 'Activo' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.status === 'Activo' ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
                      {u.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AUDITORÍA ── */}
      <div className={activeTab === 'logs' ? 'block' : 'hidden'}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="border-b dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              🛡️ Registro de Auditoría
            </h3>
            <p className="text-xs text-slate-500">
              Visualiza el historial completo de acciones realizadas por los usuarios.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Fecha/Hora</th>
                  <th className="p-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Usuario</th>
                  <th className="p-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Acción</th>
                  <th className="p-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-slate-500 text-sm">
                      No hay registros de auditoría aún.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {log.user}
                      </td>
                      <td className="p-3 text-xs">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── DASHBOARD PRINCIPAL CON GRÁFICAS ── */}
      <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
        <AdminDashboard
          currentUser={currentUser}
          allStats={allStats}
          submissions={submissions}
          users={users}
          auditLogs={auditLogs}
          messages={messages}
        />
      </div>

      {/* ── MI PERFIL ── */}
      <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          allStats={allStats}
          usersCount={users.length}
          auditLogsCount={auditLogs.length}
        />
      </div>

      {/* ── MENSAJERÍA (CHAT INSTITUCIONAL) ── */}
      <div className={activeTab === 'messaging' ? 'block' : 'hidden'}>
        <MessagingView
          currentUser={currentUser}
          users={users}
          messages={messages}
          onSendMessage={onSendMessage}
          onMarkAsRead={onMarkAsRead}
          isObserver={isObserver}
        />
      </div>
    </div>
  );
}
