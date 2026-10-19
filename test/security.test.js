import assert from "node:assert/strict";
import test from "node:test";
import { createTokenBucketLimiter } from "../src/middleware/tokenBucket.js";
import { sanitizeRequest } from "../src/middleware/sanitizeRequest.js";
import {
  escapeRegex,
  parsePagination,
  validateRecipePayload,
} from "../src/utils/requestValidation.js";

const responseStub = () => ({
  headers: {},
  statusCode: 200,
  body: null,
  set(name, value) {
    this.headers[name] = value;
    return this;
  },
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("token bucket spends capacity and replenishes at the configured rate", () => {
  let currentTime = 0;
  const limiter = createTokenBucketLimiter({
    capacity: 2,
    refillPerSecond: 1,
    now: () => currentTime,
  });

  const sendRequest = () => {
    const res = responseStub();
    let passed = false;
    limiter({ ip: "192.0.2.1", method: "GET" }, res, () => {
      passed = true;
    });
    return { res, passed };
  };

  assert.equal(sendRequest().passed, true);
  assert.equal(sendRequest().passed, true);
  const blocked = sendRequest();
  assert.equal(blocked.passed, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers["Retry-After"], "1");

  currentTime += 1_000;
  assert.equal(sendRequest().passed, true);
});

test("token buckets isolate keys and do not charge CORS preflight requests", () => {
  const limiter = createTokenBucketLimiter({
    capacity: 1,
    refillPerSecond: 1,
  });
  const first = responseStub();
  const second = responseStub();
  let firstPassed = false;
  let secondPassed = false;

  limiter({ ip: "192.0.2.1", method: "GET" }, first, () => {
    firstPassed = true;
  });
  limiter({ ip: "192.0.2.2", method: "GET" }, second, () => {
    secondPassed = true;
  });
  assert.equal(firstPassed, true);
  assert.equal(secondPassed, true);

  let preflightPassed = false;
  limiter({ ip: "192.0.2.1", method: "OPTIONS" }, responseStub(), () => {
    preflightPassed = true;
  });
  assert.equal(preflightPassed, true);
});

test("recipe payload validation normalizes tags and rejects unknown or malformed values", () => {
  const valid = validateRecipePayload({
    title: " Soup ",
    description: "Warm soup",
    tags: "",
    servings: 2,
    ingredients: [{ item: "Carrot", amount: "1" }],
    steps: ["Chop vegetables"],
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.value.title, "Soup");
  assert.deepEqual(valid.value.tags, []);
  assert.equal(valid.value.category, "General");

  assert.match(
    validateRecipePayload({
      title: "Soup",
      description: "Warm",
      published: true,
    }).error,
    /Unexpected field/
  );
  assert.match(
    validateRecipePayload({
      title: "Soup",
      description: "Warm",
      servings: "2",
    }).error,
    /whole number/
  );
});

test("pagination rejects zero, malformed, and excessive values", () => {
  assert.deepEqual(parsePagination({}), {
    page: 1,
    limit: 10,
    skip: 0,
  });
  assert.deepEqual(parsePagination({ page: "2", limit: "25" }), {
    page: 2,
    limit: 25,
    skip: 25,
  });
  assert.throws(() => parsePagination({ page: "0" }), /between 1/);
  assert.throws(() => parsePagination({ limit: "51" }), /between 1 and 50/);
  assert.throws(
    () => parsePagination({ page: "1e9" }),
    /positive whole number/
  );
});

test("regex escaping makes user search terms literal", () => {
  assert.equal(escapeRegex("a.*(b)"), "a\\.\\*\\(b\\)");
});

test("request sanitization removes MongoDB operator keys from body and Express 5 query", () => {
  const req = {
    body: {
      title: "Soup",
      $where: "malicious",
      nested: { "profile.name": "ignored", safe: true },
    },
  };
  Object.defineProperty(req, "query", {
    configurable: true,
    get() {
      return { q: "soup", $ne: "malicious" };
    },
  });

  let passed = false;
  sanitizeRequest(req, responseStub(), () => {
    passed = true;
  });

  assert.equal(passed, true);
  assert.deepEqual(req.body, {
    title: "Soup",
    nested: { safe: true },
  });
  assert.deepEqual(req.query, { q: "soup" });
});
