import { sleep } from "../util/sleep.js";


export const API_KEY = "5650abcace12c40a0a44e08471cd37f86e6c23a34230a9554c148ef41e806312";

export async function getApiKey(): Promise<string> {
  await sleep(100);
  return API_KEY;
}
