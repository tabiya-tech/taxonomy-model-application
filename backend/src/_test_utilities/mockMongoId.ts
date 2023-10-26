import mongoose from "mongoose";

export function getMockStringId(index: number): string {
  return index.toString(16).padStart(24, "0");
}

export function getMockObjectId(index: number): mongoose.Types.ObjectId {
  return mongoose.Types.ObjectId.createFromHexString(getMockStringId(index));
}
