import { Order } from "./order.model.js";
import { NewStopOrderSchema } from "../pkg/zod/new-stop-order.schema.js";
import { signQuery } from "../util/sign-query.js";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus.js";
import { BINANCE_REST_URL } from "../constants/services.js";

export class TrailingStopOrder extends Order {
  protected readonly timeInForce = "GTC";

  protected readonly recvWindow = 10000;

  protected orderPrice: string;

  public verify(): TrailingStopOrder {
    NewStopOrderSchema.parse({
      apikey: this.apikey,
      secret: this.secret,
      side: this.orderSide,
      quantity: this.quantity,
      type: this.type,
      price: this.orderPrice,
      timeInForce: this.timeInForce,
      recvWindow: this.recvWindow
    });
    return this;
  }

  constructor() {
    super();
    this.type = "TRAILING_STOP_MARKET";
  }

  public activationPrice(p: string): TrailingStopOrder {
    this.orderPrice = p;
    return this;
  }

  public async send(): Promise<void> {
    const { symbol, orderSide, type, quantity, secret, apikey, orderPrice, recvWindow,  } = this;
    const query = `symbol=${symbol}&side=${orderSide}&type=${type}&quantity=${quantity}&activationPrice=${orderPrice}&recvWindow=${recvWindow}&callbackRate=0.2&priceRate=0.1`;
    const signed = signQuery(query, secret);
    const api = new ApiClient(`${BINANCE_REST_URL}fapi/v1`, apikey);

    await api.fetch(`/order?${signed}`, {
      method: "POST"
    });

    this.cb?.();
  }
}
