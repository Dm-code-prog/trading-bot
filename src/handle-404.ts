import { NOT_FOUND } from "./constants/http-responses.js";
import type { Response } from "@google-cloud/functions-framework";

export async function handle404(_, res: Response): Promise<void> {
  res.status(404).send(NOT_FOUND);
}
