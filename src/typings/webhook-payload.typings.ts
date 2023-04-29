export interface WebhookPayload {
  side: "BUY" | "SELL";
  symbol: "BTCUSDT" | "ADAUSDT";
  quantity: number;
}
