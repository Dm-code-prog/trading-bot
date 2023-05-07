import { ErrorMessage } from "../typings/error-message.typings.js";

export const generateErrorMessage = (httpCode, msg): ErrorMessage => {
  return {
    status: httpCode,
    message: msg
  };
};
