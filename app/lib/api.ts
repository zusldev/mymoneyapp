"use client";

import { z } from "zod";

export type ApiFailure = { ok: false; error: string };

export class ApiError extends Error {
  readonly payload: ApiFailure;

  constructor(message: string) {
    super(message);
    this.payload = { ok: false, error: message };
  }
}

function humanMessage(status: number): string {
  if (status >= 500) return "Error interno del servidor. Intenta de nuevo.";
  if (status === 404) return "No se encontraron datos.";
  if (status === 401 || status === 403) return "No tienes permisos para esta acción.";
  if (status >= 400) return "No se pudo completar la solicitud.";
  return "Error inesperado.";
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const maybe = payload as Record<string, unknown>;
  if (typeof maybe.error === "string" && maybe.error.length > 0) return maybe.error;
  if (typeof maybe.message === "string" && maybe.message.length > 0) return maybe.message;
  return null;
}

export function normalizeApiError(error: unknown): ApiFailure {
  if (error instanceof ApiError) return error.payload;
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Error inesperado." };
}

async function parseWithSchema<T>(payload: unknown, schema?: z.ZodType<T>): Promise<T> {
  if (!schema) return payload as T;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError("Respuesta inválida del servidor.");
  }
  return parsed.data;
}

export async function apiGet<T>(url: string, schema?: z.ZodType<T>): Promise<T> {
  const response = await fetch(url);
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message = extractMessage(payload) ?? humanMessage(response.status);
    throw new ApiError(message);
  }

  return parseWithSchema(payload, schema);
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  schema?: z.ZodType<T>,
  method: "POST" | "PUT" | "DELETE" | "PATCH" = "POST",
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    const message = extractMessage(payload) ?? humanMessage(response.status);
    throw new ApiError(message);
  }

  return parseWithSchema(payload, schema);
}

