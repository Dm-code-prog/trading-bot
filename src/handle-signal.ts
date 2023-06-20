import { Request, Response } from "@google-cloud/functions-framework";
import { WebhookPayload } from "./typings/webhook-payload.typings.js";
import { WebhookPayloadSchema } from "./pkg/zod/webhook-payload.schema.js";
import { BAD_REQUEST, NO_KEYS, NO_ORDER, OPENED_ORDER, SERVER_ERROR } from "./constants/http-responses.js";
import { getApiKey } from "./secrets/api-key.js";
import { getSecretKey } from "./secrets/secret-key.js";
import { flipOrderSide } from "./util/flip-order-side.js";
import { BTC_AFTER_COMMA_DIGITS, SIDES } from "./constants/trading.js";
import { MarketOrder } from "./models/market-order.model.js";
import { Order } from "./models/order.model.js";
import { StopOrder } from "./models/stop-order.model.js";
import { TakeProfitOrder } from "./models/take-profit-order.model.js";
import fetch from "node-fetch";
import { DISPOSER_IP } from "./constants/services.js";
import { ApiClient } from "./pkg/fetch-plus/fetch-plus.js";
import { signQuery } from "./util/sign-query.js";
import { Position } from "./typings/position-risk.js";

export async function handleSignal(req: Request, res: Response): Promise<void> {
  const body = req.body as WebhookPayload;
  try {
    WebhookPayloadSchema.parse(body);
  } catch (e) {
    res.status(400).send(BAD_REQUEST);
    return;
  }

  const { side, quantity, stop_loss_percent, take_profit_percent, symbol } = body;

  let apiKey: string;
  let secretKey: string;

  let sl: string;
  let tp: string;

  const slPercent = stop_loss_percent ? stop_loss_percent : 1;
  const tpPercent = take_profit_percent ? take_profit_percent : 1;

  let entryPrice: number;
  let rollBackMarket: () => void;

  const ctx = {
    market: false,
    tp: false,
    sl: false
  };

  try {
    [apiKey, secretKey] = await Promise.all([getApiKey(), getSecretKey()]);
  } catch (e) {
    res.status(500).send(NO_KEYS);
    return;
  }

  const apiV2 = new ApiClient("https://testnet.binancefuture.com/fapi/v2", apiKey);
  const signedPositionRiskQuery = signQuery(`symbol=${symbol}`, secretKey);
  const positionRiskResponse = await apiV2.fetch<Position[]>(`/positionRisk?${signedPositionRiskQuery}`, {
    method: "GET"
  });

  const [risk] = positionRiskResponse;

  const { positionAmt } = risk;

  if (Number(positionAmt) !== 0) {
    res.status(400).send(BAD_REQUEST)
    return
  }

  const disposerReq = await fetch(`http://${DISPOSER_IP}/api/listen-and-clean`, {
    method: 'POST',
    body: JSON.stringify({ user: "root" })
  })

  if (!disposerReq.ok) {
    res.status(500).send(SERVER_ERROR);
    console.log(disposerReq.status)
    return
  }

  try {
    const order = new MarketOrder()
      .creds(apiKey, secretKey)
      .quant(quantity)
      .side(side)
      .callback(() => {
        ctx.market = true;
      });

    const { rollback, entryPrice: ep } = await order
      .verify()
      .send();

    rollBackMarket = rollback;
    entryPrice = ep;
  } catch (e) {
    console.log(e);
    res.status(500).send(NO_ORDER);
    return;
  }

  try {
    if (side === SIDES.buy) {
      sl = (entryPrice * (1 - slPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
      tp = (entryPrice * (1 + tpPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
    } else {
      sl = (entryPrice * (1 + slPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
      tp = (entryPrice * (1 - tpPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
    }

    const stopOrder = new StopOrder()
      .creds(apiKey, secretKey)
      .quant(quantity)
      .side(flipOrderSide(side))
      .price(sl)
      .callback(() => {
        ctx.sl = true;
      });

    const takeOrder = new TakeProfitOrder()
      .creds(apiKey, secretKey)
      .quant(quantity)
      .side(flipOrderSide(side))
      .price(tp)
      .callback(() => {
        ctx.tp = true;
      });

    await Promise.all([stopOrder.send(), takeOrder.send()]);
    res.status(200).send(OPENED_ORDER);
  } catch (e) {
    const { market, tp, sl } = ctx;

    if (market && (!sl || !tp)) {
      await Order.deleteAll(apiKey, secretKey);
      await rollBackMarket();
    }
    res.status(500).send(SERVER_ERROR);
  }
}

