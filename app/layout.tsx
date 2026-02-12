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
        <ThemeProvider>
          <BiometricGuard>
            <NotificationProvider>
              <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#2badee]/[0.04] to-transparent -z-10 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#2badee]/[0.03] rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />

                  {/* Header */}
                  <header className="h-16 px-4 sm:px-8 flex items-center justify-end sticky top-0 z-10 glass-header">
                    <div className="flex items-center gap-3">
                      <NotificationCenter />
                      <Link href="/perfil" className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2badee] to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#2badee]/20 transition-transform active:scale-95">
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
