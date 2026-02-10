"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage as Message } from "../lib/types";

const quickActions = [
    { label: "¿Puedo gastar $500 hoy?", icon: "shopping_cart" },
    { label: "¿Qué tarjeta pago primero?", icon: "credit_card" },
    { label: "¿Cómo puedo ahorrar más?", icon: "trending_up" },
    { label: "Hazme un resumen financiero", icon: "help_outline" },
];

export default function AsistentePage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/chat").then(r => r.json()).then(setMessages).finally(() => setLoadingHistory(false));
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Message = { id: new Date().getTime().toString(), role: "user", content: text, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
            const data = await res.json();
            if (data.error) {
                setMessages(prev => [...prev, { id: (new Date().getTime() + 1).toString(), role: "assistant", content: `⚠️ ${data.error}`, createdAt: new Date().toISOString() }]);
            } else {
                const aiMsg: Message = { id: (new Date().getTime() + 1).toString(), role: "assistant", content: data.message, createdAt: new Date().toISOString() };
                setMessages(prev => [...prev, aiMsg]);
            }
        } catch {
            setMessages(prev => [...prev, { id: (new Date().getTime() + 1).toString(), role: "assistant", content: "Error al conectar con el asistente.", createdAt: new Date().toISOString() }]);
        }
        setLoading(false);
    }, [loading]);

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

    if (loadingHistory) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="h-10 w-10 border-4 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-80px)] max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2badee] to-purple-500 flex items-center justify-center shadow-md shadow-[#2badee]/20">
                    <span className="material-icons-round text-white text-xl">auto_awesome</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">MyMoney AI</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tu CFO personal con inteligencia artificial</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 hide-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up">
                        <div className="w-16 h-16 rounded-2xl bg-[#2badee]/10 flex items-center justify-center mb-4">
                            <span className="material-icons-round text-3xl text-[#2badee]/40">smart_toy</span>
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">¡Hola! Soy tu CFO personal 🤖</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">Puedo analizar tus finanzas, responder preguntas y darte recomendaciones personalizadas basadas en tus datos reales.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg stagger-children">
                            {quickActions.map((action, i) => (
                                <button key={i} onClick={() => sendMessage(action.label)}
                                    className="bg-white dark:bg-[#1a262d] rounded-xl p-4 text-left border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-[#2badee]/30 transition-all group">
                                    <span className="material-icons-round text-[#2badee] mb-2 group-hover:scale-110 transition-transform inline-block">{action.icon}</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{action.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2badee] to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                <span className="material-icons-round text-white text-sm">smart_toy</span>
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                            ? "bg-[#2badee] text-white rounded-br-md shadow-md shadow-[#2badee]/20"
                            : "bg-white dark:bg-[#1a262d] text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-md shadow-sm"
                            }`}>
                            <div className="whitespace-pre-wrap">
                                {msg.content.split(/(\*\*.*?\*\*)/g).map((part, pi) =>
                                    part.startsWith('**') && part.endsWith('**')
                                        ? <strong key={pi}>{part.slice(2, -2)}</strong>
                                        : <span key={pi}>{part}</span>
                                )}
                            </div>
                            <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-white/60" : "text-slate-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                                <span className="material-icons-round text-slate-500 text-sm">person</span>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2badee] to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                            <span className="material-icons-round text-white text-sm">smart_toy</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a262d] border border-slate-100 dark:border-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-[#2badee]/30 border-t-[#2badee] rounded-full animate-spin" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">Analizando...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <input
                    className="input-field flex-1"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregúntale a tu CFO..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}
                    className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <span className="material-icons-round text-lg">send</span>
                </button>
            </form>
        </div>
    );
}
