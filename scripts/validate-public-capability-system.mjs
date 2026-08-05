import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = JSON.parse(
  await readFile(
    new URL("../app/capabilities/public-capability-system.json", import.meta.url),
    "utf8",
  ),
);

const allowedRootKeys = new Set([
  "schemaVersion",
  "edition",
  "title",
  "summary",
  "disclaimer",
  "counts",
  "domains",
  "relationships",
]);
const allowedCountKeys = new Set([
  "domains",
  "capabilityAreas",
  "componentCapabilities",
  "curatedBridges",
]);
const allowedDomainKeys = new Set([
  "id",
  "number",
  "title",
  "shortTitle",
  "description",
  "strategicRole",
  "order",
  "clusters",
]);
const allowedClusterKeys = new Set([
  "id",
  "title",
  "summary",
  "order",
  "components",
]);
const allowedComponentKeys = new Set(["id", "title", "order"]);
const allowedRelationshipKeys = new Set([
  "id",
  "source",
  "target",
  "label",
  "kind",
]);
const allowedRelationshipKinds = new Set([
  "informs",
  "depends-on",
  "enables",
  "governed-by",
  "implemented-through",
  "aligns-with",
  "connects-to",
  "specialises",
  "transitions-through",
]);
const forbiddenTerms = [
  /openclaw/i,
  /\bcodex\b/i,
  /\bclaude\b/i,
  /mayker/i,
  /factovia/i,
  /rmt labs/i,
  /evidence[_ -]ids/i,
  /evidence[_ -]maturity/i,
  /publication[_ -]class/i,
  /authority[_ -]limit/i,
  /delivery[_ -]modes/i,
  /kumu[_ -]id/i,
  /source[_ -]id/i,
  /internal only/i,
];

function exactKeys(value, allowed, context) {
  for (const key of Object.keys(value)) {
    assert.ok(allowed.has(key), `${context} includes unapproved field ${key}`);
  }
}

function safeText(value, context) {
  assert.equal(typeof value, "string", `${context} must be text`);
  assert.ok(value.trim().length > 0, `${context} must not be empty`);
  assert.doesNotMatch(value, /[<>]/, `${context} must not include HTML`);
}

function safeId(value, context) {
  assert.match(value, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${context} is not a safe ID`);
}

exactKeys(model, allowedRootKeys, "root");
exactKeys(model.counts, allowedCountKeys, "counts");
assert.equal(model.schemaVersion, 1);
assert.equal(model.domains.length, 6);
assert.equal(model.counts.domains, 6);

const allIds = new Set(["agila"]);
const clusterIds = new Set();
let clusterCount = 0;
let componentCount = 0;

model.domains.forEach((domain, domainIndex) => {
  exactKeys(domain, allowedDomainKeys, `domain ${domainIndex + 1}`);
  safeId(domain.id, `domain ${domainIndex + 1} id`);
  assert.ok(!allIds.has(domain.id), `duplicate public ID ${domain.id}`);
  allIds.add(domain.id);
  for (const field of [
    "number",
    "title",
    "shortTitle",
    "description",
    "strategicRole",
  ]) {
    safeText(domain[field], `domain ${domain.id} ${field}`);
  }
  assert.equal(domain.order, domainIndex + 1);
  assert.equal(domain.clusters.length, 4, `${domain.id} must have four public areas`);

  domain.clusters.forEach((cluster, clusterIndex) => {
    exactKeys(cluster, allowedClusterKeys, `cluster ${cluster.id}`);
    safeId(cluster.id, `cluster ${clusterIndex + 1} id`);
    assert.ok(!allIds.has(cluster.id), `duplicate public ID ${cluster.id}`);
    allIds.add(cluster.id);
    clusterIds.add(cluster.id);
    clusterCount += 1;
    safeText(cluster.title, `cluster ${cluster.id} title`);
    safeText(cluster.summary, `cluster ${cluster.id} summary`);
    assert.equal(cluster.order, clusterIndex + 1);
    assert.ok(cluster.components.length >= 4 && cluster.components.length <= 8);

    cluster.components.forEach((component, componentIndex) => {
      exactKeys(component, allowedComponentKeys, `component ${component.id}`);
      safeId(component.id, `component ${componentIndex + 1} id`);
      assert.ok(!allIds.has(component.id), `duplicate public ID ${component.id}`);
      allIds.add(component.id);
      componentCount += 1;
      safeText(component.title, `component ${component.id} title`);
      assert.equal(component.order, componentIndex + 1);
    });
  });
});

assert.equal(clusterCount, model.counts.capabilityAreas);
assert.equal(componentCount, model.counts.componentCapabilities);
assert.equal(model.relationships.length, model.counts.curatedBridges);

const relationshipIds = new Set();
model.relationships.forEach((relationship) => {
  exactKeys(relationship, allowedRelationshipKeys, `relationship ${relationship.id}`);
  safeId(relationship.id, "relationship id");
  assert.ok(!relationshipIds.has(relationship.id), `duplicate relationship ${relationship.id}`);
  relationshipIds.add(relationship.id);
  assert.ok(clusterIds.has(relationship.source), `dangling source ${relationship.source}`);
  assert.ok(clusterIds.has(relationship.target), `dangling target ${relationship.target}`);
  assert.ok(
    allowedRelationshipKinds.has(relationship.kind),
    `unapproved relationship kind ${relationship.kind}`,
  );
  safeText(relationship.label, `relationship ${relationship.id} label`);
});

const serialized = JSON.stringify(model);
for (const term of forbiddenTerms) {
  assert.doesNotMatch(serialized, term, `public ontology contains ${term}`);
}

console.log(
  `Validated public capability system: ${model.counts.domains} domains, ${clusterCount} areas, ${componentCount} components and ${model.relationships.length} bridges.`,
);
