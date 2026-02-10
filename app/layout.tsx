import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";

const inter = Inter({
  variable: "--font-geist-sans",
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
  themeColor: "#06080f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <div className="flex min-h-dvh">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 md:ml-64 pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Nav */}
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
