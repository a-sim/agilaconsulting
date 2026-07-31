import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContactEmail,
  pseudonymousKey,
  validateContactPayload,
} from "../src/contact-message.js";

const validPayload = {
  name: "Alejandro Visitor",
  email: "Visitor@Example.com",
  organisation: "Example S.à r.l.",
  message: "We need help with a practical transformation challenge.",
  website: "",
  submissionId: "3db65574-e8d3-4bdf-99b0-8b4af109e8e4",
};

test("normalises and validates the exact contact payload", () => {
  const result = validateContactPayload(validPayload);

  assert.equal(result.ok, true);
  assert.equal(result.value.email, "visitor@example.com");
  assert.equal(result.value.name, "Alejandro Visitor");
});

test("rejects unexpected fields, invalid boundaries and header controls", () => {
  assert.equal(
    validateContactPayload({ ...validPayload, recipient: "attacker@example.com" }).ok,
    false,
  );
  assert.equal(validateContactPayload({ ...validPayload, name: "" }).ok, false);
  assert.equal(
    validateContactPayload({ ...validPayload, name: "A".repeat(101) }).ok,
    false,
  );
  assert.equal(
    validateContactPayload({ ...validPayload, email: "bad\r\nBcc: x@y.com" }).ok,
    false,
  );
  assert.equal(
    validateContactPayload({ ...validPayload, message: "short" }).ok,
    false,
  );
  assert.equal(
    validateContactPayload({ ...validPayload, message: "A".repeat(4_001) }).ok,
    false,
  );
  assert.equal(validateContactPayload([]).ok, false);
});

test("builds a fixed-recipient plain-text ACS message", () => {
  const enquiry = validateContactPayload(validPayload).value;
  const email = buildContactEmail({
    senderAddress: "DoNotReply@example.azurecomm.net",
    recipientAddress: "alejandro.simo@agilaconsult.com",
    enquiry,
  });

  assert.equal(email.senderAddress, "DoNotReply@example.azurecomm.net");
  assert.equal(email.content.subject, "[Agila website enquiry]");
  assert.match(email.content.plainText, /Alejandro Visitor/);
  assert.deepEqual(email.recipients.to, [
    { address: "alejandro.simo@agilaconsult.com", displayName: "Alejandro Simó" },
  ]);
  assert.deepEqual(email.recipients.replyTo, [
    { address: "visitor@example.com", displayName: "Alejandro Visitor" },
  ]);
  assert.equal(email.recipients.cc, undefined);
  assert.equal(email.recipients.bcc, undefined);
  assert.equal(email.content.html, undefined);
  assert.equal(email.userEngagementTrackingDisabled, true);
});

test("pseudonymous keys are deterministic and secret-dependent", () => {
  assert.equal(pseudonymousKey("secret", "192.0.2.1").length, 64);
  assert.equal(
    pseudonymousKey("secret", "192.0.2.1"),
    pseudonymousKey("secret", "192.0.2.1"),
  );
  assert.notEqual(
    pseudonymousKey("secret", "192.0.2.1"),
    pseudonymousKey("different", "192.0.2.1"),
  );
});
