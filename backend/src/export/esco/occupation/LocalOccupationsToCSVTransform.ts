import { OccupationType } from "esco/common/objectTypes";
import BaseOccupationsToCSVTransform from "./BaseOccupationsToCSVTransform";
import { Readable } from "node:stream";

const LocalOccupationsToCSVTransform = (modelId: string): Readable => {
  return BaseOccupationsToCSVTransform(modelId, OccupationType.LOCAL);
};

export default LocalOccupationsToCSVTransform;
