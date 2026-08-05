import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: 'Sala Situacional — Consola Ejecutiva',
  description: 'Sistema de monitoreo de redes sociales y edición gráfica de plantillas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`scroll-smooth ${plusJakartaSans.variable}`}>
      <body className="font-sans antialiased bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
