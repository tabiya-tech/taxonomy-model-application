import { ModelInfoTypes } from "src//modelInfo/modelInfoTypes";

export function getOneFakeUUIDHistoryDetail(i: number): ModelInfoTypes.ModelHistory {
  return {
    UUID: "e26aca13-aa00-4346-9e83-edaf59314378" + i,
    id: "5e12f537f079fbdcb4e61bf" + i,
    localeShortCode: "ZA",
    name: "Model" + i,
    version: "V1.1." + i,
  };
}

export function getFakeUUIDHistoryDetailsArray(length: number): ModelInfoTypes.ModelHistory[] {
  return Array.from({ length }, (_, i) => getOneFakeUUIDHistoryDetail(i));
}

export function getFakeUUIDHistoryDetailsArrayWithUnresolvedUUIDS(length: number): ModelInfoTypes.ModelHistory[] {
  return Array.from({ length }, (_, i) => {
    const details = getOneFakeUUIDHistoryDetail(i);
    details.id = null;
    details.name = null;
    details.version = null;
    details.localeShortCode = null;
    return details;
  });
}
