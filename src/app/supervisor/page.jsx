"use client";

import CanvasEditor from '../components/CanvasEditor';
import StatsView from '../components/StatsView';
import ProfileView from '../components/ProfileView';
import MessagingView from '../components/MessagingView';
import AdminDashboard from '../components/AdminDashboard';
import SupervisorUsersView from '../components/SupervisorUsersView';
import ShiftReportView from '../components/ShiftReportView';

export default function SupervisorView({
  currentUser,
  users,
  activeTab,
  submissions,
  inboxFilter,
  setInboxFilter,
  openSubmissionForReview,
  markAsReviewed,
  deleteSubmission,
  reportData,
  setReportData,
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
  auditLogs = [],
}) {
  return (
    <div className="space-y-6">
      {/* ── REPORTE DE TURNO ── */}
      {activeTab === 'shift' && (
        <ShiftReportView submissions={submissions} users={users} />
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
