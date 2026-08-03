"use client";

export default function InteractiveBackground({ darkMode = true }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* SERIOUS INSTITUTIONAL EXECUTIVE GLOW BLOBS */}
      <div
        className={`absolute -top-40 -left-40 w-[42rem] h-[42rem] rounded-full blur-[140px] transition-all duration-1000 ${
          darkMode ? 'bg-red-950/20' : 'bg-red-500/05'
        }`}
      />
      <div
        className={`absolute top-1/3 -right-40 w-[45rem] h-[45rem] rounded-full blur-[160px] transition-all duration-1000 ${
          darkMode ? 'bg-slate-900/40' : 'bg-slate-200/40'
        }`}
      />
      <div
        className={`absolute -bottom-40 left-1/3 w-[40rem] h-[40rem] rounded-full blur-[140px] transition-all duration-1000 ${
          darkMode ? 'bg-blue-950/20' : 'bg-blue-500/05'
        }`}
      />
    </div>
  );
}

