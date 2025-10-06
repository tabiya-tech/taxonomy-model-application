import { randomUUID } from "crypto";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { INewOccupationGroupSpec, IOccupationGroup } from "./OccupationGroup.types";
import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";

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
    originUUID: randomUUID(),
  };
}

export function getOccupationMockDataArray(n: number): Array<IOccupationGroup> {
  return Array.from({ length: n }, (_, index) => getIOccupationGroupMockData(index + 1));
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
