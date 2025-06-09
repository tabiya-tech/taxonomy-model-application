import { IModelManager } from "./model/types";
import { SkillsService } from "./esco/skills";
import { SkillGroupsService } from "./esco/skillGroups";
import { OccupationService } from "./esco/occupations";
import {
  Entity,
  Relation,
  Occupation,
  OccupationGroup,
  Skill,
  SkillGroup,
  SkillToSkillRelation,
  SkillHierarchy,
  OccupationHierarchy,
  OccupationToSKillRelation,
} from "./esco/types";
import { OccupationGroupsService } from "./esco/occupationGroups";
import { SkillToSkillService } from "./esco/skillToSkill";
import { OccupationToSkillRelationService } from "./esco/occupationToSkill";
import { AssociationType, Differences, DifferencesValue, EntityType, PropsDiffValue } from "./types";

function compareEntities<T extends Entity>(
  leftModelManager: IModelManager,
  rightModelManager: IModelManager,
  entityType: EntityType,
  getEntitiesFn: (modelManager: IModelManager) => T[],
  getEntityByOriginUUIDFn: (modelManager: IModelManager, originUUID: string) => T | undefined,
  compareEntitiesFn: (leftEntity: T, rightEntity: T) => PropsDiffValue[],
  differences: Differences
) {
  if (!leftModelManager || !rightModelManager) {
    throw new Error("Model managers cannot be null or undefined");
  }

  const leftEntities = getEntitiesFn(leftModelManager);

  if (!Array.isArray(leftEntities)) {
    throw new Error(`Invalid entities array returned for entity type ${entityType}`);
  }

  for (const leftEntity of leftEntities) {
    const rightEntity = getEntityByOriginUUIDFn(rightModelManager, leftEntity.originUUID);

    // The right entity is only on the left model, so we add it to the differences.
    if (!rightEntity) {
      differences.left.entities.push({
        originUUID: leftEntity.originUUID,
        type: entityType,
        identity: {
          id: {
            left: leftEntity.row?.ID ?? null,
            right: null,
          },
          UUID: {
            left: leftEntity.recentUUID ?? null,
            right: null,
          },
        },
      });

      // Continue to the next entity.
      continue;
    }

    const diffs = compareEntitiesFn(leftEntity, rightEntity);

    if (Object.keys(diffs || {}).length > 0) {
      differences.common.entities.push({
        originUUID: leftEntity.originUUID,
        type: entityType,
        identity: {
          id: {
            left: leftEntity.row?.ID ?? null,
            right: rightEntity.row?.ID ?? null,
          },
          UUID: {
            left: leftEntity.recentUUID ?? null,
            right: rightEntity.recentUUID ?? null,
          },
        },
        propsDiffs: diffs,
      });
    }
  }

  const rightEntities = getEntitiesFn(rightModelManager);

  for (const rightEntity of rightEntities) {
    const leftEntity = getEntityByOriginUUIDFn(leftModelManager, rightEntity.originUUID);
    if (leftEntity) {
      continue;
    }

    differences.right.entities.push({
      originUUID: rightEntity.originUUID,
      type: entityType,
      identity: {
        id: {
          left: null,
          right: rightEntity.row?.ID ?? null,
        },
        UUID: {
          left: null,
          right: rightEntity.recentUUID ?? null,
        },
      },
    });
  }
}

function compareRelations<T extends Relation>(
  leftModelManager: IModelManager,
  rightModelManager: IModelManager,
  associationType: AssociationType,
  getters: {
    getRelationsFn: (modelManager: IModelManager) => T[];
    getSimilarRelationFn: (modelManager: IModelManager, relation: T) => T | undefined;
    getRelationIdentifierFn: (relation: T) => Record<string, string>;
    getIdentityFn: (leftRelation: T | null, rightRelation: T | null) => DifferencesValue;
  },
  compareRelationshipsFn: (leftRelationship: T, rightRelationship: T) => PropsDiffValue[],
  differences: Differences
) {
  if (!leftModelManager || !rightModelManager) {
    throw new Error("Model managers cannot be null or undefined in compareRelations");
  }

  const leftRelations = getters.getRelationsFn(leftModelManager);

  for (const leftRelation of leftRelations) {
    try {
      const rightRelation = getters.getSimilarRelationFn(rightModelManager, leftRelation);

      if (!rightRelation) {
        // The right relation is only on the left model, so we add it to the differences.
        differences.left.associations.push({
          ...getters.getRelationIdentifierFn(leftRelation),
          associationType,
          identity: getters.getIdentityFn(leftRelation, null),
        });

        // Continue to the next relation.
        continue;
      }

      const diffs = compareRelationshipsFn(leftRelation, rightRelation);

      // if any differences, we add them to the common associations.
      if (Object.keys(diffs || {}).length > 0) {
        differences.common.associations.push({
          ...getters.getRelationIdentifierFn(leftRelation),
          associationType,
          identity: getters.getIdentityFn(leftRelation, rightRelation),
          propsDiffs: diffs,
        });
      }
    } catch (error) {
      leftModelManager.logger.error(`Error comparing relation in ${associationType}:`, error as Error);
      throw error;
    }
  }

  const rightRelations = getters.getRelationsFn(rightModelManager);

  for (const rightRelation of rightRelations) {
    try {
      const leftRelation = getters.getSimilarRelationFn(leftModelManager, rightRelation);
      if (leftRelation) {
        continue;
      }

      differences.right.associations.push({
        ...getters.getRelationIdentifierFn(rightRelation),
        associationType,
        identity: getters.getIdentityFn(null, rightRelation),
      });
    } catch (error) {
      rightModelManager.logger.error(`Error processing right relation in ${associationType}:`, error as Error);
    }
  }
}

export function findDifferences(leftModelManager: IModelManager, rightModelManager: IModelManager) {
  // Initialize an empty array to store the differences
  // Because JavaScript reference arrays by reference, It will be appended everytime the comparing functions append on it.
  const differences: Differences = {
    models: {
      left: leftModelManager.state.modelName,
      right: rightModelManager.state.modelName,
    },
    left: {
      entities: [],
      associations: [],
    },
    right: {
      entities: [],
      associations: [],
    },
    common: {
      entities: [],
      associations: [],
    },
  };

  try {
    // #####################################################################
    //                      1. Compare Entities
    // #####################################################################

    // ====================== 1.1 Compare Skills ===========================
    compareEntities<Skill>(
      leftModelManager,
      rightModelManager,
      EntityType.SKILL,
      (modelManager) => modelManager.state.skills || [],
      (modelManager: IModelManager, originUUID: string) => modelManager.getSKillByOriginUUID(originUUID),
      SkillsService.compareEntities,
      differences
    );

    // ====================== 1.2 Compare SkillGroups ======================
    compareEntities<SkillGroup>(
      leftModelManager,
      rightModelManager,
      EntityType.SKILL_GROUP,
      (modelManager) => modelManager.state.skillGroups || [],
      (modelManager: IModelManager, originUUID: string) => modelManager.getSkillGroupByOriginUUID(originUUID),
      SkillGroupsService.compareEntities,
      differences
    );

    // ====================== 1.3 Compare Occupations ======================
    compareEntities<Occupation>(
      leftModelManager,
      rightModelManager,
      EntityType.OCCUPATION,
      (modelManager) => modelManager.state.occupations || [],
      (modelManager: IModelManager, originUUID: string) => modelManager.getOccupationByOriginUUID(originUUID),
      OccupationService.compareEntities,
      differences
    );

    // ====================== 1.4 Compare Occupation Groups ================
    compareEntities<OccupationGroup>(
      leftModelManager,
      rightModelManager,
      EntityType.OCCUPATION_GROUP,
      (modelManager) => modelManager.state.occupationGroups || [],
      (modelManager: IModelManager, originUUID: string) => modelManager.getOccupationGroupByOriginUUID(originUUID),
      OccupationGroupsService.compareEntities,
      differences
    );

    // #####################################################################
    //                      2. Compare Associations
    // #####################################################################

    // ====================== 2.1 Compare Skill to Skill ===================
    compareRelations<SkillToSkillRelation>(
      leftModelManager,
      rightModelManager,
      AssociationType.SKILL_TO_SKILL,
      {
        getRelationsFn: (modelManager) => modelManager.state.skillToSkill || [],
        getSimilarRelationFn: (modelManager, relation) => {
          if (!relation.requiredSkillOriginUUID || !relation.requiringSkillOriginUUID) {
            return undefined;
          }

          return modelManager.getSkillToSkillRelationByOriginUUIDs(
            relation.requiredSkillOriginUUID,
            relation.requiringSkillOriginUUID
          );
        },
        getRelationIdentifierFn: (relation) => ({
          requiredSkillOriginUUID: relation.requiredSkillOriginUUID ?? "",
          requiringSkillOriginUUID: relation.requiringSkillOriginUUID ?? "",
        }),
        getIdentityFn: (leftRelation, rightRelation) => ({
          requiredSkillID: {
            left: leftRelation?.REQUIREDID ?? null,
            right: rightRelation?.REQUIREDID ?? null,
          },
          requiringSkillId: {
            left: leftRelation?.REQUIRINGID ?? null,
            right: rightRelation?.REQUIRINGID ?? null,
          },
        }),
      },
      SkillToSkillService.compareRelationships,
      differences
    );

    // ====================== 2.2 Compare Skill Hierarchy = ================
    compareRelations<SkillHierarchy>(
      leftModelManager,
      rightModelManager,
      AssociationType.SKILL_HIERARCHY,
      {
        getRelationsFn: (modelManager) => modelManager.state.skillHierarchy,
        getSimilarRelationFn: (modelManager, relation) => modelManager.getSKillHierarchy(relation),
        getRelationIdentifierFn: (relation) => ({
          parentOriginUUID: relation.parentOriginUUID ?? "",
          parentObjectType: relation.PARENTOBJECTTYPE ?? "",
          childOriginUUID: relation.childOriginUUID ?? "",
          childObjectType: relation.CHILDOBJECTTYPE ?? "",
        }),
        getIdentityFn: (leftRelation, rightRelation) => ({
          parentID: {
            left: leftRelation?.PARENTID ?? null,
            right: rightRelation?.PARENTID ?? null,
          },
          childID: {
            left: leftRelation?.CHILDID ?? null,
            right: rightRelation?.CHILDID ?? null,
          },
        }),
      },
      () => [], // The Skill Hierarchy relation can not be compared directly, so we pass an empty function
      differences
    );

    // ====================== 2.3 Compare Occupation Hierarchy =============
    compareRelations<OccupationHierarchy>(
      leftModelManager,
      rightModelManager,
      AssociationType.OCCUPATION_HIERARCHY,
      {
        getRelationsFn: (modelManager) => modelManager.state.occupationHierarchy,
        getSimilarRelationFn: (modelManager, relation) => modelManager.getOccupationHierarchy(relation),
        getRelationIdentifierFn: (relation) => ({
          parentOriginUUID: relation.parentOriginUUID ?? "",
          parentObjectType: relation.PARENTOBJECTTYPE ?? "",
          childOriginUUID: relation.childOriginUUID ?? "",
          childObjectType: relation.CHILDOBJECTTYPE ?? "",
        }),
        getIdentityFn: (leftRelation, rightRelation) => ({
          parentID: {
            left: leftRelation?.PARENTID ?? null,
            right: rightRelation?.PARENTID ?? null,
          },
          childID: {
            left: leftRelation?.CHILDID ?? null,
            right: rightRelation?.CHILDID ?? null,
          },
        }),
      },
      () => [], // The Skill Hierarchy relation can not be compared directly, so we pass an empty function
      differences
    );

    // ====================== 2.4 Compare Occupation To Skill ==============
    compareRelations<OccupationToSKillRelation>(
      leftModelManager,
      rightModelManager,
      AssociationType.OCCUPATION_TO_SKILL,
      {
        getRelationsFn: (modelManager) => modelManager.state.occupationToSkill || [],
        getSimilarRelationFn: (modelManager, relation) => {
          if (!relation.occupationOriginUUID || !relation.skillOriginUUID) {
            return undefined;
          }

          return modelManager.getOccupationToSkillRelationByOriginUUIDs(
            relation.occupationOriginUUID,
            relation.skillOriginUUID
          );
        },
        getRelationIdentifierFn: (relation) => ({
          occupationOriginUUID: relation.occupationOriginUUID ?? "",
          skillOriginUUID: relation.skillOriginUUID ?? "",
        }),
        getIdentityFn: (leftRelation, rightRelation) => ({
          occupationID: {
            left: leftRelation?.OCCUPATIONID ?? null,
            right: rightRelation?.OCCUPATIONID ?? null,
          },
          skillID: {
            left: leftRelation?.SKILLID ?? null,
            right: rightRelation?.SKILLID ?? null,
          },
        }),
      },
      OccupationToSkillRelationService.compareRelationships,
      differences
    );
  } catch (error) {
    throw new Error(`Error during model comparison`, { cause: error });
  }

  // Return the array of differences
  return differences;
}
