import { ObjectType } from "src/explorer/explorer.types";

export function getMockOccupationGroupNode(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "grp-1",
    UUID: "grp-1-uuid",
    code: "1",
    preferredLabel: "Managers",
    description: "Managers plan, direct and coordinate.",
    altLabels: [],
    groupType: ObjectType.ISCOGroup,
    children: [],
    ...overrides,
  };
}

export function getMockSkillGroupNode(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "grp-s1",
    UUID: "grp-s1-uuid",
    code: "S1",
    preferredLabel: "Communication skills",
    description: "Skills related to communication.",
    altLabels: [],
    children: [],
    ...overrides,
  };
}

export function getMockChildRef(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "occ-1120",
    code: "1120",
    preferredLabel: "Business services managers",
    objectType: ObjectType.ESCOOccupation,
    ...overrides,
  };
}

export function getMockOccupationDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "occ-1120",
    UUID: "occ-1120-uuid",
    code: "1120",
    preferredLabel: "Business services managers",
    definition: "Business services managers plan, direct and coordinate the delivery of business services.",
    description: "",
    altLabels: ["business services manager"],
    occupationType: ObjectType.ESCOOccupation,
    occupationGroupCode: "112",
    regulatedProfessionNote: "",
    requiresSkills: [{ id: "skill-1", preferredLabel: "manage business operations", relationType: "essential" }],
    ...overrides,
  };
}

export function getMockSkillDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "skill-1",
    UUID: "skill-1-uuid",
    preferredLabel: "manage business operations",
    definition: "Oversee and coordinate the day-to-day operations of a business.",
    description: "",
    altLabels: [],
    skillType: "skill/competence",
    reuseLevel: "cross-sector",
    requiredByOccupations: [
      { id: "occ-1120", preferredLabel: "Business services managers", relationType: "essential" },
    ],
    ...overrides,
  };
}

export function getMockPaginatedResponse<T>(data: T[], limit = 100, nextCursor: string | null = null) {
  return { data, limit, nextCursor };
}
