import { IOccupationGroupDoc, IOccupationGroupReferenceDoc } from "./OccupationGroup.types";
import mongoose from "mongoose";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { resolveTranslated } from "common/language/resolveTranslated";

type _Document<T> = mongoose.Document<unknown, undefined, T> & T;
// the raw hydrated document: its translatable paths are localized sub documents, not the flat strings the
// repository hands back
export type OccupationGroupDocument = _Document<IOccupationGroupDoc>;

export function getOccupationGroupDocReference(occupationGroup: OccupationGroupDocument): IOccupationGroupReferenceDoc {
  return {
    modelId: occupationGroup.modelId,
    id: occupationGroup.id,
    objectType: occupationGroup.groupType,
    UUID: occupationGroup.UUID,
    code: occupationGroup.code,
    // a reference carries the fall back language only; preferredLabel can never be empty, so resolving it is the
    // same as reading the fall back language straight off the sub document
    preferredLabel: resolveTranslated(occupationGroup.preferredLabel, getFallbackLanguageConfig().dbKeyName),
  };
}
