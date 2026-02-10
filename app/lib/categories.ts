export const CATEGORIES = {
    renta: { label: "Renta", color: "#ef4444", icon: "home" },
    comida: { label: "Comida", color: "#f97316", icon: "utensils" },
    transporte: { label: "Transporte", color: "#eab308", icon: "car" },
    compras: { label: "Compras", color: "#84cc16", icon: "shopping-bag" },
    servicios: { label: "Servicios", color: "#06b6d4", icon: "zap" },
    suscripciones: { label: "Suscripciones", color: "#8b5cf6", icon: "repeat" },
    salud: { label: "Salud", color: "#ec4899", icon: "heart-pulse" },
    entretenimiento: { label: "Entretenimiento", color: "#f43f5e", icon: "gamepad-2" },
    educacion: { label: "Educación", color: "#14b8a6", icon: "graduation-cap" },
    comisiones_intereses: { label: "Comisiones/Intereses", color: "#dc2626", icon: "alert-triangle" },
    transferencias: { label: "Transferencias", color: "#6b7280", icon: "arrow-right-left" },
    ingresos: { label: "Ingresos", color: "#10b981", icon: "trending-up" },
    otros: { label: "Otros", color: "#9ca3af", icon: "circle-dot" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
