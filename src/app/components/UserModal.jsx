"use client";

export default function UserModal({
  showCreateModal,
  setShowCreateModal,
  formData,
  setFormData,
  modalError,
  handleCreateUser,
}) {
  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
          <h3 className="text-lg font-black">Crear Nuevo Usuario</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-slate-400 cursor-pointer text-xl"
          >
            ✕
          </button>
        </div>
        {modalError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-bold">
            ⚠️ {modalError}
          </div>
        )}
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Contraseña Inicial</label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Departamento</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-xs py-2.5 px-3 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none"
              >
                <option value="Analista">Analista</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
