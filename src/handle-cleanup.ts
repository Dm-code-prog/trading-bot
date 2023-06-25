import { Order } from './models/order.model.js';

import type { Request, Response } from '@google-cloud/functions-framework';
import { WebhookPayload } from './typings/webhook-payload.typings.js';

export async function handleCleanup(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as WebhookPayload;
  try {
    const { api_key, secret_key } = body;
    await Order.deleteAll(api_key, secret_key);
    res.status(200).send({
      status: 200,
      message: 'Closed all open orders',
    });
  } catch (e) {
    res.status(500).send({
      status: 500,
      message: 'Server error: could not close all open orders.',
    });
    return;
  }
}
