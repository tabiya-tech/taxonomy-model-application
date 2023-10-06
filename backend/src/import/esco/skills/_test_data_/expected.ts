import { INewSkillSpec } from "esco/skill/skills.types";

export const expected: Omit<INewSkillSpec, "modelId">[] = [
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    scopeNote: "scopeNote",
    definition: "definition",
    skillType: "skill/competence",
    reuseLevel: "sector-specific",
    importId: "key_1",
  },
  {
    ESCOUri: "esco\nuri\nwith\nlinebreak",
    originUUID: "origin\nuuid\nwith\nlinebreak",
    preferredLabel: "preferred\nlabel\nwith\nlinebreak",
    altLabels: ["label1", "label2"],
    description: "description\nwith\nlinebreak",
    definition: "definition\nwith\nlinebreak",
    scopeNote: "scopeNote\nwith\nlinebreak",
    skillType: "knowledge",
    reuseLevel: "cross-sector",
    importId: "key_2",
  },
];
