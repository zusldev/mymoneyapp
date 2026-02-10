"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ArrowRightLeft,
    CreditCard,
    Target,
    Bot,
} from "lucide-react";

const mobileNavItems = [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/transacciones", label: "Movimientos", icon: ArrowRightLeft },
    { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/asistente", label: "AI CFO", icon: Bot },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong safe-area-bottom z-50">
            <div className="flex items-center justify-around px-2 py-2">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item-mobile relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${isActive
                                    ? "active text-accent"
                                    : "text-muted"
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
