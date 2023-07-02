import nodeFetch, { RequestInit } from 'node-fetch';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  public async fetch<T>(path: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const signal = controller.signal;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);
    const defaultOptions = {
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    };
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      signal,
    } as RequestInit;

    const url = `${this.baseUrl}${path}`;
    const response = await nodeFetch(url, mergedOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`
      HTTP error!
      Status: ${response.status}
      `);
    }

    const r = (await response.json()) as T;

    return r;
  }
}
