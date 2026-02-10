"use client";
import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS } from "../lib/categories";

/* ═══ Types ═══ */
interface Account { id: string; name: string; icon: string; color: string; }
interface CreditCard { id: string; name: string; bank: string; lastFour: string; color: string; }
interface Sub {
    id: string; name: string; amount: number; frequency: string; category: string;
    type: string; nextDate: string; active: boolean; color: string; icon: string;
    accountId: string | null; creditCardId: string | null;
    account?: Account | null; creditCard?: CreditCard | null;
    createdAt: string;
}

type Filter = "all" | "active" | "paused";

const FREQ: Record<string, string> = { monthly: "Mensual", yearly: "Anual", weekly: "Semanal" };
const TYPE_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    critical: { label: "Esencial", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", icon: "shield" },
    productive: { label: "Productivo", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800", icon: "work" },
    entertainment: { label: "Entretenimiento", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800", icon: "sports_esports" },
};

const SUB_ICONS = [
    "sync", "movie", "music_note", "cloud", "smart_toy", "fitness_center",
    "school", "bolt", "storage", "vpn_key", "games_outlined", "newspaper",
    "podcasts", "design_services", "code",
];

/* ═══ Helpers ═══ */
function toMonthly(amount: number, freq: string) {
    if (freq === "yearly") return amount / 12;
    if (freq === "weekly") return amount * 4.33;
    return amount;
}
function toYearly(amount: number, freq: string) {
    if (freq === "yearly") return amount;
    if (freq === "weekly") return amount * 52;
    return amount * 12;
}

function daysUntil(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function monthsSince(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}



/* ═══ Component ═══ */
export default function SuscripcionesPage() {
    const [subs, setSubs] = useState<Sub[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [incomes, setIncomes] = useState<{ amount: number; frequency: string; active: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Sub | null>(null);
    const [simulateCancelled, setSimulateCancelled] = useState<Set<string>>(new Set());
    const [form, setForm] = useState({
        name: "", amount: "", frequency: "monthly", category: "suscripciones",
        type: "entertainment", nextDate: "", color: "#f59e0b", icon: "sync",
        accountId: "", creditCardId: "",
    });
    const [expandedId, setExpandedId] = useState<string | null>(null);

    /* ── Fetch ── */
    const fetchData = async () => {
        try {
            const [subRes, accRes, ccRes, incRes] = await Promise.all([
                fetch("/api/subscriptions"), fetch("/api/accounts"),
                fetch("/api/credit-cards"), fetch("/api/incomes"),
            ]);
            const [sub, acc, , inc] = await Promise.all([subRes.json(), accRes.json(), ccRes.json(), incRes.json()]);
            setSubs(Array.isArray(sub) ? sub : []);
            setAccounts(Array.isArray(acc) ? acc : []);
            setIncomes(Array.isArray(inc) ? inc : []);
        } catch { /* */ } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    /* ── Computed ── */
    const activeSubs = subs.filter(s => s.active);
    const pausedSubs = subs.filter(s => !s.active);
    const monthlyTotal = activeSubs.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const monthlyIncome = incomes.filter(i => i.active).reduce((s, i) => {
        const m = i.frequency === "weekly" ? i.amount * 4.33 : i.frequency === "biweekly" ? i.amount * 2 : i.amount;
        return s + m;
    }, 0);
    const incomePct = monthlyIncome > 0 ? Math.round((monthlyTotal / monthlyIncome) * 100) : 0;

    const criticalTotal = activeSubs.filter(s => s.type === "critical").reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const productiveTotal = activeSubs.filter(s => s.type === "productive").reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const entertainmentTotal = monthlyTotal - criticalTotal - productiveTotal;

    const filtered = filter === "active" ? activeSubs : filter === "paused" ? pausedSubs : subs;

    /* ── Simulator ── */
    const simSavingsMonthly = Array.from(simulateCancelled).reduce((s, id) => {
        const sub = activeSubs.find(x => x.id === id);
        return sub ? s + toMonthly(sub.amount, sub.frequency) : s;
    }, 0);
    const toggleSimulate = (id: string) => {
        const n = new Set(simulateCancelled);
        if (n.has(id)) n.delete(id); else n.add(id);
        setSimulateCancelled(n);
    };

    /* ── AI Insights ── */
    const insights: { icon: string; title: string; desc: string; type: "info" | "warn" | "success" | "danger" }[] = [];

    // Income % warning
    if (incomePct > 15) {
        insights.push({ icon: "warning", title: "Alto porcentaje de ingreso", desc: `Tus suscripciones consumen ${incomePct}% de tus ingresos. Se recomienda mantener debajo del 15%.`, type: "warn" });
    } else if (incomePct > 0 && incomePct <= 15) {
        insights.push({ icon: "check_circle", title: "Suscripciones bajo control", desc: `Solo ${incomePct}% de tus ingresos va a suscripciones. ¡Bien gestionado!`, type: "success" });
    }

    // Entertainment dominance
    if (monthlyTotal > 0 && entertainmentTotal / monthlyTotal > 0.6 && activeSubs.length > 2) {
        insights.push({ icon: "sports_esports", title: "Entretenimiento dominante", desc: `${Math.round((entertainmentTotal / monthlyTotal) * 100)}% de tus suscripciones son entretenimiento. Revisa si todas aportan valor.`, type: "info" });
    }

    // Overlapping streaming
    const streamingSubs = activeSubs.filter(s => ["entretenimiento", "suscripciones"].includes(s.category) && s.type === "entertainment");
    if (streamingSubs.length >= 3) {
        insights.push({ icon: "content_copy", title: "Posible redundancia", desc: `Tienes ${streamingSubs.length} servicios de entretenimiento. ¿Usas todos activamente?`, type: "warn" });
    }

    // Old subscriptions
    const oldSubs = activeSubs.filter(s => monthsSince(s.createdAt) > 6);
    if (oldSubs.length > 0) {
        const oldest = oldSubs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        insights.push({ icon: "history", title: "Suscripción longeva", desc: `"${oldest.name}" lleva ${monthsSince(oldest.createdAt)} meses activa. Revisa si aún la necesitas.`, type: "info" });
    }

    // Savings opportunity
    if (entertainmentTotal > 0 && activeSubs.filter(s => s.type === "entertainment").length >= 2) {
        insights.push({ icon: "savings", title: "Oportunidad de ahorro", desc: `Cancelar las suscripciones de entretenimiento menos usadas te ahorraría ~${formatCurrency(entertainmentTotal * 0.4)}/mes.`, type: "success" });
    }

    /* ── Card concentration ── */
    const cardUsage: Record<string, { name: string; count: number; total: number }> = {};
    for (const s of activeSubs) {
        const key = s.creditCardId || s.accountId || "none";
        const label = s.creditCard ? `${s.creditCard.name} ····${s.creditCard.lastFour}` : s.account ? s.account.name : null;
        if (label) {
            if (!cardUsage[key]) cardUsage[key] = { name: label, count: 0, total: 0 };
            cardUsage[key].count++;
            cardUsage[key].total += toMonthly(s.amount, s.frequency);
        }
    }

    /* ── CRUD ── */
    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", amount: "", frequency: "monthly", category: "suscripciones", type: "entertainment", nextDate: new Date().toISOString().split("T")[0], color: "#f59e0b", icon: "sync", accountId: "", creditCardId: "" });
        setModalOpen(true);
    };
    const openEdit = (s: Sub) => {
        setEditing(s);
        setForm({ name: s.name, amount: s.amount.toString(), frequency: s.frequency, category: s.category, type: s.type || "entertainment", nextDate: s.nextDate.split("T")[0], color: s.color, icon: s.icon || "sync", accountId: s.accountId || "", creditCardId: s.creditCardId || "" });
        setModalOpen(true);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editing ? `/api/subscriptions/${editing.id}` : "/api/subscriptions";
        await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        setModalOpen(false); fetchData();
    };
    /* const toggle = async (s: Sub) => {
        await fetch(`/api/subscriptions/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) });
        fetchData();
    }; */
    const del = async (id: string) => { if (!confirm("¿Eliminar esta suscripción?")) return; await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); fetchData(); };

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24">

            {/* ═══════════ HEADER ═══════════ */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Suscripciones</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Optimiza tus gastos recurrentes</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-600/20 active:scale-[0.97]">
                    <span className="material-icons-round text-lg">add</span>
                    Nueva Suscripción
                </button>
            </header>

            {/* ═══════════ SECTION 1: SPENDING DNA (Stacked Bar) ═══════════ */}
            <div className="bg-white dark:bg-[#1a262d] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">ADN de Suscripciones</h2>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(monthlyTotal)}</span>
                        <span className="text-xs text-slate-400 block">mensual total</span>
                    </div>
                </div>

                {/* Stacked Bar */}
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-4">
                    {/* Critical */}
                    <div className="h-full bg-slate-800 dark:bg-slate-400 transition-all duration-1000" style={{ width: `${(criticalTotal / monthlyTotal) * 100}%` }} />
                    {/* Productive */}
                    <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${(productiveTotal / monthlyTotal) * 100}%` }} />
                    {/* Entertainment */}
                    <div className="h-full bg-fuchsia-400 transition-all duration-1000" style={{ width: `${(entertainmentTotal / monthlyTotal) * 100}%` }} />
                </div>

                {/* Legend / Metrics */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-400" />
                            <span className="text-xs font-semibold text-slate-500">Esencial</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(criticalTotal)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Productivo</span>
                        </div>
                        <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{formatCurrency(productiveTotal)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-100 dark:border-fuchsia-800/30">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
                            <span className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400">Ocio</span>
                        </div>
                        <span className="text-sm font-bold text-fuchsia-700 dark:text-fuchsia-300">{formatCurrency(entertainmentTotal)}</span>
                    </div>
                </div>
            </div>

            {/* ═══════════ MAIN LIST (Modular Cards) ═══════════ */}
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {([
                        { key: "all" as Filter, label: "Todas" },
                        { key: "active" as Filter, label: `Activas` },
                        { key: "paused" as Filter, label: `Pausadas` },
                    ]).map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${filter === f.key
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-white dark:bg-[#1a262d] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-300"}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-[#1a262d] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-icons-round text-4xl text-slate-200 dark:text-slate-700 mb-3 block">search_off</span>
                        <p className="text-slate-400">No se encontraron suscripciones</p>
                    </div>
                )}

                <div className="space-y-3">
                    {filtered.map(sub => {
                        const isExpanded = expandedId === sub.id;
                        const dLeft = daysUntil(sub.nextDate);
                        const isSoon = dLeft >= 0 && dLeft <= 3;
                        const isSimulated = simulateCancelled.has(sub.id);

                        return (
                            <div key={sub.id}
                                className={`bg-white dark:bg-[#1a262d] rounded-2xl shadow-sm border transition-all overflow-hidden ${isExpanded
                                    ? "ring-2 ring-violet-500/20 border-violet-500/50"
                                    : "border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800"
                                    } ${isSimulated ? "opacity-60 grayscale-[0.8]" : ""}`}>

                                {/* Header Row (Always Visible) */}
                                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sub.id)}>
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-xl text-white transition-transform duration-300"
                                        style={{ backgroundColor: sub.color || '#8b5cf6', transform: isExpanded ? 'scale(1.1)' : 'scale(1)' }}>
                                        <span className="material-icons-round">{sub.icon || "sync"}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{sub.name}</h3>
                                            <p className="font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(sub.amount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md ${sub.type === "critical" ? "text-slate-500 bg-slate-100 dark:bg-slate-800" :
                                                    sub.type === "productive" ? "text-violet-600 bg-violet-50 dark:bg-violet-900/20" :
                                                        "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/20"
                                                    }`}>{TYPE_LABELS[sub.type]?.label || sub.type}</span>
                                                <span className="text-xs text-slate-400">{FREQ[sub.frequency] || sub.frequency}</span>
                                            </div>
                                            <p className={`text-xs font-medium ${isSoon ? "text-amber-600" : "text-slate-400"}`}>
                                                {dLeft === 0 ? "Hoy" : `${dLeft} días`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expand Chevron */}
                                    <span className={`material-icons-round text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180 text-violet-500" : ""}`}>expand_more</span>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="collapse-expand bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 p-4">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-1">Categoría</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons-round text-sm text-slate-500">label</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{(CATEGORIES[sub.category as keyof typeof CATEGORIES] || CATEGORIES.otros).label}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-1">Próximo cobro</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons-round text-sm text-slate-500">event</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{new Date(sub.nextDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-1">Método de pago</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons-round text-sm text-slate-500">credit_card</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {sub.creditCard ? `Tarjeta ends ${sub.creditCard.lastFour}` : sub.account ? sub.account.name : "No especificado"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block mb-1">Costo anual</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-icons-round text-sm text-slate-500">savings</span>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">{formatCurrency(toYearly(sub.amount, sub.frequency))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/50 mt-2">
                                            <button onClick={(e) => { e.stopPropagation(); toggleSimulate(sub.id); }}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${isSimulated
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : "bg-white dark:bg-white/5 text-slate-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 border border-slate-200 dark:border-slate-700"}`}>
                                                <span className="material-icons-round text-sm">science</span>
                                                {isSimulated ? "Restaurar" : "Simular Cancelación"}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(sub); }}
                                                className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-violet-600 hover:border-violet-200 text-xs font-bold">
                                                Editar
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); del(sub.id); }}
                                                className="px-4 py-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-500 hover:border-red-200 text-xs font-bold">
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════ FLOATING SIMULATOR BAR ═══════════ */}
            {simulateCancelled.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 dark:bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-4 flex items-center justify-between text-white dark:text-slate-900 z-50 animate-slide-up border border-white/10">
                    <div>
                        <p className="text-xs opacity-80 mb-0.5">Ahorro potencial ({simulateCancelled.size} items)</p>
                        <p className="text-xl font-bold tabular-nums">{formatCurrency(simSavingsMonthly)}<span className="text-sm font-normal opacity-60">/mes</span></p>
                    </div>
                    <button onClick={() => setSimulateCancelled(new Set())}
                        className="px-4 py-2 bg-white/20 dark:bg-slate-900/10 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
                        Descartar
                    </button>
                </div>
            )}

            {/* ═══════════ MODAL ═══════════ */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Suscripción" : "Nueva Suscripción"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                        <input className="input-field focus:ring-violet-500 focus:border-violet-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix, Spotify, ChatGPT..." required />
                        {/* PWA fix for keyboard focus */}
                    </div>

                    {/* Amount + Frequency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Monto</label>
                            <input className="input-field focus:ring-violet-500 focus:border-violet-500" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Frecuencia</label>
                            <select className="input-field focus:ring-violet-500 focus:border-violet-500" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                                <option value="weekly">Semanal</option>
                            </select>
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["critical", "productive", "entertainment"] as const).map(t => {
                                const info = TYPE_LABELS[t];
                                return (
                                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                                        className={`py-2.5 rounded-lg text-xs font-semibold transition-all border flex flex-col items-center gap-1 ${form.type === t
                                            ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300"
                                            : "bg-white dark:bg-[#1a262d] text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                        <span className="material-icons-round text-base">{info.icon}</span>
                                        {info.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category + Next Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Categoría</label>
                            <select className="input-field focus:ring-violet-500 focus:border-violet-500" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Próximo cobro</label>
                            <input className="input-field focus:ring-violet-500 focus:border-violet-500" type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} required />
                        </div>
                    </div>

                    {/* Destination (Account) */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Se cobra en</label>
                        <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                            <button type="button" onClick={() => setForm({ ...form, accountId: "", creditCardId: "" })}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${!form.accountId && !form.creditCardId ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                <span className="material-icons-round text-slate-400 text-lg">block</span>
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Sin especificar</span>
                            </button>
                            {accounts.map(a => (
                                <button key={a.id} type="button" onClick={() => setForm({ ...form, accountId: a.id, creditCardId: "" })}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${form.accountId === a.id ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
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
                            {SUB_ICONS.slice(0, 10).map(ic => (
                                <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${form.icon === ic
                                        ? "bg-violet-50 border-violet-500 text-violet-600"
                                        : "bg-white dark:bg-[#1a262d] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}>
                                    <span className="material-icons-round text-lg">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold shadow-lg shadow-violet-500/20 transition-all">{editing ? "Guardar" : "Crear"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
