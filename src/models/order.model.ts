import { signQuery } from "../util/sign-query.js";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus.js";

export abstract class Order {
  protected readonly symbol = "BTCUSDT";

  protected secret: string;

  protected apikey: string;

  protected orderSide: "BUY" | "SELL";

  protected quantity: number;

  protected type: "MARKET" | "STOP_MARKET" | "LIMIT";

  protected cb: () => void;

  public creds(apikey: string, secret: string): this {
    this.apikey = apikey;
    this.secret = secret;
    return this;
  }

  public quant(n: number): this {
    this.quantity = n;
    return this;
  }

  public side(s: "BUY" | "SELL"): this {
    this.orderSide = s;
    return this;
  }

  public callback(c: () => void): this {
    this.cb = c;
    return this;
  }

  static async deleteAll(apikey: string, secret: string): Promise<void> {
    const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apikey);
    await api.fetch(`/allOpenOrders?${signQuery("symbol=BTCUSDT", secret)}`, {
      method: "DELETE"
    });
  }
}
