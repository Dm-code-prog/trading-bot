import { z } from "zod";

export const NewMarketOrderSchema = z.object({
  apikey: z.string().nonempty().min(10),
  secret: z.string().nonempty().min(10),
  side: z.string().refine((val) => val === "BUY" || val === "SELL", {
    message: "Side must be either BUY or SELL"
  }),
  quantity: z.number().positive(),
  type: z.literal('MARKET')
});
