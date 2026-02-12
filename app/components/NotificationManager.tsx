"use client";

import { useEffect, useRef } from "react";
import { checkNotifications, AppNotification } from "../lib/notifications";
import { toastInfo, toastError } from "../lib/toast";
import { apiGet } from "../lib/api";
import { subscriptionArraySchema, transactionArraySchema } from "../lib/schemas";
import { detectAnomalies } from "../lib/financialEngine";
import type { Subscription, Transaction, TransactionAnomaly } from "../lib/types";

const CHECK_INTERVAL_MS = 1000 * 60 * 60; // Check every hour
const STORAGE_KEY = "mymoney_notifications_seen";

export function NotificationManager() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const runCheck = async () => {
            try {
                // Fetch necessary data
                // In a real app, this might come from a global store or context to avoid redundant fetches
                const [subs, txs] = await Promise.all([
                    apiGet("/api/subscriptions", subscriptionArraySchema).catch(() => []),
                    apiGet("/api/transactions?limit=100", transactionArraySchema).catch(() => [])
                ]);

                const subscriptions = Array.isArray(subs) ? subs as Subscription[] : [];
                const transactions = Array.isArray(txs) ? txs as Transaction[] : [];

                // Calculate anomalies on the fly
                // We map Transaction to the format detectAnomalies expects
                const anomalies: TransactionAnomaly[] = detectAnomalies(transactions.map(t => ({
                    id: t.id,
                    amountCents: t.amountCents ?? 0,
                    amount: t.amount,
                    merchant: t.merchant,
                    date: t.date,
                    category: t.category,
                    isFeeOrInterest: t.isFeeOrInterest
                }))).map(a => ({
                    txId: a.relatedIds?.[0] || "unknown",
                    type: a.type,
                    label: a.description,
                    severity: a.severity
                }));

                const alerts = checkNotifications({ subscriptions, anomalies, recommendations: [] });

                // Filter out already seen notifications
                const seenIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
                const newAlerts = alerts.filter(n => !seenIds.includes(n.id));

                // Show toasts
                newAlerts.forEach(n => {
                    if (n.severity === "danger" || n.severity === "warning") {
                        toastError(`${n.title}: ${n.message}`, 6000);
                    } else {
                        toastInfo(`${n.title}: ${n.message}`, 5000);
                    }
                    seenIds.push(n.id);
                });

                // Save seen IDs (limit to last 100 to avoid bloat)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(seenIds.slice(-100)));

            } catch (err) {
                console.error("Failed to check notifications", err);
            }
        };

        // Run immediately on mount
        runCheck();

        // Set interval
        const interval = setInterval(runCheck, CHECK_INTERVAL_MS);
        return () => clearInterval(interval);

    }, []);

    return null; // Renderless component
}
