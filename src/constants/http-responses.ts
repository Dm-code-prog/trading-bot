export const BAD_REQUEST = {
  status: 400,
  message: "Invalid request"
};

export const SERVER_ERROR = {
  status: 500,
  message: "Internal server error"
};

export const NO_KEYS = {
  status: 500,
  message: 'Could not retrieve API and Secret keys'
}

export const OPENED_ORDER = {
  status: 200,
  message: "Opened new order on Binance"
};

export const CLOSED_ORDER = {
  status: 200,
  message: "Closed an order on Binance"
};

export const NOT_FOUND = {
  status: 404,
  message: "Unsupported method"
}

export const NO_ORDER = {
  status: 500,
  message: "Could not open market order, aborting"
}
