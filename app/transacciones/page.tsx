"use client";
import { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS, CategoryKey, getCatIcon, getCatColors } from "../lib/categories";
import type { Transaction, Account, CreditCard, TransactionAnomaly as Anomaly } from "../lib/types";
import { apiGet, apiPost, normalizeApiError } from "../lib/api";
import { accountArraySchema, creditCardArraySchema, transactionArraySchema } from "../lib/schemas";
import { toastError, toastSuccess } from "../lib/toast";
import { parse, percentages, toMajorUnits } from "../lib/money";

/* ═══ TransactionItem Component ═══ */
const TransactionItem = memo(function TransactionItem({ tx, anomalies: txAnomalies, onDelete, onUpdateCategory, deletingId, syncingId }: {
    tx: Transaction; anomalies?: Anomaly[]; onDelete: (id: string) => void;
    onUpdateCategory: (id: string, cat: string) => void;
    deletingId: string | null;
    syncingId: string | null;
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
                        <button
                            aria-label={`Editar categoría de ${tx.merchant || cat.label}`}
                            disabled={syncingId === tx.id}
                            onClick={() => setShowCatPicker(!showCatPicker)}
                            className="touch-target focus-ring hover:text-[#2badee] transition-colors flex items-center gap-0.5 disabled:opacity-60"
                        >
                            {cat.label}
                            <span className="material-icons-round text-[10px] opacity-0 group-hover:opacity-100">edit</span>
                        </button>
                        {showCatPicker && (
                            <div className="absolute top-5 left-0 z-50 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 w-44 max-h-48 overflow-y-auto">
                                {CATEGORY_KEYS.map(k => (
                                    <button disabled={syncingId === tx.id} key={k} onClick={() => { onUpdateCategory(tx.id, k); setShowCatPicker(false); }}
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
                    {isIncome ? "+" : "-"}{formatCurrency(toMajorUnits(Math.abs(amountCentsOf(tx))))}
                </p>
                <button
                    aria-label={`Eliminar transacción ${tx.merchant || cat.label}`}
                    disabled={deletingId === tx.id}
                    onClick={e => { e.stopPropagation(); onDelete(tx.id); }}
                    className="touch-target focus-ring p-3 rounded-full opacity-40 lg:opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all mt-1 disabled:opacity-20 flex items-center justify-center min-h-[44px] min-w-[44px]"
                >
                    <span className="material-icons-round text-lg">delete_outline</span>
                </button>
            </div>
        </div>
    );
});

/* ═══ Helpers ═══ */
function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
    const g: Record<string, Transaction[]> = {};
    for (const t of txs) { const k = t.date.split("T")[0]; (g[k] ||= []).push(t); }
    return g;
}

function amountCentsOf(value: { amountCents?: number; amount?: number }) {
    if (typeof value.amountCents === "number") return value.amountCents;
    return parse(value.amount ?? 0);
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
    const amounts = expenses.map(t => Math.abs(amountCentsOf(t)));
    const avg = amounts.length > 3 ? amounts.reduce((s, x) => s + x, 0) / amounts.length : 0;

    // Spending spikes (>3x average)
    if (avg > 0) {
        for (const t of expenses) {
            const txCents = Math.abs(amountCentsOf(t));
            if (txCents > avg * 3) {
                a.push({ txId: t.id, type: "spike", label: `Gasto inusual: ${Math.round(txCents / avg)}x el promedio`, severity: "warning" });
            }
        }
    }

    // Duplicate charges (same merchant, same amount, within 2 days)
    for (let i = 0; i < expenses.length; i++) {
        for (let j = i + 1; j < Math.min(i + 10, expenses.length); j++) {
            const a1 = expenses[i], b = expenses[j];
            if (a1.merchant && b.merchant && a1.merchant === b.merchant && Math.abs(amountCentsOf(a1) - amountCentsOf(b)) <= 1) {
                const diff = Math.abs(new Date(a1.date).getTime() - new Date(b.date).getTime()) / 86400000;
                if (diff <= 2) a.push({ txId: a1.id, type: "duplicate", label: "Posible cargo duplicado", severity: "danger" });
            }
        }
    }

    // Fees / interest
    for (const t of txs) {
        if (t.isFeeOrInterest && Math.abs(amountCentsOf(t)) > parse(200)) {
            a.push({ txId: t.id, type: "fee", label: "Comisión/interés alto", severity: "warning" });
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
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
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

            const [tx, acc, cc] = await Promise.all([
                apiGet(`/api/transactions?${p}`, transactionArraySchema),
                apiGet("/api/accounts", accountArraySchema),
                apiGet("/api/credit-cards", creditCardArraySchema),
            ]);
            setTransactions(Array.isArray(tx) ? tx : []);
            setAccounts(Array.isArray(acc) ? acc : []);
            setCards(Array.isArray(cc) ? cc : []);
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally { setLoading(false); }
    }, [filterCategory, filterType, filterAccount]);

    useEffect(() => {
        fetchData();
        // Check URL for "new=true" to open modal automatically
        const params = new URLSearchParams(window.location.search);
        if (params.get("new") === "true") {
            setModalOpen(true);
            // Optional: clear the param so it doesn't reopen on refresh, but for now keep it simple or use replaceState
            window.history.replaceState({}, "", "/transacciones");
        }
    }, [fetchData]);

    /* ── CRUD ── */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await apiPost("/api/transactions", { ...form, accountId: form.accountId || null, creditCardId: form.creditCardId || null });
            toastSuccess("Transacción guardada");
            setModalOpen(false);
            setForm({ amount: "", type: "expense", date: new Date().toISOString().split("T")[0], merchant: "", description: "", category: "otros", accountId: "", creditCardId: "" });
            fetchData();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsSaving(false);
        }
    };
    const requestDelete = useCallback((id: string) => {
        setPendingDeleteId(id);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        setIsDeleting(id);
        try {
            await apiPost(`/api/transactions/${id}`, null, undefined, "DELETE");
            toastSuccess("Transacción eliminada");
            await fetchData();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsDeleting(null);
            setPendingDeleteId(null);
        }
    }, [pendingDeleteId, fetchData]);

    const quickUpdateCategory = useCallback(async (id: string, category: string) => {
        setIsSyncing(id);
        try {
            await apiPost(`/api/transactions/${id}`, { category }, undefined, "PUT");
            toastSuccess("Categoría actualizada");
            await fetchData();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsSyncing(null);
        }
    }, [fetchData]);

    /* ── Filtering ── */
    const filtered = useMemo(() => transactions.filter(t =>
        searchQuery === "" ||
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [transactions, searchQuery]);

    /* ── Computed analytics ── */
    const { totalIncomeCents, totalExpensesCents } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        for (const tx of filtered) {
            const value = Math.abs(amountCentsOf(tx));
            if (tx.type === "income") income += value;
            if (tx.type === "expense") expenses += value;
        }
        return { totalIncomeCents: income, totalExpensesCents: expenses };
    }, [filtered]);
    const totalIncome = toMajorUnits(totalIncomeCents);
    const totalExpenses = toMajorUnits(totalExpensesCents);
    const netBalance = totalIncome - totalExpenses;
    const spentPct = percentages(totalExpensesCents, totalIncomeCents, { clamp: true, decimals: 0 });

    /* Category breakdown */
    const catBreakdown = useMemo(() => {
        const map: Record<string, { totalCents: number; count: number }> = {};
        for (const t of filtered.filter(t => t.type === "expense")) {
            const c = t.category || "otros";
            if (!map[c]) map[c] = { totalCents: 0, count: 0 };
            map[c].totalCents += Math.abs(amountCentsOf(t));
            map[c].count++;
        }
        return Object.entries(map)
            .map(([cat, d]) => ({
                cat,
                ...d,
                total: toMajorUnits(d.totalCents),
                pct: percentages(d.totalCents, totalExpensesCents, { clamp: true, decimals: 0 }),
            }))
            .sort((a, b) => b.totalCents - a.totalCents);
    }, [filtered, totalExpensesCents]);

    /* Top merchants */
    const topMerchants = useMemo(() => {
        const map: Record<string, { totalCents: number; count: number }> = {};
        for (const t of filtered.filter(t => t.type === "expense" && t.merchant)) {
            const m = t.merchant;
            if (!map[m]) map[m] = { totalCents: 0, count: 0 };
            map[m].totalCents += Math.abs(amountCentsOf(t));
            map[m].count++;
        }
        return Object.entries(map)
            .map(([name, d]) => ({ name, ...d, total: toMajorUnits(d.totalCents) }))
            .sort((a, b) => b.totalCents - a.totalCents)
            .slice(0, 5);
    }, [filtered]);

    /* Anomalies */
    const anomalies = useMemo(() => detectAnomalies(filtered), [filtered]);
    const anomalyMap = useMemo(() => {
        const m: Record<string, Anomaly[]> = {};
        for (const a of anomalies) { (m[a.txId] ||= []).push(a); }
        return m;
    }, [anomalies]);

    const hasActiveFilters = filterCategory || filterType || filterAccount || searchQuery;
    const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);
    const sortedDates = useMemo(() => Object.keys(dateGroups).sort((a, b) => b.localeCompare(a)), [dateGroups]);

    /* ── Loading ── */
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 no-glass-inside">
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
                            : "liquid-chip text-slate-600 dark:text-slate-300 hover:border-slate-400"}`}>
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
                <div className="liquid-chip flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0">
                    <span className="material-icons-round text-emerald-500 text-base">arrow_upward</span>
                    <span className="text-xs font-medium text-slate-500">Ingresos</span>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">+{formatCurrency(totalIncome)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Expenses chip */}
                <div className="liquid-chip flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0">
                    <span className="material-icons-round text-red-400 text-base">arrow_downward</span>
                    <span className="text-xs font-medium text-slate-500">Gastos</span>
                    <span className="text-sm font-bold text-red-500 tabular-nums">-{formatCurrency(totalExpenses)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Net chip */}
                <div className={`liquid-chip flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0 ${netBalance < 0 ? "!bg-red-50/60 dark:!bg-red-900/10 !border-red-200 dark:!border-red-800" : ""}`}>
                    <span className={`material-icons-round text-base ${netBalance >= 0 ? "text-slate-600" : "text-red-500"}`}>balance</span>
                    <span className="text-xs font-medium text-slate-500">Neto</span>
                    <span className={`text-sm font-bold tabular-nums ${netBalance >= 0 ? "text-slate-800 dark:text-white" : "text-red-500"}`}>{netBalance >= 0 ? "+" : ""}{formatCurrency(netBalance)}</span>
                </div>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 shrink-0" />
                {/* Anomalies chip */}
                <div className={`liquid-chip flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0 ${anomalies.length > 0 ? "!bg-amber-50/60 dark:!bg-amber-900/10 !border-amber-200 dark:!border-amber-800" : ""}`}>
                    <span className={`material-icons-round text-base ${anomalies.length > 0 ? "text-amber-500" : "text-emerald-500"}`}>{anomalies.length > 0 ? "warning" : "verified"}</span>
                    <span className={`text-sm font-bold tabular-nums ${anomalies.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>{anomalies.length > 0 ? `${anomalies.length} alertas` : "✓ Limpio"}</span>
                </div>
            </div>

            {/* ═══════════ ANALYSIS MODE ═══════════ */}
            {showAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up">
                    {/* Category Breakdown */}
                    <div className="liquid-card rounded-xl p-5">
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
                        <div className="liquid-card rounded-xl p-5">
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
                            <div className="liquid-card rounded-xl p-5">
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
                            <button
                                aria-label="Limpiar filtros"
                                onClick={() => { setFilterCategory(""); setFilterType(""); setFilterAccount(""); setSearchQuery(""); }}
                                className="touch-target focus-ring p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                            >
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
                                        <span className="text-red-400">-{formatCurrency(toMajorUnits(dateGroups[dateKey].filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(amountCentsOf(t)), 0)))}</span>
                                    )}
                                </span>
                            </div>

                            {/* Transaction items */}
                            <div className="space-y-2">
                                {dateGroups[dateKey].map(tx => (
                                    <TransactionItem key={tx.id} tx={tx} anomalies={anomalyMap[tx.id]} onDelete={requestDelete} onUpdateCategory={quickUpdateCategory} deletingId={isDeleting} syncingId={isSyncing} />
                                ))}
                            </div>
                        </section>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-20 liquid-card rounded-2xl">
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
                    <div className="liquid-card rounded-xl p-5">
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
                    {totalIncomeCents > 0 && (
                        <div className="liquid-card rounded-xl p-5">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-slate-500 text-lg">balance</span>
                                Ingreso vs Gasto
                            </h3>
                            {/* Visual bar */}
                            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                                <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${percentages(totalIncomeCents, totalIncomeCents + totalExpensesCents, { clamp: true, decimals: 0 })}%` }} />
                                <div className="bg-red-400 rounded-r-full transition-all" style={{ width: `${percentages(totalExpensesCents, totalIncomeCents + totalExpensesCents, { clamp: true, decimals: 0 })}%` }} />
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input - Hero Style */}
                    <div className="relative group flex justify-center py-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                        <div className="relative flex items-center">
                            <span className="text-4xl font-light text-slate-400 mr-2">$</span>
                            <input
                                className="w-full max-w-[240px] bg-transparent border-0 text-center text-5xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-0 p-0 tabular-nums"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    {/* Type Toggle - Glass Segmented Control */}
                    <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-sm relative">
                        <div
                            className={`absolute inset-y-1.5 w-[calc(50%-6px)] rounded-xl bg-white dark:bg-slate-700 shadow-sm transition-all duration-300 ease-out ${form.type === "income" ? "translate-x-[calc(100%+6px)]" : "translate-x-0"}`}
                        />
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: "expense" })}
                            className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${form.type === "expense" ? "text-red-500" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
                        >
                            Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: "income" })}
                            className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${form.type === "income" ? "text-emerald-500" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
                        >
                            Ingreso
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Date & Merchant */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Fecha</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 transition-all font-medium backdrop-blur-sm"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Comercio</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-lg">storefront</span>
                                    <input
                                        className="w-full pl-11 pr-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/50 transition-all font-medium backdrop-blur-sm"
                                        value={form.merchant}
                                        onChange={e => setForm({ ...form, merchant: e.target.value })}
                                        placeholder="OXXO, Amazon..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Categoría</label>
                            <div className="relative group">
                                <select
                                    className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 transition-all font-medium backdrop-blur-sm cursor-pointer"
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                >
                                    {CATEGORY_KEYS.map(k => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none material-icons-round">expand_more</span>
                                {/* Visual indicator of selected category */}
                                <div className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none"
                                    style={{ background: CATEGORIES[form.category as CategoryKey]?.color || CATEGORIES.otros.color }}>
                                    <span className="material-icons-round text-[10px] text-white">
                                        {CATEGORIES[form.category as CategoryKey]?.icon || CATEGORIES.otros.icon}
                                    </span>
                                </div>
                            </div>
                            {/* Quick bubbles for common categories */}
                            <div className="flex gap-2 overflow-x-auto py-1 hide-scrollbar">
                                {["comida", "transporte", "supermercado", "hogar"].map(k => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setForm({ ...form, category: k })}
                                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${form.category === k
                                            ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent"
                                            : "bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORIES[k as CategoryKey]?.color }} />
                                        {CATEGORIES[k as CategoryKey]?.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description - Optional */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Nota (opcional)</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/50 transition-all font-medium backdrop-blur-sm"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    {/* Payment Method - Horizontal Scroll Cards */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Método de pago</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-1 px-1">
                            {/* None option */}
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, accountId: "", creditCardId: "" })}
                                className={`shrink-0 flex flex-col items-center justify-center w-24 h-20 rounded-2xl border-2 transition-all duration-300 gap-1 ${!form.accountId && !form.creditCardId
                                    ? "bg-slate-800 dark:bg-white border-transparent shadow-lg text-white dark:text-slate-900 scale-105"
                                    : "bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-400 hover:bg-slate-50"
                                    }`}
                            >
                                <span className="material-icons-round text-2xl">money_off</span>
                                <span className="text-[10px] font-bold">Ninguno</span>
                            </button>

                            {/* Accounts */}
                            {accounts.map(a => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, accountId: a.id, creditCardId: "" })}
                                    className={`shrink-0 flex flex-col items-start justify-between w-32 h-20 p-3 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${form.accountId === a.id
                                        ? "border-teal-500 bg-teal-500/5 shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                                        : "bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-white"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.accountId === a.id ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                                        <span className="material-icons-round text-sm">{a.icon || "account_balance"}</span>
                                    </div>
                                    <div className="text-left w-full relative z-10">
                                        <p className={`text-[11px] font-bold truncate ${form.accountId === a.id ? "text-teal-700 dark:text-teal-400" : "text-slate-700 dark:text-slate-300"}`}>{a.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">{formatCurrency(toMajorUnits(amountCentsOf({ amount: a.balance, amountCents: a.balanceCents })))}</p>
                                    </div>
                                    {form.accountId === a.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />}
                                </button>
                            ))}

                            {/* Cards */}
                            {cards.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setForm({ ...form, creditCardId: c.id, accountId: "" })}
                                    className={`shrink-0 flex flex-col items-start justify-between w-32 h-20 p-3 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${form.creditCardId === c.id
                                        ? "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                                        : "bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-white"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${form.creditCardId === c.id ? "bg-violet-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}>
                                        <span className="material-icons-round text-sm">credit_card</span>
                                    </div>
                                    <div className="text-left w-full relative z-10">
                                        <p className={`text-[11px] font-bold truncate ${form.creditCardId === c.id ? "text-violet-700 dark:text-violet-400" : "text-slate-700 dark:text-slate-300"}`}>{c.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium truncate">···· {c.lastFour}</p>
                                    </div>
                                    {form.creditCardId === c.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => setModalOpen(false)}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-[2] py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] relative overflow-hidden group ${form.type === "expense" ? "shadow-red-500/20 hover:shadow-red-500/30 bg-gradient-to-br from-red-500 to-rose-600" : "shadow-emerald-500/20 hover:shadow-emerald-500/30 bg-gradient-to-br from-emerald-500 to-teal-600"}`}
                            disabled={isSaving}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative">{isSaving ? "Guardando..." : "Registrar Transacción"}</span>
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog
                open={pendingDeleteId !== null}
                title="Eliminar transacción"
                description="Esta acción eliminará la transacción de forma permanente."
                confirmText="Eliminar"
                loading={isDeleting !== null}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
