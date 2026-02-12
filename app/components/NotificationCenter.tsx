"use client";

import { useNotifications } from "../context/NotificationContext";
import NextLink from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, Info, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";

export function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getIcon = (type: string, severity: string) => {
        if (type === "insight") return <Sparkles size={18} className="text-purple-500" />;
        if (severity === "danger") return <AlertCircle size={18} className="text-red-500" />;
        if (severity === "warning") return <AlertTriangle size={18} className="text-amber-500" />;
        return <Info size={18} className="text-blue-500" />;
    };

    const getBgColor = (read: boolean) => {
        return read ? "bg-transparent" : "bg-blue-50/50 dark:bg-blue-900/10";
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none focus:ring-2 focus:ring-[#2badee]/50"
                aria-label="Notificaciones"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-[#2badee] hover:text-blue-600 transition-colors flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Marcar leídas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-3">
                                    <Bell size={32} className="opacity-20" />
                                    <p className="text-sm">No tienes notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {notifications.sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1)).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group relative ${getBgColor(notification.read)}`}
                                        >
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="absolute top-4 right-4 text-slate-300 hover:text-[#2badee] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Marcar como leída"
                                                >
                                                    <div className="h-2 w-2 bg-[#2badee] rounded-full" />
                                                </button>
                                            )}

                                            <NextLink
                                                href={notification.actionUrl || "#"}
                                                onClick={() => markAsRead(notification.id)}
                                                className="flex gap-4"
                                            >
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notification.type, notification.severity)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className={`text-sm font-medium ${notification.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {notification.date}
                                                    </p>
                                                </div>
                                            </NextLink>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
