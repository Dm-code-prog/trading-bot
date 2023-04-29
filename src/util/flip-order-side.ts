import { WebhookPayload } from "../typings/webhook-payload.typings.js";

export function flipOrderSide(side: WebhookPayload["side"]): WebhookPayload['side'] {
  if (side === "BUY") return "SELL";
  return "BUY";
}
