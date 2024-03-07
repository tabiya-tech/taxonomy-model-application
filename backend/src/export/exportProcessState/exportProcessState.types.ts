import mongoose from "mongoose";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";

export interface IExportProcessStateDoc {
  modelId: mongoose.Types.ObjectId;
  status: ExportProcessStateApiSpecs.Enums.Status;
  result: ExportProcessStateApiSpecs.Types.Result;
  downloadUrl: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExportProcessState extends Omit<IExportProcessStateDoc, "modelId"> {
  id: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type INewExportProcessStateSpec = Omit<IExportProcessState, "id" | "createdAt" | "updatedAt">;

export type IUpdateExportProcessStateSpec = Partial<Omit<IExportProcessStateDoc, "modelId">>;
