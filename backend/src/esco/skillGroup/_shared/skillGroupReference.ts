import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { resolveTranslated } from "common/language/resolveTranslated";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document: its translatable paths are localized sub documents, not the flat strings the
// repository hands back
export type SkillGroupDocument = _Document<ISkillGroupDoc>;

export function getSkillGroupDocReference(
  skillGroup: SkillGroupDocument,
  language: string = getFallbackLanguageConfig().dbKeyName
): ISkillGroupReferenceDoc {
  return {
    modelId: skillGroup.modelId,
    id: skillGroup.id,
    objectType: ObjectTypes.SkillGroup,
    UUID: skillGroup.UUID,
    code: skillGroup.code,
    preferredLabel: resolveTranslated(skillGroup.preferredLabel, language),
  };
}
