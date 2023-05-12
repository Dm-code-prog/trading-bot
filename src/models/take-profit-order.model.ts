import { Order } from "./order.model.js";
import { NewStopOrderSchema } from "../pkg/zod/new-stop-order.schema.js";
import { signQuery } from "../util/sign-query.js";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus.js";

export class TakeProfitOrder extends Order {
  protected readonly timeInForce = "GTC";

  protected readonly recvWindow = 10000;

  protected orderPrice: string;

  public verify(): TakeProfitOrder {
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
    this.type = "LIMIT";
  }

  public price(p: string): TakeProfitOrder {
    this.orderPrice = p;
    return this;
  }

  public async send(): Promise<void> {
    const { symbol, orderSide, type, quantity, secret, apikey, orderPrice, recvWindow, timeInForce } = this;
    const query = `symbol=${symbol}&side=${orderSide}&type=${type}&quantity=${quantity}&price=${orderPrice}&timeInForce=${timeInForce}&recvWindow=${recvWindow}&reduceOnly=false`;
    const signed = signQuery(query, secret);
    const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apikey);

    await api.fetch(`/order?${signed}`, {
      method: "POST"
    });

    this.cb?.();
  }
}
