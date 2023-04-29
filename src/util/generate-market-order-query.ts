import { WebhookPayload } from "../typings/webhook-payload.typings.js";
import { signQuery } from "./sign-query.js";

export function generateMarketOrderQuery(sk: string, { symbol, side, quantity }: WebhookPayload): string {
  const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}`;
  return signQuery(query, sk);
}
