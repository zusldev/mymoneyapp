"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Fingerprint, Keyboard, ArrowRight } from "lucide-react";
import { verifyBiometric } from "../lib/biometrics";

export default function UnlockPage() {
    const [passcode, setPasscode] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState("");
    const [usePasscode, setUsePasscode] = useState(false);
    const router = useRouter();

    const handleBiometric = useCallback(async () => {
        setIsChecking(true);
        setError("");
        try {
            const success = await verifyBiometric();
            if (success) {
                await login({ isBiometric: true });
            }
        } catch {
            setError("Error con biometría");
        } finally {
            setIsChecking(false);
        }
    }, [router]);

    useEffect(() => {
        // Attempt biometric automatically if enabled
        const enabled = localStorage.getItem("faceIdEnabled") === "true";
        if (enabled) {
            handleBiometric();
        } else {
            setUsePasscode(true);
        }
    }, [handleBiometric]);

    const handlePasscode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode) return;
        setIsChecking(true);
        setError("");
        try {
            await login({ passcode });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Código incorrecto");
        } finally {
            setIsChecking(false);
        }
    };

    const login = async (data: { passcode?: string; isBiometric?: boolean }) => {
        const res = await fetch("/api/auth/unlock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error");
        }

        // Success! Redirect to dashboard
        router.push("/");
    };

    // router is stable, but adding to deps for handleBiometric purity

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm text-center"
            >
                <div className="mb-12 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-[#2badee] to-blue-600 p-[3px] shadow-2xl shadow-blue-500/30 mb-8">
                        <div className="w-full h-full rounded-[2.3rem] bg-white dark:bg-slate-800 flex items-center justify-center">
                            <Lock size={40} className="text-[#2badee]" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">MyMoneyApp</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Introduce tu código para continuar</p>
                </div>

                <AnimatePresence mode="wait">
                    {!usePasscode ? (
                        <motion.div
                            key="bio"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-6"
                        >
                            <button
                                onClick={handleBiometric}
                                disabled={isChecking}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isChecking ? (
                                    <div className="w-6 h-6 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                ) : (
                                    <Fingerprint size={28} />
                                )}
                                Desbloquear
                            </button>
                            <button
                                onClick={() => setUsePasscode(true)}
                                className="text-sm font-bold text-[#2badee] hover:underline flex items-center gap-2 mx-auto"
                            >
                                <Keyboard size={16} /> Usar código de acceso
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="pass"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            onSubmit={handlePasscode}
                            className="space-y-6"
                        >
                            <div className="relative">
                                <input
                                    type="password"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="••••"
                                    autoFocus
                                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl px-8 py-5 text-center text-3xl tracking-[1em] font-black focus:border-[#2badee] focus:ring-4 focus:ring-[#2badee]/10 outline-none transition-all shadow-sm"
                                />
                                {error && <p className="text-red-500 text-sm font-bold mt-4">{error}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isChecking || !passcode}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl bg-[#2badee] text-white font-bold text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isChecking ? "Verificando..." : "Acceder"}
                                <ArrowRight size={20} />
                            </button>

                            <button
                                type="button"
                                onClick={() => setUsePasscode(false)}
                                className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                Volver a Face ID
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
