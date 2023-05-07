import { Request, Response } from "@google-cloud/functions-framework";
import { WebhookPayload } from "./typings/webhook-payload.typings.js";
import { WebhookPayloadSchema } from "./pkg/zod/webhook-payload.schema.js";
import { BAD_REQUEST, NO_KEYS, NO_ORDER, OPENED_ORDER, SERVER_ERROR } from "./constants/http-responses.js";
import { generateMarketOrderQuery } from "./util/generate-market-order-query.js";
import { getApiKey } from "./secrets/api-key.js";
import { getSecretKey } from "./secrets/secret-key.js";
import { ApiClient } from "./pkg/fetch-plus/fetch-plus.js";
import { Position } from "./typings/position-risk.js";
import { flipOrderSide } from "./util/flip-order-side.js";
import { generateLimitOrderQuery } from "./util/generate-limit-order-query.js";
import { signQuery } from "./util/sign-query.js";
import { generateStopOrderQuery } from "./util/generate-stop-order-query.js";
import { BTC_AFTER_COMMA_DIGITS, SIDES } from "./constants/trading.js";

export async function handleSignal(req: Request, res: Response): Promise<void> {
  const body = req.body as WebhookPayload;
  try {
    WebhookPayloadSchema.parse(body);
  } catch (e) {
    res.status(400).send(BAD_REQUEST);
    return;
  }

  const { symbol, side, quantity, stop_loss_percent, take_profit_percent } = body;

  let apiKey: string;
  let secretKey: string;

  let sl: string;
  let tp: string;

  const slPercent = stop_loss_percent ? stop_loss_percent : 1;
  const tpPercent = take_profit_percent ? take_profit_percent : 1;

  const context = {
    market: false,
    tp: false,
    sl: false
  };

  try {
    [apiKey, secretKey] = await Promise.all([getApiKey(), getSecretKey()]);
  } catch (e) {
    res.status(500).send(NO_KEYS);
    console.log("Could not load keys");
    return;
  }

  const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apiKey);
  const apiV2 = new ApiClient("https://testnet.binancefuture.com/fapi/v2", apiKey);

  try {
    const signedQuery = generateMarketOrderQuery(secretKey, { symbol, side, quantity });
    await api.fetch(`/order?${signedQuery}`, {
      method: "POST"
    });
    context.market = true;
  } catch (e) {
    console.log(e);
    res.status(500).send(NO_ORDER);
  }

  try {
    const signedPositionRiskQuery = signQuery(`symbol=${symbol}`, secretKey);
    const positionRiskResponse = await apiV2.fetch<Position[]>(`/positionRisk?${signedPositionRiskQuery}`, {
      method: "GET"
    });

    const [risk] = positionRiskResponse;
    const { entryPrice } = risk;
    if (side === SIDES.buy) {
      sl = (entryPrice * (1 - slPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
      tp = (entryPrice * (1 + tpPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
    } else {
      sl = (entryPrice * (1 + slPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
      tp = (entryPrice * (1 - tpPercent * 0.01)).toFixed(BTC_AFTER_COMMA_DIGITS);
    }

    const setTp = async (): Promise<void> => {
      const signedTPQuery = generateLimitOrderQuery(secretKey,
        { price: tp, quantity, symbol, side: flipOrderSide(side) });
      await api.fetch(`/order?${signedTPQuery}`, {
        method: "POST"
      });
      context.tp = true;
    };

    const setSl = async (): Promise<void> => {
      const signedSlQuery = generateStopOrderQuery(secretKey,
        { price: sl, quantity, symbol, side: flipOrderSide(side) });
      await api.fetch(`/order?${signedSlQuery}`, {
        method: "POST"
      });
      context.sl = true;
    };

    await Promise.all([setSl(), setTp()]);
    res.status(200).send(OPENED_ORDER);
  } catch (e) {
    const { market, tp, sl } = context;

    if (market && (!sl || !tp)) {
      await api.fetch(`/allOpenOrders?${signQuery("symbol=BTCUSDT", secretKey)}`, {
        method: "DELETE"
      });
      const signedQuery = generateMarketOrderQuery(secretKey, { symbol, side: flipOrderSide(side), quantity });
      await api.fetch(`/order?${signedQuery}`, {
        method: "POST"
      });
    }
    res.status(500).send(SERVER_ERROR);
  }
}

