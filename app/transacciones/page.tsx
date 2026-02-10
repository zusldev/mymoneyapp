"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, Filter, Loader2, Search, Trash2 } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";
import { CATEGORIES, CATEGORY_KEYS } from "../lib/categories";

interface Transaction {
    id: string;
    amount: number;
    type: string;
    date: string;
    merchant: string;
    description: string;
    category: string;
    account?: { name: string; color: string } | null;
    creditCard?: { name: string; color: string } | null;
}

interface Account { id: string; name: string; }
interface CreditCard { id: string; name: string; }

export default function TransaccionesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterType, setFilterType] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [form, setForm] = useState({
        amount: "", type: "expense", date: new Date().toISOString().split("T")[0],
        merchant: "", description: "", category: "otros", accountId: "", creditCardId: "",
    });

    const fetchData = async () => {
        const params = new URLSearchParams();
        if (filterCategory) params.set("category", filterCategory);
        if (filterType) params.set("type", filterType);
        params.set("limit", "100");

        const [txRes, accRes, cardRes] = await Promise.all([
            fetch(`/api/transactions?${params}`),
            fetch("/api/accounts"),
            fetch("/api/credit-cards"),
        ]);
        setTransactions(await txRes.json());
        setAccounts(await accRes.json());
        setCards(await cardRes.json());
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [filterCategory, filterType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...form,
                accountId: form.accountId || null,
                creditCardId: form.creditCardId || null,
            }),
        });
        setModalOpen(false);
        setForm({ amount: "", type: "expense", date: new Date().toISOString().split("T")[0], merchant: "", description: "", category: "otros", accountId: "", creditCardId: "" });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta transacción?")) return;
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        fetchData();
    };

    const filtered = transactions.filter((t) =>
        searchQuery === "" ||
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Transacciones</h1>
                    <p className="text-muted text-sm mt-1">{filtered.length} movimientos</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                        className="input-field pl-10"
                        placeholder="Buscar comercio o descripción..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="input-field w-auto"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="">Todos los tipos</option>
                    <option value="expense">Gastos</option>
                    <option value="income">Ingresos</option>
                </select>
                <select
                    className="input-field w-auto"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">Todas las categorías</option>
                    {CATEGORY_KEYS.map((key) => (
                        <option key={key} value={key}>{CATEGORIES[key].label}</option>
                    ))}
                </select>
            </div>

            {/* Transaction List */}
            <div className="glass-card rounded-2xl divide-y divide-border/30">
                {filtered.map((tx) => {
                    const cat = CATEGORIES[tx.category as keyof typeof CATEGORIES] || CATEGORIES.otros;
                    return (
                        <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors group">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: cat.color + "15", color: cat.color }}
                                >
                                    {tx.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{tx.merchant || cat.label}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted">
                                            {new Date(tx.date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: cat.color + "15", color: cat.color }}>
                                            {cat.label}
                                        </span>
                                        {(tx.account || tx.creditCard) && (
                                            <span className="text-xs text-muted">
                                                {tx.account?.name || tx.creditCard?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-cyan" : "text-foreground"}`}>
                                    {tx.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                                </span>
                                <button
                                    onClick={() => handleDelete(tx.id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose/10 text-muted hover:text-rose transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 glass-card rounded-2xl">
                    <Filter className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">No hay transacciones</p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary mt-4">Agregar Primera</button>
                </div>
            )}

            {/* New Transaction Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Transacción">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-muted mb-1 block">Monto</label>
                            <input className="input-field" type="number" step="0.01" value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="text-sm text-muted mb-1 block">Tipo</label>
                            <select className="input-field" value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="expense">Gasto</option>
                                <option value="income">Ingreso</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-muted mb-1 block">Fecha</label>
                            <input className="input-field" type="date" value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-sm text-muted mb-1 block">Categoría</label>
                            <select className="input-field" value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {CATEGORY_KEYS.map((key) => (
                                    <option key={key} value={key}>{CATEGORIES[key].label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Comercio</label>
                        <input className="input-field" value={form.merchant}
                            onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Ej: OXXO, Amazon, Spotify" />
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Descripción (opcional)</label>
                        <input className="input-field" value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notas adicionales" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-muted mb-1 block">Cuenta</label>
                            <select className="input-field" value={form.accountId}
                                onChange={(e) => setForm({ ...form, accountId: e.target.value, creditCardId: "" })}>
                                <option value="">Ninguna</option>
                                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-muted mb-1 block">Tarjeta</label>
                            <select className="input-field" value={form.creditCardId}
                                onChange={(e) => setForm({ ...form, creditCardId: e.target.value, accountId: "" })}>
                                <option value="">Ninguna</option>
                                {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="btn-primary flex-1">Agregar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
