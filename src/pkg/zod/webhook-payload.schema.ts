import { z } from "zod";

export const WebhookPayloadSchema = z.object({
  side: z.string().refine((val) => val === "BUY" || val === "SELL", {
    message: "Side must be either BUY or SELL"
  }),
  symbol: z.string().min(6),
  quantity: z.number().positive()
});
