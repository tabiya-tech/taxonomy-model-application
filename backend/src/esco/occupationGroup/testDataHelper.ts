import { randomUUID } from "node:crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationGroupSpec, IOccupationGroup, IOccupationGroupReference } from "./OccupationGroup.types";
import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";

export function getIOccupationGroupMockData(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): IOccupationGroup {
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    parent: null,
    importId: getMockStringId(n),
    children: [],
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
  };
}

export function getIOccupationGroupMockDataWithOccupationGroupChildren(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): IOccupationGroup {
  const children: IOccupationGroupReference = {
    UUID: randomUUID(),
    code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    id: getMockStringId(n + 1),
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ISCOGroup,
  };
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    parent: null,
    importId: getMockStringId(n),
    children: [children],
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
  };
}

export function getIOccupationGroupMockDataWithOccupationChildren(
  n: number = 1,
  modelId: string = getMockStringId(1000 + n)
): IOccupationGroup {
  const children: IOccupationReference = {
    UUID: randomUUID(),
    code: getMockRandomOccupationCode(false),
    id: getMockStringId(n + 1),
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    occupationType: OccupationGroupAPISpecs.Enums.Relations.Children.ObjectTypes.ESCOOccupation,
    occupationGroupCode: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    isLocalized: false,
  };
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    code: getRandomString(OccupationGroupAPISpecs.Constants.CODE_MAX_LENGTH),
    originUri: "https://foo.bar/" + n,
    preferredLabel: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    altLabels: [getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    parent: null,
    importId: getMockStringId(n),
    children: [children],
    modelId: modelId,
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(),
  };
}

export function getNewOccupationGroupSpec(): INewOccupationGroupSpec {
  return {
    code: getMockRandomISCOGroupCode().padStart(4, "0"),
    originUri: "https://foo.bar/",
    preferredLabel: getTestString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
    importId: getMockStringId(1),
    modelId: getMockStringId(1),
    altLabels: [getTestString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    description: getRandomString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  };
}
