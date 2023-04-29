import { generateLimitOrderQuery } from "../util/generate-limit-order-query";
import { SECRET_KEY } from "../secrets/secret-key";
import { ApiClient } from "../pkg/fetch-plus/fetch-plus";
import { API_KEY } from "../secrets/api-key";


test("tp", async () => {
  const api = new ApiClient("https://testnet.binancefuture.com/fapi/v1", API_KEY);

  const signedTPQuery = generateLimitOrderQuery(SECRET_KEY,
    { price: 4, quantity: 20, symbol: "ADAUSDT", side: "SELL" });
  await api.fetch(`/order?${signedTPQuery}`, {
    method: "POST"
  });
});
