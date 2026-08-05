export type ComponentCapability = {
  id: string;
  title: string;
  order: number;
};

export type CapabilityArea = {
  id: string;
  title: string;
  summary: string;
  order: number;
  components: ComponentCapability[];
};

export type CapabilityDomain = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  strategicRole: string;
  order: number;
  clusters: CapabilityArea[];
};

export type CapabilityRelationship = {
  id: string;
  source: string;
  target: string;
  label: string;
  kind:
    | "informs"
    | "depends-on"
    | "enables"
    | "governed-by"
    | "implemented-through"
    | "aligns-with"
    | "connects-to"
    | "specialises"
    | "transitions-through";
};

export type CapabilitySystem = {
  schemaVersion: number;
  edition: string;
  title: string;
  summary: string;
  disclaimer: string;
  counts: {
    domains: number;
    capabilityAreas: number;
    componentCapabilities: number;
    curatedBridges: number;
  };
  domains: CapabilityDomain[];
  relationships: CapabilityRelationship[];
};
