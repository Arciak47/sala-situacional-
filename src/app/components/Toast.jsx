"use client";

export default function Toast({ toastMsg, setToastMsg }) {
  if (!toastMsg) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl shadow-2xl border-l-4 border-red-600 flex items-center gap-3 min-w-[260px] animate-bounce">
        <span className="text-xs font-bold text-slate-800 dark:text-white">
          {toastMsg}
        </span>
        <button
          onClick={() => setToastMsg('')}
          className="text-slate-400 hover:text-red-600 text-xs font-bold ml-auto cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
