"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, CreditCard, ShoppingCart, TrendingUp, HelpCircle } from "lucide-react";

interface Message { id: string; role: string; content: string; createdAt: string; }

const quickActions = [
    { label: "¿Puedo gastar $500 hoy?", icon: ShoppingCart },
    { label: "¿Qué tarjeta pago primero?", icon: CreditCard },
    { label: "¿Cómo puedo ahorrar más?", icon: TrendingUp },
    { label: "Hazme un resumen financiero", icon: HelpCircle },
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

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, createdAt: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
            const data = await res.json();
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: data.message || data.error, createdAt: new Date().toISOString() };
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Error al conectar con el asistente.", createdAt: new Date().toISOString() }]);
        }
        setLoading(false);
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

    if (loadingHistory) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>;

    return (
        <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-48px)]">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-foreground">MyMoney AI</h1>
                    <p className="text-xs text-muted">Tu CFO personal con inteligencia artificial</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <Bot className="w-16 h-16 text-accent/30 mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">¡Hola! Soy tu CFO personal 🤖</h2>
                        <p className="text-sm text-muted mb-6 max-w-md">Puedo analizar tus finanzas, responder preguntas y darte recomendaciones personalizadas basadas en tus datos reales.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {quickActions.map((action, i) => {
                                const Icon = action.icon;
                                return (
                                    <button key={i} onClick={() => sendMessage(action.label)}
                                        className="glass-card rounded-xl p-4 text-left hover:bg-surface-hover transition-all group">
                                        <Icon className="w-5 h-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                                        <p className="text-sm text-muted-light">{action.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
                        {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-accent/20 text-foreground rounded-br-md"
                                : "glass-card text-foreground rounded-bl-md"
                            }`}>
                            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                                __html: msg.content
                                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                    .replace(/\n/g, "<br>")
                            }} />
                            <p className="text-[10px] text-muted mt-2">
                                {new Date(msg.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 mt-1">
                                <User className="w-4 h-4 text-muted" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                                <span className="text-sm text-muted">Analizando...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-border/50">
                <input
                    className="input-field flex-1"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Pregúntale a tu CFO..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !input.trim()}
                    className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
