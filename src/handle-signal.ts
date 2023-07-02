import { Request, Response } from '@google-cloud/functions-framework';
import { WebhookPayload } from './typings/webhook-payload.typings.js';
import { WebhookPayloadSchema } from './pkg/zod/webhook-payload.schema.js';
import { Logger } from './models/logger.model.js';

import { flipOrderSide } from './util/flip-order-side.js';
import { BTC_AFTER_COMMA_DIGITS, SIDES } from './constants/trading.js';
import { MarketOrder } from './models/market-order.model.js';
import { Order } from './models/order.model.js';
import { StopOrder } from './models/stop-order.model.js';
import fetch from 'node-fetch';
import { DISPOSER_IP } from './constants/services.js';
import { TrailingStopOrder } from './models/trailing-stop-order.js';
import { ZodError } from 'zod';

export async function handleSignal(req: Request, res: Response): Promise<void> {
  const logger = new Logger('yahastik-bot', 'dev');

  const body = req.body as WebhookPayload;
  try {
    WebhookPayloadSchema.parse(body);
  } catch (e) {
    const error = e as ZodError;
    if (error.issues && Array.isArray(error.issues)) {
      const issue = error.issues[0];
      if (issue.message && issue.path) {
        res.status(400).send({
          status: 400,
          message: `${issue.path}: ${issue.message}`,
        });
      }
    } else {
      res.status(400).send({
        status: 400,
        message: 'Invalid request: the schema you provided is not correct.',
      });
    }

    return;
  }

  const {
    side,
    quantity,
    stop_loss_percent,
    take_profit_percent,
    api_key,
    secret_key,
  } = body;

  let sl: string;
  let tp: string;

  const slPercent = stop_loss_percent ? stop_loss_percent : 1;
  const tpPercent = take_profit_percent ? take_profit_percent : 1;

  let entryPrice: number;
  let rollBackMarket: () => Promise<void>;

  const ctx = {
    market: false,
    tp: false,
    sl: false,
  };

  try {
    const positionAmt = await Order.getPositionSize(api_key, secret_key);

    if (positionAmt !== 0) {
      res.status(400).send({
        status: 400,
        message:
          'Bad request: we allow only one position to be open at once for a given trading symbol.',
      });
      return;
    }
  } catch (e) {
    res.status(500).send({
      status: 500,
      message:
        'Server error, we were unable to check your current positions, to safely open a new one.',
    });
  }

  const disposerReq = await fetch(
    `http://${DISPOSER_IP}/api/listen-and-clean`,
    {
      method: 'POST',
      body: JSON.stringify({ user: 'root' }),
    },
  );

  if (!disposerReq.ok) {
    res.status(500).send({
      status: 500,
      message:
        'Server error: we were unable to turn on enhanced protection for your order.',
    });
    logger.error(
      `encountered error from disposer, received status ${res.status}.`,
    );
    return;
  }

  try {
    const order = new MarketOrder()
      .creds(api_key, secret_key)
      .quant(quantity)
      .side(side)
      .callback(() => {
        ctx.market = true;
      });

    const { rollback, entryPrice: ep } = await order.verify().send();

    rollBackMarket = rollback;
    entryPrice = ep;
  } catch (e) {
    logger.error(e);
    res.status(500).send({
      status: 500,
      message:
        'Server error: we were unable to open a positon on Binance, please try again later.',
    });
    return;
  }

  try {
    if (side === SIDES.buy) {
      sl = (entryPrice * (1 - slPercent * 0.01)).toFixed(
        BTC_AFTER_COMMA_DIGITS,
      );
      tp = (entryPrice * (1 + tpPercent * 0.01)).toFixed(
        BTC_AFTER_COMMA_DIGITS,
      );
    } else {
      sl = (entryPrice * (1 + slPercent * 0.01)).toFixed(
        BTC_AFTER_COMMA_DIGITS,
      );
      tp = (entryPrice * (1 - tpPercent * 0.01)).toFixed(
        BTC_AFTER_COMMA_DIGITS,
      );
    }

    const stopOrder = new StopOrder()
      .creds(api_key, secret_key)
      .quant(quantity)
      .side(flipOrderSide(side))
      .price(sl)
      .callback(() => {
        ctx.sl = true;
      });

    const takeOrder = new TrailingStopOrder()
      .creds(api_key, secret_key)
      .quant(quantity)
      .side(flipOrderSide(side))
      .activationPrice(tp)
      .callback(() => {
        ctx.tp = true;
      });

    await Promise.all([stopOrder.send(), takeOrder.send()]);
    res.status(200).send({
      status: 204,
      message: `Successfully opened new position with entry price: ${entryPrice}, 
                stop-loss order with price: ${sl} and trailing stop order with activation price: ${tp} 
       `,
    });
  } catch (e) {
    logger.log(`Were unable to set tp and sl, encounered error: ${e}`);
    const { market, tp, sl } = ctx;

    if (market && (!sl || !tp)) {
      await Order.deleteAll(api_key, secret_key);
      await rollBackMarket();
    }
    res.status(500).send({
      status: 500,
      message: `Server error: we successfully opened a position, but were unable to set stop-loss and take profit.
                Open futures positions without a stop-loss and a take-profit are very dangerous, so we closed it immediately.
              `,
    });
  }
}
