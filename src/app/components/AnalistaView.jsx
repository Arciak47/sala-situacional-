"use client";

import { useState } from 'react';

import FormFields from '../components/FormFields';
import StatsView from '../components/StatsView';
import ProfileView from '../components/ProfileView';
import MessagingView from '../components/MessagingView';
import AdminDashboard from '../components/AdminDashboard';
import ShiftReportView from '../components/ShiftReportView';

export default function AnalistaView({
  currentUser,
  users,
  activeTab,
  reportData,
  setReportData,
  goToEditor,
  handleImageUpload,
  handleSubmitForm,
  stats,
  allStats,
  submissions = [],
  auditLogs = [],
  onUpdateProfile,
  messages,
  onSendMessage,
  onMarkAsRead,
  loadDashboardStats,
  dashboardLoading,
  loadReportForCorrection,
}) {
  const pendingCorrections = submissions.filter(
    (s) => s.analystId === currentUser?.id && s.hasCorrection === true && s.correctionStatus === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* ── ALERTA URGENTE DE CORRECCIÓN (BLOQUEO) ── */}
      {pendingCorrections.length > 0 && activeTab !== 'forms' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="relative bg-white dark:bg-slate-900 border-2 border-red-500 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Corrección Urgente Requerida
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
              El administrador ha solicitado correcciones en uno o más de tus reportes. Debes corregirlos obligatoriamente antes de poder continuar usando el sistema.
            </p>
            <div className="text-left bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900/50 mb-6">
              <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1">
                Motivo de la corrección:
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {pendingCorrections[0].correctionMessage}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Reporte: {pendingCorrections[0].reportData?.municipio} - {pendingCorrections[0].reportData?.redSocial}
              </div>
            </div>
            <button
              onClick={() => {
                loadReportForCorrection(pendingCorrections[0]);
              }}
              className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              Ir a Corregir Reporte
            </button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD PRINCIPAL CON GRÁFICAS (Versión Analista) ── */}
      <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
        <AdminDashboard
          currentUser={currentUser}
          allStats={allStats}
          stats={stats}
          submissions={[]} 
          users={[]} 
          auditLogs={[]} 
          messages={messages}
          loadDashboardStats={loadDashboardStats}
          dashboardLoading={dashboardLoading}
        />
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

      {/* ── ESTADÍSTICAS ── */}
      <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
        <StatsView currentUser={currentUser} stats={stats} />
      </div>

      {/* ── MI PERFIL ── */}
      <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          stats={stats}
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
