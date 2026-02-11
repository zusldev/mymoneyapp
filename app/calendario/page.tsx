"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/financialEngine";
import Link from "next/link";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

// Types
import type { CalendarTransaction as Transaction, CalendarSubscription as Subscription } from "../lib/types";
import { apiGet, normalizeApiError } from "../lib/api";
import { subscriptionArraySchema, transactionArraySchema } from "../lib/schemas";
import { toastError } from "../lib/toast";

// Helpers
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Mon start (0=Mon, 6=Sun)
};

export default function CalendarioPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived state for calendar
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const fetchData = async () => {
        try {
            const [txs, subs] = await Promise.all([
                apiGet("/api/transactions?limit=1000", transactionArraySchema),
                apiGet("/api/subscriptions", subscriptionArraySchema),
            ]);
            setTransactions(
                txs.map((tx) => ({
                    ...tx,
                    type: tx.type === "income" ? "income" : "expense",
                    amount: tx.amount ?? (tx.amountCents ?? 0) / 100,
                    merchant: tx.merchant ?? "",
                }))
            );
            setSubscriptions(
                subs.map((sub) => ({
                    ...sub,
                    amount: sub.amount ?? (sub.amountCents ?? 0) / 100,
                }))
            );
        } catch (e) {
            const failure = normalizeApiError(e);
            toastError(failure.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const txByDate = useMemo(() => {
        const map: Record<string, Transaction[]> = {};
        for (const tx of transactions) {
            const key = tx.date.split("T")[0];
            (map[key] ||= []).push(tx);
        }
        return map;
    }, [transactions]);

    const subsByDate = useMemo(() => {
        const map: Record<string, Subscription[]> = {};
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month, daysInMonth);

        for (const sub of subscriptions) {
            if (!sub.active) continue;
            const nextDate = new Date(sub.nextDate);

            const pushDay = (date: Date) => {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                (map[key] ||= []).push(sub);
            };

            if (sub.frequency === "weekly") {
                let cursor = new Date(nextDate);
                while (cursor < monthStart) cursor.setDate(cursor.getDate() + 7);
                while (cursor <= monthEnd) {
                    pushDay(cursor);
                    cursor = new Date(cursor);
                    cursor.setDate(cursor.getDate() + 7);
                }
                continue;
            }

            if (sub.frequency === "monthly") {
                const cursor = new Date(year, month, Math.min(nextDate.getDate(), daysInMonth));
                if (cursor >= monthStart && cursor <= monthEnd && cursor >= new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate())) {
                    pushDay(cursor);
                }
                continue;
            }

            if (sub.frequency === "yearly") {
                if (nextDate.getMonth() === month && year >= nextDate.getFullYear()) {
                    const cursor = new Date(year, month, Math.min(nextDate.getDate(), daysInMonth));
                    pushDay(cursor);
                }
                continue;
            }
        }

        return map;
    }, [subscriptions, year, month, daysInMonth]);

    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return {
            txs: txByDate[dateStr] || [],
            subs: subsByDate[dateStr] || [],
        };
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Stats
    const currentMonthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const income = currentMonthTxs.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = currentMonthTxs.filter(t => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;

    // Upcoming
    const upcoming = [
        ...subscriptions.filter(s => s.active).map(s => ({
            type: "sub", date: new Date(s.nextDate), text: s.name, amount: -s.amount, icon: "sync"
        })),
        // Add pending transactions logic if available, for now just future subs
    ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 border-4 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ═══ Header & Controls ═══ */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario Financiero</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Proyección: Ahorro estimado de {formatCurrency(Math.max(0, income - expenses))} este mes
                    </p>
                </div>

                <div className="flex items-center liquid-chip p-1 rounded-lg">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-xl">chevron_left</span>
                    </button>
                    <div className="px-4 font-semibold text-slate-800 dark:text-white min-w-[140px] text-center capitalize">
                        {MONTHS[month]} {year}
                    </div>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-xl">chevron_right</span>
                    </button>
                </div>

                <div className="flex gap-3">
                    <button onClick={goToToday} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 liquid-chip rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Hoy
                    </button>
                    <Link href="/transacciones" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2badee] hover:bg-[#1a8cb5] rounded-lg shadow-md shadow-[#2badee]/20 transition-colors">
                        <span className="material-icons-round text-base">add</span>
                        Nueva Tx
                    </Link>
                </div>
            </header>

            {/* ═══ Main Grid ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                {/* Calendar Section */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                    <div className="liquid-card rounded-xl overflow-hidden overflow-x-auto">
                        <div className="min-w-[640px] md:min-w-0">
                            {/* Headers */}
                            <div className="grid grid-cols-[repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                {DAYS.map((d, i) => (
                                    <div key={d} className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${i >= 5 ? "text-[#2badee]" : "text-slate-500 dark:text-slate-400"}`}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days */}
                            <div className="grid grid-cols-[repeat(7,1fr)] auto-rows-[minmax(100px,_1fr)] divide-x divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-[#1a262d]">
                                {/* Empty Padding Days */}
                                {Array.from({ length: firstDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2 min-h-[100px] bg-slate-50/30 dark:bg-slate-800/20" />
                                ))}

                                {/* Actual Days */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                    const { txs, subs } = getEventsForDay(day);

                                    return (
                                        <div key={day} className={`p-2 min-h-[100px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative cursor-pointer ${isToday ? "bg-[#2badee]/5 dark:bg-[#2badee]/10 ring-1 ring-inset ring-[#2badee]/20" : ""}`}>
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${isToday ? "bg-[#2badee] text-white shadow-sm" : "text-slate-700 dark:text-slate-300"}`}>
                                                {day}
                                            </span>
                                            {isToday && <span className="ml-1 text-[9px] font-semibold text-[#2badee] uppercase tracking-wide">Hoy</span>}

                                            <div className="mt-1 space-y-1">
                                                {/* Subscriptions */}
                                                {subs.map(s => (
                                                    <div key={s.id} className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30 truncate">
                                                        <span className="material-icons-round text-[10px]">sync</span>
                                                        <span className="truncate">{s.name}</span>
                                                    </div>
                                                ))}
                                                {/* Transactions (limit to 2) */}
                                                {txs.slice(0, 2).map(t => (
                                                    <div key={t.id} className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded truncate border ${t.type === "income"
                                                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-100 dark:border-green-900/30"
                                                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-100 dark:border-red-900/30"
                                                        }`}>
                                                        <span className="truncate flex-1">{t.merchant || t.description}</span>
                                                        <span className="font-semibold">{formatCurrency(Math.abs(t.amount))}</span>
                                                    </div>
                                                ))}
                                                {txs.length > 2 && <div className="text-[9px] text-slate-400 pl-1">+{txs.length - 2} más</div>}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Trailing empty cells to fill grid row if needed */}
                                {Array.from({ length: 42 - (firstDay + daysInMonth) }).map((_, i) => (
                                    <div key={`trail-${i}`} className="p-2 min-h-[100px] bg-slate-50/30 dark:bg-slate-800/20" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="liquid-card rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Proyección de Balance</h3>
                                <p className="text-sm text-slate-500">Flujo de efectivo estimado basado en recurrentes</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-1 bg-[#2badee] rounded-full"></span>
                                    <span className="text-slate-600 dark:text-slate-400">Balance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-1 border-t border-dashed border-slate-400"></span>
                                    <span className="text-slate-600 dark:text-slate-400">Proyección</span>
                                </div>
                            </div>
                        </div>

                        {/* ChartJS Chart */}
                        <div className="relative w-full h-64 bg-white dark:bg-[#1a262d] rounded-lg border border-slate-100 dark:border-slate-700 p-4">
                            {(() => {
                                // Prepare data — start from current total balance delta
                                let running = 0;
                                const dailyBalances = Array.from({ length: daysInMonth }, (_, i) => {
                                    const day = i + 1;
                                    const { txs, subs } = getEventsForDay(day);
                                    const dailyChange = txs.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0)
                                        + subs.reduce((acc, s) => acc - s.amount, 0);
                                    running += dailyChange;
                                    return running;
                                });

                                const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

                                const chartData = {
                                    labels,
                                    datasets: [
                                        {
                                            label: 'Balance Proyectado',
                                            data: dailyBalances,
                                            borderColor: '#2badee',
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            backgroundColor: (context: any) => {
                                                const ctx = context.chart.ctx;
                                                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                                                gradient.addColorStop(0, 'rgba(43, 173, 238, 0.4)');
                                                gradient.addColorStop(1, 'rgba(43, 173, 238, 0.0)');
                                                return gradient;
                                            },
                                            fill: true,
                                            tension: 0.4,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            pointRadius: (ctx: any) => {
                                                const index = ctx.dataIndex;
                                                const day = index + 1;
                                                return (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 6 : 0;
                                            },
                                            pointBackgroundColor: '#2badee',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2,
                                            pointHoverRadius: 6,
                                        },
                                    ],
                                };

                                const options = {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            mode: 'index' as const,
                                            intersect: false,
                                            callbacks: {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                label: (context: any) => formatCurrency(context.raw),
                                            },
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            titleColor: '#f1f5f9',
                                            bodyColor: '#e2e8f0',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            borderWidth: 1,
                                            padding: 10,
                                            displayColors: false,
                                        },
                                    },
                                    scales: {
                                        x: {
                                            grid: { display: false },
                                            ticks: {
                                                maxTicksLimit: 10,
                                                color: '#94a3b8'
                                            }
                                        },
                                        y: {
                                            grid: {
                                                color: 'rgba(226, 232, 240, 0.5)',
                                                borderDash: [5, 5]
                                            },
                                            ticks: {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                callback: (value: any) => formatCurrency(value, "USD").split(".")[0],
                                                color: '#94a3b8',
                                                font: { size: 10 }
                                            },
                                            border: { display: false }
                                        }
                                    },
                                    interaction: {
                                        mode: 'nearest' as const,
                                        axis: 'x' as const,
                                        intersect: false
                                    }
                                };

                                return <Line data={chartData} options={options} />;
                            })()}
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">

                    {/* Monthly Summary */}
                    <div className="bg-gradient-to-br from-[#2badee] to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-[#2badee]/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <h2 className="text-sm font-medium text-blue-50 relative z-10">Balance del Mes</h2>
                        <div className="text-3xl font-bold mt-1 mb-6 relative z-10">{formatCurrency(balance)}</div>
                        <div className="space-y-3 relative z-10">
                            <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-green-400/20 rounded"><span className="material-icons-round text-green-300 text-sm">arrow_upward</span></div>
                                    <span className="text-sm font-medium">Ingresos</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(income)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-red-400/20 rounded"><span className="material-icons-round text-red-300 text-sm">arrow_downward</span></div>
                                    <span className="text-sm font-medium">Gastos</span>
                                </div>
                                <span className="text-sm font-bold">{formatCurrency(expenses)}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="liquid-card rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons-round text-[#2badee]">auto_awesome</span>
                            <h3 className="font-bold text-slate-900 dark:text-white">AI Insights</h3>
                        </div>
                        <div className="space-y-3">
                            {(() => {
                                const activeSubs = subscriptions.filter(s => s.active);
                                const monthSubs = activeSubs.filter(s => {
                                    const d = new Date(s.nextDate).getDate();
                                    return d >= 20 && d <= 28;
                                });
                                const unusedSubs = activeSubs.filter(s => s.amount < 100);
                                const tips: { text: string; type: "alert" | "info" }[] = [];

                                if (monthSubs.length > 0) {
                                    tips.push({ text: `${monthSubs.length} cobro${monthSubs.length > 1 ? "s" : ""} recurrente${monthSubs.length > 1 ? "s" : ""} entre el 20 y 28 de este mes (${monthSubs.map(s => s.name).join(", ")}).`, type: "alert" });
                                }
                                if (expenses > income && income > 0) {
                                    tips.push({ text: `Gastos superan ingresos por ${formatCurrency(expenses - income)} este mes.`, type: "alert" });
                                }
                                if (unusedSubs.length > 0) {
                                    tips.push({ text: `Tienes ${unusedSubs.length} suscripci\u00f3n${unusedSubs.length > 1 ? "es" : ""} de bajo monto. Revisa si a\u00fan las necesitas.`, type: "info" });
                                }
                                if (tips.length === 0) {
                                    tips.push({ text: "Tu calendario financiero se ve bien para este mes.", type: "info" });
                                }

                                return tips.map((tip, i) => (
                                    <div key={i} className={`p-3 rounded-lg border text-sm ${
                                        tip.type === "alert"
                                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                                    }`}>
                                        <p className={tip.type === "alert" ? "text-slate-700 dark:text-slate-300 leading-relaxed" : "text-slate-600 dark:text-slate-400"}>
                                            {tip.type === "alert" && <span className="font-semibold text-[#2badee]">Alerta: </span>}
                                            {tip.text}
                                        </p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Upcoming List */}
                    <div className="liquid-card rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Próximos</h3>
                            <Link href="/transacciones" className="text-xs font-medium text-[#2badee] hover:text-[#1a8cb5]">Ver Todos</Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {upcoming.map((item, i) => (
                                <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                        <span className="material-icons-round text-lg">{item.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.text}</p>
                                        <p className="text-xs text-slate-500 truncate">{item.date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${item.amount > 0 ? "text-green-600" : "text-slate-700 dark:text-slate-300"}`}>
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                            {upcoming.length === 0 && (
                                <div className="p-4 text-center text-sm text-slate-400">No hay eventos próximos</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
