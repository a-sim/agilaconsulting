import assert from "node:assert/strict";
import test from "node:test";
import { createContactHandler } from "../src/contact-handler.js";
import { pseudonymousKey } from "../src/contact-message.js";

const validPayload = {
  name: "Site Visitor",
  email: "visitor@example.com",
  organisation: "Example",
  message: "We need help with a transformation programme.",
  website: "",
  submissionId: "3db65574-e8d3-4bdf-99b0-8b4af109e8e4",
};

function request(payload = validPayload, overrides = {}) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const headers = new Headers({
    "content-type": "application/json",
    origin: "https://agilaconsult.com",
    "sec-fetch-site": "same-origin",
    "x-forwarded-for": "192.0.2.12, 10.0.0.1",
    ...overrides.headers,
  });

  return {
    method: overrides.method ?? "POST",
    headers,
    text: async () => text,
  };
}

function dependencies(overrides = {}) {
  const sent = [];
  const logs = [];
  const limiter = {
    reserve: async () => ({
      allowed: true,
      duplicate: false,
      reservations: ["one", "two", "three"],
    }),
    markSent: async () => {},
    release: async () => {},
  };

  return {
    sent,
    logs,
    limiter,
    values: {
      senderAddress: "DoNotReply@example.azurecomm.net",
      rateLimitSecret: "a-long-random-secret",
      limiter,
      sendEmail: async (...args) => sent.push(args),
      log: (entry) => logs.push(entry),
      ...overrides,
    },
  };
}

test("accepts one valid enquiry with fixed delivery fields", async () => {
  const deps = dependencies();
  const handler = createContactHandler(deps.values);
  const result = await handler(request());

  assert.equal(result.status, 202);
  assert.deepEqual(result.jsonBody, { ok: true });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(result.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(deps.sent.length, 1);
  assert.equal(deps.sent[0][0].recipients.to[0].address, "alejandro@agilaconsult.com");
  assert.equal(deps.sent[0][0].senderAddress, "DoNotReply@example.azurecomm.net");
  assert.equal(deps.sent[0][0].recipients.replyTo[0].address, "visitor@example.com");
  assert.equal(deps.sent[0][1], validPayload.submissionId);
  assert.equal(deps.logs.some((entry) => /Site Visitor|visitor@example/.test(entry)), false);
});

test("uses the trusted Azure client address for pseudonymous limits", async () => {
  let reservedSourceKey = "";
  const deps = dependencies({
    limiter: {
      reserve: async ({ sourceKey }) => {
        reservedSourceKey = sourceKey;
        return { allowed: true, duplicate: false, reservations: [] };
      },
      markSent: async () => {},
      release: async () => {},
    },
  });
  const handler = createContactHandler(deps.values);
  const result = await handler(
    request(validPayload, {
      headers: {
        "x-client-ip": "198.51.100.24",
        "x-forwarded-for": "203.0.113.99, 10.0.0.1",
      },
    }),
  );

  assert.equal(result.status, 202);
  assert.equal(
    reservedSourceKey,
    pseudonymousKey("a-long-random-secret", "address:198.51.100.24"),
  );
});

test("falls back to the validated email when Azure omits client headers", async () => {
  let reservedSourceKey = "";
  const deps = dependencies({
    limiter: {
      reserve: async ({ sourceKey }) => {
        reservedSourceKey = sourceKey;
        return { allowed: true, duplicate: false, reservations: [] };
      },
      markSent: async () => {},
      release: async () => {},
    },
  });
  const handler = createContactHandler(deps.values);
  const result = await handler(
    request(validPayload, {
      headers: { "x-client-ip": "", "x-forwarded-for": "" },
    }),
  );

  assert.equal(result.status, 202);
  assert.equal(
    reservedSourceKey,
    pseudonymousKey("a-long-random-secret", "email:visitor@example.com"),
  );
});

test("silently accepts honeypot submissions without sending", async () => {
  let reserved = false;
  const deps = dependencies({
    limiter: {
      reserve: async () => {
        reserved = true;
      },
    },
  });
  const handler = createContactHandler(deps.values);
  const result = await handler(request({ ...validPayload, website: "spam.test" }));

  assert.equal(result.status, 202);
  assert.equal(deps.sent.length, 0);
  assert.equal(reserved, false);
});

test("rejects wrong method, origin, fetch site, media type and oversized bodies", async () => {
  const deps = dependencies();
  const handler = createContactHandler(deps.values);

  assert.equal((await handler(request(validPayload, { method: "GET" }))).status, 405);
  assert.equal(
    (
      await handler(
        request(validPayload, { headers: { origin: "https://attacker.test" } }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        request(validPayload, { headers: { "sec-fetch-site": "cross-site" } }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler(
        request(validPayload, { headers: { "content-type": "text/plain" } }),
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await handler(
        request(validPayload, { headers: { "content-length": "40000" } }),
      )
    ).status,
    413,
  );
  assert.equal((await handler(request("{"))).status, 400);
  assert.equal(deps.sent.length, 0);
});

test("maps durable throttling and provider failures without leaking details", async () => {
  let released = [];
  const limited = dependencies({
    limiter: {
      reserve: async () => ({ allowed: false, retryAfter: 321 }),
      markSent: async () => {},
      release: async () => {},
    },
  });
  const limitedResult = await createContactHandler(limited.values)(request());
  assert.equal(limitedResult.status, 429);
  assert.equal(limitedResult.headers["Retry-After"], "321");

  const failed = dependencies({
    sendEmail: async () => {
      throw new Error("provider secret detail");
    },
    limiter: {
      reserve: async () => ({
        allowed: true,
        duplicate: false,
        reservations: ["one", "two"],
      }),
      markSent: async () => {},
      release: async (ids) => {
        released = ids;
      },
    },
  });
  const failedResult = await createContactHandler(failed.values)(request());
  assert.equal(failedResult.status, 502);
  assert.deepEqual(failedResult.jsonBody, { error: "delivery_unavailable" });
  assert.deepEqual(released, ["one", "two"]);
  assert.doesNotMatch(JSON.stringify(failedResult), /provider secret detail/);
});

test("fails closed when configuration or the limiter is unavailable", async () => {
  const missing = dependencies({ rateLimitSecret: "" });
  assert.equal((await createContactHandler(missing.values)(request())).status, 503);

  const unavailable = dependencies({
    limiter: {
      reserve: async () => {
        throw new Error("store unavailable");
      },
      markSent: async () => {},
      release: async () => {},
    },
  });
  assert.equal((await createContactHandler(unavailable.values)(request())).status, 503);
});
