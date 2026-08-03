"use client";

export default function AuthGuard({ currentUser, allowedRoles = [], children }) {
  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        ⚠️ Debes iniciar sesión para acceder a este módulo.
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="p-8 text-center text-red-500 font-bold text-xs">
        🚫 No tienes permisos para acceder a este módulo ({currentUser.role}).
      </div>
    );
  }

  return children;
}
