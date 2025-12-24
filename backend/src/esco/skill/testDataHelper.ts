import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkill, ReuseLevel, SkillType } from "./skills.types";
import { randomUUID } from "crypto";

export function getISkillMockData(index: number = 1, modelId?: string): ISkill {
  const id = getMockStringId(index);
  const uuid = randomUUID();

  return {
    id,
    UUID: uuid,
    UUIDHistory: [uuid],
    modelId: modelId ?? getMockStringId(100),
    preferredLabel: `Skill ${index}`,
    originUri: `http://example.com/skill/${index}`,
    altLabels: [`Alt Label ${index}`, `Alternative ${index}`],
    description: `Description for skill ${index}`,
    definition: `Definition for skill ${index}`,
    scopeNote: `Scope note for skill ${index}`,
    skillType: SkillType.SkillCompetence,
    reuseLevel: ReuseLevel.CrossSector,
    isLocalized: false,
    parents: [],
    children: [],
    requiresSkills: [],
    requiredBySkills: [],
    requiredByOccupations: [],
    createdAt: new Date(`2023-01-${index.toString().padStart(2, "0")}T00:00:00.000Z`),
    updatedAt: new Date(`2023-01-${index.toString().padStart(2, "0")}T00:00:00.000Z`),
    importId: randomUUID(),
  };
}
