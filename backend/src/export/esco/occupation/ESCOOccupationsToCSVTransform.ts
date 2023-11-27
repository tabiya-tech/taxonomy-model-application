import { OccupationType } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import BaseOccupationsToCSVTransform from "./BaseOccupationsToCSVTransform";

const ESCOOccupationsToCSVTransform = (modelId: string): Readable => {
  return BaseOccupationsToCSVTransform(modelId, OccupationType.ESCO);
};

export default ESCOOccupationsToCSVTransform;
