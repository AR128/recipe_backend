import mongoSanitize from "express-mongo-sanitize";

export const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }

  const query = req.query;
  if (query && typeof query === "object") {
    Object.defineProperty(req, "query", {
      configurable: true,
      enumerable: true,
      value: mongoSanitize.sanitize({ ...query }),
      writable: true,
    });
  }

  return next();
};
