import * as crypto from "crypto";


export function generateSignature(query: string, key: string): string {
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(query);
  return hmac.digest("hex");
}
