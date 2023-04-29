import { generateSignature } from "./generate-signature.js";

function appendTimestamp(query: string): string {
  return `${query}&timestamp=${+Date.now()}`;
}

function appendSignature(query: string, signature: ReturnType<typeof generateSignature>): string {
  return `${query}&signature=${signature}`;
}

export function signQuery(query: string, sk: string): string {
  const withTS = appendTimestamp(query);
  const signature = generateSignature(withTS, sk);
  return appendSignature(withTS, signature);
}
