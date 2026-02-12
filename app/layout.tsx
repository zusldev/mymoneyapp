import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { ErrorBoundary } from "./components/ErrorBoundary";


import { ToastProvider } from "./components/ToastProvider";

export const metadata: Metadata = {
  title: "MyMoneyApp — Tu CFO Personal",
  description: "Gestor financiero personal con IA. Controla cuentas, tarjetas, gastos y metas financieras.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyMoney",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f6f7f8",
};

import { NotificationProvider } from "./context/NotificationContext";
import { NotificationCenter } from "./components/NotificationCenter";
import { ThemeProvider } from "./context/ThemeProvider";

import { BiometricGuard } from "./components/BiometricGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                if (theme === 'dark' || (!theme && supportDarkMode)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('blur', () => document.body.classList.add('app-blurred'));
              window.addEventListener('focus', () => document.body.classList.remove('app-blurred'));
            `,
          }}
        />
        <ThemeProvider>
          <BiometricGuard>
            <NotificationProvider>
              <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary/5 to-transparent -z-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />
                  <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none -translate-x-1/2 translate-y-1/2" />

                  {/* Header */}
                  <header className="h-16 px-4 sm:px-8 flex items-center justify-end sticky top-0 z-10 glass-header border-b border-border">
                    <div className="flex items-center gap-3">
                      <NotificationCenter />
                      <Link href="/perfil" className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 hover:scale-105">
                        L
                      </Link>
                    </div>
                  </header>

                  {/* Page Content */}
                  <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
                    <div className="page-enter">
                      <ErrorBoundary>
                        {children}
                      </ErrorBoundary>
                    </div>
                  </div>
                </main>

                {/* Mobile Bottom Nav */}
                <MobileNav />
                <ToastProvider />
              </div>
            </NotificationProvider>
          </BiometricGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
