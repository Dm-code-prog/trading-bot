export interface WebhookPayload {
  side: "BUY" | "SELL";
  symbol: "BTCUSDT";
  quantity: number;
  stop_loss_percent: number;
  take_profit_percent: number;
}
