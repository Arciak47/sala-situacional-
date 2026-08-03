import './globals.css';

export const metadata = {
  title: 'Sala Situacional — Consola Ejecutiva',
  description: 'Sistema de monitoreo de redes sociales y edición gráfica de plantillas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
