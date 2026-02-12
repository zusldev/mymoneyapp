export const CATEGORIES = {
    hogar: { label: "Hogar", color: "#ef4444", icon: "home" },
    renta: { label: "Renta", color: "#ef4444", icon: "home" },
    comida: { label: "Comida", color: "#f97316", icon: "restaurant" },
    supermercado: { label: "Supermercado", color: "#84cc16", icon: "shopping_cart" },
    transporte: { label: "Transporte", color: "#eab308", icon: "directions_car" },
    compras: { label: "Compras", color: "#a855f7", icon: "shopping_bag" },
    servicios: { label: "Servicios", color: "#06b6d4", icon: "bolt" },
    suscripciones: { label: "Suscripciones", color: "#8b5cf6", icon: "sync" },
    salud: { label: "Salud", color: "#ec4899", icon: "fitness_center" },
    entretenimiento: { label: "Entretenimiento", color: "#f43f5e", icon: "movie" },
    educacion: { label: "Educación", color: "#14b8a6", icon: "school" },
    viajes: { label: "Viajes", color: "#0ea5e9", icon: "flight" },
    salario: { label: "Salario", color: "#10b981", icon: "payments" },
    comisiones_intereses: { label: "Comisiones/Intereses", color: "#dc2626", icon: "warning" },
    transferencias: { label: "Transferencias", color: "#6b7280", icon: "swap_horiz" },
    ingresos: { label: "Ingresos", color: "#10b981", icon: "trending_up" },
    otros: { label: "Otros", color: "#9ca3af", icon: "more_horiz" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

/* ═══ Tailwind color maps for UI rendering ═══ */
export const CAT_COLORS: Record<string, { bg: string; text: string }> = {
    comida: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600" },
    supermercado: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700" },
    transporte: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700" },
    entretenimiento: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600" },
    servicios: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600" },
    hogar: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600" },
    renta: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600" },
    salud: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600" },
    compras: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700" },
    educacion: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600" },
    suscripciones: { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600" },
    ingresos: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700" },
    salario: { bg: "bg-[#2badee]/10", text: "text-blue-600" },
    viajes: { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-600" },
    transferencias: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600" },
    comisiones_intereses: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600" },
};

export const DEFAULT_CAT_COLORS = { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500" };

/** Resolve icon for a category key. Falls back to "receipt_long". */
export function getCatIcon(cat: string): string {
    return (CATEGORIES[cat as CategoryKey]?.icon) || "receipt_long";
}

/** Resolve Tailwind color classes for a category key. */
export function getCatColors(cat: string): { bg: string; text: string } {
    return CAT_COLORS[cat] || DEFAULT_CAT_COLORS;
}
