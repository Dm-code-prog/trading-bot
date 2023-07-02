import { z } from "zod";

export const WebhookPayloadSchema = z.object({
  api_key: z.string(),
  secret_key: z.string(),
  side: z.string().refine((val) => val === "BUY" || val === "SELL", {
    message: "Side must be either BUY or SELL"
  }),
  symbol: z.string().refine(val => val === "BTCUSDT", {
    message: 'For now we only support BTCUSDT'
  }),
  quantity: z.number().positive(),
  stop_loss_percent: z.number().positive().max(50).optional(),
  activation_price: z.number().positive().min(0.2).max(50).optional(),
  callback_rate: z.number().positive().min(0.1).max(5).optional(),
});
