"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, TrendingDown, CheckCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiGet } from "../lib/api";
import { formatCurrency, CashFlowResult, CategoryBreakdown, Recommendation } from "../lib/financialEngine";
import { Cell, PieChart, Pie, ResponsiveContainer } from "recharts";

interface ReportData {
    healthScore: number;
    cashFlow: CashFlowResult;
    categoryBreakdown: CategoryBreakdown[];
    recommendations: Recommendation[];
}

export default function ReportPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await apiGet<ReportData>("/api/analysis");
                setData(res);
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    if (!data) return (
        <div className="p-8 text-center mt-20">
            <p className="text-slate-500">No se pudieron cargar los datos del reporte.</p>
            <button onClick={() => router.back()} className="mt-4 text-blue-500 font-bold flex items-center gap-2 mx-auto">
                <ArrowLeft size={16} /> Volver
            </button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <header className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-800"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reporte Inteligente</h1>
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles size={12} /> Generado por IA
                    </div>
                </div>
            </header>

            {/* Hero Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white shadow-2xl shadow-blue-500/20"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-7xl font-black mb-2 tracking-tighter">
                        {data.healthScore}
                    </div>
                    <p className="text-blue-100 font-medium mb-6">Salud Financiera Global</p>

                    <div className="w-full flex justify-between items-end h-20 gap-2 opacity-60">
                        {[45, 78, 52, 91, 63, 84, 58, 70, 40, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-white/30 rounded-t-sm" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Cash Flow Summary & Liquidity Insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase mb-3">
                            <TrendingUp size={14} /> Ingresos
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatCurrency(data.cashFlow.totalIncome)}
                        </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase mb-3">
                            <TrendingDown size={14} /> Gastos
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {formatCurrency(data.cashFlow.totalExpenses)}
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-tighter">Liquidez Disponible</h4>
                        <div className="px-2 py-0.5 rounded-full bg-blue-500 text-[10px] font-black text-white">ESTADÍSTICA</div>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
                        {formatCurrency(data.cashFlow.netCashFlow)}
                    </div>
                    <p className="text-xs text-blue-700/60 dark:text-blue-300/60 font-medium">Balance neto del periodo actual</p>
                </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Mix de Gastos</h3>
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="w-48 h-48 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryBreakdown}
                                    dataKey="totalCents"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={6}
                                    stroke="none"
                                >
                                    {data.categoryBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                        {data.categoryBreakdown.slice(0, 4).map((cat, i) => (
                            <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{cat.percentage.toFixed(0)}%</span>
                                    <span className="text-[10px] font-medium text-slate-400">{formatCurrency(cat.totalCents)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle size={20} className="text-blue-500" />
                        Recomendaciones
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">IA INSIGHTS</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {data.recommendations.map((rec, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${rec.impact === 'alto' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                {rec.title}
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed mb-4">{rec.description}</p>
                            <div className="inline-flex px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                Impacto: {rec.impact}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
