"use client";
import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";

interface Goal { id: string; name: string; targetAmount: number; currentAmount: number; deadline: string; priority: string; color: string; }
const colorOpts = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

export default function MetasPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Goal | null>(null);
    const [form, setForm] = useState({ name: "", targetAmount: "", currentAmount: "0", deadline: "", priority: "medium", color: "#10b981" });
    const [now, setNow] = useState<number>(0);

    const fetch_ = () => { fetch("/api/goals").then(r => r.json()).then(setGoals).finally(() => setLoading(false)); };
    // eslint-disable-next-line
    useEffect(() => { fetch_(); setNow(Date.now()); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: new Date().toISOString().split("T")[0], priority: "medium", color: "#10b981" }); setModalOpen(true); };
    const openEdit = (g: Goal) => { setEditing(g); setForm({ name: g.name, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString(), deadline: g.deadline.split("T")[0], priority: g.priority, color: g.color }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
        await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false); fetch_();
    };

    const del = async (id: string) => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/goals/${id}`, { method: "DELETE" }); fetch_(); };

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
        <div className="max-w-5xl mx-auto space-y-8 stagger-children">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Metas Financieras</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{goals.length} meta{goals.length !== 1 ? "s" : ""} registrada{goals.length !== 1 ? "s" : ""}</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#2badee] hover:bg-[#1a8cb5] text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-[#2badee]/20">
                    <span className="material-icons-round text-lg">add</span>
                    Nueva Meta
                </button>
            </header>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {goals.map(g => {
                    const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
                    const remaining = g.targetAmount - g.currentAmount;
                    const prio = priorityLabels[g.priority] || priorityLabels.medium;
                    const daysLeft = now ? Math.max(0, Math.ceil((new Date(g.deadline).getTime() - now) / 86400000)) : 0;

                    return (
                        <div key={g.id} className="bg-white dark:bg-[#1a262d] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: g.color }}>
                                        <span className="material-icons-round text-xl">savings</span>
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{g.name}</h4>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${prio.bg} ${prio.text}`}>
                                            {prio.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#2badee] transition-colors">
                                        <span className="material-icons-round text-sm">edit</span>
                                    </button>
                                    <button onClick={() => del(g.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-colors">
                                        <span className="material-icons-round text-sm">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-500 dark:text-slate-400">{formatCurrency(g.currentAmount)}</span>
                                    <span className="font-bold tabular-nums" style={{ color: g.color }}>{pct.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div className="h-2.5 rounded-full transition-all duration-1000 relative" style={{ width: `${pct}%`, backgroundColor: g.color }}>
                                        {pct > 5 && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex justify-between items-center text-xs text-slate-400">
                                <span>Meta: {formatCurrency(g.targetAmount)}</span>
                                <span className="flex items-center gap-1">
                                    <span className="material-icons-round text-xs">schedule</span>
                                    {daysLeft > 0 ? `${daysLeft} días` : "Vencida"}
                                </span>
                            </div>
                            {remaining > 0 && (
                                <p className="text-xs text-slate-400 mt-2">
                                    Faltan <span className="font-semibold text-slate-600 dark:text-slate-300">{formatCurrency(remaining)}</span>
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* Add New */}
                <button onClick={openCreate} className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-[#2badee] hover:border-[#2badee] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 min-h-[220px] group">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2badee]/10 flex items-center justify-center transition-colors">
                        <span className="material-icons-round text-2xl group-hover:text-[#2badee]">add</span>
                    </div>
                    <span className="text-sm font-medium">Nueva Meta</span>
                </button>
            </div>

            {goals.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-[#1a262d] rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="material-icons-round text-5xl text-slate-300 mb-4">savings</span>
                    <p className="text-slate-500">No hay metas registradas</p>
                    <button onClick={openCreate} className="btn-primary mt-4">Agregar</button>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Meta" : "Nueva Meta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fondo de emergencia" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Meta</label><input className="input-field" type="number" step="0.01" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Actual</label><input className="input-field" type="number" step="0.01" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Fecha límite</label><input className="input-field" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Prioridad</label><select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Color</label>
                        <div className="flex gap-2">{colorOpts.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-[#2badee]/50" : "hover:scale-110"}`} style={{ backgroundColor: c }} />))}</div>
                    </div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? "Guardar" : "Crear"}</button></div>
                </form>
            </Modal>
        </div>
    );
}
