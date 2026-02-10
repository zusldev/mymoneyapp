"use client";

import { useEffect, useState } from "react";
import { Plus, CreditCard, Loader2, Trash2, Edit2, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency, analyzeCreditCard } from "../lib/financialEngine";

interface CardData {
    id: string;
    name: string;
    bank: string;
    lastFour: string;
    creditLimit: number;
    balance: number;
    cutDate: number;
    payDate: number;
    apr: number;
    color: string;
    _count?: { transactions: number };
}

const colorOptions = ["#8b5cf6", "#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#ec4899", "#06d6a0"];

export default function TarjetasPage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardData | null>(null);
    const [form, setForm] = useState({
        name: "", bank: "", lastFour: "", creditLimit: "", balance: "",
        cutDate: "1", payDate: "20", apr: "0", color: "#8b5cf6",
    });

    const fetchCards = () => {
        fetch("/api/credit-cards").then((r) => r.json()).then(setCards).finally(() => setLoading(false));
    };

    useEffect(() => { fetchCards(); }, []);

    const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);
    const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);

    const openCreate = () => {
        setEditingCard(null);
        setForm({ name: "", bank: "", lastFour: "", creditLimit: "", balance: "", cutDate: "1", payDate: "20", apr: "0", color: "#8b5cf6" });
        setModalOpen(true);
    };

    const openEdit = (card: CardData) => {
        setEditingCard(card);
        setForm({
            name: card.name, bank: card.bank, lastFour: card.lastFour,
            creditLimit: card.creditLimit.toString(), balance: card.balance.toString(),
            cutDate: card.cutDate.toString(), payDate: card.payDate.toString(),
            apr: card.apr.toString(), color: card.color,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingCard ? "PUT" : "POST";
        const url = editingCard ? `/api/credit-cards/${editingCard.id}` : "/api/credit-cards";
        await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false);
        fetchCards();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta tarjeta?")) return;
        await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
        fetchCards();
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tarjetas de Crédito</h1>
                    <p className="text-muted text-sm mt-1">Monitorea utilización y riesgo</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nueva Tarjeta</span>
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-5 glow-purple">
                    <p className="text-sm text-muted mb-1">Deuda Total</p>
                    <p className="text-2xl font-bold text-purple tabular-nums">{formatCurrency(totalDebt)}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                    <p className="text-sm text-muted mb-1">Crédito Total</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalLimit)}</p>
                </div>
                <div className="glass-card rounded-2xl p-5">
                    <p className="text-sm text-muted mb-1">Utilización Global</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                        {totalLimit > 0 ? ((totalDebt / totalLimit) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-children">
                {cards.map((card) => {
                    const analysis = analyzeCreditCard(card);
                    const RiskIcon = analysis.riskLevel === "bajo" ? ShieldCheck : analysis.riskLevel === "medio" ? ShieldAlert : AlertTriangle;
                    return (
                        <div key={card.id} className="glass-card rounded-2xl overflow-hidden group">
                            {/* Card Header with gradient */}
                            <div className="p-5 relative" style={{ background: `linear-gradient(135deg, ${card.color}33, ${card.color}11)` }}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-lg font-bold text-foreground">{card.name}</p>
                                        <p className="text-sm text-muted">{card.bank} {card.lastFour ? `•••• ${card.lastFour}` : ""}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(card)} className="p-2 rounded-lg hover:bg-white/10 text-muted hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(card.id)} className="p-2 rounded-lg hover:bg-rose/10 text-muted hover:text-rose"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground mt-3 tabular-nums">{formatCurrency(card.balance)}</p>
                                <p className="text-xs text-muted">de {formatCurrency(card.creditLimit)} límite</p>
                            </div>
                            {/* Utilization Bar */}
                            <div className="px-5 py-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted">Utilización</span>
                                    <span className={`flex items-center gap-1 font-semibold ${analysis.riskLevel === "bajo" ? "text-green-400" :
                                            analysis.riskLevel === "medio" ? "text-amber" :
                                                analysis.riskLevel === "alto" ? "text-orange-400" : "text-rose"
                                        }`}>
                                        <RiskIcon className="w-4 h-4" />
                                        {analysis.utilization.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-bar-fill" style={{
                                        width: `${Math.min(analysis.utilization, 100)}%`,
                                        background: analysis.utilization <= 30 ? "#06d6a0" : analysis.utilization <= 50 ? "#fbbf24" : analysis.utilization <= 75 ? "#f97316" : "#ef4444",
                                    }} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-muted">Pago mínimo</p>
                                        <p className="text-foreground font-medium tabular-nums">{formatCurrency(analysis.minimumPayment)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted">No intereses</p>
                                        <p className="text-foreground font-medium tabular-nums">{formatCurrency(analysis.noInterestPayment)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted">Disponible</p>
                                        <p className="text-cyan font-medium tabular-nums">{formatCurrency(analysis.availableCredit)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted">Corte / Pago</p>
                                        <p className="text-foreground font-medium">Día {card.cutDate} / {card.payDate}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted italic">{analysis.impactDescription}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {cards.length === 0 && (
                <div className="text-center py-16 glass-card rounded-2xl">
                    <CreditCard className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">No hay tarjetas registradas</p>
                    <button onClick={openCreate} className="btn-primary mt-4">Agregar Tarjeta</button>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? "Editar Tarjeta" : "Nueva Tarjeta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: AMEX Platinum" required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Banco</label><input className="input-field" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Ej: BBVA" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Últimos 4 dígitos</label><input className="input-field" maxLength={4} value={form.lastFour} onChange={(e) => setForm({ ...form, lastFour: e.target.value })} placeholder="1234" /></div>
                        <div><label className="text-sm text-muted mb-1 block">APR %</label><input className="input-field" type="number" step="0.1" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Límite de crédito</label><input className="input-field" type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} required /></div>
                        <div><label className="text-sm text-muted mb-1 block">Saldo actual</label><input className="input-field" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-muted mb-1 block">Día de corte</label><input className="input-field" type="number" min="1" max="31" value={form.cutDate} onChange={(e) => setForm({ ...form, cutDate: e.target.value })} /></div>
                        <div><label className="text-sm text-muted mb-1 block">Día de pago</label><input className="input-field" type="number" min="1" max="31" value={form.payDate} onChange={(e) => setForm({ ...form, payDate: e.target.value })} /></div>
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Color</label>
                        <div className="flex gap-2">{colorOptions.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"}`} style={{ backgroundColor: c }} />))}</div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="btn-primary flex-1">{editingCard ? "Guardar" : "Crear"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
