"use client";

import { useEffect, useState } from "react";
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
interface Transaction {
    id: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    description: string;
    category: string;
    merchant?: string;
}

interface Subscription {
    id: string;
    name: string;
    amount: number;
    nextDate: string;
    active: boolean;
    color: string;
}

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
            const [txRes, subRes] = await Promise.all([
                fetch("/api/transactions?limit=1000"), // Get enough history
                fetch("/api/subscriptions")
            ]);
            const txs = await txRes.json();
            const subs = await subRes.json();
            setTransactions(txs);
            setSubscriptions(subs);
        } catch (e) {
            console.error("Failed to fetch calendar data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Merge transactions and subscriptions into events
    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        // Transactions on this exact date
        const dayTxs = transactions.filter(t => t.date.split("T")[0] === dateStr);

        // Subscription renewals on this day (approximate logic for recurring)
        // Simplification: just check if nextDate matches loosely or day matches
        const daySubs = subscriptions.filter(s => {
            if (!s.active) return false;
            const subDay = new Date(s.nextDate).getDate();
            return subDay === day; // Show on same day of month for simplicity
        });

        return { txs: dayTxs, subs: daySubs };
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

                <div className="flex items-center bg-white dark:bg-[#1a262d] p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
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
                    <button onClick={goToToday} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1a262d] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
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
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                        <div className="min-w-[800px]">
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
                                                        <span className="font-semibold">{Math.abs(t.amount)}</span>
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
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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
                                // Prepare data
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
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons-round text-[#2badee] animate-pulse">auto_awesome</span>
                            <h3 className="font-bold text-slate-900 dark:text-white">AI Insights</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <span className="font-semibold text-[#2badee]">Alerta:</span> Gastos recurrentes altos detectados para el <span className="font-medium">25 de Oct</span>.
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                                Tienes suscripciones activas por $25/mes sin uso reciente.
                            </div>
                        </div>
                    </div>

                    {/* Upcoming List */}
                    <div className="bg-white dark:bg-[#1a262d] rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
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
