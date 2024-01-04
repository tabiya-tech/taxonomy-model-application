import { ObjectTypes } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import BaseOccupationsToCSVTransform from "./BaseOccupationsToCSVTransform";

const ESCOOccupationsToCSVTransform = (modelId: string): Readable => {
  return BaseOccupationsToCSVTransform(modelId, ObjectTypes.ESCOOccupation);
};

export default ESCOOccupationsToCSVTransform;
