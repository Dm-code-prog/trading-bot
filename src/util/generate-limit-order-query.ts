import { signQuery } from "./sign-query.js";

export function generateLimitOrderQuery(sk: string, { symbol, side, quantity, price }: {
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number,
  price: string
}): string {
  const query = `symbol=${symbol}&side=${side}&type=LIMIT&quantity=${quantity}&price=${price}&timeInForce=GTC&recvWindow=10000&reduceOnly=false`;
  return signQuery(query, sk);
}
