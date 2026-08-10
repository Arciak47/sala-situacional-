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
      {/* ── DASHBOARD PRINCIPAL CON GRÁFICAS (Versión Analista) ── */}
      <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
        <AdminDashboard
          currentUser={currentUser}
          allStats={{}} // Analistas ven estadísticas propias desde `stats` si está configurado, o general básico
          submissions={[]} 
          users={[]} 
          auditLogs={[]} 
          messages={messages}
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
              <button
                onClick={goToEditor}
                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl font-bold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                🎨 Ir al Editor
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
      )}
    </div>
  );
}
