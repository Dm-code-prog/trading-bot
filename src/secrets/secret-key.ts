import { sleep } from "../util/sleep.js";

export const SECRET_KEY = "618a0b025b69094170aace8b3ed344d1449f22bae9afab2d3ca2ff74e13d1818";

export async function getSecretKey(): Promise<string> {
  await sleep(100);
  return SECRET_KEY;
}
