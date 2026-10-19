import mongoose from "mongoose";
import { RequestError } from "./requestValidation.js";

export const sendControllerError = (req, res, error, operation) => {
  if (error instanceof RequestError) {
    return res.status(error.status).json({
      error: "Validation",
      message: error.message,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: "Validation",
      message: "One or more fields are invalid.",
    });
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      error: "Conflict",
      message: "A record with the supplied unique value already exists.",
    });
  }

  console.error(`${operation} failed:`, {
    requestId: req.requestId,
    error,
  });
  return res.status(500).json({
    error: "Internal server error",
    message: "An unexpected error occurred.",
    requestId: req.requestId,
  });
};
