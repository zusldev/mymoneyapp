"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Landmark,
    ArrowRightLeft,
    CreditCard,
    Repeat,
    Target,
    Bot,
    TrendingUp,
    Sparkles,
} from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/cuentas", label: "Cuentas", icon: Landmark },
    { href: "/transacciones", label: "Transacciones", icon: ArrowRightLeft },
    { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
    { href: "/suscripciones", label: "Suscripciones", icon: Repeat },
    { href: "/ingresos", label: "Ingresos", icon: TrendingUp },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/asistente", label: "AI CFO", icon: Bot },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-dvh w-64 flex-col glass-strong z-50">
            {/* Logo */}
            <div className="p-6 border-b border-border/50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground tracking-tight">MyMoney</h1>
                        <p className="text-xs text-muted">CFO Personal</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "active bg-accent-glow text-accent"
                                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? "text-accent" : ""}`} />
                            <span>{item.label}</span>
                            {item.href === "/asistente" && (
                                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-accent to-purple text-white animate-gradient">
                                    AI
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/50">
                <div className="glass-card rounded-xl p-4 text-center">
                    <p className="text-xs text-muted">
                        MyMoneyApp <span className="text-accent">v1.0</span>
                    </p>
                </div>
            </div>
        </aside>
    );
}
