import { describe, expect, it } from "vitest";
import { format, parse, percentages, sum, toMajorUnits } from "../app/lib/money.ts";

describe("money helpers", () => {
  it("parse y suma sin drift", () => {
    const a = parse("10.10");
    const b = parse("20.20");
    const c = parse("0.30");
    const total = sum([a, b, c]);

    expect(total).toBe(3060);
    expect(toMajorUnits(total)).toBe(30.6);
  });

  it("suma y resta", () => {
    const income = parse("1500.00");
    const expense = parse("499.95");
    const net = sum([income, -expense]);

    expect(net).toBe(100005);
    expect(toMajorUnits(net)).toBe(1000.05);
  });

  it("porcentajes", () => {
    const part = parse("25");
    const total = parse("200");
    expect(percentages(part, total, { decimals: 2 })).toBe(12.5);
  });

  it("formato", () => {
    const value = parse("1234.5");
    const formatted = format(value, "MXN", "es-MX");
    expect(formatted.includes("$1,234.5") || formatted.includes("$1,234.50")).toBe(true);
  });

  it("negativos", () => {
    const v = parse("-42.10");
    expect(v).toBe(-4210);
    expect(toMajorUnits(v)).toBe(-42.1);
  });

  it("montos grandes", () => {
    const v = parse("987654321.99");
    expect(v).toBe(98765432199);
    expect(toMajorUnits(v)).toBe(987654321.99);
  });

  it("round boundaries", () => {
    expect(parse("0.005")).toBe(1);
    expect(parse("0.0049")).toBe(0);
  });

  it("parse inválido", () => {
    expect(() => parse("abc")).toThrowError(/Monto inválido/);
  });
});
