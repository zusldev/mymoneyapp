"use client";
import { useEffect, useState, useMemo } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS } from "../lib/categories";
import type { Account, CreditCard, Subscription as Sub } from "../lib/types";

type Filter = "all" | "active" | "paused";

const FREQ: Record<string, string> = { monthly: "Mensual", yearly: "Anual", weekly: "Semanal" };
const TYPE_META: Record<string, { label: string; icon: string; ring: string; badge: string }> = {
    critical: { label: "Esencial", icon: "shield", ring: "ring-slate-400/30", badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    productive: { label: "Productivo", icon: "work", ring: "ring-violet-400/30", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    entertainment: { label: "Ocio", icon: "sports_esports", ring: "ring-fuchsia-400/30", badge: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300" },
};

const SUB_ICONS = [
    "sync", "movie", "music_note", "cloud", "smart_toy", "fitness_center",
    "school", "bolt", "storage", "vpn_key", "games_outlined", "newspaper",
    "podcasts", "design_services", "code",
];

/* === Helpers === */
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

function daysLabel(days: number): string {
    if (days < 0) return "Vencido";
    if (days === 0) return "Hoy";
    if (days === 1) return "Ma\u00f1ana";
    if (days <= 7) return `${days} d\u00edas`;
    return `${days} d\u00edas`;
}

function monthsSince(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

/* === Component === */
export default function SuscripcionesPage() {
    const [subs, setSubs] = useState<Sub[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [incomes, setIncomes] = useState<{ amount: number; frequency: string; active: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Sub | null>(null);
    const [simulateCancelled, setSimulateCancelled] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "", amount: "", frequency: "monthly", category: "suscripciones",
        type: "entertainment", nextDate: "", color: "#8b5cf6", icon: "sync",
        accountId: "", creditCardId: "",
    });

    /* -- Fetch -- */
    const fetchData = async () => {
        try {
            const [subRes, accRes, ccRes, incRes] = await Promise.all([
                fetch("/api/subscriptions"), fetch("/api/accounts"),
                fetch("/api/credit-cards"), fetch("/api/incomes"),
            ]);
            const [sub, acc, cc, inc] = await Promise.all([subRes.json(), accRes.json(), ccRes.json(), incRes.json()]);
            setSubs(Array.isArray(sub) ? sub : []);
            setAccounts(Array.isArray(acc) ? acc : []);
            setCards(Array.isArray(cc) ? cc : []);
            setIncomes(Array.isArray(inc) ? inc : []);
        } catch { /* */ } finally { setLoading(false); }
    };
    useEffect(() => { fetchData(); }, []);

    /* -- Computed -- */
    const activeSubs = subs.filter(s => s.active);
    const pausedSubs = subs.filter(s => !s.active);
    const monthlyTotal = activeSubs.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const yearlyTotal = activeSubs.reduce((s, i) => s + toYearly(i.amount, i.frequency), 0);
    const monthlyIncome = incomes.filter(i => i.active).reduce((s, i) => {
        const m = i.frequency === "weekly" ? i.amount * 4.33 : i.frequency === "biweekly" ? i.amount * 2 : i.amount;
        return s + m;
    }, 0);
    const incomePct = monthlyIncome > 0 ? Math.round((monthlyTotal / monthlyIncome) * 100) : 0;

    const criticalTotal = activeSubs.filter(s => s.type === "critical").reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const productiveTotal = activeSubs.filter(s => s.type === "productive").reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
    const entertainmentTotal = Math.max(0, monthlyTotal - criticalTotal - productiveTotal);

    // Safe percentages (avoid NaN on division by zero)
    const safePct = (val: number) => monthlyTotal > 0 ? Math.round((val / monthlyTotal) * 100) : 0;
    const criticalPct = safePct(criticalTotal);
    const productivePct = safePct(productiveTotal);
    const entertainmentPct = safePct(entertainmentTotal);

    const filtered = filter === "active" ? activeSubs : filter === "paused" ? pausedSubs : subs;

    // Upcoming payments - next 5 sorted by date
    const upcoming = useMemo(() =>
        [...activeSubs]
            .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
            .slice(0, 5),
        [activeSubs]
    );

    /* -- Simulator -- */
    const simSavingsMonthly = Array.from(simulateCancelled).reduce((s, id) => {
        const sub = activeSubs.find(x => x.id === id);
        return sub ? s + toMonthly(sub.amount, sub.frequency) : s;
    }, 0);
    const toggleSimulate = (id: string) => {
        const n = new Set(simulateCancelled);
        if (n.has(id)) n.delete(id); else n.add(id);
        setSimulateCancelled(n);
    };

    /* -- AI Insights -- */
    const insights = useMemo(() => {
        const list: { icon: string; title: string; desc: string; type: "info" | "warn" | "success" | "danger" }[] = [];

        if (incomePct > 15) {
            list.push({ icon: "warning", title: "Alto porcentaje de ingreso", desc: `Tus suscripciones consumen ${incomePct}% de tus ingresos. Se recomienda mantener debajo del 15%.`, type: "warn" });
        } else if (incomePct > 0 && incomePct <= 15) {
            list.push({ icon: "check_circle", title: "Suscripciones bajo control", desc: `Solo ${incomePct}% de tus ingresos va a suscripciones. \u00a1Bien gestionado!`, type: "success" });
        }

        if (monthlyTotal > 0 && entertainmentTotal / monthlyTotal > 0.6 && activeSubs.length > 2) {
            list.push({ icon: "sports_esports", title: "Entretenimiento dominante", desc: `${Math.round((entertainmentTotal / monthlyTotal) * 100)}% de tus suscripciones son ocio. Revisa si todas aportan valor.`, type: "info" });
        }

        const streamingSubs = activeSubs.filter(s => ["entretenimiento", "suscripciones"].includes(s.category) && s.type === "entertainment");
        if (streamingSubs.length >= 3) {
            list.push({ icon: "content_copy", title: "Posible redundancia", desc: `Tienes ${streamingSubs.length} servicios de entretenimiento. \u00bfUsas todos activamente?`, type: "warn" });
        }

        const oldSubs = activeSubs.filter(s => monthsSince(s.createdAt) > 6);
        if (oldSubs.length > 0) {
            const oldest = oldSubs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
            list.push({ icon: "history", title: "Suscripci\u00f3n longeva", desc: `"${oldest.name}" lleva ${monthsSince(oldest.createdAt)} meses activa. Revisa si a\u00fan la necesitas.`, type: "info" });
        }

        if (entertainmentTotal > 0 && activeSubs.filter(s => s.type === "entertainment").length >= 2) {
            list.push({ icon: "savings", title: "Oportunidad de ahorro", desc: `Cancelar las suscripciones de ocio menos usadas te ahorrar\u00eda ~${formatCurrency(entertainmentTotal * 0.4)}/mes.`, type: "success" });
        }

        return list;
    }, [incomePct, monthlyTotal, entertainmentTotal, activeSubs]);

    /* -- CRUD -- */
    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", amount: "", frequency: "monthly", category: "suscripciones", type: "entertainment", nextDate: new Date().toISOString().split("T")[0], color: "#8b5cf6", icon: "sync", accountId: "", creditCardId: "" });
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
    const toggleActive = async (s: Sub) => {
        await fetch(`/api/subscriptions/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !s.active }) });
        fetchData();
    };
    const del = async (id: string) => { if (!confirm("\u00bfEliminar esta suscripci\u00f3n?")) return; await fetch(`/api/subscriptions/${id}`, { method: "DELETE" }); fetchData(); };

    /* -- Loading -- */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-28 relative">
            {/* Purple ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full opacity-[0.06]"
                    style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
                <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
                <div className="absolute -bottom-20 right-1/3 w-[280px] h-[280px] rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
            </div>

            {/* HERO - Liquid Glass Command Center */}
            <header className="liquid-glass-violet liquid-shimmer-edge rounded-3xl p-6 md:p-8 liquid-settle">
                {/* Top row */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-violet-500 text-base">auto_awesome</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-violet-600/70 dark:text-violet-400/70">
                            Centro de Suscripciones
                        </span>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-500/25">
                        <span className="material-icons-round text-base">add_circle_outline</span>
                        Nueva
                    </button>
                </div>

                {/* Main stats */}
                <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
                    <div className="flex-1 liquid-float" style={{ animationDelay: "200ms" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500/60 dark:text-violet-400/60 mb-1">
                            Costo Mensual
                        </p>
                        <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {formatCurrency(monthlyTotal)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                            {activeSubs.length} activa{activeSubs.length !== 1 ? "s" : ""} &middot; {pausedSubs.length} pausada{pausedSubs.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:w-[380px]">
                        <div className="liquid-glass rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-wide">Anual</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                                {formatCurrency(yearlyTotal)}
                            </p>
                        </div>
                        <div className="liquid-glass rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-wide">Ingreso %</p>
                            <p className={`text-sm font-bold mt-0.5 tabular-nums ${incomePct > 15 ? "text-amber-600" : "text-violet-600 dark:text-violet-300"}`}>
                                {incomePct}%
                            </p>
                        </div>
                        <div className="liquid-glass rounded-xl px-3 py-2.5">
                            <p className="text-[10px] font-semibold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-wide">Diario</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                                {formatCurrency(monthlyTotal / 30)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* DNA bar */}
                {monthlyTotal > 0 && (
                    <div className="mt-6">
                        <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
                            <div className="rounded-full transition-all duration-1000 bg-slate-600 dark:bg-slate-400"
                                style={{ width: `${Math.max(criticalPct, 3)}%` }} title={`Esencial ${criticalPct}%`} />
                            <div className="rounded-full transition-all duration-1000 bg-violet-500"
                                style={{ width: `${Math.max(productivePct, 3)}%` }} title={`Productivo ${productivePct}%`} />
                            <div className="rounded-full transition-all duration-1000 bg-fuchsia-400"
                                style={{ width: `${Math.max(entertainmentPct, 3)}%` }} title={`Ocio ${entertainmentPct}%`} />
                        </div>
                        <div className="flex gap-5 mt-2.5">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Esencial {criticalPct}%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Productivo {productivePct}%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-fuchsia-400" />
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Ocio {entertainmentPct}%</span>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* UPCOMING PAYMENTS - Horizontal Strip */}
            {upcoming.length > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400/80 to-violet-600/40" />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Pr&oacute;ximos Cobros</h2>
                    </div>

                    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                        {upcoming.map((sub, idx) => {
                            const d = daysUntil(sub.nextDate);
                            const isNext = idx === 0;
                            const isUrgent = d >= 0 && d <= 2;

                            return (
                                <div key={sub.id}
                                    className={`snap-start shrink-0 w-44 rounded-2xl p-4 transition-all relative overflow-hidden group cursor-pointer liquid-settle ${isNext
                                        ? "sub-glass-card !border-violet-300/40 dark:!border-violet-600/30"
                                        : "sub-glass-card"
                                        }`}
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                    onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}>

                                    {isUrgent && (
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/10 rounded-full -mr-4 -mt-4 blur-xl" />
                                    )}

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shadow-sm"
                                            style={{ backgroundColor: sub.color || '#8b5cf6' }}>
                                            <span className="material-icons-round text-base">{sub.icon || "sync"}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isUrgent
                                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                                            : "text-slate-400"
                                            }`}>
                                            {daysLabel(d)}
                                        </span>
                                    </div>

                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{sub.name}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums mt-1">
                                        {formatCurrency(sub.amount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {new Date(sub.nextDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* MAIN LIST - Glass Cards */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400/80 to-violet-600/40" />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Suscripciones</h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {([
                            { key: "all" as Filter, label: "Todas", count: subs.length },
                            { key: "active" as Filter, label: "Activas", count: activeSubs.length },
                            { key: "paused" as Filter, label: "Pausadas", count: pausedSubs.length },
                        ]).map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f.key
                                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5"
                                    }`}>
                                {f.label}
                                {f.count > 0 && <span className="ml-1 opacity-60">{f.count}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="liquid-glass rounded-2xl text-center py-16 liquid-settle">
                        <span className="material-icons-round text-5xl mb-3 block text-violet-300/40">subscriptions</span>
                        <p className="text-sm text-slate-500 mb-4">
                            {filter === "paused" ? "No tienes suscripciones pausadas" : "No hay suscripciones registradas"}
                        </p>
                        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20">
                            Agregar Primera
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((sub, idx) => {
                            const isExpanded = expandedId === sub.id;
                            const d = daysUntil(sub.nextDate);
                            const isOverdue = d < 0;
                            const isSoon = d >= 0 && d <= 3;
                            const isSimulated = simulateCancelled.has(sub.id);
                            const meta = TYPE_META[sub.type] || TYPE_META.entertainment;

                            return (
                                <div key={sub.id}
                                    className={`sub-glass-card rounded-2xl overflow-hidden liquid-settle ${isExpanded ? "ring-2 ring-violet-500/20 !border-violet-400/30" : ""}
                                        ${isSimulated ? "opacity-50 grayscale-[0.8]" : ""}
                                        ${!sub.active ? "opacity-60" : ""}`}
                                    style={{ animationDelay: `${idx * 60}ms` }}>

                                    {/* Header row */}
                                    <div className="p-4 md:p-5 flex items-center gap-4 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}>

                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm ring-2 transition-transform duration-300 ${meta.ring}`}
                                            style={{
                                                backgroundColor: sub.color || '#8b5cf6',
                                                transform: isExpanded ? 'scale(1.08) rotate(-3deg)' : 'scale(1)',
                                            }}>
                                            <span className="material-icons-round text-xl">{sub.icon || "sync"}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate">{sub.name}</h3>
                                                {!sub.active && (
                                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">Pausada</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${meta.badge}`}>
                                                    {meta.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400">{FREQ[sub.frequency] || sub.frequency}</span>
                                                <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                <span className={`text-[11px] font-medium ${isOverdue ? "text-red-500" : isSoon ? "text-amber-600" : "text-slate-400"}`}>
                                                    {daysLabel(d)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                                                {formatCurrency(sub.amount)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 tabular-nums">
                                                {formatCurrency(toMonthly(sub.amount, sub.frequency))}/mes
                                            </p>
                                        </div>

                                        <span className={`material-icons-round text-slate-300 dark:text-slate-600 transition-transform duration-300 ${isExpanded ? "rotate-180 !text-violet-500" : ""}`}>
                                            expand_more
                                        </span>
                                    </div>

                                    {/* Expanded panel */}
                                    {isExpanded && (
                                        <div className="collapse-expand border-t border-slate-100/60 dark:border-white/5 px-4 md:px-5 py-4 bg-white/30 dark:bg-white/[0.02]">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Categor&iacute;a</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-icons-round text-sm text-violet-400">label</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {(CATEGORIES[sub.category as keyof typeof CATEGORIES] || CATEGORIES.otros).label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Pr&oacute;ximo cobro</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-icons-round text-sm ${isOverdue ? "text-red-400" : "text-violet-400"}`}>event</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {new Date(sub.nextDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">M&eacute;todo de pago</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-icons-round text-sm text-violet-400">credit_card</span>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                                            {sub.creditCard ? `\u00b7\u00b7\u00b7\u00b7${sub.creditCard.lastFour}` : sub.account ? sub.account.name : "Sin asignar"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Costo anual</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-icons-round text-sm text-violet-400">savings</span>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                                            {formatCurrency(toYearly(sub.amount, sub.frequency))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tenure bar */}
                                            {sub.createdAt && (
                                                <div className="mb-4 p-3 rounded-xl bg-white/40 dark:bg-white/[0.03] border border-slate-100/50 dark:border-white/5">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Antig&uuml;edad</span>
                                                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                                                            {monthsSince(sub.createdAt)} meses &middot; {formatCurrency(toMonthly(sub.amount, sub.frequency) * monthsSince(sub.createdAt))} total pagado
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-1000"
                                                            style={{ width: `${Math.min(100, (monthsSince(sub.createdAt) / 12) * 100)}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); toggleSimulate(sub.id); }}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isSimulated
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                                                        : "bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/60 dark:border-white/10 hover:border-amber-200 dark:hover:border-amber-800/40"
                                                        }`}>
                                                    <span className="material-icons-round text-sm">science</span>
                                                    {isSimulated ? "Restaurar" : "Simular"}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleActive(sub); }}
                                                    className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-800/40">
                                                    <span className="material-icons-round text-sm">{sub.active ? "pause" : "play_arrow"}</span>
                                                    {sub.active ? "Pausar" : "Activar"}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(sub); }}
                                                    className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-800/40">
                                                    <span className="material-icons-round text-sm">edit</span>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); del(sub.id); }}
                                                    className="py-2.5 px-4 rounded-xl text-xs font-bold transition-all bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800/40">
                                                    <span className="material-icons-round text-sm">delete_outline</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* AI INSIGHTS - Liquid Glass */}
            {insights.length > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400/80 to-violet-600/40" />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Inteligencia</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.map((ins, i) => (
                            <div key={i} className={`liquid-glass rounded-xl p-4 liquid-settle ${
                                ins.type === "warn" ? "!border-amber-300/30 dark:!border-amber-700/20" :
                                ins.type === "danger" ? "!border-red-300/30 dark:!border-red-700/20" :
                                ins.type === "success" ? "!border-emerald-300/30 dark:!border-emerald-700/20" :
                                "!border-violet-300/30 dark:!border-violet-700/20"
                            }`} style={{ animationDelay: `${400 + i * 80}ms` }}>
                                <div className="flex items-start gap-3">
                                    <span className={`material-icons-round text-lg mt-0.5 ${
                                        ins.type === "warn" ? "text-amber-500" :
                                        ins.type === "danger" ? "text-red-500" :
                                        ins.type === "success" ? "text-emerald-500" :
                                        "text-violet-500"
                                    }`}>{ins.icon}</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{ins.title}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{ins.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* COST BREAKDOWN - Type Cards */}
            {monthlyTotal > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-400/80 to-violet-600/40" />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Desglose por Tipo</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([
                            { key: "critical", total: criticalTotal, pct: criticalPct, color: "from-slate-500 to-slate-700", subs: activeSubs.filter(s => s.type === "critical") },
                            { key: "productive", total: productiveTotal, pct: productivePct, color: "from-violet-400 to-violet-600", subs: activeSubs.filter(s => s.type === "productive") },
                            { key: "entertainment", total: entertainmentTotal, pct: entertainmentPct, color: "from-fuchsia-400 to-fuchsia-500", subs: activeSubs.filter(s => s.type === "entertainment") },
                        ] as const).map(group => {
                            const meta = TYPE_META[group.key];
                            return (
                                <div key={group.key} className="liquid-glass rounded-2xl p-5 liquid-settle">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="material-icons-round text-base text-violet-500">{meta.icon}</span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{meta.label}</span>
                                        <span className="ml-auto text-[10px] font-bold text-slate-400 tabular-nums">{group.pct}%</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mb-3">
                                        {formatCurrency(group.total)}
                                    </p>
                                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden mb-3">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${group.color} transition-all duration-1000`}
                                            style={{ width: `${group.pct}%` }} />
                                    </div>
                                    {group.subs.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {group.subs.slice(0, 3).map(s => (
                                                <div key={s.id} className="flex items-center gap-2 text-[11px]">
                                                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                                                        style={{ backgroundColor: s.color || '#8b5cf6', fontSize: '10px' }}>
                                                        <span className="material-icons-round" style={{ fontSize: '12px' }}>{s.icon || "sync"}</span>
                                                    </div>
                                                    <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{s.name}</span>
                                                    <span className="text-slate-500 dark:text-slate-400 tabular-nums font-medium">{formatCurrency(toMonthly(s.amount, s.frequency))}</span>
                                                </div>
                                            ))}
                                            {group.subs.length > 3 && (
                                                <p className="text-[10px] text-slate-400 pl-7">+{group.subs.length - 3} m&aacute;s</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-slate-400">Sin suscripciones</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* FLOATING SIMULATOR BAR */}
            {simulateCancelled.size > 0 && (
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 animate-slide-up">
                    <div className="liquid-glass !bg-slate-900/85 dark:!bg-white/90 !border-white/10 dark:!border-slate-200 rounded-2xl shadow-2xl p-4 flex items-center justify-between text-white dark:text-slate-900">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
                                Ahorro potencial &middot; {simulateCancelled.size} {simulateCancelled.size === 1 ? "item" : "items"}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-black tabular-nums">{formatCurrency(simSavingsMonthly)}<span className="text-sm font-normal opacity-60">/mes</span></p>
                                <p className="text-xs opacity-50 tabular-nums">{formatCurrency(simSavingsMonthly * 12)}/a&ntilde;o</p>
                            </div>
                        </div>
                        <button onClick={() => setSimulateCancelled(new Set())}
                            className="p-2.5 bg-white/15 dark:bg-slate-900/10 hover:bg-white/25 rounded-xl transition-colors">
                            <span className="material-icons-round text-lg">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar Suscripci\u00f3n" : "Nueva Suscripci\u00f3n"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre</label>
                        <input className="input-field focus:ring-violet-500 focus:border-violet-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Netflix, Spotify, ChatGPT..." required />
                    </div>

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

                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Tipo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["critical", "productive", "entertainment"] as const).map(t => {
                                const info = TYPE_META[t];
                                return (
                                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-1 ${form.type === t
                                            ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300"
                                            : "bg-white dark:bg-[#1a262d] text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                        <span className="material-icons-round text-base">{info.icon}</span>
                                        {info.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Categor&iacute;a</label>
                            <select className="input-field focus:ring-violet-500 focus:border-violet-500" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Pr&oacute;ximo cobro</label>
                            <input className="input-field focus:ring-violet-500 focus:border-violet-500" type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} required />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Se cobra en</label>
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
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
                            {cards.map(c => (
                                <button key={c.id} type="button" onClick={() => setForm({ ...form, creditCardId: c.id, accountId: "" })}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${form.creditCardId === c.id ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: c.color }}>
                                        <span className="material-icons-round text-sm">credit_card</span>
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{c.name} &middot;&middot;&middot;&middot;{c.lastFour}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">&Iacute;cono</label>
                        <div className="flex flex-wrap gap-2">
                            {SUB_ICONS.map(ic => (
                                <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all border ${form.icon === ic
                                        ? "bg-violet-50 border-violet-500 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300"
                                        : "bg-white dark:bg-[#1a262d] border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}>
                                    <span className="material-icons-round text-lg">{ic}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-[0.97]">
                            {editing ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
