"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import type { Goal } from "../lib/types";
import { apiGet, apiPost, normalizeApiError } from "../lib/api";
import { goalArraySchema } from "../lib/schemas";
import { toastError, toastSuccess } from "../lib/toast";
import { Target, Trophy, TrendingUp, Plus, MoreHorizontal } from "lucide-react";

const colorOpts = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

export default function MetasPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Goal | null>(null);
    const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "", priority: "medium", color: "#10b981" });
    const [now, setNow] = useState<number>(() => Date.now());
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const fetch_ = async () => {
        try {
            const data = await apiGet("/api/goals", goalArraySchema);
            setGoals(Array.isArray(data) ? data : []);
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetch_(); setNow(Date.now()); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: new Date().toISOString().split("T")[0], priority: "medium", color: "#10b981" }); setModalOpen(true); };
    const openEdit = (g: Goal) => { setEditing(g); setForm({ name: g.name, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString(), deadline: g.deadline.split("T")[0], priority: g.priority, color: g.color }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
            await apiPost(url, form, undefined, editing ? "PUT" : "POST");
            toastSuccess(editing ? "Meta actualizada" : "Meta creada");
            setModalOpen(false);
            fetch_();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsSaving(false);
        }
    };

    const requestDelete = (id: string) => {
        setPendingDeleteId(id);
    };

    const del = async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        setIsDeleting(id);
        try {
            await apiPost(`/api/goals/${id}`, null, undefined, "DELETE");
            toastSuccess("Meta eliminada");
            fetch_();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsDeleting(null);
            setPendingDeleteId(null);
        }
    };

    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    const priorityLabels: Record<string, { label: string; bg: string; text: string }> = {
        high: { label: "Alta", bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
        medium: { label: "Media", bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-600 dark:text-yellow-400" },
        low: { label: "Baja", bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2badee]/20 to-purple-600/20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#2badee]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-widest text-[#2badee]">
                            <Trophy size={14} />
                            Metas Financieras
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            Tu mapa hacia la <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2badee] to-blue-400">Libertad Financiera</span>
                        </h1>
                        <p className="text-slate-300 max-w-lg text-lg leading-relaxed">
                            Has acumulado <span className="text-white font-bold">{formatCurrency(totalSaved)}</span> de tu objetivo total de <span className="text-white font-bold">{formatCurrency(totalTarget)}</span>.
                        </p>
                    </div>

                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                            <motion.circle
                                cx="50%" cy="50%" r="45%" fill="none" stroke="#2badee" strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: overallProgress / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                style={{ pathLength: overallProgress / 100 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl md:text-5xl font-black">{Math.round(overallProgress)}%</span>
                            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">Completado</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tus Metas Activas</h2>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-[#2badee] hover:bg-[#1a8cb5] text-white rounded-2xl font-bold shadow-lg shadow-[#2badee]/25 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Nueva Meta
                </button>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                    {goals.map((g, i) => {
                        const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
                        const remaining = g.targetAmount - g.currentAmount;
                        const prio = priorityLabels[g.priority] || priorityLabels.medium;
                        const daysLeft = now ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - now) / 86400000)) : 0;

                        return (
                            <motion.div
                                key={g.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-6 rounded-[2rem] hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition-all duration-300"
                            >
                                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(g)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:text-[#2badee] transition-colors"><MoreHorizontal size={18} /></button>
                                    <button onClick={() => requestDelete(g.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><span className="material-icons-round text-sm">delete</span></button>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20" style={{ backgroundColor: g.color, color: g.color }}>
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <Target size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{g.name}</h3>
                                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${prio.bg} ${prio.text}`}>
                                            Prioridad {prio.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {formatCurrency(g.currentAmount)}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-1.5">
                                            de {formatCurrency(g.targetAmount)}
                                        </span>
                                    </div>

                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className="h-full rounded-full relative"
                                            style={{ backgroundColor: g.color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-[shimmer_2s_infinite]" />
                                        </motion.div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs font-medium text-slate-400">
                                        <span>{pct.toFixed(0)}% Completado</span>
                                        <span className={daysLeft < 30 ? "text-amber-500" : ""}>{daysLeft} días restantes</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400">Falta para la meta</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(remaining)}</span>
                                    </div>
                                    <button
                                        onClick={() => openEdit(g)}
                                        className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-[#2badee] hover:bg-[#2badee]/10 transition-colors"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}

                    <motion.button
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={openCreate}
                        className="group flex flex-col items-center justify-center gap-4 min-h-[280px] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#2badee] hover:border-[#2badee]/50 hover:bg-[#2badee]/5 transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Plus size={32} />
                        </div>
                        <span className="font-bold">Crear Nueva Meta</span>
                    </motion.button>
                </AnimatePresence>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Meta" : "Nueva Meta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Nombre de la meta</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fondo de emergencia" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Objetivo ($)</label><input className="input-field" type="number" step="0.01" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required /></div>
                        <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Ahorrado ($)</label><input className="input-field" type="number" step="0.01" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Fecha límite</label><input className="input-field" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></div>
                        <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Prioridad</label><select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Color Identificador</label>
                        <div className="flex flex-wrap gap-3">{colorOpts.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "scale-125 ring-2 ring-offset-2 ring-[#2badee] dark:ring-offset-slate-900" : "hover:scale-110"}`} style={{ backgroundColor: c }} />))}</div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSaving}>Cancelar</button>
                        <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                            {isSaving ? "Guardando..." : editing ? "Guardar Cambios" : "Crear Meta"}
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog
                open={pendingDeleteId !== null}
                title="Eliminar meta"
                description="¿Estás seguro? Esta acción no se puede deshacer y perderás el progreso registrado."
                confirmText="Sí, eliminar"
                loading={isDeleting !== null}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={del}
            />
        </div>
    );
}
