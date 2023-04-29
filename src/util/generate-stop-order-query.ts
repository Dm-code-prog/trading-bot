import { signQuery } from "./sign-query.js";

export function generateStopOrderQuery(sk: string, { symbol, side, quantity, price, price2 }: {
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: string,
  price2: string,
}): string {
  const query = `symbol=${symbol}&side=${side}&type=STOP&quantity=${quantity}&stopPrice=${price}&price=${price2}&timeInForce=GTC&recvWindow=10000`;
  return signQuery(query, sk);
}
