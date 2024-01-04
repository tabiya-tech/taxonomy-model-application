import mongoose from "mongoose";
import {IOccupationDoc} from "esco/occupation/occupation.types";

export function populateEmptyLocalizedOccupation(
  target: mongoose.Document<unknown, unknown, IOccupationDoc>
) {
  // @ts-ignore
  target.localized = null;
}