"use client";
import { useEffect, useState } from "react";
import { Plus, Repeat, Loader2, Trash2, Edit2, Power, PowerOff } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS } from "../lib/categories";

interface Sub { id: string; name: string; amount: number; frequency: string; category: string; nextDate: string; active: boolean; color: string; }

export default function SuscripcionesPage() {
    const [subs, setSubs] = useState<Sub[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Sub | null>(null);
    const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", category: "suscripciones", nextDate: "", color: "#f59e0b" });

    const fetchSubs = () => { fetch("/api/subscriptions").then(r => r.json()).then(setSubs).finally(() => setLoading(false)); };
    useEffect(() => { fetchSubs(); }, []);

    const active = subs.filter(s => s.active);
    const inactive = subs.filter(s => !s.active);
    const monthlyTotal = active.reduce((sum, s) => {
        if (s.frequency === "yearly") return sum + s.amount / 12;
        if (s.frequency === "weekly") return sum + s.amount * 4.33;
        return sum + s.amount;
    }, 0);

    const openCreate = () => { setEditing(null); setForm({ name: "", amount: "", frequency: "monthly", category: "suscripciones", nextDate: new Date().toISOString().split("T")[0], color: "#f59e0b" }); setModalOpen(true); };
    const openEdit = (s: Sub) => { setEditing(s); setForm({ name: s.name, amount: s.amount.toString(), frequency: s.frequency, category: s.category, nextDate: s.nextDate.split("T")[0], color: s.color }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editing ? `/api/subscriptions/${editing.id}` : "/api/subscriptions";
        await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false); fetchSubs();
    };

    const toggle = async (s: Sub) => {
        await fetch(`/api/subscriptions/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) });
        fetchSubs();
    };

    const del = async (id: string) => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); fetchSubs(); };
    const freq: Record<string, string> = { monthly: "Mensual", yearly: "Anual", weekly: "Semanal" };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-foreground">Suscripciones</h1><p className="text-muted text-sm mt-1">Pagos recurrentes</p></div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Nueva</span></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-5 glow-amber"><p className="text-sm text-muted mb-1">Costo Mensual</p><p className="text-2xl font-bold text-amber tabular-nums">{formatCurrency(monthlyTotal)}</p></div>
                <div className="glass-card rounded-2xl p-5"><p className="text-sm text-muted mb-1">Costo Anual</p><p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(monthlyTotal * 12)}</p></div>
                <div className="glass-card rounded-2xl p-5"><p className="text-sm text-muted mb-1">Activas</p><p className="text-2xl font-bold text-foreground">{active.length}</p></div>
            </div>

            {active.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Activas</h2>
                    <div className="glass-card rounded-2xl divide-y divide-border/30">
                        {active.map(s => {
                            const cat = CATEGORIES[s.category as keyof typeof CATEGORIES] || CATEGORIES.otros;
                            return (
                                <div key={s.id} className="flex items-center justify-between px-5 py-4 group hover:bg-surface-hover transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15", color: s.color }}><Repeat className="w-4 h-4" /></div>
                                        <div><p className="text-sm font-medium text-foreground">{s.name}</p><p className="text-xs text-muted">{freq[s.frequency]} • {cat.label}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(s.amount)}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => toggle(s)} className="p-1.5 rounded-lg hover:bg-amber/10 text-muted hover:text-amber"><PowerOff className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-rose/10 text-muted hover:text-rose"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {inactive.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Inactivas</h2>
                    <div className="glass-card rounded-2xl divide-y divide-border/30 opacity-60">
                        {inactive.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-5 py-4 group hover:bg-surface-hover transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-hover"><Repeat className="w-4 h-4 text-muted" /></div>
                                    <p className="text-sm text-muted line-through">{s.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted tabular-nums">{formatCurrency(s.amount)}</span>
                                    <button onClick={() => toggle(s)} className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted hover:text-green-400"><Power className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-rose/10 text-muted hover:text-rose"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subs.length === 0 && <div className="text-center py-16 glass-card rounded-2xl"><Repeat className="w-12 h-12 text-muted mx-auto mb-4" /><p className="text-muted">No hay suscripciones</p><button onClick={openCreate} className="btn-primary mt-4">Agregar</button></div>}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar" : "Nueva Suscripción"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm text-muted mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix, Spotify..." required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Monto</label><input className="input-field" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Frecuencia</label><select className="input-field" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="monthly">Mensual</option><option value="yearly">Anual</option><option value="weekly">Semanal</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Categoría</label><select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}</select></div>
                        <div><label className="text-sm text-muted mb-1 block">Próximo cobro</label><input className="input-field" type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} required /></div>
                    </div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? "Guardar" : "Crear"}</button></div>
                </form>
            </Modal>
        </div>
    );
}
