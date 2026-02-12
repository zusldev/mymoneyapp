"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import {
  Wallet,
  BrainCircuit,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import {
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

import { apiGet } from "./lib/api";
import type { AnalysisData, Subscription } from "./lib/types";
import { formatCurrency } from "./lib/financialEngine"; // Removed formatCents as it's not used
import { CATEGORIES, CategoryKey } from "./lib/categories";

// ... imports
// Removed import { SmartReportModal } from "./components/SmartReportModal";

export default function Dashboard() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed const [showReport, setShowReport] = useState(false);
  const router = useRouter(); // Initialized useRouter

  useEffect(() => {
    Promise.all([
      apiGet<AnalysisData>("/api/analysis"),
      apiGet<Subscription[]>("/api/subscriptions")
    ])
      .then(([analysisData, subsData]) => {
        setData(analysisData);
        setSubs(Array.isArray(subsData) ? subsData : []);
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data", error);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calculated values
  const healthScore = data ? Math.min(Math.round((data.cashFlow.savingsRate || 0) * 2 + 50), 100) : 65;
  const healthLabel = healthScore >= 80 ? "Excelente" : healthScore >= 60 ? "Buena" : "Regular";

  const totalBalance = data?.overview.totalBalance ?? 0;
  const estimatedSavings = (data?.cashFlow.totalIncome ?? 0) - (data?.cashFlow.totalExpenses ?? 0);

  // Budget Progress
  const income = data?.cashFlow.totalIncome ?? 0;
  const expenses = data?.cashFlow.totalExpenses ?? 0;
  const budgetProgress = income > 0 ? (expenses / income) * 100 : 0;

  // Category Mix
  const categoryData = data?.categoryBreakdown.map(c => ({
    name: c.label,
    value: c.total,
    color: c.color
  })) || [];

  // Top 3 Categories for Budget Card
  const topCategories = data?.categoryBreakdown.slice(0, 3) || [];

  // Upcoming Subscriptions (sorted by next date)
  const upcomingSubs = subs
    .filter(s => s.active)
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
    .slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Removed SmartReportModal component */}

      {/* ═ ROW 1: Health Score & Main Stats ═ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Health Score (Left - Wide) */}
        <div className="lg:col-span-8 bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700/50 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                <BrainCircuit size={12} /> AI Analysis
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Salud {healthLabel}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md leading-relaxed">
                Tus hábitos financieros se ven muy bien. Has mantenido un ritmo de ahorro del {data?.cashFlow.savingsRate ?? 0}% este mes.
              </p>
              <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                <button
                  onClick={() => router.push("/reporte")} // Changed to navigate to /reporte
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  Ver Reporte
                </button>
                <Link href="/metas" className="px-6 py-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-600 transition-all">
                  Editar Metas
                </Link>
              </div>
            </div>

            {/* Gauge */}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90">
                {/* Background Track */}
                <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="12" className="dark:stroke-slate-700" />
                {/* Progress */}
                <motion.circle
                  cx="80" cy="80" r="70" fill="none" stroke="#2563eb" strokeWidth="12"
                  strokeDasharray="439.8"
                  initial={{ strokeDashoffset: 439.8 }}
                  animate={{ strokeDashoffset: 439.8 * (1 - healthScore / 100) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{healthScore}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Balance & Savings */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Balance Card */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute right-4 top-4 p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <span className="text-xs font-bold">+2.5%</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4 text-2xl">
              <span className="material-icons-round">account_balance</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Balance Total</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalBalance)}</h3>
          </div>

          {/* Savings Card */}
          <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-6 shadow-sm flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mb-4 text-2xl">
              <span className="material-icons-round">savings</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ahorro Est. (Mes)</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              {estimationSign(estimatedSavings)}{formatCurrency(Math.abs(estimatedSavings))}
            </h3>
            <p className="text-[10px] text-slate-400 mt-2">Basado en tu flujo actual</p>
          </div>
        </div>
      </div>

      {/* ═ ROW 2: Budget & Mix ═ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Budget Progress (Left) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Presupuesto Mensual</h3>
              <p className="text-sm text-slate-500 mt-1">Has gastado {Math.round(budgetProgress)}% de tus ingresos</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal /></button>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
            <span className="text-slate-900 dark:text-white">{formatCurrency(expenses)} Gastado</span>
            <span>{formatCurrency(income)} Ingreso</span>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
              className={`h-full rounded-full ${budgetProgress > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
            />
          </div>

          {/* Top Categories Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCategories.map(cat => (
              <div key={cat.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{cat.label}</span>
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(cat.total)}</p>
                <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full mt-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Mix (Donut) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Mix de Gastos</h3>

          <div className="relative flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(expenses)}</span>
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-4 px-2">
            {/* Legend (Simplified) */}
            {categoryData.slice(0, 3).map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═ ROW 3: Upcoming Payments ═ */}
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Próximos Pagos</h3>
          <Link href="/calendario" className="text-sm font-bold text-blue-600 hover:text-blue-700">Ver Calendario</Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
          {upcomingSubs.length === 0 && (
            <p className="text-slate-400 text-sm">No hay pagos próximos registrados.</p>
          )}
          {upcomingSubs.map(sub => {
            const daysUntil = Math.ceil((new Date(sub.nextDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            const isToday = daysUntil === 0;
            return (
              <div key={sub.id} className="min-w-[200px] bg-slate-50 dark:bg-slate-700/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 snap-start flex flex-col justify-between h-[140px] group hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${sub.color ? '' : 'bg-white'}`} style={sub.color ? { background: `${sub.color}20`, color: sub.color } : {}}>
                    {sub.icon ? <span className="material-icons-round">{sub.icon}</span> : <Wallet size={20} />}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${isToday ? 'bg-red-100 text-red-600' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>
                    {isToday ? 'Hoy' : `En ${daysUntil} días`}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate">{sub.name}</p>
                  <p className="text-xs text-slate-500">{CATEGORIES[sub.category as CategoryKey]?.label || sub.category}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg text-slate-900 dark:text-white">{formatCurrency(sub.amount || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═ Add Button Block ═ */}
      <div className="flex justify-center pt-4">
        <Link href="/transacciones?new=true" className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-bold shadow-xl hover:scale-105 transition-transform">
          <Plus size={18} /> Registrar Movimiento Rápido
        </Link>
      </div>

    </div>
  );
}

function estimationSign(val: number) {
  if (val > 0) return "+";
  if (val < 0) return "-";
  return "";
}
