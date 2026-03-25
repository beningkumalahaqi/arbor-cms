import "server-only";

export interface ConnectionTestResult {
  connected: boolean;
  error?: string;
}

interface RemotePayloadResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function assertApiUrl(url: string): string {
  if (!url || typeof url !== "string") {
    throw new Error("Target Environment API URL is required");
  }

  const normalized = normalizeApiUrl(url);
  const allowed = normalized.startsWith("http://") || normalized.startsWith("https://");
  if (!allowed) {
    throw new Error("Target Environment API URL must start with http:// or https://");
  }

  return normalized;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text);
  }
}

async function request<T>(
  targetApiUrl: string,
  path: string,
  token: string | undefined,
  init?: RequestInit
): Promise<T> {
  const baseUrl = assertApiUrl(targetApiUrl);

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = await parseResponse<T & { error?: string }>(response);

  if (!response.ok) {
    const responseError =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : `HTTP ${response.status}`;
    throw new Error(responseError);
  }

  return data;
}

async function getStatus(
  targetApiUrl: string,
  token: string | undefined
): Promise<ConnectionTestResult> {
  try {
    const data = await request<{ connected?: boolean; error?: string }>(
      targetApiUrl,
      "/api/environment-sync/status",
      token,
      { method: "GET" }
    );

    if (data.connected === false) {
      return { connected: false, error: data.error || "Target returned disconnected status" };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function push<TPayload extends object>(
  targetApiUrl: string,
  token: string | undefined,
  payload: TPayload
): Promise<RemotePayloadResponse<undefined>> {
  return request<RemotePayloadResponse<undefined>>(
    targetApiUrl,
    "/api/environment-sync/push",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

async function pull<TData>(
  targetApiUrl: string,
  token: string | undefined
): Promise<RemotePayloadResponse<TData>> {
  return request<RemotePayloadResponse<TData>>(
    targetApiUrl,
    "/api/environment-sync/pull",
    token,
    { method: "GET" }
  );
}

export const environmentSyncClient = {
  getStatus,
  push,
  pull,
};
