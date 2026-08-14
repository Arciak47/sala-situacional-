"use client";

import CanvasEditor from '../components/CanvasEditor';
import StatsView from '../components/StatsView';
import ProfileView from '../components/ProfileView';
import MessagingView from '../components/MessagingView';
import AdminDashboard from '../components/AdminDashboard';
import SupervisorUsersView from '../components/SupervisorUsersView';
import ShiftReportView from '../components/ShiftReportView';
import ShiftHistoryView from '../components/ShiftHistoryView';
import SubmissionInboxView from '../components/SubmissionInboxView';

export default function SupervisorView({
  currentUser,
  users,
  activeTab,
  submissions,
  inboxFilter,
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  markAsRepeated,
  markAsReported,
  deleteSubmission,
  reportData,
  setReportData,
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
  auditLogs = [],
  handleBackupAndClear,
  shiftReports,
  loadDashboardStats,
  dashboardLoading,
}) {
  return (
    <div className="space-y-6">
      {/* ── HEADER ACCIONES GLOBALES ── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleBackupAndClear}
          className="flex items-center gap-2 py-2 px-4 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-md cursor-pointer"
        >
          📦 Cierre de Día (Respaldar y Limpiar)
        </button>
      </div>

      {/* ── REPORTE DE TURNO ── */}
      <div className={activeTab === 'shift' ? 'block' : 'hidden'}>
        <ShiftReportView submissions={submissions} users={users} currentUser={currentUser} />
      </div>

      <div className={activeTab === 'history' ? 'block' : 'hidden'}>
        <ShiftHistoryView
          reports={shiftReports}
          submissions={submissions}
          openSubmissionForReview={openSubmissionForReview}
      {/* ── DASHBOARD PRINCIPAL CON GRÁFICAS ── */}
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

      {/* ── BANDEJA (NUEVO DISEÑO) ── */}
      <div className={activeTab === 'inbox' ? 'block' : 'hidden'}>
        <SubmissionInboxView
          submissions={submissions}
          currentUser={currentUser}
          openSubmissionForReview={openSubmissionForReview}
          markAsReviewed={markAsReviewed}
          markAsRepeated={markAsRepeated}
          markAsReported={markAsReported}
          deleteSubmission={deleteSubmission}
          inboxFilter={inboxFilter}
          setInboxFilter={setInboxFilter}
          users={users}
        />
      </div>

      {/* ── HISTORIAL DE TURNOS ── */}
      <div className={activeTab === 'history' ? 'block' : 'hidden'}>
        <ShiftHistoryView
          reports={shiftReports}
          submissions={submissions}
          openSubmissionForReview={openSubmissionForReview}
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
        />
      </div>

      {/* ── GESTIÓN Y RENDIMIENTO DE ANALISTAS (USUARIOS) ── */}
      <div className={activeTab === 'users' ? 'block' : 'hidden'}>
        <SupervisorUsersView
          users={users}
          submissions={submissions}
          auditLogs={auditLogs}
        />
      </div>

      {/* ── ESTADÍSTICAS GLOBALES PARA SUPERVISOR ── */}
      <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
        <StatsView 
          currentUser={currentUser} 
          allStats={allStats} 
          loadDashboardStats={loadDashboardStats} 
          dashboardLoading={dashboardLoading} 
        />
      </div>

      {/* ── MI PERFIL ── */}
      <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          allStats={allStats}
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
        />
      </div>
    </div>
  );
}
