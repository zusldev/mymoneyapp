import Decimal from "decimal.js";

export type AmountCents = number;

const CENTS_FACTOR = new Decimal(100);

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} está fuera del rango seguro de enteros`);
  }
}

/**
 * Parsea una cantidad monetaria (string/number/Decimal) y la convierte a centavos.
 * Redondea con HALF_UP para comportamiento financiero explícito.
 */
export function parse(input: string | number | Decimal): AmountCents {
  if (input === "" || input === null || input === undefined) {
    throw new Error("Monto inválido");
  }

  let decimalValue: Decimal;
  try {
    decimalValue = new Decimal(input);
  } catch {
    throw new Error("Monto inválido");
  }

  if (!decimalValue.isFinite()) {
    throw new Error("Monto inválido");
  }

  const cents = decimalValue
    .mul(CENTS_FACTOR)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();

  assertSafeInteger(cents, "Monto");
  return cents;
}

export function toMajorUnits(cents: AmountCents): number {
  assertSafeInteger(cents, "Centavos");
  return new Decimal(cents).div(CENTS_FACTOR).toNumber();
}

export function format(
  cents: AmountCents,
  currency = "MXN",
  locale = "es-MX",
): string {
  const value = toMajorUnits(cents);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sum(values: AmountCents[]): AmountCents {
  const total = values.reduce((acc, item) => {
    assertSafeInteger(item, "Centavos");
    return acc + item;
  }, 0);

  assertSafeInteger(total, "Total");
  return total;
}

export function percentages(
  partCents: AmountCents,
  totalCents: AmountCents,
  options?: { clamp?: boolean; decimals?: number },
): number {
  const clamp = options?.clamp ?? true;
  const decimals = options?.decimals ?? 2;

  assertSafeInteger(partCents, "Centavos parciales");
  assertSafeInteger(totalCents, "Centavos totales");

  if (totalCents <= 0) return 0;

  let value = new Decimal(partCents)
    .div(totalCents)
    .mul(100)
    .toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP)
    .toNumber();

  if (clamp) {
    value = Math.max(0, Math.min(100, value));
  }

  return value;
}
