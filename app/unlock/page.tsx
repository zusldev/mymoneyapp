"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Smartphone, ShieldAlert } from "lucide-react";
import { verifyBiometric } from "../lib/biometrics";

export default function UnlockPage() {
    const [passcode, setPasscode] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [faceIdEnabled, setFaceIdEnabled] = useState(false);
    const router = useRouter();

    const login = useCallback(async (data: { passcode?: string; isBiometric?: boolean }) => {
        setIsChecking(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/unlock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Código incorrecto");
            }

            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado");
            setPasscode("");
        } finally {
            setIsChecking(false);
        }
    }, [router]);

    const handleBiometric = useCallback(async () => {
        const success = await verifyBiometric();
        if (success) {
            login({ isBiometric: true });
        } else {
            setError("Autenticación fallida");
        }
    }, [login]);

    useEffect(() => {
        const enabled = localStorage.getItem("faceIdEnabled") === "true";
        setFaceIdEnabled(enabled);
        if (enabled) {
            // Slight delay for better reliability on PWA mount
            const timer = setTimeout(handleBiometric, 800);
            return () => clearTimeout(timer);
        }
    }, [handleBiometric]);

    const handleInput = (value: string) => {
        if (isChecking) return;
        setError(null);
        setPasscode(value);
        if (value.length === 4) {
            login({ passcode: value });
        }
    };

    const renderDots = () => {
        return [0, 1, 2, 3].map((i) => (
            <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${passcode.length > i
                    ? "bg-blue-500 border-blue-500 scale-125"
                    : "border-slate-300 dark:border-slate-700"
                    }`}
            />
        ));
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 isolate overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-500/10 to-transparent -z-10" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        MyMoneyApp
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Tu CFO Personal está listo
                    </p>
                </div>

                {/* Status/Error Messages */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center mb-6"
                        >
                            <p className="text-rose-500 text-sm font-bold flex items-center justify-center gap-2">
                                <ShieldAlert size={16} /> {error}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Passcode Container */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative">
                    <div className="text-center mb-8">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                            Ingresa tu PIN
                        </p>
                        <div className="flex justify-center gap-6 mb-8">
                            {renderDots()}
                        </div>
                    </div>

                    {/* Numeric Input (Hidden for styling) */}
                    <input
                        id="passcode-input"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={passcode}
                        onChange={(e) => handleInput(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-default"
                        autoFocus
                        maxLength={4}
                        disabled={isChecking}
                    />

                    {/* Biometric Fallback */}
                    {faceIdEnabled && (
                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50">
                            <button
                                onClick={handleBiometric}
                                disabled={isChecking}
                                className="w-full py-4 flex items-center justify-center gap-3 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Smartphone size={20} />
                                {isChecking ? "Verificando..." : "Usar Face ID"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Helper info */}
                <p className="text-center mt-8 text-xs text-slate-400 dark:text-slate-500 font-medium px-4">
                    Para tu seguridad, esta aplicación se bloquea automáticamente al estar inactiva.
                </p>
            </motion.div>
        </div>
    );
}
