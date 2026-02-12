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
        <div className="md:hidden fixed z-[100] bottom-0 left-0 right-0 pointer-events-none pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-center pb-4 w-full">
                {/* 
                  Apple-style Capsule Container 
                  - Floating
                  - Fixed width constraints
                  - Interactive
                */}
                <nav className="pointer-events-auto relative w-[92%] max-w-[390px] h-16 rounded-[2rem] isolate">

                    {/* 1. Glass Backdrop & Blur */}
                    <div className="absolute inset-0 rounded-[2rem] bg-slate-900/40 dark:bg-black/40 backdrop-blur-[40px] shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)]" />

                    {/* 2. Noise Texture (Anti-banding) */}
                    <div
                        className="absolute inset-0 rounded-[2rem] opacity-[0.03] pointer-events-none mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                    />

                    {/* 3. Borders & Inner Highlights (Stacked for depth) */}
                    {/* Outer ring (darker) */}
                    <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none" />
                    {/* Inner top highlight (specular) */}
                    <div className="absolute inset-[1px] rounded-[2rem] border-t border-white/20 pointer-events-none" />
                    {/* Inner bottom reflection */}
                    <div className="absolute inset-[1px] rounded-[2rem] border-b border-white/5 pointer-events-none" />

                    {/* 4. Specular Streak Animation (Subtle moving shine) */}
                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                x: ["-100%", "200%"],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                                repeatDelay: 5
                            }}
                            className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 blur-md"
                        />
                    </div>

                    {/* 5. Items Container */}
                    <div className="relative h-full flex items-center justify-between px-2">
                        {MOBILE_NAV.map((item) => {
                            const isFab = item.href === "FAB";
                            const isActive = pathname === item.href;

                            if (isFab) {
                                return (
                                    <div key="fab" className="relative -top-6 mx-1">
                                        <Link
                                            href="/transacciones?new=true"
                                            className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-[#007AFF] shadow-[0_8px_20px_rgba(0,122,255,0.35)] transition-transform active:scale-95 cursor-pointer touch-manipulation"
                                            aria-label="Nueva transacción"
                                        >
                                            {/* FAB Liquid Glass Stack */}
                                            {/* 1. Underlying Gradient */}
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#4BA1FF] to-[#007AFF]" />

                                            {/* 2. Noise Texture */}
                                            <div
                                                className="absolute inset-0 rounded-full opacity-[0.15] mix-blend-overlay pointer-events-none"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                                            />

                                            {/* 3. Inner Lighting (Specular highlight) */}
                                            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none" />
                                            <div className="absolute inset-[1px] rounded-full border-t border-white/40 pointer-events-none" />
                                            <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                                            {/* 4. Icon */}
                                            <Plus size={32} strokeWidth={3} className="relative z-10 text-white drop-shadow-md" />
                                        </Link>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative flex-1 h-full flex items-center justify-center group cursor-pointer touch-manipulation min-w-[44px]"
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {/* Active background pill (Sliding) */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabPill"
                                            className="absolute w-12 h-12 bg-white/15 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-md"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon & Label */}
                                    <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <item.icon
                                                size={24}
                                                strokeWidth={isActive ? 2.5 : 2}
                                                className={`transition-all duration-300 ${isActive
                                                    ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                                                    : "text-slate-400 group-hover:text-amber-400/80"
                                                    }`}
                                            />
                                        </motion.div>
                                        <span className={`text-[10px] font-bold transition-colors ${isActive ? "text-white" : "text-slate-500"}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
