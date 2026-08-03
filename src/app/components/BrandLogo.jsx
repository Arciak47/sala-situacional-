"use client";

export default function BrandLogo({ className = "w-10 h-10" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/logo.png"
        alt="Sala Situacional Logo"
        className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}

