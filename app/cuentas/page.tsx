"use client";
import { useEffect, useState, useMemo } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import type { AccountFull as Account } from "../lib/types";
import { apiGet, apiPost, normalizeApiError } from "../lib/api";
import { accountArraySchema } from "../lib/schemas";
import { toastError, toastSuccess } from "../lib/toast";
import { parse, percentages, toMajorUnits } from "../lib/money";
import { toMonthlyCents, type RecurrenceFrequency } from "../lib/dates";

/* ═══ Constants ═══ */
const T = { 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e" };
const typeIcons: Record<string, string> = { checking: "account_balance", savings: "savings", cash: "payments", investment: "show_chart" };
const typeLabels: Record<string, string> = { checking: "Cheques", savings: "Ahorro", cash: "Efectivo", investment: "Inversión" };
const roleLabels: Record<string, string> = { checking: "Gasto diario", savings: "Reserva", cash: "Liquidez", investment: "Crecimiento" };
const colorOptions = ["#14b8a6", "#0d9488", "#06b6d4", "#0891b2", "#8b5cf6", "#06d6a0", "#f59e0b", "#3b82f6"];

/* ═══ Insights ═══ */
interface Insight { icon: string; title: string; desc: string; severity: "info" | "warn" | "tip"; }
const moneyValue = (major?: number, cents?: number) => toMajorUnits(typeof cents === "number" ? cents : parse(major ?? 0));
const moneyCents = (major?: number, cents?: number) => (typeof cents === "number" ? cents : parse(major ?? 0));
const accountBalanceCents = (account: Pick<Account, "balance" | "balanceCents">) => moneyCents(account.balance, account.balanceCents);
const accountBalance = (account: Pick<Account, "balance" | "balanceCents">) => moneyValue(account.balance, account.balanceCents);
const recurringAmount = (item: { amount?: number; amountCents?: number }) => moneyValue(item.amount, item.amountCents);
function generateInsights(accounts: Account[], totalCents: number): Insight[] {
    const ins: Insight[] = [];
    if (accounts.length === 0 || totalCents <= 0) return ins;
    const maxPct = Math.max(...accounts.map(a => percentages(accountBalanceCents(a), totalCents, { clamp: true, decimals: 0 })));
    const dom = accounts.find(a => percentages(accountBalanceCents(a), totalCents, { clamp: true, decimals: 0 }) === maxPct);
    if (maxPct > 70 && accounts.length > 1) ins.push({ icon: "warning", title: "Alta concentración", desc: `${Math.round(maxPct)}% en ${dom?.name}. Diversificar reduciría riesgo.`, severity: "warn" });
    const ck = accounts.filter(a => a.type === "checking").reduce((s, a) => s + accountBalance(a), 0);
    const sv = accounts.filter(a => a.type === "savings").reduce((s, a) => s + accountBalance(a), 0);
    if (ck > sv * 2.5 && sv > 0) ins.push({ icon: "lightbulb", title: "Efectivo sin rendimiento", desc: `${formatCurrency(ck)} en cheques vs ${formatCurrency(sv)} en ahorro.`, severity: "tip" });
    for (const a of accounts) {
        const balance = accountBalance(a);
        if (balance < 1000 && a.type === "checking") ins.push({ icon: "error_outline", title: `Saldo bajo: ${a.name}`, desc: `Solo ${formatCurrency(balance)}. Riesgo de sobregiro.`, severity: "warn" });
    }
    if (!accounts.find(a => a.type === "savings") && accounts.length > 1) ins.push({ icon: "savings", title: "Sin fondo de emergencia", desc: "Crear una cuenta de ahorro te protege.", severity: "tip" });
    if (maxPct < 50 && accounts.length >= 3) ins.push({ icon: "check_circle", title: "Buena diversificación", desc: "Tu dinero está bien distribuido.", severity: "info" });
    return ins.slice(0, 4);
}

/* ═══ Account Card ═══ */
function AccountCard({ account, total, index, onEdit, onDelete, deletingId }: {
    account: Account; total: number; index: number;
    onEdit: (a: Account) => void; onDelete: (id: string) => void;
    deletingId: string | null;
}) {
    const balance = accountBalance(account);
    const pct = percentages(accountBalanceCents(account), total, { clamp: true, decimals: 0 });
    const icon = typeIcons[account.type] || "account_balance_wallet";
    const lastTx = account.transactions?.[0];
    const subCount = account.subscriptions?.length || 0;
    const incomeCount = account.incomes?.length || 0;
    const monthlySubCost = (account.subscriptions || []).reduce((s, sub) => s + toMajorUnits(toMonthlyCents(moneyCents(sub.amount, sub.amountCents), sub.frequency as RecurrenceFrequency)), 0);
    const monthlyIncome = (account.incomes || []).reduce((s, inc) => s + toMajorUnits(toMonthlyCents(moneyCents(inc.amount, inc.amountCents), inc.frequency as RecurrenceFrequency)), 0);

    // Dynamic font scaling
    const fontScale = 1.35 + Math.min(pct / 30, 1) * 0.45;

    return (
        <div className="liquid-glass liquid-shimmer-edge rounded-2xl p-5 transition-all duration-500 hover:shadow-lg hover:-translate-y-0.5 group liquid-settle"
            style={{ animationDelay: `${150 + index * 100}ms` }}>

            {/* Top: Icon + Name + Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${T[400]}20, ${T[600]}15)` }}>
                        <span className="material-icons-round text-lg" style={{ color: T[500] }}>{icon}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{account.name}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${T[500]}10`, color: T[600] }}>
                            {roleLabels[account.type] || typeLabels[account.type]}
                        </span>
                    </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        aria-label={`Editar cuenta ${account.name}`}
                        onClick={() => onEdit(account)}
                        className="touch-target focus-ring p-1.5 rounded-lg hover:bg-teal-500/10 text-slate-400 hover:text-teal-600 transition-colors"
                    >
                        <span className="material-icons-round text-[15px]">edit</span>
                    </button>
                    <button
                        aria-label={`Eliminar cuenta ${account.name}`}
                        disabled={deletingId === account.id}
                        onClick={() => onDelete(account.id)}
                        className="touch-target focus-ring p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-60"
                    >
                        <span className="material-icons-round text-[15px]">delete_outline</span>
                    </button>
                </div>
            </div>

            {/* Balance */}
            <p className="font-black tabular-nums text-slate-900 dark:text-white tracking-tight" style={{ fontSize: `${fontScale}rem` }}>
                {formatCurrency(balance, account.currency)}
            </p>

            {/* Proportion */}
            <div className="flex items-center gap-2 mt-2.5 mb-3.5">
                <div className="flex-1 h-[5px] rounded-full bg-slate-100/80 dark:bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{
                        width: `${Math.max(pct, 2)}%`,
                        background: `linear-gradient(90deg, ${T[400]}, ${T[600]})`,
                    }} />
                </div>
                <span className="text-[11px] font-bold tabular-nums" style={{ color: T[600] }}>{Math.round(pct)}%</span>
            </div>

            {/* Connected services */}
            <div className="space-y-1.5 border-t border-slate-100/60 dark:border-white/5 pt-3">
                {lastTx && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-[13px]" style={{ color: T[400] }}>receipt</span>
                        <span className="truncate">{lastTx.merchant || "Transacción"}</span>
                        <span className="ml-auto tabular-nums font-medium">{lastTx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(recurringAmount(lastTx)))}</span>
                    </div>
                )}
                {subCount > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-[13px] text-violet-400">sync</span>
                        <span>{subCount} suscripción{subCount > 1 ? "es" : ""}</span>
                        <span className="ml-auto tabular-nums font-medium text-violet-500">-{formatCurrency(monthlySubCost)}/mes</span>
                    </div>
                )}
                {incomeCount > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-[13px] text-emerald-400">trending_up</span>
                        <span>{incomeCount} ingreso{incomeCount > 1 ? "s" : ""}</span>
                        <span className="ml-auto tabular-nums font-medium text-emerald-500">+{formatCurrency(monthlyIncome)}/mes</span>
                    </div>
                )}
                {account._count && account._count.transactions > 0 && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="material-icons-round text-[13px]">history</span>
                        <span>{account._count.transactions} movimientos</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══ Main Page ═══ */
export default function CuentasPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", type: "checking", balance: "", currency: "MXN", color: "#14b8a6", icon: "" });
    const [simFrom, setSimFrom] = useState("");
    const [simTo, setSimTo] = useState("");
    const [simAmount, setSimAmount] = useState("");

    const fetchAccounts = () => {
        apiGet("/api/accounts", accountArraySchema)
            .then((data) => setAccounts(Array.isArray(data) ? (data as Account[]) : []))
            .catch((error) => {
                const failure = normalizeApiError(error);
                toastError(failure.error);
            })
            .finally(() => setLoading(false));
    };
    useEffect(() => { fetchAccounts(); }, []);

    const totalBalanceCents = accounts.reduce((s, a) => s + accountBalanceCents(a), 0);
    const totalBalance = toMajorUnits(totalBalanceCents);
    const liquidBalance = toMajorUnits(accounts.filter(a => a.type !== "investment").reduce((s, a) => s + accountBalanceCents(a), 0));
    const reservedBalance = toMajorUnits(accounts.filter(a => a.type === "savings" || a.type === "investment").reduce((s, a) => s + accountBalanceCents(a), 0));
    const insights = useMemo(() => generateInsights(accounts, totalBalanceCents), [accounts, totalBalanceCents]);
    const hhi = accounts.length > 0 && totalBalanceCents > 0
        ? accounts.reduce((s, a) => s + Math.pow(percentages(accountBalanceCents(a), totalBalanceCents, { clamp: true, decimals: 2 }), 2), 0)
        : 0;
    const concentrationRisk = hhi > 6000 ? "Alto" : hhi > 3000 ? "Medio" : "Bajo";
    const concentrationColor = hhi > 6000 ? "text-red-500" : hhi > 3000 ? "text-amber-500" : "text-teal-500";

    const simPreview = useMemo(() => {
        if (!simFrom || !simTo || !simAmount || simFrom === simTo) return null;
        let amtCents: number;
        try {
            amtCents = parse(simAmount);
        } catch {
            return null;
        }
        if (amtCents <= 0) return null;
        const from = accounts.find(a => a.id === simFrom);
        const to = accounts.find(a => a.id === simTo);
        if (!from || !to) return null;
        const fromBalanceCents = moneyCents(from.balance, from.balanceCents);
        const toBalanceCents = moneyCents(to.balance, to.balanceCents);
        if (amtCents > fromBalanceCents) return { error: "Fondos insuficientes" };
        return {
            from: {
                ...from,
                balance: toMajorUnits(fromBalanceCents),
                newBalance: toMajorUnits(fromBalanceCents - amtCents),
            },
            to: {
                ...to,
                balance: toMajorUnits(toBalanceCents),
                newBalance: toMajorUnits(toBalanceCents + amtCents),
            },
            amount: toMajorUnits(amtCents),
        };
    }, [simFrom, simTo, simAmount, accounts]);

    const openCreate = () => { setEditingAccount(null); setForm({ name: "", type: "checking", balance: "", currency: "MXN", color: "#14b8a6", icon: "" }); setModalOpen(true); };
    const openEdit = (a: Account) => { setEditingAccount(a); setForm({ name: a.name, type: a.type, balance: accountBalance(a).toString(), currency: a.currency, color: a.color, icon: a.icon }); setModalOpen(true); };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const method = editingAccount ? "PUT" : "POST";
            const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
            await apiPost(url, form, undefined, method);
            toastSuccess(editingAccount ? "Cuenta actualizada" : "Cuenta creada");
            setModalOpen(false);
            fetchAccounts();
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
    const handleDelete = async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        setIsDeleting(id);
        try {
            await apiPost(`/api/accounts/${id}`, null, undefined, "DELETE");
            toastSuccess("Cuenta eliminada");
            fetchAccounts();
        } catch (error) {
            const failure = normalizeApiError(error);
            toastError(failure.error);
        } finally {
            setIsDeleting(null);
            setPendingDeleteId(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 rounded-full animate-spin" style={{ borderColor: `${T[300]}40`, borderTopColor: T[500] }} />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-7 relative">

            {/* ═══ Ambient blobs ═══ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full opacity-[0.045]"
                    style={{ background: `radial-gradient(circle, ${T[400]}, transparent 70%)` }} />
                <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full opacity-[0.03]"
                    style={{ background: `radial-gradient(circle, ${T[300]}, transparent 70%)` }} />
                <div className="absolute -bottom-20 right-1/3 w-[280px] h-[280px] rounded-full opacity-[0.025]"
                    style={{ background: `radial-gradient(circle, ${T[500]}, transparent 70%)` }} />
            </div>

            {/* ═══════════ HERO: FLOATING GLASS HEADER ═══════════ */}
            <header className="liquid-glass-hero liquid-shimmer-edge rounded-3xl p-6 md:p-8 liquid-settle">

                {/* Label + Action */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <span className="material-icons-round text-base" style={{ color: T[500] }}>map</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-teal-600/70 dark:text-teal-400/70">Mapa de Dinero</span>
                    </div>
                    <button onClick={openCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                        style={{ background: `${T[500]}18`, color: T[600] }}>
                        <span className="material-icons-round text-base">add_circle_outline</span>
                        Cuenta
                    </button>
                </div>

                {/* Total Balance — floating */}
                <div className="liquid-float" style={{ animationDelay: "200ms" }}>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {formatCurrency(totalBalance)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        {accounts.length} cuenta{accounts.length !== 1 ? "s" : ""} · Balance total
                    </p>
                </div>

                {/* Distribution bar */}
                {accounts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex h-2 rounded-full overflow-hidden gap-px">
                            {[...accounts].sort((a, b) => accountBalance(b) - accountBalance(a)).map((a, i) => {
                                const pct = percentages(accountBalanceCents(a), totalBalanceCents, { clamp: true, decimals: 0 });
                                return (
                                    <div key={a.id}
                                        className="rounded-full transition-all duration-1000 ease-out relative group/seg"
                                        style={{
                                            width: `${Math.max(pct, 4)}%`,
                                            background: `hsl(${170 + i * 28}, 55%, ${58 - i * 4}%)`,
                                            opacity: 0.75,
                                        }}
                                        title={`${a.name}: ${Math.round(pct)}%`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-[10px] font-semibold shadow-lg opacity-0 group-hover/seg:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 liquid-glass">
                                            {a.name} · {Math.round(pct)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-3">
                            {[...accounts].sort((a, b) => accountBalance(b) - accountBalance(a)).map((a, i) => (
                                <div key={a.id} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ background: `hsl(${170 + i * 28}, 55%, ${58 - i * 4}%)` }} />
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{a.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mini stats — glass pills */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="liquid-glass rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-teal-600/60 dark:text-teal-400/60 uppercase tracking-wide">Liquidez</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(liquidBalance)}</p>
                    </div>
                    <div className="liquid-glass rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-teal-600/60 dark:text-teal-400/60 uppercase tracking-wide">Reservas</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{formatCurrency(reservedBalance)}</p>
                    </div>
                    <div className="liquid-glass rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-teal-600/60 dark:text-teal-400/60 uppercase tracking-wide">Riesgo</p>
                        <p className={`text-sm font-bold mt-0.5 ${concentrationColor}`}>{concentrationRisk}</p>
                    </div>
                </div>
            </header>

            {/* ═══════════ ACCOUNT CARDS ═══════════ */}
            <section>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-[3px] h-5 rounded-full" style={{ background: `linear-gradient(to bottom, ${T[400]}80, ${T[600]}40)` }} />
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Distribución</h2>
                </div>

                {accounts.length === 0 ? (
                    <div className="liquid-glass rounded-2xl text-center py-16">
                        <span className="material-icons-round text-5xl mb-3 block" style={{ color: `${T[400]}40` }}>account_balance</span>
                        <p className="text-sm text-slate-500 mb-3">No tienes cuentas registradas</p>
                        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: T[500] }}>Agregar Primera</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...accounts].sort((a, b) => accountBalance(b) - accountBalance(a)).map((account, idx) => (
                            <AccountCard key={account.id} account={account} total={totalBalanceCents} index={idx} onEdit={openEdit} onDelete={requestDelete} deletingId={isDeleting} />
                        ))}
                    </div>
                )}
            </section>

            {/* ═══════════ INSIGHTS ═══════════ */}
            {insights.length > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-[3px] h-5 rounded-full" style={{ background: `linear-gradient(to bottom, ${T[400]}80, ${T[600]}40)` }} />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Inteligencia</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {insights.map((ins, i) => (
                            <div key={i} className={`liquid-glass rounded-xl p-4 liquid-settle ${ins.severity === "warn" ? "!border-amber-300/30 dark:!border-amber-700/20" :
                                ins.severity === "tip" ? "!border-teal-300/30 dark:!border-teal-700/20" :
                                    "!border-emerald-300/30 dark:!border-emerald-700/20"
                                }`} style={{ animationDelay: `${400 + i * 80}ms` }}>
                                <div className="flex items-start gap-3">
                                    <span className={`material-icons-round text-lg mt-0.5 ${ins.severity === "warn" ? "text-amber-500" : ins.severity === "tip" ? "text-teal-500" : "text-emerald-500"
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

            {/* ═══════════ TRANSFER SIMULATOR ═══════════ */}
            {accounts.length >= 2 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-[3px] h-5 rounded-full" style={{ background: `linear-gradient(to bottom, ${T[400]}80, ${T[600]}40)` }} />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Simulador</h2>
                    </div>
                    <div className="liquid-glass rounded-2xl p-5 liquid-settle" style={{ animationDelay: "500ms" }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Desde</label>
                                <select value={simFrom} onChange={e => setSimFrom(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/40 backdrop-blur-sm transition-all">
                                    <option value="">Seleccionar</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(accountBalance(a))})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Hacia</label>
                                <select value={simTo} onChange={e => setSimTo(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/40 backdrop-blur-sm transition-all">
                                    <option value="">Seleccionar</option>
                                    {accounts.filter(a => a.id !== simFrom).map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(accountBalance(a))})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Monto</label>
                                <input type="number" step="0.01" value={simAmount} onChange={e => setSimAmount(e.target.value)} placeholder="0.00"
                                    className="w-full px-3 py-2.5 bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400/40 backdrop-blur-sm transition-all" />
                            </div>
                        </div>

                        {simPreview && !("error" in simPreview) && (
                            <div className="mt-4 liquid-glass rounded-xl p-4 flex items-center justify-between">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 mb-0.5">{simPreview.from.name}</p>
                                    <p className="text-xs font-bold text-slate-400 line-through tabular-nums">{formatCurrency(simPreview.from.balance)}</p>
                                    <p className="text-sm font-black tabular-nums text-red-500">{formatCurrency(simPreview.from.newBalance)}</p>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 px-3">
                                    <span className="material-icons-round text-xl" style={{ color: T[500] }}>arrow_forward</span>
                                    <span className="text-[10px] font-bold" style={{ color: T[600] }}>{formatCurrency(simPreview.amount)}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 mb-0.5">{simPreview.to.name}</p>
                                    <p className="text-xs font-bold text-slate-400 line-through tabular-nums">{formatCurrency(simPreview.to.balance)}</p>
                                    <p className="text-sm font-black tabular-nums text-emerald-600">{formatCurrency(simPreview.to.newBalance)}</p>
                                </div>
                            </div>
                        )}
                        {simPreview && "error" in simPreview && (
                            <p className="mt-3 text-xs text-red-500 flex items-center gap-1.5">
                                <span className="material-icons-round text-sm">error</span>
                                {simPreview.error}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* ═══════════ MODAL ═══════════ */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Input - Floating Glass */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Nombre de la cuenta</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/50 transition-all font-medium backdrop-blur-sm"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: BBVA Nómina"
                            required
                        />
                    </div>

                    {/* Balance Input - Large & Central */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Balance actual</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-teal-500 transition-colors">$</span>
                            <input
                                className="w-full pl-8 pr-4 py-4 bg-slate-100/50 dark:bg-slate-800/50 border-0 rounded-2xl text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-teal-500/50 transition-all backdrop-blur-sm tabular-nums"
                                type="number"
                                step="0.01"
                                value={form.balance}
                                onChange={e => setForm({ ...form, balance: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Type Selector - Glass Tiles */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Tipo de cuenta</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["checking", "savings", "cash", "investment"] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm({ ...form, type: t })}
                                    className={`relative p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 group ${form.type === t
                                        ? "bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                                        : "bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60"
                                        }`}
                                >
                                    <span className={`material-icons-round text-2xl transition-colors ${form.type === t ? "text-teal-500" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
                                        {typeIcons[t]}
                                    </span>
                                    <span className={`text-xs font-semibold transition-colors ${form.type === t ? "text-teal-700 dark:text-teal-300" : "text-slate-600 dark:text-slate-400"}`}>
                                        {typeLabels[t]}
                                    </span>
                                    {form.type === t && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker - Improved */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Color representativo</label>
                        <div className="flex gap-3 flex-wrap p-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl backdrop-blur-sm">
                            {colorOptions.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setForm({ ...form, color: c })}
                                    className={`w-9 h-9 rounded-full transition-all duration-300 flex items-center justify-center ${form.color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1a262d] scale-110 shadow-lg" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                                    style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 15px ${c}60` : undefined }}
                                >
                                    {form.color === c && <span className="material-icons-round text-white text-base">check</span>}
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
                            className="flex-[2] py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all active:scale-[0.98] relative overflow-hidden group"
                            style={{ background: `linear-gradient(135deg, ${T[500]}, ${T[600]})` }}
                            disabled={isSaving}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative">{isSaving ? "Guardando..." : editingAccount ? "Guardar Cambios" : "Crear Cuenta"}</span>
                        </button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog
                open={pendingDeleteId !== null}
                title="Eliminar cuenta"
                description="Se eliminará la cuenta y sus transacciones relacionadas."
                confirmText="Eliminar"
                loading={isDeleting !== null}
                onCancel={() => setPendingDeleteId(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
