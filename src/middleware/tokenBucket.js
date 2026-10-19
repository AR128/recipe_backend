const MAX_BUCKETS = 50_000;
const CLEANUP_INTERVAL = 1_000;
const STALE_BUCKET_AGE_MS = 60 * 60 * 1000;

export const createTokenBucketLimiter = ({
  capacity,
  refillPerSecond,
  keyGenerator = (req) => req.ip || "unknown",
  message = "Too many requests. Please try again later.",
  now = Date.now,
}) => {
  if (
    !Number.isFinite(capacity) ||
    capacity < 1 ||
    !Number.isFinite(refillPerSecond) ||
    refillPerSecond <= 0
  ) {
    throw new Error("Token bucket capacity and refill rate must be positive.");
  }

  const buckets = new Map();
  let requestsSinceCleanup = 0;

  const cleanup = (currentTime) => {
    for (const [key, bucket] of buckets) {
      if (currentTime - bucket.lastSeenAt > STALE_BUCKET_AGE_MS) {
        buckets.delete(key);
      }
    }

    while (buckets.size > MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      buckets.delete(oldestKey);
    }
  };

  return (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const key = keyGenerator(req);
    if (typeof key !== "string" || !key) {
      return next(new Error("Rate-limit key generation failed."));
    }

    const currentTime = now();
    const previous = buckets.get(key) || {
      tokens: capacity,
      updatedAt: currentTime,
      lastSeenAt: currentTime,
    };
    const elapsedSeconds = Math.max(0, currentTime - previous.updatedAt) / 1000;
    const tokens = Math.min(
      capacity,
      previous.tokens + elapsedSeconds * refillPerSecond
    );
    const bucket = {
      tokens,
      updatedAt: currentTime,
      lastSeenAt: currentTime,
    };

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= CLEANUP_INTERVAL) {
      cleanup(currentTime);
      requestsSinceCleanup = 0;
    }

    if (tokens < 1) {
      buckets.set(key, bucket);
      const retryAfter = Math.max(1, Math.ceil((1 - tokens) / refillPerSecond));
      res.set("Retry-After", String(retryAfter));
      res.set(
        "RateLimit-Policy",
        `${capacity};w=${Math.ceil(capacity / refillPerSecond)}`
      );
      res.set(
        "RateLimit",
        `limit=${capacity}, remaining=0, reset=${retryAfter}`
      );
      return res.status(429).json({
        error: "Too Many Requests",
        message,
        retryAfter,
      });
    }

    bucket.tokens = tokens - 1;
    buckets.set(key, bucket);
    res.set(
      "RateLimit-Policy",
      `${capacity};w=${Math.ceil(capacity / refillPerSecond)}`
    );
    res.set(
      "RateLimit",
      `limit=${capacity}, remaining=${Math.floor(bucket.tokens)}, reset=${Math.ceil(
        (capacity - bucket.tokens) / refillPerSecond
      )}`
    );
    return next();
  };
};

export const coarseApiLimiter = createTokenBucketLimiter({
  capacity: 300,
  refillPerSecond: 5,
  message: "API request limit reached. Please wait before retrying.",
});

export const publicContentLimiter = createTokenBucketLimiter({
  capacity: 240,
  refillPerSecond: 4,
  message: "Content request limit reached. Please try again shortly.",
});

export const searchLimiter = createTokenBucketLimiter({
  capacity: 10,
  refillPerSecond: 0.5,
  message: "Search limit reached. Please wait before searching again.",
});

export const commentReadLimiter = createTokenBucketLimiter({
  capacity: 30,
  refillPerSecond: 1,
  message: "Comment request limit reached. Please try again shortly.",
});

export const userWriteLimiter = createTokenBucketLimiter({
  capacity: 12,
  refillPerSecond: 0.5,
  keyGenerator: (req) => req.user?.id || `ip:${req.ip || "unknown"}`,
  message: "Write limit reached. Please wait before trying again.",
});

export const commentCreateLimiter = createTokenBucketLimiter({
  capacity: 2,
  refillPerSecond: 1 / 12,
  keyGenerator: (req) => req.user?.id || `ip:${req.ip || "unknown"}`,
  message: "You are posting comments too quickly. Please wait before retrying.",
});

export const uploadIpLimiter = createTokenBucketLimiter({
  capacity: 6,
  refillPerSecond: 1 / 600,
  message: "Upload limit reached for this network. Please try again later.",
});

export const uploadUserLimiter = createTokenBucketLimiter({
  capacity: 3,
  refillPerSecond: 1 / 1200,
  keyGenerator: (req) => req.user?.id || `ip:${req.ip || "unknown"}`,
  message: "Upload limit reached. Please try again later.",
});
