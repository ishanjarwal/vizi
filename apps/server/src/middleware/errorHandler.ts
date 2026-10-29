import { ErrorRequestHandler } from "express";
import { config } from "../config/index.js";

/**
 * Global Express error handling middleware.
 * Prevents internal details and stack traces from leaking to clients in production.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const isDev = config.NODE_ENV !== "production";

  res.status(statusCode).json({
    error: {
      message: isDev ? err.message : "Internal Server Error",
      ...(isDev && { stack: err.stack }),
    },
  });
};
