import { ImportIdentifiable, ObjectTypes } from "esco/common/objectTypes";
import mongoose from "mongoose";
/**
 * Describes the shared properties of all occupation types. Not how they are directly stored in the database, but how they look when seen from the other entities
 * TODO: There seems to be no link between this and the actual occupation doc type...
 */
export interface IBaseOccupationDoc extends ImportIdentifiable {
  id: string; // todo: string or ObjectId?
  UUID: string;
  modelId: mongoose.Types.ObjectId;
  preferredLabel: string;
  occupationGroupCode: string;
  code: string;
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
  isLocalized: boolean;
}

/**
 * Describes how a reference to an occupation is populated within repository functions.
 * This is not returned from the API.
 */
export interface IOccupationReferenceDoc extends Omit<IBaseOccupationDoc, "importId"> {}

/**
 * Describes how a reference to an occupation is returned from the API
 */
export type IOccupationReference = Omit<IOccupationReferenceDoc, "modelId">;
