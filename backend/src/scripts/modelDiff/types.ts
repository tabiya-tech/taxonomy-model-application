/**
 * Represents a value that can contain differences between models
 * Can be a simple string, array of strings, or nested object of differences.
 */
export type DifferencesValue = string | string[] | number | boolean | null | { [key: string]: DifferencesValue };

export interface DifferenceIdentity {
  id: {
    left: string | null;
    right: string | null;
  };
  UUID: {
    left: string | null;
    right: string | null;
  };
}

export interface EntityDifference {
  originUUID: string;
  type: EntityType;
  identity: DifferenceIdentity;
  propsDiffs?: DifferencesValue[];
}

export type PropsDiffValue = {
  key: {
    name: string;
  };
  value: {
    left: DifferencesValue;
    right: DifferencesValue;
  };
};

export interface AssociationDifference {
  associationType: AssociationType;
  identity: DifferencesValue;
  propsDiffs?: PropsDiffValue[];
  [key: string]: DifferencesValue | DifferencesValue[] | AssociationType | undefined;
}

/**
 * Structure representing all differences found between two models
 */
export type Differences = {
  /** Information about the models being compared */
  models: {
    /** Name and version of the left model */
    left: string;
    /** Name and version of the right model */
    right: string;
  };
  /** Entities and associations that exist only in the left model */
  left: {
    entities: EntityDifference[];
    associations: AssociationDifference[];
  };
  /** Entities and associations that exist only in the right model */
  right: {
    entities: EntityDifference[];
    associations: AssociationDifference[];
  };
  /** Entities and associations that exist in both models but have differences. */
  common: {
    entities: EntityDifference[];
    associations: AssociationDifference[];
  };
};

/**
 * Types of entities that can be compared between models
 */
export enum EntityType {
  SKILL = "SKILL",
  SKILL_GROUP = "SKILL_GROUP",
  OCCUPATION = "OCCUPATION",
  OCCUPATION_GROUP = "OCCUPATION_GROUP",
}

/**
 * Types of associations/relationships that can be compared between models
 */
export enum AssociationType {
  SKILL_TO_SKILL = "SKILL_TO_SKILL",
  OCCUPATION_TO_SKILL = "OCCUPATION_TO_SKILL",
  OCCUPATION_HIERARCHY = "OCCUPATION_HIERARCHY",
  SKILL_HIERARCHY = "SKILL_HIERARCHY",
}
