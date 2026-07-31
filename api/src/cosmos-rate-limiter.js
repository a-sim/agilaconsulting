const partitionKey = "contact";
const retryableStatusCodes = new Set([409, 412]);

function statusCode(error) {
  return error?.code ?? error?.statusCode;
}

export class CosmosRateLimiter {
  constructor(container, now = () => Date.now()) {
    this.container = container;
    this.now = now;
  }

  async reserve({ sourceKey, duplicateKey }) {
    const duplicate = await this.#exists(`duplicate-${duplicateKey}`);
    if (duplicate) {
      return { allowed: true, duplicate: true };
    }

    const reservations = [];
    const limits = [
      [`source-15m-${sourceKey}`, 3, 15 * 60],
      [`source-24h-${sourceKey}`, 10, 24 * 60 * 60],
      ["global-24h", 30, 24 * 60 * 60],
    ];

    for (const [id, limit, windowSeconds] of limits) {
      const result = await this.#increment(id, limit, windowSeconds);
      if (!result.allowed) {
        await this.release(reservations);
        return result;
      }
      reservations.push(id);
    }

    return { allowed: true, duplicate: false, reservations };
  }

  async markSent(duplicateKey) {
    const id = `duplicate-${duplicateKey}`;
    const item = { id, partitionKey, ttl: 10 * 60, count: 1 };

    try {
      await this.container.items.create(item);
    } catch (error) {
      if (statusCode(error) !== 409) {
        throw error;
      }
    }
  }

  async release(ids) {
    await Promise.allSettled(ids.map((id) => this.#decrement(id)));
  }

  async #exists(id) {
    try {
      const { resource } = await this.container.item(id, partitionKey).read();
      return Boolean(resource);
    } catch (error) {
      if (statusCode(error) === 404) {
        return false;
      }
      throw error;
    }
  }

  async #increment(id, limit, windowSeconds) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const itemReference = this.container.item(id, partitionKey);

      try {
        const { resource } = await itemReference.read();
        if (!resource) {
          continue;
        }

        const now = this.now();
        const expiresAt = Number(resource.expiresAt);
        if (!Number.isFinite(expiresAt) || expiresAt <= now) {
          const replacement = {
            id,
            partitionKey,
            count: 1,
            expiresAt: now + windowSeconds * 1_000,
            ttl: windowSeconds,
          };
          await itemReference.replace(replacement, {
            accessCondition: { type: "IfMatch", condition: resource._etag },
          });
          return { allowed: true };
        }

        if (Number(resource.count) >= limit) {
          return {
            allowed: false,
            duplicate: false,
            retryAfter: Math.max(1, Math.ceil((expiresAt - now) / 1_000)),
          };
        }

        const ttl = Math.max(1, Math.ceil((expiresAt - now) / 1_000));
        await itemReference.replace(
          { ...resource, count: Number(resource.count) + 1, ttl },
          { accessCondition: { type: "IfMatch", condition: resource._etag } },
        );
        return { allowed: true };
      } catch (error) {
        const code = statusCode(error);
        if (code === 404) {
          try {
            const now = this.now();
            await this.container.items.create({
              id,
              partitionKey,
              count: 1,
              expiresAt: now + windowSeconds * 1_000,
              ttl: windowSeconds,
            });
            return { allowed: true };
          } catch (createError) {
            if (statusCode(createError) === 409) {
              continue;
            }
            throw createError;
          }
        }

        if (retryableStatusCodes.has(code)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Rate-limit contention exceeded retry budget");
  }

  async #decrement(id) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const itemReference = this.container.item(id, partitionKey);
      try {
        const { resource } = await itemReference.read();
        if (!resource) {
          return;
        }

        await itemReference.replace(
          { ...resource, count: Math.max(0, Number(resource.count) - 1) },
          { accessCondition: { type: "IfMatch", condition: resource._etag } },
        );
        return;
      } catch (error) {
        const code = statusCode(error);
        if (code === 404) {
          return;
        }
        if (retryableStatusCodes.has(code)) {
          continue;
        }
        throw error;
      }
    }
  }
}
