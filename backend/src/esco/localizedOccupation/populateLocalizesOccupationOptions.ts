import { LocalizedOccupationModelPaths } from "esco/common/modelPopulationPaths";
import { OccupationDocument } from "esco/occupation/occupationReference";
import mongoose from "mongoose";
import { OccupationToSkillRelationModelPaths } from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import { getSkillDocReference, SkillDocument } from "esco/skill/skillReference";
import { ISkillReferenceDoc } from "esco/skill/skills.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getOccupationRequiresSkillReference } from "esco/occupationToSkillRelation/populateFunctions";
import {
  IExtendedLocalizedOccupation,
  ILocalizedOccupation,
  ILocalizedOccupationDoc,
} from "./localizedOccupation.types";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
export type LocalizedOccupationDocument = _Document<ILocalizedOccupationDoc>;
type ModelConstructed = { constructor: mongoose.Model<unknown> };

export const populateLocalizedOccupationRequiresSkillsOptions = {
  path: LocalizedOccupationModelPaths.requiresSkills,
  populate: {
    path: OccupationToSkillRelationModelPaths.requiredSkillId,
    transform: function (doc: ModelConstructed & SkillDocument): ISkillReferenceDoc | null {
      const modelName = (doc as ModelConstructed).constructor.modelName;
      if (modelName === MongooseModelName.Skill) {
        return getSkillDocReference(doc);
      }
      console.error(`Object is not a Skill: ${modelName}`);
      return null;
    },
  },
  transform: getOccupationRequiresSkillReference,
};
export const populateLocalizedOccupationLocalizesOccupationOptions = {
  path: LocalizedOccupationModelPaths.localizesOccupation,
  transform: (doc: ModelConstructed & OccupationDocument) => {
    //@ts-ignore
    delete doc.modelId;
    return doc;
  },
};

export const occupationFromLocalizedOccupationTransform = (doc: ILocalizedOccupation): IExtendedLocalizedOccupation => {
  return {
    // Original fields from ILocalizedOccupation
    UUID: doc.UUID,
    modelId: doc.modelId,
    altLabels: doc.altLabels,
    description: doc.description,
    occupationType: doc.occupationType,
    id: doc.id,
    importId: doc.importId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    parent: doc.parent,
    children: doc.children,
    requiresSkills: doc.requiresSkills,

    // Fields from localizesOccupation
    localizesOccupationId: doc.localizesOccupation.id,
    preferredLabel: doc.localizesOccupation.preferredLabel,
    originUUID: doc.localizesOccupation.originUUID,
    ESCOUri: doc.localizesOccupation.ESCOUri,
    ISCOGroupCode: doc.localizesOccupation.ISCOGroupCode,
    code: doc.localizesOccupation.code,
    definition: doc.localizesOccupation.definition,
    scopeNote: doc.localizesOccupation.scopeNote,
    regulatedProfessionNote: doc.localizesOccupation.regulatedProfessionNote,
    localizedOccupationType: doc.localizesOccupation.occupationType,
  };
};
