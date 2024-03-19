import {ModelInfoTypes} from "src//modelInfo/modelInfoTypes";

export function getOneFakeUUIDHistoryDetails(i: number): ModelInfoTypes.UUIDHistory {
  return {
    UUID: "1234567890" + i,
    id: "1234567890" + i,
    localeShortCode: "ABC" + i,
    name: "Name" + i,
    version: "Version" + i,
  };
}

export function getFakeUUIDHistoryDetailsArray(length: number): ModelInfoTypes.UUIDHistory[] {
  return Array.from({ length }, (_, i) => getOneFakeUUIDHistoryDetails(i));
}
