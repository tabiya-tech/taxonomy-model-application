import { INewOccupationSpec, IOccupation } from "esco/occupation/occupation.types";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockISCOCode";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { ObjectTypes, OccupationType, RelationType } from "esco/common/objectTypes";
import {ILocalizedOccupation, INewLocalizedOccupationSpec} from "esco/localizedOccupation/localizedOccupation.types";
import {IISCOGroup, INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";
import { INewSkillSpec, ISkill, ReuseLevel, SkillType } from "esco/skill/skills.types";
import { INewSkillGroupSpec, ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "_test_utilities/mockSkillGroupCode";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationHierarchyPairSpec } from "esco/occupationHierarchy/occupationHierarchy.types";
import { INewSkillHierarchyPairSpec } from "esco/skillHierarchy/skillHierarchy.types";
import { INewOccupationToSkillPairSpec } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { randomUUID } from "crypto";

export const getSampleISCOGroupSpecs = (givenModelId: string, batchSize: number = 100): INewISCOGroupSpec[] => {
  return Array.from<never, INewISCOGroupSpec>({ length: batchSize }, (_, i) => ({
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: `ISCOGroup_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    description: `description_${i}`,
    originUri: `originUri_${i}`,
    importId: getMockStringId(i),
  }));
};

export const getSampleOccupationSpecs = (givenModelId: string, isLocal: boolean = false, batchSize: number = 100): INewOccupationSpec[] => {
  return Array.from<never, INewOccupationSpec>({ length: batchSize }, (_, i) => ({
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    code: getMockRandomOccupationCode(isLocal),
    ISCOGroupCode: getMockRandomISCOGroupCode(),
    preferredLabel: `Occupation_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    definition: `definition_${i}`,
    description: `description_${i}`,
    regulatedProfessionNote: `regulatedProfessionNote_${i}`,
    scopeNote: `scopeNote_${i}`,
    originUri: `originUri_${i}`,
    occupationType: isLocal ? OccupationType.LOCAL : OccupationType.ESCO,
    importId: getMockStringId(i),
  }));
};

export const getSampleLocalizedOccupationSpecs = (
  givenESCOOccupations: IOccupation[]
): INewLocalizedOccupationSpec[] => {
  return givenESCOOccupations.map((occupation, i) => ({
    modelId: occupation.modelId,
    UUIDHistory: [randomUUID()],
    altLabels: i % 2 ? [] : [`altLabel_1`, `altLabel_2`],
    description: `description_${i}`,
    localizesOccupationId: occupation.id,
    occupationType: OccupationType.LOCALIZED,
    importId: getMockStringId(i),
  }));
};

export const getSampleSkillsSpecs = (givenModelId: string, batchSize: number = 100): INewSkillSpec[] => {
  const getSkillType = (i: number): SkillType => {
    switch (i % 5) {
      case 0:
        return SkillType.Knowledge;
      case 1:
        return SkillType.SkillCompetence;
      case 2:
        return SkillType.None;
      case 3:
        return SkillType.Attitude;
      case 4:
        return SkillType.Language;
      default:
        return SkillType.Knowledge;
    }
  };
  const getReuseLevel = (i: number): ReuseLevel => {
    switch (i % 5) {
      case 0:
        return ReuseLevel.CrossSector;
      case 1:
        return ReuseLevel.OccupationSpecific;
      case 2:
        return ReuseLevel.SectorSpecific;
      case 3:
        return ReuseLevel.Transversal;
      case 4:
        return ReuseLevel.None;
      default:
        return ReuseLevel.CrossSector;
    }
  };
  return Array.from<never, INewSkillSpec>({ length: batchSize }, (_, i) => ({
    modelId: givenModelId,
    preferredLabel: `Skill_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    UUIDHistory: [randomUUID()],
    originUri: `originUri_${i}`,
    definition: `definition_${i}`,
    description: `description_${i}`,
    scopeNote: `scopeNote_${i}`,
    skillType: getSkillType(i),
    reuseLevel: getReuseLevel(i),
    importId: getMockStringId(i),
  }));
};

export const getSampleSkillGroupsSpecs = (givenModelId: string, batchSize: number = 100): INewSkillGroupSpec[] => {
  return Array.from<never, INewSkillGroupSpec>({ length: batchSize }, (_, i) => ({
    modelId: givenModelId,
    UUIDHistory: [randomUUID()],
    code: getMockRandomSkillCode(),
    preferredLabel: `SkillGroup_${i}`,
    altLabels: i % 2 ? [`altLabel_1`, `altLabel_2`] : [],
    description: `description_${i}`,
    scopeNote: `scopeNote_${i}`,
    originUri: `originUri_${i}`,
    importId: getMockStringId(i),
  }));
};
export const getSampleOccupationHierarchy = (
  ISCOGroups: IISCOGroup[],
  ESCOOccupations: IOccupation[],
  localOccupations: IOccupation[]
) => {
  const hierarchySpecs : INewOccupationHierarchyPairSpec[] = [];
  const createPairs = (
    parent: IOccupation | IISCOGroup,
    children: IOccupation[] | IISCOGroup[],
    parentType: ObjectTypes.Occupation | ObjectTypes.ISCOGroup,
    childType: ObjectTypes.Occupation | ObjectTypes.ISCOGroup,
  ) => {

    for (const child of children) {
      if (parent.id !== child.id) {
        hierarchySpecs.push({
          parentId: parent.id,
          parentType: parentType,
          childType: childType,
          childId: child.id
        });
      }
    }
  };

  // Create hierarchy pairs based on the rules
  // since we have a unique key constraint that says that no child can have more than one parent, we have to be sure to slice off different segments for each of the relation pair types
  createPairs(ISCOGroups[ISCOGroups.length - 1], ISCOGroups.slice(0, 10), ObjectTypes.ISCOGroup, ObjectTypes.ISCOGroup);
  createPairs(ISCOGroups[ISCOGroups.length - 1], ESCOOccupations.slice(0, 10), ObjectTypes.ISCOGroup, ObjectTypes.Occupation);
  createPairs(ISCOGroups[ISCOGroups.length - 1], localOccupations.slice(0, 10), ObjectTypes.ISCOGroup, ObjectTypes.Occupation);
  createPairs(ESCOOccupations[ESCOOccupations.length - 1], ESCOOccupations.slice(10, 20), ObjectTypes.Occupation, ObjectTypes.Occupation);
  createPairs(ESCOOccupations[ESCOOccupations.length - 1], localOccupations.slice(10, 20), ObjectTypes.Occupation, ObjectTypes.Occupation);
  createPairs(localOccupations[localOccupations.length - 1], localOccupations.slice(20, 30), ObjectTypes.Occupation, ObjectTypes.Occupation);
  return hierarchySpecs;
};



export const getSampleSkillsHierarchy = (
  givenSkills: ISkill[],
  givenSkillGroups: ISkillGroup[]
) => {
  const hierarchy : INewSkillHierarchyPairSpec[] = [];

  // Helper function to create hierarchy pairs
  const createPairs = (
    parent: ISkill | ISkillGroup,
    children: ISkill[] | ISkillGroup[],
    parentType: ObjectTypes.Skill | ObjectTypes.SkillGroup,
    childType: ObjectTypes.Skill | ObjectTypes.SkillGroup
  ) => {
      for (const child of children) {
        if (parent.id !== child.id) {
          hierarchy.push({
            parentId: parent.id,
            parentType: parentType,
            childType: childType,
            childId: child.id,
          });
        }
      }
  };

  // Create hierarchy pairs based on the rules
  createPairs(givenSkillGroups[givenSkillGroups.length -1 ], givenSkillGroups.slice(0, 10), ObjectTypes.SkillGroup, ObjectTypes.SkillGroup);
  createPairs(givenSkills[givenSkills.length - 1], givenSkills.slice(0, 10), ObjectTypes.Skill, ObjectTypes.Skill);
  createPairs(givenSkillGroups[givenSkillGroups.length - 1], givenSkills.slice(10, 20), ObjectTypes.SkillGroup, ObjectTypes.Skill);

  return hierarchy;
};

export const getSampleOccupationToSkillRelations = (
  givenESCOOccupations: IOccupation[],
  givenLocalOccupations: IOccupation[],
  givenLocalizedOccupations: ILocalizedOccupation[],
  givenSkills: ISkill[]
) => {
  const occupationToSkillRelations: INewOccupationToSkillPairSpec[] = [];

  const createRelations = (requiringOccupation: IOccupation | ILocalizedOccupation, givenSkills: ISkill[],  occupationType: OccupationType) => {
      for (const skill of givenSkills) {
        occupationToSkillRelations.push({
          requiringOccupationType: occupationType,
          requiredSkillId: skill.id,
          requiringOccupationId: requiringOccupation.id,
          relationType: RelationType.OPTIONAL,
        });
    }
  };

  // Create relations for each type of occupation
  createRelations(givenESCOOccupations[givenESCOOccupations.length - 1], givenSkills.slice(0, 10), OccupationType.ESCO);
  createRelations(givenLocalOccupations[givenLocalOccupations.length - 1],  givenSkills.slice(10, 20), OccupationType.LOCAL);
  createRelations(givenLocalizedOccupations[givenLocalizedOccupations.length - 1], givenSkills.slice(20, 30), OccupationType.LOCALIZED);

  return occupationToSkillRelations;
};

export const getSampleSkillToSkillRelations = (givenSkills: ISkill[]) => {
  const skillToSkillRelations = [];

  for (let i = 0; i < givenSkills.length; i++) {
    const requiringSkillId = givenSkills[i].id;
    const requiredSkillId = givenSkills[i + 1]?.id ?? givenSkills[0].id; // Loop back to the first skill if at the end of the array

    skillToSkillRelations.push({
      requiringSkillId,
      requiredSkillId,
      relationType: RelationType.OPTIONAL
    });
  }

  return skillToSkillRelations;
};
