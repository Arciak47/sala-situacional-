"use client";

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
}) {
  return (
    <div className="space-y-6">
      {/* ── DASHBOARD PRINCIPAL ── */}
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
      {/* ── FORMULARIO ── */}
      {activeTab === 'forms' && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="border-b dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                📋 Formulario de Reporte
              </h3>
              <p className="text-xs text-slate-500">
                Completa los campos y envía al Supervisor.
              </p>
            </div>
            <FormFields
              data={reportData}
              setData={setReportData}
              onImageUpload={handleImageUpload}
            />
            <div className="mt-6 pt-4 border-t dark:border-slate-800">
              <button
                onClick={handleSubmitForm}
                className="w-full py-3.5 px-6 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-800 hover:opacity-95 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                📤 ENVIAR REPORTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ESTADÍSTICAS ── */}
      {activeTab === 'stats' && (
        <StatsView currentUser={currentUser} stats={stats} />
      )}

      {/* ── MI PERFIL ── */}
      {activeTab === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onUpdateProfile={onUpdateProfile}
          stats={stats}
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
