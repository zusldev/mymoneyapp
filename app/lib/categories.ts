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
