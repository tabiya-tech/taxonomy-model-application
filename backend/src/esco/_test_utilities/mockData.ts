import { INewISCOGroupSpec } from "../iscoGroup/ISCOGroup.types";
import { getMockRandomISCOGroupCode } from "../../_test_utilities/mockISCOCode";
import { INewSkillGroupSpec } from "../skillGroup/skillGroup.types";
import { getMockRandomSkillCode } from "../../_test_utilities/mockSkillGroupCode";

export function getSimpleNewISCOGroupSpec(modelId: string, preferredLabel: string): INewISCOGroupSpec {
  return {
    altLabels: [],
    code: getMockRandomISCOGroupCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: "",
    importId: "",
  };
}

export function getSimpleNewSkillGroupSpec(modelId: string, preferredLabel: string): INewSkillGroupSpec {
  return {
    scopeNote: "",
    altLabels: [],
    code: getMockRandomSkillCode(),
    preferredLabel: preferredLabel,
    modelId: modelId,
    originUUID: "",
    ESCOUri: "",
    description: "",
    importId: "",
  };
}
