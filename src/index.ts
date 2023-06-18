import 'dotenv/config'
import functions from "@google-cloud/functions-framework";
import { multiplexer } from "./multiplexer.js";


functions.http("tbot", multiplexer);
