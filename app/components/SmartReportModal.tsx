"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, TrendingUp, TrendingDown, CheckCircle, ArrowRight } from "lucide-react";
import { formatCurrency, Recommendation, CashFlowResult, CategoryBreakdown } from "../lib/financialEngine";
import { Cell, PieChart, Pie, ResponsiveContainer } from "recharts";

interface SmartReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        healthScore: number;
        cashFlow: CashFlowResult;
        categoryBreakdown: CategoryBreakdown[];
        recommendations: Recommendation[];
    } | null;
}

export function SmartReportModal({ isOpen, onClose, data }: SmartReportModalProps) {
    const barHeights = [45, 78, 52, 91, 63, 84, 58]; // Constant values to ensure purity

    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="p-6 pb-0 flex justify-between items-center relative z-10 shrink-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Sparkles size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            Reporte IA
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        Salud Financiera
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto p-6 space-y-8 scrollbar-hide">

                                {/* Hero Score Card */}
                                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-xl shadow-blue-500/20">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="text-6xl font-black mb-2 tracking-tighter">
                                            {data.healthScore}
                                        </div>
                                        <div className="text-blue-100 font-medium mb-6">Puntaje Global</div>

                                        <div className="w-full flex justify-between items-end h-24 gap-2">
                                            {barHeights.map((height, i) => (
                                                <div key={i} className="flex-1 flex flex-col justify-end h-full group">
                                                    <div
                                                        className="w-full bg-white/20 rounded-t-sm group-hover:bg-white/40 transition-all duration-500"
                                                        style={{ height: `${height}%` }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Flow Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase mb-2">
                                            <TrendingUp size={14} /> Ingresos
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">
                                            {formatCurrency(data.cashFlow.totalIncome)}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-2">
                                            <TrendingDown size={14} /> Gastos
                                        </div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white">
                                            {formatCurrency(data.cashFlow.totalExpenses)}
                                        </div>
                                    </div>
                                </div>

                                {/* Top Expense Category */}
                                {data.categoryBreakdown.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 flex items-center gap-6">
                                        <div className="relative w-24 h-24 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={data.categoryBreakdown}
                                                        dataKey="totalCents"
                                                        innerRadius={35}
                                                        outerRadius={45}
                                                        paddingAngle={5}
                                                        stroke="none"
                                                    >
                                                        {data.categoryBreakdown.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-slate-400">
                                                Mix
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                Mayor Gasto
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                                                {data.categoryBreakdown[0].label}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                Consumió el <span className="font-bold text-slate-700 dark:text-slate-300">{data.categoryBreakdown[0].percentage.toFixed(0)}%</span> de tus egresos.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CheckCircle size={20} className="text-blue-500" />
                                        Recomendaciones
                                    </h3>
                                    <div className="space-y-3">
                                        {data.recommendations.slice(0, 3).map((rec, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                                                    {rec.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                                    {rec.description}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                    <span>Impacto: {rec.impact}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {data.recommendations.length === 0 && (
                                            <p className="text-sm text-slate-500 italic">
                                                ¡Todo se ve excelente! Sigue así.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Call to Action */}
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    Entendido <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
