import { createHmac } from "node:crypto";

const allowedFields = new Set([
  "name",
  "email",
  "organisation",
  "message",
  "website",
  "submissionId",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasHeaderControls(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0);
    return code <= 31 || code === 127;
  });
}

function hasMessageControls(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0);
    return code === 0 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });
}

function normalise(value) {
  return value.normalize("NFC").trim();
}

export function validateContactPayload(payload) {
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.getPrototypeOf(payload) !== Object.prototype
  ) {
    return { ok: false };
  }

  if (Object.keys(payload).some((key) => !allowedFields.has(key))) {
    return { ok: false };
  }

  for (const field of allowedFields) {
    if (typeof payload[field] !== "string") {
      return { ok: false };
    }
  }

  const name = normalise(payload.name);
  const email = normalise(payload.email).toLowerCase();
  const organisation = normalise(payload.organisation);
  const message = normalise(payload.message).replace(/\r\n?/gu, "\n");
  const submissionId = normalise(payload.submissionId);

  if (
    name.length < 1 ||
    name.length > 100 ||
    hasHeaderControls(name) ||
    email.length < 3 ||
    email.length > 254 ||
    !emailPattern.test(email) ||
    hasHeaderControls(email) ||
    organisation.length > 150 ||
    hasHeaderControls(organisation) ||
    message.length < 10 ||
    message.length > 4_000 ||
    hasMessageControls(message) ||
    !uuidPattern.test(submissionId)
  ) {
    return { ok: false };
  }

  return {
    ok: true,
    value: { name, email, organisation, message, submissionId },
  };
}

export function pseudonymousKey(secret, value) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function buildContactEmail({ senderAddress, recipientAddress, enquiry }) {
  const organisationLine = enquiry.organisation
    ? `Organisation: ${enquiry.organisation}\n`
    : "";

  return {
    senderAddress,
    content: {
      subject: "[Agila website enquiry]",
      plainText:
        `Name: ${enquiry.name}\n` +
        `Email: ${enquiry.email}\n` +
        organisationLine +
        `\nMessage:\n${enquiry.message}`,
    },
    recipients: {
      to: [{ address: recipientAddress, displayName: "Alejandro Simó" }],
      replyTo: [{ address: enquiry.email, displayName: enquiry.name }],
    },
    userEngagementTrackingDisabled: true,
  };
}
