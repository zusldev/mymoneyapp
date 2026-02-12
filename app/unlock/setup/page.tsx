"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Smartphone, Key, ArrowLeft, CheckCircle2 } from "lucide-react";
import { registerBiometric, isBiometricSupported } from "@/app/lib/biometrics";
import { toastSuccess, toastError } from "@/app/lib/toast";

export default function SecuritySetupPage() {
    const [step, setStep] = useState(1);
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleSavePin = useCallback(async () => {
        if (pin !== confirmPin) {
            toastError("Los PINs no coinciden");
            setConfirmPin("");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/auth/setup-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode: pin })
            });

            if (!res.ok) throw new Error("Error al guardar el PIN");

            toastSuccess("PIN guardado correctamente");

            const biometricAvailable = await isBiometricSupported();
            if (biometricAvailable) {
                setStep(3);
            } else {
                setStep(4);
            }
        } catch {
            toastError("Error al configurar PIN");
        } finally {
            setIsSaving(false);
        }
    }, [pin, confirmPin]);

    const handleEnableFaceId = async () => {
        const success = await registerBiometric();
        if (success) {
            localStorage.setItem("faceIdEnabled", "true");
            toastSuccess("Face ID activado");
            setStep(4);
        }
    };

    const handlePinInput = (digit: string, isConfirm = false) => {
        const current = isConfirm ? confirmPin : pin;
        if (current.length < 4) {
            const next = current + digit;
            if (isConfirm) setConfirmPin(next);
            else setPin(next);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-6 pb-12 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-black">Configuración de Seguridad</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full space-y-8"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                                    <Key size={32} />
                                </div>
                                <h2 className="text-2xl font-black mb-2">Crea tu PIN</h2>
                                <p className="text-slate-500 text-sm">Este código de 4 dígitos protegerá tus datos financieros.</p>
                            </div>

                            <div className="flex justify-center gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${pin.length > i ? "bg-blue-500 border-blue-500 scale-110" : "border-slate-300"}`} />
                                ))}
                            </div>

                            <PinPad onInput={(digit) => handlePinInput(digit)} onClear={() => setPin(pin.slice(0, -1))} />

                            <button
                                disabled={pin.length < 4}
                                onClick={() => setStep(2)}
                                className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all active:scale-95"
                            >
                                Siguiente
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full space-y-8"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                                    <Shield size={32} />
                                </div>
                                <h2 className="text-2xl font-black mb-2">Confirma tu PIN</h2>
                                <p className="text-slate-500 text-sm">Ingresa de nuevo el código para confirmar.</p>
                            </div>

                            <div className="flex justify-center gap-4">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${confirmPin.length > i ? "bg-blue-500 border-blue-500 scale-110" : "border-slate-300"}`} />
                                ))}
                            </div>

                            <PinPad onInput={(digit) => handlePinInput(digit, true)} onClear={() => setConfirmPin(confirmPin.slice(0, -1))} />

                            <div className="space-y-3">
                                <button
                                    disabled={confirmPin.length < 4 || isSaving}
                                    onClick={handleSavePin}
                                    className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isSaving ? "Guardando..." : "Finalizar PIN"}
                                </button>
                                <button onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="w-full text-slate-400 text-sm font-bold">Volver</button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full text-center space-y-8"
                        >
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                <Smartphone size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-2">¿Activar Face ID?</h2>
                                <p className="text-slate-500 text-sm px-4">Accede más rápido y seguro usando el reconocimiento facial de tu dispositivo.</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleEnableFaceId}
                                    className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Shield size={20} /> Activar Ahora
                                </button>
                                <button
                                    onClick={() => setStep(4)}
                                    className="w-full text-slate-400 font-bold hover:text-slate-600"
                                >
                                    Quizás más tarde
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full text-center space-y-8"
                        >
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/40">
                                <CheckCircle2 size={48} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black mb-2">¡Todo Listo!</h2>
                                <p className="text-slate-500 font-medium">Tu seguridad ha sido configurada correctamente.</p>
                            </div>
                            <button
                                onClick={() => router.push("/perfil")}
                                className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl transition-all active:scale-95"
                            >
                                Entendido
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function PinPad({ onInput, onClear }: { onInput: (v: string) => void, onClear: () => void }) {
    return (
        <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                    key={n}
                    onClick={() => onInput(n.toString())}
                    className="h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-2xl font-black active:bg-slate-100 transition-all"
                >
                    {n}
                </button>
            ))}
            <div />
            <button
                onClick={() => onInput("0")}
                className="h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-2xl font-black active:bg-slate-100 transition-all"
            >
                0
            </button>
            <button
                onClick={onClear}
                className="h-16 rounded-2xl flex items-center justify-center text-slate-400 active:text-slate-600"
            >
                <span className="material-icons-round text-3xl">backspace</span>
            </button>
        </div>
    );
}
