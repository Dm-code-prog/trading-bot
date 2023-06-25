import type { Response } from '@google-cloud/functions-framework';

export async function handlePing(_, res: Response): Promise<void> {
  res.status(200).send({
    status: 200,
    message: 'pong',
  });
}
