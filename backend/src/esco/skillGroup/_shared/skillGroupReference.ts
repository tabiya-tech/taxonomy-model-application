import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { resolveTranslated } from "common/language/resolveTranslated";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document: its translatable paths are localized sub documents, not the flat strings the
// repository hands back
export type SkillGroupDocument = _Document<ISkillGroupDoc>;

export function getSkillGroupDocReference(skillGroup: SkillGroupDocument): ISkillGroupReferenceDoc {
  return {
    modelId: skillGroup.modelId,
    id: skillGroup.id,
    objectType: ObjectTypes.SkillGroup,
    UUID: skillGroup.UUID,
    code: skillGroup.code,
    // a reference carries the fall back language only; preferredLabel can never be empty, so resolving it is the
    // same as reading the fall back language straight off the sub document
    preferredLabel: resolveTranslated(skillGroup.preferredLabel, getFallbackLanguageConfig().dbKeyName),
  };
}
