export interface WebhookPayload {
  api_key: string;
  secret_key: string;
  side: 'BUY' | 'SELL';
  symbol: 'BTCUSDT';
  quantity: number;
  stop_loss_percent: number;
  take_profit_percent: number;
}
