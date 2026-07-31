import { EmailClient } from "@azure/communication-email";
import { CosmosClient } from "@azure/cosmos";
import { app } from "@azure/functions";
import { createContactHandler } from "../contact-handler.js";
import { CosmosRateLimiter } from "../cosmos-rate-limiter.js";

const emailConnectionString =
  process.env.COMMUNICATION_SERVICES_CONNECTION_STRING ?? "";
const cosmosConnectionString =
  process.env.CONTACT_RATE_LIMIT_COSMOS_CONNECTION_STRING ?? "";
const senderAddress = process.env.CONTACT_SENDER_ADDRESS ?? "";
const rateLimitSecret = process.env.CONTACT_RATE_LIMIT_SECRET ?? "";

const emailClient = emailConnectionString
  ? new EmailClient(emailConnectionString)
  : null;
const cosmosContainer = cosmosConnectionString
  ? new CosmosClient(cosmosConnectionString)
      .database("agila-contact")
      .container("rate-limits")
  : null;
const limiter = cosmosContainer ? new CosmosRateLimiter(cosmosContainer) : null;

app.http("contact", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "contact",
  handler: async (request, context) => {
    const handler = createContactHandler({
      senderAddress,
      rateLimitSecret,
      limiter,
      sendEmail: emailClient
        ? async (message, operationId) => {
            await emailClient.beginSend(message, { operationId });
          }
        : null,
      log: (entry) => context.log(entry),
    });
    return handler(request);
  },
});
