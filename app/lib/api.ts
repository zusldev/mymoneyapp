"use client";

import { z } from "zod";

export type ApiFailure = { ok: false; error: string };
const NETWORK_ERROR_MESSAGE = "No se pudo conectar. Revisa tu internet y reintenta.";

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

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  if (message.includes("load failed")) return true;
  if (message.includes("failed to fetch")) return true;
  if (message.includes("fetch failed")) return true;
  if (message.includes("networkerror")) return true;
  if (message.includes("network request failed")) return true;
  if (message.includes("econnrefused")) return true;
  if (message.includes("enotfound")) return true;
  return false;
}

function devLog(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(context, error);
  }
}

function toApiError(error: unknown, context: string): ApiError {
  if (error instanceof ApiError) return error;
  if (isNetworkError(error)) {
    devLog(context, error);
    return new ApiError(NETWORK_ERROR_MESSAGE);
  }
  devLog(context, error);
  if (error instanceof Error && error.message) return new ApiError(error.message);
  return new ApiError("Error inesperado.");
}

export function normalizeApiError(error: unknown): ApiFailure {
  if (error instanceof ApiError) return error.payload;
  if (isNetworkError(error)) {
    devLog("normalizeApiError(network)", error);
    return { ok: false, error: NETWORK_ERROR_MESSAGE };
  }
  if (error instanceof Error) return { ok: false, error: error.message || "Error inesperado." };
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
  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(url);
    payload = await parseJsonSafe(response);
  } catch (error) {
    throw toApiError(error, `apiGet(${url})`);
  }

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
  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(body),
    });
    payload = await parseJsonSafe(response);
  } catch (error) {
    throw toApiError(error, `apiPost(${method} ${url})`);
  }

  if (!response.ok) {
    const message = extractMessage(payload) ?? humanMessage(response.status);
    throw new ApiError(message);
  }

  return parseWithSchema(payload, schema);
}

