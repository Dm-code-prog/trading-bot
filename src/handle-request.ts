import { Request, Response } from "@google-cloud/functions-framework";
import { WebhookPayload } from "./typings/webhook-payload.typings.js";
import { WebhookPayloadSchema } from "./pkg/zod/webhook-payload.schema.js";
import { BAD_REQUEST, OPENED_ORDER, SERVER_ERROR } from "./constants/http-responses.js";
import { generateMarketOrderQuery } from "./util/generate-market-order-query.js";
import { getApiKey } from "./secrets/api-key.js";
import { getSecretKey } from "./secrets/secret-key.js";
import { ApiClient } from "./pkg/fetch-plus/fetch-plus.js";
import { Position } from "./typings/position-risk.js";
import { flipOrderSide } from "./util/flip-order-side.js";
import { generateLimitOrderQuery } from "./util/generate-limit-order-query.js";
import { signQuery } from "./util/sign-query.js";

export async function handleRequest(req: Request, res: Response): Promise<void> {
  const body = req.body as WebhookPayload;
  try {
    WebhookPayloadSchema.parse(body);
  } catch (e) {
    res.status(400).send(BAD_REQUEST);
    return;
  }
  const { symbol, side, quantity } = body;
  try {
    const [apiKey, secretKey] = await Promise.all([getApiKey(), getSecretKey()]);
    const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apiKey);
    const apiV2 = new ApiClient("https://testnet.binancefuture.com/fapi/v2", apiKey);
    const signedQuery = generateMarketOrderQuery(secretKey, { symbol, side, quantity });
    await api.fetch(`/order?${signedQuery}`, {
      method: "POST"
    });
    const signedPositionRiskQuery = signQuery(`symbol=${symbol}`, secretKey);
    const positionRiskResponse = await apiV2.fetch<Position[]>(`/positionRisk?${signedPositionRiskQuery}`, {
      method: "GET"
    });
    const [risk] = positionRiskResponse;
    const { entryPrice } = risk;
    let sl: number;
    let tp: number;
    if (side === "BUY") {
      sl = entryPrice * 0.50;
      tp = entryPrice * 1.50;
    } else {
      sl = entryPrice * 1.50;
      tp = entryPrice * 0.50;
    }

    const signedTPQuery = generateLimitOrderQuery(secretKey,
      { price: tp, quantity, symbol, side: flipOrderSide(side) });
    const setTp = (): Promise<void> => api.fetch(`/order?${signedTPQuery}`, {
      method: "POST"
    });

    const signedSlQuery = generateLimitOrderQuery(secretKey,
      { price: sl, quantity, symbol, side: flipOrderSide(side) });
    const setSl = (): Promise<void> => api.fetch(`/order?${signedSlQuery}`, {
      method: "POST"
    });

    await Promise.all([setTp(), setSl()]);
    res.status(200).send(OPENED_ORDER);
  } catch (e) {
    console.log(e);
    res.status(500).send(SERVER_ERROR);
  }
}

