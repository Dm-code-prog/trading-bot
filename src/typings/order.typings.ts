export interface OpenedOrder {
  orderId: number;
  symbol: string;
  status: "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "EXPIRED";
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQty: string;
  cumQuote: string;
  timeInForce: "GTC" | "IOC" | "FOK" | "GTX";
  type: "LIMIT" | "MARKET" | "STOP" | "STOP_MARKET" | "TAKE_PROFIT" | "TAKE_PROFIT_MARKET" | "TRAILING_STOP_MARKET" | "ICEBERG" | "LIMIT_MAKER";
  reduceOnly: boolean;
  closePosition: boolean;
  side: "BUY" | "SELL";
  positionSide: "BOTH" | "LONG" | "SHORT";
  stopPrice: string;
  workingType: "CONTRACT_PRICE" | "MARK_PRICE";
  priceProtect: boolean;
  origType: "LIMIT" | "MARKET" | "STOP" | "STOP_MARKET" | "TAKE_PROFIT" | "TAKE_PROFIT_MARKET" | "TRAILING_STOP_MARKET" | "ICEBERG" | "LIMIT_MAKER";
  updateTime: number;
}
