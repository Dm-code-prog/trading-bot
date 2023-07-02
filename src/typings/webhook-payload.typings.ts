export interface WebhookPayload {
  api_key: string;
  secret_key: string;
  side: 'BUY' | 'SELL';
  symbol: 'BTCUSDT';
  quantity: number;
  stop_loss_percent: number;
  activation_price: number;
  callback_rate: number;
}
