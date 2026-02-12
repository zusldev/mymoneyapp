import { Subscription, TransactionAnomaly } from "./types";
import { nextOccurrence } from "./dates";

export type NotificationType = "bill_due" | "anomaly" | "budget_alert" | "insight";
export type NotificationSeverity = "info" | "warning" | "danger";

export interface AppNotification {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    message: string;
    date: string; // ISO date
    actionUrl?: string;
    read: boolean;
}

import { Recommendation } from "./financialEngine";

export function checkNotifications(data: {
    subscriptions: Subscription[];
    anomalies: TransactionAnomaly[];
    recommendations: Recommendation[];
}): AppNotification[] {
    const notifications: AppNotification[] = [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // 1. Check Subscriptions (Bill Reminders)
    // Look for bills due in the next 3 days
    data.subscriptions.forEach((sub) => {
        if (!sub.active) return;

        // We assume sub.nextDate is valid, but let's recalculate next occurrence just in case
        // or rely on the engine's nextDate if it's up to date. 
        // For safety, let's compare the stored nextDate.
        const dueDate = new Date(sub.nextDate);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 3) {
            notifications.push({
                id: `bill-${sub.id}-${today}`,
                type: "bill_due",
                severity: "warning",
                title: "Pago Próximo",
                message: `${sub.name} vence ${diffDays === 0 ? "hoy" : diffDays === 1 ? "mañana" : `en ${diffDays} días`}`,
                date: today,
                actionUrl: `/suscripciones`,
                read: false,
            });
        }
    });

    // 2. Check Anomalies
    // We assume anomalies are fresh from the engine
    data.anomalies.forEach((anomaly) => {
        notifications.push({
            id: `anomaly-${anomaly.txId}-${today}`,
            type: "anomaly",
            severity: anomaly.severity,
            title: "Alerta de Transacción",
            message: anomaly.label,
            date: today,
            actionUrl: `/transacciones?highlight=${anomaly.txId}`,
            read: false,
        });
    });

    // 3. Check Recommendations (AI Insights)
    if (data.recommendations) {
        data.recommendations.forEach((rec) => {
            notifications.push({
                id: `insight-${rec.category}-${today}`,
                type: "insight",
                severity: "info",
                title: rec.title,
                message: rec.description,
                date: today,
                actionUrl: rec.category === "pago" ? "/tarjetas" : "/asistente",
                read: false,
            });
        });
    }

    return notifications;
}
