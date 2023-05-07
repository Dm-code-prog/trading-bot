import { z } from "zod";

export const WebhookPayloadSchema = z.object({
  side: z.string().refine((val) => val === "BUY" || val === "SELL", {
    message: "Side must be either BUY or SELL"
  }),
  symbol: z.string().refine(val => val === "BTCUSDT", {
    message: 'For now we only support BTCUSDT'
  }),
  quantity: z.number().positive(),
  stop_loss_percent: z.number().positive().optional(),
  take_profit_percent: z.number().positive().optional()
});
