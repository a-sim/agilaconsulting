import { randomUUID } from "node:crypto";
import {
  buildContactEmail,
  pseudonymousKey,
  validateContactPayload,
} from "./contact-message.js";

const maximumBodyBytes = 32 * 1_024;
const recipientAddress = "alejandro@agilaconsult.com";
const allowedOrigins = new Set([
  "https://agilaconsult.com",
  "https://www.agilaconsult.com",
]);

function response(status, body, extraHeaders = {}) {
  return {
    status,
    jsonBody: body,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  };
}

function sourceAddress(request) {
  const clientAddress =
    request.headers.get("x-client-ip") ?? request.headers.get("client-ip");
  if (clientAddress?.trim()) {
    return clientAddress.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",").at(-1)?.trim() ?? "";
}

export function createContactHandler({
  senderAddress,
  rateLimitSecret,
  limiter,
  sendEmail,
  log = () => {},
}) {
  return async function contactHandler(request) {
    const correlationId = randomUUID();
    const record = (outcome) => log(`contact outcome=${outcome} correlation=${correlationId}`);

    if (request.method !== "POST") {
      record("method_rejected");
      return response(405, { error: "method_not_allowed" }, { Allow: "POST" });
    }

    const origin = request.headers.get("origin") ?? "";
    if (!allowedOrigins.has(origin)) {
      record("origin_rejected");
      return response(403, { error: "request_rejected" });
    }

    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") {
      record("fetch_site_rejected");
      return response(403, { error: "request_rejected" });
    }

    const contentType = request.headers.get("content-type")?.split(";", 1)[0];
    if (contentType !== "application/json") {
      record("media_type_rejected");
      return response(415, { error: "unsupported_media_type" });
    }

    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maximumBodyBytes) {
      record("body_too_large");
      return response(413, { error: "request_too_large" });
    }

    let rawBody;
    let payload;
    try {
      rawBody = await request.text();
      if (Buffer.byteLength(rawBody, "utf8") > maximumBodyBytes) {
        record("body_too_large");
        return response(413, { error: "request_too_large" });
      }
      payload = JSON.parse(rawBody);
    } catch {
      record("malformed_json");
      return response(400, { error: "invalid_request" });
    }

    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      typeof payload.website === "string" &&
      payload.website.trim()
    ) {
      record("honeypot_suppressed");
      return response(202, { ok: true });
    }

    const validation = validateContactPayload(payload);
    if (!validation.ok) {
      record("validation_rejected");
      return response(400, { error: "invalid_request" });
    }

    const address = sourceAddress(request);
    if (!senderAddress || !rateLimitSecret || !address || !limiter || !sendEmail) {
      record("configuration_unavailable");
      return response(503, { error: "service_unavailable" });
    }

    const sourceKey = pseudonymousKey(rateLimitSecret, address);
    const duplicateKey = pseudonymousKey(
      rateLimitSecret,
      `${sourceKey}\n${validation.value.email}\n${validation.value.message}`,
    );

    let reservation;
    try {
      reservation = await limiter.reserve({ sourceKey, duplicateKey });
    } catch {
      record("limiter_unavailable");
      return response(503, { error: "service_unavailable" });
    }

    if (!reservation.allowed) {
      record("rate_limited");
      return response(
        429,
        { error: "too_many_requests" },
        { "Retry-After": String(reservation.retryAfter ?? 900) },
      );
    }

    if (reservation.duplicate) {
      record("duplicate_suppressed");
      return response(202, { ok: true });
    }

    const email = buildContactEmail({
      senderAddress,
      recipientAddress,
      enquiry: validation.value,
    });

    try {
      await sendEmail(email, validation.value.submissionId);
      try {
        await limiter.markSent(duplicateKey);
      } catch {
        record("dedupe_write_failed");
      }
      record("accepted");
      return response(202, { ok: true });
    } catch {
      await limiter.release(reservation.reservations ?? []);
      record("provider_failed");
      return response(502, { error: "delivery_unavailable" });
    }
  };
}
