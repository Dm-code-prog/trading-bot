import crypto from 'crypto';
import { Firestore } from '@google-cloud/firestore';

import type { Request, Response } from '@google-cloud/functions-framework';

import { HTTP_PATHS } from './constants/http-paths.js';
import { handleSignal } from './handle-signal.js';
import { handle404 } from './handle-404.js';
import { handlePing } from './handle-ping.js';
import { handleCleanup } from './handle-cleanup.js';

const firestore = new Firestore({
  projectId: 'yahastik-bot',
});

export async function multiplexer(req: Request, res: Response): Promise<void> {
  const api_key = req.body.api_key;
  const secret_key = req.body.secret_key;

  if (!api_key || !secret_key) {
    res.status(401).send({
      status: 401,
      message: 'Unauthorized: the credentials you provided are insufficient.',
    });
    return;
  }

  const hashedApiKey = crypto
    .createHash('sha256')
    .update(api_key)
    .digest('hex');

  const hashedSecretKey = crypto
    .createHash('sha256')
    .update(secret_key)
    .digest('hex');

  const result = await firestore
    .collection('yahastik-bot-collection')
    .where('secret_key', '==', hashedSecretKey)
    .where('api_key', '==', hashedApiKey)
    .get();

  if (result.empty) {
    res.status(401).send({
      status: 401,
      message: 'Unauthorized: the credentials you provided are invalid.',
    });
    return;
  }

  const { signal, ping, cleanup } = HTTP_PATHS;
  switch (req.path) {
    case signal:
      return handleSignal(req, res);
    case ping:
      return handlePing(req, res);
    case cleanup:
      return handleCleanup(req, res);
    default:
      return handle404(req, res);
  }
}
