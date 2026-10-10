'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMockDataForEndpoint } from '@/lib/mockData';

/**
 * Checks whether DEMO MODE is enabled via environment variable
 * process.env.NEXT_PUBLIC_DEMO_MODE
 */
export function isDemoMode(): boolean {
  const envVal = process.env.NEXT_PUBLIC_DEMO_MODE;
  if (!envVal) return false;
  return envVal.toLowerCase() === 'true' || envVal === '1';
}

export interface FetchDataOptions<T> extends RequestInit {
  /** Optional custom mock data override for this specific call when in demo mode */
  mockData?: T | (() => T | Promise<T>);
  /** Simulated delay in milliseconds when in demo mode (default: 200ms) */
  mockDelayMs?: number;
}

/**
 * High-level conditional data fetcher.
 * - If process.env.NEXT_PUBLIC_DEMO_MODE === 'true', returns mock data.
 * - Otherwise, performs an actual network fetch from the API.
 *
 * @example
 * const stats = await fetchData('/api/dashboard/stats');
 * const custom = await fetchData('/api/custom', {}, myCustomMockData);
 */
export async function fetchData<T = any>(
  url: string,
  options?: FetchDataOptions<T>,
  inlineMockData?: T | (() => T | Promise<T>)
): Promise<T> {
  const mockOverride = inlineMockData !== undefined ? inlineMockData : options?.mockData;
  const delayMs = options?.mockDelayMs ?? 200;

  if (isDemoMode()) {
    // Simulate real network latency for natural UX transitions
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (typeof mockOverride === 'function') {
      return (mockOverride as () => T | Promise<T>)();
    }
    if (mockOverride !== undefined) {
      return mockOverride;
    }

    // Default to the centralized mock registry
    return getMockDataForEndpoint(url, options?.method || 'GET') as T;
  }

  // Live API network request
  const res = await fetch(url, options);
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status} (${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson?.error) errorMsg = errJson.error;
      else if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // ignore json parse error on non-json error responses
    }
    throw new Error(errorMsg);
  }

  return (await res.json()) as T;
}

/**
 * Drop-in replacement for window.fetch that respects NEXT_PUBLIC_DEMO_MODE.
 * Returns a standard Web API Response object so existing `const res = await fetch(...)`
 * code can be migrated with zero refactoring of response handlers.
 *
 * @example
 * const res = await fetchWithDemo('/api/residents');
 * const data = await res.json();
 */
export async function fetchWithDemo(
  input: RequestInfo | URL,
  init?: RequestInit,
  customMockData?: any
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';

  if (isDemoMode()) {
    // Simulate natural latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    const mockPayload =
      customMockData !== undefined ? customMockData : getMockDataForEndpoint(url, method);

    return new Response(JSON.stringify(mockPayload), {
      status: 200,
      statusText: 'OK (Demo Mode)',
      headers: {
        'Content-Type': 'application/json',
        'X-Demo-Mode': 'true',
      },
    });
  }

  return fetch(input, init);
}

/**
 * React Hook for declarative conditional data fetching.
 *
 * @example
 * const { data, loading, error, refetch } = useConditionalFetch<StatsResponse>('/api/dashboard/stats');
 */
export function useConditionalFetch<T = any>(
  url: string | null,
  options?: {
    mockData?: T;
    enabled?: boolean;
    deps?: any[];
    mockDelayMs?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(options?.enabled !== false);
  const [error, setError] = useState<Error | null>(null);

  const executeFetch = useCallback(async () => {
    if (!url || options?.enabled === false) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchData<T>(url, {
        mockData: options?.mockData,
        mockDelayMs: options?.mockDelayMs,
      });
      setData(result);
    } catch (err: any) {
      console.error(`[DataFetchError] ${url}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [url, options?.enabled, options?.mockData, options?.mockDelayMs]);

  useEffect(() => {
    executeFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeFetch, ...(options?.deps || [])]);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
    isDemo: isDemoMode(),
  };
}

/**
 * Helper to perform mutations (POST / PUT / DELETE) conditionally.
 */
export async function mutateData<T = any>(
  url: string,
  payload?: any,
  options?: Omit<RequestInit, 'body'>,
  customMockResponse?: T
): Promise<T> {
  const method = options?.method || 'POST';

  return fetchData<T>(
    url,
    {
      ...options,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
      mockData: customMockResponse,
    }
  );
}
