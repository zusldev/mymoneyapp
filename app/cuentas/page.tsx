"use client";

import { useEffect, useState } from "react";
import { Plus, Landmark, Wallet, PiggyBank, Banknote, Trash2, Edit2, Loader2 } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency } from "../lib/financialEngine";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    color: string;
    icon: string;
    _count?: { transactions: number };
}

const typeIcons: Record<string, typeof Wallet> = {
    checking: Landmark,
    savings: PiggyBank,
    cash: Banknote,
    investment: Wallet,
};

const typeLabels: Record<string, string> = {
    checking: "Cuenta de cheques",
    savings: "Ahorro",
    cash: "Efectivo",
    investment: "Inversión",
};

const colorOptions = ["#06b6d4", "#8b5cf6", "#06d6a0", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6"];

export default function CuentasPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [form, setForm] = useState({ name: "", type: "checking", balance: "", currency: "MXN", color: "#06b6d4" });

    const fetchAccounts = () => {
        fetch("/api/accounts")
            .then((r) => r.json())
            .then(setAccounts)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAccounts(); }, []);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const openCreate = () => {
        setEditingAccount(null);
        setForm({ name: "", type: "checking", balance: "", currency: "MXN", color: "#06b6d4" });
        setModalOpen(true);
    };

    const openEdit = (account: Account) => {
        setEditingAccount(account);
        setForm({
            name: account.name,
            type: account.type,
            balance: account.balance.toString(),
            currency: account.currency,
            color: account.color,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingAccount ? "PUT" : "POST";
        const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";
        await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setModalOpen(false);
        fetchAccounts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta cuenta? Se borrarán todas sus transacciones.")) return;
        await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        fetchAccounts();
    };

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
                    <h1 className="text-2xl font-bold text-foreground">Cuentas</h1>
                    <p className="text-muted text-sm mt-1">Administra tus cuentas bancarias y efectivo</p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva Cuenta</span>
                </button>
            </div>

            {/* Total Banner */}
            <div className="glass-card rounded-2xl p-6 glow-cyan">
                <p className="text-sm text-muted mb-1">Balance Total</p>
                <p className="text-3xl font-bold text-cyan tabular-nums">{formatCurrency(totalBalance)}</p>
                <p className="text-xs text-muted mt-1">{accounts.length} cuenta{accounts.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                {accounts.map((account) => {
                    const Icon = typeIcons[account.type] || Wallet;
                    return (
                        <div key={account.id} className="glass-card rounded-2xl p-5 group">
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="p-3 rounded-xl"
                                    style={{ backgroundColor: account.color + "15" }}
                                >
                                    <Icon className="w-6 h-6" style={{ color: account.color }} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(account)}
                                        className="p-2 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 rounded-lg hover:bg-rose/10 text-muted hover:text-rose transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-foreground">{account.name}</p>
                            <p className="text-xs text-muted mb-3">{typeLabels[account.type] || account.type}</p>
                            <p className="text-xl font-bold text-foreground tabular-nums">{formatCurrency(account.balance, account.currency)}</p>
                            {account._count && (
                                <p className="text-xs text-muted mt-2">{account._count.transactions} transacciones</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {accounts.length === 0 && (
                <div className="text-center py-16 glass-card rounded-2xl">
                    <Landmark className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">No tienes cuentas registradas</p>
                    <button onClick={openCreate} className="btn-primary mt-4">Agregar Primera Cuenta</button>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAccount ? "Editar Cuenta" : "Nueva Cuenta"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-muted mb-1 block">Nombre</label>
                        <input
                            className="input-field"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ej: BBVA Nómina"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Tipo</label>
                        <select
                            className="input-field"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                        >
                            <option value="checking">Cuenta de cheques</option>
                            <option value="savings">Ahorro</option>
                            <option value="cash">Efectivo</option>
                            <option value="investment">Inversión</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Balance actual</label>
                        <input
                            className="input-field"
                            type="number"
                            step="0.01"
                            value={form.balance}
                            onChange={(e) => setForm({ ...form, balance: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-1 block">Color</label>
                        <div className="flex gap-2">
                            {colorOptions.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setForm({ ...form, color: c })}
                                    className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-white/30" : "hover:scale-110"}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                        <button type="submit" className="btn-primary flex-1">{editingAccount ? "Guardar" : "Crear"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
