import { signQuery } from "./sign-query.js";

export function generateStopOrderQuery(sk: string, { symbol, side, quantity, price }: {
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: string,
}): string {
  const query = `symbol=${symbol}&side=${side}&type=STOP_MARKET&quantity=${quantity}&stopPrice=${price}&timeInForce=GTC&recvWindow=10000`;
  return signQuery(query, sk);
}
