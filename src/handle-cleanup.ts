import { getApiKey } from "./secrets/api-key.js";
import { getSecretKey } from "./secrets/secret-key.js";
import { CLOSED_ORDER, SERVER_ERROR } from "./constants/http-responses.js";
import { Order } from "./models/order.model.js";

import type { Request, Response } from "@google-cloud/functions-framework";


export async function handleCleanup(_: Request, res: Response): Promise<void> {
  try {
    const [apiKey, secretKey] = await Promise.all([getApiKey(), getSecretKey()]);
    await Order.deleteAll(apiKey, secretKey)
    res.status(200).send(CLOSED_ORDER)
  } catch (e) {
    res.status(500).send(SERVER_ERROR);
    return;
  }
}
