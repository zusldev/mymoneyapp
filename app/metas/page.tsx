"use client";
import { useEffect, useState } from "react";
import { Plus, Target, Loader2, Trash2, Edit2 } from "lucide-react";
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

    const fetch_ = () => { fetch("/api/goals").then(r => r.json()).then(setGoals).finally(() => setLoading(false)); };
    useEffect(() => { fetch_(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: "", targetAmount: "", currentAmount: "0", deadline: "", priority: "medium", color: "#10b981" }); setModalOpen(true); };
    const openEdit = (g: Goal) => { setEditing(g); setForm({ name: g.name, targetAmount: g.targetAmount.toString(), currentAmount: g.currentAmount.toString(), deadline: g.deadline.split("T")[0], priority: g.priority, color: g.color }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
        await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false); fetch_();
    };

    const del = async (id: string) => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/goals/${id}`, { method: "DELETE" }); fetch_(); };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-foreground">Metas Financieras</h1><p className="text-muted text-sm mt-1">Rastrea tu progreso de ahorro</p></div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Nueva Meta</span></button>
            </div>

            {goals.length > 0 && (
                <div className="glass-card rounded-2xl p-6 glow-cyan">
                    <div className="flex items-center justify-between mb-3">
                        <div><p className="text-sm text-muted mb-1">Progreso Total</p><p className="text-2xl font-bold text-cyan tabular-nums">{formatCurrency(totalSaved)} <span className="text-sm text-muted font-normal">de {formatCurrency(totalTarget)}</span></p></div>
                        <p className="text-lg font-bold text-foreground tabular-nums">{totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%</p>
                    </div>
                    <div className="progress-bar h-3">
                        <div className="progress-bar-fill" style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%`, background: "linear-gradient(90deg, #06d6a0, #06b6d4)" }} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
                {goals.map(g => {
                    const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                    const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                    return (
                        <div key={g.id} className="glass-card rounded-2xl p-5 group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2.5 rounded-xl" style={{ backgroundColor: g.color + "15" }}>
                                    <Target className="w-5 h-5" style={{ color: g.color }} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => del(g.id)} className="p-1.5 rounded-lg hover:bg-rose/10 text-muted hover:text-rose"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{g.name}</p>
                            <div className="mt-3 space-y-2">
                                <div className="flex justify-between text-xs"><span className="text-muted">{formatCurrency(g.currentAmount)}</span><span className="text-muted">{formatCurrency(g.targetAmount)}</span></div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%`, background: g.color }} />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-medium" style={{ color: g.color }}>{progress.toFixed(0)}%</span>
                                    <span className="text-muted">{daysLeft} días restantes</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {goals.length === 0 && <div className="text-center py-16 glass-card rounded-2xl"><Target className="w-12 h-12 text-muted mx-auto mb-4" /><p className="text-muted">Define metas para empezar</p><button onClick={openCreate} className="btn-primary mt-4">Crear Meta</button></div>}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Meta" : "Nueva Meta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm text-muted mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Fondo de emergencia" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Meta</label><input className="input-field" type="number" step="0.01" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Ahorrado</label><input className="input-field" type="number" step="0.01" value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Fecha límite</label><input className="input-field" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Prioridad</label><select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></div>
                    </div>
                    <div><label className="text-sm text-muted mb-1 block">Color</label><div className="flex gap-2">{colorOpts.map(c => <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"}`} style={{ backgroundColor: c }} />)}</div></div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? "Guardar" : "Crear"}</button></div>
                </form>
            </Modal>
        </div>
    );
}
