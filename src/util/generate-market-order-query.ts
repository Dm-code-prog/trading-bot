import { signQuery } from "./sign-query.js";

export function generateMarketOrderQuery(sk: string, { symbol, side, quantity }: {
  symbol: "BTCUSDT",
  side: "BUY" | "SELL",
  quantity: number
}): string {
  const query = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}`;
  return signQuery(query, sk);
}
