import nodeFetch, { RequestInit } from "node-fetch";

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  public async fetch<T>(path: string, options: RequestInit): Promise<T> {
    const defaultOptions = {
      headers: {
        "X-MBX-APIKEY": this.apiKey
      }
    };
    const mergedOptions = { ...defaultOptions, ...options };

    const url = `${this.baseUrl}${path}`;
    const response = await nodeFetch(url, mergedOptions);

    const r = await response.json() as T;

    if (!response.ok) {
      throw new Error(`
      HTTP error!
      Status: ${response.status}

      Message: ${JSON.stringify(r)}
      `);
    }

    return r;
  }
}
