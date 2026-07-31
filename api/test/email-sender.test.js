import assert from "node:assert/strict";
import test from "node:test";
import { sendEmailToCompletion } from "../src/email-sender.js";

test("waits for a successful Azure email send operation", async () => {
  let beginOptions;
  let pollOptions;
  const client = {
    beginSend: async (_message, options) => {
      beginOptions = options;
      return {
        pollUntilDone: async (optionsForPolling) => {
          pollOptions = optionsForPolling;
          return { id: "operation-id", status: "Succeeded" };
        },
      };
    },
  };

  const result = await sendEmailToCompletion(
    client,
    { content: { subject: "Test" } },
    "submission-id",
  );

  assert.deepEqual(beginOptions, { operationId: "submission-id" });
  assert.equal(pollOptions.abortSignal instanceof AbortSignal, true);
  assert.equal(result.status, "Succeeded");
});

test("rejects an Azure email operation that does not succeed", async () => {
  const client = {
    beginSend: async () => ({
      pollUntilDone: async () => ({ status: "Failed" }),
    }),
  };

  await assert.rejects(
    sendEmailToCompletion(client, {}, "submission-id"),
    /did not succeed/,
  );
});
