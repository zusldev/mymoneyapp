import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { ErrorBoundary } from "./components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} antialiased font-[var(--font-inter)]`}>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#2badee]/[0.04] to-transparent -z-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2badee]/[0.03] rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3" />

            {/* Header */}
            <header className="h-16 px-4 sm:px-8 flex items-center justify-end sticky top-0 z-10 backdrop-blur-xl bg-[#f6f7f8]/80 dark:bg-[#101c22]/80 border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <button className="relative p-2 text-slate-400 hover:text-[#2badee] transition-all duration-200 hover:bg-[#2badee]/5 rounded-xl">
                  <span className="material-icons-round text-xl">notifications</span>
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-[#f6f7f8] dark:border-[#101c22] animate-pulse-soft" />
                </button>
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2badee] to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#2badee]/20">
                  U
                </div>
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
        </div>
      </body>
    </html>
  );
}
