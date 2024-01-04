import { ObjectTypes } from "esco/common/objectTypes";
import BaseOccupationsToCSVTransform from "./BaseOccupationsToCSVTransform";
import { Readable } from "node:stream";

const LocalOccupationsToCSVTransform = (modelId: string): Readable => {
  return BaseOccupationsToCSVTransform(modelId, ObjectTypes.LocalOccupation);
};

export default LocalOccupationsToCSVTransform;
