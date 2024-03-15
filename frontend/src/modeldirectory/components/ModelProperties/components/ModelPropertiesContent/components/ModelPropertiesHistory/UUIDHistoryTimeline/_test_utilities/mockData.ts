import { IUUIDHistoryDetails } from "../UUIDHistory.types";

export function getOneFakeUUIDHistoryDetails(i: number): IUUIDHistoryDetails {
  return {
    UUID: "1234567890" + i,
    id: "1234567890" + i,
    localeShortCode: "ABC" + i,
    name: "Name" + i,
    version: "Version" + i,
  };
}

export function getFakeUUIDHistoryDetailsArray(length: number): IUUIDHistoryDetails[] {
  return Array.from({ length }, (_, i) => getOneFakeUUIDHistoryDetails(i));
}
