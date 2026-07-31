const sendTimeoutMilliseconds = 45_000;

export async function sendEmailToCompletion(client, message, operationId) {
  const poller = await client.beginSend(message, { operationId });
  const result = await poller.pollUntilDone({
    abortSignal: AbortSignal.timeout(sendTimeoutMilliseconds),
  });

  if (result?.status !== "Succeeded") {
    throw new Error("Email send operation did not succeed");
  }

  return result;
}
