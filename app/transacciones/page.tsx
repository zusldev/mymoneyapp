"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS, CategoryKey, getCatIcon, getCatColors } from "../lib/categories";
import type { Transaction, Account, CreditCard, TransactionAnomaly as Anomaly } from "../lib/types";

/* ═══ TransactionItem Component ═══ */
function TransactionItem({ tx, anomalies: txAnomalies, onDelete, onUpdateCategory }: {
    tx: Transaction; anomalies?: Anomaly[]; onDelete: (id: string) => void;
    onUpdateCategory: (id: string, cat: string) => void;
}) {
    const [showCatPicker, setShowCatPicker] = useState(false);
    const catPickerRef = useRef<HTMLDivElement>(null);
    const cat = CATEGORIES[tx.category as CategoryKey] || CATEGORIES.otros;
    const colors = getCatColors(tx.category);
    const icon = getCatIcon(tx.category);
    const isIncome = tx.type === "income";

    // Click-outside dismiss for category picker
    useEffect(() => {
        if (!showCatPicker) return;
        const handler = (e: MouseEvent) => {
            if (catPickerRef.current && !catPickerRef.current.contains(e.target as Node)) {
                setShowCatPicker(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [showCatPicker]);

    return (
        <div className={`group rounded-lg p-4 flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-[#1a262d] hover:shadow-sm border-l-2
            ${txAnomalies ? "border-l-amber-400 bg-amber-50/30 dark:bg-amber-900/5" : "border-l-transparent bg-slate-50/40 dark:bg-white/[0.02] hover:border-l-slate-300 dark:hover:border-l-slate-600"}`}>
            {/* Category icon */}
            <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
                <span className="material-icons-round text-xl">{icon}</span>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tx.merchant || cat.label}</h4>
                    {tx.isSubscription && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 uppercase">Recurrente</span>
                    )}
                    {txAnomalies && (
                        <span className="material-icons-round text-amber-500 text-sm" title={txAnomalies[0].label}>warning</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                    <span>{new Date(tx.date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    {/* Clickable category */}
                    <div className="relative" ref={catPickerRef}>
                        <button onClick={() => setShowCatPicker(!showCatPicker)} className="hover:text-[#2badee] transition-colors flex items-center gap-0.5">
                            {cat.label}
                            <span className="material-icons-round text-[10px] opacity-0 group-hover:opacity-100">edit</span>
                        </button>
                        {showCatPicker && (
                            <div className="absolute top-5 left-0 z-50 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 w-44 max-h-48 overflow-y-auto">
                                {CATEGORY_KEYS.map(k => (
                                    <button key={k} onClick={() => { onUpdateCategory(tx.id, k); setShowCatPicker(false); }}
                                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${tx.category === k ? "font-bold text-[#2badee]" : "text-slate-600 dark:text-slate-300"}`}>
                                        <span className="material-icons-round text-sm" style={{ color: CATEGORIES[k].color }}>{CATEGORIES[k].icon}</span>
                                        {CATEGORIES[k].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {(tx.account || tx.creditCard) && (
                        <>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span>{tx.account?.name || tx.creditCard?.name}</span>
                        </>
                    )}
                    {tx.description && (
                        <>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="truncate max-w-[120px]">{tx.description}</span>
                        </>
                    )}
                </div>
                {txAnomalies && (
                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                        <span className="material-icons-round text-[11px]">auto_awesome</span>
                        {txAnomalies[0].label}
                    </p>
                )}
            </div>
            {/* Amount + Actions */}
            <div className="text-right shrink-0">
                <p className={`text-base font-bold tabular-nums ${isIncome ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
                    {isIncome ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                </p>
                <button onClick={e => { e.stopPropagation(); onDelete(tx.id); }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500 transition-all mt-1">
                    <span className="material-icons-round text-sm">delete_outline</span>
                </button>
            </div>
        </div>
    );
}

/* ═══ Helpers ═══ */
function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
    const g: Record<string, Transaction[]> = {};
    for (const t of txs) { const k = t.date.split("T")[0]; (g[k] ||= []).push(t); }
    return g;
}
function formatDateLabel(ds: string) {
    const d = new Date(ds + "T12:00:00"), now = new Date(), y = new Date();
    y.setDate(now.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return `Hoy, ${d.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;
    if (d.toDateString() === y.toDateString()) return `Ayer, ${d.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}`;
    return d.toLocaleDateString("es-MX", { weekday: "short", month: "short", day: "numeric" });
}

function detectAnomalies(txs: Transaction[]): Anomaly[] {
    const a: Anomaly[] = [];
    const expenses = txs.filter(t => t.type === "expense");
    const amounts = expenses.map(t => Math.abs(t.amount));
    const avg = amounts.length > 3 ? amounts.reduce((s, x) => s + x, 0) / amounts.length : 0;

    // Spending spikes (>3x average)
    if (avg > 0) {
        for (const t of expenses) {
            if (Math.abs(t.amount) > avg * 3) {
                a.push({ txId: t.id, type: "spike", label: `Gasto inusual: ${Math.round(Math.abs(t.amount) / avg)}x el promedio`, severity: "warn" });
            }
        }
    }

    // Duplicate charges (same merchant, same amount, within 2 days)
    for (let i = 0; i < expenses.length; i++) {
        for (let j = i + 1; j < Math.min(i + 10, expenses.length); j++) {
            const a1 = expenses[i], b = expenses[j];
            if (a1.merchant && b.merchant && a1.merchant === b.merchant && Math.abs(a1.amount - b.amount) < 0.01) {
                const diff = Math.abs(new Date(a1.date).getTime() - new Date(b.date).getTime()) / 86400000;
                if (diff <= 2) a.push({ txId: a1.id, type: "duplicate", label: "Posible cargo duplicado", severity: "danger" });
            }
        }
    }

    // Fees / interest
    for (const t of txs) {
        if (t.isFeeOrInterest && Math.abs(t.amount) > 200) {
            a.push({ txId: t.id, type: "fee", label: "Comisión/interés alto", severity: "warn" });
        }
    }

    return a;
}

/* ═══ Component ═══ */
export default function TransaccionesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterAccount, setFilterAccount] = useState("");
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [form, setForm] = useState({
        amount: "", type: "expense", date: new Date().toISOString().split("T")[0],
        merchant: "", description: "", category: "otros", accountId: "", creditCardId: "",
    });

    /* ── Fetch ── */
    const fetchData = useCallback(async () => {
        try {
            const p = new URLSearchParams();
            if (filterCategory) p.set("category", filterCategory);
            if (filterType) p.set("type", filterType);
            if (filterAccount.startsWith("acc:")) p.set("accountId", filterAccount.replace("acc:", ""));
            if (filterAccount.startsWith("cc:")) p.set("creditCardId", filterAccount.replace("cc:", ""));
            p.set("limit", "200");

            const [txR, accR, ccR] = await Promise.all([
                fetch(`/api/transactions?${p}`), fetch("/api/accounts"), fetch("/api/credit-cards"),
            ]);
            const [tx, acc, cc] = await Promise.all([txR.json(), accR.json(), ccR.json()]);
            setTransactions(Array.isArray(tx) ? tx : []);
            setAccounts(Array.isArray(acc) ? acc : []);
            setCards(Array.isArray(cc) ? cc : []);
        } catch { /* */ } finally { setLoading(false); }
    }, [filterCategory, filterType, filterAccount]);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── CRUD ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, accountId: form.accountId || null, creditCardId: form.creditCardId || null }) });
        setModalOpen(false);
        setForm({ amount: "", type: "expense", date: new Date().toISOString().split("T")[0], merchant: "", description: "", category: "otros", accountId: "", creditCardId: "" });
        fetchData();
    };
    const handleDelete = async (id: string) => { if (!confirm("¿Eliminar esta transacción?")) return; await fetch(`/api/transactions/${id}`, { method: "DELETE" }); fetchData(); };
    const quickUpdateCategory = async (id: string, category: string) => {
        await fetch(`/api/transactions/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category }) });
        fetchData();
    };

    /* ── Filtering ── */
    const filtered = useMemo(() => transactions.filter(t =>
        searchQuery === "" ||
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [transactions, searchQuery]);

    /* ── Computed analytics ── */
    const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalExpenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const netBalance = totalIncome - totalExpenses;
    const spentPct = totalIncome > 0 ? Math.min(Math.round((totalExpenses / totalIncome) * 100), 100) : 0;

    /* Category breakdown */
    const catBreakdown = useMemo(() => {
        const map: Record<string, { total: number; count: number }> = {};
        for (const t of filtered.filter(t => t.type === "expense")) {
            const c = t.category || "otros";
            if (!map[c]) map[c] = { total: 0, count: 0 };
            map[c].total += Math.abs(t.amount);
            map[c].count++;
        }
        return Object.entries(map)
            .map(([cat, d]) => ({ cat, ...d, pct: totalExpenses > 0 ? Math.round((d.total / totalExpenses) * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
    }, [filtered, totalExpenses]);

    /* Top merchants */
    const topMerchants = useMemo(() => {
        const map: Record<string, { total: number; count: number }> = {};
        for (const t of filtered.filter(t => t.type === "expense" && t.merchant)) {
            const m = t.merchant;
            if (!map[m]) map[m] = { total: 0, count: 0 };
            map[m].total += Math.abs(t.amount);
            map[m].count++;
        }
        return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.total - a.total).slice(0, 5);
    }, [filtered]);

    /* Anomalies */
    const anomalies = useMemo(() => detectAnomalies(filtered), [filtered]);
    const anomalyMap = useMemo(() => {
        const m: Record<string, Anomaly[]> = {};
        for (const a of anomalies) { (m[a.txId] ||= []).push(a); }
        return m;
    }, [anomalies]);

    const hasActiveFilters = filterCategory || filterType || filterAccount || searchQuery;
    const dateGroups = groupByDate(filtered);
    const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* ═══ Slate ambient — Transactions identity ═══ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full opacity-[0.04]"
                    style={{ background: 'radial-gradient(circle, #64748b, transparent 70%)' }} />
                <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full opacity-[0.03]"
                    style={{ background: 'radial-gradient(circle, #94a3b8, transparent 70%)' }} />
            </div>

            {/* ═══════════ HEADER ═══════════ */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Transacciones</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filtered.length} movimientos · Motor analítico de tu dinero</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowAnalysis(!showAnalysis)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showAnalysis
                            ? "bg-slate-700/10 text-slate-700 dark:text-slate-200 border-slate-400/30"
                            : "bg-white dark:bg-[#1a262d] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"}`}>
                        <span className="material-icons-round text-lg">insights</span>
                        Análisis
                    </button>
                    <button onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-800/10 active:scale-[0.97]">
                        <span className="material-icons-round text-lg">add</span>
                        Nueva
                    </button>
                </div>
            </header>

            {/* ═══════════ SECTION 1: INLINE TICKER STRIP ═══════════ */}
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar py-1">
                {/* Income chip */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1a262d] rounded-full border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                    <span className="material-icons-round text-emerald-500 text-base">arrow_upward</span>
                    <span className="text-xs font-medium text-slate-500">Ingresos</span>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">+{formatCurrency(totalIncome)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Expenses chip */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1a262d] rounded-full border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                    <span className="material-icons-round text-red-400 text-base">arrow_downward</span>
                    <span className="text-xs font-medium text-slate-500">Gastos</span>
                    <span className="text-sm font-bold text-red-500 tabular-nums">-{formatCurrency(totalExpenses)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Net chip */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm shrink-0 ${netBalance >= 0 ? "bg-white dark:bg-[#1a262d] border-slate-100 dark:border-slate-800" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"}`}>
                    <span className={`material-icons-round text-base ${netBalance >= 0 ? "text-slate-600" : "text-red-500"}`}>balance</span>
                    <span className="text-xs font-medium text-slate-500">Neto</span>
                    <span className={`text-sm font-bold tabular-nums ${netBalance >= 0 ? "text-slate-800 dark:text-white" : "text-red-500"}`}>{netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Anomalies chip */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm shrink-0 ${anomalies.length > 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-[#1a262d] border-slate-100 dark:border-slate-800"}`}>
                    <span className={`material-icons-round text-base ${anomalies.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>{anomalies.length > 0 ? "warning" : "verified"}</span>
                    <span className={`text-sm font-bold tabular-nums ${anomalies.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>{anomalies.length > 0 ? `${anomalies.length} alertas` : "✓ Limpio"}</span>
                </div>
            </div>

            {/* ═══════════ ANALYSIS MODE ═══════════ */}
            {showAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up">
                    {/* Category Breakdown */}
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-slate-500 text-lg">donut_small</span>
                            Gastos por Categoría
                        </h3>
                        {catBreakdown.length === 0 && <p className="text-sm text-slate-400">Sin gastos registrados</p>}
                        <div className="space-y-3">
                            {catBreakdown.slice(0, 8).map(c => {
                                const info = CATEGORIES[c.cat as CategoryKey] || CATEGORIES.otros;
                                return (
                                    <button key={c.cat} onClick={() => setFilterCategory(filterCategory === c.cat ? "" : c.cat)} className="w-full text-left group/cat">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons-round text-sm" style={{ color: info.color }}>{info.icon}</span>
                                                <span className={`text-xs font-medium ${filterCategory === c.cat ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{info.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 tabular-nums">{formatCurrency(c.total)} · {c.pct}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-bar-fill transition-all" style={{ width: `${c.pct}%`, background: info.color }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Top Merchants + Anomalies */}
                    <div className="space-y-5">
                        {/* Top Merchants */}
                        <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-slate-500 text-lg">storefront</span>
                                Comercios Frecuentes
                            </h3>
                            {topMerchants.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
                            <div className="space-y-2.5">
                                {topMerchants.map((m, i) => (
                                    <div key={m.name} className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 w-5 text-right tabular-nums">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.name}</p>
                                            <p className="text-[11px] text-slate-400">{m.count} visita{m.count !== 1 ? "s" : ""}</p>
                                        </div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tabular-nums">{formatCurrency(m.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Anomaly List */}
                        {anomalies.length > 0 && (
                            <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="material-icons-round text-amber-500 text-lg animate-pulse">auto_awesome</span>
                                    Detección Inteligente
                                </h3>
                                <div className="space-y-2">
                                    {anomalies.slice(0, 5).map((a, i) => (
                                        <div key={i} className={`p-2.5 rounded-lg text-xs border ${a.severity === "danger"
                                            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/40"
                                            : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40"}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`material-icons-round text-sm ${a.severity === "danger" ? "text-red-500" : "text-amber-500"}`}>
                                                    {a.type === "duplicate" ? "content_copy" : a.type === "spike" ? "trending_up" : "warning"}
                                                </span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200">{a.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════ FILTERS ═══════════ */}
            <div className="sticky top-0 z-10 bg-[#f6f7f8]/95 dark:bg-[#101c22]/95 backdrop-blur-sm py-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 md:max-w-xs group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
                            <span className="material-icons-round text-lg">search</span>
                        </span>
                        <input className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-400 transition-all shadow-sm placeholder:text-slate-400"
                            placeholder="Buscar comercio, descripción..."
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50">
                            <option value="">Categoría</option>
                            {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                        </select>

                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50">
                            <option value="">Tipo</option>
                            <option value="expense">Gastos</option>
                            <option value="income">Ingresos</option>
                        </select>

                        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50">
                            <option value="">Cuenta/Tarjeta</option>
                            {accounts.map(a => <option key={a.id} value={`acc:${a.id}`}>{a.name}</option>)}
                            {cards.map(c => <option key={c.id} value={`cc:${c.id}`}>{c.name} ····{c.lastFour}</option>)}
                        </select>

                        {hasActiveFilters && (
                            <button onClick={() => { setFilterCategory(""); setFilterType(""); setFilterAccount(""); setSearchQuery(""); }}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                                <span className="material-icons-round text-lg">filter_list_off</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ MAIN GRID ═══════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ── LEFT: Timeline ── */}
                <div className="lg:col-span-8 space-y-8">
                    {sortedDates.map((dateKey, dateIdx) => (
                        <section key={dateKey} className="date-reveal" style={{ animationDelay: `${dateIdx * 80}ms` }}>
                            {/* Date header with timeline dot */}
                            <div className="flex items-center gap-3 mb-4 relative">
                                <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-[#f6f7f8] dark:ring-[#101c22] shadow-sm shrink-0 ${dateIdx === 0 ? "bg-slate-800 dark:bg-white" : "bg-slate-300 dark:bg-slate-600"}`} />
                                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{formatDateLabel(dateKey)}</h2>
                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                <span className="text-[11px] text-slate-400 tabular-nums">
                                    {dateGroups[dateKey].filter(t => t.type === "expense").length > 0 && (
                                        <span className="text-red-400">-{formatCurrency(dateGroups[dateKey].filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0))}</span>
                                    )}
                                </span>
                            </div>

                            {/* Transaction items */}
                            <div className="space-y-2">
                                {dateGroups[dateKey].map(tx => (
                                    <TransactionItem key={tx.id} tx={tx} anomalies={anomalyMap[tx.id]} onDelete={handleDelete} onUpdateCategory={quickUpdateCategory} />
                                ))}
                            </div>
                        </section>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-[#1a262d] rounded-2xl border border-slate-100 dark:border-slate-800">
                            <span className="material-icons-round text-6xl text-slate-200 dark:text-slate-700 mb-4 block">receipt_long</span>
                            <p className="text-slate-500 dark:text-slate-400 mb-2">No hay transacciones</p>
                            <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">Agregar Primera</button>
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <p className="text-center text-xs text-slate-400 py-4">Mostrando {filtered.length} transacciones</p>
                    )}
                </div>

                {/* ── RIGHT: Sidebar ── */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Quick category breakdown (always visible) */}
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons-round text-slate-500 text-lg">pie_chart</span>
                            Resumen de Gastos
                        </h3>
                        {catBreakdown.length === 0 && <p className="text-sm text-slate-400">Sin gastos</p>}
                        <div className="space-y-2.5">
                            {catBreakdown.slice(0, 6).map(c => {
                                const info = CATEGORIES[c.cat as CategoryKey] || CATEGORIES.otros;
                                return (
                                    <button key={c.cat} onClick={() => setFilterCategory(filterCategory === c.cat ? "" : c.cat)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${filterCategory === c.cat ? "bg-slate-100 dark:bg-slate-800/80" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${info.color}15` }}>
                                            <span className="material-icons-round text-sm" style={{ color: info.color }}>{info.icon}</span>
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{info.label}</p>
                                            <p className="text-[10px] text-slate-400">{c.count} · {c.pct}%</p>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">{formatCurrency(c.total)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Income vs Expense visual */}
                    {totalIncome > 0 && (
                        <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-slate-500 text-lg">balance</span>
                                Ingreso vs Gasto
                            </h3>
                            {/* Visual bar */}
                            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                                <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${Math.min(100, Math.round((totalIncome / (totalIncome + totalExpenses)) * 100))}%` }} />
                                <div className="bg-red-400 rounded-r-full transition-all" style={{ width: `${Math.min(100, Math.round((totalExpenses / (totalIncome + totalExpenses)) * 100))}%` }} />
                            </div>
                            <div className="flex justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-slate-500">Ingresos</span>
                                    <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(totalIncome)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <span className="text-slate-500">Gastos</span>
                                    <span className="font-bold text-red-500 tabular-nums">{formatCurrency(totalExpenses)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial health */}
                    <div className={`rounded-xl p-5 shadow-sm border ${spentPct <= 70
                        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                        : spentPct <= 90
                            ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                            : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"}`}>
                        <div className="flex items-center gap-3">
                            <span className={`material-icons-round text-2xl ${spentPct <= 70 ? "text-emerald-600" : spentPct <= 90 ? "text-amber-600" : "text-red-500"}`}>
                                {spentPct <= 70 ? "check_circle" : spentPct <= 90 ? "info" : "warning"}
                            </span>
                            <div>
                                <p className={`text-sm font-bold ${spentPct <= 70 ? "text-emerald-700 dark:text-emerald-400" : spentPct <= 90 ? "text-amber-700 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                                    {spentPct <= 70 ? "Control Saludable" : spentPct <= 90 ? "Precaución" : "Alerta de Gasto"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {spentPct <= 70
                                        ? `Has gastado ${spentPct}% de tus ingresos. ¡Buen control!`
                                        : spentPct <= 90
                                            ? `${spentPct}% de tus ingresos se han gastado. Vigila tu flujo.`
                                            : `${spentPct}% gastado — riesgo de déficit.`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ MODAL ═══════════ */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Transacción">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Monto</label>
                            <input className="input-field" type="number" step="0.01" value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Tipo</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setForm({ ...form, type: "expense" })}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${form.type === "expense" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" : "bg-white dark:bg-[#1a262d] text-slate-500 border-slate-200 dark:border-slate-700"}`}>
                                    Gasto
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: "income" })}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all border ${form.type === "income" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" : "bg-white dark:bg-[#1a262d] text-slate-500 border-slate-200 dark:border-slate-700"}`}>
                                    Ingreso
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Fecha</label>
                            <input className="input-field" type="date" value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Categoría</label>
                            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Comercio</label>
                        <input className="input-field" value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} placeholder="OXXO, Amazon, Spotify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Descripción (opcional)</label>
                        <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Notas adicionales" />
                    </div>
                    {/* Payment method */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Método de pago</label>
                        <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                            <button type="button" onClick={() => setForm({ ...form, accountId: "", creditCardId: "" })}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${!form.accountId && !form.creditCardId ? "border-[#2badee] bg-[#2badee]/5" : "border-slate-200 dark:border-slate-700"}`}>
                                <span className="material-icons-round text-slate-400 text-lg">remove_circle_outline</span>
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Sin especificar</span>
                            </button>
                            {accounts.map(a => (
                                <button key={a.id} type="button" onClick={() => setForm({ ...form, accountId: a.id, creditCardId: "" })}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${form.accountId === a.id ? "border-[#2badee] bg-[#2badee]/5" : "border-slate-200 dark:border-slate-700"}`}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${a.color}20` }}>
                                        <span className="material-icons-round text-sm" style={{ color: a.color }}>{a.icon || "account_balance"}</span>
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{a.name}</span>
                                </button>
                            ))}
                            {cards.map(c => (
                                <button key={c.id} type="button" onClick={() => setForm({ ...form, creditCardId: c.id, accountId: "" })}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left border transition-all text-xs ${form.creditCardId === c.id ? "border-[#2badee] bg-[#2badee]/5" : "border-slate-200 dark:border-slate-700"}`}>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}20` }}>
                                        <span className="material-icons-round text-sm" style={{ color: c.color }}>credit_card</span>
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{c.name} {c.lastFour ? `····${c.lastFour}` : ""}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="btn-primary flex-1">Agregar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
