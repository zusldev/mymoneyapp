"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MOBILE_NAV = [
    { href: "/", label: "Inicio", icon: "dashboard" },
    { href: "/transacciones", label: "Mov.", icon: "account_balance_wallet" },
    { href: "/calendario", label: "Calendario", icon: "calendar_month" },
    { href: "/metas", label: "Metas", icon: "savings" },
    { href: "/asistente", label: "IA", icon: "smart_toy" },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
            {/* Glassmorphism backdrop */}
            <div className="glass-mobile-nav">
                <div className="flex items-center justify-around px-2 py-1.5">
                    {MOBILE_NAV.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-90 ${isActive
                                    ? "text-[#2badee]"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    }`}
                            >
                                <div className="relative">
                                    <span className={`material-icons-round text-xl ${isActive ? "scale-110" : ""} transition-transform`}>{item.icon}</span>
                                    {isActive && (
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#2badee] rounded-full" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
