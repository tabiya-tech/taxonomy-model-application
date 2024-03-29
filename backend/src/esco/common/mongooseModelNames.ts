import { ObjectTypes } from "./objectTypes";

/**
 * Enum for the different name of models.
 * Given a document it is possible to find the type of the document by looking at the modelName property of the document's constructor.
 *
 * ```typescript
 * document.constructor.modelName === MongooseModelName.ISCOGroup
 * ```
 */
export enum MongooseModelName {
  ISCOGroup = "ISCOGroupModel",
  Occupation = "OccupationModel",
  Skill = "SkillModel",
  SkillGroup = "SkillGroupModel",
  OccupationHierarchy = "OccupationHierarchyModel",
  SkillHierarchy = "SkillHierarchyModel",
  SkillToSkillRelation = "SkillToSkillRelationModel",
  OccupationToSkillRelation = "OccupationToSkillRelationModel",
}

export function getModelName(objectType: ObjectTypes): MongooseModelName {
  switch (objectType) {
    case ObjectTypes.ISCOGroup:
      return MongooseModelName.ISCOGroup;
    case ObjectTypes.ESCOOccupation:
    case ObjectTypes.LocalOccupation:
      return MongooseModelName.Occupation;
    case ObjectTypes.Skill:
      return MongooseModelName.Skill;
    case ObjectTypes.SkillGroup:
      return MongooseModelName.SkillGroup;
    default:
      throw new Error(`Unknown object type: ${objectType}`);
  }
}
