export const BAD_REQUEST = {
  status: 400,
  message: "Invalid request"
};

export const SERVER_ERROR = {
  status: 500,
  message: "Could not sign the query with the private key"
};

export const OPENED_ORDER = {
  status: 200,
  message: "Opened new order on Binance"
};

export const CLOSED_ORDER = {
  status: 200,
  message: "Closed an order on Binance"
};
