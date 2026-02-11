"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency, analyzeCreditCard } from "../lib/financialEngine";
import type { CardData } from "../lib/types";
import { apiGet, apiPost, normalizeApiError } from "../lib/api";
import { toastError, toastSuccess } from "../lib/toast";
import { creditCardArraySchema } from "../lib/schemas";

// Gradient presets for visual cards
const CARD_GRADIENTS = [
    "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    "linear-gradient(135deg, #2badee 0%, #1d8abf 100%)",
    "linear-gradient(135deg, #475569 0%, #334155 100%)",
    "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
    "linear-gradient(135deg, #059669 0%, #047857 100%)",
    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
];

const colorOptions = ["#8b5cf6", "#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#ec4899", "#06d6a0"];

export default function TarjetasPage() {
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CardData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "", bank: "", lastFour: "", creditLimit: "", balance: "",
        cutDate: "1", payDate: "20", apr: "0", color: "#8b5cf6",
    });

    const fetchCards = async () => {
        try {
            const data = await apiGet("/api/credit-cards", creditCardArraySchema);
            setCards(Array.isArray(data) ? data : []);
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCards(); }, []);

    const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);
    const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
    const globalUtilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

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
        setIsSaving(true);
        try {
            const method = editingCard ? "PUT" : "POST";
            const url = editingCard ? `/api/credit-cards/${editingCard.id}` : "/api/credit-cards";
            await apiPost(url, form, undefined, method);
            toastSuccess(editingCard ? "Tarjeta actualizada" : "Tarjeta creada");
            setModalOpen(false);
            fetchCards();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta tarjeta?")) return;
        setIsDeleting(id);
        try {
            await apiPost(`/api/credit-cards/${id}`, null, undefined, "DELETE");
            toastSuccess("Tarjeta eliminada");
            fetchCards();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsDeleting(null);
        }
    };

    // Utilization severity
    const getUtilColor = (pct: number) =>
        pct <= 30 ? { text: "text-green-500", bg: "bg-green-500", label: "Excelente", badgeBg: "bg-green-100 dark:bg-green-900/30", badgeText: "text-green-600 dark:text-green-400", panelBg: "bg-green-50 dark:bg-green-900/10", panelBorder: "border-green-100 dark:border-green-900/20", panelText: "text-green-700 dark:text-green-300", icon: "auto_awesome" } :
            pct <= 50 ? { text: "text-yellow-500", bg: "bg-yellow-500", label: "Moderada", badgeBg: "bg-yellow-100 dark:bg-yellow-900/30", badgeText: "text-yellow-600 dark:text-yellow-500", panelBg: "bg-yellow-50 dark:bg-yellow-900/10", panelBorder: "border-yellow-100 dark:border-yellow-900/20", panelText: "text-yellow-700 dark:text-yellow-400", icon: "lightbulb" } :
                { text: "text-red-500", bg: "bg-red-500", label: "Alta", badgeBg: "bg-red-100 dark:bg-red-900/30", badgeText: "text-red-600 dark:text-red-400", panelBg: "bg-red-50 dark:bg-red-900/10", panelBorder: "border-red-100 dark:border-red-900/20", panelText: "text-red-700 dark:text-red-400", icon: "warning" };

    const getUtilLabel = (pct: number) =>
        pct <= 10 ? "Excelente" : pct <= 30 ? "Buena" : pct <= 50 ? "Moderada" : pct <= 75 ? "Alta" : "Crítica";

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 border-4 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 stagger-children">
            {/* ═══ Summary Stats ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="liquid-card liquid-card-hover p-6 rounded-xl">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Saldo Total</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(totalDebt)}
                        </h3>
                        {totalDebt > 0 && (
                            <span className="text-sm text-green-500 font-medium flex items-center">
                                <span className="material-icons-round text-base">arrow_downward</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="liquid-card liquid-card-hover p-6 rounded-xl">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Crédito Total</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(totalLimit)}
                    </h3>
                </div>

                <div className="liquid-card rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-icons-round text-6xl text-[#2badee]">pie_chart</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tasa de Utilización</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-[#2badee] tabular-nums">
                            {globalUtilization.toFixed(1)}%
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${globalUtilization <= 30 ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
                            globalUtilization <= 50 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                                "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            }`}>
                            {getUtilLabel(globalUtilization)}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-4">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-1000 ${globalUtilization <= 30 ? "bg-green-500" : globalUtilization <= 50 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                            style={{ width: `${Math.min(globalUtilization, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ═══ Active Cards ═══ */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tarjetas Activas</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2badee] rounded-lg shadow-lg shadow-[#2badee]/30 hover:bg-[#1a8cb5] transition-colors"
                        >
                            <span className="material-icons-round text-base">add</span>
                            Nueva Tarjeta
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {cards.map((card, index) => {
                        const analysis = analyzeCreditCard(card);
                        const util = analysis.utilization;
                        const severity = getUtilColor(util);
                        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

                        return (
                            <div key={card.id} className="group relative hover-tilt">
                                {/* Floating Visual Card */}
                                <div
                                    className="h-56 rounded-2xl p-6 relative shadow-xl text-white flex flex-col justify-between overflow-hidden"
                                    style={{ background: gradient }}
                                >
                                    {/* Decorative elements */}
                                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                                    <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-[#2badee]/20 blur-xl" />

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons-round">credit_card</span>
                                            <span className="font-semibold tracking-wider uppercase">{card.bank}</span>
                                        </div>
                                        {/* Edit/Delete buttons */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button aria-label={`Editar ${card.name}`} onClick={() => openEdit(card)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                                                <span className="material-icons-round text-sm">edit</span>
                                            </button>
                                            <button
                                                aria-label={`Eliminar ${card.name}`}
                                                disabled={isDeleting === card.id}
                                                onClick={() => handleDelete(card.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-60"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <div className="text-2xl tracking-widest font-mono mb-1">
                                            •••• •••• •••• {card.lastFour || "0000"}
                                        </div>
                                        <div className="flex justify-between text-xs text-white/70 uppercase tracking-wider mt-4">
                                            <div>
                                                <div className="mb-1 text-[10px]">Tarjeta</div>
                                                <div className="font-medium text-white">{card.name}</div>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[10px]">Corte / Pago</div>
                                                <div className="font-medium text-white">{card.cutDate}/{card.payDate}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Panel */}
                                <div className="mt-4 liquid-card rounded-xl p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Saldo Actual</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(card.balance)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Límite</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{formatCurrency(card.creditLimit)}</p>
                                        </div>
                                    </div>

                                    {/* Utilization Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-medium text-slate-600 dark:text-slate-400">Utilización</span>
                                            <span className={`font-bold ${severity.text}`}>{util.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`${severity.bg} h-2 rounded-full transition-all duration-1000`}
                                                style={{
                                                    width: `${Math.min(util, 100)}%`,
                                                    boxShadow: `0 0 10px ${util <= 30 ? "rgba(34,197,94,0.5)" : util <= 50 ? "rgba(234,179,8,0.5)" : "rgba(239,68,68,0.5)"}`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* AI Badge */}
                                    <div className={`flex items-center gap-2 ${severity.panelBg} p-2.5 rounded-lg border ${severity.panelBorder}`}>
                                        <div className={`${severity.badgeBg} p-1 rounded-full ${severity.badgeText} flex items-center justify-center`}>
                                            <span className="material-icons-round text-sm">{severity.icon}</span>
                                        </div>
                                        <p className={`text-xs ${severity.panelText} font-medium`}>{analysis.impactDescription}</p>
                                    </div>

                                    <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                                        <span>Corte: Día {card.cutDate}</span>
                                        <a href="/transacciones" className="text-[#2badee] hover:underline">Ver Transacciones</a>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Card Placeholder */}
                    <div className="flex flex-col min-h-[400px]">
                        <button
                            onClick={openCreate}
                            className="flex-1 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-4 text-slate-400 hover:text-[#2badee] hover:border-[#2badee] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2badee]/10 flex items-center justify-center transition-colors">
                                <span className="material-icons-round text-3xl group-hover:text-[#2badee]">add</span>
                            </div>
                            <div className="text-center">
                                <span className="block font-semibold text-lg">Agregar Tarjeta</span>
                                <span className="text-sm opacity-70">Agrega manualmente</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {cards.length === 0 && (
                <div className="text-center py-16 liquid-card rounded-2xl">
                    <span className="material-icons-round text-5xl text-slate-300 mb-4">credit_card</span>
                    <p className="text-slate-500">No hay tarjetas registradas</p>
                    <button onClick={openCreate} className="btn-primary mt-4">Agregar Tarjeta</button>
                </div>
            )}

            {/* ═══ Modal ═══ */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? "Editar Tarjeta" : "Nueva Tarjeta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: AMEX Platinum" required /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Banco</label><input className="input-field" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Ej: BBVA" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Últimos 4 dígitos</label><input className="input-field" maxLength={4} value={form.lastFour} onChange={(e) => setForm({ ...form, lastFour: e.target.value })} placeholder="1234" /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">APR %</label><input className="input-field" type="number" step="0.1" value={form.apr} onChange={(e) => setForm({ ...form, apr: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Límite de crédito</label><input className="input-field" type="number" step="0.01" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} required /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Saldo actual</label><input className="input-field" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Día de corte</label><input className="input-field" type="number" min="1" max="31" value={form.cutDate} onChange={(e) => setForm({ ...form, cutDate: e.target.value })} /></div>
                        <div><label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Día de pago</label><input className="input-field" type="number" min="1" max="31" value={form.payDate} onChange={(e) => setForm({ ...form, payDate: e.target.value })} /></div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Color</label>
                        <div className="flex gap-2">{colorOptions.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-[#2badee]/50" : "hover:scale-110"}`} style={{ backgroundColor: c }} />))}</div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSaving}>Cancelar</button>
                        <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
                            {isSaving ? "Guardando..." : editingCard ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
