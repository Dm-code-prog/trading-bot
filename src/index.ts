import functions from "@google-cloud/functions-framework";
import { handleRequest } from "./handle-request.js";

functions.http("trading-bot-proto", handleRequest);
