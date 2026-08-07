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
      {activeTab === 'shift' && (
        <ShiftReportView submissions={submissions} users={users} currentUser={currentUser} />
      )}

      {/* ── HISTORIAL DE TURNOS ── */}
      {activeTab === 'history' && (
        <ShiftHistoryView reports={shiftReports} />
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

      {/* ── GESTIÓN Y RENDIMIENTO DE ANALISTAS (USUARIOS) ── */}
      {activeTab === 'users' && (
        <SupervisorUsersView
          users={users}
          submissions={submissions}
          auditLogs={auditLogs}
        />
      )}

      {/* ── ESTADÍSTICAS GLOBALES PARA SUPERVISOR ── */}
      {activeTab === 'stats' && (
        <StatsView currentUser={currentUser} allStats={allStats} />
      )}

      {/* ── MI PERFIL ── */}
      {activeTab === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          allStats={allStats}
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
