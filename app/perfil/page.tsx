"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
    User, Moon, Globe, Shield, ChevronRight, Bell, Download,
    Trash2, Smartphone
} from "lucide-react";
import { toastSuccess, toastError } from "@/app/lib/toast";

// ... imports
import { registerBiometric, verifyBiometric, isBiometricSupported } from "@/app/lib/biometrics";
import { Transaction } from "@/app/lib/types";
import { LucideIcon } from "lucide-react";
import { useTheme } from "../context/ThemeProvider";

export default function ProfilePage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(false);
    const [faceId, setFaceId] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);

    // 1. Persistence & State Sync
    useEffect(() => {
        // Check Face ID state
        const faceEnabled = localStorage.getItem("faceIdEnabled") === "true";
        setFaceId(faceEnabled);
    }, []);

    // 2. Notifications Logic
    const toggleNotifications = async () => {
        if (!notifications) {
            if (!("Notification" in window)) {
                toastError("Este navegador no soporta notificaciones");
                return;
            }
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setNotifications(true);
                new Notification("MyMoneyApp", { body: "Notificaciones activadas correctamente" });
                toastSuccess("Notificaciones activadas");
            } else {
                toastError("Permiso denegado");
            }
        } else {
            setNotifications(false);
        }
    };

    // 3. Face ID Logic
    const toggleFaceId = async () => {
        if (!faceId) {
            // Turning ON
            const supported = await isBiometricSupported();
            if (!supported) {
                toastError("Tu dispositivo no soporta Face ID / Touch ID");
                return;
            }

            const success = await registerBiometric();
            if (success) {
                setFaceId(true);
                localStorage.setItem("faceIdEnabled", "true");
                toastSuccess("Face ID configurado correctamente");
            } else {
                toastError("Error al registrar Face ID");
            }
        } else {
            // Turning OFF
            if (confirm("¿Desactivar Face ID?")) {
                setFaceId(false);
                localStorage.setItem("faceIdEnabled", "false");
                toastSuccess("Face ID desactivado");
            }
        }
    };

    // 4. Export Data Logic
    const handleExport = async () => {
        try {
            setLoadingExport(true);
            const res = await fetch("/api/transactions?limit=1000");
            const data = await res.json();

            if (!data || data.length === 0) {
                toastError("No hay datos para exportar");
                return;
            }

            // Convert JSON to CSV
            const headers = ["Fecha", "Comercio", "Monto", "Tipo", "Categoría", "Cuenta"];
            const csvContent = [
                headers.join(","),
                ...data.map((tx: Transaction) => [
                    new Date(tx.date).toLocaleDateString(),
                    `"${tx.merchant}"`,
                    tx.amount,
                    tx.type,
                    tx.category,
                    tx.account?.name || ""
                ].join(","))
            ].join("\n");

            // Download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `mymoney_export_${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toastSuccess("Exportación completada");
        } catch {
            toastError("Error al exportar");
        } finally {
            setLoadingExport(false);
        }
    };

    // 5. Reset Data Logic
    const handleReset = async () => {
        // Biometric Check
        if (faceId) {
            const verified = await verifyBiometric();
            if (!verified) {
                toastError("Autenticación fallida");
                return;
            }
        }

        if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará todas tus transacciones y reseteará los balances. Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch("/api/reset", { method: "POST" });
            if (res.ok) {
                toastSuccess("Datos eliminados correctamente");
                // Optional: Reload to reflect changes
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toastError("Error al borrar datos");
            }
        } catch {
            toastError("Error de conexión");
        }
    };

    return (
        <div className="space-y-6 pb-24">
            {/* 
        Profile Hero Card (Liquid Glass) 
        - Uses the "Liquid Glass Cyan" style from globals.css
      */}
            <div className="relative overflow-hidden rounded-[2rem] p-6 liquid-glass-cyan isolate">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-50 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 p-[3px] shadow-lg shadow-blue-500/30">
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                <User size={40} className="text-slate-400 dark:text-slate-500" />
                                {/* Image placeholder would go here */}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-sm">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Libor</h1>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30">
                            CFO Personal
                        </span>
                        <span className="text-slate-400 text-sm">Miembro desde 2024</span>
                    </div>
                </div>
            </div>

            {/* Settings Sections - iOS Style Inset Grouped */}
            <div className="space-y-6">

                {/* Generales */}
                <section>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4 mb-2">General</h3>
                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-sm">

                        <SettingItem
                            icon={Moon}
                            color="bg-purple-500"
                            label="Modo Oscuro"
                            isToggle
                            value={theme === "dark"}
                            onChange={toggleTheme}
                        />

                        <SettingItem
                            icon={Bell}
                            color="bg-red-500"
                            label="Notificaciones"
                            isToggle
                            value={notifications}
                            onChange={toggleNotifications}
                        />

                        <SettingItem
                            icon={Globe}
                            color="bg-blue-500"
                            label="Idioma y Moneda"
                            value="Español (MXN)"
                            hasArrow
                        />

                    </div>
                </section>

                {/* Seguridad */}
                <section>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4 mb-2">Seguridad</h3>
                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-sm">

                        <SettingItem
                            icon={Smartphone}
                            color="bg-emerald-500"
                            label="Face ID / Biometría"
                            isToggle
                            value={faceId}
                            onChange={toggleFaceId}
                        />

                        <SettingItem
                            icon={Shield}
                            color="bg-primary"
                            label="Configurar PIN / Bloqueo"
                            hasArrow
                            onClick={() => router.push("/unlock/setup")}
                        />
                    </div>
                </section>

                {/* Datos */}
                <section>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-4 mb-2">Datos</h3>
                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-sm">

                        <SettingItem
                            icon={Download}
                            color="bg-orange-500"
                            label={loadingExport ? "Exportando..." : "Exportar CSV"}
                            value="Finanzas"
                            onClick={handleExport}
                        />

                        <div className="relative group">
                            <button
                                onClick={handleReset}
                                className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                        <Trash2 size={18} />
                                    </div>
                                    <span className="text-red-600 dark:text-red-400 font-medium">Borrar Datos</span>
                                </div>
                            </button>
                        </div>

                    </div>
                </section>

                {/* Info App */}
                <div className="text-center pt-4 pb-8">
                    <p className="text-xs text-slate-400 font-medium">MyMoneyApp v1.0.2 (Build 240)</p>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Made with Liquid Glass Design</p>
                </div>

            </div>
        </div>
    );
}

// ─── Helper Components ───

function SettingItem({
    icon: Icon,
    color,
    label,
    value,
    isToggle,
    onChange,
    hasArrow,
    onClick
}: {
    icon: LucideIcon,
    color: string,
    label: string,
    value?: string | boolean,
    isToggle?: boolean,
    onChange?: () => void,
    hasArrow?: boolean,
    onClick?: () => void
}) {
    return (
        <div className="relative border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <div
                onClick={onClick}
                className={`flex items-center justify-between p-4 ${onClick ? 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors' : ''}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{label}</span>
                </div>

                <div className="flex items-center gap-2">
                    {typeof value === 'string' && (
                        <span className="text-slate-400 text-sm">{value}</span>
                    )}

                    {isToggle && (
                        <button
                            onClick={onChange}
                            className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${value ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-600'
                                }`}
                        >
                            <motion.div
                                layout
                                className="absolute top-0.5 bottom-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm"
                                animate={{ x: value ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    )}

                    {hasArrow && (
                        <ChevronRight size={18} className="text-slate-300" />
                    )}
                </div>
            </div>
        </div>
    );
}
