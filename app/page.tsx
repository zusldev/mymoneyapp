"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "./lib/financialEngine";
import { CATEGORIES } from "./lib/categories";
import type { AnalysisData } from "./lib/types";

// Subscription type for upcoming payments
interface UpcomingSub {
  id: string;
  name: string;
  amount: number;
  category: string;
  nextDate: string;
  color: string;
  active?: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [subs, setSubs] = useState<UpcomingSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/analysis").then((r) => r.json()),
      fetch("/api/subscriptions").then((r) => r.json()),
    ])
      .then(([analysisData, subsData]) => {
        setData(analysisData);
        setSubs(Array.isArray(subsData) ? subsData : []);
        setNow(Date.now());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Analizando tus finanzas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Error al cargar datos</p>
      </div>
    );
  }

  // Compute health score (0-100) based on savings rate, debt ratio, goals progress
  const savingsScore = Math.min(data.cashFlow.savingsRate * 2, 40); // max 40 pts
  const debtScore = data.overview.totalBalance > 0
    ? Math.max(0, 30 - (data.overview.totalDebt / data.overview.totalBalance) * 30)
    : 15; // max 30 pts
  const goalsScore = data.goals.length > 0
    ? (data.goals.reduce((sum, g) => sum + g.progress, 0) / data.goals.length) * 0.3
    : 15; // max 30 pts
  const healthScore = Math.round(Math.min(savingsScore + debtScore + goalsScore, 100));
  const healthLabel = healthScore >= 80 ? "Excelente" : healthScore >= 60 ? "Buena" : healthScore >= 40 ? "Regular" : "Necesita Atención";

  // Budget data — income as limit, expenses as spent
  const budgetLimit = data.cashFlow.totalIncome || 1;
  const budgetSpent = data.cashFlow.totalExpenses;
  const budgetPct = Math.min((budgetSpent / budgetLimit) * 100, 100);

  // Top 3 categories for budget breakdown
  const topCats = data.categoryBreakdown.slice(0, 3);

  // Spending mix for donut — group into Needs/Wants/Savings
  const needsCats = ["hogar", "supermercado", "servicios", "salud", "transporte"];
  const wantsCats = ["comida", "entretenimiento", "compras", "viajes", "suscripciones"];
  const totalExpenses = data.cashFlow.totalExpenses || 1;

  const needsTotal = data.categoryBreakdown
    .filter((c) => needsCats.includes(c.category))
    .reduce((s, c) => s + c.total, 0);
  const wantsTotal = data.categoryBreakdown
    .filter((c) => wantsCats.includes(c.category))
    .reduce((s, c) => s + c.total, 0);
  const savingsTotal = Math.max(0, data.cashFlow.netBalance);

  const needsPct = Math.round((needsTotal / (needsTotal + wantsTotal + savingsTotal || 1)) * 100);
  const wantsPct = Math.round((wantsTotal / (needsTotal + wantsTotal + savingsTotal || 1)) * 100);
  const savingsPct = 100 - needsPct - wantsPct;

  // Savings change indicator
  const savingsChange = data.cashFlow.savingsRate > 0 ? `+${data.cashFlow.savingsRate}%` : `${data.cashFlow.savingsRate}%`;

  // Upcoming payments from subscriptions sorted by date
  const upcomingPayments = [...subs]
    .filter((s) => s.active !== false)
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
    .slice(0, 6);

  // Category icons
  const getCatIcon = (category: string) => {
    const map: Record<string, string> = {
      hogar: "home", comida: "restaurant", supermercado: "shopping_cart",
      transporte: "directions_car", entretenimiento: "movie", salud: "fitness_center",
      servicios: "bolt", compras: "shopping_bag", educacion: "school",
      viajes: "flight", suscripciones: "sync", otros: "more_horiz",
    };
    return map[category] || "payments";
  };

  // Days until
  const daysUntil = (dateStr: string) => {
    if (!now) return "";
    const diff = Math.ceil((new Date(dateStr).getTime() - now) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Hoy";
    if (diff === 1) return "Mañana";
    if (diff <= 7) return `En ${diff} días`;
    return new Date(dateStr).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-8 stagger-children">
      {/* ═══ Blue ambient — Dashboard identity ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-20 right-10 w-[420px] h-[420px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #2badee, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(circle, #2badee, transparent 70%)' }} />
      </div>

      {/* ═══ Top Row: Hero Card & Key Metrics ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Glassmorphic Hero Card: Health Score */}
        <div className="lg:col-span-8 liquid-glass-cyan liquid-shimmer-edge rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group liquid-settle">
          {/* Decorative blob */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#2badee]/10 rounded-full blur-3xl group-hover:bg-[#2badee]/20 transition-all duration-500" />

          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#2badee]/10 text-[#2badee] text-xs font-bold uppercase tracking-wider">
                AI Analysis
              </span>
              <span className="text-xs text-slate-400">Actualizado ahora</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              Salud {healthLabel}
            </h2>
            <p className="text-slate-500 dark:text-slate-300 mb-6 max-w-md">
              {data.cashFlow.savingsRate > 0 ? (
                <>Tus hábitos financieros se ven muy bien. Has reducido gastos discrecionales en <span className="text-[#34d399] font-medium">{data.cashFlow.savingsRate}%</span> comparado con tus ingresos.</>
              ) : (
                <>Tus gastos superan tus ingresos este mes. Revisa tus categorías de gasto para encontrar oportunidades de ahorro.</>
              )}
            </p>
            <div className="flex gap-3">
              <button className="btn-primary">Ver Reporte Completo</button>
              <button className="btn-secondary">Editar Metas</button>
            </div>
          </div>

          {/* Score Gauge */}
          <div className="relative w-40 h-40 flex-shrink-0 control-pulse">
            <div className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-slate-700/50" />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#2badee, #34d399 ${healthScore}%, transparent ${healthScore}%)`,
                mask: "radial-gradient(transparent 62%, black 63%)",
                WebkitMask: "radial-gradient(transparent 62%, black 63%)",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-800 dark:text-white">{healthScore}</span>
              <span className="text-xs text-slate-400 font-medium uppercase mt-1">Score</span>
            </div>
          </div>
        </div>

        {/* Right Column: Balance & Savings */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Balance Card */}
          <div className="liquid-card liquid-card-hover rounded-xl p-5 md:p-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-[#e0f2fe] dark:bg-[#2badee]/20 rounded-lg text-[#2badee]">
                <span className="material-icons-round text-xl">account_balance</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${data.cashFlow.savingsRate >= 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                {savingsChange}
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Balance Total</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">
              {formatCurrency(data.overview.totalBalance)}
            </h3>
          </div>

          {/* Est Savings Card */}
          <div className="liquid-card liquid-card-hover rounded-xl p-5 md:p-6 flex-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 text-[#2badee] pointer-events-none transform translate-x-2 translate-y-2">
              <span className="material-icons-round text-8xl">trending_up</span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-500">
                <span className="material-icons-round text-xl">savings</span>
              </div>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ahorro Est. (Mes)</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">
              {data.cashFlow.netBalance >= 0 ? "+" : ""}{formatCurrency(data.cashFlow.netBalance)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">Basado en la trayectoria actual</p>
          </div>
        </div>
      </div>

      {/* ═══ Middle Row: Budget & Spending Mix ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Budget (2 cols) */}
        <div className="lg:col-span-2 liquid-card rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Presupuesto Mensual</h3>
              <p className="text-sm text-slate-500">Has gastado {budgetPct.toFixed(0)}% de tus ingresos</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-[#2badee] transition-colors">
              <span className="material-icons-round">more_horiz</span>
            </button>
          </div>

          {/* Main Budget Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-slate-700 dark:text-slate-200">{formatCurrency(budgetSpent)} Gastado</span>
              <span className="text-slate-500">{formatCurrency(budgetLimit)} Ingreso</span>
            </div>
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2badee] rounded-full transition-all duration-1000"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topCats.map((cat) => (
              <div key={cat.category} className="p-4 rounded-lg liquid-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-semibold text-slate-500 uppercase">{cat.label}</span>
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">
                  {formatCurrency(cat.total)}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart — Spending Mix */}
        <div className="lg:col-span-1 liquid-card rounded-xl p-5 md:p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Mix de Gastos</h3>
          <div className="flex-1 flex items-center justify-center relative">
            {/* CSS Donut Chart */}
            <div
              className="relative w-48 h-48 rounded-full"
              style={{
                background: `conic-gradient(#3b82f6 0% ${needsPct}%, #a855f7 ${needsPct}% ${needsPct + wantsPct}%, #fbbf24 ${needsPct + wantsPct}% ${needsPct + wantsPct + savingsPct}%, #cbd5e1 ${needsPct + wantsPct + savingsPct}% 100%)`,
              }}
            >
              <div className="absolute inset-4 bg-white dark:bg-[#1a262d] rounded-full flex items-center justify-center flex-col shadow-inner">
                <span className="text-xs text-slate-400 font-medium uppercase">Total</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-300">Necesidades</span>
              </div>
              <span className="font-medium">{needsPct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-600 dark:text-slate-300">Deseos</span>
              </div>
              <span className="font-medium">{wantsPct}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-600 dark:text-slate-300">Ahorro</span>
              </div>
              <span className="font-medium">{savingsPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Bottom Row: Upcoming Payments ═══ */}
      {upcomingPayments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Próximos Pagos</h3>
            <a className="text-sm text-[#2badee] hover:text-[#1a8cb5] font-medium" href="/suscripciones">
              Ver Calendario
            </a>
          </div>

          {/* Horizontal Scroller */}
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
            {upcomingPayments.map((sub) => {
              const catIcon = getCatIcon(sub.category);
              const daysLabel = daysUntil(sub.nextDate);
              const isUrgent = daysLabel === "Hoy" || daysLabel === "Mañana";
              const catInfo = CATEGORIES[sub.category as keyof typeof CATEGORIES] || CATEGORIES.otros;

              return (
                <div
                  key={sub.id}
                  className="snap-start min-w-[260px] md:min-w-[280px] liquid-card liquid-card-hover rounded-xl p-4 md:p-5 group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: catInfo.color + "15", color: catInfo.color }}
                    >
                      <span className="material-icons-round">{catIcon}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isUrgent
                      ? "text-[#2badee] bg-[#2badee]/10"
                      : "text-slate-400 bg-slate-100 dark:bg-slate-800"
                      }`}>
                      {daysLabel}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{sub.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-slate-500">{catInfo.label}</p>
                    <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                      {formatCurrency(sub.amount)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Add New Button */}
            <div className="snap-start min-w-[100px] flex items-center justify-center">
              <a
                href="/suscripciones"
                className="h-12 w-12 rounded-full border-2 border-dashed border-slate-300 hover:border-[#2badee] text-slate-400 hover:text-[#2badee] transition-colors flex items-center justify-center"
              >
                <span className="material-icons-round">add</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
