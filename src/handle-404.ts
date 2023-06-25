import type { Response } from '@google-cloud/functions-framework';

export async function handle404(_, res: Response): Promise<void> {
  res.status(404).send({
    status: 404,
    message: 'This path does not exist, to send a signal use /signal',
  });
}
