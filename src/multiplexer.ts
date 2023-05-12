import { Request, Response } from "@google-cloud/functions-framework";
import { HTTP_PATHS } from "./constants/http-paths.js";
import { handleSignal } from "./handle-signal.js";
import { handle404 } from "./handle-404.js";
import { handlePing } from "./handle-ping.js";
import { handleCleanup } from "./handle-cleanup.js";

export async function multiplexer(req: Request, res: Response): Promise<void> {
  const { signal, ping, cleanup } = HTTP_PATHS;
  switch (req.path) {
    case signal:
      return handleSignal(req, res);
    case ping:
      return handlePing(req, res)
    case cleanup:
      return handleCleanup(req, res)
    default:
      return handle404(req, res);
  }
}
