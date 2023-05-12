import { z } from "zod";

export const NewStopOrderSchema = z.object({
  apikey: z.string().nonempty().min(10),
  secret: z.string().nonempty().min(10),
  side: z.string().refine((val) => val === "BUY" || val === "SELL", {
    message: "Side must be either BUY or SELL"
  }),
  quantity: z.number().positive(),
  type: z.literal('STOP_MARKET'),
  price: z.number().positive(),
  timeInForce: z.literal('GTC'),
  recvWindow: z.number().positive()
});
