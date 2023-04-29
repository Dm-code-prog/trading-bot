import { getApiKey } from "../secrets/api-key.js";
import { getSecretKey } from "../secrets/secret-key.js";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus.js";
import { generateMarketOrderQuery } from "../util/generate-market-order-query.js";
import { signQuery } from "../util/sign-query.js";
import { Position } from "../typings/position-risk.js";
import { flipOrderSide } from "../util/flip-order-side.js";
import { generateStopOrderQuery } from "../util/generate-stop-order-query";
import { generateLimitOrderQuery } from "../util/generate-limit-order-query";

test("market_order_with_tp_and_sl", async () => {
  const symbol = "BTCUSDT";
  const quantity = 0.01;
  const side = "SELL";

  const [apiKey, secretKey] = await Promise.all([getApiKey(), getSecretKey()]);
  const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", apiKey);
  const apiV2 = new ApiClient("https://testnet.binancefuture.com/fapi/v2", apiKey);
  const signedQuery = generateMarketOrderQuery(secretKey, { symbol, side, quantity });
  await api.fetch(`/order?${signedQuery}`, {
    method: "POST"
  });

  console.log("done with market order");

  const signedPositionRiskQuery = signQuery(`symbol=${symbol}`, secretKey);
  const positionRiskResponse = await apiV2.fetch<Position[]>(`/positionRisk?${signedPositionRiskQuery}`, {
    method: "GET"
  });

  const [risk] = positionRiskResponse;
  const { entryPrice } = risk;

  let sl: string;
  let tp: string;
  let stopTrogger;
  // @ts-ignore
  if (side === "BUY") {
    sl = (entryPrice * 0.999).toFixed(1);
    tp = (entryPrice * 1.001).toFixed(1);
  } else {
    sl = (entryPrice * 1.001).toFixed(1);
    tp = (entryPrice * 0.999).toFixed(1);
    stopTrogger = (entryPrice * 1.001 + 10).toFixed(1);
  }


  const signedTPQuery = generateLimitOrderQuery(secretKey,
    { price: tp, quantity, symbol, side: flipOrderSide(side) });
  const setTp = (): Promise<void> => api.fetch(`/order?${signedTPQuery}`, {
    method: "POST"
  });

  const signedSlQuery = generateStopOrderQuery(secretKey,
    { price2: stopTrogger, price: sl, quantity, symbol, side: flipOrderSide(side) });
  const setSl = (): Promise<void> => api.fetch(`/order?${signedSlQuery}`, {
    method: "POST"
  });

  await Promise.all([setSl(), setTp()]);
  console.log("done with sl and tp");
}, 20 * 1000);
