"use client";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import type { Account, Income } from "../lib/types";
import { apiGet, apiPost, normalizeApiError } from "../lib/api";
import { incomeArraySchema, accountArraySchema } from "../lib/schemas";
import { toastError, toastSuccess } from "../lib/toast";
import { parse, percentages, toMajorUnits } from "../lib/money";
import { toMonthlyCents, type RecurrenceFrequency } from "../lib/dates";

const FREQ: Record<string, string> = { monthly: "Mensual", biweekly: "Quincenal", weekly: "Semanal" };
const TYPE_LABELS: Record<string, string> = { fixed: "Fijo", variable: "Variable" };

const ICONS = [
    "payments", "work", "storefront", "account_balance", "trending_up",
    "laptop_mac", "design_services", "attach_money", "savings", "handshake",
    "real_estate_agent", "school", "volunteer_activism",
];

/* ═══ Helpers ═══ */
function amountCentsOf(value: { amountCents?: number; amount?: number }) {
    if (typeof value.amountCents === "number") return value.amountCents;
    return parse(value.amount ?? 0);
}

function daysUntil(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function getNextOccurrences(incomes: Income[], count: number) {
    const events: { income: Income; date: Date }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const inc of incomes) {
        if (!inc.active) continue;
        const base = new Date(inc.nextDate);
        base.setHours(0, 0, 0, 0);

        let d = new Date(base);

        // Find first future occurrence using proper date arithmetic
        while (d < now) {
            d = advanceDate(d, inc.frequency);
        }

        // Collect next occurrences
        for (let i = 0; i < 4 && events.length < count * 3; i++) {
            events.push({ income: inc, date: new Date(d) });
            d = advanceDate(d, inc.frequency);
        }
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, count);
}

function advanceDate(d: Date, frequency: string): Date {
    const next = new Date(d);
    switch (frequency) {
        case "weekly":
            next.setDate(next.getDate() + 7);
            break;
        case "biweekly":
            next.setDate(next.getDate() + 14);
            break;
        case "monthly":
        default:
            next.setMonth(next.getMonth() + 1);
            break;
    }
    return next;
}

function getStabilityInfo(fixedPct: number): { label: string; color: string; icon: string; bg: string } {
    if (fixedPct >= 75) return { label: "Estable", color: "text-emerald-600", icon: "verified", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" };
    if (fixedPct >= 40) return { label: "Variable", color: "text-amber-600", icon: "swap_vert", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" };
    return { label: "Riesgoso", color: "text-red-500", icon: "warning", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" };
}

/* ═══ Component ═══ */
export default function IngresosPage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Income | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "", amount: "", frequency: "monthly", type: "fixed",
        nextDate: "", source: "", icon: "payments",
        accountId: "", creditCardId: "",
    });

    /* ── Fetching ── */
    const fetchData = async () => {
        try {
            const [inc, acc] = await Promise.all([
                apiGet("/api/incomes", incomeArraySchema),
                apiGet("/api/accounts", accountArraySchema),
            ]);
            setIncomes(Array.isArray(inc) ? inc : []);
            setAccounts(Array.isArray(acc) ? acc : []);
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    /* ── Computed ── */
    const active = incomes.filter(i => i.active);
    const monthlyTotalCents = active.reduce(
        (s, i) => s + toMonthlyCents(amountCentsOf(i), i.frequency as RecurrenceFrequency),
        0,
    );
    const fixedTotalCents = active
        .filter(i => i.type === "fixed")
        .reduce((s, i) => s + toMonthlyCents(amountCentsOf(i), i.frequency as RecurrenceFrequency), 0);
    const monthlyTotal = toMajorUnits(monthlyTotalCents);
    const fixedPct = percentages(fixedTotalCents, monthlyTotalCents, { clamp: true, decimals: 0 });
    const stability = getStabilityInfo(fixedPct);
    const upcoming = getNextOccurrences(incomes, 8); // Increased count for strip

    /* ── CRUD ── */
    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", amount: "", frequency: "monthly", type: "fixed", nextDate: new Date().toISOString().split("T")[0], source: "", icon: "payments", accountId: "", creditCardId: "" });
        setModalOpen(true);
    };
    const openEdit = (i: Income) => {
        setEditing(i);
        setForm({ name: i.name, amount: toMajorUnits(amountCentsOf(i)).toString(), frequency: i.frequency, type: i.type || "fixed", nextDate: i.nextDate.split("T")[0], source: i.source, icon: i.icon || "payments", accountId: i.accountId || "", creditCardId: i.creditCardId || "" });
        setModalOpen(true);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editing ? `/api/incomes/${editing.id}` : "/api/incomes";
            await apiPost(url, form, undefined, editing ? "PUT" : "POST");
            toastSuccess(editing ? "Ingreso actualizado" : "Ingreso creado");
            setModalOpen(false);
            fetchData();
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
    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        setIsDeleting(id);
        try {
            await apiPost(`/api/incomes/${id}`, null, undefined, "DELETE");
            toastSuccess("Ingreso eliminado");
            fetchData();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsDeleting(null);
            setPendingDeleteId(null);
        }
    };
    const toggleActive = async (i: Income) => {
        setIsSyncing(i.id);
        try {
            await apiPost(`/api/incomes/${i.id}`, { active: !i.active }, undefined, "PUT");
            toastSuccess(i.active ? "Ingreso pausado" : "Ingreso activado");
            fetchData();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsSyncing(null);
        }
    };

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* ═══ Green ambient — Income identity ═══ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
                <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full opacity-[0.035]"
                    style={{ background: 'radial-gradient(circle, #34d399, transparent 70%)' }} />
            </div>

            {/* ═══════════ HEADER ═══════════ */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Ingresos</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Planificación y Estabilidad Financiera</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.97]">
                    <span className="material-icons-round text-lg">add</span>
                    Nuevo Ingreso
                </button>
            </header>

            {/* ═══════════ SECTION 1: CALENDAR STRIP (Rhythm) ═══════════ */}
            <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="material-icons-round text-emerald-600">event</span>
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Calendario de Cobros</h2>
                </div>

                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                    {upcoming.length === 0 && (
                        <div className="w-full py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-400 text-sm">No hay cobros próximos</p>
                        </div>
                    )}

                    {upcoming.map((ev, idx) => {
                        const d = daysUntil(ev.date.toISOString());
                        const isNext = idx === 0;
                        return (
                            <div key={`${ev.income.id}-${idx}`}
                                className={`snap-start shrink-0 w-40 p-4 rounded-2xl border transition-all relative overflow-hidden group
                                ${isNext
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/20 rhythm-fade"
                                        : "liquid-card text-slate-600 dark:text-slate-300"
                                    }`}>
                                {isNext && <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl" />}

                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isNext ? "text-emerald-100" : "text-slate-400"}`}>
                                    {d === 0 ? "HOY" : d === 1 ? "MAÑANA" : `EN ${d} DÍAS`}
                                </p>
                                <p className={`text-2xl font-bold mb-1 ${isNext ? "text-white" : "text-slate-800 dark:text-white"}`}>
                                    {ev.date.getDate()}
                                </p>
                                <p className={`text-xs font-medium mb-3 ${isNext ? "text-emerald-100" : "text-slate-400"}`}>
                                    {ev.date.toLocaleDateString("es-MX", { month: "long" })}
                                </p>

                                <div className="border-t border-white/20 dark:border-slate-700/50 pt-3">
                                    <p className={`text-sm font-bold truncate ${isNext ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                        {ev.income.name}
                                    </p>
                                    <p className={`text-xs ${isNext ? "text-emerald-100" : "text-emerald-600"}`}>
                                        +{formatCurrency(toMajorUnits(amountCentsOf(ev.income)))}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════ SECTION 2: STABILITY BANNER ═══════════ */}
            <div className={`rounded-2xl p-6 border relative overflow-hidden flex flex-col md:flex-row items-center gap-6 ${stability.bg}`}>
                {/* Visual Ring */}
                <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-200 dark:text-slate-700/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className={`${stability.color}`} strokeDasharray={`${fixedPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-sm font-bold ${stability.color}`}>{fixedPct}%</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">Fijo</span>
                    </div>
                </div>

                {/* Text Info */}
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2">
                        <span className="material-icons-round">{stability.icon}</span>
                        Estabilidad: {stability.label}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                        {fixedPct >= 75
                            ? "Tu flujo de efectivo es altamente predecible. Esto te permite planificar ahorros e inversiones con confianza."
                            : "Considera diversificar o asegurar más fuentes de ingreso fijo para reducir la incertidumbre financiera."}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-8 text-right">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mensual</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(monthlyTotal)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Anual Est.</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(toMajorUnits(monthlyTotalCents * 12))}</p>
                    </div>
                </div>
            </div>

            {/* ═══════════ MAIN LIST (Full Width) ═══════════ */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fuentes de Ingreso</h2>
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                        {active.length} activa{active.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add New Card (First item) */}
                    <button onClick={openCreate} className="group flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all text-slate-400 hover:text-emerald-600">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center">
                            <span className="material-icons-round text-2xl">add</span>
                        </div>
                        <span className="text-sm font-bold">Agregar Nueva Fuente</span>
                    </button>

                    {incomes.map(inc => {
                        const dLeft = daysUntil(inc.nextDate);

                        return (
                            <div key={inc.id} className={`relative p-5 rounded-2xl border transition-all group hover:shadow-md
                                ${!inc.active
                                    ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 grayscale opacity-70"
                                    : "liquid-card liquid-card-hover hover:border-emerald-200 dark:hover:border-emerald-800"
                                }`}>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                                            style={{ backgroundColor: inc.color || '#10b981' }}>
                                            <span className="material-icons-round text-xl">{inc.icon || "payments"}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{inc.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{inc.source || "Sin fuente específica"}</p>
                                        </div>
                                    </div>
                                    <button
                                        aria-label={`Editar ingreso ${inc.name}`}
                                        onClick={() => openEdit(inc)}
                                        className="touch-target focus-ring text-slate-300 hover:text-emerald-600 transition-colors"
                                    >
                                        <span className="material-icons-round">more_vert</span>
                                    </button>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${inc.type === "fixed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                        : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                        }`}>
                                        {TYPE_LABELS[inc.type]}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        {FREQ[inc.frequency]}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Próximo</p>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            <span className="material-icons-round text-sm text-emerald-500">
                                                {dLeft < 0 ? "warning" : "event"}
                                            </span>
                                            {new Date(inc.nextDate).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Monto</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                            +{formatCurrency(toMajorUnits(amountCentsOf(inc)))}
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-100 dark:border-slate-700 p-1 flex gap-1">
                                    <button
                                        aria-label={inc.active ? `Pausar ingreso ${inc.name}` : `Activar ingreso ${inc.name}`}
                                        disabled={isSyncing === inc.id}
                                        onClick={() => toggleActive(inc)}
                                        className="touch-target focus-ring p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-600 disabled:opacity-60"
                                    >
                                        <span className="material-icons-round text-lg">{inc.active ? "pause" : "play_arrow"}</span>
                                    </button>
                                    <button
                                        aria-label={`Eliminar ingreso ${inc.name}`}
                                        disabled={isDeleting === inc.id}
                                        onClick={() => requestDelete(inc.id)}
                                        className="touch-target focus-ring p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 disabled:opacity-60"
                                    >
                                        <span className="material-icons-round text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════ MODAL ═══════════ */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Ingreso" : "Nuevo Ingreso"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                        <input className="input-field focus:ring-emerald-500 focus:border-emerald-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Salario, Freelance, Rentas..." required />
                        {/* PWA fix for keyboard focus */}
                    </div>

                    {/* Amount + Frequency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Monto</label>
                            <input className="input-field focus:ring-emerald-500 focus:border-emerald-500" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Frecuencia</label>
                            <select className="input-field focus:ring-emerald-500 focus:border-emerald-500" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                <option value="monthly">Mensual</option>
                                <option value="biweekly">Quincenal</option>
                                <option value="weekly">Semanal</option>
                            </select>
                        </div>
                    </div>

                    {/* Type + Source */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Tipo</label>
                            <select className="input-field focus:ring-emerald-500 focus:border-emerald-500" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="fixed">Fijo</option>
                                <option value="variable">Variable</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Fuente (Opcional)</label>
                            <input className="input-field focus:ring-emerald-500 focus:border-emerald-500" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Empresa, Cliente..." />
                        </div>
                    </div>

                    {/* Next Date */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Próximo pago</label>
                        <input className="input-field focus:ring-emerald-500 focus:border-emerald-500" type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} required />
                    </div>

                    {/* Destination */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Se deposita en</label>
                        <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                            <button type="button" onClick={() => setForm({ ...form, accountId: "", creditCardId: "" })}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${!form.accountId && !form.creditCardId ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                <span className="material-icons-round text-slate-400 text-lg">account_balance_wallet</span>
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Sin especificar</span>
                            </button>
                            {accounts.map(a => (
                                <button key={a.id} type="button" onClick={() => setForm({ ...form, accountId: a.id, creditCardId: "" })}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${form.accountId === a.id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: a.color }}>
                                        <span className="material-icons-round text-sm">{a.icon || "account_balance"}</span>
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon picker */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Ícono</label>
                        <div className="flex flex-wrap gap-2">
                            {ICONS.map(ic => (
                                <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${form.icon === ic
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                                        : "bg-white dark:bg-[#1a262d] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}>
                                    <span className="material-icons-round text-lg">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSaving}>Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60" disabled={isSaving}>
                            {isSaving ? "Guardando..." : editing ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog
                open={pendingDeleteId !== null}
                title="Eliminar ingreso"
                description="Esta acción eliminará el ingreso de forma permanente."
                confirmText="Eliminar"
                loading={isDeleting !== null}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
}
