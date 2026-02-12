"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, Wallet, Target, BrainCircuit, Plus } from "lucide-react";

const MOBILE_NAV = [
    { href: "/", label: "Inicio", icon: LayoutDashboard },
    { href: "/transacciones", label: "Mov.", icon: Wallet },
    { href: "FAB", label: "Nuevo", icon: Plus },
    { href: "/metas", label: "Metas", icon: Target },
    { href: "/asistente", label: "IA", icon: BrainCircuit },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed z-[100] bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] px-4">
            <div className="flex justify-center pb-6 w-full">
                {/* 
                  iOS 26 Style Capsule Container 
                  - Consistent 72px height
                  - Semantic theming
                  - High contrast & accessibility
                */}
                <nav className="relative w-full max-w-[420px] h-18 rounded-[2.5rem] isolate flex items-center justify-between px-2 bg-nav-capsule-bg backdrop-blur-2xl shadow-xl border border-white/10 dark:border-white/5">

                    {/* Items Grid */}
                    <div className="w-full flex items-center justify-between">
                        {MOBILE_NAV.map((item) => {
                            const isFab = item.href === "FAB";
                            const isActive = pathname === item.href;

                            if (isFab) {
                                return (
                                    <div key="fab" className="relative -top-1 px-1">
                                        <Link
                                            href="/transacciones?new=true"
                                            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-nav-item-active shadow-lg shadow-blue-500/25 transition-all active:scale-90 hover:scale-105"
                                            aria-label="Nueva transacción"
                                        >
                                            {/* FAB Content */}
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                            <Plus size={30} strokeWidth={2.5} className="text-white relative z-10" />
                                        </Link>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex-1 flex flex-col items-center justify-center gap-1.5 h-14 min-w-[44px] group transition-all"
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {/* Active Highlight */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute inset-x-2 inset-y-1 bg-nav-item-active/10 dark:bg-nav-item-active/20 rounded-2xl"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className={`relative z-10 flex items-center justify-center transition-all duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
                                        <item.icon
                                            size={22}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={isActive ? "text-nav-item-active" : "text-nav-text-muted group-hover:text-nav-item-active"}
                                        />
                                    </div>

                                    {/* Label */}
                                    <span className={`text-[11px] font-bold tracking-tight transition-colors duration-300 relative z-10 ${isActive ? "text-nav-item-active" : "text-nav-text-muted group-hover:text-nav-item-active"}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
