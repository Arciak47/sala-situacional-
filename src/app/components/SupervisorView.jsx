"use client";

import React, { useState } from 'react';
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
  handleMarkForCorrection,
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
  onClearChat,
  onMarkAsRead,
  auditLogs = [],
  handleBackupAndClear,
  shiftReports,
  loadDashboardStats,
  dashboardLoading,
}) {
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPdfSalas, setIsDownloadingPdfSalas] = useState(false);
  const [reportShift, setReportShift] = useState('all');

  const handleDownloadPdf = async () => {
    if (!reportStartDate || !reportEndDate) {
      alert("Por favor selecciona una fecha de inicio y fin para el reporte.");
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/generate-pdf?startDate=${reportStartDate}&endDate=${reportEndDate}&shift=${reportShift}`);
      if (!response.ok) throw new Error("Error al generar PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Analistas_${reportStartDate}_al_${reportEndDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(err) {
      console.error(err);
      alert("Error al descargar el PDF. Asegúrate de que el servidor está corriendo correctamente.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPdfSalas = async () => {
    if (!reportStartDate || !reportEndDate) {
      alert("Por favor selecciona una fecha de inicio y fin para el reporte.");
      return;
    }
    setIsDownloadingPdfSalas(true);
    try {
      const response = await fetch(`/api/generate-pdf-salas?startDate=${reportStartDate}&endDate=${reportEndDate}&shift=${reportShift}`);
      if (!response.ok) throw new Error("Error al generar PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Salas_${reportStartDate}_al_${reportEndDate}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(err) {
      console.error(err);
      alert("Error al descargar el PDF. Asegúrate de que el servidor está corriendo correctamente.");
    } finally {
      setIsDownloadingPdfSalas(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ACCIONES GLOBALES ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <input
            type="date"
            value={reportStartDate}
            onChange={e => setReportStartDate(e.target.value)}
            className="text-xs p-1 border border-slate-300 rounded"
            title="Fecha Inicio"
          />
          <span className="text-slate-500 text-xs">hasta</span>
          <input
            type="date"
            value={reportEndDate}
            onChange={e => setReportEndDate(e.target.value)}
            className="text-xs p-1 border border-slate-300 rounded"
            title="Fecha Fin"
          />
          <select
            value={reportShift}
            onChange={e => setReportShift(e.target.value)}
            className="text-xs p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            title="Seleccionar Turno"
          >
            <option value="all">Jornada Completa</option>
            <option value="t1">T1 (07am - 01pm)</option>
            <option value="t2">T2 (01pm - 07pm)</option>
            <option value="t3">T3 (07pm - 12am)</option>
          </select>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className={`flex items-center gap-2 py-1.5 px-3 rounded text-xs font-bold text-white shadow-sm transition-colors ${
              isDownloadingPdf ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            }`}
          >
            {isDownloadingPdf ? '⏳...' : '📄 Reporte Analistas'}
          </button>
          <button
            onClick={handleDownloadPdfSalas}
            disabled={isDownloadingPdfSalas}
            className={`flex items-center gap-2 py-1.5 px-3 rounded text-xs font-bold text-white shadow-sm transition-colors ${
              isDownloadingPdfSalas ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            {isDownloadingPdfSalas ? '⏳...' : '🏢 Reporte Salas'}
          </button>
        </div>

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
        />
      </div>
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
          handleMarkForCorrection={handleMarkForCorrection}
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
      {activeTab === 'messaging' && (
        <MessagingView
          currentUser={currentUser}
          users={users}
          messages={messages}
          onSendMessage={onSendMessage}
          onClearChat={onClearChat}
          onMarkAsRead={onMarkAsRead}
        />
      )}
    </div>
  );
}
