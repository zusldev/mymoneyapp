"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Repeat,
  Sparkles,
  Loader2,
  PiggyBank,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "./lib/financialEngine";
import { DoughnutChart, BarChart } from "./components/Charts";
import { CATEGORIES } from "./lib/categories";

interface AnalysisData {
  overview: {
    totalBalance: number;
    totalDebt: number;
    netWorth: number;
    accountCount: number;
    cardCount: number;
  };
  cashFlow: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
    isDeficit: boolean;
  };
  categoryBreakdown: {
    category: string;
    label: string;
    color: string;
    total: number;
    percentage: number;
    count: number;
  }[];
  creditCards: {
    id: string;
    name: string;
    utilization: number;
    riskLevel: string;
    minimumPayment: number;
    noInterestPayment: number;
    availableCredit: number;
    impactDescription: string;
  }[];
  projection: {
    projectedBalance: number;
    liquidityDays: number;
    overdraftRisk: boolean;
    dailyBurnRate: number;
    daysRemaining: number;
  };
  anomalies: {
    type: string;
    severity: string;
    description: string;
    amount?: number;
  }[];
  recommendations: {
    priority: number;
    category: string;
    title: string;
    description: string;
    impact: string;
  }[];
  subscriptions: { count: number; monthlyTotal: number };
  income: { expectedMonthly: number };
  goals: {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    color: string;
    deadline: string;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    merchant: string;
    category: string;
    date: string;
  }[];
}

export default function Dashboard() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analysis")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-muted text-sm">Analizando tus finanzas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">Error al cargar datos</p>
      </div>
    );
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Hola 👋
          </h1>
          <p className="text-muted mt-1">
            Resumen financiero de <span className="text-accent font-medium">{currentMonth}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl">
          <Sparkles className="w-4 h-4 text-amber" />
          <span className="text-sm text-muted-light">
            {data.anomalies.length > 0
              ? `${data.anomalies.length} alerta${data.anomalies.length > 1 ? "s" : ""}`
              : "Todo en orden"}
          </span>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Balance Total"
          value={formatCurrency(data.overview.totalBalance)}
          icon={<Wallet className="w-5 h-5" />}
          color="cyan"
          subtitle={`${data.overview.accountCount} cuenta${data.overview.accountCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(data.cashFlow.totalIncome)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
          subtitle={data.cashFlow.savingsRate > 0 ? `${data.cashFlow.savingsRate}% ahorro` : ""}
        />
        <StatCard
          label="Gastos del Mes"
          value={formatCurrency(data.cashFlow.totalExpenses)}
          icon={<TrendingDown className="w-5 h-5" />}
          color="rose"
          subtitle={`${formatCurrency(data.projection.dailyBurnRate)}/día`}
        />
        <StatCard
          label="Deuda Total"
          value={formatCurrency(data.overview.totalDebt)}
          icon={<CreditCard className="w-5 h-5" />}
          color="purple"
          subtitle={`${data.overview.cardCount} tarjeta${data.overview.cardCount !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Net Worth Banner */}
      <div className={`glass-card rounded-2xl p-6 ${data.overview.netWorth >= 0 ? "glow-cyan" : "glow-rose"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Patrimonio Neto</p>
            <p className={`text-3xl font-bold tabular-nums ${data.overview.netWorth >= 0 ? "text-cyan" : "text-rose"}`}>
              {formatCurrency(data.overview.netWorth)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${data.overview.netWorth >= 0 ? "bg-cyan-glow" : "bg-rose-glow"}`}>
            <PiggyBank className={`w-8 h-8 ${data.overview.netWorth >= 0 ? "text-cyan" : "text-rose"}`} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Gastos por Categoría</h3>
          {data.categoryBreakdown.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="chart-container-square">
                <DoughnutChart data={data.categoryBreakdown} />
              </div>
              <div className="flex-1 space-y-2 w-full">
                {data.categoryBreakdown.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-muted-light">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-medium tabular-nums">{formatCurrency(cat.total)}</span>
                      <span className="text-muted text-xs w-10 text-right">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">Agrega transacciones para ver el análisis</p>
          )}
        </div>

        {/* Cash Flow Bar */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Flujo de Efectivo</h3>
          {data.cashFlow.totalIncome > 0 || data.cashFlow.totalExpenses > 0 ? (
            <div>
              <BarChart income={data.cashFlow.totalIncome} expenses={data.cashFlow.totalExpenses} />
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">Balance neto</span>
                <span className={`font-semibold tabular-nums ${data.cashFlow.isDeficit ? "text-rose" : "text-cyan"}`}>
                  {data.cashFlow.isDeficit ? "" : "+"}{formatCurrency(data.cashFlow.netBalance)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">Sin movimientos este mes</p>
          )}
        </div>
      </div>

      {/* Credit Cards & Projection Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Cards */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple" />
            Tarjetas de Crédito
          </h3>
          {data.creditCards.length > 0 ? (
            <div className="space-y-4">
              {data.creditCards.map((card) => (
                <div key={card.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{card.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.riskLevel === "bajo" ? "bg-green-500/10 text-green-400" :
                        card.riskLevel === "medio" ? "bg-amber/10 text-amber" :
                          card.riskLevel === "alto" ? "bg-orange-500/10 text-orange-400" :
                            "bg-rose/10 text-rose"
                      }`}>
                      {card.utilization.toFixed(0)}% usado
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(card.utilization, 100)}%`,
                        background: card.utilization <= 30 ? "#06d6a0" :
                          card.utilization <= 50 ? "#fbbf24" :
                            card.utilization <= 75 ? "#f97316" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted">{card.impactDescription}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">No hay tarjetas registradas</p>
          )}
        </div>

        {/* Monthly Projection */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-accent" />
            Proyección del Mes
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Balance proyectado al cierre</span>
              <span className={`text-lg font-bold tabular-nums ${data.projection.projectedBalance >= 0 ? "text-cyan" : "text-rose"}`}>
                {formatCurrency(data.projection.projectedBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Días de liquidez</span>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {data.projection.liquidityDays > 365 ? "∞" : data.projection.liquidityDays}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Gasto diario promedio</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatCurrency(data.projection.dailyBurnRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Días restantes</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {data.projection.daysRemaining}
              </span>
            </div>
            {data.projection.overdraftRisk && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose/10 border border-rose/20">
                <ShieldAlert className="w-5 h-5 text-rose shrink-0" />
                <span className="text-sm text-rose">Riesgo de sobregiro detectado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goals & Subscriptions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Goals */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan" />
            Metas Financieras
          </h3>
          {data.goals.length > 0 ? (
            <div className="space-y-4">
              {data.goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{goal.name}</span>
                    <span className="text-xs text-muted">{goal.progress.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(goal.progress, 100)}%`,
                        background: goal.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm text-center py-8">Define metas para rastrear tu progreso</p>
          )}
        </div>

        {/* Subscriptions Summary */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-amber" />
            Suscripciones
          </h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {formatCurrency(data.subscriptions.monthlyTotal)}
              </p>
              <p className="text-xs text-muted">costo mensual total</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">{data.subscriptions.count}</p>
              <p className="text-xs text-muted">activas</p>
            </div>
          </div>
          {data.subscriptions.monthlyTotal > 0 && (
            <div className="p-3 rounded-xl bg-amber-glow border border-amber/10">
              <p className="text-xs text-amber">
                💡 Esto representa {formatCurrency(data.subscriptions.monthlyTotal * 12)} al año
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies & Recommendations */}
      {(data.anomalies.length > 0 || data.recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Anomalies */}
          {data.anomalies.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber" />
                Alertas
              </h3>
              <div className="space-y-3">
                {data.anomalies.map((anomaly, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${anomaly.severity === "danger" ? "bg-rose/5 border-rose/20" :
                        anomaly.severity === "warning" ? "bg-amber/5 border-amber/20" :
                          "bg-accent/5 border-accent/20"
                      }`}
                  >
                    <p className={`text-sm ${anomaly.severity === "danger" ? "text-rose" :
                        anomaly.severity === "warning" ? "text-amber" :
                          "text-accent"
                      }`}>
                      {anomaly.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Recomendaciones
              </h3>
              <div className="space-y-3">
                {data.recommendations.slice(0, 4).map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-hover border border-border">
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <p className="text-xs text-muted mt-1">{rec.description}</p>
                    <p className="text-xs text-accent mt-1">💡 {rec.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Últimas Transacciones</h3>
        {data.recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {data.recentTransactions.map((tx) => {
              const catInfo = CATEGORIES[tx.category as keyof typeof CATEGORIES] || CATEGORIES.otros;
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm"
                      style={{ backgroundColor: catInfo.color + "15", color: catInfo.color }}
                    >
                      {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {tx.merchant || catInfo.label}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(tx.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-cyan" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-8">
            Aún no hay transacciones. ¡Agrega tu primera transacción para empezar!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Stat Card Component ───
function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "cyan" | "green" | "rose" | "purple" | "amber";
  subtitle?: string;
}) {
  const colorMap = {
    cyan: { bg: "bg-cyan-glow", text: "text-cyan", glow: "glow-cyan" },
    green: { bg: "bg-green-500/10", text: "text-green-400", glow: "" },
    rose: { bg: "bg-rose-glow", text: "text-rose", glow: "glow-rose" },
    purple: { bg: "bg-purple-glow", text: "text-purple", glow: "glow-purple" },
    amber: { bg: "bg-amber-glow", text: "text-amber", glow: "glow-amber" },
  };
  const c = colorMap[color];

  return (
    <div className={`glass-card rounded-2xl p-5 ${c.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted">{label}</span>
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
    </div>
  );
}
