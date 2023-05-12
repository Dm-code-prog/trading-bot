import { Order } from "./order.model.js";
import { NewMarketOrderSchema } from "../pkg/zod/new-market-order.schema.js";
import { signQuery } from "../util/sign-query.js";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus.js";
import { flipOrderSide } from "../util/flip-order-side.js";
import { Position } from "../typings/position-risk.js";

export class MarketOrder extends Order {
  constructor() {
    super();
    this.type = "MARKET";
  }

  public verify(): MarketOrder {
    NewMarketOrderSchema.parse({
      apikey: this.apikey,
      secret: this.secret,
      side: this.orderSide,
      quantity: this.quantity,
      type: this.type
    });
    return this;
  }

  public async send(): Promise<{ rollback: () => Promise<void>, entryPrice: number }> {
    const { symbol, orderSide, type, quantity, secret, apikey } = this;
    const query = `symbol=${symbol}&side=${orderSide}&type=${type}&quantity=${quantity}`;
    const signed = signQuery(query, secret);
    const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apikey);

    await api.fetch(`/order?${signed}`, {
      method: "POST"
    });

    const apiV2 = new ApiClient("https://testnet.binancefuture.com/fapi/v2", apikey);
    const signedPositionRiskQuery = signQuery(`symbol=${symbol}`, secret);
    const positionRiskResponse = await apiV2.fetch<Position[]>(`/positionRisk?${signedPositionRiskQuery}`, {
      method: "GET"
    });

    const [risk] = positionRiskResponse;
    const { entryPrice } = risk;

    this.cb?.();

    return {
      rollback: async (): Promise<void> => {
        const reverseSide = flipOrderSide(orderSide);
        const reverseQuery = `symbol=${symbol}&side=${reverseSide}&type=${type}&quantity=${quantity}`;
        const reverseSigned = signQuery(reverseQuery, secret);

        await api.fetch(`/order?${reverseSigned}`, {
          method: "POST"
        });
      },
      entryPrice: entryPrice
    };
  }
}





