import { RequestInit, Response } from "node-fetch";

export interface ApiClient {
  baseUrl: string;
  apiKey;
  fetch: (path: string, config: RequestInit) => Promise<Response>;
}
