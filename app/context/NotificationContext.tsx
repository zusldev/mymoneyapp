"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { AppNotification, checkNotifications } from "../lib/notifications";
import { apiGet } from "../lib/api";
import { subscriptionArraySchema, transactionArraySchema } from "../lib/schemas";
import { detectAnomalies, generateRecommendations, calculateCashFlow, analyzeCreditCard, projectEndOfMonth, analyzeByCategory } from "../lib/financialEngine";
import type { Subscription, Transaction } from "../lib/types";
import { toastError, toastInfo } from "../lib/toast";

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const initialized = useRef(false);
    const STORAGE_KEY = "mymoney_notifications_read_v2"; // Changed key to reset legacy state if any

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        // Persist read status
        const readIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
        if (!readIds.includes(id)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds, id]));
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        const allIds = notifications.map(n => n.id);
        // Merge with existing
        const readIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
        const newReadIds = Array.from(new Set([...readIds, ...allIds]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const loadData = async () => {
            try {
                // Fetch data
                const [subs, txs] = await Promise.all([
                    apiGet("/api/subscriptions", subscriptionArraySchema).catch(() => []),
                    apiGet("/api/transactions?limit=100", transactionArraySchema).catch(() => [])
                ]);

                const subscriptions = Array.isArray(subs) ? subs as Subscription[] : [];
                const transactions = Array.isArray(txs) ? txs as Transaction[] : [];

                // 1. Detect Anomalies
                const anomalies = detectAnomalies(transactions.map(t => ({
                    id: t.id,
                    amountCents: t.amountCents ?? 0,
                    amount: t.amount,
                    merchant: t.merchant,
                    date: t.date,
                    category: t.category,
                    isFeeOrInterest: t.isFeeOrInterest
                })));

                // 2. Generate Recommendations (AI Insights)
                // We need more data for recommendations. Ideally we fetch full context, 
                // but for now we'll do a best-effort calculation with what we have + maybe accounts/cards if available.
                // For this implementation, we will reuse the transaction data to generate cashflow/projection

                const cashFlow = calculateCashFlow(transactions.map(t => ({
                    amountCents: t.amountCents,
                    type: t.amountCents && t.amountCents > 0 ? 'income' : 'expense' // This is a simplification, ideally transaction object has 'type'
                })));

                // Correcting type mapping for cashflow
                const typedTransactions = transactions.map(t => ({
                    ...t,
                    type: t.amountCents && t.amountCents > 0 ? "income" : "expense"
                }));

                const realCashFlow = calculateCashFlow(typedTransactions);
                const categoryBreakdown = analyzeByCategory(typedTransactions);
                // Mocking projection/cards for now as we don't have that data handy in this fetch
                // In a real scenario we'd fetch /api/accounts and /api/cards too.
                const projection = projectEndOfMonth(typedTransactions, 0);

                const recommendations = generateRecommendations({
                    cashFlow: realCashFlow,
                    categoryBreakdown,
                    creditCards: [], // We'd need to fetch cards to check utilization
                    projection,
                    anomalies
                });

                // 3. Check Notifications
                const alerts = checkNotifications({
                    subscriptions,
                    anomalies: anomalies.map(a => ({
                        txId: a.relatedIds?.[0] || "unknown",
                        type: a.type,
                        label: a.description,
                        severity: a.severity
                    })),
                    recommendations
                });

                // 4. Apply Read Status
                const readIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
                const mergedNotifications = alerts.map(n => ({
                    ...n,
                    read: readIds.includes(n.id)
                }));

                setNotifications(mergedNotifications);
                setIsLoading(false);

                // Toast only NEW high-severity alerts (not read ones)
                // We can use a separate key for "seen in toast" vs "read"
                const TOAST_KEY = "mymoney_toasts_shown";
                const shownIds = JSON.parse(localStorage.getItem(TOAST_KEY) || "[]") as string[];

                mergedNotifications.forEach(n => {
                    if (!shownIds.includes(n.id) && (n.severity === "danger" || n.severity === "warning") && !n.read) {
                        toastError(n.message);
                        shownIds.push(n.id);
                    }
                });
                localStorage.setItem(TOAST_KEY, JSON.stringify(shownIds.slice(-50)));

            } catch (error) {
                console.error("Error loading notifications:", error);
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoading }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
