"use client";
import { useEffect, useState } from "react";
import { Plus, TrendingUp, Loader2, Trash2, Edit2 } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";

interface Income { id: string; name: string; amount: number; frequency: string; nextDate: string; source: string; active: boolean; }

export default function IngresosPage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Income | null>(null);
    const [form, setForm] = useState({ name: "", amount: "", frequency: "monthly", nextDate: "", source: "" });

    const fetch_ = () => { fetch("/api/incomes").then(r => r.json()).then(setIncomes).finally(() => setLoading(false)); };
    useEffect(() => { fetch_(); }, []);

    const monthlyTotal = incomes.filter(i => i.active).reduce((sum, i) => {
        if (i.frequency === "biweekly") return sum + i.amount * 2;
        if (i.frequency === "weekly") return sum + i.amount * 4.33;
        return sum + i.amount;
    }, 0);

    const openCreate = () => { setEditing(null); setForm({ name: "", amount: "", frequency: "monthly", nextDate: new Date().toISOString().split("T")[0], source: "" }); setModalOpen(true); };
    const openEdit = (i: Income) => { setEditing(i); setForm({ name: i.name, amount: i.amount.toString(), frequency: i.frequency, nextDate: i.nextDate.split("T")[0], source: i.source }); setModalOpen(true); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editing ? `/api/incomes/${editing.id}` : "/api/incomes";
        await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false); fetch_();
    };

    const del = async (id: string) => { if (!confirm("¿Eliminar?")) return; await fetch(`/api/incomes/${id}`, { method: "DELETE" }); fetch_(); };
    const freq: Record<string, string> = { monthly: "Mensual", biweekly: "Quincenal", weekly: "Semanal" };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-foreground">Ingresos</h1><p className="text-muted text-sm mt-1">Fuentes de ingreso recurrentes</p></div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo</span></button>
            </div>

            <div className="glass-card rounded-2xl p-6 glow-cyan">
                <p className="text-sm text-muted mb-1">Ingreso Mensual Esperado</p>
                <p className="text-3xl font-bold text-cyan tabular-nums">{formatCurrency(monthlyTotal)}</p>
                <p className="text-xs text-muted mt-1">{incomes.filter(i => i.active).length} fuente{incomes.filter(i => i.active).length !== 1 ? "s" : ""} activa{incomes.filter(i => i.active).length !== 1 ? "s" : ""}</p>
            </div>

            <div className="glass-card rounded-2xl divide-y divide-border/30">
                {incomes.map(i => (
                    <div key={i.id} className="flex items-center justify-between px-5 py-4 group hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-glow"><TrendingUp className="w-4 h-4 text-cyan" /></div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{i.name}</p>
                                <p className="text-xs text-muted">{freq[i.frequency] || i.frequency}{i.source ? ` • ${i.source}` : ""}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-cyan tabular-nums">+{formatCurrency(i.amount)}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del(i.id)} className="p-1.5 rounded-lg hover:bg-rose/10 text-muted hover:text-rose"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {incomes.length === 0 && <div className="text-center py-16 glass-card rounded-2xl"><TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" /><p className="text-muted">No hay ingresos registrados</p><button onClick={openCreate} className="btn-primary mt-4">Agregar</button></div>}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Ingreso" : "Nuevo Ingreso"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="text-sm text-muted mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Salario, Freelance" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Monto</label><input className="input-field" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Frecuencia</label><select className="input-field" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="monthly">Mensual</option><option value="biweekly">Quincenal</option><option value="weekly">Semanal</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Fuente</label><input className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Empresa, cliente..." /></div>
                        <div><label className="text-sm text-muted mb-1 block">Próximo pago</label><input className="input-field" type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} required /></div>
                    </div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">{editing ? "Guardar" : "Crear"}</button></div>
                </form>
            </Modal>
        </div>
    );
}
