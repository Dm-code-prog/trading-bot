import { Order } from './models/order.model.js';

import type { Request, Response } from '@google-cloud/functions-framework';
import { WebhookPayload } from './typings/webhook-payload.typings.js';
import { MarketOrder } from './models/market-order.model.js';
import { flipOrderSide } from './util/flip-order-side.js';

export async function handleClosePosition(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as WebhookPayload;
  try {
    const { api_key, secret_key } = body;
    const { positionAmount, positionSide } = await Order.getPosition(
      api_key,
      secret_key,
    );

    const order = new MarketOrder()
      .creds(api_key, secret_key)
      .quant(positionAmount)
      .side(flipOrderSide(positionSide))
      .verify();

    if (positionAmount !== 0) {
      await order.send();
    }

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
