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
}
