"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/transacciones", label: "Transacciones", icon: "account_balance_wallet" },
    { href: "/cuentas", label: "Cuentas", icon: "account_balance" },
    { href: "/tarjetas", label: "Tarjetas", icon: "credit_card" },
    { href: "/calendario", label: "Calendario", icon: "calendar_month" },
    { href: "/suscripciones", label: "Suscripciones", icon: "sync" },
    { href: "/ingresos", label: "Ingresos", icon: "trending_up" },
    { href: "/metas", label: "Metas", icon: "savings" },
    { href: "/asistente", label: "Asistente IA", icon: "smart_toy" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-20 lg:w-64 glass-sidebar flex-col justify-between transition-all duration-300 z-20">
            <div>
                {/* Logo */}
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-slate-100 dark:border-slate-800">
                    <div className="h-10 w-10 bg-gradient-to-br from-[#2badee] to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-glow relative">
                        M
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#2badee] to-blue-600 blur-lg opacity-30 -z-10" />
                    </div>
                    <span className="ml-3 text-lg font-bold text-slate-800 dark:text-white hidden lg:block">MyMoney</span>
                </div>

                {/* Nav Items */}
                <nav className="mt-6 px-3 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-2.5 rounded-xl group transition-all duration-200 relative ${isActive
                                    ? "bg-[#2badee]/10 text-[#2badee] font-semibold"
                                    : "text-slate-500 hover:text-[#2badee] hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 hover:translate-x-0.5"
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2badee] rounded-r-full" />
                                )}
                                <span className={`material-icons-round text-[22px] ${isActive ? "" : "group-hover:scale-110"} transition-transform`}>{item.icon}</span>
                                <span className="ml-4 text-sm hidden lg:block">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Settings */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                <Link
                    href="#"
                    className="flex items-center px-4 py-2.5 text-slate-500 hover:text-[#2badee] hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5 rounded-xl group transition-all duration-200"
                >
                    <span className="material-icons-round text-[22px] group-hover:rotate-45 transition-transform duration-300">settings</span>
                    <span className="ml-4 text-sm hidden lg:block">Configuración</span>
                </Link>
            </div>
        </aside>
    );
}
