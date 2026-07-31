import assert from "node:assert/strict";
import test from "node:test";
import { CosmosRateLimiter } from "../src/cosmos-rate-limiter.js";

function cosmosError(code) {
  return Object.assign(new Error(String(code)), { code });
}

function fakeContainer() {
  const records = new Map();
  let revision = 0;

  return {
    records,
    items: {
      create: async (item) => {
        if (records.has(item.id)) {
          throw cosmosError(409);
        }
        revision += 1;
        records.set(item.id, { ...item, _etag: String(revision) });
      },
    },
    item(id) {
      return {
        read: async () => {
          const resource = records.get(id);
          if (!resource) {
            throw cosmosError(404);
          }
          return { resource: { ...resource } };
        },
        replace: async (replacement, options) => {
          const current = records.get(id);
          if (!current) {
            throw cosmosError(404);
          }
          if (options?.accessCondition?.condition !== current._etag) {
            throw cosmosError(412);
          }
          revision += 1;
          records.set(id, { ...replacement, _etag: String(revision) });
        },
      };
    },
  };
}

test("enforces atomic source windows and resets expired counters", async () => {
  let now = 1_800_000_000_000;
  const container = fakeContainer();
  const limiter = new CosmosRateLimiter(container, () => now);

  for (let index = 0; index < 3; index += 1) {
    assert.equal(
      (await limiter.reserve({ sourceKey: "source-a", duplicateKey: `d-${index}` }))
        .allowed,
      true,
    );
  }

  const blocked = await limiter.reserve({
    sourceKey: "source-a",
    duplicateKey: "d-4",
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 900);

  now += 15 * 60 * 1_000 + 1;
  assert.equal(
    (await limiter.reserve({ sourceKey: "source-a", duplicateKey: "d-5" })).allowed,
    true,
  );
});

test("deduplicates accepted submissions and can release failed reservations", async () => {
  const container = fakeContainer();
  const limiter = new CosmosRateLimiter(container, () => 1_800_000_000_000);
  const first = await limiter.reserve({ sourceKey: "source-b", duplicateKey: "same" });

  await limiter.markSent("same");
  const duplicate = await limiter.reserve({
    sourceKey: "source-b",
    duplicateKey: "same",
  });
  assert.equal(duplicate.duplicate, true);

  await limiter.release(first.reservations);
  assert.equal(container.records.get("source-15m-source-b").count, 0);
  assert.equal(container.records.get("source-24h-source-b").count, 0);
  assert.equal(container.records.get("global-24h").count, 0);
  assert.equal(container.records.get("duplicate-same").ttl, 600);
});
