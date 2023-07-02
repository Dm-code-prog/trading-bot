import { signQuery } from '../util/sign-query.js';
import { ApiClient } from '../pkg/fetch-plus/fetch-plus.js';
import { Position } from '../typings/position-risk.js';

export abstract class Order {
  protected readonly symbol = 'BTCUSDT';

  protected secret: string;

  protected apikey: string;

  protected orderSide: 'BUY' | 'SELL';

  protected quantity: number;

  protected type: 'MARKET' | 'STOP_MARKET' | 'LIMIT' | 'TRAILING_STOP_MARKET';

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

  public side(s: 'BUY' | 'SELL'): this {
    this.orderSide = s;
    return this;
  }

  public callback(c: () => void): this {
    this.cb = c;
    return this;
  }

  /**
   * Close all open orders (not positions!!!)
   */
  static async deleteAll(apikey: string, secret: string): Promise<void> {
    const api = new ApiClient(
      'https://testnet.binancefuture.com/fapi/v1',
      apikey,
    );
    await api.fetch(`/allOpenOrders?${signQuery('symbol=BTCUSDT', secret)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get the size of the open position for BTCUSDT
   */
  static async getPosition(
    apiKey: string,
    secretKey: string,
  ): Promise<{
    positionAmount: number;
    positionSide: 'BUY' | 'SELL';
  }> {
    const apiV2 = new ApiClient(
      'https://testnet.binancefuture.com/fapi/v2',
      apiKey,
    );
    const signedPositionRiskQuery = signQuery('symbol=BTCUSDT', secretKey);
    const positionRiskResponse = await apiV2.fetch<Position[]>(
      `/positionRisk?${signedPositionRiskQuery}`,
      {
        method: 'GET',
      },
    );

    const [risk] = positionRiskResponse;
    const { positionAmt, positionSide } = risk;
    const asNumber = Number(positionAmt);

    const side = positionSide as 'BUY' | 'SELL';

    return { positionAmount: asNumber, positionSide: side };
  }
}
